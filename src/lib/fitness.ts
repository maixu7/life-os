import { ACTIVE_RE, eaten } from "@/lib/body";
import { byDay, sleepHours } from "@/lib/missions";
import { moveOf, myMove } from "@/lib/moves";
import { toDay, type CustomItem, type Data, type Log } from "@/lib/store";

// Fitness and body logic: records, trends, measurements, the progressive
// overload coach, the workout streak with shields, the weekly muscle map,
// a step detector for the motion sensor and walk estimates.
// Pure functions only, so they can be tested without a browser.

const DAY = 86_400_000;
const addDays = (day: string, n: number) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + n); return toDay(d); };
const isWorkout = (l: Log) => l.kind === "workout" || (l.kind === "activity" && ACTIVE_RE.test(String(l.data.name ?? "")));
const isStudy = (l: Log) => l.kind === "focus" || (l.kind === "activity" && /study|homework/i.test(String(l.data.name ?? "")));
const studyMin = (l: Log) => Number(l.data.minutes) || 25;

// Longest run of consecutive days in a sorted day list.
export function longestRun(days: string[]): { n: number; end: string | null } {
  const s = [...new Set(days)].sort();
  let best = 0, end: string | null = null, run = 0;
  for (let i = 0; i < s.length; i++) {
    run = i > 0 && addDays(s[i - 1], 1) === s[i] ? run + 1 : 1;
    if (run > best) { best = run; end = s[i]; }
  }
  return { n: best, end };
}

// ---------- Records board ----------
export type Record_ = { id: string; icon: string; label: string; value: string; when: string | null; group: "Strength" | "Streaks" | "Days" };

