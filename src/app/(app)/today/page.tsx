"use client";

import Link from "next/link";
import { useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { useTasks } from "@/components/Coach";
import { useGoals } from "@/components/Gauges";
import { learnedOn } from "@/components/Learn";
import { MEALS } from "@/components/Meals";
import { bodyOf, energy } from "@/lib/body";
import { describe } from "@/lib/describe";
import { sched } from "@/lib/schedule";
import { toDay, useApp, type Log } from "@/lib/store";

const hm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
const shift = (day: string, n: number) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + n); return toDay(d); };

type Row = { icon: string; name: string; did: string; goal: string; done: boolean; href?: string };

// One table for the day: the everyday basics, what the app asked for, and
// everything the hero actually did, with how much.
export default function TodayPage() {
  const { data, profile, saveSettings, deleteLog } = useApp();
  const [day, setDay] = useState(toDay(new Date()));
  const isToday = day === toDay(new Date());
  const goals = useGoals(day);
  const tasks = useTasks();
  const [editGoals, setEditGoals] = useState(false);
  const s = profile.settings, sc = sched(s.schedule);
  const logs = data.logs.filter((l) => l.day === day).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sum = (k: string) => logs.filter((l) => l.kind === k).reduce((n, l) => n + Number(l.data.ml ?? 0), 0);
  const first = (t: (l: Log) => boolean) => logs.find(t);
  const e = energy(data, day);
  const need = bodyOf(data).proteinNeed;
  const learn = learnedOn(data.logs, day).total;
  // Last night's sleep is logged on the day it started.
  const slept = data.logs.filter((l) => l.kind === "sleep" && l.data.end && toDay(new Date(String(l.data.end))) === day);
  const sleepH = slept.reduce((n, l) => n + (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 3.6e6, 0);
  const wake = first((l) => l.kind === "wake" || (l.kind === "activity" && /wake|woke/i.test(String(l.data.name))));
  const meal = (m: string) => logs.filter((l) => l.kind === "activity" && String(l.data.name).toLowerCase() === m.toLowerCase());

  const basics: Row[] = [
    { icon: "🌅", name: "Wake up", did: wake ? hm(wake.created_at) : "", goal: sc.wake, done: !!wake },
    { icon: "😴", name: "Sleep", did: sleepH ? `${sleepH.toFixed(1)} h` : "", goal: `${s.sleep_goal_h} h`, done: sleepH >= s.sleep_goal_h - 0.5 },
    { icon: "💧", name: "Water", did: sum("water") ? `${sum("water")} ml` : "", goal: `${s.water_goal_ml} ml`, done: sum("water") >= s.water_goal_ml },
    { icon: "🥛", name: "Milk", did: sum("milk") ? `${sum("milk")} ml` : "", goal: `${s.milk_goal_ml} ml`, done: sum("milk") >= s.milk_goal_ml },
    ...MEALS.map(([m, ic]): Row => {
      const ls = meal(m);
      const kcal = ls.reduce((n, l) => n + Number(l.data.kcal ?? 0), 0);
      return { icon: ic, name: m, did: ls.length ? `${hm(ls[0].created_at)}${kcal ? ` · ${kcal} kcal` : ""}` : "", goal: m === "Snack" ? "optional" : "1", done: ls.length > 0 || m === "Snack", href: "/food" };
    }),
    { icon: "🔥", name: "Calories", did: `${e.intake} eaten · ${e.active} burned`, goal: `${e.out} used`, done: e.intake > 0 },
    { icon: "🍗", name: "Protein", did: `${e.protein} g`, goal: `${need} g+`, done: e.protein >= need },
    { icon: "📖", name: "Learning", did: learn ? `${learn} min` : "", goal: `${sc.learnGoal} min`, done: learn >= sc.learnGoal, href: "/learn" },
  ];

  return (
    <>
      <XpHeader title="Today" icon="📋" subtitle="Everything you should do and everything you did" />
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setDay(shift(day, -1))} className="btn-ghost !px-3 !py-1">◀</button>
        <input type="date" className="input !w-auto text-center" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
        <button onClick={() => setDay(shift(day, 1))} disabled={isToday} className="btn-ghost !px-3 !py-1">▶</button>
      </div>

      <section className="card p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">🗓️ Daily basics</h2>
          <button onClick={() => setEditGoals(!editGoals)} className="text-xs text-muted">{editGoals ? "Done" : "✏️ Goals"}</button>
        </div>
        {editGoals && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <label className="text-xs text-muted">Water ml<input className="input mt-1" inputMode="numeric" defaultValue={s.water_goal_ml} onBlur={(e) => saveSettings({ water_goal_ml: Number(e.target.value) || s.water_goal_ml })} /></label>
            <label className="text-xs text-muted">Milk ml<input className="input mt-1" inputMode="numeric" defaultValue={s.milk_goal_ml} onBlur={(e) => saveSettings({ milk_goal_ml: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-muted">Sleep hours<input className="input mt-1" inputMode="decimal" defaultValue={s.sleep_goal_h} onBlur={(e) => saveSettings({ sleep_goal_h: Number(e.target.value) || s.sleep_goal_h })} /></label>
            <label className="text-xs text-muted">Learning min<input className="input mt-1" inputMode="numeric" defaultValue={sc.learnGoal} onBlur={(e) => saveSettings({ schedule: { ...s.schedule, learnGoal: Number(e.target.value) || sc.learnGoal } })} /></label>
            <label className="text-xs text-muted">Wake time<input type="time" className="input mt-1" defaultValue={sc.wake} onBlur={(e) => e.target.value && saveSettings({ schedule: { ...s.schedule, wake: e.target.value } })} /></label>
            <label className="text-xs text-muted">Bed time<input type="time" className="input mt-1" defaultValue={sc.sleep} onBlur={(e) => e.target.value && saveSettings({ schedule: { ...s.schedule, sleep: e.target.value } })} /></label>
          </div>
        )}
        <Table rows={basics} />
      </section>

      <section className="card p-3 mb-4">
        <h2 className="section-title mb-2">🎯 App quests &amp; goals</h2>
        <Table rows={goals.filter((g) => g.id !== "learn" && !g.id.startsWith("meal-")).map((g) => ({ icon: g.icon, name: g.name, did: g.have ? `${Math.round(g.have)}${g.unit ? ` ${g.unit}` : ""}` : "", goal: `${g.need}${g.unit ? ` ${g.unit}` : ""}`, done: !!g.doneAt }))} />
        {isToday && tasks.length > 0 && (
          <>
            <div className="text-xs text-muted mt-3 mb-1">Sensei says next</div>
            <ul className="space-y-1 text-xs">
              {tasks.slice(0, 6).map((t) => <li key={t.id} className="flex gap-2 rounded-lg bg-white/5 px-2 py-1.5"><span>{t.icon}</span><span className="flex-1">{t.title}</span><span className="text-muted">to do</span></li>)}
            </ul>
          </>
        )}
      </section>

      <section className="card p-3 mb-4">
        <h2 className="section-title mb-2">✅ What you did ({logs.length})</h2>
        {logs.length === 0 ? <p className="text-xs text-muted">Nothing logged on this day yet.</p> : (
          <table className="w-full text-xs">
            <tbody>
              {logs.map((l) => {
                const d = describe(l, s.currency);
                return (
                  <tr key={l.id} className="border-t border-white/5 align-top">
                    <td className="py-1.5 pr-2 text-muted tabular-nums whitespace-nowrap">{hm(l.created_at)}</td>
                    <td className="py-1.5 pr-1">{d.emoji}</td>
                    <td className="py-1.5"><div>{d.title}</div>{d.detail && <div className="text-muted">{d.detail}</div>}</td>
                    <td className="py-1.5 pl-1 text-right whitespace-nowrap">{l.xp ? <span className="text-[var(--gold)]">+{l.xp}</span> : null}
                      <button aria-label={`Delete ${d.title}`} onClick={() => confirm(`Delete "${d.title}"?`) && deleteLog(l.id)} className="ml-2 text-muted">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Link href="/" className="block text-center text-xs text-[var(--accent2)] mt-3">+ Log something on Base Camp</Link>
      </section>
    </>
  );
}

function Table({ rows }: { rows: Row[] }) {
  const done = rows.filter((r) => r.done).length;
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-muted text-left"><th className="font-normal pb-1" colSpan={2}>Task</th><th className="font-normal pb-1">Done</th><th className="font-normal pb-1">Goal</th><th className="font-normal pb-1 text-right">{done}/{rows.length}</th></tr></thead>
      <tbody>
        {rows.map((r) => {
          const name = r.href ? <Link href={r.href} className="underline decoration-white/20">{r.name}</Link> : r.name;
          return (
            <tr key={r.name} className="border-t border-white/5">
              <td className="py-1.5 pr-1 w-6">{r.icon}</td>
              <td className="py-1.5 pr-2">{name}</td>
              <td className="py-1.5 pr-2">{r.did || <span className="text-muted">—</span>}</td>
              <td className="py-1.5 pr-2 text-muted">{r.goal}</td>
              <td className={`py-1.5 text-right ${r.done ? "text-emerald-300" : "text-muted"}`}>{r.done ? "✓" : "○"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
