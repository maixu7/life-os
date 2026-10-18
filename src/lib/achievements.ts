import { byDay, dailyMissions, streak, weeklyBoss } from "@/lib/missions";
import type { Data } from "@/lib/store";

type A = { id: string; icon: string; name: string; desc: string; test: (d: Data, x: Ctx) => boolean };
type Ctx = { count: (k: string) => number; perfect: number; streak: number; spent: number; level: number };

export const ACHIEVEMENTS: A[] = [
  { id: "first-step", icon: "🌱", name: "The Journey Begins", desc: "Record your first action", test: (_, x) => x.count("*") >= 1 },
  { id: "early-bird", icon: "🐦", name: "Early Bird", desc: "Wake up before 7:00", test: (d) => d.logs.some((l) => l.kind === "wake" && String(l.data.time ?? "99") < "07:00") },
  { id: "hydrated-10", icon: "💧", name: "Water Apprentice", desc: "Drink water 10 times", test: (_, x) => x.count("water") >= 10 },
  { id: "hydrated-100", icon: "🌊", name: "Master of Tides", desc: "Drink water 100 times", test: (_, x) => x.count("water") >= 100 },
  { id: "milk-30", icon: "🥛", name: "Bones of Steel", desc: "Drink milk 30 times", test: (_, x) => x.count("milk") >= 30 },
  { id: "sleep-1", icon: "😴", name: "Rest at the Inn", desc: "Track your first sleep", test: (d) => d.logs.some((l) => l.kind === "sleep" && l.data.end) },
  { id: "sleep-8", icon: "🛌", name: "Full Recovery", desc: "Sleep 8 hours in one go", test: (d) => d.logs.some((l) => l.kind === "sleep" && l.data.end && (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) >= 8 * 3_600_000) },
  { id: "train-1", icon: "🗡️", name: "First Blood", desc: "Log your first workout", test: (_, x) => x.count("workout") >= 1 },
  { id: "train-50", icon: "🏋️", name: "Iron Will", desc: "Log 50 workout sets", test: (_, x) => x.count("workout") >= 50 },
  { id: "focus-1", icon: "📖", name: "Enter the Dojo", desc: "Finish a focus session", test: (_, x) => x.count("focus") >= 1 },
  { id: "focus-25", icon: "🧠", name: "Mind Forged", desc: "Finish 25 focus sessions", test: (_, x) => x.count("focus") >= 25 },
  { id: "focus-100", icon: "🎓", name: "Grand Scholar", desc: "Finish 100 focus sessions", test: (_, x) => x.count("focus") >= 100 },
  { id: "shop-1", icon: "🛒", name: "Supplies Acquired", desc: "Buy your first item", test: (_, x) => x.count("shopping") >= 1 },
  { id: "shop-budget", icon: "💰", name: "Wise Merchant", desc: "Stay within this month's allowance after 10 purchases", test: (d, x) => x.count("shopping") >= 10 && x.spent <= (d.profile.settings.allowances[new Date().toISOString().slice(0, 7)] ?? d.profile.settings.budget_monthly) },
  { id: "side-20", icon: "🗺️", name: "Side Quester", desc: "Complete 20 side quests", test: (_, x) => x.count("activity") >= 20 },
  { id: "perfect-1", icon: "🎆", name: "Perfect Stage", desc: "Clear every mission in one day", test: (_, x) => x.perfect >= 1 },
  { id: "perfect-7", icon: "🌟", name: "Seven Stars", desc: "7 perfect stages", test: (_, x) => x.perfect >= 7 },
  { id: "streak-3", icon: "🔥", name: "On Fire", desc: "3-day streak", test: (_, x) => x.streak >= 3 },
  { id: "streak-7", icon: "☄️", name: "Unstoppable", desc: "7-day streak", test: (_, x) => x.streak >= 7 },
  { id: "streak-30", icon: "🐉", name: "Dragon Spirit", desc: "30-day streak", test: (_, x) => x.streak >= 30 },
  { id: "boss", icon: "👑", name: "Boss Slayer", desc: "Defeat a weekly boss", test: (d) => weeklyBoss(d).defeated },
  { id: "lv5", icon: "⭐", name: "Rising Hero", desc: "Reach level 5", test: (_, x) => x.level >= 5 },
  { id: "lv20", icon: "💫", name: "Veteran", desc: "Reach level 20", test: (_, x) => x.level >= 20 },
  { id: "body", icon: "📏", name: "Know Thyself", desc: "Record your weight", test: (_, x) => x.count("body") >= 1 },
];

export function checkAchievements(d: Data): A[] {
  const ok = passing(d);
  return ACHIEVEMENTS.filter((a) => !d.profile.achievements[a.id] && ok.has(a.id));
}

// Ids of achievements whose test passes on this data.
export function passing(d: Data): Set<string> {
  const counts: Record<string, number> = {};
  for (const l of d.logs) {
    const n = l.kind === "workout" ? Number(l.data.sets ?? 1) : 1;
    counts[l.kind] = (counts[l.kind] ?? 0) + n;
  }
  const days = byDay(d.logs);
  const month = new Date().toISOString().slice(0, 7);
  const x: Ctx = {
    count: (k) => (k === "*" ? d.logs.length : counts[k] ?? 0),
    perfect: Object.values(days).filter((ls) => dailyMissions(ls, d.profile.settings).every((m) => m.done)).length,
    streak: streak(d),
    spent: d.shopping.filter((s) => s.purchased_at?.startsWith(month)).reduce((s, i) => s + Number(i.price ?? 0), 0),
    level: Math.floor(d.profile.xp / 100) + 1,
  };
  return new Set(ACHIEVEMENTS.filter((a) => a.test(d, x)).map((a) => a.id));
}
