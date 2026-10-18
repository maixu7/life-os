import { bodyOf, eaten, health } from "@/lib/body";
import { hoursBetween } from "@/lib/describe";
import { deedsByDay, logKarma, pathScore, type DayDeeds } from "@/lib/karma";
import { byDay, dailyMissions } from "@/lib/missions";
import { sched } from "@/lib/schedule";
import { toDay, type Data, type Log } from "@/lib/store";
import { isStudy } from "@/lib/worst";
import { progress, RANKS, XP } from "@/lib/xp";

// Looking back: day facts, weekly review, "why was today bad?", mood links,
// year heatmaps, 30-day charts, tags, level-up preview and the trophy room.
// All pure functions over Data, so they work offline and are easy to test.

export const shift = (day: string, n: number) => { const d = new Date(`${day}T12:00`); d.setDate(d.getDate() + n); return toDay(d); };
export const mondayOf = (day: string) => { const d = new Date(`${day}T12:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toDay(d); };
export const daysFrom = (from: string, n: number) => Array.from({ length: n }, (_, i) => shift(from, i));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const MIN = (l: Log, def = 30) => Number(l.data.minutes) || def;

const JUNK = /chips|crisps|cola|soda|candy|chocolate|sweets|cake|donut|doughnut|burger|fries|pizza|instant noodle|cup noodle|cup ramen|ice cream|cookie|biscuit|energy drink|junk|fried chicken|fast food|mcdonald|kfc/i;

// ---------- Facts for each day ----------
export type DayFacts = {
  day: string; sleepH: number | null; kcal: number; protein: number; studyMin: number; sets: number; screenMin: number;
  junk: number; good: number; bad: number; mood: number | null; energy: number | null; xp: number; water: number; records: number;
};

// Night sleep counts for the day you wake up in.
function sleepByWake(d: Data) {
  const m = new Map<string, number>();
  for (const l of d.logs) {
    if (l.kind !== "sleep" || !l.data.end) continue;
    const day = toDay(new Date(String(l.data.end)));
    m.set(day, (m.get(day) ?? 0) + hoursBetween(l.data.start, l.data.end));
  }
  return m;
}

export function junkOf(logs: Log[], d?: Data) {
  const foods = eaten(logs, d?.items ?? []).filter((f) => JUNK.test(f.name)).length;
  const other = logs.filter((l) => (l.kind === "gaveIn" && /junk/i.test(String(l.data.what)))
    || (l.kind === "activity" && !l.data.foods && JUNK.test(String(l.data.name ?? "")))).length;
  return foods + other;
}

export type Facts = { days: Map<string, DayFacts>; deeds: Map<string, DayDeeds> };

// Facts for every day that has records (one pass, shared by the screens below).
export function allFacts(d: Data): Facts {
  const deeds = deedsByDay(d);
  const sleep = sleepByWake(d);
  const groups = byDay(d.logs);
  const days = new Map<string, DayFacts>();
  for (const day of new Set([...Object.keys(groups), ...sleep.keys()])) days.set(day, factsOf(d, day, groups[day] ?? [], sleep.get(day) ?? null, deeds.get(day)));
  return { days, deeds };
}

function factsOf(d: Data, day: string, logs: Log[], sleepH: number | null, dd?: DayDeeds): DayFacts {
  const foods = eaten(logs, d.items);
  const num = (k: string, f: string) => logs.filter((l) => l.kind === k).map((l) => Number(l.data[f])).filter((x) => x > 0);
  const screenLog = num("screen", "minutes");
  const timepass = logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((n, l) => n + MIN(l), 0);
  return {
    day, sleepH,
    kcal: Math.round(foods.reduce((s, x) => s + x.kcal, 0)),
    protein: Math.round(foods.reduce((s, x) => s + x.protein, 0)),
    studyMin: logs.filter(isStudy).reduce((n, l) => n + MIN(l, 25), 0),
    sets: logs.filter((l) => l.kind === "workout").reduce((n, l) => n + (Number(l.data.sets) || 1), 0)
      + logs.filter((l) => l.kind === "activity" && /exercise|gym|run|football|sport|yoga|swim/i.test(String(l.data.name))).length,
    screenMin: screenLog.length ? Math.max(...screenLog) : timepass,
    junk: junkOf(logs, d),
    good: dd?.good ?? 0, bad: dd?.bad ?? 0,
    mood: avg(num("mood", "mood")), energy: avg(num("energy", "level")),
    xp: logs.reduce((n, l) => n + l.xp, 0),
    water: logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0),
    records: logs.length,
  };
}

// ---------- Weekly review ----------
export type Week = {
  from: string; to: string; kcal: number | null; protein: number | null; study: number; sleep: number | null; sets: number;
  workoutDays: number; good: number; bad: number; xp: number; mood: number | null; junk: number; screen: number | null; logged: number;
};

export function weekOf(f: Facts, from: string): Week {
  const rows = daysFrom(from, 7).map((day) => f.days.get(day)).filter((x): x is DayFacts => !!x);
  const fed = rows.filter((r) => r.kcal > 0);
  return {
    from, to: shift(from, 6),
    kcal: avg(fed.map((r) => r.kcal)), protein: avg(fed.map((r) => r.protein)),
    study: rows.reduce((n, r) => n + r.studyMin, 0),
    sleep: avg(rows.map((r) => r.sleepH).filter((x): x is number => x != null && x > 0)),
    sets: rows.reduce((n, r) => n + r.sets, 0), workoutDays: rows.filter((r) => r.sets > 0).length,
    good: rows.reduce((n, r) => n + r.good, 0), bad: rows.reduce((n, r) => n + r.bad, 0),
    xp: rows.reduce((n, r) => n + r.xp, 0),
    mood: avg(rows.map((r) => r.mood).filter((x): x is number => x != null)),
    junk: rows.reduce((n, r) => n + r.junk, 0),
    screen: avg(rows.filter((r) => r.records).map((r) => r.screenMin)),
    logged: rows.filter((r) => r.records).length,
  };
}

export type Fix = { icon: string; title: string; why: string; weight: number };

// The 3 things that would help most next week, worst first.
export function fixesFor(d: Data, w: Week, prev: Week): Fix[] {
  const s = d.profile.settings, b = bodyOf(d), sc = sched(s.schedule);
  const out: Fix[] = [];
  if (w.logged < 4) out.push({ icon: "📝", title: "Log something every day", why: `Only ${w.logged} of 7 days have records. The review is only as good as what you log.`, weight: (7 - w.logged) * 6 });
  if (w.sleep != null && w.sleep < s.sleep_goal_h - 0.4) out.push({ icon: "😴", title: `Sleep ${s.sleep_goal_h} h: bed by ${sc.sleep}`, why: `You slept ${w.sleep.toFixed(1)} h a night. Short sleep lowers focus, mood and willpower.`, weight: (s.sleep_goal_h - w.sleep) * 18 });
  if (w.protein != null && w.protein < b.proteinNeed * 0.85) out.push({ icon: "🥩", title: `Eat ${b.proteinNeed} g protein a day`, why: `You averaged ${Math.round(w.protein)} g. Add eggs, milk, tofu, chicken or fish to one more meal.`, weight: (1 - w.protein / b.proteinNeed) * 40 });
  if (w.workoutDays < 3) out.push({ icon: "🏋️", title: "Train on 3 days", why: `You moved on ${w.workoutDays} day${w.workoutDays === 1 ? "" : "s"}. Three short sessions keep strength growing.`, weight: (3 - w.workoutDays) * 10 });
  const goal = sc.learnGoal * 5;
  if (goal && w.study < goal * 0.8) out.push({ icon: "📖", title: `Study ${Math.round(goal / 60)} h this week`, why: `You studied ${Math.round(w.study / 60 * 10) / 10} h${prev.study ? ` (last week ${Math.round(prev.study / 60 * 10) / 10} h)` : ""}. Two focus sessions a day get you there.`, weight: (1 - w.study / goal) * 35 });
  else if (prev.study > 60 && w.study < prev.study * 0.8) out.push({ icon: "📖", title: "Get your study time back up", why: `Down from ${Math.round(prev.study)} to ${Math.round(w.study)} minutes.`, weight: 20 });
  if (w.bad > w.good * 0.5 && w.bad > 10) out.push({ icon: "😈", title: "Trade time-pass for good deeds", why: `${w.bad} Devil points vs ${w.good} Angel points. Swap one episode for one chapter each day.`, weight: (w.bad / Math.max(1, w.good)) * 30 });
  if (w.screen != null && w.screen > sc.screenLimit * 1.2) out.push({ icon: "📱", title: `Keep time-pass under ${sc.screenLimit} min`, why: `About ${Math.round(w.screen)} min a day. Put the phone in another room for the first hour.`, weight: (w.screen / sc.screenLimit - 1) * 25 });
  if (w.junk >= 4) out.push({ icon: "🍟", title: "Fewer junk foods", why: `${w.junk} junk foods this week. Keep fruit or onigiri ready for cravings.`, weight: w.junk * 4 });
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

export function weeklyReview(d: Data, monday = mondayOf(toDay(new Date())), f = allFacts(d)) {
  const w = weekOf(f, monday), prev = weekOf(f, shift(monday, -7));
  return { week: w, prev, fixes: fixesFor(d, w, prev) };
}

// ---------- A day's score and why ----------
// 60% health (sleep, water, food, protein, movement, screen) + 40% Angel vs Devil.
export function dayScore(d: Data, day: string, dd?: DayDeeds) {
  const h = health(d, day);
  const deed = 50 + pathScore(dd?.good ?? 0, dd?.bad ?? 0) / 2;
  return { score: Math.round(h.score * 0.6 + deed * 0.4), health: h, deed: Math.round(deed) };
}

export type Reason = { icon: string; text: string; lost: number; tip: string };

export function whyDay(d: Data, day: string, f = allFacts(d), withLinks = true) {
  const dd = f.deeds.get(day);
  const { score, health: h } = dayScore(d, day, dd);
  const facts = f.days.get(day);
  const reasons: Reason[] = h.parts.filter((p) => p.got < p.max).map((p) => ({
    icon: p.label.split(" ")[0], text: p.label.slice(p.label.indexOf(" ") + 1), lost: Math.round((p.max - p.got) * 0.6), tip: p.tip,
  }));
  const bads = (dd?.logs ?? []).filter((l) => logKarma(l) < 0);
  if (dd && dd.bad > 0) {
    const top = bads.slice(0, 3).map((l) => String(l.data.name ?? l.data.title ?? l.data.what ?? l.kind)).join(", ");
    reasons.push({ icon: "😈", text: "Devil deeds", lost: Math.round(Math.min(40, dd.bad * 0.8)), tip: `${dd.bad} Devil points${top ? `: ${top}` : ""}${dd.missed ? `, ${dd.missed} missions missed` : ""}.` });
  }
  if (facts?.junk) reasons.push({ icon: "🍟", text: "Junk food", lost: Math.min(10, facts.junk * 3), tip: `${facts.junk} junk food${facts.junk > 1 ? "s" : ""}. Sugar crashes steal focus a few hours later.` });
  const goal = sched(d.profile.settings.schedule).learnGoal;
  if (facts && goal && facts.studyMin < goal * 0.5) reasons.push({ icon: "📖", text: "Little study", lost: Math.round(Math.min(10, (1 - facts.studyMin / goal) * 10)), tip: `${facts.studyMin} of ${goal} study minutes.` });
  // How this day's habits have played out on your other days.
  const scores = new Map<string, number>();
  for (const k of [...f.days.keys()].filter((x) => x <= day && (withLinks || x >= shift(day, -14))).sort().slice(-60)) scores.set(k, dayScore(d, k, f.deeds.get(k)).score);
  const rows = [...scores.keys()].map((k) => f.days.get(k)!);
  const lim = sched(d.profile.settings.schedule).screenLimit;
  const links = !withLinks ? [] : compare(rows, (r) => scores.get(r.day) ?? null, [
    { icon: "😴", label: "Sleep", good: "7 h+ sleep", bad: "under 7 h", test: (r) => (r.sleepH == null ? null : r.sleepH >= 7) },
    { icon: "📱", label: "Phone time", good: `time-pass under ${lim} min`, bad: "more", test: (r) => r.screenMin <= lim },
    { icon: "🍟", label: "Junk food", good: "no junk food", bad: "with junk", test: (r) => r.junk === 0 },
    { icon: "📖", label: "Study", good: "30+ min study", bad: "less", test: (r) => r.studyMin >= 30 },
  ]);
  const past = [...scores.entries()].filter(([k]) => k < day && k >= shift(day, -14)).map(([, v]) => v);
  const good = [
    facts?.sleepH && facts.sleepH >= 7 ? `Slept ${facts.sleepH.toFixed(1)} h` : "",
    facts && facts.studyMin >= 30 ? `${facts.studyMin} min study` : "",
    facts && facts.sets ? `${facts.sets} sets of training` : "",
    dd && dd.good ? `${dd.good} Angel points` : "",
  ].filter(Boolean);
  return { score, avg: avg(past), reasons: reasons.sort((a, b) => b.lost - a.lost), links, good, facts };
}

// ---------- Links between habits and how you feel ----------
export type Factor = { icon: string; label: string; good: string; bad: string; test: (r: DayFacts) => boolean | null };
export type Link = { icon: string; label: string; good: string; bad: string; a: number; b: number; na: number; nb: number; diff: number };

// Average of y on days where the factor holds vs days it doesn't.
export function compare(rows: DayFacts[], y: (r: DayFacts) => number | null, factors: Factor[]): Link[] {
  const out: Link[] = [];
  for (const fc of factors) {
    const yes: number[] = [], no: number[] = [];
    for (const r of rows) {
      const v = y(r), t = fc.test(r);
      if (v == null || t == null) continue;
      (t ? yes : no).push(v);
    }
    if (yes.length < 2 || no.length < 2) continue;
    const a = avg(yes)!, b = avg(no)!;
    out.push({ icon: fc.icon, label: fc.label, good: fc.good, bad: fc.bad, a, b, na: yes.length, nb: no.length, diff: a - b });
  }
  return out.sort((x, z) => Math.abs(z.diff) - Math.abs(x.diff));
}

export function moodLinks(d: Data, f = allFacts(d)) {
  const b = bodyOf(d);
  const lim = sched(d.profile.settings.schedule).screenLimit;
  const rows = [...f.days.values()];
  const factors: Factor[] = [
    { icon: "😴", label: "Sleep", good: "7 h+ sleep", bad: "under 7 h", test: (r) => (r.sleepH == null ? null : r.sleepH >= 7) },
    { icon: "🥩", label: "Protein", good: `${Math.round(b.proteinNeed * 0.8)} g+ protein`, bad: "less", test: (r) => (r.kcal ? r.protein >= b.proteinNeed * 0.8 : null) },
    { icon: "🍟", label: "Junk food", good: "no junk", bad: "junk food", test: (r) => (r.records ? r.junk === 0 : null) },
    { icon: "🏋️", label: "Training", good: "trained", bad: "no training", test: (r) => (r.records ? r.sets > 0 : null) },
    { icon: "📱", label: "Phone time", good: `under ${lim} min`, bad: "more", test: (r) => (r.records ? r.screenMin <= lim : null) },
    { icon: "📖", label: "Study", good: "30+ min", bad: "less", test: (r) => (r.records ? r.studyMin >= 30 : null) },
    { icon: "💧", label: "Water", good: `${d.profile.settings.water_goal_ml} ml+`, bad: "less", test: (r) => (r.records ? r.water >= d.profile.settings.water_goal_ml : null) },
  ];
  return {
    mood: compare(rows, (r) => r.mood, factors), energy: compare(rows, (r) => r.energy, factors),
    days: rows.filter((r) => r.mood != null || r.energy != null).length,
  };
}

// ---------- Year heatmap ----------
export type YearCat = "study" | "workout" | "angel" | "xp";
export const YEAR_CATS: { id: YearCat; icon: string; label: string; unit: string }[] = [
  { id: "study", icon: "📖", label: "Study", unit: "min" }, { id: "workout", icon: "🏋️", label: "Workouts", unit: "sets" },
  { id: "angel", icon: "😇", label: "Angel days", unit: "" }, { id: "xp", icon: "⭐", label: "XP", unit: "XP" },
];
// Value per day for the year; Angel days are +1 (more good than bad), -1 (Devil) or 0.
export function yearValues(f: Facts, year: number, cat: YearCat) {
  const start = `${year}-01-01`;
  const n = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
  return daysFrom(start, n).map((day) => {
    const r = f.days.get(day);
    const v = !r ? 0 : cat === "study" ? r.studyMin : cat === "workout" ? r.sets : cat === "xp" ? r.xp : r.good > r.bad ? 1 : r.bad > r.good ? -1 : 0;
    return { day, v };
  });
}

// ---------- 30-day charts for any card ----------
export type Metric = { label: string; icon: string; unit: string; of: (r: DayFacts | undefined, d: Data, day: string) => number | null };
const fv = (k: keyof DayFacts) => (r: DayFacts | undefined) => (r ? (r[k] as number | null) : 0);
export const METRICS: Record<string, Metric> = {
  xp: { label: "XP earned", icon: "⭐", unit: "XP", of: fv("xp") },
  water: { label: "Water", icon: "💧", unit: "ml", of: fv("water") },
  sleep: { label: "Sleep", icon: "😴", unit: "h", of: (r) => r?.sleepH ?? null },
  kcal: { label: "Calories eaten", icon: "🍱", unit: "kcal", of: fv("kcal") },
  protein: { label: "Protein", icon: "🥩", unit: "g", of: fv("protein") },
  study: { label: "Study", icon: "📖", unit: "min", of: fv("studyMin") },
  sets: { label: "Workout sets", icon: "🏋️", unit: "sets", of: fv("sets") },
  good: { label: "Angel points", icon: "😇", unit: "pts", of: fv("good") },
  bad: { label: "Devil points", icon: "😈", unit: "pts", of: fv("bad") },
  screen: { label: "Phone time-pass", icon: "📱", unit: "min", of: fv("screenMin") },
  mood: { label: "Mood", icon: "😊", unit: "/5", of: (r) => r?.mood ?? null },
  junk: { label: "Junk food", icon: "🍟", unit: "", of: fv("junk") },
  records: { label: "Records", icon: "📋", unit: "", of: fv("records") },
  health: { label: "Health score", icon: "🩺", unit: "/100", of: (r, d, day) => (r ? health(d, day).score : null) },
  missions: { label: "Missions cleared", icon: "⚔", unit: "/6", of: (r, d, day) => dailyMissions(d.logs.filter((l) => l.day === day && l.kind !== "bonus"), d.profile.settings).filter((m) => m.done).length },
};
// Which chart each built-in block opens ("page:block").
export const BLOCK_METRIC: Record<string, string> = {
  "/:learn": "study", "/:care": "health", "/:sleep": "sleep", "/:meals": "kcal", "/:gauges": "health", "/:boss": "xp",
  "/:missions": "missions", "/:potions": "water", "/:quests": "good", "/:library": "study",
  "/today:basics": "records", "/today:did": "xp", "/today:fix": "bad",
  "/food:meals": "kcal", "/food:week": "kcal", "/food:next": "protein", "/food:care": "health", "/food:drink": "water",
  "/train:done": "sets", "/train:plan": "sets", "/train:list": "sets", "/train:lift": "sets",
  "/learn:plan": "study", "/learn:today": "study", "/learn:skills": "study", "/learn:library": "study",
};
export type Point = { day: string; v: number | null };
// Own counter blocks chart their own count.
export function series(d: Data, metric: string, n = 30, f = allFacts(d), end = toDay(new Date())): Point[] {
  const m = METRICS[metric];
  return daysFrom(shift(end, -(n - 1)), n).map((day) => {
    if (metric.startsWith("counter:")) return { day, v: d.logs.filter((l) => l.day === day && l.kind === "counter" && l.data.block === metric.slice(8)).reduce((s, l) => s + (Number(l.data.n) || 1), 0) };
    if (metric.startsWith("done:")) { const names = metric.slice(5).toLowerCase().split("|"); return { day, v: d.logs.filter((l) => l.day === day && l.kind === "activity" && names.includes(String(l.data.name).toLowerCase())).length }; }
    return { day, v: m ? m.of(f.days.get(day), d, day) : null };
  });
}

// ---------- Tags ----------
export const parseTags = (s: string) => [...s.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) => m[1].toLowerCase());
export function tagsOf(l: Log): string[] {
  const own = Array.isArray(l.data.hashtags) ? (l.data.hashtags as string[]) : [];
  const text = [l.data.note, l.data.text, l.data.title, l.data.good, l.data.improve].filter((x) => typeof x === "string").join(" ");
  return [...new Set([...own.map((t) => t.toLowerCase()), ...parseTags(text)])];
}
export function allTags(logs: Log[]) {
  const m = new Map<string, number>();
  for (const l of logs) for (const t of tagsOf(l)) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ---------- Level-up preview ----------
export type Way = { icon: string; what: string; xp: number; mins: number; times: number; href?: string };
export function levelPreview(d: Data, now = new Date()) {
  const xp = d.profile.xp, p = progress(xp);
  const toLevel = 100 - (xp % 100), toRank = p.next ? p.next.min - xp : null;
  const day = toDay(now);
  const todays = d.logs.filter((l) => l.day === day && l.kind !== "bonus");
  // Missions left today pay their reward on top of the record's own XP.
  const missions: Way[] = dailyMissions(todays, d.profile.settings).filter((m) => !m.done).map((m) => ({
    icon: m.icon, what: `${m.name}: ${m.goal}`, xp: m.reward + ({ wake: XP.wake, water: XP.water * 4, milk: XP.milk * 2, meal: XP.meal * 3, train: XP.workout, focus: XP.focus } as Record<string, number>)[m.id],
    mins: ({ wake: 1, water: 5, milk: 2, meal: 45, train: 10, focus: 25 } as Record<string, number>)[m.id], times: 1, href: m.href,
  }));
  const basics: Way[] = [
    { icon: "📖", what: "25-min focus session", xp: XP.focus, mins: 25, times: 0, href: "/focus" },
    { icon: "🏋️", what: "One workout set", xp: XP.workout, mins: 3, times: 0, href: "/train" },
    { icon: "💻", what: "Coding session", xp: XP.coding, mins: 30, times: 0 },
    { icon: "📚", what: "Read a book", xp: XP.media, mins: 20, times: 0, href: "/learn" },
  ].map((w) => ({ ...w, times: Math.ceil(toLevel / w.xp) }));
  const since = toDay(new Date(now.getTime() - 13 * 86_400_000));
  const pace = d.logs.filter((l) => l.day >= since).reduce((n, l) => n + l.xp, 0) / 14;
  return {
    p, toLevel, toRank, pace: Math.round(pace),
    daysToRank: toRank != null && pace > 0 ? Math.ceil(toRank / pace) : null,
    missions: missions.sort((a, b) => b.xp / b.mins - a.xp / a.mins),
    basics: basics.sort((a, b) => b.xp / b.mins - a.xp / a.mins),
  };
}

// ---------- Trophy room ----------
// When each rank and every 5th level was reached, replaying today's records in order.
export function milestones(d: Data) {
  const out: { icon: string; name: string; at: string }[] = [];
  let xp = 0, ri = 0, lv = 1;
  for (const l of [...d.logs].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    xp += l.xp;
    while (RANKS[ri + 1] && xp >= RANKS[ri + 1].min) { ri++; out.push({ icon: "🎖", name: `Rank ${RANKS[ri].name}: ${RANKS[ri].title}`, at: l.created_at }); }
    const level = Math.floor(xp / 100) + 1;
    for (let n = (Math.floor(lv / 5) + 1) * 5; n <= level; n += 5) out.push({ icon: "⬆️", name: `Level ${n}`, at: l.created_at });
    lv = Math.max(lv, level);
  }
  return out.reverse();
}