export function records(d: Data): Record_[] {
  const out: Record_[] = [];
  const days = byDay(d.logs);
  // Strength: heaviest weight per exercise, most reps in a set for bodyweight moves.
  const lifts = new Map<string, { w: number; reps: number; day: string; weighted: boolean }>();
  for (const l of d.logs) {
    if (l.kind !== "workout" || !l.data.exercise) continue;
    const name = String(l.data.exercise) + (l.data.variant && l.data.variant !== "Standard" ? ` (${l.data.variant})` : "");
    const w = Number(l.data.weight) || 0, reps = Number(l.data.seconds) || Number(l.data.reps) || 0;
    const cur = lifts.get(name);
    const better = !cur || (w > 0 ? w > cur.w || (w === cur.w && reps > cur.reps) : !cur.weighted && reps > cur.reps);
    if (better) lifts.set(name, { w, reps, day: l.day, weighted: w > 0 || !!cur?.weighted });
  }
  for (const [name, x] of [...lifts].sort((a, b) => b[1].w - a[1].w || b[1].reps - a[1].reps)) {
    out.push({ id: `lift-${name}`, icon: x.w ? "🏋️" : "💪", label: name, group: "Strength",
      value: x.w ? `${x.w} kg × ${x.reps}` : `${x.reps} ${/plank|hold|sit|hang/i.test(name) ? "s" : "reps"} in one set`, when: x.day });
  }
  const streak = (icon: string, id: string, label: string, list: string[]) => {
    const r = longestRun(list);
    if (r.n) out.push({ id, icon, label, group: "Streaks", value: `${r.n} day${r.n > 1 ? "s" : ""} in a row`, when: r.end });
  };
  const all = Object.entries(days);
  streak("🔥", "s-workout", "Longest workout streak", all.filter(([, ls]) => ls.some(isWorkout)).map(([k]) => k));
  streak("📖", "s-study", "Longest study streak", all.filter(([, ls]) => ls.some(isStudy)).map(([k]) => k));
  streak("🌅", "s-wake", "Longest early-rise streak (before 7)", all.filter(([, ls]) => ls.some((l) => l.kind === "wake" && String(l.data.time ?? "99") < "07:00")).map(([k]) => k));
  streak("💧", "s-water", "Longest water-goal streak", all.filter(([, ls]) => ls.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0) >= d.profile.settings.water_goal_ml).map(([k]) => k));
  // Best single days.
  const top = (icon: string, id: string, label: string, f: (ls: Log[]) => number, fmt: (n: number) => string) => {
    let best = 0, when: string | null = null;
    for (const [day, ls] of all) { const v = f(ls); if (v > best) { best = v; when = day; } }
    if (best > 0) out.push({ id, icon, label, group: "Days", value: fmt(best), when });
  };
  // Earliest wake-up; times before 3 am are most likely a late night, not a record.
  const wakes = d.logs.filter((l) => l.kind === "wake" && /^\d\d:\d\d$/.test(String(l.data.time)) && String(l.data.time) >= "03:00")
    .sort((a, b) => String(a.data.time).localeCompare(String(b.data.time)));
  if (wakes[0]) out.push({ id: "d-wake", icon: "🌄", label: "Earliest wake-up", group: "Days", value: String(wakes[0].data.time), when: wakes[0].day });
  top("🎯", "d-study", "Most study in a day", (ls) => ls.filter(isStudy).reduce((n, l) => n + studyMin(l), 0), (n) => `${Math.floor(n / 60)} h ${n % 60} min`);
  top("👣", "d-steps", "Most steps in a day", (ls) => ls.filter((l) => l.kind === "steps").reduce((n, l) => n + (Number(l.data.steps) || 0), 0), (n) => `${n.toLocaleString()} steps`);
  top("🚶", "d-walk", "Longest walk or run", (ls) => Math.max(0, ...ls.filter((l) => l.kind === "activity" && l.data.unit === "km").map((l) => Number(l.data.amount) || 0)), (n) => `${n.toFixed(1)} km`);
  top("⚔️", "d-sets", "Most sets in a day", (ls) => ls.filter((l) => l.kind === "workout").reduce((n, l) => n + (Number(l.data.sets) || 1), 0), (n) => `${n} sets`);
  top("🏋️", "d-volume", "Most volume in a day", (ls) => ls.filter((l) => l.kind === "workout").reduce((n, l) => n + (Number(l.data.sets) || 1) * (Number(l.data.reps) || 0) * (Number(l.data.weight) || 0), 0), (n) => `${Math.round(n).toLocaleString()} kg`);
  top("✨", "d-xp", "Most XP in a day", (ls) => ls.reduce((n, l) => n + (l.xp || 0), 0), (n) => `${n} XP`);
  top("😴", "d-sleep", "Longest night's sleep", (ls) => sleepHours(ls.filter((l) => l.data.type !== "nap")), (n) => `${n.toFixed(1)} h`);
  return out;
}

// Is this set a new personal best? Heavier weight, or more reps at the same weight.
export function personalBest(logs: Log[], exercise: string, variant: string | undefined, reps: number, weight: number): string | null {
  const same = logs.filter((l) => l.kind === "workout" && l.data.exercise === exercise && (l.data.variant ?? "Standard") === (variant ?? "Standard"));
  if (!same.length) return null; // the first set is a start, not a record
  const maxW = Math.max(0, ...same.map((l) => Number(l.data.weight) || 0));
  if (weight > 0 && weight > maxW) return maxW ? `${weight} kg, your heaviest ever (was ${maxW} kg).` : `${weight} kg: your first weighted set.`;
  const atW = same.filter((l) => (Number(l.data.weight) || 0) === weight);
  const maxR = Math.max(0, ...atW.map((l) => Number(l.data.reps) || 0));
  if (atW.length && reps > maxR) return `${reps} reps${weight ? ` at ${weight} kg` : ""} (was ${maxR}). Real strength gained.`;
  return null;
}

// ---------- Trends ----------
export type Pt = { day: string; v: number };
export type Metric = "weight" | "kcal" | "protein" | "sleep" | "steps";
export const METRICS: [Metric, string, string][] = [["weight", "⚖️ Weight", "kg"], ["kcal", "🔥 Calories", "kcal"], ["protein", "🥩 Protein", "g"], ["sleep", "😴 Sleep", "h"], ["steps", "👣 Steps", "steps"]];

