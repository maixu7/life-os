import { energy } from "@/lib/body";
import { sumMl } from "@/lib/goals";
import { habitStats } from "@/lib/habits";
import { byDay, dailyMissions } from "@/lib/missions";
import { sched, toMin } from "@/lib/schedule";
import { toDay, type CustomItem, type Data, type Log } from "@/lib/store";

// Pure helpers for the Hero hub tools: sleep planner, detox days, seasonal
// events, loot, rival, streak freeze, pet hunger, world map, surprise picks.
// No React here, so it can be tested on its own.

const DAY = 86_400_000;
export const dayAgo = (n: number, now = new Date()) => toDay(new Date(now.getTime() - n * DAY));
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const fromMin = (m: number) => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
// Same "random" number all day for everyone, so the rival and events don't jump around.
export const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const mondayOf = (now = new Date()) => { const m = new Date(now); m.setDate(now.getDate() - ((now.getDay() + 6) % 7)); return toDay(m); };

// ---------- Study minutes (focus sessions and study logs) ----------
const STUDY_RE = /study|homework|revis|exam|kanji|lesson|class|course|past paper|mock test|chapter|tuition|lecture/i;
export const isStudyLog = (l: Log) => l.kind === "focus" || (l.kind === "activity" && STUDY_RE.test(String(l.data.name ?? "")));
export const studyMins = (logs: Log[]) => logs.filter(isStudyLog).reduce((n, l) => n + (Number(l.data.minutes) || 25), 0);

// ---------- 38 Sleep planner: 90-minute cycles back from the wake time ----------
export const FALL_ASLEEP = 15;
export function bedtimes(wake: string, cycles = [6, 5, 4]) {
  const w = toMin(wake);
  return cycles.map((c) => ({ cycles: c, hours: (c * 90) / 60, bed: fromMin(w - c * 90 - FALL_ASLEEP), best: c === 6 || c === 5 }));
}
export function wakeTimes(from = new Date(), cycles = [4, 5, 6]) {
  const m = from.getHours() * 60 + from.getMinutes() + FALL_ASLEEP;
  return cycles.map((c) => ({ cycles: c, hours: (c * 90) / 60, wake: fromMin(m + c * 90) }));
}

// ---------- 44 Digital detox challenge days ----------
export const DETOX = [
  { id: "nosns", icon: "📵", name: "No social media day", rule: "No Instagram, X, TikTok or YouTube Shorts all day." },
  { id: "noanime", icon: "🚫📺", name: "No anime or videos day", rule: "No anime, YouTube or streaming today. Books and music are fine." },
  { id: "morning", icon: "🌅", name: "Phone-free first hour", rule: "No phone for the first hour after waking (alarm only)." },
  { id: "screen2", icon: "⏳", name: "Under 2 hours of screen", rule: "Keep total phone screen time under 2 hours (check Screen Time / Digital Wellbeing)." },
  { id: "nogames", icon: "🎮", name: "No games day", rule: "No phone or console games today." },
  { id: "night", icon: "🌙", name: "Screens off 1 h before bed", rule: "All screens off one hour before your bedtime." },
];
export const DETOX_XP = 50;

