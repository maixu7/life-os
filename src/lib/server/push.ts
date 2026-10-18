import "server-only";
import webpush, { type PushSubscription } from "web-push";
import { kv } from "@/lib/server/kv";

// Phone notifications that arrive while the app is closed (Web Push).
// The VAPID key pair is made once and kept in the database, so nothing has
// to be set up in Vercel.

export type PushPlan = { at: string; body: string; days?: number[] }; // at "HH:MM" in the user's time, days 0=Sun…6
export type PushDoc = { subs: PushSubscription[]; plan: PushPlan[]; tz: number; last?: number };

export async function vapid() {
  let v = await kv!.get<{ pub: string; priv: string }>("push:vapid");
  if (!v) {
    const k = webpush.generateVAPIDKeys();
    v = { pub: k.publicKey, priv: k.privateKey };
    await kv!.set("push:vapid", v);
  }
  webpush.setVapidDetails("mailto:noreply@life-os.app", v.pub, v.priv);
  return v.pub;
}

export async function users() { return (await kv!.get<string[]>("push:users")) ?? []; }

export async function savePush(user: string, doc: PushDoc) {
  await kv!.set(`push:${user}`, doc);
  const u = await users();
  if (!u.includes(user)) await kv!.set("push:users", [...u, user]);
}

// Sends to every device of one user; drops devices that unsubscribed.
export async function send(user: string, doc: PushDoc, title: string, body: string, tag = "lifeos") {
  await vapid();
  const keep: PushSubscription[] = [];
  for (const s of doc.subs) {
    try { await webpush.sendNotification(s, JSON.stringify({ title, body, tag }), { TTL: 3600 }); keep.push(s); }
    catch (e) { const c = (e as { statusCode?: number }).statusCode; if (c !== 404 && c !== 410) keep.push(s); }
  }
  if (keep.length !== doc.subs.length) await kv!.set(`push:${user}`, { ...doc, subs: keep });
  return keep.length;
}

// Everything due since the last tick (at most the last 6 hours), in each user's own time.
export async function tick(now = Date.now()) {
  let sent = 0;
  for (const user of await users()) {
    const doc = await kv!.get<PushDoc>(`push:${user}`);
    if (!doc?.subs.length) continue;
    const from = Math.max(doc.last ?? now - 10 * 60_000, now - 6 * 3600_000);
    for (const p of doc.plan) {
      const [h, m] = p.at.split(":").map(Number);
      // The reminder's moment today and yesterday, in UTC.
      for (const back of [0, 1]) {
        const local = new Date(now - doc.tz * 60_000);
        local.setUTCHours(h, m, 0, 0);
        const t = local.getTime() + doc.tz * 60_000 - back * 86400_000;
        const dow = new Date(t - doc.tz * 60_000).getUTCDay();
        if (t > from && t <= now && (!p.days?.length || p.days.includes(dow))) { await send(user, doc, "Life OS", p.body, `r-${p.at}`); sent++; }
      }
    }
    await kv!.set(`push:${user}`, { ...(await kv!.get<PushDoc>(`push:${user}`)) ?? doc, last: now });
  }
  return sent;
}
