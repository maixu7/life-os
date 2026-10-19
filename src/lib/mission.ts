import type { Action } from "@/lib/coach";
import { itemKind, kitOf } from "@/lib/have";
import { AREAS, dueOn, measure, targetOf, taskOf, type Area } from "@/lib/mytasks";
import { dayType, goalsOn, hm, isOffDay, sched, sleepTimes, studyFrom, toMin } from "@/lib/schedule";
import { autoSteps } from "@/lib/dayplan";
import { isStudy } from "@/lib/worst";
import { pathFor, pathScore } from "@/lib/karma";
import { toDay, type Data, type Log } from "@/lib/store";

// The daily mission: your schedule as a timeline (wake 5:45, bathroom 5:50,
// breakfast 7:30, water 7:45 … sleep 11 pm), plus a few missions the app
// picks from your collections and goals, plus your own tasks. Each step is
// checked against what you actually logged: ✓ on time / N min late / early,
// or ✗ when it didn't happen.

export type StepKind = "wake" | "sleep" | "meal" | "water" | "work" | "study" | "code" | "read" | "workout" | "step";
/** One timed step: your own (settings.routine), from the schedule, or added by the app (auto). */
export type RoutineItem = { id: string; time: string; end?: string; label: string; kind: StepKind; ml?: number; days?: number[]; note?: string; href?: string; auto?: boolean };
/** Your changes to any step (settings.routineEdit): its times, its name, or hidden. */
export type StepEdit = { time?: string; end?: string; label?: string; off?: boolean; ml?: number };

export type Step = {
  id: string; time: string; label: string; icon: string; kind: StepKind; fixed: boolean; ml?: number;
  /** Where it happens in the app. */ action: Action; href?: string;
  state: "done" | "missed" | "due" | "later"; at?: string; diff?: number; // minutes late (+) or early (−)
  end?: string; note?: string; auto?: boolean; own?: boolean; logId?: string; doneEnd?: string;
};
export type Pickd = { id: string; icon: string; title: string; href: string; area: Area; target: number; got: number; done: boolean; why: string };

const ICON: Record<StepKind, string> = { wake: "🌅", sleep: "🌙", meal: "🍱", water: "💧", work: "💼", study: "📖", code: "💻", read: "📚", workout: "🏋️", step: "⭐" };
// Pictures for the everyday steps the app adds.
const STEP_ICON: [RegExp, string][] = [[/sitz|bath|shower/i, "🛁"], [/toilet/i, "🚽"], [/brush/i, "🪥"], [/wash face|get ready/i, "🧼"], [/stretch|salutation|posture|warm up|cool down/i, "🧘"], [/walk/i, "🚶"], [/listen/i, "🎧"], [/shop/i, "🛒"], [/tidy|laundry|dishes/i, "🧹"], [/breath/i, "🌬️"], [/plan|prepare|pack/i, "🎒"], [/call|message/i, "📞"], [/phone|eyes|screen/i, "📵"], [/write|journal/i, "✍️"], [/snack/i, "🍎"], [/watch/i, "📺"], [/drink (?!water)/i, "🥤"]];
const iconOf = (it: RoutineItem) => (it.kind === "step" || it.kind === "meal" || it.kind === "water" ? STEP_ICON.find(([re]) => re.test(it.label))?.[1] : undefined) ?? ICON[it.kind];
const HREF: Partial<Record<StepKind, string>> = { meal: "/food", water: "/food", study: "/learn", code: "/learn", read: "/learn", workout: "/train" };
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const mins = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9぀-鿿]+/g, " ").trim();

