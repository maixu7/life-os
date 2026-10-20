import { NextResponse } from "next/server";
import { kv } from "@/lib/server/kv";
import { tick } from "@/lib/server/push";

export const runtime = "nodejs";
export const maxDuration = 60;

// Rung every few minutes by a timer (GitHub Actions). Safe to call:
// it only sends reminders that are due and not sent yet, at most once a minute.
export async function GET(req: Request) {
  // If CRON_SECRET is set on Vercel, only the timer that knows it may ring.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}` && new URL(req.url).searchParams.get("key") !== secret) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (!kv) return NextResponse.json({ error: "no db" }, { status: 503 });
  const last = (await kv.get<number>("push:lasttick")) ?? 0;
  if (Date.now() - last < 55_000) return NextResponse.json({ sent: 0, wait: true });
  await kv.set("push:lasttick", Date.now());
  return NextResponse.json({ sent: await tick() });
}
