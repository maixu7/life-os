import type { Facts } from "@/lib/label";
import { goodFor } from "@/lib/goods";
import { logKarma } from "@/lib/karma";
import { moveOf, MOVES } from "@/lib/moves";
import { sleepHours } from "@/lib/missions";
import { sched } from "@/lib/schedule";
import { toDay, type CustomItem, type Data, type Log } from "@/lib/store";
import { progress } from "@/lib/xp";

// Real-world numbers, not game points: calories in and out (standard food
// values and MET tables), protein, sleep, a health score, strength forecasts
// from your own training records, and skill levels from hours of practice.
// Everything is an estimate based on what you log.

// ---------- Food ----------
export type Food = { name: string; re: RegExp; per: string; kcal: number; protein: number; emoji: string; contents?: string };
const f = (name: string, re: RegExp, per: string, kcal: number, protein: number, emoji: string): Food => ({ name, re, per, kcal, protein, emoji });

export const FOODS: Food[] = [
  f("Apple", /apple/i, "1 medium", 95, 0.5, "🍎"), f("Banana", /banana/i, "1 medium", 105, 1.3, "🍌"), f("Orange", /orange/i, "1 medium", 62, 1.2, "🍊"),
  f("Mango", /mango/i, "1 whole", 200, 2.8, "🥭"), f("Grapes", /grape/i, "1 cup", 104, 1.1, "🍇"), f("Watermelon", /watermelon/i, "1 slice", 85, 1.7, "🍉"), f("Fruit", /fruit|berr|pineapple|papaya|guava|pomegranate/i, "1 bowl", 90, 1, "🍓"),
  f("Egg (boiled)", /\begg/i, "1 egg", 78, 6.3, "🥚"), f("Omelette", /omelet/i, "2 eggs", 190, 13, "🍳"), f("Milk", /milk/i, "1 glass 250 ml", 150, 8, "🥛"),
  f("Tea", /\btea\b|chai/i, "1 cup with sugar", 60, 1.5, "🍵"), f("Coffee", /coffee/i, "1 cup with milk", 60, 2, "☕"),
  f("Rice", /rice(?! fried)/i, "1 cup cooked", 205, 4.3, "🍚"), f("Roti / chapati", /roti|chapat/i, "1 piece", 120, 3, "🫓"), f("Paratha", /paratha/i, "1 piece", 260, 5, "🫓"),
  f("Puri", /puri/i, "1 piece", 100, 1.5, "🫓"), f("Dal", /\bdal\b|lentil/i, "1 bowl", 180, 9, "🍲"), f("Sabzi (veg curry)", /sabzi|sabji|veg|curry/i, "1 bowl", 150, 4, "🥘"),
  f("Paneer", /paneer/i, "100 g", 265, 18, "🧀"), f("Chicken curry", /chicken curry|butter chicken/i, "1 bowl", 300, 25, "🍗"), f("Chicken breast", /chicken/i, "100 g", 165, 31, "🍗"),
  f("Fish", /fish/i, "100 g", 200, 22, "🐟"), f("Mutton", /mutton|goat/i, "1 bowl", 350, 25, "🍖"), f("Biryani", /biryani/i, "1 plate", 500, 20, "🍛"),
  f("Fried rice", /fried rice/i, "1 plate", 450, 10, "🍛"), f("Bread", /bread|toast/i, "1 slice", 75, 2.5, "🍞"), f("Peanut butter", /peanut butter/i, "1 tbsp", 95, 4, "🥜"),
  f("Oats", /oat/i, "1 bowl", 150, 5, "🥣"), f("Curd / yogurt", /curd|yogh?urt|dahi/i, "1 bowl", 100, 6, "🥣"), f("Poha", /poha/i, "1 plate", 250, 5, "🍽️"),
  f("Upma", /upma/i, "1 plate", 250, 6, "🍽️"), f("Idli", /idli/i, "1 piece", 40, 2, "🍘"), f("Dosa", /dosa/i, "1 piece", 170, 4, "🥞"),
  f("Samosa", /samosa/i, "1 piece", 260, 4, "🥟"), f("Momo", /momo/i, "1 piece", 35, 2, "🥟"), f("Noodles / Maggi", /maggi|noodle|ramen/i, "1 pack", 350, 8, "🍜"),
  f("Sandwich", /sandwich/i, "1", 250, 10, "🥪"), f("Pizza", /pizza/i, "1 slice", 285, 12, "🍕"), f("Burger", /burger/i, "1", 350, 17, "🍔"),
  f("Biscuit", /biscuit|cookie/i, "1 piece", 40, 0.5, "🍪"), f("Chips", /chips|crisps|kurkure/i, "1 small pack", 150, 2, "🥔"), f("Chocolate", /chocolate|candy/i, "1 bar", 230, 3, "🍫"),
  f("Ice cream", /ice ?cream/i, "1 scoop", 140, 2.5, "🍨"), f("Sweet (mithai)", /sweet|mithai|jamun|laddu|halwa/i, "1 piece", 150, 2, "🍮"),
  f("Cola / soda", /cola|coke|pepsi|soda|soft drink/i, "1 can 330 ml", 140, 0, "🥤"), f("Juice", /juice/i, "1 glass", 110, 1, "🧃"),
  f("Nuts", /nut|almond|cashew|peanut/i, "1 handful 30 g", 170, 6, "🥜"), f("Salad", /salad/i, "1 bowl", 50, 2, "🥗"), f("Potato", /potato|aloo/i, "1 bowl", 150, 3, "🥔"),
  f("Protein shake", /protein|whey/i, "1 scoop", 120, 24, "🥤"), f("Soya chunks", /soya|soy/i, "50 g dry", 170, 26, "🫘"), f("Chana / beans", /chana|rajma|bean|chickpea/i, "1 bowl", 210, 12, "🫘"),
];
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Foods the hero added himself (items with category "food").
export function myFoods(items: CustomItem[]): Food[] {
  return items.filter((i) => i.category === "food").map((i) => ({
    name: i.name, re: new RegExp(esc(i.name), "i"), per: String(i.config.per ?? "1 serving"), kcal: Number(i.config.kcal) || 0,
    protein: Number(i.config.protein) || 0, emoji: String(i.config.emoji ?? "🍽️"), contents: i.config.contents ? String(i.config.contents) : undefined,
  }));
}
export const allFoods = (items: CustomItem[]) => [...myFoods(items), ...FOODS];
export const guessFood = (name: string, items: CustomItem[] = []): Food | undefined => {
  const hit = allFoods(items).find((x) => x.re.test(name));
  if (hit) return hit;
  // 5,000+ Japanese shop items as a fallback (food and drinks only).
  const g = name.trim().length >= 2 ? goodFor(name) : undefined;
  return g && g.kcal ? { name: g.name, re: new RegExp(`^${esc(g.name)}$`, "i"), per: g.per, kcal: g.kcal, protein: g.protein, emoji: g.emoji } : undefined;
};