// ---------- 50 Seasonal events in Japan ----------
export type EventQuest = { id: string; icon: string; name: string; test: (logs: Log[]) => boolean };
export type SeasonEvent = { id: string; icon: string; name: string; from: string; to: string; blurb: string; item: string; quests: EventQuest[] };
const act = (logs: Log[], re: RegExp) => logs.some((l) => (l.kind === "activity" || l.kind === "task" || l.kind === "routine") && re.test(String(l.data.name ?? "")));
const has = (logs: Log[], kind: string, n = 1) => logs.filter((l) => l.kind === kind).length >= n;
// Month-day ranges; New Year wraps over the year end.
export const EVENTS: SeasonEvent[] = [
  { id: "newyear", icon: "🎍", name: "Shōgatsu New Year", from: "12-28", to: "01-07", item: "🎍 Kadomatsu charm", blurb: "Clean the old year away and start fresh, the Japanese way.", quests: [
    { id: "osoji", icon: "🧹", name: "Ōsōji: clean your room", test: (l) => act(l, /clean|tidy/i) },
    { id: "goals", icon: "🎯", name: "Write an intention for the year", test: (l) => has(l, "intention") || has(l, "goalstep") },
    { id: "walk", icon: "⛩️", name: "Hatsumōde walk outside", test: (l) => act(l, /walk|shrine|temple/i) || has(l, "outside") },
    { id: "family", icon: "📞", name: "Call family", test: (l) => has(l, "social") } ] },
  { id: "sakura", icon: "🌸", name: "Sakura season", from: "03-25", to: "04-10", item: "🌸 Sakura petal", blurb: "Hanami time. Get outside and start the school year strong.", quests: [
    { id: "outside", icon: "🌤️", name: "30 min outside", test: (l) => l.some((x) => x.kind === "outside" && Number(x.data.minutes) >= 30) || act(l, /walk|picnic|hanami/i) },
    { id: "focus", icon: "📖", name: "3 focus sessions", test: (l) => has(l, "focus", 3) },
    { id: "grat", icon: "🙏", name: "Gratitude list", test: (l) => has(l, "gratitude") } ] },
  { id: "gw", icon: "🎏", name: "Golden Week", from: "04-29", to: "05-06", item: "🎏 Koinobori flag", blurb: "A week off. Heroes use holidays to level up, not to melt.", quests: [
    { id: "train", icon: "⚔️", name: "Train 3 times", test: (l) => l.filter((x) => x.kind === "workout").length >= 3 },
    { id: "study", icon: "📖", name: "Study 5 hours in total", test: (l) => studyMins(l) >= 300 },
    { id: "read", icon: "📚", name: "Read a book", test: (l) => has(l, "reading") || has(l, "pages") || l.some((x) => x.kind === "media" && x.data.type === "book") },
    { id: "kind", icon: "💝", name: "A kind deed", test: (l) => has(l, "kindness") } ] },
  { id: "summer", icon: "🎆", name: "Summer festival (Natsu matsuri)", from: "07-20", to: "08-31", item: "🎆 Hanabi spark", blurb: "Hot days: stay hydrated, keep studying, enjoy the fireworks.", quests: [
    { id: "water", icon: "💧", name: "Hit water goal 7 days", test: (l) => Object.values(byDay(l)).filter((ls) => sumMl(ls, "water") >= 2000).length >= 7 },
    { id: "study", icon: "📖", name: "Study 10 hours this summer", test: (l) => studyMins(l) >= 600 },
    { id: "early", icon: "🌅", name: "Wake before 7 on 5 days", test: (l) => l.filter((x) => x.kind === "wake" && String(x.data.time) < "07:00").length >= 5 },
    { id: "detox", icon: "📵", name: "One detox day", test: (l) => l.some((x) => x.kind === "detox" && x.data.ok) } ] },
  { id: "halloween", icon: "🎃", name: "Halloween night", from: "10-15", to: "10-31", item: "🎃 Jack-o'-lantern", blurb: "Monsters roam Shibuya. Beat the real ones: sugar, scrolling and late nights.", quests: [
    { id: "sugar", icon: "🍬", name: "Resist a sweet craving", test: (l) => l.some((x) => x.kind === "resist") },
    { id: "sleep", icon: "🦇", name: "Sleep before 11:30 pm twice", test: (l) => l.filter((x) => x.kind === "sleep" && x.data.type !== "nap" && (() => { const h = new Date(String(x.data.start)).getHours(); return h >= 19 && (h < 23 || (h === 23 && new Date(String(x.data.start)).getMinutes() <= 30)); })()).length >= 2 },
    { id: "focus", icon: "👻", name: "4 focus sessions", test: (l) => has(l, "focus", 4) },
    { id: "urge", icon: "🌊", name: "Surf an urge (2-min timer)", test: (l) => l.some((x) => x.kind === "resist" && x.data.urge) } ] },
  { id: "autumn", icon: "🍁", name: "Autumn of reading (Dokusho no aki)", from: "11-01", to: "11-23", item: "🍁 Momiji leaf", blurb: "The Japanese season for books. Read, learn and walk under red leaves.", quests: [
    { id: "read", icon: "📚", name: "Read 5 times", test: (l) => l.filter((x) => x.kind === "reading" || x.kind === "pages" || (x.kind === "media" && x.data.type === "book")).length >= 5 },
    { id: "walk", icon: "🍂", name: "Autumn walk", test: (l) => act(l, /walk/i) || has(l, "outside") },
    { id: "study", icon: "📖", name: "Study 6 hours", test: (l) => studyMins(l) >= 360 } ] },
  { id: "xmas", icon: "🎄", name: "Christmas lights", from: "12-15", to: "12-25", item: "🎄 Illumination star", blurb: "In Japan, Christmas means lights and cake. Earn your slice.", quests: [
    { id: "kind", icon: "🎁", name: "Two kind deeds", test: (l) => l.filter((x) => x.kind === "kindness").length >= 2 },
    { id: "train", icon: "⛄", name: "Train 3 times", test: (l) => l.filter((x) => x.kind === "workout").length >= 3 },
    { id: "save", icon: "🐷", name: "Save some money", test: (l) => has(l, "save") } ] },
];
export const EVENT_QUEST_GOLD = 40;
// The event running on `now` (with its real start and end dates), if any.
export function activeEvents(now = new Date()) {
  const md = toDay(now).slice(5), y = now.getFullYear();
  return EVENTS.filter((e) => (e.from <= e.to ? md >= e.from && md <= e.to : md >= e.from || md <= e.to)).map((e) => {
    const wraps = e.from > e.to;
    const startY = wraps && md <= e.to ? y - 1 : y;
    return { ...e, start: `${startY}-${e.from}`, end: `${wraps ? startY + 1 : startY}-${e.to}` };
  });
}
export function nextEvent(now = new Date()) {
  const md = toDay(now).slice(5);
  const sorted = [...EVENTS].sort((a, b) => a.from.localeCompare(b.from));
  const e = sorted.find((x) => x.from > md) ?? sorted[0];
  const y = e.from > md ? now.getFullYear() : now.getFullYear() + 1;
  return { ...e, start: `${y}-${e.from}`, days: Math.ceil((new Date(`${y}-${e.from}T00:00`).getTime() - now.getTime()) / DAY) };
}