/** Built-in steps from your schedule (they can't be removed; change their times in the schedule). */
export function builtIn(d: Data, date: Date): RoutineItem[] {
  const s = sched(d.profile.settings.schedule);
  const t = dayType(s, date), off = isOffDay(t);
  const night = sleepTimes(s, new Date(`${toDay(date)}T20:00:00`));
  const out: RoutineItem[] = [{ id: "b-wake", time: off ? s.weekendWake : s.wake, label: "Wake up", kind: "wake" }];
  if (s.breakfast) out.push({ id: "b-breakfast", time: s.breakfast, end: hm(toMin(s.breakfast) + 20), label: "Breakfast", kind: "meal" });
  if (!off && s.workStart) out.push({ id: "b-work", time: s.workStart, end: t === "half" ? s.halfEnd : s.workEnd, label: s.workPlace || "Work", kind: "work" });
  if (s.lunch) out.push({ id: "b-lunch", time: s.lunch, end: hm(toMin(s.lunch) + 30), label: "Lunch", kind: "meal" });
  if (s.dinner) out.push({ id: "b-dinner", time: s.dinner, end: hm(toMin(s.dinner) + 30), label: "Dinner", kind: "meal" });
  // Study and exercise never sit inside work hours, and not both at the same minute.
  const free = studyFrom(s, date);
  const ex = s.exercise ? Math.max(toMin(s.exercise), off ? 0 : free) : NaN;
  let st = s.studyStart ? Math.max(toMin(s.studyStart), free) : NaN;
  const stLen = s.studyEnd ? Math.max(30, toMin(s.studyEnd) - toMin(s.studyStart)) : 90;
  if (!Number.isNaN(ex) && !Number.isNaN(st) && Math.abs(st - ex) < 50) st = ex + 50;
  if (!Number.isNaN(st)) out.push({ id: "b-study", time: hm(st), end: hm(st + stLen), label: "Study", kind: "study" });
  if (!Number.isNaN(ex)) out.push({ id: "b-exercise", time: hm(ex), end: hm(ex + (off ? 60 : 45)), label: "Exercise", kind: "workout" });
  out.push({ id: "b-sleep", time: night.sleep, label: "Go to sleep", kind: "sleep" });
  return out;
}

// What counts as doing a step, and when it happened.
function didAt(it: RoutineItem, logs: Log[], all: Log[], day: string): string | undefined {
  const plan = toMin(it.time);
  const near = (l: Log, before = 120, after = 240) => { const m = mins(l.created_at); return m >= plan - before && m <= plan + after; };
  const mine = logs.find((l) => l.data.routine === it.id);
  if (mine) return mine.created_at;
  switch (it.kind) {
    case "wake": return logs.find((l) => l.kind === "wake")?.created_at;
    case "sleep": {
      // Bedtime after midnight belongs to the night before: look at the next morning too.
      const next = toDay(new Date(new Date(`${day}T12:00:00`).getTime() + 86_400_000));
      const s = all.find((l) => l.kind === "sleep" && l.data.type !== "nap" && (l.day === day ? mins(l.created_at) >= 18 * 60 : l.day === next && mins(l.created_at) < 5 * 60));
      return s?.created_at;
    }
    case "meal": {
      const named = logs.find((l) => l.kind === "activity" && norm(String(l.data.name)) === norm(it.label));
      return named?.created_at ?? logs.find((l) => l.kind === "activity" && Array.isArray(l.data.foods) && near(l, 90, 180))?.created_at;
    }
    case "water": return logs.find((l) => ["water", "drink", "milk"].includes(l.kind) && near(l, 30, 120) && (!it.ml || Number(l.data.ml) >= it.ml * 0.8))?.created_at;
    case "work": return logs.find((l) => l.kind === "activity" && /work|office|school|college|job/i.test(String(l.data.name)) && near(l, 60, 180))?.created_at;
    case "study": return logs.find((l) => isStudy(l) && near(l, 60, 240))?.created_at;
    case "code": return logs.find((l) => (l.kind === "coding" || (l.kind === "activity" && /cod(e|ing)|program/i.test(String(l.data.name)))) && near(l, 120, 300))?.created_at;
    case "read": return logs.find((l) => l.kind === "media" && l.data.mode !== "watch" && near(l, 120, 240))?.created_at;
    case "workout": return logs.find((l) => l.kind === "workout" && near(l, 120, 360))?.created_at;
    default: return logs.find((l) => norm(String(l.data.name ?? "")) === norm(it.label))?.created_at;
  }
}

