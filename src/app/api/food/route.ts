import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { kv, login, validAuth, validUser } from "@/lib/server/kv";

export const runtime = "nodejs";
export const maxDuration = 60;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// What Claude sends back: every separate food it sees, with the amount and the
// nutrition for that amount.
const Food = z.object({
  name: z.string().describe("Short English food name, e.g. 'Cooked white rice', 'Instant ramen (with soup)'"),
  portion: z.string().describe("The amount eaten in plain words, e.g. 'large bowl (~250 g)', '1 pack (100 g dry)'"),
  grams: z.number().describe("Estimated edible weight in grams as served"),
  kcal: z.number(),
  protein: z.number().describe("grams"),
  fat: z.number().describe("grams"),
  carbs: z.number().describe("grams"),
  sugar: z.number().describe("grams"),
  salt: z.number().describe("grams of salt equivalent (食塩相当量)"),
  contents: z.string().describe("Main ingredients, comma separated"),
});
const Meal = z.object({
  foods: z.array(Food),
  note: z.string().describe("One short sentence: anything uncertain, and one tip to make this meal healthier"),
});
export type AiFood = z.infer<typeof Food>;

// "What is this thing?" for the What I have list: one product, read from its
// packaging (Japanese labels included), with nutrition per pack.
const Product = z.object({
  found: z.boolean().describe("false if no product or item can be identified"),
  name: z.string().describe("Short English name a shopper would use, e.g. 'Mini skinless sausages', 'Yakisoba noodles (boiled)', 'Peanut senbei crackers'"),
  name_ja: z.string().describe("The Japanese product name exactly as printed, e.g. '皮なしミニウインナー'; empty if none"),
  brand: z.string().describe("Brand or maker if visible, e.g. 'Topvalu Best Price'; empty if unknown"),
  kind: z.enum(["food", "fruit", "veg", "drink", "book", "equipment", "other"]),
  emoji: z.string().describe("One emoji for it"),
  qty: z.number().describe("How many units are in the pack (e.g. 12 crackers, 10 sausages, 1 bag). 1 if unclear"),
  unit: z.enum(["pcs", "pack", "bag", "box", "bottle", "can", "jar", "g", "kg", "ml", "L"]),
  grams: z.number().describe("Net weight or volume of the whole pack in g or ml (内容量); 0 if unknown"),
  per: z.string().describe("The serving the numbers below are for, e.g. '1 pack (73 g)', '1 cracker (~19 g)'"),
  kcal: z.number().describe("kcal for that serving; read the label (栄養成分表示) when visible, else standard values"),
  protein: z.number(), fat: z.number(), carbs: z.number(), salt: z.number().describe("salt equivalent g (食塩相当量)"),
  expiry: z.string().describe("Best-before or use-by date (賞味期限/消費期限) as YYYY-MM-DD if printed, else empty. '26.11.11' means 2026-11-11"),
  storage: z.string().describe("Storage note in English, e.g. 'Keep refrigerated (10°C or below)'; empty if none"),
  allergens: z.string().describe("Allergens printed (卵, 乳, 小麦, 落花生, えび, かに, そば…) in English, comma separated; empty if none"),
  note: z.string().describe("One short helpful sentence: what it is and how to eat it"),
});
const PRODUCT_SYSTEM = `You identify one product from a photo for a home inventory app used in Japan.
Read the packaging text carefully, including Japanese (katakana, kanji), the nutrition label (栄養成分表示, often per 100 g or per pack), the net amount (内容量, e.g. 73g, 12枚入), and printed dates (賞味期限 26.11.11 = 2026-11-11).
Supermarket private brands (Topvalu トップバリュ, Best Price ベストプライス, Seven Premium, Famima, Lawson) are common.
Give nutrition for the serving you describe in "per"; if the label is per 100 g, convert to the whole pack or to one piece and say which.
Write the English name simply. kind: packaged or cooked food = food, fresh fruit = fruit, fresh vegetables = veg, drinks = drink.
If it is not food (book, dumbbell, etc.) still name it and set kind, with nutrition 0.`;

