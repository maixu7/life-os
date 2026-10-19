import type { Action, Task } from "@/lib/coach";
import { goalsOn, sched } from "@/lib/schedule";
import { toDay, type CustomItem, type Data, type Log } from "@/lib/store";
import { isStudy } from "@/lib/worst";

// Tasks you make yourself (items category "task"). They show up exactly like
// Sensei's own tasks: same card, same popup and phone reminder, same button
// that opens the right place, and they tick off from what you log there.

export type Area = "water" | "drink" | "meal" | "study" | "coding" | "reading" | "workout" | "sleep" | "shopping" | "other";
export type Level = "easy" | "normal" | "hard";
export type MyTask = {
  area: Area; time: string; days: number[]; date?: string; level: Level; amount?: number; note?: string;
};

// icon, label, unit of the amount, what the task button opens
export const AREAS: Record<Area, { icon: string; label: string; unit: string; action: (name: string, h: number) => Action }> = {
  water: { icon: "💧", label: "Water", unit: "ml", action: () => ({ type: "water" }) },
  drink: { icon: "🥤", label: "Drink", unit: "ml", action: () => ({ type: "water" }) },
  meal: { icon: "🍱", label: "Food", unit: "meals", action: (_, h) => ({ type: "activity", name: h < 11 ? "Breakfast" : h < 16 ? "Lunch" : "Dinner" }) },
  study: { icon: "📖", label: "Study", unit: "min", action: () => ({ type: "href", href: "/focus" }) },
  coding: { icon: "💻", label: "Coding", unit: "min", action: () => ({ type: "activity", name: "Coding" }) },
  reading: { icon: "📚", label: "Reading", unit: "pages", action: () => ({ type: "library" }) },
  workout: { icon: "🏋️", label: "Workout", unit: "sets", action: () => ({ type: "href", href: "/train" }) },
  sleep: { icon: "😴", label: "Sleep", unit: "", action: () => ({ type: "sleep" }) },
  shopping: { icon: "🛒", label: "Shopping", unit: "items", action: () => ({ type: "href", href: "/shop" }) },
  other: { icon: "⭐", label: "Other", unit: "", action: (name) => ({ type: "activity", name }) },
};
export const LEVELS: Record<Level, { label: string; k: number; priority: number }> = {
  easy: { label: "🙂 Easy", k: 0.75, priority: 50 },
  normal: { label: "💪 Normal", k: 1, priority: 62 },
  hard: { label: "🔥 Hard", k: 1.5, priority: 74 },
};
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const taskOf = (i: CustomItem): MyTask => ({
  area: (i.config.area as Area) in AREAS ? (i.config.area as Area) : "other",
  time: /^\d\d:\d\d$/.test(String(i.config.time)) ? String(i.config.time) : "09:00",
  days: Array.isArray(i.config.days) ? (i.config.days as number[]) : [0, 1, 2, 3, 4, 5, 6],
  date: typeof i.config.date === "string" && i.config.date ? i.config.date : undefined,
  level: (i.config.level as Level) in LEVELS ? (i.config.level as Level) : "normal",
  amount: Number(i.config.amount) || undefined,
  note: typeof i.config.note === "string" ? i.config.note : undefined,
});

// On this day? A dated task is for that date only; otherwise its weekdays.
export const dueOn = (t: MyTask, d: Date) => (t.date ? t.date === toDay(d) : t.days.includes(d.getDay()));

// How much was done for this area in these logs.
function measure(area: Area, name: string, ls: Log[], d: Data, day: string): number {
  const n = (l: Log, k: string) => Number(l.data[k]) || 0;
  switch (area) {
    case "water": return ls.filter((l) => l.kind === "water").reduce((s, l) => s + n(l, "ml"), 0);
    case "drink": return ls.filter((l) => l.kind === "water" || l.kind === "drink" || l.kind === "milk").reduce((s, l) => s + n(l, "ml"), 0);
    case "meal": return ls.filter((l) => l.kind === "activity" && (Array.isArray(l.data.foods) || /breakfast|lunch|dinner|snack|meal/i.test(String(l.data.name)))).length;
    case "study": return ls.filter(isStudy).reduce((s, l) => s + (n(l, "minutes") || 25), 0);
    case "coding": return ls.filter((l) => l.kind === "coding" || (l.kind === "activity" && /cod(e|ing)|program/i.test(String(l.data.name)))).reduce((s, l) => s + (n(l, "minutes") || 30), 0);
    case "reading": return ls.filter((l) => l.kind === "media" && l.data.mode !== "watch").reduce((s, l) => s + (n(l, "pages") || 1), 0);
    case "workout": return ls.filter((l) => l.kind === "workout").reduce((s, l) => s + (n(l, "sets") || 1), 0);
    case "sleep": return ls.filter((l) => l.kind === "sleep").length;
    case "shopping": return d.shopping.filter((s) => s.status === "purchased" && s.purchased_at && toDay(new Date(s.purchased_at)) === day).length;
    default: return ls.filter((l) => String(l.data.name ?? l.data.title ?? "").toLowerCase() === name.toLowerCase()).length;
  }
}

/** Today's target: the amount × level, and more on days off (like Sensei's own goals). */
export function targetOf(t: MyTask, d: Data, now: Date) {
  if (!t.amount) return undefined;
  const g = goalsOn(sched(d.profile.settings.schedule), now);
  return Math.max(1, Math.round(t.amount * LEVELS[t.level].k * g.k));
}

/** Your own tasks that are due now and not done yet, as Sensei tasks. */
export function myTasks(d: Data, now = new Date()): Task[] {
  const day = toDay(now);
  const mins = now.getHours() * 60 + now.getMinutes();
  const out: Task[] = [];
  for (const i of d.items.filter((x) => x.category === "task")) {
    const t = taskOf(i);
    if (!dueOn(t, now)) continue;
    const [hh, mm] = t.time.split(":").map(Number);
    if (mins < hh * 60 + mm) continue;
    // Only what you did from the task's time on counts.
    const since = new Date(`${day}T${t.time}:00`).getTime();
    const ls = d.logs.filter((l) => l.day === day && new Date(l.created_at).getTime() >= since);
    const want = targetOf(t, d, now);
    const got = measure(t.area, i.name, ls, d, day);
    if (got >= (want ?? 1)) continue;
    const a = AREAS[t.area];
    const left = want ? ` (${want - got} ${a.unit} to go)` : "";
    out.push({
      id: `my:${i.id}`, icon: a.icon, priority: LEVELS[t.level].priority, action: a.action(i.name, now.getHours()),
      title: `${i.name}${want && got ? left : want ? ` · ${want} ${a.unit}` : ""}`,
      because: `Your own task for ${t.date ?? DAY_NAMES[now.getDay()]} at ${t.time} (${LEVELS[t.level].label.slice(3)}${goalsOn(sched(d.profile.settings.schedule), now).off && want ? ", day off so more" : ""}).`,
      why: t.note || `You set this one yourself. ${a.label} done now counts.`,
    });
  }
  return out;
}
