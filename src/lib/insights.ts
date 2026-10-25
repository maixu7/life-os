import { sched, sleepTimes, toMin } from "@/lib/schedule";
import { toDay, type Data, type Log } from "@/lib/store";

// Small read-outs worked out from what you logged: sleep debt, water pace,
// where the day's hours went, and the time you really manage a habit.

const DAY = 86_400_000;
const ms = (iso: unknown) => new Date(String(iso)).getTime();

// ---------- 😴 Sleep debt ----------
export type SleepNight = { day: string; hours: number | null };
/** The last 7 nights against your sleep goal: hours short in total (debt) and tonight's bedtime to win some back. */
export function sleepDebt(d: Data, now = new Date()) {
  const goal = d.profile.settings.sleep_goal_h || 8;
  const nights: SleepNight[] = [];
  for (let i = 6; i >= 0; i--) {
    // The night that ended on this morning.
    const day = toDay(new Date(now.getTime() - i * DAY));
    const end0 = new Date(`${day}T00:00:00`).getTime() - 6 * 3_600_000, end1 = new Date(`${day}T15:00:00`).getTime();
    const mins = d.logs.filter((l) => l.kind === "sleep" && l.data.start && l.data.end && ms(l.data.end) > end0 && ms(l.data.end) <= end1)
      .reduce((n, l) => n + Math.max(0, (ms(l.data.end) - ms(l.data.start)) / 60_000), 0);
    nights.push({ day, hours: mins ? Math.round((mins / 60) * 10) / 10 : null });
  }
  const known = nights.filter((n) => n.hours != null) as { day: string; hours: number }[];
  const debt = Math.max(0, Math.round(known.reduce((n, x) => n + (goal - x.hours), 0) * 10) / 10);
  const avg = known.length ? Math.round((known.reduce((n, x) => n + x.hours, 0) / known.length) * 10) / 10 : null;
  // Pay back at most an hour a night: go to bed earlier by up to 60 minutes.
  const s = sched(d.profile.settings.schedule);
  const bed = toMin(sleepTimes(s, now).sleep);
  const earlier = Math.min(60, Math.round((debt * 60) / 4 / 15) * 15);
  const tonight = earlier ? `${String(Math.floor(((bed - earlier + 1440) % 1440) / 60)).padStart(2, "0")}:${String(((bed - earlier + 1440) % 1440) % 60).padStart(2, "0")}` : null;
  return { goal, nights, known: known.length, avg, debt, earlier, tonight };
}

// ---------- 💧 Water pace ----------
/** How much water you should have had by now (spread from waking to bedtime) against what you drank. */
export function waterPace(d: Data, now = new Date()) {
  const goal = d.profile.settings.water_goal_ml || 2000;
  const day = toDay(now);
  const got = d.logs.filter((l) => l.kind === "water" && l.day === day).reduce((n, l) => n + (Number(l.data.ml) || 0), 0);
  const s = sched(d.profile.settings.schedule), t = sleepTimes(s, now);
  const wake = toMin(t.wake), bed = toMin(t.sleep);
  const span = (bed - wake + 1440) % 1440 || 960;
  const m = now.getHours() * 60 + now.getMinutes();
  const since = (m - wake + 1440) % 1440;
  // After bedtime the whole goal is due; in the hours before getting up, none yet.
  const into = since <= span ? since : (wake - m + 1440) % 1440 < 240 ? 0 : span;
  const should = Math.round((goal * into) / span / 50) * 50;
  return { goal, got, should, behind: Math.max(0, should - got), ahead: Math.max(0, got - should) };
}