export type Eaten = { name: string; qty: number; kcal: number; protein: number; fat?: number; carbs?: number; sugar?: number; salt?: number; photo?: string; per?: string; contents?: string; facts?: Facts };

// Everything eaten in a list of logs.
export function eaten(logs: Log[], items: CustomItem[] = []): Eaten[] {
  const out: Eaten[] = [];
  for (const l of logs) {
    const foods = l.data.foods as Eaten[] | undefined;
    if (foods?.length) out.push(...foods);
    else if (l.kind === "use" || (l.kind === "activity" && /eat|ate|snack/i.test(String(l.data.name)))) {
      const fd = guessFood(String(l.data.name ?? "") + " " + String(l.data.note ?? ""), items);
      const qty = Number(l.data.qty) || 1;
      if (fd) out.push({ name: fd.name, qty, kcal: fd.kcal * qty, protein: fd.protein * qty });
    } else if (l.kind === "drink") {
      out.push({ name: String(l.data.name ?? "Drink"), qty: 1, kcal: Number(l.data.kcal) || 0, protein: Number(l.data.protein) || 0, sugar: Number(l.data.sugar) || undefined });
    } else if (l.kind === "milk") {
      const ml = Number(l.data.ml) || 250;
      out.push({ name: "Milk", qty: ml / 250, kcal: (ml / 250) * 150, protein: (ml / 250) * 8 });
    }
  }
  return out;
}