// How long after its time a step still counts as "due" before it's ✗.
const GRACE: Record<StepKind, number> = { wake: 120, sleep: 180, meal: 120, water: 90, work: 90, study: 180, code: 180, read: 180, workout: 240, step: 90 };

/** The day's timeline, each step checked against your logs. */
export function steps(d: Data, day: string, now = new Date()): Step[] {
  const date = new Date(`${day}T12:00:00`);
  const own = (d.profile.settings.routine ?? []).filter((r) => !r.days?.length || r.days.includes(date.getDay())).map((r) => ({ ...r, mine: true }));
  const edits = d.profile.settings.routineEdit ?? {};
  // Your changes win: new times, a new name, or a step you hid (schedule steps can't be hidden).
  const items = [...builtIn(d, date), ...autoSteps(d, date), ...own]
    .map((it) => { const e = edits[it.id]; return e ? { ...it, ...(e.time ? { time: e.time } : {}), ...(e.end !== undefined ? { end: e.end || undefined } : {}), ...(e.label ? { label: e.label } : {}), ...(e.ml ? { ml: e.ml } : {}), off: !!e.off && !it.id.startsWith("b-") } : it; })
    .filter((it) => !("off" in it && it.off));
  // Steps the app added never sit on top of a schedule block (exercise, study, meals): they move to just after it.
  const blocks = items.filter((it) => it.id.startsWith("b-") && it.end && it.kind !== "work").map((it) => [toMin(it.time), toMin(it.end!)] as const);
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.auto || it.kind === "water" || edits[it.id]?.time) continue;
    const m = toMin(it.time), hit = blocks.find(([a, b]) => m >= a && m < b);
    if (hit) { const len = it.end ? (toMin(it.end) - m + 1440) % 1440 : 0; items[i] = { ...it, time: hm(hit[1] + 2), end: it.end ? hm(hit[1] + 2 + len) : undefined }; }
  }
  const logs = logsOn(d, day);
  const isToday = day === toDay(now), past = day < toDay(now);
  const nowM = now.getHours() * 60 + now.getMinutes();
  return items.map((it) => {
    const log = logs.find((l) => l.data.routine === it.id);
    const at = didAt(it, logs, d.logs, day);
    const plan = toMin(it.time);
    let diff: number | undefined;
    if (at) {
      let m = mins(at);
      if (it.kind === "sleep" && m < 5 * 60) m += 24 * 60; // 1 AM is 2 hours after 11 PM
      diff = m - (it.kind === "sleep" && plan < 5 * 60 ? plan + 24 * 60 : plan);
    }
    const end = plan + GRACE[it.kind];
    // Bedtime can still happen after midnight, so it's only ✗ once the day is over.
    const over = past || (isToday && it.kind !== "sleep" && nowM > end);
    const state: Step["state"] = at ? "done" : over ? "missed" : isToday && nowM >= plan - 30 ? "due" : "later";
    const href = it.href ?? HREF[it.kind];
    const action: Action = it.kind === "wake" ? { type: "wake" } : it.kind === "sleep" ? { type: "sleep" } : it.kind === "water" ? { type: "water" } : href ? { type: "href", href } : { type: "activity", name: it.label };
    const doneEnd = log?.data.end ? hhmm(new Date(String(log.data.end))) : undefined;
    return { id: it.id, time: it.time, end: it.end, note: it.note, auto: it.auto, own: "mine" in it, label: it.label, icon: iconOf(it), kind: it.kind, fixed: it.id.startsWith("b-"), ml: it.ml, action, href, state, at, diff, logId: log?.id ?? (at ? (logs.find((l) => l.created_at === at) ?? d.logs.find((l) => l.created_at === at))?.id : undefined), doneEnd };
  }).sort((a, b) => toMin(a.time) - toMin(b.time));
}

