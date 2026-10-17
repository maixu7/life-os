import { sumMl } from "@/lib/goals";
import { logKarma } from "@/lib/karma";
import { MEDIA, type MediaType } from "@/lib/media";
import type { CustomItem, Data, Log, Settings } from "@/lib/store";
import { toDay } from "@/lib/store";

// Habit quests: real-life habits the app assigns, checks automatically from your
// records, and tracks until they become automatic (21 days formed, 66 mastered).

type Check = { done: boolean; progress: number; target: number; unit: string; evidence: Log[] };
export type HabitTpl = {
  id: string; name: string; icon: string; why: string; tiny: string;
  // Hours of the day when the coach should remind you.
  window: [number, number];
  // Limit habits are only judged once the day is (almost) over.
  limit?: boolean;
  check: (logs: Log[], s: Settings) => Check;
};

const act = (logs: Log[], re: RegExp) => logs.filter((l) => l.kind === "activity" && re.test(String(l.data.name ?? "")));
const hourOf = (l: Log) => new Date(l.created_at).getHours() + new Date(l.created_at).getMinutes() / 60;
const goodMediaMin = (logs: Log[]) => logs.filter((l) => (l.kind === "media" && MEDIA[l.data.type as MediaType]?.good) || l.kind === "reading");
const badFun = (logs: Log[]) => logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity"));
const mins = (ls: Log[], dflt = 0) => ls.reduce((n, l) => n + (Number(l.data.minutes) || dflt), 0);
const res = (progress: number, target: number, unit: string, evidence: Log[]): Check => ({ done: progress >= target, progress, target, unit, evidence });

