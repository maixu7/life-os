import { AREAS, areaOf, fitOf, type FitSettings, type Group } from "@/lib/focus";
import { FMOVES, canDoF, fmoveOf, type FMove } from "@/lib/focusmoves";
import type { PlanRow } from "@/lib/have";
import type { RoutineItem } from "@/lib/mission";
import { bodyOf, eaten, energy, metOf } from "@/lib/body";
import { dayType, hm, isOffDay, sched, sleepTimes, toMin } from "@/lib/schedule";
import { toDay, type Data, type Log } from "@/lib/store";

// Focus Area planner: finds free time in your day for the workout and builds it.
// - Never during work (and the commute), study, meals, sleep, the first hour after
//   waking, your own steps and tasks, prayer, quiet hours, your "do not disturb"
//   times and calendar busy times. No hard training 45 min after breakfast or
//   90 min after lunch, dinner or a big meal (600+ kcal), and it ends 2 hours before bed.
// - About 60 min (your setting), more on days off, shorter when the day is full
//   (split in two if needed). Missed by 15 min → it moves to the next free time today.
//   Nothing is ever carried over to tomorrow.
// - 5 min warm-up, then 70% your focus areas and 30% full body and cardio, then a
//   cool-down with stretching and breathing. Rests the muscles you trained yesterday,
//   gives a recovery day after 3 days in a row, gets lighter after poor sleep or low
//   energy, avoids painful areas, and changes volume from how much you completed.

const DAY = 86_400_000;
const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 17);
const dayOf = (date: Date, back: number) => toDay(new Date(date.getTime() - back * DAY));
const workouts = (d: Data, day: string) => d.logs.filter((l) => l.kind === "workout" && l.day === day);

/** About how many seconds one set takes ("8-12" reps, "45 s", "3 min", "30 s each"…). */
export function setSecs(reps: string) {
  const r = reps.toLowerCase();
  const each = /each/.test(r) ? 2 : 1;
  let m = /(\d+)\s*min/.exec(r);
  if (m) return +m[1] * 60;
  m = /(\d+)\s*×\s*(\d+)\s*s/.exec(r);
  if (m) return +m[1] * (+m[2] * 2);
  m = /(\d+)(?:-(\d+))?\s*s\b/.exec(r);
  if (m) return Math.round((+m[1] + +(m[2] ?? m[1])) / 2) * each;
  m = /(\d+)\s*rounds?/.exec(r);
  if (m) return +m[1] * 60;
  m = /(\d+)(?:-(\d+))?/.exec(r);
  if (m) return Math.round((+m[1] + +(m[2] ?? m[1])) / 2) * 3 * each;
  return 40;
}
export const rowMinutes = (r: PlanRow) => (r.sets * setSecs(r.reps) + Math.max(0, r.sets - 1) * (r.rest ?? 45)) / 60 + 0.5;
export const rowsMinutes = (rows: PlanRow[]) => Math.round(rows.reduce((n, r) => n + rowMinutes(r), 0));

