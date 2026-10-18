import { bodyOf, eaten, type Eaten } from "@/lib/body";
import { groupsOf, type Group } from "@/lib/care";
import { haveFoods } from "@/lib/have";
import { logKarma, mediaTypeOf } from "@/lib/karma";
import { sched } from "@/lib/schedule";
import { toDay, type Data, type Log, type StudyItem } from "@/lib/store";

// Your worst habits, ranked by how much they put you at risk, each with one
// small task for today that you repeat every day until the habit improves.
// Also: the exam study plan (what and how much), the "study first" lock, and
// what to eat next.

const MIN = (l: Log, def = 30) => Number(l.data.minutes) || def;
const dayKey = (now: Date, back: number) => toDay(new Date(now.getTime() - back * 86_400_000));

// ---- Study plan and the "study first" lock ----

const STUDY_RE = /study|homework|revision|revise|exam|practice|kanji|lesson|class|course|past paper|mock test|notes|chapter|tuition|lecture/i;
export const isStudy = (l: Log) =>
  ["focus", "paper", "cards"].includes(l.kind) || (l.kind === "activity" && STUDY_RE.test(String(l.data.name ?? ""))) ||
  (l.kind === "media" && ["study", "course"].includes(mediaTypeOf(l)));
const studyText = (l: Log) => `${l.data.subject ?? ""} ${l.data.name ?? ""} ${l.data.title ?? ""} ${l.data.note ?? ""}`.toLowerCase();
const matches = (l: Log, s: StudyItem) => {
  const t = studyText(l), sub = s.subject.trim().toLowerCase();
  return !!sub && (t.includes(sub) || sub.split(/\s+/).some((w) => w.length > 3 && t.includes(w)));
};

export type StudyDone = { item: StudyItem; mins: number; pages: number; done: boolean };
export type StudyDay = { items: StudyDone[]; mins: number; goal: number; left: number; done: boolean; fun: number; next?: StudyItem };

export function studyDay(d: Data, day = toDay(new Date())): StudyDay {
  const plan = d.profile.settings.study_plan ?? [];
  const logs = d.logs.filter((l) => l.day === day);
  const study = logs.filter(isStudy);
  const used = new Set<string>();
  const items = plan.map((item) => {
    const mine = study.filter((l) => matches(l, item));
    mine.forEach((l) => used.add(l.id));
    return { item, mins: mine.reduce((n, l) => n + MIN(l, 25), 0), pages: mine.reduce((n, l) => n + (Number(l.data.pages) || 0), 0), done: false };
  });
  // Study logged without a subject fills the plan in order.
  let free = study.filter((l) => !used.has(l.id)).reduce((n, l) => n + MIN(l, 25), 0);
  for (const x of items) { const take = Math.min(free, Math.max(0, x.item.mins - x.mins)); x.mins += take; free -= take; }
  for (const x of items) x.done = x.mins >= x.item.mins && (!x.item.pages || x.pages >= x.item.pages || x.mins >= x.item.mins * 1.5);
  const goal = plan.reduce((n, x) => n + x.mins, 0) || (d.profile.settings.exam_date ? sched(d.profile.settings.schedule).learnGoal : 0);
  const mins = study.reduce((n, l) => n + MIN(l, 25), 0);
  const fun = logs.filter((l) => (l.kind === "media" || l.kind === "activity") && logKarma(l) < 0).reduce((n, l) => n + MIN(l), 0);
  const done = plan.length ? items.every((x) => x.done) : mins >= goal;
  return { items, mins, goal, left: Math.max(0, goal - mins), done, fun, next: items.find((x) => !x.done)?.item };
}

export const daysToExam = (d: Data, now = new Date()) => {
  const e = d.profile.settings.exam_date;
  if (!e) return null;
  const n = Math.ceil((new Date(`${e}T00:00:00`).getTime() - new Date(`${toDay(now)}T00:00:00`).getTime()) / 86_400_000);
  return n >= 0 ? n : null;
};