// ---------- 🕐 Where the day went ----------
export type TimeCat = "sleep" | "work" | "study" | "exercise" | "food" | "fun" | "other" | "unlogged";
export const TIME_CAT: Record<TimeCat, { icon: string; label: string; color: string }> = {
  sleep: { icon: "😴", label: "Sleep", color: "#6366f1" },
  work: { icon: "💼", label: "Work", color: "#64748b" },
  study: { icon: "📖", label: "Study", color: "#22d3ee" },
  exercise: { icon: "🏋️", label: "Exercise", color: "#34d399" },
  food: { icon: "🍱", label: "Food", color: "#fbbf24" },
  fun: { icon: "🎮", label: "Fun", color: "#f43f5e" },
  other: { icon: "⭐", label: "Other", color: "#a78bfa" },
  unlogged: { icon: "❔", label: "Not logged", color: "rgba(255,255,255,.12)" },
};
function catOf(l: Log, workName: string): TimeCat | null {
  const n = String(l.data.name ?? "").toLowerCase();
  if (l.kind === "sleep") return "sleep";
  if (l.kind === "workout" || l.kind === "stretch" || l.kind === "fittest") return "exercise";
  if (["focus", "pages", "paper", "cards", "kanji", "coding", "mistake"].includes(l.kind)) return "study";
  if (l.kind === "media") return l.data.good ? "study" : "fun";
  if (l.kind === "meditate" || l.kind === "breath") return "other";
  if (l.kind === "activity") {
    if (l.data.routine === "b-work" || (workName && n === workName)) return "work";
    if (Array.isArray(l.data.foods) || /breakfast|lunch|dinner|snack|meal/.test(n)) return "food";
    if (/study|read|learn|homework|course/.test(n)) return "study";
    if (/workout|exercise|walk|run|gym|train|yoga|stretch/.test(n)) return "exercise";
    if (/anime|manga|game|youtube|movie|series|reels|tiktok/.test(n)) return "fun";
    return "other";
  }
  return null;
}
/** Minutes of the day (midnight to now, or the whole day if it's over) by kind, from records with a length. */
export function timeMap(d: Data, day: string, now = new Date()) {
  const from = new Date(`${day}T00:00:00`).getTime();
  const to = Math.min(from + DAY, now.getTime());
  const workName = (sched(d.profile.settings.schedule).workPlace || "work").toLowerCase();
  const out: Record<TimeCat, number> = { sleep: 0, work: 0, study: 0, exercise: 0, food: 0, fun: 0, other: 0, unlogged: 0 };
  // Each minute counts once (later records don't double-count an overlap).
  const taken: [number, number][] = [];
  const add = (cat: TimeCat, a: number, b: number) => {
    a = Math.max(a, from); b = Math.min(b, to);
    for (const [x, y] of taken) { if (a >= x && a < y) a = y; if (b > x && b <= y) b = x; }
    if (b <= a) return;
    taken.push([a, b]);
    out[cat] += (b - a) / 60_000;
  };
  for (const l of d.logs) {
    const cat = catOf(l, workName);
    if (!cat) continue;
    let a: number, b: number;
    if (l.data.start && l.data.end) { a = ms(l.data.start); b = ms(l.data.end); }
    else if (l.kind === "sleep" && l.data.start && !l.data.end) { a = ms(l.data.start); b = now.getTime(); }
    else {
      const mins = Number(l.data.minutes) || (cat === "food" ? 20 : 0);
      if (!mins) continue;
      b = ms(l.created_at); a = b - mins * 60_000;
      if (cat === "food" || l.kind === "workout") { a = ms(l.created_at); b = a + mins * 60_000; }
    }
    if (b <= from || a >= to) continue;
    add(cat, a, b);
  }
  const logged = Object.values(out).reduce((n, v) => n + v, 0);
  out.unlogged = Math.max(0, (to - from) / 60_000 - logged);
  for (const k of Object.keys(out) as TimeCat[]) out[k] = Math.round(out[k]);
  return { mins: out, total: Math.round((to - from) / 60_000) };
}

// ---------- 💡 The time you really do it ----------
/** From the last 30 days: the time you most often actually did this kind of thing (15-minute steps), and how many times. */
export function usualTime(d: Data, match: (l: Log) => boolean, now = new Date()) {
  const since = toDay(new Date(now.getTime() - 30 * DAY));
  const times = d.logs.filter((l) => l.day >= since && l.day < toDay(now) && match(l)).map((l) => {
    const t = new Date(String(l.data.start ?? l.created_at));
    return t.getHours() * 60 + t.getMinutes();
  });
  if (times.length < 3) return null;
  // The busiest hour, then the middle of the times inside it.
  const near = (m: number) => times.filter((x) => Math.abs(x - m) <= 45);
  let best = times[0], n = 0;
  for (const t of times) { const c = near(t).length; if (c > n) { n = c; best = t; } }
  const group = near(best).sort((a, b) => a - b);
  const mid = Math.round(group[Math.floor(group.length / 2)] / 15) * 15 % 1440;
  return { time: `${String(Math.floor(mid / 60)).padStart(2, "0")}:${String(mid % 60).padStart(2, "0")}`, times: group.length, of: times.length };
}
