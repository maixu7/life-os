import { mondayOf, studyMins } from "@/lib/hub";
import { streak } from "@/lib/missions";
import { toDay, type Data } from "@/lib/store";

// Accountability buddy and study duel without a server: you share a short
// code with your streak and study minutes, and paste your friend's code to
// compare. Nothing else (no records, no names of foods…) is in the code.

export type BuddyCard = { n: string; s: number; w: number; t: number; l: number; d: string; wk: string };
const PREFIX = "LOS1-";

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function myCard(d: Data, now = new Date()): BuddyCard {
  const wk = mondayOf(now), day = toDay(now);
  const week = d.logs.filter((l) => l.day >= wk && l.day <= day);
  return {
    n: (d.profile.display_name || "Hero").slice(0, 20), s: streak(d), w: studyMins(week), t: studyMins(week.filter((l) => l.day === day)),
    l: Math.floor(d.profile.xp / 100) + 1, d: day, wk,
  };
}
export const encodeCard = (c: BuddyCard) => PREFIX + b64(JSON.stringify([c.n, c.s, c.w, c.t, c.l, c.d, c.wk]));
export function decodeCard(code: string): BuddyCard | null {
  const m = code.trim().match(/LOS1-([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const [n, s, w, t, l, d, wk] = JSON.parse(unb64(m[1]));
    if (typeof n !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return null;
    return { n: n.slice(0, 20), s: Number(s) || 0, w: Number(w) || 0, t: Number(t) || 0, l: Number(l) || 1, d: String(d), wk: String(wk) };
  } catch { return null; }
}
// A message to send in LINE / WhatsApp with the code inside.
export const shareText = (c: BuddyCard) =>
  `⚔️ ${c.n} on Life OS: 🔥 ${c.s}-day streak · 📖 ${c.w} min study this week (Lv ${c.l}). Paste my code in your Buddy screen to compare: ${encodeCard(c)}`;

export function duel(me: BuddyCard, them: BuddyCard) {
  const sameWeek = me.wk === them.wk;
  const diff = me.w - them.w;
  return {
    sameWeek, diff,
    lead: !sameWeek ? "Their code is from another week. Ask for a fresh one." : diff > 0 ? `You lead by ${diff} min. Keep pushing!` : diff < 0 ? `${them.n} leads by ${-diff} min. One focus session closes the gap.` : "Dead even. Next session decides it!",
    streak: me.s === them.s ? "Same streak." : me.s > them.s ? `Your streak is ${me.s - them.s} days longer.` : `${them.n}'s streak is ${them.s - me.s} days longer.`,
  };
}
