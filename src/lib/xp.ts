export const RANKS = [
  { name: "E", title: "Rookie", min: 0 },
  { name: "D", title: "Apprentice", min: 300 },
  { name: "C", title: "Warrior", min: 900 },
  { name: "B", title: "Elite", min: 2000 },
  { name: "A", title: "Ace", min: 4000 },
  { name: "S", title: "Hero", min: 7500 },
  { name: "SS", title: "Legend", min: 12000 },
  { name: "SSS", title: "Shogun", min: 20000 },
];

// Every 100 XP is a level; ranks unlock at the thresholds above.
export function progress(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const idx = RANKS.findLastIndex((r) => xp >= r.min);
  const rank = RANKS[idx];
  const next = RANKS[idx + 1];
  return { level, levelPct: xp % 100, rank, next, rankPct: next ? ((xp - rank.min) / (next.min - rank.min)) * 100 : 100 };
}

export const XP: Record<string, number> = {
  water: 5, milk: 5, meal: 10, wake: 15, sleep: 15, reading: 15, listening: 10, media: 15, coding: 20, workout: 20, focus: 40, shopping: 5, activity: 10, use: 3, body: 10, bonus: 0, chest: 0, redeem: 0, battle: 0, sick: 0,
};

// Each attribute on the radar chart grows from these kinds of logs.
export const ATTRIBUTES: { key: string; label: string; kinds: string[] }[] = [
  { key: "str", label: "Strength", kinds: ["workout"] },
  { key: "vit", label: "Vitality", kinds: ["water", "milk", "meal"] },
  { key: "int", label: "Intellect", kinds: ["reading", "focus", "media", "coding"] },
  { key: "spi", label: "Spirit", kinds: ["listening", "wake", "activity"] },
  { key: "end", label: "Endurance", kinds: ["sleep"] },
];

export const UNLOCKS = [
  { id: "theme-sakura", label: "Sakura theme", level: 3 },
  { id: "theme-ocean", label: "Ocean theme", level: 6 },
  { id: "theme-inferno", label: "Inferno theme", level: 10 },
  { id: "aura-gold", label: "Golden aura", level: 15 },
];

export const BADGES = [
  { id: "first-step", icon: "🌱", label: "First Step", test: (s: Stats) => s.total >= 1 },
  { id: "hydrated", icon: "💧", label: "Hydration Master", test: (s: Stats) => (s.kinds.water ?? 0) >= 50 },
  { id: "iron", icon: "🏋️", label: "Iron Will", test: (s: Stats) => (s.kinds.workout ?? 0) >= 30 },
  { id: "scholar", icon: "📚", label: "Scholar", test: (s: Stats) => (s.kinds.focus ?? 0) >= 20 },
  { id: "early", icon: "🌅", label: "Early Riser", test: (s: Stats) => (s.kinds.wake ?? 0) >= 7 },
  { id: "perfect", icon: "🎆", label: "Perfect Day", test: (s: Stats) => s.perfectDays >= 1 },
];
export type Stats = { total: number; kinds: Record<string, number>; perfectDays: number };
