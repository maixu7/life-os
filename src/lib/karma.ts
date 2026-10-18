import { hoursBetween } from "@/lib/describe";
import { guessMedia, MEDIA, mediaPoints, type MediaType } from "@/lib/media";
import { dailyMissions } from "@/lib/missions";
import { BAD_OPTION, REWARD_OPTION } from "@/lib/slots";
import { checkinKarma, EXTRA_KARMA } from "@/lib/tools";
import type { Data, Log } from "@/lib/store";
import { toDay } from "@/lib/store";
import { judge } from "@/lib/tasks";

// Angel vs Devil. Every record is a good deed, a bad deed, or neutral.
// Treats bought with gold in the reward shop are earned, so they never count as bad.
const DEVIL = /anime|manga|movie|netflix|series|gaming|game|scroll|social|tiktok|youtube|reels|instagram|facebook|junk|skip|procrastinat|lazy/i;

export function mediaTypeOf(l: Log): MediaType {
  if (typeof l.data.type === "string" && l.data.type in MEDIA) return l.data.type as MediaType;
  return guessMedia(String(l.data.title ?? ""), l.kind === "listening" ? "listen" : "read").type;
}

export function logKarma(l: Log): number {
  switch (l.kind) {
    case "focus": return 6;
    case "workout": return 2;
    case "media": case "reading": return mediaPoints(mediaTypeOf(l), Number(l.data.minutes) || undefined);
    case "listening": return l.data.title ? mediaPoints(mediaTypeOf(l), Number(l.data.minutes) || undefined) : 2;
    case "water": case "milk": return 1;
    case "coding": return l.data.sub === "typing" ? 2 : Math.max(3, Math.round((Number(l.data.minutes) || 30) / 10));
    case "wake": return String(l.data.time ?? "12:00") < "08:00" ? 3 : 1;
    case "bonus": return 4;
    case "redeem": return 0;
    case "sleep": {
      if (!l.data.end) return 0;
      const h = hoursBetween(l.data.start, l.data.end);
      const lateStart = new Date(String(l.data.start)).getHours();
      return (h >= 7 && h <= 9.5 ? 4 : 0) + (lateStart >= 1 && lateStart < 5 ? -4 : 0);
    }
    case "activity": {
      const name = String(l.data.name ?? "");
      const opts = Array.isArray(l.data.options) ? (l.data.options as string[]) : [];
      if (opts.some((o) => REWARD_OPTION.test(o))) return 0;
      if (opts.some((o) => BAD_OPTION.test(o))) return -5;
      if (l.data.alignment === "shadow" || (l.data.alignment !== "light" && DEVIL.test(name))) return -5;
      if (l.data.alignment === "light") return 2;
      const j = judge(name);
      return j.deed === "bad" ? -5 : j.deed === "good" ? 2 : 1;
    }
    default: return checkinKarma(l) ?? EXTRA_KARMA[l.kind] ?? 0;
  }
}

export type DayDeeds = { day: string; good: number; bad: number; logs: Log[]; missed: number };

// Good and bad points for every day that has records. Missions left undone on a
// finished day count as small bad deeds; today is never judged until it is over.
export function deedsByDay(d: Data): Map<string, DayDeeds> {
  const map = new Map<string, DayDeeds>();
  for (const l of d.logs) {
    const row = map.get(l.day) ?? { day: l.day, good: 0, bad: 0, logs: [], missed: 0 };
    const k = logKarma(l);
    if (k > 0) row.good += k;
    if (k < 0) row.bad -= k;
    if (k !== 0) row.logs.push(l);
    map.set(l.day, row);
  }
  const now = toDay(new Date());
  for (const row of map.values()) {
    if (row.day >= now) continue;
    const ls = d.logs.filter((l) => l.day === row.day);
    row.missed = 6 - dailyMissions(ls, d.profile.settings).filter((m) => m.done).length;
    row.bad += row.missed;
  }
  return map;
}

export type Period = { key: string; label: string; good: number; bad: number };

export function deedPeriods(days: Map<string, DayDeeds>, by: "day" | "month" | "year"): Period[] {
  const out = new Map<string, Period>();
  for (const r of days.values()) {
    const key = by === "day" ? r.day : by === "month" ? r.day.slice(0, 7) : r.day.slice(0, 4);
    const d = new Date(`${key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key}T12:00`);
    const label = by === "day"
      ? d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : by === "month" ? d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : key;
    const p = out.get(key) ?? { key, label, good: 0, bad: 0 };
    p.good += r.good;
    p.bad += r.bad;
    out.set(key, p);
  }
  return [...out.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export const PATHS = [
  { min: 60, name: "Archangel", icon: "👼", color: "#ffe066", side: "angel" },
  { min: 30, name: "Angel", icon: "😇", color: "#fff1a8", side: "angel" },
  { min: 10, name: "Rising Angel", icon: "🕊️", color: "#7cf2ff", side: "angel" },
  { min: -10, name: "Human at the Crossroads", icon: "🧍", color: "#c0b6ff", side: "human" },
  { min: -30, name: "Fallen", icon: "🌒", color: "#b06cff", side: "devil" },
  { min: -60, name: "Demon", icon: "👿", color: "#ff6b9b", side: "devil" },
  { min: -Infinity, name: "Devil King", icon: "😈", color: "#ff3b6b", side: "devil" },
] as const;

// -100 (devil) to +100 (angel). The +20 keeps a brand-new hero near the middle.
export function pathScore(good: number, bad: number) {
  return Math.max(-100, Math.min(100, Math.round((100 * (good - bad)) / (good + bad + 20))));
}
export const pathFor = (score: number) => PATHS.find((p) => score >= p.min)!;

function windowTotals(days: Map<string, DayDeeds>, n: number) {
  const since = toDay(new Date(Date.now() - (n - 1) * 86_400_000));
  let good = 0, bad = 0;
  for (const r of days.values()) if (r.day >= since) { good += r.good; bad += r.bad; }
  return { good, bad };
}

// Each side levels up every 100 points it has ever collected.
const sideLevel = (pts: number) => ({ level: Math.floor(pts / 100) + 1, pct: pts % 100 });

// Your current path comes from the last 30 days, so changing your habits changes it.
export function karma(d: Data) {
  const days = deedsByDay(d);
  const month = windowTotals(days, 30);
  const week = windowTotals(days, 7);
  const score = pathScore(month.good, month.bad);
  const path = pathFor(score);
  let good = 0, bad = 0;
  for (const r of days.values()) { good += r.good; bad += r.bad; }
  return {
    score, ...path, days, month,
    // Where the last 7 days are heading.
    becoming: pathFor(pathScore(week.good, week.bad)),
    weekScore: pathScore(week.good, week.bad),
    total: { good, bad },
    angel: sideLevel(good),
    devil: sideLevel(bad),
  };
}

export const KARMA_LINES: Record<string, string> = {
  Archangel: "Your wings are blinding, hero. Knowledge and discipline have made you an Archangel.",
  Angel: "You walk the angel's path. Keep feeding your mind and the Archangel's wings await.",
  "Rising Angel": "Light is gathering around you. A few more good deeds and your halo appears.",
  "Human at the Crossroads": "You stand between heaven and hell. One book chapter or one focus session tips the balance.",
  Fallen: "The time-wasters are pulling you down, but you can still rise. Trade one episode for one chapter today.",
  Demon: "Horns are growing, hero. Every great redemption arc starts with a single good deed.",
  "Devil King": "The Devil King sits on your throne for now. Close the anime, open a book, and take it back.",
};