// Is fun locked right now? On when there is a study plan (or an exam date)
// and today's study is not done yet. You can turn the lock off.
export type Gate = { locked: boolean; left: number; next?: StudyItem; exam: number | null; text: string };
export function studyGate(d: Data, now = new Date()): Gate {
  const s = studyDay(d, toDay(now));
  const exam = daysToExam(d, now);
  const on = d.profile.settings.study_lock !== false && (!!d.profile.settings.study_plan?.length || exam != null);
  const locked = on && s.goal > 0 && !s.done;
  const examTxt = exam != null ? (exam === 0 ? "Your exam is TODAY. " : `Exam in ${exam} day${exam === 1 ? "" : "s"}. `) : "";
  const text = locked ? `${examTxt}Study first: ${s.left || "a few"} more minutes today${s.next ? ` (next: ${s.next.subject}${s.next.what ? `, ${s.next.what}` : ""})` : ""}. Anime, manga, games and scrolling come after.` : "";
  return { locked, left: s.left, next: s.next, exam, text };
}

// ---- Worst habits ----

export type Risk = {
  id: string; icon: string; name: string; have: string; goal: string; risk: number;
  why: string; today: string; doneToday: boolean; progress: string; streak: number; href: string;
};

type DayView = { logs: Log[]; foods: Eaten[]; count: (g: Group) => number };
const view = (d: Data, day: string): DayView => {
  const logs = d.logs.filter((l) => l.day === day);
  const foods = eaten(logs, d.items);
  return { logs, foods, count: (g) => foods.filter((f) => groupsOf(f).includes(g)).reduce((n, f) => n + (f.qty || 1), 0) };
};
const sugaryDrinks = (v: DayView) =>
  v.logs.filter((l) => l.kind === "drink" && (Number(l.data.sugar) >= 10 || /\bcola\b|coca.?cola|coke|pepsi|soda|energy|red bull|monster|fanta|sprite|juice/i.test(String(l.data.name)))).length +
  v.foods.filter((f) => groupsOf(f).includes("sugary") && !v.logs.some((l) => l.kind === "drink" && l.data.name === f.name)).length;
const snacks = (v: DayView) => v.count("sweets") + v.count("fried");
const funMin = (v: DayView) => v.logs.filter((l) => (l.kind === "media" || l.kind === "activity") && logKarma(l) < 0).reduce((n, l) => n + MIN(l), 0);
const studyMin = (v: DayView) => v.logs.filter(isStudy).reduce((n, l) => n + MIN(l, 25), 0);
const moved = (v: DayView) => v.logs.some((l) => l.kind === "workout" || (l.kind === "activity" && /run|walk|gym|exercise|sport|yoga|swim|cycl|football|push.?up|squat/i.test(String(l.data.name))));
const sleepH = (v: DayView) => {
  const s = v.logs.find((l) => l.kind === "sleep" && l.data.end);
  return s ? (new Date(String(s.data.end)).getTime() - new Date(String(s.data.start)).getTime()) / 3.6e6 : null;
};

type Def = {
  id: string; icon: string; name: string; why: string; href: string;
  // How bad it is over the last 7 days (0 to 100), and what you have vs the goal.
  score: (days: DayView[], d: Data) => { risk: number; have: string; goal: string } | null;
  // Today's fix task and whether a given day met it.
  today: (d: Data) => string; met: (v: DayView, d: Data) => boolean; progress: (v: DayView, d: Data) => string;
};

const fed = (days: DayView[]) => days.filter((v) => v.foods.length > 0);