// ---------- Movement ----------
// MET = how many times harder than resting. kcal = MET x kg x hours.
const METS: [RegExp, number, string][] = [
  [/sprint/i, 12, "sprinting"], [/run|jog/i, 9.8, "running"], [/swim/i, 8, "swimming"], [/cycl|bicycle|bike ride/i, 7.5, "cycling"],
  [/football|soccer|basketball/i, 7, "sports"], [/skipping|jump rope/i, 11, "skipping"], [/badminton|tennis/i, 5.5, "racket sport"], [/cricket/i, 5, "cricket"],
  [/dance/i, 5, "dancing"], [/hike|trek|climb/i, 6.5, "hiking"], [/brisk/i, 4.3, "brisk walking"], [/walk/i, 3.5, "walking"],
  [/exercise|workout|gym|push|pull|squat|plank|burpee|lift|curl|bench|dip/i, 6, "strength training"], [/yoga|stretch/i, 2.5, "yoga"],
  [/clean|sweep|mop|tidy/i, 3.3, "cleaning"], [/cook/i, 2.5, "cooking"], [/bath|shower/i, 1.5, "bathing"], [/drive|ride/i, 2, "driving"],
  [/read|study|code|coding|homework|write/i, 1.5, "sitting work"], [/anime|movie|series|youtube|game|phone|scroll|manga/i, 1.3, "screen time"],
];
export const metOf = (name: string) => METS.find(([re]) => re.test(name));
export const ACTIVE_RE = /run|jog|walk|swim|cycl|football|basketball|badminton|tennis|cricket|dance|hike|trek|skipping|yoga|exercise|workout|gym/i;

export type Burn = { name: string; minutes: number; kcal: number; met: number };

// Extra calories burned above resting, from logged movement.
export function burned(logs: Log[], kg: number): Burn[] {
  const out: Burn[] = [];
  for (const l of logs) {
    let name = "", minutes = 0;
    if (l.kind === "workout") { name = String(l.data.exercise ?? "workout"); minutes = Number(l.data.minutes) || Math.max(2, (Number(l.data.sets) || 1) * 1.5); }
    else if (l.kind === "activity") { name = String(l.data.name ?? ""); minutes = Number(l.data.minutes) || 0; if (!minutes && l.data.unit === "km") minutes = (Number(l.data.amount) || 0) * (/run|jog/i.test(name) ? 6 : 12); }
    else continue;
    const m = metOf(name);
    if (!m || !minutes || m[1] < 2) continue;
    out.push({ name, minutes, met: m[1], kcal: Math.round((m[1] - 1) * kg * (minutes / 60)) });
  }
  return out;
}

// ---------- Body ----------
export function bodyOf(d: Data) {
  const w = Number([...d.logs].reverse().find((l) => l.kind === "body" && l.data.weight)?.data.weight) || null;
  const h = d.profile.height_cm;
  const age = d.profile.birth_year ? new Date().getFullYear() - d.profile.birth_year : null;
  const girl = d.profile.avatar.gender === "girl";
  const kg = w ?? 60, cm = h ?? 170, yrs = age ?? 20;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * yrs + (girl ? -161 : 5));
  return { weight: w, height: h, age, kg, bmr, known: !!(w && h && age), proteinNeed: Math.round(kg * 0.8), proteinBuild: Math.round(kg * 1.6) };
}

export type Energy = { intake: number; protein: number; base: number; active: number; out: number; balance: number; foods: Eaten[]; burns: Burn[]; sleepH: number };

