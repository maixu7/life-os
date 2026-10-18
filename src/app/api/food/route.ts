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
  if (!process.env.ANTHROPIC_API_KEY) return bad("AI food reading isn't switched on yet.", 501);
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

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } });
  content.push({ type: "text", text: words ? `What I ate: ${words}` : "What is in this photo, how much, and its nutrition?" });

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
