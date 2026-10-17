import { gaps } from "@/lib/gaps";
import { habitStats, judged, tplOf } from "@/lib/habits";
import { sumMl } from "@/lib/goals";
import { logKarma } from "@/lib/karma";
import { isOffDay, phaseNow, sched, toMin } from "@/lib/schedule";
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
  mindful: { type: "activity", name: "Pray" }, limitfun: { type: "library" }, code30: { type: "activity", name: "Coding" },
};

export function nextTasks(d: Data, habits: CustomItem[], now = new Date()): Task[] {
  const h = now.getHours() + now.getMinutes() / 60;
  const day = toDay(now);
  const logs = d.logs.filter((l) => l.day === day);
  const asleep = d.logs.some((l) => l.kind === "sleep" && !l.data.end);
  const out: Task[] = [];
  const add = (t: Task) => { if (!snoozed(t.id)) out.push(t); };
  if (asleep) return [];

  const sc = sched(d.profile.settings.schedule);
  const ph = phaseNow(sc, now);
  const off = isOffDay(ph.day);
  const busy = ph.phase === "work" || ph.phase === "commute";
  const at = (t: string) => toMin(t) / 60;
  const place = sc.workPlace || "work";

  if (ph.phase === "sleep") {
    add({ id: "sleep", icon: "🌙", title: "Go to sleep now", priority: 100, action: { type: "sleep" },
      because: `It is ${hm(now)} and your bedtime has passed.`, why: pick(SLEEP_WHY) });
  }
  if (ph.phase === "winddown") {
    add({ id: "winddown", icon: "🛏️", title: "Start winding down", priority: 74, action: { type: "activity", name: "Brush teeth" },
      because: `Bedtime is in ${ph.minsLeft} minutes.`, why: "Screens off, brush, plan tomorrow. A calm last half hour means faster, deeper sleep." });
  }
  if (ph.phase === "work") {
    add({ id: "work", icon: "💼", title: `Stay focused at ${place}`, priority: 68, action: { type: "href", href: "/focus" },
      because: `It's ${place} hours for ${Math.floor((ph.minsLeft ?? 0) / 60)}h ${(ph.minsLeft ?? 0) % 60}m more, so I'm holding fun and habit tasks for your free time.`,
      why: "Doing work in work time is what makes free time truly free." });
  }
  if (ph.phase === "break") {
    add({ id: "break", icon: "☕", title: "Rest: water, stretch, eyes off screen", priority: 62, action: { type: "water" },
      because: `It's your ${ph.brk?.label.toLowerCase() || "break"} (${ph.minsLeft} min left).`, why: "A real break recharges focus. Scrolling is not rest for your brain." });
  }
  const woke = logs.some((l) => l.kind === "wake") || actNamed(logs, /woke|wake/i);
  const wakeAt = at(off ? sc.weekendWake : sc.wake);
  if (h >= wakeAt - 2 && h < wakeAt + 4 && !woke) {
    add({ id: "wake", icon: "🌅", title: "Log your wake-up", priority: 70, action: { type: "wake" },
      because: "No wake-up time is recorded today yet.", why: "Knowing when you wake is the first step to owning your mornings." });
  }
  if (off && ph.phase === "free" && h >= 8 && h < at(sc.sleep) - 1) {
    const pages = logs.filter((l) => l.kind === "media" && l.data.mode !== "watch").reduce((n, l) => n + (Number(l.data.pages) || 0), 0);
    if (pages < sc.readGoal) add({ id: "free-read", icon: "📚", title: `Read ${sc.readGoal - pages} pages`, priority: 64, action: { type: "library" },
      because: `It's a ${ph.day === "free" ? "free day" : ph.day} with no work, so this is the best time for your reading goal (${pages}/${sc.readGoal} pages).`,
      why: "Free days decide who you become. Spend part of yours growing." });
    const code = logs.filter((l) => l.kind === "coding").reduce((n, l) => n + (Number(l.data.minutes) || 0), 0);
    if (sc.codeGoal && code < sc.codeGoal) add({ id: "free-code", icon: "💻", title: `Code for ${sc.codeGoal - code} minutes`, priority: 61, action: { type: "activity", name: "Coding" },
      because: `No work today, and your coding goal is ${code}/${sc.codeGoal} min.`, why: "Skills compound. A free day is a bonus training day." });
  }

  const badMin = logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((n, l) => n + (Number(l.data.minutes) || 30), 0);
  if (badMin > sc.screenLimit / 2 && !busy) {
    add({ id: "swap", icon: "📖", title: "Swap the screen for 10 pages", priority: 80, action: { type: "library" },
      because: `You have spent about ${badMin} min on time-pass today.`, why: "Balance it out: a few pages pull your path back toward the angel side and keep your brain sharp." });
  }

  for (const hb of habits) {
    const t = tplOf(hb);
    if (!t || t.id === "limitfun") continue;
    const j = judged(t, logs, d.profile.settings, day);
    if (j.done || h < t.window[0] || h > t.window[1]) continue;
    // In work hours only the quick body habits (water, milk) are worth interrupting for.
    if (busy && !["water", "milk"].includes(t.id)) continue;
    const s = habitStats(hb, d);
    const late = t.window[1] - h < 2;
    add({ id: `habit:${t.id}`, icon: t.icon, title: t.name, priority: 60 + (late ? 15 : 0) + Math.min(10, s.streak) + (off ? 8 : 0), action: HABIT_ACTION[t.id] ?? { type: "href", href: "/" },
      because: `Habit quest not done yet today${j.target > 1 ? ` (${j.progress}/${j.target} ${j.unit})` : ""}${s.streak ? `, and your ${s.streak}-day streak is on the line` : ""}${late ? ". Time is running out" : ""}${off ? ". It's your day off, so there's time for it" : ""}.`,
      why: `${t.why} Tip: ${t.tiny}` });
  }

  for (const p of d.items.filter((i) => i.category === "list:plan" && !i.config.done && i.config.for === day)) {
    add({ id: `plan:${p.id}`, icon: "🗓️", title: p.name, priority: 66, action: { type: "href", href: "/tools" },
      because: "You planned this last night as one of today's top tasks.", why: "Doing what you planned builds trust in yourself. That is real discipline." });
  }

  const lastWater = [...logs].reverse().find((l) => l.kind === "water");
  const sinceWater = lastWater ? (now.getTime() - new Date(lastWater.created_at).getTime()) / 3_600_000 : h - 7;
  if (h >= 8 && h < 22 && sinceWater >= sc.waterEvery / 60 && sumMl(logs, "water") < d.profile.settings.water_goal_ml) {
    add({ id: "water", icon: "💧", title: "Drink a glass of water", priority: 55, action: { type: "water" },
      because: lastWater ? `Your last water was ${Math.floor(sinceWater)} hours ago.` : "No water recorded today yet.",
      why: "Even mild dehydration drains focus and mood. One glass fixes it in minutes." });
  }

  const meals: [string, RegExp, number][] = [["Breakfast", /breakfast/i, at(sc.breakfast)], ["Lunch", /lunch/i, at(sc.lunch)], ["Dinner", /dinner/i, at(sc.dinner)]];
  for (const [name, re, time] of meals) {
    if (h >= time - 0.25 && h < time + 2 && !actNamed(logs, re) && (!busy || name === "Lunch")) {
      add({ id: `meal:${name}`, icon: "🍱", title: `Eat ${name.toLowerCase()}`, priority: 50, action: { type: "activity", name },
        because: `It is ${name.toLowerCase()} time and no ${name.toLowerCase()} is recorded.`, why: "Regular meals keep energy steady and stop junk-food cravings." });
    }
  }

  if (h >= 9 && h < 20 && !busy && !logs.some((l) => l.kind === "focus")) {
    add({ id: "focus", icon: "🎯", title: "Do one 25-min focus session", priority: 45, action: { type: "href", href: "/focus" },
      because: "No focus session yet today.", why: "One deep session moves your goals more than hours of distracted work." });
  }
  const ex = sc.exercise ? at(sc.exercise) : 16;
  if (h >= ex - 0.5 && h < Math.max(ex + 2.5, 20.5) && !busy && !logs.some((l) => l.kind === "workout") && !actNamed(logs, /exercise|walk|run|gym|yoga|sport/i)) {
    add({ id: "move", icon: "🏃", title: "Move for 15 minutes", priority: 40, action: { type: "activity", name: "Walk" },
      because: sc.exercise ? `Your exercise time is ${sc.exercise} and you have not moved yet today.` : "You have not moved your body yet today.", why: "A short walk or workout clears stress and makes sleep deeper tonight." });
  }
  if (h >= at(sc.sleep) - 2 && (h < at(sc.sleep) || ph.phase === "sleep") && !actNamed(logs, /brush/i)) {
    add({ id: "brush-night", icon: "🪥", title: "Brush before bed", priority: 58, action: { type: "activity", name: "Brush teeth" },
      because: "Night time and no night brushing recorded.", why: "Night brushing matters most: saliva drops while you sleep and bacteria get free time." });
  }

  // What has really been lacking today and over the last week.
  const best = new Map<string, { g: ReturnType<typeof gaps>["gaps"][number]; when: string }>();
  for (const [p, when] of [["week", "lately"], ["day", "today"]] as const) {
    for (const g of gaps(d, p, now).gaps) if ((best.get(g.id)?.g.severity ?? -1) < g.severity) best.set(g.id, { g, when });
  }
  for (const { g, when } of best.values()) {
    const hh = h < 4 ? h + 24 : h;
    if (hh < g.task.from || hh >= g.task.to) continue;
    if (busy && g.id !== "water") continue;
    add({ id: `gap:${g.id}`, icon: g.icon, title: g.task.title, priority: Math.round(52 + g.severity * 30), action: g.task.action,
      because: `${g.label} is lacking ${when}: ${g.have} (you need ${g.need}).`, why: g.task.why });
  }

  if (!out.length && !busy) {
    add({ id: "read", icon: "📚", title: "Read 10 pages of a good book", priority: 5, action: { type: "library" },
      because: "Your important tasks are done for now.", why: "Free time is the best time to grow. Ten pages a day is about 18 books a year." });
  }
  const seen = new Set<string>();
  return out.sort((a, b) => b.priority - a.priority).filter((t) => (seen.has(t.title) ? false : (seen.add(t.title), true)));
}