// ---------- 53 Rare loot for perfect days ----------
export type Rarity = "common" | "rare" | "epic" | "legendary";
export const RARITY: Record<Rarity, { color: string; label: string }> = {
  common: { color: "#b8c0d8", label: "Common" }, rare: { color: "#4cc9f0", label: "Rare" },
  epic: { color: "#c77dff", label: "Epic" }, legendary: { color: "#ffd166", label: "Legendary" },
};
const LOOT: Record<Rarity, [string, string][]> = {
  common: [["🍙", "Lucky onigiri"], ["🪶", "Crow feather"], ["🧧", "Small red envelope"], ["🎐", "Wind chime"]],
  rare: [["🗡️", "Kunai of Focus"], ["🧿", "Charm of Calm"], ["📜", "Scroll of Kanji"], ["🍵", "Matcha of Clarity"]],
  epic: [["🏮", "Lantern of the Night Owl"], ["🥋", "Black belt of Discipline"], ["🪭", "Fan of the Wind Sage"]],
  legendary: [["🐉", "Dragon scale"], ["⚔️", "Katana of the Shogun"], ["👑", "Crown of the Perfect Week"]],
};
export function rollLoot(rand = Math.random) {
  const r = rand();
  const rarity: Rarity = r < 0.02 ? "legendary" : r < 0.12 ? "epic" : r < 0.4 ? "rare" : "common";
  const pool = LOOT[rarity];
  const [icon, name] = pool[Math.floor(rand() * pool.length)];
  const gold = { common: 20, rare: 60, epic: 150, legendary: 300 }[rarity] + Math.floor(rand() * 20);
  return { rarity, icon, name, gold };
}
export const isPerfect = (logs: Log[], d: Data) => dailyMissions(logs, d.profile.settings).every((m) => m.done);
export const lootClaimed = (d: Data, day: string) => d.logs.some((l) => l.kind === "loot" && l.data.src === "perfect" && l.data.for === day);
export const lootBag = (d: Data) => d.logs.filter((l) => l.kind === "loot" && l.data.item).map((l) => ({ id: l.id, icon: String(l.data.icon ?? "🎁"), name: String(l.data.item), rarity: (l.data.rarity ?? "common") as Rarity, day: l.day }));

