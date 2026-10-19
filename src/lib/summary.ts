import { bodyOf } from "@/lib/body";
import { gaps, type Gap } from "@/lib/gaps";
import { allFacts, daysFrom, shift, type DayFacts, type Facts } from "@/lib/review";
import { sched } from "@/lib/schedule";
import { toDay, type Data } from "@/lib/store";

// The short report: one line per area for any day, week (7 days), calendar
// month or year, compared with the period before, plus what was lacking.

export type ReportPeriod = "day" | "week" | "month" | "year";

export type Line = { icon: string; label: string; value: string; goal?: string; ok: boolean | null; trend: -1 | 0 | 1 };
export type Report = { period: ReportPeriod; from: string; to: string; label: string; logged: number; span: number; lines: Line[]; lack: Gap[]; wins: string[]; met: number; of: number };

const D = (day: string) => new Date(`${day}T12:00`);
const min = (a: string, b: string) => (a < b ? a : b);
const span = (from: string, to: string) => Math.round((D(to).getTime() - D(from).getTime()) / 86_400_000) + 1;
const lastOfMonth = (day: string) => { const d = D(day); return toDay(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); };
const fmt = (day: string, o: Intl.DateTimeFormatOptions) => D(day).toLocaleDateString("en-GB", o);

// The days a report covers, never past today. Week = the 7 days ending on the date.
export function rangeOf(period: ReportPeriod, anchor: string, today = toDay(new Date())): { from: string; to: string; label: string } {
  const a = min(anchor, today);
  if (period === "day") return { from: a, to: a, label: a === today ? "Today" : fmt(a, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) };
  if (period === "week") { const from = shift(a, -6); return { from, to: a, label: `${fmt(from, { day: "numeric", month: "short" })} – ${fmt(a, { day: "numeric", month: "short", year: "numeric" })}` }; }
  if (period === "month") return { from: `${a.slice(0, 7)}-01`, to: min(lastOfMonth(a), today), label: fmt(a, { month: "long", year: "numeric" }) };
  return { from: `${a.slice(0, 4)}-01-01`, to: min(`${a.slice(0, 4)}-12-31`, today), label: a.slice(0, 4) };
}
// Move the picked date one period back (-1) or forward (+1).
export function step(period: ReportPeriod, anchor: string, dir: -1 | 1): string {
  if (period === "day") return shift(anchor, dir);
  if (period === "week") return shift(anchor, 7 * dir);
  const d = D(anchor);
  return period === "month" ? toDay(new Date(d.getFullYear(), d.getMonth() + dir, 1, 12)) : toDay(new Date(d.getFullYear() + dir, 0, 1, 12));
}
const before = (period: ReportPeriod, from: string) => (period === "day" || period === "week" ? rangeOf(period, shift(from, -1), "9999") : rangeOf(period, step(period, from, -1), "9999"));

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

export function report(d: Data, period: ReportPeriod, anchor = toDay(new Date()), now = new Date(), f: Facts = allFacts(d), withLack = true): Report {
  const { from, to, label } = rangeOf(period, anchor, toDay(now));
  const n = span(from, to), p = before(period, from), pn = span(p.from, p.to);
  const rowsOf = (a: string, k: number) => daysFrom(a, k).map((day) => f.days.get(day)).filter((x): x is DayFacts => !!x && x.records > 0);
  const rows = rowsOf(from, n);
  const a = sums(rows), b = sums(rowsOf(p.from, pn));
  const s = d.profile.settings, sc = sched(s.schedule), body = bodyOf(d);
  const per = (x: number) => x / n, prev = (x: number) => x / pn; // per calendar day, so a short month compares fairly
  const many = n > 1;
  const lines: Line[] = [
    { icon: "📖", label: "Study", value: many ? `${h(a.study)} (${h(per(a.study))}/day)` : h(a.study), goal: `${h(sc.learnGoal)}/day`, ok: per(a.study) >= sc.learnGoal * 0.9, trend: trend(per(a.study), prev(b.study)) },
    { icon: "😴", label: "Sleep", value: a.sleep ? `${a.sleep.toFixed(1)} h${many ? " a night" : ""}` : "not logged", goal: `${s.sleep_goal_h} h`, ok: a.sleep == null ? null : a.sleep >= s.sleep_goal_h - 0.4, trend: trend(a.sleep, b.sleep) },
    { icon: "🍱", label: "Food", value: a.kcal ? `${Math.round(a.kcal)} kcal${many ? "/day" : ""}` : "not logged", ok: a.kcal == null ? null : a.kcal > 1200, trend: 0 },
    { icon: "🥩", label: "Protein", value: a.protein != null ? `${Math.round(a.protein)} g${many ? "/day" : ""}` : "not logged", goal: `${body.proteinNeed} g`, ok: a.protein == null ? null : a.protein >= body.proteinNeed * 0.9, trend: trend(a.protein, b.protein) },
    { icon: "💧", label: "Water", value: a.water ? `${Math.round(a.water)} ml${many ? "/day" : ""}` : "not logged", goal: `${s.water_goal_ml} ml`, ok: a.water == null ? null : a.water >= s.water_goal_ml * 0.8, trend: trend(a.water, b.water) },
    { icon: "🏋️", label: "Training", value: many ? `${a.moved} of ${n} days · ${a.sets} sets` : a.sets ? `${a.sets} sets` : "none", goal: many ? `${Math.ceil(n * 3 / 7)} days` : undefined, ok: many ? a.moved >= n * 3 / 7 : a.sets > 0, trend: trend(per(a.sets), prev(b.sets)) },
    { icon: "😇", label: "Angel vs Devil", value: `${a.good} vs ${a.bad}`, ok: a.good >= a.bad, trend: trend(per(a.good - a.bad), prev(b.good - b.bad)) },
    { icon: "🍟", label: "Junk food", value: `${a.junk}`, ok: a.junk <= Math.ceil(n / 3), trend: trend(per(a.junk), prev(b.junk), false) },
    { icon: "✨", label: "XP earned", value: `${a.xp}`, ok: null, trend: trend(per(a.xp), prev(b.xp)) },
  ];
  // Nothing logged: nothing to judge.
  if (!rows.length) for (const l of lines) l.ok = null;
  const judged = lines.filter((l) => l.ok != null);
  const lack = withLack && rows.length ? gaps(d, period === "day" ? "day" : "month", now, daysFrom(from, n)).gaps.slice(0, 5) : [];
  return {
    period, from, to, label, logged: rows.length, span: n, lines, lack,
    wins: lines.filter((l) => l.ok).map((l) => `${l.icon} ${l.label}`),
    met: judged.filter((l) => l.ok).length, of: judged.length,
  };
}

export const lastMonth = (day: string) => shift(`${day.slice(0, 7)}-01`, -1);

// Which report is due now and not yet seen: day after 8 PM, week on Saturday
// from 8 AM, month on the month's first Saturday from 8 AM.
// The month report looks back at the month that just ended.
export function dueReports(now = new Date()): { period: ReportPeriod; key: string; anchor: string }[] {
  const day = toDay(now), out: { period: ReportPeriod; key: string; anchor: string }[] = [];
  const sat = now.getDay() === 6 && now.getHours() >= 8;
  if (sat && now.getDate() <= 7) out.push({ period: "month", key: `month-${day.slice(0, 7)}`, anchor: lastMonth(day) });
  if (sat) out.push({ period: "week", key: `week-${day}`, anchor: day });
  if (now.getHours() >= 20) out.push({ period: "day", key: `day-${day}`, anchor: day });
  return out;
}