const SYSTEM = `You are a nutritionist who estimates what someone ate from a photo and/or their description.
Write every name, portion, ingredient and note in English, even if the food or packaging is Japanese.
List each separate food or drink as its own item (rice and ramen are two items).
Portions: the photo shows what the person is eating, so count everything served in each bowl or plate, even if it is spread out or partly eaten. Judge size from the bowl and the chopsticks/spoon. Do not underestimate: rice filling a large bowl is usually 200-300 g cooked. Packaged foods such as instant noodles count as one whole pack with its soup unless the description says otherwise. The description wins over the photo if they disagree about what or how much.
Numbers: use standard tables (Japanese 食品成分表 values for Japanese foods), for the whole amount eaten, not per 100 g. "sugar" means only sugars (糖類), not total carbohydrate (糖質): plain rice and noodles have almost no sugar (under 1 g per serving). "salt" is salt equivalent (食塩相当量).
If nothing edible is shown, return an empty list.`;

// Small fixes for common model slips: sugar above carbs, negative or silly decimals.
const tidy = (m: z.infer<typeof Meal>) => ({
  ...m,
  foods: m.foods.map((f) => {
    const r = (x: number) => Math.max(0, Math.round(x * 10) / 10);
    return { ...f, kcal: Math.max(0, Math.round(f.kcal)), protein: r(f.protein), fat: r(f.fat), carbs: r(f.carbs), sugar: r(Math.min(f.sugar, f.carbs)), salt: r(f.salt) };
  }),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { user, auth, text, image, mode } = body ?? {};
  if (!validUser(user) || !validAuth(auth)) return bad("Invalid request.");
  const gemini = process.env.GEMINI_API_KEY;
  if (!gemini && !process.env.ANTHROPIC_API_KEY) return bad("AI food reading isn't switched on yet.", 501);
  const words = typeof text === "string" ? text.slice(0, 500).trim() : "";
  const m = typeof image === "string" ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image) : null;
  if (!words && !m) return bad("Send a photo or say what you ate.");
  if (m && m[2].length > 3_000_000) return bad("Photo too big.");

  const res = await login(user, auth);
  if ("error" in res) return bad(res.error, res.status);
  // A daily cap per account keeps the API bill small.
  const key = `foodai:${user}:${new Date().toISOString().slice(0, 10)}`;
  const used = (await kv!.get<number>(key)) ?? 0;
  if (used >= 80) return bad("That's today's limit of food scans. Type the numbers or try tomorrow.", 429);
  await kv!.set(key, used + 1);

  if (mode === "book") {
    const ask = `What book is this?${words ? ` Hint from me: ${words}` : ""}`;
    return gemini ? bookWithGemini(gemini, ask, m ? { mime: m[1], data: m[2] } : null) : bookWithClaude(ask, m ? { mime: m[1], data: m[2] } : null);
  }
  if (mode === "product") {
    const ask = `What product is this?${words ? ` Hint from me: ${words}` : ""}`;
    return gemini ? productWithGemini(gemini, ask, m ? { mime: m[1], data: m[2] } : null) : productWithClaude(ask, m ? { mime: m[1], data: m[2] } : null);
  }
  const ask = words ? `What I ate: ${words}` : "What is in this photo, how much, and its nutrition?";
  if (gemini) return readWithGemini(gemini, ask, m ? { mime: m[1], data: m[2] } : null);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } });
  content.push({ type: "text", text: ask });

  try {
    const client = new Anthropic();
    const msg = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: betaZodOutputFormat(Meal) },
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
    if (msg.stop_reason === "refusal") return bad("Couldn't read that one. Type what you ate.", 422);
    if (!msg.parsed_output) return bad("Couldn't read that one. Try again.", 502);
    return NextResponse.json(tidy(msg.parsed_output));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return bad("Busy right now. Try again in a minute.", 429);
    if (e instanceof Anthropic.AuthenticationError) return bad("AI key is wrong. Check ANTHROPIC_API_KEY in Vercel.", 501);
    return bad("Couldn't reach the food reader. Try again.", 502);
  }
}