// ---------- 88 Rival: Ryuji studies every day and you must beat his score ----------
export const RIVAL = { name: "Ryuji", icon: "😤", line: ["Is that all you've got?", "I already did my morning study.", "You'll never catch me!", "Heh. Not bad… for a rookie.", "My sensei says I'm unbeatable."] };
const xpOn = (d: Data, day: string) => d.logs.filter((l) => l.day === day).reduce((n, l) => n + l.xp, 0);
// His score for the whole day: a bit above your recent average, so it's beatable but never free.
export function rivalTarget(d: Data, day: string) {
  const days = [1, 2, 3, 4, 5, 6, 7].map((i) => xpOn(d, toDay(new Date(new Date(`${day}T12:00`).getTime() - i * DAY))));
  const avg = days.reduce((a, b) => a + b, 0) / 7;
  const k = 0.9 + (seed(day + "ryuji") % 35) / 100; // 0.90..1.24
  return Math.max(80, Math.round((avg * k) / 5) * 5);
}
// He earns his points between 7 am and 11 pm.
export function rivalNow(d: Data, day: string, now = new Date()) {
  const target = rivalTarget(d, day);
  if (day < toDay(now)) return target;
  const m = now.getHours() * 60 + now.getMinutes();
  return Math.round(target * Math.min(1, Math.max(0, (m - 420) / (1380 - 420))));
}
export const rivalScore = (d: Data, day: string, now = new Date()) => ({ you: xpOn(d, day), him: rivalNow(d, day, now), target: rivalTarget(d, day) });
export const RIVAL_GOLD = 30;
export const rivalClaimed = (d: Data, day: string) => d.logs.some((l) => l.kind === "rival" && l.data.for === day);
export function rivalRecord(d: Data, now = new Date()) {
  let won = 0, lost = 0;
  for (let i = 1; i <= 30; i++) {
    const day = dayAgo(i, now);
    if (!d.logs.some((l) => l.day === day)) continue;
    if (xpOn(d, day) >= rivalTarget(d, day)) won++; else lost++;
  }
  return { won, lost };
}

// ---------- 87 Streak freeze: a gold-shop item that saves one missed day ----------
export const FREEZE_COST = 150;
export const freezesOwned = (d: Data) =>
  d.logs.filter((l) => l.kind === "redeem" && l.data.freeze).length - d.logs.filter((l) => l.kind === "freeze").length;
export const frozenDays = (d: Data) => new Set(d.logs.filter((l) => l.kind === "freeze").map((l) => String(l.data.for)));
// Yesterday was missed (fewer than 3 missions) but the day before counted: a freeze would save the streak.
export function freezeNeeded(d: Data, now = new Date()) {
  const days = byDay(d.logs);
  const ok = (x: string) => frozenDays(d).has(x) || dailyMissions(days[x] ?? [], d.profile.settings).filter((m) => m.done).length >= 3;
  const y = dayAgo(1, now), y2 = dayAgo(2, now);
  return !ok(y) && ok(y2) ? y : null;
}