/** "on time", "5 min late", "1 h early". */
export function lateText(diff?: number) {
  if (diff == null) return "";
  const a = Math.abs(diff);
  if (a <= 5) return "on time";
  const t = a >= 60 ? `${Math.floor(a / 60)} h${a % 60 ? ` ${a % 60} min` : ""}` : `${a} min`;
  return `${t} ${diff > 0 ? "late" : "early"}`;
}

// Logs by day, built once per data version (reports look at a whole year).
const index = new WeakMap<Log[], Map<string, Log[]>>();
function logsOn(d: Data, day: string): Log[] {
  let m = index.get(d.logs);
  if (!m) { m = new Map(); for (const l of d.logs) (m.get(l.day) ?? m.set(l.day, []).get(l.day)!).push(l); index.set(d.logs, m); }
  return m.get(day) ?? [];
}

const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);

/** How well you kept your schedule over the last 7 days (0–1): missions get harder or easier with it. */
export function discipline(d: Data, now = new Date(), days = 7) {
  let done = 0, onTime = 0, missed = 0;
  for (let i = 1; i <= days; i++) {
    const day = toDay(new Date(now.getTime() - i * 86_400_000));
    if (!logsOn(d, day).length) continue;
    for (const s of steps(d, day, now)) { if (s.state === "done") { done++; if ((s.diff ?? 0) <= 15) onTime++; } else if (s.state === "missed") missed++; }
  }
  const total = done + missed;
  return { done, onTime, missed, rate: total ? (onTime + (done - onTime) * 0.5) / total : 0.7 };
}

/** 2–3 missions the app picks for the day from your collections and goals (they change daily and with how disciplined you've been). */
export function picks(d: Data, day: string, now = new Date(), rate = discipline(d, now).rate): Pickd[] {
  const date = new Date(`${day}T12:00:00`);
  const g = goalsOn(sched(d.profile.settings.schedule), date);
  const k = rate >= 0.85 ? 1.25 : rate < 0.6 ? 0.75 : 1; // doing well → a bit harder; struggling → a bit easier
  const has = (kinds: string[]) => d.pantry.some((p) => p.qty > 0 && kinds.includes(itemKind(p)));
  const kit = Object.keys(kitOf(d.pantry));
  const learn = d.items.filter((i) => i.category === "learnkit");
  const books = d.pantry.filter((p) => p.qty > 0 && itemKind(p) === "book").map((p) => p.name);
  const coding = learn.filter((i) => /cod|program/i.test(String(i.config.cat))).map((i) => i.name);
  const toBuy = d.shopping.filter((s) => s.status === "to_buy").length;
  const pool: Omit<Pickd, "got" | "done">[] = [
    { id: "p-read", icon: "📚", title: `Read ${Math.round(g.readGoal * k)} pages${books[0] ? ` of ${books[seed(day) % books.length]}` : ""}`, href: "/learn", area: "reading", target: Math.round(g.readGoal * k), why: "From your learning collection." },
    { id: "p-study", icon: "📖", title: `Study ${Math.round(g.learnGoal * k)} min`, href: "/learn", area: "study", target: Math.round(g.learnGoal * k), why: "Your daily learning goal." },
    { id: "p-water", icon: "💧", title: `Drink ${Math.round(((d.profile.settings.water_goal_ml || 2000) * k) / 100) * 100} ml`, href: "/food", area: "drink", target: Math.round((d.profile.settings.water_goal_ml || 2000) * k), why: "Water through the day keeps focus up." },
  ];
  if (coding.length || g.codeGoal) pool.push({ id: "p-code", icon: "💻", title: `Code ${Math.round((g.codeGoal || 30) * k)} min${coding[0] ? ` in ${coding[seed(day + "c") % coding.length]}` : ""}`, href: "/learn", area: "coding", target: Math.round((g.codeGoal || 30) * k), why: "From your learning collection." });
  pool.push({ id: "p-train", icon: "🏋️", title: `Train ${Math.round(9 * k)} sets${kit.length ? " with your gear" : ""}`, href: "/train", area: "workout", target: Math.round(9 * k), why: kit.length ? "From your gym collection." : "Every day, a little strength." });
  if (has(["fruit", "veg", "food"])) pool.push({ id: "p-meals", icon: "🍱", title: "Eat 3 proper meals from what you have", href: "/food", area: "meal", target: 3, why: "From your food collection." });
  if (toBuy >= 3) pool.push({ id: "p-shop", icon: "🛒", title: `Buy ${toBuy} things on your shopping list`, href: "/shop", area: "shopping", target: toBuy, why: "Your shopping list is waiting." });
  const n = rate >= 0.85 ? 3 : 2;
  const chosen: typeof pool = [];
  for (let i = 0; chosen.length < Math.min(n, pool.length); i++) { const p = pool[seed(`${day}${i}`) % pool.length]; if (!chosen.includes(p)) chosen.push(p); if (i > 40) break; }
  const logs = logsOn(d, day);
  return chosen.map((p) => { const got = measure(p.area, p.title, logs, d, day); return { ...p, got, done: got >= p.target }; });
}