// Google Gemini (free key from aistudio.google.com), used when GEMINI_API_KEY is set.
const num = { type: "NUMBER" }, str = { type: "STRING" };
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    foods: { type: "ARRAY", items: { type: "OBJECT", properties: { name: str, portion: str, grams: num, kcal: num, protein: num, fat: num, carbs: num, sugar: num, salt: num, contents: str }, required: ["name", "portion", "grams", "kcal", "protein", "fat", "carbs", "sugar", "salt", "contents"] } },
    note: str,
  },
  required: ["foods", "note"],
};
async function readWithGemini(key: string, ask: string, img: { mime: string; data: string } | null) {
  // Google renames models now and then; try the newest names in turn.
  const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"].filter(Boolean) as string[];
  const parts: object[] = [];
  if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  parts.push({ text: `${ask}\nAnswer in English. Give all numbers for the whole amount eaten: kcal, and grams of protein, fat, carbs, sugar and salt equivalent.` });
  let why = "";
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key.trim() },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA, temperature: 0.2 } }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        // Google's own message (never contains the key), so the app can say what went wrong.
        why = `Gemini ${r.status}: ${String(j?.error?.message ?? r.statusText).slice(0, 160)}`;
        // Not found, or this model's free daily limit is used up: each model has its own limit.
        if (r.status === 404 || r.status === 429) continue;
        return bad(why, 502);
      }
      const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      const meal = Meal.safeParse(JSON.parse(text || "null"));
      if (meal.success) return NextResponse.json(tidy(meal.data));
      why = `Gemini answer wasn't readable (${j?.candidates?.[0]?.finishReason ?? "empty"})`;
    } catch (e) {
      why = `Gemini: ${e instanceof Error ? e.message.slice(0, 120) : "network error"}`;
    }
  }
  return bad(why.includes(" 429") ? "Today's free photo scans are used up. Type the meal instead (it's free), or try tomorrow." : why || "Couldn't reach the food reader.", why.includes(" 429") ? 429 : 502);
}

// ---------- Product reading (What I have) ----------
async function productWithClaude(ask: string, img: { mime: string; data: string } | null) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (img) content.push({ type: "image", source: { type: "base64", media_type: img.mime as "image/jpeg", data: img.data } });
  content.push({ type: "text", text: ask });
  try {
    const client = new Anthropic();
    const msg = await client.beta.messages.parse({
      model: "claude-opus-5-5", max_tokens: 2000, system: PRODUCT_SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: betaZodOutputFormat(Product) },
      fallbacks: "default", betas: ["server-side-fallback-2026-07-01"],
    });
    if (!msg.parsed_output) return bad("Couldn't read that one. Try a closer photo of the front or the label.", 502);
    return NextResponse.json(msg.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return bad("Busy right now. Try again in a minute.", 429);
    return bad("Couldn't reach the product reader. Try again.", 502);
  }
}

const PRODUCT_SCHEMA = {
  type: "OBJECT",
  properties: {
    found: { type: "BOOLEAN" }, name: str, name_ja: str, brand: str,
    kind: { type: "STRING", enum: ["food", "fruit", "veg", "drink", "book", "equipment", "other"] }, emoji: str,
    qty: num, unit: { type: "STRING", enum: ["pcs", "pack", "bag", "box", "bottle", "can", "jar", "g", "kg", "ml", "L"] },
    grams: num, per: str, kcal: num, protein: num, fat: num, carbs: num, salt: num, expiry: str, storage: str, allergens: str, note: str,
  },
  required: ["found", "name", "name_ja", "brand", "kind", "emoji", "qty", "unit", "grams", "per", "kcal", "protein", "fat", "carbs", "salt", "expiry", "storage", "allergens", "note"],
};
async function productWithGemini(key: string, ask: string, img: { mime: string; data: string } | null) {
  const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"].filter(Boolean) as string[];
  const parts: object[] = [];
  if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  parts.push({ text: ask });
  let why = "";
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key.trim() },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: PRODUCT_SYSTEM }] }, contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: PRODUCT_SCHEMA, temperature: 0.1 } }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        why = `Gemini ${r.status}: ${String(j?.error?.message ?? r.statusText).slice(0, 160)}`;
        if (r.status === 404 || r.status === 429) continue;
        return bad(why, 502);
      }
      const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      const out = Product.safeParse(JSON.parse(text || "null"));
      if (out.success) return NextResponse.json(out.data);
      why = "Gemini answer wasn't readable";
    } catch (e) {
      why = `Gemini: ${e instanceof Error ? e.message.slice(0, 120) : "network error"}`;
    }
  }
  return bad(why.includes(" 429") ? "Today's free photo scans are used up. Type the name instead, or try tomorrow." : why || "Couldn't reach the product reader.", why.includes(" 429") ? 429 : 502);
}