// ---------- 52 Pet hunger: skipped habits make your companion hungry ----------
export function petHunger(d: Data, habits: CustomItem[], now = new Date()) {
  const active = habits.filter((h) => h.category === "habit");
  if (!active.length) return { hunger: 0, fedToday: 0, missed: 0, total: 0, none: true };
  const y = dayAgo(1, now), y2 = dayAgo(2, now), t = toDay(now);
  let missed = 0, total = 0, fedToday = 0, todayCount = 0;
  for (const h of active) {
    const s = habitStats(h, d);
    for (const row of s.days) {
      if (row.day === y || row.day === y2) { total++; if (!row.done) missed += row.day === y ? 1.5 : 1; }
      if (row.day === t) { todayCount++; if (row.done) fedToday++; }
    }
  }
  const snacks = d.logs.filter((l) => l.kind === "redeem" && l.data.pet && l.day === t).length;
  const late = Math.max(0, now.getHours() - 12) / 12; // undone habits weigh more as the day goes on
  const base = total ? (missed / (total * 1.25)) * 70 : 0;
  const today = todayCount ? ((todayCount - fedToday) / todayCount) * 40 * late : 0;
  const hunger = Math.round(Math.max(0, Math.min(100, base + today - fedToday * 15 - snacks * 30)));
  return { hunger, fedToday, missed: Math.round(missed), total, none: false };
}
export const PET_SNACK = 20;

// ---------- 86 World map: each region is a life area that opens as you level ----------
export type Region = { id: string; icon: string; name: string; area: string; level: number; goal: number; x: number; y: number; count: (d: Data) => number };
const count = (d: Data, f: (l: Log) => boolean) => d.logs.filter(f).length;
export const REGIONS: Region[] = [
  { id: "village", icon: "🏘️", name: "Starter Village", area: "Showing up", level: 1, goal: 30, x: 50, y: 92, count: (d) => new Set(d.logs.map((l) => l.day)).size },
  { id: "lake", icon: "💧", name: "Lake of Tides", area: "Water & milk", level: 2, goal: 150, x: 20, y: 78, count: (d) => count(d, (l) => l.kind === "water" || l.kind === "milk") },
  { id: "fields", icon: "🌾", name: "Rice Fields", area: "Food", level: 3, goal: 120, x: 80, y: 76, count: (d) => count(d, (l) => l.kind === "meal" || (l.kind === "activity" && !!l.data.meal)) },
  { id: "moon", icon: "🌙", name: "Moon Valley", area: "Sleep", level: 5, goal: 60, x: 30, y: 60, count: (d) => count(d, (l) => l.kind === "sleep" && !!l.data.end) },
  { id: "iron", icon: "⛰️", name: "Iron Mountains", area: "Training", level: 7, goal: 100, x: 72, y: 56, count: (d) => count(d, (l) => l.kind === "workout") },
  { id: "library", icon: "🏛️", name: "Scholar's Library", area: "Study", level: 9, goal: 80, x: 18, y: 40, count: (d) => count(d, isStudyLog) },
  { id: "temple", icon: "⛩️", name: "Spirit Temple", area: "Mind & calm", level: 12, goal: 60, x: 52, y: 42, count: (d) => count(d, (l) => ["mood", "gratitude", "journal", "breath", "meditate", "reflection", "resist"].includes(l.kind)) },
  { id: "port", icon: "⚓", name: "Merchant Port", area: "Money", level: 15, goal: 60, x: 84, y: 36, count: (d) => count(d, (l) => ["shopping", "save", "income"].includes(l.kind)) },
  { id: "town", icon: "🏮", name: "Friendship Town", area: "Family & kindness", level: 18, goal: 40, x: 30, y: 22, count: (d) => count(d, (l) => l.kind === "social" || l.kind === "kindness") },
  { id: "castle", icon: "🏯", name: "Shogun's Castle", area: "Everything", level: 25, goal: 20, x: 62, y: 12, count: (d) => count(d, (l) => l.kind === "bonus") },
];
export function worldMap(d: Data, level: number) {
  return REGIONS.map((r) => {
    const n = r.count(d);
    return { ...r, open: level >= r.level, n, pct: Math.min(100, Math.round((n / r.goal) * 100)) };
  });
}

