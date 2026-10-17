import { toDay } from "@/lib/store";

// The hero's daily timetable: when they wake and sleep, work, take breaks,
// eat, and which days are free. The Sensei uses it to know what time it is
// in the hero's life, not just on the clock.

export type Brk = { start: string; end: string; label: string };
export type Schedule = {
  wake: string; sleep: string; weekendWake: string; weekendSleep: string;
  workType: "school" | "college" | "job" | "freelance" | "none"; workPlace: string;
  workDays: number[]; workStart: string; workEnd: string; halfDays: number[]; halfEnd: string;
  breaks: Brk[]; commute: number;
  holidays: string[]; vacationFrom: string; vacationTo: string;
  breakfast: string; lunch: string; dinner: string; tea: string;
  studyStart: string; studyEnd: string; exercise: string; prayer: string;
  napAllowed: boolean; napStart: string; napEnd: string;
  windDown: number; phoneFreeMorning: number; quietStart: string; quietEnd: string;
  screenLimit: number; focusLength: number; waterEvery: number; readGoal: number; codeGoal: number;
  popups: "off" | "low" | "normal" | "high";
};

export const DEFAULT_SCHEDULE: Schedule = {
  wake: "07:00", sleep: "23:00", weekendWake: "08:00", weekendSleep: "23:30",
  workType: "school", workPlace: "School", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "17:00", halfDays: [], halfEnd: "13:00",
  breaks: [{ start: "13:00", end: "14:00", label: "Lunch break" }], commute: 30,
  holidays: [], vacationFrom: "", vacationTo: "",
  breakfast: "08:00", lunch: "13:00", dinner: "20:00", tea: "17:30",
  studyStart: "18:00", studyEnd: "20:00", exercise: "18:00", prayer: "",
  napAllowed: true, napStart: "14:30", napEnd: "15:30",
  windDown: 30, phoneFreeMorning: 30, quietStart: "", quietEnd: "",
  screenLimit: 60, focusLength: 25, waterEvery: 120, readGoal: 10, codeGoal: 30,
  popups: "normal",
};

export const sched = (s?: Partial<Schedule> | null): Schedule => ({ ...DEFAULT_SCHEDULE, ...(s ?? {}) });

export const toMin = (t: string) => { if (!t) return NaN; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes();
// Is minute x inside [a, b), allowing ranges that cross midnight.
export const within = (x: number, a: number, b: number) => (Number.isNaN(a) || Number.isNaN(b) ? false : a <= b ? x >= a && x < b : x >= a || x < b);
export const fmt12 = (t: string) => {
  if (!t) return "";
  const m = toMin(t); const h = Math.floor(m / 60) % 24;
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export type DayType = "work" | "half" | "holiday" | "vacation" | "free";
export const DAY_LABEL: Record<DayType, string> = { work: "💼 Work day", half: "🌗 Half day", holiday: "🎉 Holiday", vacation: "🏖️ Vacation", free: "🌴 Free day" };

export function dayType(s: Schedule, d = new Date()): DayType {
  const day = toDay(d);
  if (s.holidays.includes(day)) return "holiday";
  if (s.vacationFrom && s.vacationTo && day >= s.vacationFrom && day <= s.vacationTo) return "vacation";
  if (s.workType === "none") return "free";
  if (s.halfDays.includes(d.getDay())) return "half";
  return s.workDays.includes(d.getDay()) ? "work" : "free";
}
export const isOffDay = (t: DayType) => t !== "work" && t !== "half";

// Bed and wake times for the night that contains `d` (weekend times on free days).
export function sleepTimes(s: Schedule, d = new Date()) {
  const tomorrow = new Date(d); tomorrow.setDate(d.getDate() + (d.getHours() < 12 ? 0 : 1));
  const tonightOff = isOffDay(dayType(s, tomorrow));
  return { sleep: tonightOff ? s.weekendSleep : s.sleep, wake: tonightOff ? s.weekendWake : s.wake };
}

export type Phase = "sleep" | "winddown" | "morning" | "commute" | "work" | "break" | "nap" | "study" | "free";
export type Now = { phase: Phase; day: DayType; label: string; brk?: Brk; minsLeft?: number };

export function phaseNow(s: Schedule, d = new Date()): Now {
  const x = nowMin(d);
  const day = dayType(s, d);
  const { sleep, wake } = sleepTimes(s, d);
  const sl = toMin(sleep), wk = toMin(wake);
  const left = (end: number) => ((end - x + 1440) % 1440);
  if (within(x, sl, wk)) return { phase: "sleep", day, label: "Sleep time" };
  if (within(x, (sl - s.windDown + 1440) % 1440, sl)) return { phase: "winddown", day, label: "Wind-down before bed", minsLeft: left(sl) };
  if (within(x, wk, wk + s.phoneFreeMorning)) return { phase: "morning", day, label: "Phone-free morning", minsLeft: left(wk + s.phoneFreeMorning) };
  if (!isOffDay(day)) {
    const ws = toMin(s.workStart), we = toMin(day === "half" ? s.halfEnd : s.workEnd);
    const brk = s.breaks.find((b) => within(x, toMin(b.start), toMin(b.end)));
    if (within(x, ws, we)) return brk ? { phase: "break", day, label: brk.label || "Break", brk, minsLeft: left(toMin(brk.end)) } : { phase: "work", day, label: `${s.workPlace || "Work"} hours`, minsLeft: left(we) };
    if (s.commute && (within(x, ws - s.commute, ws) || within(x, we, we + s.commute))) return { phase: "commute", day, label: "Commute" };
  }
  if (s.napAllowed && within(x, toMin(s.napStart), toMin(s.napEnd))) return { phase: "nap", day, label: "Nap window" };
  if (within(x, toMin(s.studyStart), toMin(s.studyEnd))) return { phase: "study", day, label: "Study time" };
  return { phase: "free", day, label: isOffDay(day) ? "Free time (day off)" : "Free time" };
}

export const isQuiet = (s: Schedule, d = new Date()) => within(nowMin(d), toMin(s.quietStart), toMin(s.quietEnd));

// What the Sensei says when you open the app in each part of your day.
export const PHASE_LINES: Record<Phase, string[]> = {
  sleep: ["It's past your bedtime. Why are you awake?", "Your body should be repairing itself right now. Why the phone?", "Night owl alert. What's keeping you up?"],
  winddown: ["Wind-down time. Dim the lights and put the screen away soon.", "Bedtime is close. Brush, plan tomorrow, then rest.", "Good time for 10 pages of a paper book before sleep."],
  morning: ["Phone-free morning, hero. Water, sunlight and stretch first.", "You just woke up. Win the first hour before the feed wins you.", "Make the bed, drink water, then check the phone."],
  commute: ["On the way? Listen to something that grows you.", "Commute time: a podcast or audiobook turns travel into training."],
  work: ["It's working hours. What brings you to the app? Keep it quick.", "Focus mode: finish the task in front of you first.", "Work time, hero. Log it fast and get back in the zone."],
  break: ["Break time! Drink water, stand up, rest your eyes.", "Good break: walk a little and stay off the doom-scroll.", "Breaks recharge you. Eat, stretch, breathe."],
  nap: ["Nap window: 20 minutes max keeps you fresh, not groggy."],
  study: ["Study time. One focus session now beats three later.", "Books open, phone face down. Let's go."],
  free: ["Free time! Pick something that grows you: read, train or code.", "No work right now. A great time for your habit quests.", "Free time is where heroes are made."],
};
