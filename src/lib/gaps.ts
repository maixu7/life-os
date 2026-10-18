import { ACTIVE_RE, bodyOf, energy } from "@/lib/body";
import type { Action } from "@/lib/coach";
import { logKarma } from "@/lib/karma";
import { sched } from "@/lib/schedule";
import { toDay, type Data, type Log } from "@/lib/store";

// Reads how the hero has really been living (today, the last week, month
// or year) and finds what is lacking: sleep, meals, water, study, reading,
// exercise, protein, screen time. Each gap comes with the task that fixes it.

export type Period = "day" | "week" | "month" | "year";
export const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "day", label: "Today", days: 1 }, { id: "week", label: "7 days", days: 7 }, { id: "month", label: "30 days", days: 30 }, { id: "year", label: "Year", days: 365 },
];

export type Gap = {
  id: string; icon: string; label: string; have: string; need: string; severity: number; // 0..1
  task: { title: string; why: string; action: Action; from: number; to: number }; // hours of day when the task makes sense
};

const named = (ls: Log[], re: RegExp) => ls.some((l) => (l.kind === "activity" || l.kind === "meal") && re.test(String(l.data.name)));
const mins = (l: Log, def: number) => Number(l.data.minutes) || def;

type DayStats = { sleep: number; breakfast: boolean; meals: number; water: number; read: number; study: number; move: number; protein: number; kcal: number; screen: number };

function statsFor(d: Data, day: string, logs: Log[]): DayStats {
  const e = energy(d, day);
  return {
    sleep: e.sleepH,
    breakfast: named(logs, /breakfast/i),
    meals: logs.filter((l) => (l.kind === "activity" || l.kind === "meal") && /breakfast|lunch|dinner/i.test(String(l.data.name))).length,
    water: logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0),
    read: logs.filter((l) => (l.kind === "media" && l.data.mode !== "watch" && logKarma(l) > 0) || (l.kind === "activity" && /read/i.test(String(l.data.name)))).reduce((n, l) => n + mins(l, 20), 0),
    study: logs.filter((l) => l.kind === "focus" || l.kind === "coding" || (l.kind === "activity" && /study|homework|practice/i.test(String(l.data.name)))).reduce((n, l) => n + mins(l, 25), 0),
    move: e.burns.reduce((n, b) => n + b.minutes, 0) + logs.filter((l) => l.kind === "activity" && ACTIVE_RE.test(String(l.data.name)) && !l.data.minutes).length * 15,
    protein: e.protein, kcal: e.intake,
    screen: logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((n, l) => n + mins(l, 30), 0),
  };
}

// True when today's own records already answer a gap, so a "lately" task
// doesn't come back right after the hero did it (e.g. just drank water).
export function handledToday(d: Data, id: string, now = new Date()): boolean {
  const day = toDay(now), h = now.getHours();
  const logs = d.logs.filter((l) => l.day === day);
  const t = statsFor(d, day, logs);
  const since = (re: (l: Log) => boolean, min: number) => logs.some((l) => re(l) && now.getTime() - new Date(l.created_at).getTime() < min * 60_000);
  const meal = (l: Log) => (l.kind === "activity" || l.kind === "meal") && /breakfast|lunch|dinner|snack|meal/i.test(String(l.data.name));
  const goal = d.profile.settings.water_goal_ml;
  switch (id) {
    case "water": return t.water >= goal * Math.min(1, Math.max(0.1, (h - 7) / 14)) * 0.8 || since((l) => l.kind === "water", 45);
    case "breakfast": return t.breakfast || h >= 11;
    case "meals": return since(meal, 180) || t.meals >= Math.min(3, Math.floor((h - 6) / 5));
    case "protein": return since(meal, 180);
    case "study": return t.study >= 25;
    case "read": return t.read >= 10;
    case "move": return t.move >= 15;
    case "sleep": return h < 18;
    default: return false;
  }
}