const DEFS: Def[] = [
  {
    id: "fun", icon: "📺", name: "Anime, manga, games and scrolling before study", href: "/learn",
    why: "Your free time goes to time-pass instead of your exam and future. Every hour now is a better result later.",
    score: (days, d) => {
      const fun = days.reduce((n, v) => n + funMin(v), 0) / 7, st = days.reduce((n, v) => n + studyMin(v), 0) / 7;
      const exam = daysToExam(d);
      if (fun < 30 && st >= 30) return null;
      const risk = Math.min(100, fun / 3 + (fun > st ? 25 : 0) + (exam != null && exam <= 60 ? 25 : 0) + (st < 30 ? 15 : 0));
      return { risk, have: `${Math.round(fun)} min fun vs ${Math.round(st)} min study a day`, goal: "study first, fun max 60 min" };
    },
    today: (d) => { const g = studyDay(d).goal || 60; return `Study ${g} min first, then max 60 min of anime/manga/games`; },
    met: (v, d) => studyMin(v) >= Math.max(30, studyDay(d, v.logs[0]?.day).goal || 60) && funMin(v) <= 60,
    progress: (v, d) => `${studyMin(v)}/${studyDay(d).goal || 60} min study · ${funMin(v)} min fun`,
  },
  {
    id: "cola", icon: "🥤", name: "Cola and sugary drinks", href: "/food",
    why: "Liquid sugar goes straight to blood sugar: weight gain, tooth decay, diabetes risk, energy crashes. One cola is about 35 g sugar, more than a whole day's ideal.",
    score: (days) => { const n = days.reduce((a, v) => a + sugaryDrinks(v), 0); return n >= 2 ? { risk: Math.min(100, n * 12), have: `${n} this week`, goal: "0 to 1 a week" } : null; },
    today: () => "No cola or sweet drinks today: water, barley tea or milk instead",
    met: (v) => sugaryDrinks(v) === 0, progress: (v) => { const n = sugaryDrinks(v); return `${n} sweet drink${n === 1 ? "" : "s"} today`; },
  },
  {
    id: "snacks", icon: "🍪", name: "Snacks, biscuits, chips and fried food", href: "/food",
    why: "Mostly sugar, white flour, salt and cheap fat with almost no vitamins. They fill you up so you skip real food.",
    score: (days) => { const n = days.reduce((a, v) => a + snacks(v), 0); return n >= 4 ? { risk: Math.min(100, n * 7), have: `${n} this week`, goal: "3 or less a week" } : null; },
    today: () => "Max 1 snack today; swap the rest for fruit, nuts, yogurt or a boiled egg",
    met: (v) => snacks(v) <= 1, progress: (v) => { const n = snacks(v); return `${n} snack${n === 1 ? "" : "s"} today`; },
  },
  {
    id: "veg", icon: "🥦", name: "Too few vegetables", href: "/food",
    why: "Vegetables bring fibre, vitamins A, C, K, folate and potassium. Low intake means weak gut, poor skin and higher heart and cancer risk over the years.",
    score: (days) => { const f = fed(days); if (f.length < 2) return null; const ok = f.filter((v) => v.count("veg") >= 2).length; return ok < f.length * 0.7 ? { risk: (1 - ok / f.length) * 70, have: `${ok}/${f.length} days with 2+ portions`, goal: "every day, 3 to 5 portions" } : null; },
    today: () => "Eat 2 portions of vegetables today (salad, cooked veg, miso soup, raw cucumber or carrot)",
    met: (v) => v.count("veg") >= 2, progress: (v) => `${v.count("veg")}/2 vegetable portions`,
  },
  {
    id: "protein", icon: "🍗", name: "Not enough protein", href: "/food",
    why: "Protein rebuilds muscle, skin, hair and immune cells. Too little means weak muscles, slow recovery and always feeling hungry.",
    score: (days, d) => {
      const f = fed(days); if (f.length < 2) return null;
      const need = bodyOf(d).proteinNeed, avg = f.reduce((n, v) => n + v.foods.reduce((a, x) => a + (x.protein || 0), 0), 0) / f.length;
      return avg < need ? { risk: Math.min(90, (1 - avg / need) * 100), have: `${Math.round(avg)} g a day`, goal: `${need} g or more` } : null;
    },
    today: (d) => `Eat ${bodyOf(d).proteinNeed} g protein: an egg or meat/fish/tofu in every meal`,
    met: (v, d) => v.foods.reduce((a, x) => a + (x.protein || 0), 0) >= bodyOf(d).proteinNeed,
    progress: (v, d) => `${Math.round(v.foods.reduce((a, x) => a + (x.protein || 0), 0))}/${bodyOf(d).proteinNeed} g protein`,
  },
  {
    id: "fruit", icon: "🍎", name: "Too little fruit", href: "/food",
    why: "Whole fruit gives vitamin C, fibre and antioxidants, and it is the healthy answer to a sweet craving.",
    score: (days) => { const f = fed(days); if (f.length < 3) return null; const ok = f.filter((v) => v.count("fruit") >= 1).length; return ok < f.length * 0.5 ? { risk: (1 - ok / f.length) * 45, have: `${ok}/${f.length} days`, goal: "1 to 2 fruits every day" } : null; },
    today: () => "Eat 1 whole fruit today (banana, apple, orange, kiwi)",
    met: (v) => v.count("fruit") >= 1, progress: (v) => `${v.count("fruit")}/1 fruit`,
  },
  {
    id: "sleep", icon: "😴", name: "Short or late sleep", href: "/",
    why: "Sleep is when memory is saved and muscles repair. Under 7 hours makes study stick less, raises hunger for junk and weakens immunity.",
    score: (days, d) => {
      const hs = days.map(sleepH).filter((x): x is number => x != null); if (hs.length < 2) return null;
      const avg = hs.reduce((a, b) => a + b, 0) / hs.length, goal = d.profile.settings.sleep_goal_h;
      return avg < goal - 0.5 ? { risk: Math.min(90, (goal - avg) * 25), have: `${avg.toFixed(1)} h a night`, goal: `${goal} h` } : null;
    },
    today: (d) => `In bed by ${sched(d.profile.settings.schedule).sleep}, phone away 30 min before`,
    met: (v, d) => (sleepH(v) ?? 0) >= d.profile.settings.sleep_goal_h - 0.5, progress: (v) => { const h = sleepH(v); return h ? `slept ${h.toFixed(1)} h` : "sleep not logged yet"; },
  },
  {
    id: "move", icon: "🏋️", name: "Not enough exercise", href: "/train",
    why: "Sitting all day weakens heart, back and mood. Exercise is the strongest medicine for long life and also improves focus for study.",
    score: (days) => { const n = days.filter(moved).length; return n < 3 ? { risk: (4 - n) * 15, have: `${n} days this week`, goal: "4 days a week" } : null; },
    today: () => "Do today's workout on the Train tab (20 min is enough)",
    met: moved, progress: (v) => (moved(v) ? "moved today ✓" : "no exercise yet"),
  },
  {
    id: "water", icon: "💧", name: "Not drinking enough water", href: "/food",
    why: "Even mild dehydration causes headaches, tiredness and poor focus, and makes constipation worse.",
    score: (days, d) => {
      const ml = days.map((v) => v.logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0)).filter((x) => x > 0);
      if (ml.length < 2) return null; const avg = ml.reduce((a, b) => a + b, 0) / ml.length, goal = d.profile.settings.water_goal_ml;
      return avg < goal * 0.7 ? { risk: (1 - avg / goal) * 50, have: `${Math.round(avg)} ml a day`, goal: `${goal} ml` } : null;
    },
    today: (d) => `Drink ${d.profile.settings.water_goal_ml} ml of water (a glass every 2 hours)`,
    met: (v, d) => v.logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0) >= d.profile.settings.water_goal_ml * 0.9,
    progress: (v, d) => `${v.logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0)}/${d.profile.settings.water_goal_ml} ml`,
  },
];