export function energy(d: Data, day: string): Energy {
  const b = bodyOf(d);
  const logs = d.logs.filter((l) => l.day === day);
  const foods = eaten(logs, d.items), burns = burned(logs, b.kg);
  const intake = Math.round(foods.reduce((s, x) => s + x.kcal, 0));
  const protein = Math.round(foods.reduce((s, x) => s + x.protein, 0));
  const base = Math.round(b.bmr * 1.2); // resting + light daily life
  const active = burns.reduce((s, x) => s + x.kcal, 0);
  return { intake, protein, base, active, out: base + active, balance: intake - (base + active), foods, burns, sleepH: sleepHours(logs) };
}

// ---------- Health ----------
export type HealthPart = { label: string; got: number; max: number; tip: string };
export function health(d: Data, day = toDay(new Date())) {
  const e = energy(d, day);
  const b = bodyOf(d);
  const logs = d.logs.filter((l) => l.day === day);
  const s = d.profile.settings;
  const water = logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0);
  const moveMin = Math.round(e.burns.reduce((n, x) => n + x.minutes, 0));
  const screen = logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((n, l) => n + (Number(l.data.minutes) || 30), 0);
  const lim = sched(s.schedule).screenLimit;
  const sleepPts = e.sleepH >= 7 && e.sleepH <= 9.5 ? 25 : e.sleepH >= 6 ? 17 : e.sleepH >= 5 ? 10 : e.sleepH > 0 ? 4 : 0;
  const foodPts = !e.intake ? 0 : Math.abs(e.balance) <= e.out * 0.15 ? 15 : Math.abs(e.balance) <= e.out * 0.3 ? 9 : 4;
  const parts: HealthPart[] = [
    { label: "😴 Sleep", got: sleepPts, max: 25, tip: e.sleepH ? `${e.sleepH.toFixed(1)} h slept. Adults need 7 to 9 h.` : "No finished sleep logged for this day." },
    { label: "💧 Water", got: Math.round(Math.min(1, water / s.water_goal_ml) * 15), max: 15, tip: `${water} of ${s.water_goal_ml} ml.` },
    { label: "🍽️ Food balance", got: foodPts, max: 15, tip: e.intake ? `${e.intake} kcal eaten vs about ${e.out} burned.` : "Log what you eat to score this." },
    { label: "🥩 Protein", got: Math.round(Math.min(1, e.protein / b.proteinNeed) * 15), max: 15, tip: `${e.protein} g of the ${b.proteinNeed} g your body needs (0.8 g per kg).` },
    { label: "🏃 Movement", got: Math.round(Math.min(1, moveMin / 30) * 20), max: 20, tip: `${moveMin} active min. WHO advice: 30+ min a day.` },
    { label: "📱 Screen time", got: screen <= lim ? 10 : screen <= lim * 2 ? 5 : 0, max: 10, tip: `${screen} min of time-pass (your limit ${lim}).` },
  ];
  return { score: parts.reduce((n, p) => n + p.got, 0), parts, energy: e };
}

// Weight change at the recent pace: 7700 kcal is about 1 kg of body fat.
export function weightForecast(d: Data) {
  const days: number[] = [];
  for (let i = 1; i <= 7; i++) {
    const day = toDay(new Date(Date.now() - i * 86_400_000));
    const e = energy(d, day);
    if (e.intake > 0) days.push(e.balance);
  }
  if (!days.length) return null;
  const avg = days.reduce((a, b) => a + b, 0) / days.length;
  return { avg: Math.round(avg), days: days.length, month: +((avg * 30) / 7700).toFixed(1) };
}