// ---------- Book cover reading (Library) ----------
const Book = z.object({
  found: z.boolean().describe("false if no book, manga or textbook can be identified"),
  title: z.string().describe("The title as a reader would write it; for Japanese books keep the Japanese title and add the English one in brackets if well known"),
  author: z.string().describe("Author(s) as printed, comma separated; empty if unknown"),
  pages: z.number().describe("Page count of this edition if printed or well known; 0 if unknown"),
  kind: z.enum(["book", "manga", "textbook", "comic", "other"]),
  note: z.string().describe("One short sentence about the book; empty if unknown"),
});
const BOOK_SYSTEM = `You identify a book from a photo of its cover (or spine, or back) for a reading tracker used in Japan.
Read the printed title and author carefully, including Japanese. Textbooks, exam prep books (JLPT, EJU, 赤本) and manga volumes are common; include the volume number in the title (e.g. "ONE PIECE 1").
Give the page count only if you know it for this edition or it is printed; otherwise 0.`;
const BOOK_SCHEMA = {
  type: "OBJECT",
  properties: { found: { type: "BOOLEAN" }, title: str, author: str, pages: num, kind: { type: "STRING", enum: ["book", "manga", "textbook", "comic", "other"] }, note: str },
  required: ["found", "title", "author", "pages", "kind", "note"],
};
async function bookWithClaude(ask: string, img: { mime: string; data: string } | null) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (img) content.push({ type: "image", source: { type: "base64", media_type: img.mime as "image/jpeg", data: img.data } });
  content.push({ type: "text", text: ask });
  try {
    const client = new Anthropic();
    const msg = await client.beta.messages.parse({
      model: "claude-opus-5-5", max_tokens: 1000, system: BOOK_SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: betaZodOutputFormat(Book) },
      fallbacks: "default", betas: ["server-side-fallback-2026-07-01"],
    });
    if (!msg.parsed_output) return bad("Couldn't read that cover. Try a straight, closer photo.", 502);
    return NextResponse.json(msg.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return bad("Busy right now. Try again in a minute.", 429);
    return bad("Couldn't reach the book reader. Try again.", 502);
  }
}
async function bookWithGemini(key: string, ask: string, img: { mime: string; data: string } | null) {
  const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"].filter(Boolean) as string[];
  const parts: object[] = [];
  if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  parts.push({ text: ask });
  let why = "";
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key.trim() },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: BOOK_SYSTEM }] }, contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: BOOK_SCHEMA, temperature: 0.1 } }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        why = `Gemini ${r.status}: ${String(j?.error?.message ?? r.statusText).slice(0, 160)}`;
        if (r.status === 404 || r.status === 429) continue;
        return bad(why, 502);
      }
      const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      const out = Book.safeParse(JSON.parse(text || "null"));
      if (out.success) return NextResponse.json(out.data);
      why = "Gemini answer wasn't readable";
    } catch (e) {
      why = `Gemini: ${e instanceof Error ? e.message.slice(0, 120) : "network error"}`;
    }
  }
  return bad(why.includes(" 429") ? "Today's free photo scans are used up. Type the title instead, or try tomorrow." : why || "Couldn't reach the book reader.", why.includes(" 429") ? 429 : 502);
}