// ---------- How ready you are today ----------
export type Ready = { factor: number; light: boolean; recovery: boolean; why: string[]; sleepH: number | null; sore: string[] };
/** Last night's sleep in hours (the night that ended today). */
export function sleptLast(d: Data, date: Date) {
  const day = toDay(date), prev = dayOf(date, 1);
  const l = [...d.logs].reverse().find((x) => x.kind === "sleep" && x.data.type !== "nap" && x.data.end && (x.day === prev || x.day === day) && toDay(new Date(String(x.data.end))) === day);
  return l ? (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 3.6e6 : null;
}
export const checkOf = (d: Data, day: string) => [...d.logs].reverse().find((l) => l.kind === "fitcheck" && l.day === day);

/** Days in a row with a workout, before this day. */
export function daysInARow(d: Data, date: Date) {
  let n = 0;
  for (let i = 1; i < 30 && workouts(d, dayOf(date, i)).some((l) => !/walk|stretch|breath|kegel/i.test(String(l.data.exercise))); i++) n++;
  return n;
}

export function readiness(d: Data, date: Date): Ready {
  const why: string[] = [];
  let factor = 1, light = false, recovery = false;
  const h = sleptLast(d, date);
  if (h != null && h < 5.5) { factor *= 0.75; light = true; why.push(`You slept ${h.toFixed(1)} h: a lighter workout today, nothing intense.`); }
  else if (h != null && h < 6.5) { factor *= 0.9; why.push(`You slept ${h.toFixed(1)} h: a little less volume.`); }
  const c = checkOf(d, toDay(date));
  const energy = Number(c?.data.energy) || 0, mood = Number(c?.data.mood) || 0;
  if (energy === 1) { recovery = true; why.push("Very low energy: an easy recovery session instead."); }
  else if (energy === 2) { factor *= 0.7; light = true; why.push("Low energy: lighter and shorter."); }
  else if (energy === 3) factor *= 0.9;
  else if (energy === 5) { factor *= 1.1; why.push("High energy: a bit more today."); }
  if (mood && mood <= 2) why.push("Low mood: even a short workout helps. Go easy.");
  const sore = Array.isArray(c?.data.sore) ? (c!.data.sore as string[]) : [];
  if (sore.length) why.push(`Sore today: ${sore.map((s) => areaOf(s)?.label ?? s).join(", ")} rested.`);
  const run = daysInARow(d, date);
  if (run >= 3) { recovery = true; why.push(`${run} training days in a row: today is an active recovery day (mobility, walking, stretching).`); }
  return { factor, light, recovery, why, sleepH: h, sore };
}

// ---------- What you ate and drank ----------
/** Sugar (g) in what was eaten and drunk on a day. */
export function sugarOn(d: Data, day: string) {
  return Math.round(eaten(d.logs.filter((l) => l.day === day), d.items).reduce((n, f) => n + (Number(f.sugar) || 0), 0));
}
/** Extra cardio for too much sugar (today or yesterday) or a calorie surplus yesterday: up to 20 min. */
export function intakeBoost(d: Data, date: Date) {
  const why: string[] = [];
  const today = toDay(date), yday = dayOf(date, 1);
  const sugar = Math.max(sugarOn(d, today), sugarOn(d, yday));
  let extra = 0;
  if (sugar >= 50) { extra += sugar >= 80 ? 15 : 10; why.push(`${sugar} g sugar ${sugarOn(d, today) >= sugar ? "today" : "yesterday"} (WHO limit 50 g, ideal 25 g): +${extra} min brisk walking to burn it off.`); }
  const e = energy(d, yday);
  if (e.intake && e.balance > 300) { const add = Math.min(20 - extra, 10); if (add > 0) { extra += add; why.push(`Yesterday you ate ${e.balance} kcal more than you burned: +${add} min cardio.`); } }
  return { extra, sugar, why };
}

// ---------- Volume ----------
/** Change in volume from how much you did in the last 14 days (auto) plus your own setting. */
export function volume(d: Data, date: Date, fit: FitSettings) {
  let auto = 0;
  if (fit.auto) {
    const days = Array.from({ length: 14 }, (_, i) => dayOf(date, i + 1));
    const trained = days.filter((x) => workouts(d, x).length).length;
    const start = d.logs.find((l) => l.kind === "workout")?.day;
    if (start && start <= days[13]) {
      const r = trained / 10; // about 5 training days a week
      auto = r >= 0.9 ? 10 : r >= 0.7 ? 0 : r >= 0.4 ? -10 : -20;
    }
  }
  return { auto, manual: fit.manual, factor: Math.max(0.5, Math.min(1.5, 1 + (auto + fit.manual) / 100)) };
}

/** Fitness level 1–3 from your last fitness test (2 when there's none). */
export function levelOf(d: Data): 1 | 2 | 3 {
  const t = [...d.logs].reverse().find((l) => l.kind === "fittest");
  if (!t) return 2;
  const p = Number(t.data.pushups) || 0, u = Number(t.data.pullups) || 0;
  return p >= 30 && u >= 8 ? 3 : p >= 10 || u >= 3 ? 2 : 1;
}

/** Muscle groups trained yesterday (rested today). */
export function trainedYesterday(d: Data, date: Date): Set<Group> {
  const out = new Set<Group>();
  for (const l of workouts(d, dayOf(date, 1))) {
    const f = fmoveOf(String(l.data.exercise));
    f?.grp.forEach((g) => g !== "none" && out.add(g));
  }
  return out;
}

// ---------- Building one session ----------
const repsFor = (r: string, goal: FitSettings["goal"]) => {
  const m = /^(\d+)-(\d+)$/.exec(r);
  if (!m) return r;
  const lo = +m[1], hi = +m[2], mid = Math.round((lo + hi) / 2);
  return goal === "strength" ? `${lo}-${mid}` : goal === "stamina" || goal === "fatloss" ? `${mid}-${hi}` : r;
};
const restFor = (rest: number, goal: FitSettings["goal"]) =>
  Math.round(rest * (goal === "strength" ? 1.4 : goal === "stamina" ? 0.5 : goal === "fatloss" ? 0.6 : 1) / 5) * 5;

export type Built = { rows: PlanRow[]; notes: string[] };
/** One session of about `minutes`, starting with a warm-up and ending with a cool-down. */
export function buildSession(d: Data, date: Date, minutes: number, opts: { light?: boolean; recovery?: boolean; key?: string; skip?: Set<string>; burn?: number } = {}): Built {
  const fit = fitOf(d.profile.settings.fit);
  const gear = new Set(fit.gear);
  const lv = levelOf(d);
  const ready = readiness(d, date);
  const pain = new Set([...fit.pain, ...ready.sore]);
  const rested = trainedYesterday(d, date);
  const day = toDay(date) + (opts.key ?? "");
  const used = new Set(opts.skip ?? []);
  const notes: string[] = [];
  const ok = (x: FMove) => canDoF(x, gear) && !used.has(x.n) && x.lv <= lv && !x.a.some((a) => pain.has(a)) && !(opts.light && x.i >= 3);
  const jitter = (x: FMove) => (seed(day + x.n) % 100) / 100;
  const row = (x: FMove, part: string, sets = x.s): PlanRow => {
    used.add(x.n);
    return { part, name: x.n, sets: Math.max(1, sets), reps: repsFor(x.r, fit.goal), rest: x.rest ? restFor(x.rest, fit.goal) : 0 };
  };
  const areas = fit.areas.length ? fit.areas : ["fullbody"];
  const warmLen = 5, coolLen = fit.goal === "flex" ? 10 : 5;

  // Warm-up: moves that loosen what you'll train.
  const warm = FMOVES.filter((x) => x.k === "warm" && ok(x)).sort((a, b) => b.a.filter((z) => areas.includes(z)).length - a.a.filter((z) => areas.includes(z)).length || jitter(a) - jitter(b));
  const rows: PlanRow[] = [];
  const jj = FMOVES.find((x) => x.n === "Jumping jacks");
  for (const x of warm) { if (rowsMinutes(rows) >= warmLen - 1) break; rows.push(row(x, "Warm-up", 1)); }
  if (jj && ok(jj) && !opts.recovery && rowsMinutes(rows) < warmLen) rows.push({ ...row(jj, "Warm-up", 1), rest: 0 });

  // Cool-down (built now, added at the end).
  const cool: PlanRow[] = [];
  const cools = FMOVES.filter((x) => x.k === "cool" && ok(x)).sort((a, b) => b.a.filter((z) => areas.includes(z)).length - a.a.filter((z) => areas.includes(z)).length || jitter(a) - jitter(b));
  for (const x of cools) { if (rowsMinutes(cool) >= coolLen - 2) break; cool.push(row(x, "Cool-down", 1)); }
  if (fit.breathe) { const b = FMOVES.find((x) => x.k === "breath" && ok(x)); if (b) cool.push({ ...row(b, "Cool-down", 1), reps: "2 min" }); }

  const mainLen = Math.max(5, minutes - rowsMinutes(rows) - rowsMinutes(cool));
  const main: PlanRow[] = [];
  if (opts.recovery) {
    // Active recovery: mobility, posture, an easy walk.
    const easy = FMOVES.filter((x) => ok(x) && x.i === 1 && (x.k === "posture" || x.a.includes("mobility") || x.n === "Brisk walk") && x.k !== "cool");
    for (const x of easy.sort((a, b) => jitter(a) - jitter(b))) { if (rowsMinutes(main) >= mainLen) break; main.push(row(x, "Recovery", Math.min(2, x.s))); }
    notes.push("Recovery day: easy moves so your muscles can grow back stronger.");
  } else {
    // 70%: your focus areas, one area at a time, the best move for each (not a muscle you trained yesterday).
    const focusPool = FMOVES.filter((x) => (!x.k || x.k === "main" || x.k === "posture" || x.k === "face" || x.k === "eye") && ok(x) && x.a.some((a) => areas.includes(a)));
    const restedNow = [...rested].filter((g) => focusPool.some((x) => x.grp.includes(g)));
    if (restedNow.length) notes.push(`Resting ${restedNow.join(", ")} today (trained yesterday).`);
    const fresh = (x: FMove) => !x.grp.some((g) => rested.has(g));
    const score = (x: FMove, area: string) => (x.a[0] === area ? 3 : 2) + (x.a.filter((a) => areas.includes(a)).length - 1) * 0.5 + jitter(x) + (x.i === 3 && !opts.light ? 0.3 : 0);
    const focusMin = mainLen * 0.7;
    const order = [...areas].sort((a, b) => seed(day + a) - seed(day + b));
    for (let round = 0; round < 4 && rowsMinutes(main) < focusMin; round++) {
      let added = false;
      for (const area of order) {
        if (rowsMinutes(main) >= focusMin) break;
        const best = focusPool.filter((x) => !used.has(x.n) && x.a.includes(area) && fresh(x)).sort((a, b) => score(b, area) - score(a, area))[0];
        if (best) { main.push(row(best, "Focus")); added = true; }
      }
      if (!added) break;
    }
    // 30%: full body and cardio.
    const full = FMOVES.filter((x) => ok(x) && (x.k === "cardio" || x.a.some((a) => ["fullbody", "strength", "power", "stamina", "fatloss"].includes(a))) && fresh(x) && x.n !== "Brisk walk" && x.n !== "Jumping jacks");
    for (const x of full.sort((a, b) => jitter(a) - jitter(b) + (a.k === "cardio" ? -0.3 : 0) - (b.k === "cardio" ? -0.3 : 0))) {
      if (rowsMinutes(main) >= mainLen) break;
      main.push(row(x, x.k === "cardio" ? "Cardio" : "Full body"));
    }
    // Vibration plate every other day, at most 10 minutes, 60 s at a time.
    if (gear.has("vibration") && seed(day + "vib") % 2 === 0) {
      const vib = FMOVES.filter((x) => x.k === "vib" && ok(x)).sort((a, b) => b.a.filter((z) => areas.includes(z)).length - a.a.filter((z) => areas.includes(z)).length).slice(0, 2);
      vib.forEach((x) => main.push(row(x, "Vibration", Math.min(3, x.s))));
      if (vib.length) notes.push("Vibration plate: 60 s at a time, 10 min a day at most, knees soft. Skip it if you have joint pain, a pacemaker or recent surgery.");
    }
  }
  // Volume: more or fewer sets to match the time.
  const all = [...rows, ...main, ...cool];
  let total = rowsMinutes(all);
  for (let guard = 0; guard < 30 && total > minutes + 3; guard++) {
    const big = main.filter((r) => r.sets > 2).sort((a, b) => b.sets - a.sets)[0] ?? main[main.length - 1];
    if (!big) break;
    if (big.sets > 2) big.sets--; else main.splice(main.indexOf(big), 1);
    total = rowsMinutes([...rows, ...main, ...cool]);
  }
  for (let guard = 0; guard < 30 && total < minutes - 4 && main.length; guard++) {
    const small = main.filter((r) => r.sets < 5 && r.part !== "Vibration").sort((a, b) => a.sets - b.sets)[0];
    if (!small) break;
    small.sets++;
    total = rowsMinutes([...rows, ...main, ...cool]);
  }
  // Too much sugar or food: a brisk walk on top (easy on the joints, fine after a meal).
  const burn: PlanRow[] = [];
  if (opts.burn && opts.burn >= 5) {
    burn.push({ part: "Burn extra sugar", name: "Brisk walk", sets: 1, reps: `${opts.burn} min`, rest: 0 });
    notes.push(`+${opts.burn} min brisk walk for the extra sugar or calories you had.`);
  }
  if (pain.size) notes.push(`Avoiding moves that load: ${[...pain].map((p) => areaOf(p)?.label ?? p).join(", ")}.`);
  return { rows: [...rows, ...main, ...burn, ...cool], notes };
}

// ---------- Free time ----------
type Span = [number, number, string];
export type FitSession = { id: string; start: number; len: number; rows: PlanRow[]; label: string; light: boolean; notes: string[] };
export type FitDay = { sessions: FitSession[]; minutes: number; want: number; ready: Ready; vol: ReturnType<typeof volume>; busy: Span[]; why: string[]; moved?: string; none?: string };

/** Everything that blocks training on this day, in minutes from midnight (past midnight → +1440). */
export function busyOf(d: Data, date: Date, items: RoutineItem[] = []): { busy: Span[]; digest: Span[]; lo: number; hard: number; soft: number } {
  const s = sched(d.profile.settings.schedule);
  const fit = fitOf(d.profile.settings.fit);
  const t = dayType(s, date), off = isOffDay(t);
  const day = toDay(date);
  const W = toMin(off ? s.weekendWake : s.wake);
  let S = toMin(sleepTimes(s, new Date(`${day}T20:00:00`)).sleep);
  if (S <= W) S += 1440;
  const at = (m: number) => (m < W - 60 ? m + 1440 : m);
  const span = (a: string, b: string | number, why: string): Span | null => {
    const x = toMin(a);
    if (Number.isNaN(x)) return null;
    const y = typeof b === "number" ? x + b : toMin(b);
    if (Number.isNaN(y)) return null;
    const A = at(x);
    return [A, A + ((y - x + 1440) % 1440 || (typeof b === "number" ? b : 0)), why];
  };
  const busy: Span[] = [];
  const push = (x: Span | null) => { if (x && x[1] > x[0]) busy.push(x); };
  const c = s.commute || 0;
  for (const it of items) {
    if (it.auto && !it.id.startsWith("a-listen")) continue; // the app's own steps move around the workout
    if (["b-wake", "b-sleep", "b-exercise"].includes(it.id) || it.id.startsWith("a-fit") || it.kind === "water") continue;
    const len = it.end ? (toMin(it.end) - toMin(it.time) + 1440) % 1440 : it.kind === "meal" ? 30 : 10;
    const why = it.kind === "work" ? "work" : it.kind === "meal" ? `${it.label.toLowerCase()}` : it.kind === "study" ? "study" : it.label;
    const x = span(it.time, len, why);
    if (!x) continue;
    if (it.kind === "work") { x[0] -= c; x[1] += c; x[2] = "work and commute"; }
    push(x);
  }
  if (s.prayer) push(span(s.prayer, 20, "prayer"));
  if (s.quietStart && s.quietEnd) push(span(s.quietStart, s.quietEnd, "quiet hours"));
  if (s.napAllowed && s.napStart && s.napEnd && off) push(span(s.napStart, s.napEnd, "nap time"));
  for (const b of fit.dnd) {
    if (b.date && b.date !== day) continue;
    if (b.days?.length && !b.days.includes(date.getDay())) continue;
    push(span(b.start, b.end, b.label || "do not disturb"));
  }
  // Digesting: no hard training soon after eating.
  const digest: Span[] = [];
  for (const it of items.filter((x) => x.kind === "meal" && x.id.startsWith("b-"))) {
    const x = span(it.time, it.id === "b-breakfast" ? 20 + 45 : 30 + 90, `digesting ${it.label.toLowerCase()}`);
    if (x) digest.push(x);
  }
  for (const l of d.logs.filter((x) => x.day === day && x.kind === "activity" && Array.isArray(x.data.foods))) {
    const kcal = (l.data.foods as { kcal?: number }[]).reduce((n, f) => n + (Number(f.kcal) || 0), 0);
    if (kcal >= 600) { const m = new Date(l.created_at); const x = span(hm(m.getHours() * 60 + m.getMinutes()), 90, `digesting a big meal (${kcal} kcal)`); if (x) digest.push(x); }
  }
  return { busy, digest, lo: W + 60, hard: S - 120, soft: S - 100 };
}

const gapsIn = (blocks: Span[], lo: number, hi: number): [number, number][] => {
  const b = blocks.filter(([a, z]) => z > lo && a < hi).sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  let t = lo;
  for (const [a, z] of b) { if (a - 5 > t) out.push([t, a - 5]); t = Math.max(t, z + 5); }
  if (hi > t) out.push([t, hi]);
  return out.filter(([a, z]) => z - a >= 15);
};

/** Today's workout(s): when, how long and what. `from` = now in minutes (today) to move a missed one. */
export function fitDay(d: Data, date: Date, items: RoutineItem[] = [], from = -1): FitDay {
  const fit = fitOf(d.profile.settings.fit);
  const s = sched(d.profile.settings.schedule);
  const off = isOffDay(dayType(s, date));
  const ready = readiness(d, date);
  const vol = volume(d, date, fit);
  const why = [...ready.why];
  const boost = intakeBoost(d, date);
  const want = Math.round(fit.minutes * (off ? 1 + fit.weekendBoost / 100 : 1) * vol.factor * (ready.recovery ? 0.5 : ready.factor)) + boost.extra;
  why.push(...boost.why);
  if (off) why.push(`Day off: ${fit.weekendBoost}% longer.`);
  if (vol.auto) why.push(vol.auto > 0 ? `You completed almost everything in the last 2 weeks: +${vol.auto}% volume.` : `You missed some workouts in the last 2 weeks: ${vol.auto}% volume so it's easier to finish.`);
  if (vol.manual) why.push(`Your own setting: ${vol.manual > 0 ? "+" : ""}${vol.manual}%.`);
  const { busy, digest, lo, hard, soft } = busyOf(d, date, items);
  const light = ready.light || ready.recovery;
  // Light work may run closer to bed and right after meals; hard work may not.
  const blocks = light ? busy : [...busy, ...digest];
  const hi = light ? soft : hard;
  const prefer = (() => {
    const ex = toMin(s.exercise), W = lo - 60;
    if (fit.prefer === "morning") return lo;
    const work = items.find((x) => x.id === "b-work");
    const after = work?.end ? toMin(work.end) + (s.commute || 0) + 30 : W + 4 * 60;
    if (fit.prefer === "evening") return after;
    return !Number.isNaN(ex) ? Math.max(ex < W - 60 ? ex + 1440 : ex, lo) : after;
  })();
  const plan = (start: number): { at: number; len: number }[] => {
    const gaps = gapsIn(blocks, Math.max(lo, start), hi);
    const near = (g: [number, number]) => Math.abs(Math.max(g[0], Math.min(prefer, g[1] - want)) - prefer);
    const fits = gaps.filter(([a, z]) => z - a >= want).sort((p, q) => near(p) - near(q))[0];
    if (fits) return [{ at: Math.max(fits[0], Math.min(prefer, fits[1] - want)), len: want }];
    // Busy day: two shorter sessions, or one shorter one in the biggest free time.
    const big = [...gaps].sort((p, q) => q[1] - q[0] - (p[1] - p[0]));
    if (big.length >= 2 && big[0][1] - big[0][0] + big[1][1] - big[1][0] >= want * 0.8 && big[1][1] - big[1][0] >= 20) {
      const two = big.slice(0, 2).sort((p, q) => p[0] - q[0]);
      const half = Math.round(want / 2);
      return two.map(([a, z]) => ({ at: a, len: Math.min(z - a, half) }));
    }
    if (big[0]) return [{ at: big[0][0], len: Math.min(want, big[0][1] - big[0][0]) }];
    return [];
  };
  let slots = plan(lo);
  let moved: string | undefined;
  // Missed by 15 minutes and not started: the next free time today (never carried to tomorrow).
  if (from >= 0 && slots.length) {
    const startedToday = d.logs.some((l) => l.kind === "workout" && l.day === toDay(date));
    const nowAt = from < lo - 120 ? from + 1440 : from;
    if (!startedToday && slots[0].at + 15 < nowAt) {
      const was = slots[0].at, again = plan(nowAt + 5);
      if (again.length) { slots = again; moved = `You missed ${hm(was % 1440)}, so it moved to ${hm(again[0].at % 1440)}.`; }
      else moved = `You missed ${hm(was % 1440)} and there's no free time left today. Nothing is added to tomorrow.`;
    }
  }
  const sessions: FitSession[] = [];
  const skip = new Set<string>();
  slots.forEach((x, i) => {
    // The extra walk goes in the first session, if there's time for it.
    const burn = i === 0 && boost.extra && x.len >= boost.extra + 15 ? boost.extra : 0;
    const b = buildSession(d, date, x.len - burn, { light, recovery: ready.recovery, key: String(i), skip, burn });
    b.rows.forEach((r) => skip.add(r.name));
    const len = Math.min(x.len, Math.max(15, rowsMinutes(b.rows)));
    sessions.push({ id: `a-fit-${i + 1}`, start: x.at, len, rows: b.rows, light, notes: b.notes, label: sessionLabel(b.rows, ready.recovery, slots.length > 1 ? i + 1 : 0, slots.length, fit.areas) });
  });
  const minutes = sessions.reduce((n, x) => n + x.len, 0);
  if (sessions.length && minutes < want - 5) why.push(`Busy day: ${minutes} min fits${sessions.length > 1 ? ` in ${sessions.length} parts` : ""}.`);
  return { sessions, minutes, want, ready, vol, busy: [...busy, ...digest], why, moved, none: sessions.length ? undefined : moved ?? "No free time today. Rest, walk when you can; nothing is carried over." };
}

function sessionLabel(rows: PlanRow[], recovery: boolean, part: number, of: number, chosen: string[]) {
  // The focus areas this session trains most.
  const n = new Map<string, number>();
  for (const r of rows.filter((x) => x.part === "Focus")) for (const a of fmoveOf(r.name)?.a ?? []) if (chosen.includes(a)) n.set(a, (n.get(a) ?? 0) + 1);
  const areas = [...n.entries()].sort((p, q) => q[1] - p[1]).map(([a]) => areaOf(a)?.label.replace(/ \(.*\)/, "") ?? a);
  const what = recovery ? "Recovery: mobility & stretching" : areas.length ? areas.slice(0, 3).join(", ") : "Full body";
  return `${part ? `Workout ${part}/${of}` : "Workout"}: ${what}`;
}

/** Steps for the Daily mission: the workout(s), water before and after, Kegels. */
export function fitSteps(d: Data, date: Date, items: RoutineItem[], from = -1): RoutineItem[] {
  const fit = fitOf(d.profile.settings.fit);
  const fd = fitDay(d, date, items, from);
  const out: RoutineItem[] = [];
  const t = (m: number) => hm(((Math.round(m) % 1440) + 1440) % 1440);
  for (const x of fd.sessions) {
    out.push({ id: x.id, time: t(x.start), end: t(x.start + x.len), label: x.label, kind: "workout", auto: true, moves: x.rows, href: "/fit", note: [...(fd.moved ? [fd.moved] : []), ...x.notes].join(" ") || undefined });
    out.push({ id: `${x.id}-water-pre`, time: t(x.start - 15), label: "Water 250 ml before training", kind: "water", ml: 250, auto: true, href: "/food" });
    out.push({ id: `${x.id}-water-post`, time: t(x.start + x.len + 5), label: "Water 300 ml after training", kind: "water", ml: 300, auto: true, href: "/food" });
  }
  if (fit.kegel) {
    const k = kegelToday(d, date);
    const s = sched(d.profile.settings.schedule);
    const off = isOffDay(dayType(s, date));
    let S = toMin(sleepTimes(s, new Date(`${toDay(date)}T20:00:00`)).sleep);
    const W = toMin(off ? s.weekendWake : s.wake);
    if (S <= W) S += 1440;
    out.push({ id: "a-kegel", time: t(S - 115), end: t(S - 110), label: `Kegels: ${k.sets} × 10, hold ${k.hold} s`, kind: "workout", auto: true, href: "/fit", moves: [{ part: "Kegel", name: "Kegels (pelvic floor)", sets: k.sets, reps: `10 × ${k.hold} s`, rest: 30 }] });
  }
  return out;
}

/** Kegel program: hold 3 s in week 1, one second more each week up to 10 s; 3 sets. */
export function kegelToday(d: Data, date: Date) {
  const first = d.logs.find((l) => l.kind === "workout" && /kegel/i.test(String(l.data.exercise)));
  const weeks = first ? Math.floor((date.getTime() - new Date(first.created_at).getTime()) / (7 * DAY)) : 0;
  return { hold: Math.min(10, 3 + weeks), sets: weeks >= 4 ? 3 : 2, weeks };
}

// ---------- Totals, records, reports ----------
export type Totals = { exercises: number; sets: number; reps: number; minutes: number; kcal: number; steps: number; days: number };
const repsOf = (l: Log) => (Number(l.data.reps) || 0) * (Number(l.data.sets) || 1);
const minsOf = (l: Log) => Number(l.data.minutes) || ((Number(l.data.sets) || 1) * ((Number(l.data.seconds) || Number(l.data.set_secs) || 40) + (Number(l.data.rest) || 45))) / 60;

export function totals(d: Data, days: string[]): Totals {
  const set = new Set(days);
  const w = d.logs.filter((l) => l.kind === "workout" && set.has(l.day));
  const kg = bodyOf(d).kg;
  const kcal = w.reduce((n, l) => {
    const met = fmoveOf(String(l.data.exercise))?.met ?? metOf(String(l.data.exercise))?.[1] ?? 5;
    return n + Math.max(0, (met - 1) * kg * (minsOf(l) / 60));
  }, 0);
  const stepsBy = new Map<string, number>();
  for (const l of d.logs) if (l.kind === "steps" && set.has(l.day)) stepsBy.set(l.day, Math.max(stepsBy.get(l.day) ?? 0, Number(l.data.steps) || 0));
  return {
    exercises: new Set(w.map((l) => String(l.data.exercise).toLowerCase())).size,
    sets: w.reduce((n, l) => n + (Number(l.data.sets) || 1), 0),
    reps: w.reduce((n, l) => n + repsOf(l), 0),
    minutes: Math.round(w.reduce((n, l) => n + minsOf(l), 0)),
    kcal: Math.round(kcal),
    steps: [...stepsBy.values()].reduce((a, b) => a + b, 0),
    days: new Set(w.map((l) => l.day)).size,
  };
}
export const lastDays = (n: number, now = new Date()) => Array.from({ length: n }, (_, i) => dayOf(now, n - 1 - i));
/** Per-day values for a chart. */
export function series(d: Data, n: number, key: keyof Totals, now = new Date()) {
  return lastDays(n, now).map((day) => ({ day, v: totals(d, [day])[key] }));
}

/** Weekly or monthly report: what got better, what you missed, what to do next. */
export function report(d: Data, n: 7 | 30, now = new Date()) {
  const cur = lastDays(n, now), prev = lastDays(n, new Date(now.getTime() - n * DAY));
  const a = totals(d, cur), b = totals(d, prev);
  const fit = fitOf(d.profile.settings.fit);
  const better: string[] = [], missed: string[] = [], next: string[] = [];
  const cmp = (k: keyof Totals, label: string) => { if (a[k] > b[k] && b[k]) better.push(`${label}: ${a[k]} (was ${b[k]})`); else if (a[k] < b[k]) missed.push(`${label}: ${a[k]} (was ${b[k]})`); };
  cmp("days", "Training days"); cmp("sets", "Sets"); cmp("reps", "Reps"); cmp("minutes", "Minutes"); cmp("steps", "Steps");
  const expect = Math.round(n * 5 / 7);
  if (a.days < expect) missed.push(`${expect - a.days} planned workout days missed`);
  const stepDays = cur.filter((day) => totals(d, [day]).steps >= fit.steps).length;
  if (stepDays < cur.length / 2) next.push(`Walk more: ${fit.steps.toLocaleString()} steps on only ${stepDays} of ${n} days.`);
  if (a.days >= expect) next.push("Great consistency. The app adds a little volume next time.");
  else next.push("Aim for shorter sessions you can finish; the app lowers volume so you can catch up without piling up.");
  // Areas you chose but didn't train.
  const hit = new Set(d.logs.filter((l) => l.kind === "workout" && cur.includes(l.day)).flatMap((l) => fmoveOf(String(l.data.exercise))?.a ?? []));
  const skipped = fit.areas.filter((x) => !hit.has(x)).map((x) => areaOf(x)?.label ?? x);
  if (skipped.length) next.push(`Not trained yet: ${skipped.slice(0, 5).join(", ")}.`);
  return { cur: a, prev: b, better, missed, next };
}

/** Best results: most reps in one set, longest hold, heaviest weight. */
export function prs(d: Data) {
  const best = new Map<string, { reps: number; secs: number; kg: number; day: string }>();
  for (const l of d.logs) {
    if (l.kind !== "workout") continue;
    const n = String(l.data.exercise ?? "");
    if (!n) continue;
    const b = best.get(n) ?? { reps: 0, secs: 0, kg: 0, day: l.day };
    const reps = Number(l.data.reps) || 0, secs = Number(l.data.seconds) || 0, kg = Number(l.data.weight) || 0;
    if (reps > b.reps || secs > b.secs || kg > b.kg) best.set(n, { reps: Math.max(reps, b.reps), secs: Math.max(secs, b.secs), kg: Math.max(kg, b.kg), day: l.day });
    else best.set(n, b);
  }
  return [...best.entries()].map(([name, b]) => ({ name, ...b })).sort((p, q) => q.day.localeCompare(p.day));
}

/** Monthly fitness test results (push-ups, pull-ups, plank, squats). */
export const tests = (d: Data) => d.logs.filter((l) => l.kind === "fittest").map((l) => ({ day: l.day, pushups: Number(l.data.pushups) || 0, pullups: Number(l.data.pullups) || 0, plank: Number(l.data.plank) || 0, squats: Number(l.data.squats) || 0 }));
export const testDue = (d: Data, now = new Date()) => { const t = tests(d).pop(); return !t || now.getTime() - new Date(`${t.day}T12:00:00`).getTime() >= 28 * DAY; };

export type Badge = { id: string; icon: string; name: string; got: boolean; desc: string };
export function badges(d: Data): Badge[] {
  const w = d.logs.filter((l) => l.kind === "workout");
  const days = new Set(w.map((l) => l.day));
  const maxDay = Math.max(0, ...[...days].map((x) => w.filter((l) => l.day === x && /push/i.test(String(l.data.exercise))).reduce((n, l) => n + repsOf(l), 0)));
  const plank = Math.max(0, ...w.filter((l) => /plank/i.test(String(l.data.exercise))).map((l) => Number(l.data.seconds) || 0), ...tests(d).map((t) => t.plank));
  const steps = Math.max(0, ...d.logs.filter((l) => l.kind === "steps").map((l) => Number(l.data.steps) || 0));
  const run = (() => { let best = 0, cur = 0; const all = [...days].sort(); all.forEach((x, i) => { cur = i && new Date(`${x}T12:00:00`).getTime() - new Date(`${all[i - 1]}T12:00:00`).getTime() <= DAY + 3_600_000 ? cur + 1 : 1; best = Math.max(best, cur); }); return best; })();
  return [
    { id: "first", icon: "🥇", name: "First workout", got: days.size >= 1, desc: "Finish any workout" },
    { id: "d10", icon: "🔟", name: "10 workout days", got: days.size >= 10, desc: "Train on 10 days" },
    { id: "d50", icon: "🏅", name: "50 workout days", got: days.size >= 50, desc: "Train on 50 days" },
    { id: "s7", icon: "🔥", name: "7-day streak", got: run >= 7, desc: "Train 7 days in a row (recovery days count)" },
    { id: "p100", icon: "💯", name: "100 push-ups in a day", got: maxDay >= 100, desc: "All push-up kinds together" },
    { id: "pl2", icon: "🧱", name: "2-minute plank", got: plank >= 120, desc: "Hold a plank 2 minutes" },
    { id: "k10", icon: "👣", name: "10,000 steps", got: steps >= 10000, desc: "Walk 10k steps in a day" },
    { id: "test", icon: "📋", name: "Tested", got: tests(d).length >= 1, desc: "Do the monthly fitness test" },
    { id: "test3", icon: "📈", name: "3 months tested", got: tests(d).length >= 3, desc: "Fitness test 3 months running" },
  ];
}

/** Daily targets for protein, calories and water from your weight and goal. */
export function targets(d: Data, trainingToday: boolean) {
  const fit = fitOf(d.profile.settings.fit);
  const b = bodyOf(d);
  const perKg = fit.goal === "muscle" || fit.goal === "strength" ? 1.8 : fit.goal === "fatloss" ? 2 : 1.4;
  const tdee = Math.round(b.bmr * (trainingToday ? 1.55 : 1.4));
  const kcal = tdee + (fit.goal === "fatloss" ? -400 : fit.goal === "muscle" ? 250 : 0);
  const water = Math.round((b.kg * 35 + (trainingToday ? 500 : 0)) / 50) * 50;
  const protein = Math.round(b.kg * perKg);
  const high = d.pantry.filter((p) => p.qty > 0 && ((p.protein ?? 0) >= 8 || /egg|chicken|tofu|natto|yog|milk|fish|tuna|salmon|saba|beef|pork|bean|protein|cheese|鶏|卵|豆腐|納豆/i.test(p.name))).map((p) => p.name);
  const ideas = [
    ...(high.length ? [`From your pantry: ${high.slice(0, 4).join(", ")}`] : []),
    "Breakfast: eggs + rice or bread, or natto + yoghurt",
    "After training: milk or a protein drink + a banana within an hour",
    "Dinner: half the plate vegetables, a palm of chicken, fish or tofu, a fist of rice",
  ];
  return { protein, kcal, water, perKg, known: b.known, ideas };
}

/** Area ids grouped for the picker. */
export const areaParts = () => [...new Set(AREAS.map((a) => a.part))].map((p) => ({ part: p, areas: AREAS.filter((a) => a.part === p) }));