// ---------- Strength ----------
type Std = { re: RegExp; unit: string; tiers: number[] };
const LEVELS5 = ["Untrained", "Beginner", "Novice", "Intermediate", "Advanced", "Elite"];
const STANDARDS: Std[] = [
  { re: /pull|chin/i, unit: "reps", tiers: [1, 5, 10, 15, 20] },
  { re: /push/i, unit: "reps", tiers: [10, 20, 35, 50, 70] },
  { re: /squat(?!.*bar)/i, unit: "reps", tiers: [20, 40, 60, 80, 100] },
  { re: /dip/i, unit: "reps", tiers: [3, 10, 20, 30, 40] },
  { re: /plank/i, unit: "sec", tiers: [30, 60, 120, 180, 300] },
];
export type Lift = { name: string; best: number; unit: string; level: string; next?: number; perWeek: number; week: number; month: number; sessions: number; weekly: number[]; why: string };

const weekKey = (iso: string) => { const d = new Date(iso); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return toDay(d); };

export function strength(d: Data): Lift[] {
  const byEx = new Map<string, Log[]>();
  for (const l of d.logs) {
    if (l.kind !== "workout" || !l.data.exercise) continue;
    const k = `${l.data.exercise}${l.data.variant && l.data.variant !== "Standard" ? ` (${l.data.variant})` : ""}`;
    (byEx.get(k) ?? byEx.set(k, []).get(k)!).push(l);
  }
  const out: Lift[] = [];
  const since = Date.now() - 28 * 86_400_000;
  for (const [name, logs] of byEx) {
    const weighted = logs.some((l) => Number(l.data.weight) > 0);
    // best single-set score: reps for bodyweight, estimated 1-rep max (Epley) for weights
    const score = (l: Log) => weighted ? Math.round(Number(l.data.weight || 0) * (1 + Number(l.data.reps || 0) / 30)) : Number(l.data.reps || 0);
    const weeks = new Map<string, number>();
    for (const l of logs) weeks.set(weekKey(l.created_at), Math.max(weeks.get(weekKey(l.created_at)) ?? 0, score(l)));
    const weekly = [...weeks.entries()].sort().map(([, v]) => v).slice(-8);
    const best = Math.max(...logs.map(score));
    const recent = logs.filter((l) => new Date(l.created_at).getTime() >= since);
    // sessions per week, counted over the time since you started (up to 4 weeks)
    const first = Math.min(...recent.map((l) => new Date(l.created_at).getTime()));
    const span = recent.length ? Math.min(4, Math.max(1, (Date.now() - first) / (7 * 86_400_000))) : 4;
    const perWeek = +(new Set(recent.map((l) => l.day)).size / span).toFixed(1);
    // Typical progress with steady training; slower as you get stronger, losses if you stop.
    const std = STANDARDS.find((s) => s.re.test(name));
    const factor = Number(logs.at(-1)?.data.factor) || 1; // harder variants count as more standard reps
    const tier = std ? std.tiers.filter((t) => best * factor >= t).length : 1;
    const base = weighted ? 0.015 : tier <= 1 ? 0.1 : tier <= 3 ? 0.05 : 0.02;
    const rate = perWeek >= 3 ? base : perWeek >= 2 ? base * 0.7 : perWeek >= 1 ? base * 0.35 : -0.02;
    const observed = weekly.length >= 3 ? (weekly.at(-1)! - weekly[0]) / Math.max(1, weekly.length - 1) : null;
    const step = observed != null && observed > 0 ? Math.min(observed, Math.max(1, best * base * 1.5)) : best * rate;
    const week = Math.max(0, Math.round(best + step));
    const month = Math.max(0, Math.round(best + step * 4.3));
    out.push({
      name, best, unit: weighted ? "kg 1RM" : std?.unit ?? "reps", sessions: logs.length, perWeek, weekly, week, month,
      level: std && !weighted ? LEVELS5[tier] : "", next: std && !weighted ? std.tiers[tier] : undefined,
      why: perWeek === 0 ? "No sessions in the last 4 weeks: muscles start losing strength after about 2 to 3 weeks off."
        : observed != null && observed > 0 ? `Based on your own progress: about +${Math.round(observed * 10) / 10} per week.`
        : `Training ${perWeek}x a week. ${tier <= 1 ? "Beginners improve fast" : "Gains slow down as you get stronger"}, so expect about +${Math.round(rate * 1000) / 10}% a week. Train 3x a week for the fastest gains.`,
    });
  }
  return out.sort((a, b) => b.sessions - a.sessions);
}

