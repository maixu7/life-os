import { MEDIA, type MediaType } from "@/lib/media";
import type { Data, Log } from "@/lib/store";
import { sleepHours } from "@/lib/missions";
import { toDay } from "@/lib/store";
import { SKILL_TITLES } from "@/lib/skilltree";

// Gold: half of all XP you earn, plus chest loot, minus what you spend on rewards.
export function gold(d: Data) {
  let g = 0;
  for (const l of d.logs) {
    if (l.kind === "chest" || l.kind === "spin" || l.kind === "login" || l.kind === "battle" || l.kind === "loot" || l.kind === "rival") g += Number(l.data.gold ?? 0);
    else if (l.kind === "redeem") g -= Number(l.data.cost ?? 0);
    else g += l.xp / 2;
  }
  return Math.floor(g);
}

export const DEFAULT_REWARDS: [string, number, string][] = [
  ["1 anime episode", 60, "📺"], ["1 manga chapter", 40, "📕"], ["30 min gaming", 80, "🎮"],
  ["Favorite snack", 100, "🍫"], ["Movie night", 300, "🎬"], ["Sleep in 1 hour", 150, "🛌"],
];

export function chestOpenedToday(d: Data) {
  const day = toDay(new Date());
  return d.logs.some((l) => l.kind === "chest" && l.day === day);
}
export function rollChest(streakDays: number) {
  const base = 10 + Math.floor(Math.random() * 30);
  const bonus = Math.min(50, streakDays * 5);
  const rare = Math.random() < 0.1;
  return { gold: base + bonus + (rare ? 100 : 0), rare };
}

// Hero vitals for the HUD, 0..100.
export function vitals(d: Data, todays: Log[]) {
  const s = d.profile.settings;
  const yesterday = toDay(new Date(Date.now() - 86_400_000));
  const sleepLogs = d.logs.filter((l) => l.kind === "sleep" && l.data.end && (l.day === yesterday || l.day === toDay(new Date())));
  const hp = Math.min(100, Math.round((sleepHours(sleepLogs) / s.sleep_goal_h) * 100));
  const water = todays.filter((l) => l.kind === "water").reduce((n, l) => n + Number(l.data.ml ?? 0), 0);
  const sta = Math.min(100, Math.round((water / s.water_goal_ml) * 100));
  const focusMin = todays.filter((l) => l.kind === "focus" || l.kind === "reading" || (l.kind === "media" && MEDIA[l.data.type as MediaType]?.good)).reduce((n, l) => n + Number(l.data.minutes ?? 0), 0);
  const mp = Math.min(100, Math.round((focusMin / 50) * 100));
  return { hp, mp, sta };
}

export const TITLES: { title: string; need: string; test: (d: Data) => boolean }[] = [
  { title: "Rookie Adventurer", need: "Start", test: () => true },
  { title: "Early Riser", need: "Achievement: Early Bird", test: (d) => !!d.profile.achievements["early-bird"] },
  { title: "Water Sage", need: "Achievement: Master of Tides", test: (d) => !!d.profile.achievements["hydrated-100"] },
  { title: "Iron Fist", need: "Achievement: Iron Will", test: (d) => !!d.profile.achievements["train-50"] },
  { title: "Scholar of the Dojo", need: "Achievement: Mind Forged", test: (d) => !!d.profile.achievements["focus-25"] },
  { title: "Wise Merchant", need: "Achievement: Wise Merchant", test: (d) => !!d.profile.achievements["shop-budget"] },
  { title: "Boss Slayer", need: "Defeat a weekly boss", test: (d) => !!d.profile.achievements.boss },
  { title: "Flame Walker", need: "7-day streak", test: (d) => !!d.profile.achievements["streak-7"] },
  { title: "Dragon Spirit", need: "30-day streak", test: (d) => !!d.profile.achievements["streak-30"] },
  { title: "Legend", need: "Reach level 20", test: (d) => !!d.profile.achievements.lv20 },
  ...SKILL_TITLES, // earned in the skill tree (Hero hub)
];

export const CHAPTERS = [
  { level: 1, title: "Chapter 1 · The Awakening", text: "In a quiet room, a hero opens their eyes. The world hasn't noticed yet, but something has begun. Sensei Kaito appears: \"Every legend starts by simply showing up. Show up today.\"" },
  { level: 3, title: "Chapter 2 · The Trial of Discipline", text: "The first enemies are not monsters but habits: the warm bed, the endless scroll. The hero learns that discipline is a muscle, and it grows with every small victory." },
  { level: 6, title: "Chapter 3 · The Merchant's Road", text: "Gold is power, and wasted gold is lost power. The hero starts tracking every coin and discovers the merchant's secret: planning beats impulse." },
  { level: 10, title: "Chapter 4 · The Mind Dojo", text: "Exams loom like a castle on the horizon. In the Dojo, the hero trains focus in 25-minute strikes. Each session is a brick in the bridge to victory." },
  { level: 15, title: "Chapter 5 · Iron and Fire", text: "The body answers the call. Sets become heavier, steps longer, sleep deeper. The hero's reflection starts to look like the hero they imagined." },
  { level: 20, title: "Chapter 6 · The Boss Gate", text: "Bosses fall one after another. The hero realizes the true enemy was never outside. Consistency was the legendary weapon all along." },
  { level: 30, title: "Chapter 7 · Legend", text: "Stories are told about a hero who never quit. You are that hero. The exams are conquered, and the reward awaits: every anime, every manga, guilt-free." },
];