// ---------- 78 Surprise me ----------
export const MEALS_JP = [
  "Salmon onigiri + miso soup + edamame", "Natto rice with a raw egg and green onion", "Chicken teriyaki bento with broccoli",
  "Tofu and vegetable nabe", "Soba with grated daikon and an egg", "Grilled mackerel (saba) set with rice and salad",
  "Oyakodon with a side of cabbage", "Greek yogurt, banana and granola", "Tuna and egg sandwich + milk", "Curry rice with extra vegetables and a boiled egg",
  "Gyudon (small) + kimchi + miso soup", "Udon with chicken, spinach and an egg", "Konbini: salad chicken + onigiri + yogurt",
];
export const WORKOUTS = [
  "10 push-ups × 3 sets", "20 squats × 3 sets", "1-minute plank × 3", "15-minute brisk walk", "Jumping jacks: 3 × 40",
  "Lunges: 3 × 12 each leg", "10-minute stretch routine", "Burpees: 3 × 8", "Wall sit: 3 × 45 s", "Stairs: 5 times up and down",
];
export const TOPICS = [
  "Learn 10 new kanji", "One past-paper question set", "Review yesterday's notes for 15 min", "Explain one topic out loud (Feynman)",
  "Make 20 flashcards", "Read one textbook section and summarise it in 5 lines", "Practice 10 maths problems", "Listen to 15 min of Japanese and shadow it",
];
export type Surprise = { kind: "meal" | "workout" | "study"; icon: string; text: string };
export function surprise(kind: Surprise["kind"], d: Data, rand = Math.random): Surprise {
  if (kind === "meal") {
    const have = d.pantry.filter((p) => p.qty > 0 && ["food", "fruit", "veg"].includes(p.kind ?? "")).map((p) => p.name);
    const pool = have.length && rand() < 0.35 ? have.map((h) => `Something with ${h} (you have it at home)`) : MEALS_JP;
    return { kind, icon: "🍱", text: pool[Math.floor(rand() * pool.length)] };
  }
  if (kind === "workout") {
    const mine = d.items.filter((i) => i.category === "exercise").map((i) => `${i.name}: 3 sets`);
    const pool = [...WORKOUTS, ...mine];
    return { kind, icon: "⚔️", text: pool[Math.floor(rand() * pool.length)] };
  }
  const plan = (d.profile.settings.study_plan ?? []).map((s) => `${s.subject}${s.what ? `: ${s.what}` : ""} (${s.mins} min)`);
  const pool = plan.length && rand() < 0.6 ? plan : TOPICS;
  return { kind, icon: "📖", text: pool[Math.floor(rand() * pool.length)] };
}

