import type { Action } from "@/lib/coach";
import { itemKind, kitOf, planMinutes, workoutHalves, type PlanRow } from "@/lib/have";
import { AREAS, dueOn, measure, targetOf, taskOf, type Area } from "@/lib/mytasks";
import { dayType, goalsOn, hm, isOffDay, sched, sleepTimes, studyFrom, toMin } from "@/lib/schedule";
import { autoSteps, workoutLabel } from "@/lib/dayplan";
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
export type RoutineItem = { id: string; time: string; end?: string; label: string; kind: StepKind; ml?: number; days?: number[]; note?: string; href?: string; auto?: boolean; moves?: PlanRow[]; /** Glued to the start of this step (a warm-up before training). */ before?: string; /** When you last changed it: the newest change wins a clash. */ at?: number };
/** Your changes to any step (settings.routineEdit): its times, its name, or hidden. */
export type StepEdit = { time?: string; end?: string; label?: string; off?: boolean; ml?: number; /** When you saved it: the newest change wins a clash. */ at?: number };

export type Step = {
  id: string; time: string; label: string; icon: string; kind: StepKind; fixed: boolean; ml?: number;
  /** Where it happens in the app. */ action: Action; href?: string;
  state: "done" | "missed" | "due" | "later"; at?: string; diff?: number; // minutes late (+) or early (−)
  end?: string; note?: string; auto?: boolean; own?: boolean; logId?: string; doneEnd?: string;
  /** Planned minutes (start→end) and how long it really took, when both are known. */
  planLen?: number; doneLen?: number;
  /** Water: how much you really drank. */ gotMl?: number;
  /** Finished early (−) or late (+) against the planned end. */ endDiff?: number;
  /** Work: planned break minutes inside it (planLen and doneLen already leave them out). */ brk?: number;
  /** Start/Finish work rows: the whole work step they belong to. */ whole?: Step;
  /** Workout steps: the moves of today's plan in this part, and how many are finished. */
  moves?: (PlanRow & { done: number })[]; progress?: { done: number; total: number };
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
  if (!Number.isNaN(ex)) {
    // Exercise is part 2 of today's workout (part 1 is in the morning).
    const { pm } = workoutHalves(d.pantry, date, off);
    out.push({ id: "b-exercise", time: hm(ex), end: hm(ex + planMinutes(pm)), label: workoutLabel(2, pm), kind: "workout", moves: pm, href: "/train" });
  }
  out.push({ id: "b-sleep", time: night.sleep, label: "Go to sleep", kind: "sleep" });
  return out;
}

// Every log that could count as doing a step (one log is later given to one step only).
function matches(it: RoutineItem, logs: Log[], all: Log[], day: string): Log[] {
  const plan = toMin(it.time);
  const near = (l: Log, before = 120, after = 240) => { const m = mins(l.created_at); return m >= plan - before && m <= plan + after; };
  switch (it.kind) {
    case "wake": return logs.filter((l) => l.kind === "wake").slice(0, 1);
    case "sleep": {
      // Bedtime after midnight belongs to the night before: look at the next morning too.
      const next = toDay(new Date(new Date(`${day}T12:00:00`).getTime() + 86_400_000));
      return all.filter((l) => l.kind === "sleep" && l.data.type !== "nap" && (l.day === day ? mins(l.created_at) >= 18 * 60 : l.day === next && mins(l.created_at) < 5 * 60)).slice(0, 1);
    }
    case "meal": {
      const named = logs.filter((l) => l.kind === "activity" && norm(String(l.data.name)) === norm(it.label));
      return named.length ? named : logs.filter((l) => l.kind === "activity" && Array.isArray(l.data.foods) && near(l, 90, 180));
    }
    case "water": return logs.filter((l) => ["water", "drink", "milk"].includes(l.kind) && near(l, 30, 120) && (!it.ml || Number(l.data.ml) >= it.ml * 0.8));
    case "work": return logs.filter((l) => l.kind === "activity" && /work|office|school|college|job/i.test(String(l.data.name)) && near(l, 60, 180));
    case "study": return logs.filter((l) => isStudy(l) && near(l, 60, 240));
    case "code": return logs.filter((l) => (l.kind === "coding" || (l.kind === "activity" && /cod(e|ing)|program/i.test(String(l.data.name)))) && near(l, 120, 300));
    case "read": return logs.filter((l) => l.kind === "media" && l.data.mode !== "watch" && near(l, 120, 240));
    case "workout": return it.moves?.length ? [] : logs.filter((l) => l.kind === "workout" && near(l, 120, 360));
    default: return logs.filter((l) => norm(String(l.data.name ?? "")) === norm(it.label));
  }
}