/** Your own tasks due that day (from "＋ Add my own task"). */
export function ownTasks(d: Data, day: string, now = new Date()) {
  const date = new Date(`${day}T12:00:00`);
  const logs = logsOn(d, day);
  return d.items.filter((i) => i.category === "task").map((i) => ({ i, t: taskOf(i) })).filter(({ t }) => dueOn(t, date)).map(({ i, t }) => {
    const want = targetOf(t, d, now) ?? 1;
    const since = new Date(`${day}T${t.time}:00`).getTime();
    const got = measure(t.area, i.name, logs.filter((l) => new Date(l.created_at).getTime() >= since - 3_600_000), d, day);
    return { id: i.id, time: t.time, label: i.name, icon: AREAS[t.area].icon, area: t.area, done: got >= want, want, got };
  });
}

/** ✓ and ✗ for every day in a range, for the reports. */
export function missionStats(d: Data, from: string, to: string, now = new Date()) {
  const rows: { day: string; done: number; missed: number; late: number; total: number }[] = [];
  const rate = discipline(d, now).rate;
  const firstLog = d.logs.reduce((m, l) => (l.day < m ? l.day : m), to);
  for (let t = new Date(`${from > firstLog ? from : firstLog}T12:00:00`); toDay(t) <= to && toDay(t) <= toDay(now); t = new Date(t.getTime() + 86_400_000)) {
    const day = toDay(t), s = steps(d, day, now);
    const p = picks(d, day, now, rate), o = ownTasks(d, day, now);
    const done = s.filter((x) => x.state === "done").length + p.filter((x) => x.done).length + o.filter((x) => x.done).length;
    const missed = s.filter((x) => x.state === "missed").length + (day < toDay(now) ? p.filter((x) => !x.done).length + o.filter((x) => !x.done).length : 0);
    rows.push({ day, done, missed, late: s.filter((x) => (x.diff ?? 0) > 15).length, total: s.length + p.length + o.length });
  }
  const done = rows.reduce((a, r) => a + r.done, 0), missed = rows.reduce((a, r) => a + r.missed, 0), late = rows.reduce((a, r) => a + r.late, 0);
  const score = pathScore(done - late * 0.5, missed + late * 0.5);
  return { rows, done, missed, late, total: rows.reduce((a, r) => a + r.total, 0), score, path: pathFor(score) };
}

export const nowHM = () => hhmm(new Date());
