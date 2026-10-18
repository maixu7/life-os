import { NextResponse } from "next/server";
import { kv, login, validAuth, validUser } from "@/lib/server/kv";
import { savePush, send, vapid, type PushDoc, type PushPlan } from "@/lib/server/push";

export const runtime = "nodejs";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

const okPlan = (p: unknown): p is PushPlan[] =>
  Array.isArray(p) && p.length <= 90 && p.every((x) => x && /^\d\d:\d\d$/.test(x.at) && typeof x.body === "string" && x.body.length <= 140 && (x.until === undefined || x.until === "study"));

// key: the public key to subscribe with · save: this device + the reminder list · test: send one now
export async function POST(req: Request) {
  if (!kv) return bad("Cloud sync isn't set up yet.", 503);
  const body = await req.json().catch(() => null);
  const { action, user, auth } = body ?? {};
  if (action === "key") return NextResponse.json({ key: await vapid() });
  if (!validUser(user) || !validAuth(auth)) return bad("Invalid request.");
  const res = await login(user, auth);
  if ("error" in res) return bad(res.error, res.status);
  const cur = (await kv.get<PushDoc>(`push:${user}`)) ?? { subs: [], plan: [], tz: 0 };

  if (action === "save") {
    const sub = body.sub;
    if (sub && (typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth)) return bad("Invalid request.");
    if (!okPlan(body.plan) || typeof body.tz !== "number") return bad("Invalid request.");
    const subs = sub ? [...cur.subs.filter((s) => s.endpoint !== sub.endpoint), sub].slice(-6) : cur.subs;
    await savePush(user, { ...cur, subs, plan: body.plan, tz: body.tz });
    return NextResponse.json({ devices: subs.length });
  }
  if (action === "off") {
    await savePush(user, { ...cur, subs: cur.subs.filter((s) => s.endpoint !== body.endpoint) });
    return NextResponse.json({ ok: true });
  }
  // Today's study is done: stop the study nags for today.
  if (action === "done") {
    if (typeof body.day !== "string" || !/^\d{4}-\d\d-\d\d$/.test(body.day)) return bad("Invalid request.");
    await savePush(user, { ...cur, studyDone: body.day });
    return NextResponse.json({ ok: true });
  }
  // Sent right away, e.g. when you leave a study session for another app.
  if (action === "nag") {
    const text = typeof body.text === "string" ? body.text.slice(0, 140) : "Back to studying!";
    return NextResponse.json({ devices: await send(user, cur, "⚠️ Sensei", text, "nag") });
  }
  if (action === "test") {
    const n = await send(user, cur, "Life OS ⚔️", "Notifications work! Sensei will remind you even when the app is closed.", "test");
    return n ? NextResponse.json({ devices: n }) : bad("No device is signed up yet.", 404);
  }
  return bad("Invalid request.");
}