export function gaps(d: Data, period: Period, now = new Date()): { gaps: Gap[]; days: number } {
  const span = PERIODS.find((p) => p.id === period)!.days;
  const byDay = new Map<string, Log[]>();
  for (const l of d.logs) (byDay.get(l.day) ?? byDay.set(l.day, []).get(l.day)!).push(l);
  // Only days the hero actually tracked; today counts only for "Today".
  const days: DayStats[] = [];
  for (let i = period === "day" ? 0 : 1; i < (period === "day" ? 1 : span + 1); i++) {
    const day = toDay(new Date(now.getTime() - i * 86_400_000));
    const ls = byDay.get(day);
    if (ls?.some((l) => l.kind !== "login" && l.kind !== "battle")) days.push(statsFor(d, day, ls));
  }
  if (!days.length) return { gaps: [], days: 0 };
  const n = days.length;
  const avg = (k: keyof DayStats) => days.reduce((s, x) => s + Number(x[k]), 0) / n;
  const h = now.getHours();
  const s = d.profile.settings, sc = sched(s.schedule);
  const b = bodyOf(d);
  const per = period === "day" ? "today" : `a day over your last ${n} tracked day${n > 1 ? "s" : ""}`;
  const out: Gap[] = [];
  const isToday = period === "day";

  const sleepDays = days.filter((x) => x.sleep > 0);
  if (sleepDays.length) {
    const sl = sleepDays.reduce((a, x) => a + x.sleep, 0) / sleepDays.length;
    if (sl < 7) out.push({ id: "sleep", icon: "😴", label: "Sleep", have: `${sl.toFixed(1)} h ${isToday ? "last night" : "a night"}`, need: "7 to 9 h", severity: Math.min(1, (7 - sl) / 3),
      task: { title: `Sleep by ${sc.sleep} tonight`, why: "Short sleep lowers focus, mood and muscle recovery, and makes junk food cravings stronger.", action: { type: "sleep" }, from: 21, to: 27 } });
  }
  if (!isToday || h >= 11) {
    const skipped = days.filter((x) => !x.breakfast).length;
    if (skipped / n > 0.3) out.push({ id: "breakfast", icon: "🍳", label: "Breakfast", have: `skipped ${skipped} of ${n} day${n > 1 ? "s" : ""}`, need: "every morning", severity: skipped / n,
      task: { title: "Eat breakfast", why: "Breakfast refuels you after the night fast and keeps energy steady until lunch.", action: { type: "activity", name: "Breakfast" }, from: 6, to: 11 } });
  }
  const meals = avg("meals");
  if ((!isToday || h >= 21) && meals < 2.5) out.push({ id: "meals", icon: "🍱", label: "Regular meals", have: `${meals.toFixed(1)} meals ${per}`, need: "3 meals", severity: Math.min(1, (3 - meals) / 3),
    task: { title: "Eat a proper meal", why: "Skipping meals leads to overeating and snacking later.", action: { type: "activity", name: h < 16 ? "Lunch" : "Dinner" }, from: 12, to: 22 } });
  const water = avg("water");
  const wantWater = isToday ? s.water_goal_ml * Math.min(1, Math.max(0, (h - 7) / 14)) : s.water_goal_ml;
  if (water < wantWater * 0.8) out.push({ id: "water", icon: "💧", label: "Water", have: `${Math.round(water)} ml ${per}`, need: `${s.water_goal_ml} ml a day`, severity: Math.min(1, 1 - water / Math.max(1, wantWater)),
    task: { title: "Drink a glass of water", why: "Even 2% dehydration makes you tired and less focused.", action: { type: "water" }, from: 7, to: 22 } });
  const study = avg("study");
  const wantStudy = isToday ? (h >= 20 ? 60 : h >= 15 ? 30 : 0) : 60;
  if (wantStudy && study < wantStudy) out.push({ id: "study", icon: "🎯", label: "Study / main focus", have: `${Math.round(study)} min ${per}`, need: "60+ min a day", severity: Math.min(1, 1 - study / wantStudy) * 1.1,
    task: { title: "Do a focus session on your main goal", why: "Your main focus is what changes your future. One deep 25-minute session beats hours of half-work.", action: { type: "href", href: "/focus" }, from: 8, to: 22 } });
  const read = avg("read");
  if ((!isToday || h >= 19) && read < 15) out.push({ id: "read", icon: "📚", label: "Reading", have: `${Math.round(read)} min ${per}`, need: `${sc.readGoal} pages (about 15 min)`, severity: Math.min(1, 1 - read / 15) * 0.7,
    task: { title: `Read ${sc.readGoal} pages`, why: "Ten pages a day is about 18 books a year.", action: { type: "library" }, from: 7, to: 23 } });
  const moveDays = days.filter((x) => x.move >= 15).length;
  if (isToday ? h >= 17 && days[0].move < 15 : moveDays / n < 3 / 7) out.push({ id: "move", icon: "🏃", label: "Exercise", have: isToday ? `${Math.round(days[0].move)} active min today` : `${moveDays} active day${moveDays === 1 ? "" : "s"} of ${n}`, need: "30 min, 3+ days a week", severity: isToday ? 0.6 : Math.min(1, 1 - moveDays / n / (3 / 7)),
    task: { title: "Move for 20 minutes", why: "Exercise is the strongest natural mood booster and keeps your heart young.", action: { type: "href", href: "/train" }, from: 6, to: 21 } });
  const foodDays = days.filter((x) => x.kcal > 0);
  if (foodDays.length >= (isToday ? 1 : 2) && (!isToday || h >= 20)) {
    const pr = foodDays.reduce((a, x) => a + x.protein, 0) / foodDays.length;
    if (pr < b.proteinNeed * 0.8) out.push({ id: "protein", icon: "🥚", label: "Protein", have: `${Math.round(pr)} g ${per}`, need: `${b.proteinNeed} g a day`, severity: Math.min(1, 1 - pr / b.proteinNeed),
      task: { title: "Add protein: eggs, dal, paneer, milk or chana", why: "Protein repairs and builds muscle. Without enough, training gains stall.", action: { type: "activity", name: h < 11 ? "Breakfast" : h < 16 ? "Lunch" : "Dinner" }, from: 7, to: 22 } });
  }
  const screen = avg("screen");
  if (screen > sc.screenLimit) out.push({ id: "screen", icon: "📱", label: "Too much time-pass", have: `${Math.round(screen)} min ${per}`, need: `under ${sc.screenLimit} min`, severity: Math.min(1, (screen - sc.screenLimit) / sc.screenLimit),
    task: { title: "Swap the screen for 10 pages or a walk", why: "Time-pass feels like rest but leaves your brain more tired.", action: { type: "library" }, from: 8, to: 23 } });

  return { gaps: out.sort((a, b) => b.severity - a.severity), days: n };
}