// ---------- Skills ----------
export const SKILL_LEVELS: [string, number, string][] = [
  ["Noob", 0, "Just started"], ["Beginner", 20, "Knows the basics"], ["Intermediate", 100, "Can build simple things alone"],
  ["Advanced", 500, "Solves hard problems"], ["Expert", 2000, "Others learn from you"], ["Master", 10000, "The famous 10,000 hours"],
];
export type Skill = { name: string; icon: string; hours: number; level: string; levelDesc: string; next?: [string, number]; pct: number; pace: number; daysToNext: number | null; hint: string };

function skill(name: string, icon: string, minutesAll: number, minutes14: number, hint: string, sinceDays = 14): Skill {
  const hours = minutesAll / 60;
  const idx = SKILL_LEVELS.findLastIndex(([, h]) => hours >= h);
  const [level, from, levelDesc] = SKILL_LEVELS[idx];
  const nx = SKILL_LEVELS[idx + 1];
  const pace = minutes14 / Math.max(1, Math.min(14, sinceDays)) / 60; // hours per day lately
  return {
    name, icon, hours: +hours.toFixed(1), level, levelDesc, next: nx ? [nx[0], nx[1]] : undefined,
    pct: nx ? Math.min(100, ((hours - from) / (nx[1] - from)) * 100) : 100, pace: +pace.toFixed(2),
    daysToNext: nx && pace > 0 ? Math.ceil((nx[1] - hours) / pace) : null, hint,
  };
}

export function skills(d: Data): Skill[] {
  const since = Date.now() - 14 * 86_400_000;
  const recent = (l: Log) => new Date(l.created_at).getTime() >= since;
  const sum = (ls: Log[], m: (l: Log) => number) => [ls.reduce((n, l) => n + m(l), 0), ls.filter(recent).reduce((n, l) => n + m(l), 0),
    (Date.now() - Math.min(...ls.map((l) => new Date(l.created_at).getTime()))) / 86_400_000];
  const out: Skill[] = [];
  const code = d.logs.filter((l) => l.kind === "coding");
  const langs = new Map<string, Log[]>();
  for (const l of code) { const k = String(l.data.lang ?? "Coding"); (langs.get(k) ?? langs.set(k, []).get(k)!).push(l); }
  for (const [lang, ls] of langs) {
    const [all, r, sinceAll] = sum(ls, (l) => Number(l.data.minutes) || 0);
    out.push(skill(lang === "undefined" ? "Coding" : lang, "💻", all, r, "1 hour of focused coding a day reaches Intermediate in about 3 months.", sinceAll));
  }
  const reads = d.logs.filter((l) => l.kind === "media" && l.data.mode !== "watch" && l.data.mode !== "listen" && logKarma(l) > 0);
  const [rAll, rRec, sinceRAll] = sum(reads, (l) => Number(l.data.minutes) || (Number(l.data.pages) || 0) * 2 || 20);
  if (reads.length) out.push(skill("Reading", "📚", rAll, rRec, "An average reader does about 30 pages an hour.", sinceRAll));
  const study = d.logs.filter((l) => l.kind === "focus" || (l.kind === "activity" && /study|homework/i.test(String(l.data.name))));
  const [sAll, sRec, sinceSAll] = sum(study, (l) => Number(l.data.minutes) || 25);
  if (study.length) out.push(skill("Study focus", "🎯", sAll, sRec, "Deep focus is a skill too: each session makes the next one easier.", sinceSAll));
  const fit = d.logs.filter((l) => l.kind === "workout" || (l.kind === "activity" && ACTIVE_RE.test(String(l.data.name))));
  const [fAll, fRec, sinceFAll] = sum(fit, (l) => Number(l.data.minutes) || (l.kind === "workout" ? (Number(l.data.sets) || 1) * 1.5 : 20));
  if (fit.length) out.push(skill("Fitness", "💪", fAll, fRec, "3 sessions a week is the sweet spot for real progress.", sinceFAll));
  const taken = new Set(["Coding", "Reading", "Running", "Walking"]);
  for (const m of MOVES.filter((x) => x.kind === "mind" && !taken.has(x.name))) {
    const ls = d.logs.filter((l) => l.kind === "activity" && moveOf(String(l.data.name)) === m);
    if (!ls.length) continue;
    const [all, r, sinceAll] = sum(ls, (l) => Number(l.data.minutes) || 15);
    out.push(skill(m.name, "🧠", all, r, m.science, sinceAll));
  }
  return out.sort((a, b) => b.hours - a.hours);
}

