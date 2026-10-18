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

const SYSTEM = `You are a nutritionist who estimates what someone ate from a photo and/or their description.
List each separate food or drink as its own item (rice and ramen are two items). Judge the portion from the bowl/plate size, depth and any packaging you can read; the description wins over the photo if they disagree about what or how much.
Use standard nutrition tables (Japanese 食品成分表 values for Japanese foods). For instant noodles count the whole pack with its soup unless told the soup was left. Give numbers for the whole amount eaten, not per 100 g. If nothing edible is shown, return an empty list.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { user, auth, text, image } = body ?? {};
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
    return NextResponse.json(msg.parsed_output);
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
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const parts: object[] = [];
  if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  parts.push({ text: `${ask}\nGive all numbers for the whole amount eaten: kcal, and grams of protein, fat, carbs, sugar and salt equivalent.` });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA, temperature: 0.2 } }),
    });
    if (r.status === 429) return bad("Free AI limit reached for now. Try again in a minute.", 429);
    if (r.status === 400 || r.status === 403) return bad("Gemini key isn't working. Check GEMINI_API_KEY in Vercel.", 501);
    if (!r.ok) return bad("Couldn't reach the food reader. Try again.", 502);
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const meal = Meal.safeParse(JSON.parse(text || "null"));
    return meal.success ? NextResponse.json(meal.data) : bad("Couldn't read that one. Try again.", 502);
  } catch {
    return bad("Couldn't reach the food reader. Try again.", 502);
  }
}
