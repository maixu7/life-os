// Time of day and the detail options offered when logging an activity.

export type Slot = "Early morning" | "Morning" | "Afternoon" | "Evening" | "Night" | "Late night";

export function slotOf(d: Date | string): Slot {
  const h = new Date(d).getHours();
  if (h < 4) return "Late night";
  if (h < 7) return "Early morning";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

export const SLOT_ICON: Record<Slot, string> = {
  "Early morning": "🌄", Morning: "🌅", Afternoon: "☀️", Evening: "🌇", Night: "🌙", "Late night": "🦉",
};

export const isNight = (d = new Date()) => d.getHours() >= 21 || d.getHours() < 5;
// Sleep that starts between 08:00 and 19:59 is a nap.
export const isNapTime = (d = new Date()) => d.getHours() >= 8 && d.getHours() < 20;

export const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;

// Options shown when you tap an activity. Options marked bad count as bad deeds.
const OPTIONS: [RegExp, string[]][] = [
  [/brush/i, ["Morning", "Night", "After meal", "With floss"]],
  [/bath|shower/i, ["Morning", "Evening", "Cold shower", "Quick wash"]],
  [/breakfast|lunch|dinner|snack|meal|eat/i, ["Home food", "Outside", "Healthy", "Fruits", "Junk food", "Skipped half"]],
  [/study|homework|revision/i, ["Math", "Science", "English", "Notes", "Practice questions", "Exam prep", "Other"]],
  [/exercise|gym|workout/i, ["Gym", "Home workout", "Running", "Yoga", "Sports", "Stretching"]],
  [/walk/i, ["Morning walk", "Evening walk", "After meal", "Errand", "10,000 steps"]],
  [/read/i, ["Book", "Study notes", "News", "Manga"]],
  [/listen/i, ["Podcast", "Audiobook", "Lecture", "Music"]],
  [/clean/i, ["Room", "Desk", "Kitchen", "Clothes", "Deep clean"]],
  [/pray|meditat/i, ["Morning", "Evening", "Meditation", "Gratitude"]],
  [/anime|movie|series|netflix/i, ["1 episode", "2–3 episodes", "Binge", "Reward from shop"]],
  [/manga|comic/i, ["1 chapter", "Few chapters", "Binge", "Reward from shop"]],
  [/game|gaming|pubg/i, ["Quick match", "1 hour", "Binge", "Reward from shop"]],
  [/woke|wake/i, ["Alarm", "No alarm", "Fresh", "Tired"]],
];

export const BAD_OPTION = /junk|binge|skipped|^manga$/i;
export const REWARD_OPTION = /reward from shop/i;

export function optionsFor(name: string): string[] {
  return OPTIONS.find(([re]) => re.test(name))?.[1] ?? [];
}

// Picks the option that fits the clock, e.g. brushing at 22:00 is "Night".
export function autoOption(name: string, at = new Date()): string | null {
  const opts = optionsFor(name);
  const s = slotOf(at);
  const morning = s === "Morning" || s === "Early morning";
  const night = s === "Night" || s === "Late night";
  if (opts.includes("Morning") && morning) return "Morning";
  if (opts.includes("Night") && night) return "Night";
  if (opts.includes("Evening") && (s === "Evening" || night)) return "Evening";
  if (opts.includes("Morning walk") && morning) return "Morning walk";
  if (opts.includes("Evening walk") && (s === "Evening" || night)) return "Evening walk";
  return null;
}