// ---------- Night battle ----------
// While the hero sleeps, the day's work fights the day's demon.
export type Battle = { day: string; demon: string; demonIcon: string; why: string; hero: number; foe: number; won: boolean; gold: number; rounds: string[] };

export function battleFor(d: Data, day: string): Battle {
  const logs = d.logs.filter((l) => l.day === day);
  const xp = logs.reduce((n, l) => n + (l.xp || 0), 0);
  const h = health(d, day);
  const bad = logs.filter((l) => logKarma(l) < 0).reduce((n, l) => n + (Number(l.data.minutes) || 30), 0);
  const good = logs.filter((l) => logKarma(l) > 0).length;
  const level = progress(d.profile.xp).level;
  const e = h.energy;
  const lastSleep = logs.find((l) => l.kind === "sleep" && l.data.type !== "nap");
  const lateH = lastSleep ? new Date(String(lastSleep.data.start)).getHours() : 0;
  const foes: [boolean, string, string, string][] = [
    [bad >= 60, "Screen Demon", "👹", `${bad} min of time-pass fed it`],
    [lateH >= 0 && lateH < 5 && !!lastSleep, "Night Wraith", "👻", "late sleep made it stronger"],
    [e.intake > e.out * 1.3 && e.intake > 0, "Sugar Fiend", "🍩", `${e.intake - e.out} kcal over your need`],
    [e.burns.length === 0, "Sloth Ogre", "🦥", "no movement today"],
    [true, "Shadow of Doubt", "🌑", "it appears every night"],
  ];
  const [, demon, demonIcon, why] = foes.find(([c]) => c)!;
  const hero = Math.round(xp + h.score * 2 + good * 10);
  const foe = Math.round(60 + level * 15 + bad * 1.5 + (e.burns.length ? 0 : 40));
  const won = hero >= foe;
  let hp = 100, fhp = 100, seed = [...day].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  const moves = ["swing the blade", "cast a focus spell", "land a combo", "charge forward", "throw a kunai"];
  const rounds: string[] = [];
  for (let i = 0; i < 6 && hp > 0 && fhp > 0; i++) {
    const dmg = Math.round((hero / Math.max(1, hero + foe)) * 45 * (0.7 + rnd() * 0.6));
    const got = Math.round((foe / Math.max(1, hero + foe)) * 45 * (0.7 + rnd() * 0.6));
    fhp = Math.max(0, fhp - dmg); rounds.push(`⚔️ You ${moves[Math.floor(rnd() * moves.length)]}: -${dmg} HP (${demon} ${fhp}%)`);
    if (fhp <= 0) break;
    hp = Math.max(0, hp - got); rounds.push(`${demonIcon} ${demon} strikes: -${got} HP (you ${hp}%)`);
  }
  if (hp > 0 && fhp > 0) rounds.push(won ? `✨ Your discipline finishes it off!` : `💨 The ${demon} escapes into the dark.`);
  return { day, demon, demonIcon, why, hero, foe, won, gold: won ? 20 + Math.round(hero / 10) : 0, rounds };
}
