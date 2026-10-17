import { hoursBetween, MEAL_NAMES } from "@/lib/describe";
import type { Data, Log, Settings } from "@/lib/store";
import { toDay } from "@/lib/store";

export type Mission = {
  id: string; icon: string; name: string; goal: string; reward: number; topic: string;
  progress: number; target: number; unit: string; done: boolean; href?: string;
};

const sum = (logs: Log[], kind: string, f: string) => logs.filter((l) => l.kind === kind).reduce((s, l) => s + Number(l.data[f] ?? 0), 0);

// The six daily missions. Clearing all of them is a perfect stage.
export function dailyMissions(logs: Log[], s: Settings): Mission[] {
  const woke = logs.some((l) => l.kind === "wake" || (l.kind === "activity" && /wake|woke/i.test(String(l.data.name))));
  const meals = logs.filter((l) => l.kind === "meal" || (l.kind === "activity" && MEAL_NAMES.includes(String(l.data.name).toLowerCase()))).length;
  const sets = logs.filter((l) => l.kind === "workout").reduce((n, l) => n + Number(l.data.sets ?? 1), 0)
    + logs.filter((l) => l.kind === "activity" && /exercise|gym|walk|run|football|sport|yoga/i.test(String(l.data.name))).length;
  const focus = logs.filter((l) => l.kind === "focus").length;
  const m = (x: Omit<Mission, "done">): Mission => ({ ...x, done: x.progress >= x.target });
  return [
    m({ id: "wake", icon: "🌅", name: "Rise of the Sun", goal: "Log your wake-up", reward: 30, topic: "wake", progress: woke ? 1 : 0, target: 1, unit: "" }),
    m({ id: "water", icon: "💧", name: "The Hydration Trial", goal: `Drink ${s.water_goal_ml} ml of water`, reward: 40, topic: "water", progress: sum(logs, "water", "ml"), target: s.water_goal_ml, unit: "ml" }),
    m({ id: "milk", icon: "🥛", name: "Milk of Strength", goal: `Drink ${s.milk_goal_ml} ml of milk`, reward: 25, topic: "milk", progress: sum(logs, "milk", "ml"), target: s.milk_goal_ml, unit: "ml" }),
    m({ id: "meal", icon: "🍱", name: "Fuel the Hero", goal: "Eat 3 meals", reward: 30, topic: "meal", progress: meals, target: 3, unit: "meals" }),
    m({ id: "train", icon: "⚔️", name: "Iron Body", goal: "Train or move once", reward: 50, topic: "workout", progress: Math.min(sets, 1), target: 1, unit: "", href: "/train" }),
    m({ id: "focus", icon: "📖", name: "Mind Forge", goal: "One 25-min focus session", reward: 60, topic: "focus", progress: focus, target: 1, unit: "session", href: "/focus" }),
  ];
}

// Kept for older callers.
export function dailyGoals(logs: Log[], s: Settings) {
  return dailyMissions(logs, s).map((x) => ({ id: x.id, label: x.goal, done: x.done }));
}

export function byDay(logs: Log[]) {
  const m: Record<string, Log[]> = {};
  for (const l of logs) (m[l.day] ??= []).push(l);
  return m;
}

// Days in a row (ending today or yesterday) with at least 3 missions cleared.
export function streak(data: Data) {
  const days = byDay(data.logs);
  const ok = (d: string) => dailyMissions(days[d] ?? [], data.profile.settings).filter((x) => x.done).length >= 3;
  const cur = new Date();
  if (!ok(toDay(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (ok(toDay(cur)) && n < 3650) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export const BOSSES = [
  { name: "Procrastination Demon", icon: "👹", taunt: "Just one more video… you can start tomorrow…" },
  { name: "Sleepy Slime King", icon: "🟢", taunt: "Stay in bed… the world can wait…" },
  { name: "Junk Food Dragon", icon: "🐉", taunt: "Chips are a vegetable, right?" },
  { name: "Scroll Wraith", icon: "👻", taunt: "Your phone is calling you…" },
  { name: "Shadow of Doubt", icon: "🌑", taunt: "You'll never finish all that…" },
  { name: "Lazy Oni", icon: "👺", taunt: "Skip the workout. Nobody will know." },
];

// Each week a new boss with 1500 HP. Every XP you earn this week is damage.
export function weeklyBoss(data: Data) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const start = toDay(monday);
  const week = Math.floor(monday.getTime() / (7 * 86_400_000));
  const boss = BOSSES[week % BOSSES.length];
  const hp = 1500;
  const dmg = data.logs.filter((l) => l.day >= start).reduce((s, l) => s + l.xp, 0);
  return { ...boss, hp, left: Math.max(0, hp - dmg), defeated: dmg >= hp, weekStart: start };
}

export const sleepHours = (logs: Log[]) =>
  logs.filter((l) => l.kind === "sleep" && l.data.end).reduce((s, l) => s + hoursBetween(l.data.start, l.data.end), 0);