export function worst(d: Data, now = new Date()): Risk[] {
  const week = Array.from({ length: 7 }, (_, i) => view(d, dayKey(now, i)));
  const today = week[0];
  const out: Risk[] = [];
  // Too little logged to judge habits yet.
  if (week.filter((v) => v.logs.length >= 2).length < 2) return out;
  for (const def of DEFS) {
    const s = def.score(week, d);
    if (!s || s.risk < 12) continue;
    // Streak: days in a row (before today) the fix task was met.
    let streak = 0;
    for (let i = 1; i < 30; i++) { const v = view(d, dayKey(now, i)); if (!v.logs.length || !def.met(v, d)) break; streak++; }
    const doneToday = def.met(today, d);
    out.push({ id: def.id, icon: def.icon, name: def.name, have: s.have, goal: s.goal, risk: Math.round(s.risk), why: def.why, today: def.today(d), doneToday, progress: def.progress(today, d), streak: streak + (doneToday ? 1 : 0), href: def.href });
  }
  return out.sort((a, b) => b.risk - a.risk);
}
export const riskLevel = (r: number) => (r >= 60 ? ["High", "text-rose-300", "bg-rose-500"] : r >= 35 ? ["Medium", "text-amber-300", "bg-amber-400"] : ["Low", "text-sky-300", "bg-sky-400"]) as [string, string, string];