export const HABITS: HabitTpl[] = [
  { id: "brush2", name: "Brush twice a day", icon: "🪥", window: [6, 23], tiny: "Brush once in the morning and once before bed.",
    why: "Night brushing protects your teeth while saliva is low in sleep. Strong teeth, fresh breath, confident smile.",
    check: (l) => { const e = act(l, /brush/i); return res(e.length, 2, "times", e); } },
  { id: "read20", name: "Read a good book 20 min", icon: "📚", window: [7, 22], tiny: "Start with 1 page. The 20 minutes come on their own.",
    why: "20 minutes a day is about 1.8 million words a year. Readers think clearer, write better and learn faster.",
    check: (l) => { const e = [...goodMediaMin(l), ...act(l, /^read$|study/i)]; return res(mins(e, 10), 20, "min", e); } },
  { id: "water", name: "Drink your full water goal", icon: "💧", window: [7, 21], tiny: "Keep a bottle on your desk and sip every time you finish a task.",
    why: "Even slight dehydration lowers focus and mood. Water is the cheapest energy potion.",
    check: (l, s) => res(sumMl(l, "water"), s.water_goal_ml, "ml", l.filter((x) => x.kind === "water")) },
  { id: "sleep2330", name: "Sleep before 11:30 pm", icon: "🌙", window: [21, 24], tiny: "Phone away at 11 pm, lights off, eyes closed.",
    why: "Deep sleep and growth hormone come mostly before 2 am. Early nights make early mornings easy.",
    check: (l) => { const e = l.filter((x) => x.kind === "sleep" && x.data.type !== "nap" && hourOf(x) >= 19 && hourOf(x) <= 23.5); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "wake7", name: "Wake up before 7 am", icon: "🌅", window: [5, 9], tiny: "Alarm across the room, water right after waking.",
    why: "The first quiet hours of the morning are the most productive of the day, and morning light fixes your sleep clock.",
    check: (l) => { const e = l.filter((x) => (x.kind === "wake" && String(x.data.time) < "07:00") || (x.kind === "activity" && /woke|wake/i.test(String(x.data.name)) && hourOf(x) < 7)); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "move", name: "Move your body daily", icon: "🏃", window: [6, 21], tiny: "A 10-minute walk counts. Shoes on, door open.",
    why: "Movement builds strength, burns stress and lifts focus for hours afterwards.",
    check: (l) => { const e = [...l.filter((x) => x.kind === "workout"), ...act(l, /exercise|walk|run|gym|yoga|sport|football|cricket|cycle|swim/i)]; return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "focus", name: "One 25-min focus session", icon: "🎯", window: [8, 21], tiny: "Phone in another room, start the Dojo timer.",
    why: "Deep focus is a superpower in a distracted world. One session a day beats hours of half-work.",
    check: (l) => { const e = l.filter((x) => x.kind === "focus" && Number(x.data.minutes) >= 25); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "limitfun", name: "Max 30 min of time-pass", icon: "🛡️", window: [18, 23], limit: true, tiny: "Watch one episode as a reward, not as a default.",
    why: "Anime, manga, reels and games are fine as rewards. Above 30 minutes they quietly eat your future.",
    check: (l) => { const e = badFun(l); const m = mins(e, 30); return { done: m <= 30, progress: m, target: 30, unit: "min used", evidence: e }; } },
  { id: "breakfast", name: "Eat breakfast before 10", icon: "🍳", window: [6, 10], tiny: "Even a banana and milk counts.",
    why: "Breakfast fuels your brain for the morning and stops junk cravings later.",
    check: (l) => { const e = [...act(l, /breakfast/i), ...l.filter((x) => x.kind === "meal")].filter((x) => hourOf(x) < 10); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "bath", name: "Bath every day", icon: "🛁", window: [6, 21], tiny: "A quick shower counts.",
    why: "A bath resets your mood, wakes you up and keeps your skin healthy.",
    check: (l) => { const e = act(l, /bath|shower/i); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "tidy", name: "Tidy your room", icon: "🧹", window: [8, 21], tiny: "Just make the bed and clear the desk.",
    why: "A clean space is a calm mind. Clutter quietly drains focus.",
    check: (l) => { const e = act(l, /clean|tidy/i); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "mindful", name: "Pray or meditate", icon: "🧘", window: [5, 22], tiny: "Two minutes of quiet breathing is enough to start.",
    why: "A few calm minutes lower stress and make it easier to resist temptations.",
    check: (l) => { const e = act(l, /pray|meditat|gratitude/i); return res(e.length ? 1 : 0, 1, "", e); } },
  { id: "milk", name: "Drink your milk goal", icon: "🥛", window: [7, 21], tiny: "One glass with breakfast, one at night.",
    why: "Calcium and protein for strong bones and muscles, especially while you are still growing.",
    check: (l, s) => res(sumMl(l, "milk"), s.milk_goal_ml, "ml", l.filter((x) => x.kind === "milk")) },
];

export const tplOf = (h: CustomItem) => HABITS.find((t) => t.id === h.config.tpl);

const DAY = 86_400_000;
const dayList = (from: string, to: string) => {
  const out: string[] = [];
  for (let t = new Date(`${from}T12:00`).getTime(); t <= new Date(`${to}T12:00`).getTime(); t += DAY) out.push(toDay(new Date(t)));
  return out;
};

export function judged(t: HabitTpl, logs: Log[], s: Settings, day: string) {
  const c = t.check(logs, s);
  // A limit habit is only "done" once the day is over (or after 9 pm today).
  if (t.limit && day === toDay(new Date()) && new Date().getHours() < 21) return { ...c, done: false, pending: c.done };
  return { ...c, pending: false };
}

export function habitStats(h: CustomItem, d: Data) {
  const t = tplOf(h)!;
  const start = toDay(new Date(String(h.config.started ?? new Date().toISOString())));
  const today = toDay(new Date());
  const byDay = new Map<string, Log[]>();
  for (const l of d.logs) if (l.day >= start) byDay.set(l.day, [...(byDay.get(l.day) ?? []), l]);
  const days = dayList(start, today).map((day) => ({ day, ...judged(t, byDay.get(day) ?? [], d.profile.settings, day) }));
  const doneDays = days.filter((x) => x.done);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].done) streak++;
    else if (i === days.length - 1) continue; // today isn't over yet
    else break;
  }
  const todayRow = days.at(-1)!;
  const stage = doneDays.length >= 66 ? "Mastered" : doneDays.length >= 21 ? "Formed" : doneDays.length >= 7 ? "Growing" : "Seed";
  return {
    t, days, doneDays, streak, today: todayRow, stage,
    total: days.length, rate: days.length ? doneDays.length / days.length : 0,
    pct21: Math.min(100, (doneDays.length / 21) * 100), pct66: Math.min(100, (doneDays.length / 66) * 100),
  };
}

// Words in "About me" that point to a habit worth building.
export const ABOUT_HINTS: [RegExp, string, string][] = [
  [/anime|manga|movie|netflix|series|youtube|reels|tiktok|insta|scroll|game|gaming|pubg|free ?fire|phone/i, "limitfun", "you mentioned screen time"],
  [/late|night owl|insomnia|can'?t sleep|sleep at [1-4]|stay up/i, "sleep2330", "you mentioned sleeping late"],
  [/wake (up )?late|lazy|tired|sleepy|oversleep/i, "wake7", "you mentioned waking late or feeling tired"],
  [/fat|weight|gym|fit|muscle|strong|exercise|belly|thin|skinny/i, "move", "you want a stronger body"],
  [/study|exam|student|class|school|college|university|homework|learn/i, "focus", "you are studying"],
  [/read|book|knowledge|novel/i, "read20", "you like reading or want more knowledge"],
  [/stress|anxi|angry|anger|sad|depress|overthink|calm/i, "mindful", "you mentioned stress"],
  [/teeth|tooth|dentist|cavit/i, "brush2", "you mentioned your teeth"],
  [/skip breakfast|no breakfast|hungry|junk/i, "breakfast", "you mentioned skipping meals or junk food"],
  [/messy|dirty room|clutter/i, "tidy", "you mentioned a messy room"],
  [/water|dehydrat|headache/i, "water", "you mentioned water or headaches"],
];

export type Suggestion = { tpl: HabitTpl; score: number; reason: string };

// Looks at the last 14 days and your "About me" and proposes the habits that would help most.
export function suggestHabits(d: Data, active: CustomItem[]): Suggestion[] {
  const taken = new Set(active.map((h) => String(h.config.tpl)));
  const since = toDay(new Date(Date.now() - 13 * DAY));
  const today = toDay(new Date());
  const byDay = new Map<string, Log[]>();
  for (const l of d.logs) if (l.day >= since && l.day < today) byDay.set(l.day, [...(byDay.get(l.day) ?? []), l]);
  const n = byDay.size;
  const about = String(d.profile.about ?? "");
  const out: Suggestion[] = [];
  for (const t of HABITS) {
    if (taken.has(t.id)) continue;
    let score = 0;
    const reasons: string[] = [];
    if (n >= 3) {
      const checks = [...byDay.values()].map((ls) => t.check(ls, d.profile.settings));
      const rate = checks.filter((c) => c.done).length / n;
      const avg = checks.reduce((s, c) => s + c.progress, 0) / n;
      score += (1 - rate) * 10;
      if (rate < 0.6) {
        if (t.id === "limitfun") reasons.push(`you averaged ${Math.round(avg)} min of time-pass a day`);
        else if (["brush2", "read20", "water", "milk"].includes(t.id)) reasons.push(`you averaged ${Math.round(avg)} ${checks[0].unit} a day (goal ${checks[0].target})`);
        else reasons.push(`you managed it on only ${Math.round(rate * n)} of the last ${n} days`);
      }
    } else if (["brush2", "water", "read20"].includes(t.id)) {
      score += 3;
      reasons.push("it is one of the best starter habits");
    }
    const hint = ABOUT_HINTS.find(([re, id]) => id === t.id && re.test(about));
    if (hint) { score += 8; reasons.push(`in your About me ${hint[2]}`); }
    if (score > 2 && reasons.filter(Boolean).length) out.push({ tpl: t, score, reason: `Because ${reasons.filter(Boolean).join(", and ")}.` });
  }
  return out.sort((a, b) => b.score - a.score);
}