// ---------- 89 Sensei chat: a short summary of the last 7 days ----------
export function weekSummary(d: Data, now = new Date()) {
  const days = [...Array(7)].map((_, i) => dayAgo(6 - i, now));
  const rows = days.map((day) => {
    const logs = d.logs.filter((l) => l.day === day);
    const e = energy(d, day);
    const sleep = logs.filter((l) => l.kind === "sleep" && l.data.end).reduce((n, l) => n + (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 3_600_000, 0);
    return { day, kcal: e.intake, protein: e.protein, water: sumMl(logs, "water"), study: studyMins(logs), train: logs.filter((l) => l.kind === "workout").length, sleep: Math.round(sleep * 10) / 10, xp: logs.reduce((n, l) => n + l.xp, 0) };
  });
  const s = d.profile.settings;
  const todayLogs = d.logs.filter((l) => l.day === toDay(now));
  const lastMeal = [...todayLogs].reverse().find((l) => l.kind === "meal" || (l.kind === "activity" && l.data.meal));
  const sc = sched(s.schedule);
  return {
    now: `${toDay(now)} ${hhmm(now)}`, goals: { water: s.water_goal_ml, sleep: s.sleep_goal_h, exam: s.exam_date, bed: sc.sleep, wake: sc.wake },
    days: rows, lastMeal: lastMeal ? `${String(lastMeal.data.name ?? "meal")} at ${hhmm(new Date(lastMeal.created_at))}` : "none yet today",
    have: d.pantry.filter((p) => p.qty > 0 && ["food", "fruit", "veg", "drink"].includes(p.kind ?? "food")).slice(0, 15).map((p) => p.name),
  };
}
export const summaryText = (w: ReturnType<typeof weekSummary>) =>
  `Now: ${w.now}. Goals: water ${w.goals.water} ml, sleep ${w.goals.sleep} h, bed ${w.goals.bed}, wake ${w.goals.wake}${w.goals.exam ? `, exam ${w.goals.exam}` : ""}.\n` +
  `Last meal: ${w.lastMeal}. Food at home: ${w.have.join(", ") || "unknown"}.\n` +
  `Last 7 days (date: kcal, protein g, water ml, study min, workouts, sleep h, xp):\n` +
  w.days.map((r) => `${r.day}: ${r.kcal}, ${r.protein}, ${r.water}, ${r.study}, ${r.train}, ${r.sleep}, ${r.xp}`).join("\n");

// The offline Sensei: answers common questions from the same numbers.
export function ruleAnswer(q: string, w: ReturnType<typeof weekSummary>, now = new Date()): string {
  const t = q.toLowerCase();
  const today = w.days[6], past = w.days.slice(0, 6);
  const avg = (k: "kcal" | "protein" | "water" | "study" | "sleep") => Math.round((past.reduce((n, r) => n + r[k], 0) / 6) * 10) / 10;
  const h = now.getHours();
  if (/eat|food|hungry|meal|snack|dinner|lunch|breakfast|食/.test(t)) {
    const lowP = today.protein < 50;
    const late = h >= 21;
    const have = w.have.length ? ` You have ${w.have.slice(0, 3).join(", ")} at home.` : "";
    return late
      ? `It's late, so keep it light: yogurt, a banana, a glass of milk or miso soup. Big meals now hurt your sleep.${have}`
      : `Today you've had about ${today.kcal} kcal and ${today.protein} g protein.${lowP ? " Protein is low: add eggs, chicken, fish, tofu, natto or milk." : " Protein looks okay."} Add vegetables and some rice for energy.${have}`;
  }
  if (/sleep|tired|bed|nap|眠/.test(t)) return `You averaged ${avg("sleep")} h of sleep over the last 6 days (goal ${w.goals.sleep} h). Aim to be in bed by ${w.goals.bed}, phone away 30 min before. ${h >= 13 && h < 16 ? "A 20-minute nap now is fine." : ""}`.trim();
  if (/water|drink|thirst|水/.test(t)) return `Water today: ${today.water} ml of ${w.goals.water} ml. ${today.water < w.goals.water ? `Drink about ${Math.ceil((w.goals.water - today.water) / 250)} more glasses, spread out.` : "Goal done. Nice."}`;
  if (/study|exam|learn|focus|勉強/.test(t)) return `You studied ${today.study} min today and about ${avg("study")} min a day before that. ${w.goals.exam ? `Exam on ${w.goals.exam}. ` : ""}Next step: one 25-minute focus session, phone in another room.`;
  if (/train|workout|exercise|gym|筋/.test(t)) return `You trained ${past.reduce((n, r) => n + r.train, 0) + today.train} times this week. ${today.train ? "Done today. Stretch and rest." : "Nothing yet today: 3 sets of push-ups and squats takes 10 minutes."}`;
  if (/stress|sad|anx|angry|lonely|depress/.test(t)) return "Slow breathing first: in for 4, hold for 4, out for 6, five times. Then one small task. If these feelings stay for weeks or get heavy, talk to someone you trust or a doctor. You're not alone.";
  return `This week: ${avg("study")} min study, ${avg("sleep")} h sleep, ${avg("water")} ml water a day on average. Ask me what to eat, when to sleep, or what to study next.`;
}

// ---------- 93 Today's wins, for the share card ----------
export function todayWins(d: Data, now = new Date()) {
  const day = toDay(now);
  const logs = d.logs.filter((l) => l.day === day);
  const m = dailyMissions(logs, d.profile.settings);
  return {
    day, xp: logs.reduce((n, l) => n + l.xp, 0), missions: m.filter((x) => x.done).length, missionTotal: m.length,
    water: sumMl(logs, "water"), study: studyMins(logs), train: logs.filter((l) => l.kind === "workout").length, kcal: energy(d, day).intake,
    wins: m.filter((x) => x.done).map((x) => `${x.icon} ${x.name}`),
  };
}
