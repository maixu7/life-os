import { habitStats, judged, tplOf } from "@/lib/habits";
import { sumMl } from "@/lib/goals";
import { logKarma } from "@/lib/karma";
import { pick, SLEEP_WHY } from "@/lib/wisdom";
import type { CustomItem, Data, Log } from "@/lib/store";
import { toDay } from "@/lib/store";

// The Sensei looks at the clock and your records and picks what you should do next,
// with the benefit ("why do it") and the trigger ("why I picked this").

export type Action =
  | { type: "water" } | { type: "milk" } | { type: "sleep" } | { type: "wake" } | { type: "library" }
  | { type: "activity"; name: string } | { type: "href"; href: string };

export type Task = { id: string; icon: string; title: string; why: string; because: string; priority: number; action: Action };

const SNOOZE = "lifeos-snooze:";
export function snooze(id: string, minutes = 60) {
  try { localStorage.setItem(SNOOZE + id, String(Date.now() + minutes * 60_000)); } catch {}
}
const snoozed = (id: string) => {
  try { return Number(localStorage.getItem(SNOOZE + id) ?? 0) > Date.now(); } catch { return false; }
};

const hm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const actNamed = (logs: Log[], re: RegExp) => logs.some((l) => l.kind === "activity" && re.test(String(l.data.name)));

export const HABIT_ACTION: Record<string, Action> = {
  brush2: { type: "activity", name: "Brush teeth" }, read20: { type: "library" }, water: { type: "water" }, milk: { type: "milk" },
  sleep2330: { type: "sleep" }, wake7: { type: "wake" }, move: { type: "activity", name: "Exercise" }, focus: { type: "href", href: "/focus" },
  breakfast: { type: "activity", name: "Breakfast" }, bath: { type: "activity", name: "Bath" }, tidy: { type: "activity", name: "Clean room" },
  mindful: { type: "activity", name: "Pray" }, limitfun: { type: "library" },
};

export function nextTasks(d: Data, habits: CustomItem[], now = new Date()): Task[] {
  const h = now.getHours() + now.getMinutes() / 60;
  const day = toDay(now);
  const logs = d.logs.filter((l) => l.day === day);
  const asleep = d.logs.some((l) => l.kind === "sleep" && !l.data.end);
  const out: Task[] = [];
  const add = (t: Task) => { if (!snoozed(t.id)) out.push(t); };
  if (asleep) return [];

  if (h >= 23 || h < 4) {
    add({ id: "sleep", icon: "🌙", title: "Go to sleep now", priority: 100, action: { type: "sleep" },
      because: `It is ${hm(now)} and you are still awake.`, why: pick(SLEEP_WHY) });
  }
  const woke = logs.some((l) => l.kind === "wake") || actNamed(logs, /woke|wake/i);
  if (h >= 5 && h < 11 && !woke) {
    add({ id: "wake", icon: "🌅", title: "Log your wake-up", priority: 70, action: { type: "wake" },
      because: "No wake-up time is recorded today yet.", why: "Knowing when you wake is the first step to owning your mornings." });
  }

  const badMin = logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((n, l) => n + (Number(l.data.minutes) || 30), 0);
  if (badMin > 30) {
    add({ id: "swap", icon: "📖", title: "Swap the screen for 10 pages", priority: 80, action: { type: "library" },
      because: `You have spent about ${badMin} min on time-pass today.`, why: "Balance it out: a few pages pull your path back toward the angel side and keep your brain sharp." });
  }

  for (const hb of habits) {
    const t = tplOf(hb);
    if (!t || t.id === "limitfun") continue;
    const j = judged(t, logs, d.profile.settings, day);
    if (j.done || h < t.window[0] || h > t.window[1]) continue;
    const s = habitStats(hb, d);
    const late = t.window[1] - h < 2;
    add({ id: `habit:${t.id}`, icon: t.icon, title: t.name, priority: 60 + (late ? 15 : 0) + Math.min(10, s.streak), action: HABIT_ACTION[t.id] ?? { type: "href", href: "/" },
      because: `Habit quest not done yet today${j.target > 1 ? ` (${j.progress}/${j.target} ${j.unit})` : ""}${s.streak ? `, and your ${s.streak}-day streak is on the line` : ""}${late ? ". Time is running out" : ""}.`,
      why: `${t.why} Tip: ${t.tiny}` });
  }

  const lastWater = [...logs].reverse().find((l) => l.kind === "water");
  const sinceWater = lastWater ? (now.getTime() - new Date(lastWater.created_at).getTime()) / 3_600_000 : h - 7;
  if (h >= 8 && h < 22 && sinceWater >= 2.5 && sumMl(logs, "water") < d.profile.settings.water_goal_ml) {
    add({ id: "water", icon: "💧", title: "Drink a glass of water", priority: 55, action: { type: "water" },
      because: lastWater ? `Your last water was ${Math.floor(sinceWater)} hours ago.` : "No water recorded today yet.",
      why: "Even mild dehydration drains focus and mood. One glass fixes it in minutes." });
  }

  const meals: [string, RegExp, number, number][] = [["Breakfast", /breakfast/i, 7, 10.5], ["Lunch", /lunch/i, 12.5, 15], ["Dinner", /dinner/i, 19, 21.5]];
  for (const [name, re, from, to] of meals) {
    if (h >= from && h < to && !actNamed(logs, re)) {
      add({ id: `meal:${name}`, icon: "🍱", title: `Eat ${name.toLowerCase()}`, priority: 50, action: { type: "activity", name },
        because: `It is ${name.toLowerCase()} time and no ${name.toLowerCase()} is recorded.`, why: "Regular meals keep energy steady and stop junk-food cravings." });
    }
  }

  if (h >= 9 && h < 20 && !logs.some((l) => l.kind === "focus")) {
    add({ id: "focus", icon: "🎯", title: "Do one 25-min focus session", priority: 45, action: { type: "href", href: "/focus" },
      because: "No focus session yet today.", why: "One deep session moves your goals more than hours of distracted work." });
  }
  if (h >= 16 && h < 20.5 && !logs.some((l) => l.kind === "workout") && !actNamed(logs, /exercise|walk|run|gym|yoga|sport/i)) {
    add({ id: "move", icon: "🏃", title: "Move for 15 minutes", priority: 40, action: { type: "activity", name: "Walk" },
      because: "You have not moved your body yet today.", why: "A short walk or workout clears stress and makes sleep deeper tonight." });
  }
  if (h >= 21 && h < 23 && !actNamed(logs, /brush/i)) {
    add({ id: "brush-night", icon: "🪥", title: "Brush before bed", priority: 58, action: { type: "activity", name: "Brush teeth" },
      because: "Night time and no night brushing recorded.", why: "Night brushing matters most: saliva drops while you sleep and bacteria get free time." });
  }

  if (!out.length) {
    add({ id: "read", icon: "📚", title: "Read 10 pages of a good book", priority: 5, action: { type: "library" },
      because: "Your important tasks are done for now.", why: "Free time is the best time to grow. Ten pages a day is about 18 books a year." });
  }
  const seen = new Set<string>();
  return out.sort((a, b) => b.priority - a.priority).filter((t) => (seen.has(t.title) ? false : (seen.add(t.title), true)));
}
