import { bodyOf } from "@/lib/body";
import { gaps, type Gap } from "@/lib/gaps";
import { allFacts, daysFrom, shift, type DayFacts, type Facts } from "@/lib/review";
import { sched } from "@/lib/schedule";
import { toDay, type Data } from "@/lib/store";

// The short report: one line per area for a day, week or month, compared with
// the period before, plus what was lacking and what to do next.

export type ReportPeriod = "day" | "week" | "month";
export const REPORT_DAYS: Record<ReportPeriod, number> = { day: 1, week: 7, month: 30 };

export type Line = { icon: string; label: string; value: string; goal?: string; ok: boolean | null; trend: -1 | 0 | 1 };
export type Report = { period: ReportPeriod; from: string; to: string; logged: number; span: number; lines: Line[]; lack: Gap[]; wins: string[]; met: number; of: number };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function sums(rows: DayFacts[]) {
  const fed = rows.filter((r) => r.kcal > 0);
  return {
    study: rows.reduce((n, r) => n + r.studyMin, 0),
    sleep: avg(rows.map((r) => r.sleepH).filter((x): x is number => !!x)),
    kcal: avg(fed.map((r) => r.kcal)), protein: avg(fed.map((r) => r.protein)),
    sets: rows.reduce((n, r) => n + r.sets, 0), moved: rows.filter((r) => r.sets > 0).length,
    water: avg(rows.filter((r) => r.records).map((r) => r.water)),
    good: rows.reduce((n, r) => n + r.good, 0), bad: rows.reduce((n, r) => n + r.bad, 0),
    junk: rows.reduce((n, r) => n + r.junk, 0), xp: rows.reduce((n, r) => n + r.xp, 0),
  };
}
const trend = (a: number | null, b: number | null, higherIsBetter = true): -1 | 0 | 1 => {
  if (a == null || b == null || Math.abs(a - b) < Math.max(1, Math.abs(b) * 0.05)) return 0;
  return (a > b) === higherIsBetter ? 1 : -1;
};
const h = (min: number) => (min >= 60 ? `${Math.round((min / 60) * 10) / 10} h` : `${Math.round(min)} min`);

export function report(d: Data, period: ReportPeriod, now = new Date(), f: Facts = allFacts(d)): Report {
  const span = REPORT_DAYS[period];
  const to = toDay(now), from = shift(to, -(span - 1));
  const rows = daysFrom(from, span).map((day) => f.days.get(day)).filter((x): x is DayFacts => !!x && x.records > 0);
  const prevRows = daysFrom(shift(from, -span), span).map((day) => f.days.get(day)).filter((x): x is DayFacts => !!x && x.records > 0);
  const a = sums(rows), b = sums(prevRows);
  const s = d.profile.settings, sc = sched(s.schedule), body = bodyOf(d);
  const per = (x: number) => x / Math.max(1, span); // per calendar day
  const lines: Line[] = [
    { icon: "📖", label: "Study", value: span > 1 ? `${h(a.study)} (${h(per(a.study))}/day)` : h(a.study), goal: `${h(sc.learnGoal)}/day`, ok: per(a.study) >= sc.learnGoal * 0.9, trend: trend(a.study, b.study) },
    { icon: "😴", label: "Sleep", value: a.sleep ? `${a.sleep.toFixed(1)} h${span > 1 ? " a night" : ""}` : "not logged", goal: `${s.sleep_goal_h} h`, ok: a.sleep == null ? null : a.sleep >= s.sleep_goal_h - 0.4, trend: trend(a.sleep, b.sleep) },
    { icon: "🍱", label: "Food", value: a.kcal ? `${Math.round(a.kcal)} kcal${span > 1 ? "/day" : ""}` : "not logged", ok: a.kcal == null ? null : a.kcal > 1200, trend: 0 },
    { icon: "🥩", label: "Protein", value: a.protein != null ? `${Math.round(a.protein)} g${span > 1 ? "/day" : ""}` : "not logged", goal: `${body.proteinNeed} g`, ok: a.protein == null ? null : a.protein >= body.proteinNeed * 0.9, trend: trend(a.protein, b.protein) },
    { icon: "💧", label: "Water", value: a.water ? `${Math.round(a.water)} ml${span > 1 ? "/day" : ""}` : "not logged", goal: `${s.water_goal_ml} ml`, ok: a.water == null ? null : a.water >= s.water_goal_ml * 0.8, trend: trend(a.water, b.water) },
    { icon: "🏋️", label: "Training", value: span > 1 ? `${a.moved} of ${span} days · ${a.sets} sets` : a.sets ? `${a.sets} sets` : "none", goal: span > 1 ? `${Math.ceil(span * 3 / 7)} days` : undefined, ok: span > 1 ? a.moved >= span * 3 / 7 : a.sets > 0, trend: trend(a.sets, b.sets) },
    { icon: "😇", label: "Angel vs Devil", value: `${a.good} vs ${a.bad}`, ok: a.good >= a.bad, trend: trend(a.good - a.bad, b.good - b.bad) },
    { icon: "🍟", label: "Junk food", value: `${a.junk}`, ok: a.junk <= Math.ceil(span / 3), trend: trend(a.junk, b.junk, false) },
    { icon: "✨", label: "XP earned", value: `${a.xp}`, ok: null, trend: trend(a.xp, b.xp) },
  ];
  // Nothing logged: nothing to judge.
  if (!rows.length) for (const l of lines) l.ok = null;
  const judged = lines.filter((l) => l.ok != null);
  const lack = gaps(d, period, now).gaps.sort((x, y) => y.severity - x.severity).slice(0, 5);
  return {
    period, from, to, logged: rows.length, span, lines, lack,
    wins: lines.filter((l) => l.ok).map((l) => `${l.icon} ${l.label}`),
    met: judged.filter((l) => l.ok).length, of: judged.length,
  };
}

// Which report is due now and not yet seen: day after 8 PM, week on Saturday
// from 8 AM, month on the month's first Saturday from 8 AM.
export function dueReports(now = new Date()): { period: ReportPeriod; key: string }[] {
  const day = toDay(now), out: { period: ReportPeriod; key: string }[] = [];
  const sat = now.getDay() === 6 && now.getHours() >= 8;
  if (sat && now.getDate() <= 7) out.push({ period: "month", key: `month-${day.slice(0, 7)}` });
  if (sat) out.push({ period: "week", key: `week-${day}` });
  if (now.getHours() >= 20) out.push({ period: "day", key: `day-${day}` });
  return out;
}