// ---- What to eat next ----

export type EatNext = { icon: string; what: string; why: string; have: string[]; avoid?: boolean };
export function eatNext(d: Data, now = new Date()): EatNext[] {
  const v = view(d, toDay(now));
  const h = now.getHours();
  const need = bodyOf(d).proteinNeed;
  const prot = v.foods.reduce((a, x) => a + (x.protein || 0), 0);
  const sugar = v.foods.reduce((a, x) => a + (x.sugar || 0), 0);
  const pantry = haveFoods(d.pantry).map((p) => p.name);
  const mine = (gs: Group[]) => pantry.filter((n) => groupsOf({ name: n }).some((g) => gs.includes(g))).slice(0, 4);
  const out: (EatNext & { p: number })[] = [];
  // How much of the day is gone: by evening you should be most of the way there.
  const part = Math.min(1, Math.max(0.3, (h - 6) / 14));
  if (prot < need * part) out.push({ p: 90 * (1 - prot / need), icon: "🍗", what: `Protein: ${Math.round(need - prot)} g more today`, why: "eggs, chicken, fish, tofu, natto, dal, milk or Greek yogurt", have: mine(["egg", "meat", "fish", "legume", "dairy"]) });
  const veg = v.count("veg");
  if (veg < 3 * part) out.push({ p: 80 - veg * 20, icon: "🥦", what: `Vegetables: ${Math.max(1, 3 - veg)} more portions`, why: "a salad, cooked greens, miso soup, or raw cucumber, carrot or tomato", have: mine(["veg"]) });
  if (v.count("fruit") < 1 && h >= 10) out.push({ p: 50, icon: "🍎", what: "1 whole fruit", why: "vitamin C and fibre; the best answer to a sweet craving", have: mine(["fruit"]) });
  if (v.count("dairy") < 1 && h >= 12) out.push({ p: 35, icon: "🥛", what: "A glass of milk or a yogurt", why: "calcium for bones and teeth", have: mine(["dairy"]) });
  if (v.count("legume") + v.count("fish") < 1 && h >= 15) out.push({ p: 30, icon: "🫘", what: "Beans, tofu or fish at dinner", why: "fibre, iron and omega-3", have: mine(["legume", "fish"]) });
  if (v.count("grain") < 1 && h >= 11) out.push({ p: 20, icon: "🌾", what: "Whole grains (oats, brown rice, whole-wheat roti)", why: "slow energy and fibre, no sugar crash", have: mine(["grain"]) });
  const sn = snacks(v), sd = sugaryDrinks(v);
  if (sn >= 2 || sd >= 1 || sugar >= 40) out.push({ p: 85, avoid: true, icon: "🚫", what: `No more ${sd ? "sweet drinks" : ""}${sd && sn >= 2 ? " or " : ""}${sn >= 2 ? "snacks" : ""}${!sd && sn < 2 ? "sugar" : ""} today`, why: `you already had ${[sd && `${sd} sweet drink${sd > 1 ? "s" : ""}`, sn && `${sn} snack${sn > 1 ? "s" : ""}`, sugar >= 40 && `${Math.round(sugar)} g sugar`].filter(Boolean).join(", ")}`, have: [] });
  return out.sort((a, b) => b.p - a.p).map((x) => ({ icon: x.icon, what: x.what, why: x.why, have: x.have, avoid: x.avoid }));
}