export function trend(d: Data, metric: Metric, days: number, now = new Date()): Pt[] {
  const from = toDay(new Date(now.getTime() - (days - 1) * DAY));
  const map = byDay(d.logs.filter((l) => l.day >= from));
  const out: Pt[] = [];
  for (const [day, ls] of Object.entries(map).sort()) {
    let v = 0;
    if (metric === "weight") v = Number([...ls].sort((a, b) => a.created_at.localeCompare(b.created_at)).filter((l) => l.kind === "body" && l.data.weight).at(-1)?.data.weight) || 0;
    else if (metric === "kcal" || metric === "protein") { const f = eaten(ls, d.items); v = Math.round(f.reduce((n, x) => n + (metric === "kcal" ? x.kcal : x.protein), 0)); }
    else if (metric === "sleep") v = +sleepHours(ls).toFixed(1);
    else v = ls.filter((l) => l.kind === "steps").reduce((n, l) => n + (Number(l.data.steps) || 0), 0);
    if (v > 0) out.push({ day, v });
  }
  // A year is shown as weekly averages so the line stays readable and light.
  return days > 120 ? weekly(out) : out;
}

export function weekly(pts: Pt[]): Pt[] {
  const m = new Map<string, number[]>();
  for (const p of pts) { const d = new Date(`${p.day}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = toDay(d); (m.get(k) ?? m.set(k, []).get(k)!).push(p.v); }
  return [...m].sort().map(([day, vs]) => ({ day, v: +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1) }));
}

// ---------- Measurements ----------
export const MEASURES: [key: string, label: string][] = [["waist", "Waist"], ["chest", "Chest"], ["arms", "Arms"], ["thigh", "Thigh"], ["hips", "Hips"], ["neck", "Neck"], ["calf", "Calf"]];
export function measureSeries(logs: Log[], key: string): Pt[] {
  return logs.filter((l) => l.kind === "body" && Number(l.data[key]) > 0).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((l) => ({ day: l.day, v: Number(l.data[key]) }));
}

// ---------- Progressive overload coach ----------
// Double progression: stay at one weight and add reps until every set reaches
// the top of the range, then add weight and drop back to the bottom.
export type Next = { sets: number; reps: number; weight?: number; why: string; tag: "first" | "reps" | "weight" | "hold" | "deload" | "harder" };
type Session = { day: string; sets: number; weight: number; reps: number };

export function sessionsOf(logs: Log[], exercise: string, variant?: string): Session[] {
  const same = logs.filter((l) => l.kind === "workout" && l.data.exercise === exercise && (l.data.variant ?? "Standard") === (variant ?? "Standard"));
  const m = new Map<string, Log[]>();
  for (const l of same) (m.get(l.day) ?? m.set(l.day, []).get(l.day)!).push(l);
  return [...m].sort().map(([day, ls]) => {
    const weight = Math.max(0, ...ls.map((l) => Number(l.data.weight) || 0));
    const top = ls.filter((l) => (Number(l.data.weight) || 0) === weight);
    const rep = (l: Log) => Number(l.data.seconds) || Number(l.data.reps) || 0;
    // Every set has to reach the target, so the weakest set at the top weight counts.
    return { day, weight, sets: ls.reduce((n, l) => n + (Number(l.data.sets) || 1), 0), reps: Math.min(...top.map(rep)) };
  });
}

export function nextSession(logs: Log[], exercise: string, type: string, variant?: string): Next | null {
  const s = sessionsOf(logs, exercise, variant);
  const last = s.at(-1);
  if (!last) return null;
  const sets = Math.min(5, Math.max(3, last.sets));
  if (type === "time") {
    const add = last.reps >= 60 ? 10 : 5;
    return { sets, reps: last.reps + add, why: `Last time you held ${last.reps} s. Add ${add} s per set.`, tag: "reps" };
  }
  const weighted = type === "weight" || type === "barbell" || last.weight > 0;
  if (!weighted) {
    const top = 20;
    if (last.reps >= top) return { sets, reps: Math.max(8, Math.round(last.reps * 0.6)), why: `You did ${last.reps} reps. That is endurance now: try a harder type (or add weight) for about ${Math.max(8, Math.round(last.reps * 0.6))} reps.`, tag: "harder" };
    const add = last.reps < 8 ? 1 : 2;
    return { sets, reps: last.reps + add, why: `Last time ${last.reps} reps a set. Beat it by ${add} on every set.`, tag: "reps" };
  }
  const lo = 8, hi = 12, step = type === "barbell" ? 2.5 : last.weight >= 20 ? 2 : 1;
  const prev = s.at(-2);
  if (last.reps >= hi) return { sets, reps: lo, weight: +(last.weight + step).toFixed(2), why: `All sets reached ${hi} reps at ${last.weight} kg. Time to go up ${step} kg and start again at ${lo}.`, tag: "weight" };
  if (last.reps < lo - 2 && prev && prev.weight === last.weight && prev.reps < lo - 2) {
    const w = Math.max(step, Math.round((last.weight * 0.9) / step) * step);
    return { sets, reps: lo, weight: w, why: `Two sessions under ${lo - 2} reps at ${last.weight} kg. Drop to ${w} kg, build clean reps, then climb again.`, tag: "deload" };
  }
  if (last.reps < lo) return { sets, reps: Math.min(lo, last.reps + 1), weight: last.weight, why: `Stay at ${last.weight} kg and aim for ${Math.min(lo, last.reps + 1)} reps on every set.`, tag: "hold" };
  return { sets, reps: last.reps + 1, weight: last.weight, why: `Same ${last.weight} kg, one more rep per set (goal: ${hi}, then add weight).`, tag: "reps" };
}

// ---------- Workout streak with shields ----------
// Every 7 workout days earn a shield (hold up to 2). A shield covers one day
// without training, so the streak survives a rest or sick day.
export const SHIELD_EVERY = 7, SHIELD_MAX = 2;
export function workoutStreak(d: Data, now = new Date()) {
  const work = new Set(d.logs.filter(isWorkout).map((l) => l.day));
  const shielded = new Set(d.items.filter((i) => i.category === "shield").map((i) => String(i.config.day)));
  const today = toDay(now), yest = addDays(today, -1);
  let cur = work.has(today) || shielded.has(today) ? today : yest, n = 0, guard = 0;
  while ((work.has(cur) || shielded.has(cur)) && guard++ < 3650) { if (work.has(cur)) n++; cur = addDays(cur, -1); }
  const earned = Math.floor(work.size / SHIELD_EVERY);
  const held = Math.max(0, Math.min(SHIELD_MAX, earned - shielded.size));
  // Yesterday was missed but the day before still carries a streak: a shield can save it.
  const before = addDays(yest, -1);
  const atRisk = !work.has(yest) && !shielded.has(yest) && (work.has(before) || shielded.has(before)) && !work.has(today);
  const best = longestRunWith([...work], shielded);
  return { n, held, earned, used: shielded.size, atRisk, yest, today, trainedToday: work.has(today), shieldedToday: shielded.has(today), best, toNext: SHIELD_EVERY - (work.size % SHIELD_EVERY) };
}
function longestRunWith(work: string[], shielded: Set<string>) {
  const s = [...new Set([...work, ...shielded])].sort();
  const w = new Set(work);
  let best = 0, run = 0;
  for (let i = 0; i < s.length; i++) {
    if (!(i > 0 && addDays(s[i - 1], 1) === s[i])) run = 0;
    if (w.has(s[i])) run++;
    best = Math.max(best, run);
  }
  return best;
}
export const shieldItem = (day: string): CustomItem => ({ id: `shield-${day}`, category: "shield", name: `Shield ${day}`, config: { day }, sort: Date.now() });

// ---------- Weekly muscle map ----------
export type Region = "chest" | "shoulders" | "biceps" | "triceps" | "forearms" | "abs" | "obliques" | "quads" | "calves" | "traps" | "lats" | "lowerback" | "glutes" | "hamstrings";
export const REGIONS: [Region, string, RegExp][] = [
  ["chest", "Chest", /chest|pec/i], ["shoulders", "Shoulders", /shoulder|delt/i], ["biceps", "Biceps", /bicep|\barms?\b/i], ["triceps", "Triceps", /tricep|\barms?\b/i],
  ["forearms", "Forearms", /forearm|grip|finger|wrist/i], ["abs", "Abs", /\babs\b|abdom|core|lower abs/i], ["obliques", "Obliques", /oblique|twist|side/i],
  ["quads", "Quads", /quad|thigh|\blegs?\b/i], ["hamstrings", "Hamstrings", /hamstring|\blegs?\b/i], ["glutes", "Glutes", /glute|\bhips?\b|\blegs?\b/i],
  ["calves", "Calves", /calf|calves|\blegs?\b/i], ["traps", "Upper back", /trap|upper back|rhomboid|rear|^back$|neck/i],
  ["lats", "Lats", /\blats?\b|back \(lats\)|^back$|wider back/i], ["lowerback", "Lower back", /lower back|spine|erector/i],
];
const FULL = /full body|whole body/i;

export function muscleWeek(d: Data, now = new Date()): Record<Region, number> {
  const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const from = toDay(mon);
  const items = d.items.filter((i) => i.category === "exercise");
  const out = Object.fromEntries(REGIONS.map(([r]) => [r, 0])) as Record<Region, number>;
  for (const l of d.logs) {
    if (l.day < from || !isWorkout(l)) continue;
    const name = String(l.data.exercise ?? l.data.name ?? "");
    const it = items.find((i) => i.name === name);
    const muscles = (it ? myMove(name, it.config) : moveOf(name))?.muscles ?? [];
    const sets = l.kind === "workout" ? Number(l.data.sets) || 1 : 1;
    for (const m of muscles) {
      for (const [r, , re] of REGIONS) if (re.test(m) || FULL.test(m)) out[r] += FULL.test(m) ? sets * 0.5 : sets;
    }
  }
  return out;
}
// A move that trains a region the hero forgot this week.
export function moveFor(r: Region) {
  const re = REGIONS.find(([x]) => x === r)![2];
  const SIMPLE: Partial<Record<Region, string>> = { chest: "Push-ups", shoulders: "Pike push-up", biceps: "Chin-up", triceps: "Dips", forearms: "Dead hang", abs: "Plank", obliques: "Side plank dips",
    quads: "Squats", hamstrings: "Glute bridge", glutes: "Glute bridge", calves: "Calf raise", traps: "Superman", lats: "Pull-ups", lowerback: "Superman" };
  const pick = SIMPLE[r];
  const m = pick ? moveOf(pick) : undefined;
  return m && m.muscles?.some((x) => re.test(x)) ? m.name : pick ?? "";
}

// ---------- Steps and walking ----------
// Peak detector on the size of the phone's acceleration. A step is a peak above
// the moving average that comes at least 280 ms after the previous one.
export function stepDetector(sensitivity = 1) {
  let avg = 9.8, last = 0, above = false, peak = 0;
  return (x: number, y: number, z: number, t: number): boolean => {
    const mag = Math.sqrt(x * x + y * y + z * z);
    avg = avg * 0.95 + mag * 0.05; // slow average = gravity + posture
    const diff = mag - avg, on = 1.2 / sensitivity, off = 0.4 / sensitivity;
    if (!above && diff > on) { above = true; peak = diff; }
    else if (above) {
      peak = Math.max(peak, diff);
      if (diff < off) { above = false; if (t - last > 280 && peak < 12) { last = t; return true; } }
    }
    return false;
  };
}
export const strideM = (heightCm: number | null) => ((heightCm ?? 170) * 0.415) / 100;
export const PACES: [key: string, label: string, kmh: number, met: number][] = [["slow", "🐢 Slow", 3.2, 2.8], ["normal", "🚶 Normal", 4.8, 3.5], ["brisk", "⚡ Brisk", 6, 4.3], ["hill", "⛰️ Uphill", 4, 6]];
export function walkEstimate(ms: number, kmh: number, met: number, kg: number, heightCm: number | null) {
  const h = ms / 3_600_000, km = h * kmh;
  return { km: +km.toFixed(2), steps: Math.round((km * 1000) / strideM(heightCm)), kcal: Math.round((met - 1) * kg * h) };
}