/** Sets done today for each move of a workout part; the part is done when every move is. */
function workoutProgress(moves: PlanRow[], logs: Log[]) {
  const sets = (name: string) => logs.filter((l) => l.kind === "workout" && String(l.data.exercise).toLowerCase() === name.toLowerCase());
  const rows = moves.map((m) => ({ ...m, done: sets(m.name).reduce((n, l) => n + (Number(l.data.sets) || 1), 0) }));
  const full = rows.filter((r) => r.done >= r.sets).length;
  const last = full === rows.length && rows.length ? moves.flatMap((m) => sets(m.name)).map((l) => l.created_at).sort().pop() : undefined;
  return { rows, progress: { done: full, total: rows.length }, at: last };
}

/** How long a logged step took, in minutes (from "I did it: from … to …"). */
function lenOf(l?: Log) {
  if (!l) return undefined;
  const m = l.data.minutes;
  if (typeof m === "number" && l.data.start && l.data.end) return m;
  if (l.data.start && l.data.end) return Math.round((new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 60_000);
  return undefined;
}

// How long after its time a step still counts as "due" before it's ✗.
const GRACE: Record<StepKind, number> = { wake: 120, sleep: 180, meal: 120, water: 90, work: 90, study: 180, code: 180, read: 180, workout: 240, step: 90 };

// Fits the day together so nothing overlaps. Fixed: wake, work, meals, sleep,
// the bedtime routine and your own steps. A step whose time you changed keeps
// it (the newest change wins), and the steps before and after it move to fit.
function reflow(items: (RoutineItem & { mine?: boolean })[], edits: Record<string, StepEdit>, d: Data, date: Date, hold = new Set<string>()) {
  const s = sched(d.profile.settings.schedule);
  const W = toMin(isOffDay(dayType(s, date)) ? s.weekendWake : s.wake);
  const rel = (t: string) => (toMin(t) - W + 1440) % 1440; // minutes since waking (bedtime after midnight stays last)
  const back = (m: number) => hm((m + W) % 1440);
  const len = (it: RoutineItem) => (it.end ? (toMin(it.end) - toMin(it.time) + 1440) % 1440 : 0);
  // Never moved: wake, work, meals, sleep, and what you already did (at its real time).
  // The bedtime routine is counted back from bedtime: it only ever moves earlier.
  const BED = ["a-shower", "a-prep", "a-phone", "a-toilet-pm", "a-sitz-pm", "a-brush-pm", "a-journal"];
  const fixed = (it: RoutineItem & { mine?: boolean }) => hold.has(it.id) || ["b-wake", "b-work", "b-breakfast", "b-lunch", "b-dinner", "b-sleep", "a-listen"].includes(it.id);
  const sleep = items.find((it) => it.id === "b-sleep");
  const bed = sleep ? rel(sleep.time) : 1440;
  // Water and zero-length steps (phone away) fit alongside anything.
  // Listening on the way rides along with the commute.
  const blocks = (it: RoutineItem) => it.kind !== "water" && len(it) > 0 && it.kind !== "sleep" && it.kind !== "wake" && it.id !== "a-listen";
  const taken: [number, number][] = items.filter((it) => fixed(it) && blocks(it)).map((it) => [rel(it.time), rel(it.time) + len(it)]);
  // A warm-up moves together with its training, as one block.
  const warm = new Map<string, number>();
  items.forEach((it, i) => { if (it.before && !edits[it.id]?.time) warm.set(it.before, i); });
  // Steps you changed go first (the newest change first, so it wins), each at its time
  // or right after whatever is already there. Then the steps around them fit in:
  // a step that starts before a changed one and now runs into it moves earlier (the
  // ones before it follow), and a step after it moves later (the ones after follow).
  const order = items.map((it, i) => ({ it, i })).filter(({ it, i }) => !fixed(it) && blocks(it) && ![...warm.values()].includes(i));
  // Your own steps and tasks count as changed by you (when you saved them).
  const pinned = (it: RoutineItem & { mine?: boolean }) => (edits[it.id]?.time ? edits[it.id].at ?? 1 : it.mine ? it.at ?? 1 : 0);
  const solid = [...taken]; // wake, work, meals, bedtime, your own steps
  const drop = new Set<number>();
  const free = (t: number, n: number) => t >= 0 && t + n <= bed && !taken.some(([a, b]) => t < b && t + n > a);
  const size = (it: RoutineItem) => { const wi = warm.get(it.id); return { wi, w: wi != null ? len(items[wi]) + 1 : 0 }; };
  const later = ({ it, i }: { it: RoutineItem; i: number }) => {
    const { wi, w } = size(it);
    const n = len(it) + w, want = rel(it.time) - w;
    let t = want;
    for (let guard = 0; guard < 80; guard++) {
      const hit = taken.find(([a, b]) => t < b && t + n > a);
      if (!hit) break;
      t = hit[1] + 2;
    }
    // No room before bed: take the nearest free gap earlier in the day, or leave it out today.
    if (t + n > bed) {
      t = -1;
      for (const [, b] of [...taken].sort((x, y) => y[1] - x[1])) if (b + 2 < want && free(b + 2, n)) { t = b + 2; break; }
      // Study and exercise from your schedule never drop out: they shrink into the biggest gap left.
      if (t < 0 && it.id.startsWith("b-")) {
        const busy: [number, number][] = [];
        for (const [a, b] of [...taken].sort((x, y) => x[0] - y[0])) { const last = busy[busy.length - 1]; if (last && a <= last[1]) last[1] = Math.max(last[1], b); else busy.push([a, b]); }
        // The free gap nearest its own time that still fits 20 minutes.
        let best: [number, number] = [0, 0];
        for (let k = 0; k < busy.length; k++) {
          const a = busy[k][1] + 2, b = Math.min(bed, busy[k + 1]?.[0] ?? bed) - 2;
          if (b - a >= 20 + w && (best[1] - best[0] < 20 + w || Math.abs(a - want) < Math.abs(best[0] - want))) best = [a, b];
        }
        if (best[1] - best[0] >= 20 + w) { const m = Math.min(n, best[1] - best[0]); taken.push([best[0], best[0] + m]); place(i, wi, best[0], w, m - w); return; }
      }
      if (t < 0) { drop.add(i); if (wi != null) drop.add(wi); return; }
    }
    taken.push([t, t + n]);
    place(i, wi, t, w, len(it));
  };
  // Moves a step earlier so it ends before what it runs into (the ones before it are
  // already fitted the same way), but never past the fixed step before it: then it
  // goes after instead. Study and exercise from your schedule get shorter that day.
  const earlier = (x: { it: RoutineItem; i: number }) => {
    const { wi, w } = size(x.it);
    const n = len(x.it) + w;
    let base = rel(x.it.time) - w;
    for (let guard = 0; guard < 80; guard++) { const h = taken.find(([a, b]) => a <= base && base < b); if (!h) break; base = h[1] + 2; }
    const floor = Math.max(0, ...solid.filter(([, b]) => b <= base).map(([, b]) => b + 2));
    const busy: [number, number][] = [];
    for (const [a, b] of [...taken].sort((p, q) => p[0] - q[0])) { const last = busy[busy.length - 1]; if (last && a <= last[1] + 2) last[1] = Math.max(last[1], b); else busy.push([a, b]); }
    const gaps: [number, number][] = [];
    let from = 0;
    for (const [a, b] of busy) { if (a - 2 > from) gaps.push([from, a - 2]); from = Math.max(from, b + 2); }
    if (bed > from) gaps.push([from, bed]);
    for (const [g0, g1] of gaps.filter(([g0, g1]) => g0 <= base && g1 > floor).reverse()) {
      const t = Math.min(base, g1 - n);
      if (t >= g0 && t >= floor) { taken.push([t, t + n]); place(x.i, wi, t, w, len(x.it)); return; }
    }
    const here = gaps.find(([g0, g1]) => g0 <= base && base < g1);
    if (x.it.id.startsWith("b-") && here && here[1] - Math.max(here[0], floor) >= 20 + w) {
      const t = Math.max(here[0], floor), m = Math.min(n, here[1] - t);
      taken.push([t, t + m]); place(x.i, wi, t, w, m - w); return;
    }
    later(x);
  };
  // Only its end runs into the next step: start a little earlier instead of jumping past it.
  const tail = (it: RoutineItem) => {
    const w = size(it).w, t = rel(it.time) - w, n = len(it) + w;
    const hit = taken.find(([a, b]) => t < b && t + n > a);
    return !!hit && hit[0] > t;
  };
  // Changed steps compare the times you gave them; the rest compare where the changed steps ended up.
  const wants: number[] = [], spans: number[] = [];
  const ahead = (list: number[], it: RoutineItem) => {
    const s0 = rel(it.time);
    return list.some((p) => p > s0 && !solid.some(([a, b]) => a >= s0 && b <= p));
  };
  const before = (it: RoutineItem) => BED.includes(it.id) || ahead(spans, it);
  // Older changes give way to newer ones the same way.
  for (const x of order.filter(({ it }) => pinned(it)).sort((a, b) => pinned(b.it) - pinned(a.it))) {
    const want = rel(x.it.time) - size(x.it).w;
    (ahead(wants, x.it) || tail(x.it) ? earlier : later)(x);
    wants.push(want);
    if (!drop.has(x.i)) spans.push(rel(items[x.i].time) - size(x.it).w);
  }
  const rest = order.filter(({ it }) => !pinned(it)).sort((a, b) => rel(a.it.time) - rel(b.it.time));
  // From the last step back: a step whose end now runs into what comes after it moves
  // earlier, and so does the one before it if that one now runs into it (the bedtime
  // routine always fits back from bedtime). Everything else then goes forward, study
  // and exercise from your schedule first, each at its time or pushed later.
  const sched1 = (x: { it: RoutineItem }) => (x.it.id.startsWith("b-") ? 0 : 1);
  const back1 = new Set<number>();
  for (const x of [...rest].reverse()) if (BED.includes(x.it.id) || (before(x.it) && tail(x.it))) { earlier(x); back1.add(x.i); }
  rest.filter((x) => !back1.has(x.i)).sort((a, b) => sched1(a) - sched1(b)).forEach((x) => (tail(x.it) ? earlier : later)(x));
  function place(i: number, wi: number | undefined, t: number, w: number, n: number) {
    if (wi != null) { const x = items[wi]; items[wi] = { ...x, time: back(t), end: x.end ? back(t + w - 1) : undefined }; }
    const it = items[i];
    items[i] = { ...it, time: back(t + w), end: it.end ? back(t + w + n) : undefined };
  }
  for (const i of [...drop].sort((a, b) => b - a)) items.splice(i, 1);
}

// A new start whose saved end is now before it (only the start was changed):
// keep the step's own length instead of stretching it round the clock.
function keepLen(it: RoutineItem, e: StepEdit) {
  const end = e.end !== undefined ? e.end : it.end;
  if (!e.time || !end || !it.end) return undefined;
  const t = toMin(e.time), back = t - toMin(end);
  if (back < 0 || back > 12 * 60) return undefined;
  return { end: hm((t + ((toMin(it.end) - toMin(it.time) + 1440) % 1440)) % 1440) };
}

/** Minutes of break inside a stretch of work: the schedule's breaks, or a 30 min lunch if none are set. */
export function breakIn(d: Data, from: number, to: number) {
  const s = sched(d.profile.settings.schedule);
  const list: [number, number][] = s.breaks?.length ? s.breaks.map((b) => [toMin(b.start), toMin(b.end)]) : s.lunch ? [[toMin(s.lunch), toMin(s.lunch) + 30]] : [];
  return list.reduce((n, [a, b]) => n + Math.max(0, Math.min(b, to) - Math.max(a, from)), 0);
}

type Planned = { items: (RoutineItem & { mine?: boolean })[]; got: Map<string, Log>; tasks: Map<string, { time: string; end?: string }> };
const planned = new WeakMap<Data, Map<string, Planned>>();

// The day fitted together: your changes, the app's steps around them, and then
// real-time tracking: what you already did sits at its real times, and the steps
// you haven't done yet move to fit around it (started work late → the evening moves too).
function plan(d: Data, day: string): Planned {
  const hit = planned.get(d)?.get(day);
  if (hit) return hit;
  const date = new Date(`${day}T12:00:00`);
  const own = (d.profile.settings.routine ?? []).filter((r) => !r.days?.length || r.days.includes(date.getDay())).map((r) => ({ ...r, mine: true }));
  const edits = d.profile.settings.routineEdit ?? {};
  // Your own tasks (＋ My task) fit in like your own steps.
  const tasks = d.items.filter((i) => i.category === "task").map((i) => ({ i, t: taskOf(i) })).filter(({ t }) => dueOn(t, date))
    .map(({ i, t }) => ({ id: `t-${i.id}`, time: t.time, end: typeof i.config.end === "string" && i.config.end ? i.config.end : undefined, label: i.name, kind: "step" as StepKind, mine: true, at: typeof i.config.at === "number" ? i.config.at : undefined }));
  // Your changes win: new times, a new name, or a step you hid (schedule steps can't be hidden).
  const raw = [...builtIn(d, date), ...autoSteps(d, date), ...own]
    .map((it) => { const e = edits[it.id]; return e ? { ...it, ...(e.time ? { time: e.time } : {}), ...(e.end !== undefined ? { end: e.end || undefined } : {}), ...(keepLen(it, e) ?? {}), ...(e.label ? { label: e.label } : {}), ...(e.ml ? { ml: e.ml, ...(it.kind === "water" && !e.label ? { label: it.label.replace(/\d+\s*ml/i, `${e.ml} ml`) } : {}) } : {}), off: !!e.off && !it.id.startsWith("b-") } : it; })
    .filter((it) => !("off" in it && it.off));
  const all = [...raw, ...tasks];
  let items = all.map((x) => ({ ...x }));
  reflow(items, edits, d, date);
  const logs = logsOn(d, day);
  // Who gets which log: a log ticked from a step belongs to that step; any other
  // log goes to the closest step it fits, and one log never counts twice.
  const ids = new Set(items.map((it) => it.id));
  const got = new Map<string, Log>(), taken = new Set<string>();
  for (const it of items) { const l = logs.find((x) => x.data.routine === it.id); if (l) { got.set(it.id, l); taken.add(l.id); } }
  const pairs: { id: string; l: Log; dist: number }[] = [];
  for (const it of items) {
    if (got.has(it.id) || it.id.startsWith("t-")) continue;
    for (const l of matches(it, logs, d.logs, day)) {
      if (taken.has(l.id) || (l.data.routine && ids.has(String(l.data.routine)))) continue;
      pairs.push({ id: it.id, l, dist: it.kind === "sleep" || it.kind === "wake" ? 0 : Math.abs(mins(l.created_at) - toMin(it.time)) });
    }
  }
  pairs.sort((a, b) => a.dist - b.dist);
  for (const p of pairs) if (!got.has(p.id) && !taken.has(p.l.id)) { got.set(p.id, p.l); taken.add(p.l.id); }
  // Real-time: a step with a real start sits where it really happened (to its real end,
  // or its planned length while it's still going), and the rest fit around it.
  const real = new Map<string, [string, string]>();
  for (const it of items) {
    const l = got.get(it.id);
    if (!l?.data.start || !it.end) continue;
    const a = mins(String(l.data.start)), b = l.data.end ? mins(String(l.data.end)) : a + ((toMin(it.end) - toMin(it.time) + 1440) % 1440);
    real.set(it.id, [hm(a), hm(b % 1440)]);
  }
  if (real.size) {
    const again = all.map((x) => (real.has(x.id) ? { ...x, time: real.get(x.id)![0], end: real.get(x.id)![1] } : { ...x }));
    reflow(again, edits, d, date, new Set(real.keys()));
    const where = new Map(again.map((x) => [x.id, x]));
    items = items.filter((x) => where.has(x.id)).map((x) => (real.has(x.id) ? x : { ...x, time: where.get(x.id)!.time, end: where.get(x.id)!.end }));
  }
  const out: Planned = { items: items.filter((x) => !x.id.startsWith("t-")), got, tasks: new Map(items.filter((x) => x.id.startsWith("t-")).map((x) => [x.id.slice(2), { time: x.time, end: x.end }])) };
  if (!planned.has(d)) planned.set(d, new Map());
  planned.get(d)!.set(day, out);
  return out;
}

/** The day's timeline, each step checked against your logs. */
export function steps(d: Data, day: string, now = new Date()): Step[] {
  const { items, got } = plan(d, day);
  const logs = logsOn(d, day);
  const isToday = day === toDay(now), past = day < toDay(now);
  const nowM = now.getHours() * 60 + now.getMinutes();
  return items.map((it) => {
    const matched = got.get(it.id);
    const log = matched?.data.routine === it.id ? matched : undefined;
    const wp = it.moves?.length ? workoutProgress(it.moves, logs) : undefined;
    const at = matched?.created_at ?? wp?.at;
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
    let planLen = it.end ? (toMin(it.end) - plan + 1440) % 1440 || undefined : undefined;
    let doneLen = lenOf(matched);
    const realEnd = doneEnd ?? (matched?.data.end ? hhmm(new Date(String(matched.data.end))) : undefined);
    // Finished early or late, against the planned end.
    const endDiff = realEnd && it.end ? ((toMin(realEnd) - toMin(it.end) + 2160) % 1440) - 720 : undefined;
    // Work time is the time there minus the breaks inside it.
    let brk: number | undefined;
    if (it.kind === "work" && it.end) {
      brk = breakIn(d, plan, toMin(it.end));
      if (planLen) planLen -= brk;
      if (doneLen != null && matched?.data.start) { const a = mins(String(matched.data.start)); doneLen -= breakIn(d, a, a + doneLen); }
    }
    return { brk, endDiff, planLen, doneLen, gotMl: it.kind === "water" ? Number(matched?.data.ml) || undefined : undefined, moves: wp?.rows, progress: wp?.progress, id: it.id, time: it.time, end: it.end, note: it.note, auto: it.auto, own: "mine" in it, label: it.label, icon: iconOf(it), kind: it.kind, fixed: it.id.startsWith("b-"), ml: it.ml, action, href, state, at, diff, logId: matched?.id, doneEnd: realEnd } as Step;
  }).flatMap((x) => (x.id === "b-work" && x.end ? workRows(x, isToday, past, nowM) : [x])).sort((a, b) => toMin(a.time) - toMin(b.time));
}

// Work shows as two steps: "Start Job" at the start time and "Finish Job" at the end
// time, each checked on its own. Both open the whole work plan.
function workRows(w: Step, isToday: boolean, past: boolean, nowM: number): Step[] {
  const endM = toMin(w.end!);
  const fin: Step["state"] = w.doneEnd ? "done" : past || (isToday && nowM > endM + GRACE.work) ? "missed" : isToday && nowM >= endM - 30 ? "due" : "later";
  const start: Step = { ...w, label: `Start ${w.label}`, end: undefined, doneEnd: undefined, planLen: undefined, doneLen: undefined, endDiff: undefined, whole: w };
  const finish: Step = { ...w, id: "b-work-end", label: `Finish ${w.label}`, time: w.end!, end: undefined, state: fin, at: w.doneEnd ? w.at : undefined, diff: w.endDiff, endDiff: undefined, whole: w };
  return [start, finish];
}

/** "on time", "5 min late", "1 h early". */
export function lateText(diff?: number) {
  if (diff == null) return "";
  const a = Math.abs(diff);
  if (a <= 5) return "on time";
  const t = a >= 60 ? `${Math.floor(a / 60)} h${a % 60 ? ` ${a % 60} min` : ""}` : `${a} min`;
  return `${t} ${diff > 0 ? "late" : "early"}`;
}

/** Start and end both count: "started on time · finished 23 min late", "inside the planned time · …". */
export function timeText(diff?: number, endDiff?: number) {
  if (endDiff == null) return diff == null ? "" : `started ${lateText(diff)}`;
  if (diff == null) return `finished ${lateText(endDiff)}`;
  if (Math.abs(diff) <= 5 && Math.abs(endDiff) <= 5) return "started and finished on time";
  const inside = diff >= -5 && endDiff <= 5;
  return `${inside ? "inside the planned time · " : ""}started ${lateText(diff)} · finished ${lateText(endDiff)}`;
}
/** Late start, late finish or too long counts as late; an early start (15+ min) as early. */
export function tone(s: Pick<Step, "diff" | "endDiff" | "planLen" | "doneLen">): "late" | "early" | "ok" {
  if ((s.diff ?? 0) > 15 || (s.endDiff ?? 0) > 15 || tooLong(s) > 0) return "late";
  return (s.diff ?? 0) < -15 ? "early" : "ok";
}

/** How the real length compares with the plan: "45 min too long", "10 min short", or "". */
export function lenText(s: Pick<Step, "planLen" | "doneLen">) {
  const over = tooLong(s);
  if (!over) return "";
  const a = Math.abs(over), t = a >= 60 ? `${Math.floor(a / 60)} h${a % 60 ? ` ${a % 60} min` : ""}` : `${a} min`;
  return over > 0 ? `${t} too long` : `${t} short`;
}
/** Minutes over (+) or under (−) the planned length, only when it's a real gap. */
export function tooLong(s: Pick<Step, "planLen" | "doneLen">) {
  if (s.planLen == null || s.doneLen == null) return 0;
  const over = s.doneLen - s.planLen;
  // A little either way is fine: 20% of the plan, at least 5 and at most 15 minutes.
  const ok = Math.min(15, Math.max(5, s.planLen * 0.2));
  if (over > ok) return over;
  if (s.planLen >= 10 && -over > ok) return over;
  return 0;
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
    for (const s of steps(d, day, now)) { if (s.state === "done") { done++; if ((s.diff ?? 0) <= 15 && (s.endDiff ?? 0) <= 15 && tooLong(s) <= 0) onTime++; } else if (s.state === "missed") missed++; }
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
  const fit = plan(d, day).tasks; // where your task sits after the day is fitted together
  return d.items.filter((i) => i.category === "task").map((i) => ({ i, t: taskOf(i) })).filter(({ t }) => dueOn(t, date)).map(({ i, t }) => {
    const want = targetOf(t, d, now) ?? 1;
    const since = new Date(`${day}T${t.time}:00`).getTime();
    const got = measure(t.area, i.name, logs.filter((l) => new Date(l.created_at).getTime() >= since - 3_600_000), d, day);
    const at = fit.get(i.id);
    return { id: i.id, time: at?.time ?? t.time, end: at ? at.end : typeof i.config.end === "string" && i.config.end ? i.config.end : undefined, label: i.name, icon: AREAS[t.area].icon, area: t.area, done: got >= want, want, got };
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
    rows.push({ day, done, missed, late: s.filter((x) => (x.diff ?? 0) > 15 || (x.endDiff ?? 0) > 15 || tooLong(x) > 0).length, total: s.length + p.length + o.length });
  }
  const done = rows.reduce((a, r) => a + r.done, 0), missed = rows.reduce((a, r) => a + r.missed, 0), late = rows.reduce((a, r) => a + r.late, 0);
  const score = pathScore(done - late * 0.5, missed + late * 0.5);
  return { rows, done, missed, late, total: rows.reduce((a, r) => a + r.total, 0), score, path: pathFor(score) };
}

export const nowHM = () => hhmm(new Date());
