"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { openSlotSheet } from "@/components/Blocks";
import { useRunAction } from "@/components/Coach";
import { lateText, missionStats, ownTasks, picks, steps, type RoutineItem, type Step, type StepKind } from "@/lib/mission";
import { AREAS, type Area } from "@/lib/mytasks";
import { fmt12, sched, type Schedule } from "@/lib/schedule";
import { uid } from "@/lib/layout";
import { toDay, useApp } from "@/lib/store";

// ⚔ Daily mission on Base: your schedule as a live checklist (✓ on time /
// late / early, ✗ missed), the app's picks for today, your own tasks, and a
// report of how disciplined you've been.

const MARK = { done: "✓", missed: "✗", due: "⏳", later: "○" } as const;
const COLOR = { done: "text-emerald-400 bg-emerald-500/15", missed: "text-rose-400 bg-rose-500/15", due: "text-amber-300 bg-amber-400/15", later: "text-muted bg-white/5" } as const;

export function DailyMission() {
  const { data, logActivity } = useApp();
  const run = useRunAction();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);
  const [report, setReport] = useState(false);
  const [late, setLate] = useState<Step | null>(null);
  const day = toDay(new Date());
  const list = steps(data, day);
  const own = ownTasks(data, day);
  const pk = useMemo(() => picks(data, day), [data, day]);
  const done = list.filter((s) => s.state === "done").length + own.filter((o) => o.done).length + pk.filter((p) => p.done).length;
  const missed = list.filter((s) => s.state === "missed").length;
  const total = list.length + own.length + pk.length;
  // Tick a step: wake/sleep/meals open their own sheet; the rest is logged now.
  const tickStep = (s: Step, at = new Date()) => {
    if (s.kind === "wake") return openSlotSheet({ kind: "wake" });
    if (s.kind === "sleep") return openSlotSheet({ kind: "sleep" });
    if (s.kind === "meal") return openSlotSheet({ kind: "meal", name: s.label });
    if (s.kind === "water") { logActivity("water", { ml: s.ml ?? 250, name: "Water", routine: s.id }, at); return; }
    logActivity("activity", { name: s.label, routine: s.id }, at);
  };
  const rows = [
    ...list.map((s) => ({ t: s.time, el: <StepRow key={s.id} s={s} onTick={() => tickStep(s)} onLate={() => setLate(s)} onGo={() => (s.href ? undefined : run(s.action))} /> })),
    ...own.map((o) => ({ t: o.time, el: (
      <li key={o.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
        <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[o.done ? "done" : "later"]}`}>{o.done ? "✓" : "○"}</span>
        <span className="w-16 text-xs text-muted shrink-0">{fmt12(o.time)}</span>
        <span className="flex-1 min-w-0 text-sm truncate">{o.icon} {o.label}<span className="block text-[10px] text-muted">your task{o.want > 1 ? ` · ${o.got}/${o.want} ${AREAS[o.area].unit}` : ""}</span></span>
        {!o.done && o.area === "other" && <button onClick={() => logActivity("activity", { name: o.label }, new Date())} className="chip !py-0.5 text-[11px]">✓ Done</button>}
      </li>
    ) })),
  ].sort((a, b) => a.t.localeCompare(b.t));
  return (
    <section className="card p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">⚔ Daily mission</h2>
        <span className="font-game text-sm"><span className="text-emerald-400">✓{done}</span> <span className="text-rose-400">✗{missed}</span> <span className="text-muted">/ {total}</span></span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2 flex">
        <div className="h-full bg-emerald-400" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
        <div className="h-full bg-rose-500" style={{ width: `${(missed / Math.max(1, total)) * 100}%` }} />
      </div>
      <ul className="space-y-1">{rows.map((r) => r.el)}</ul>
      {pk.length > 0 && (
        <>
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)] mt-3 mb-1">TODAY&apos;S PICKS (BY THE APP)</div>
          <ul className="space-y-1">
            {pk.map((p) => (
              <li key={p.id}>
                <Link href={p.href} className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
                  <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[p.done ? "done" : "later"]}`}>{p.done ? "✓" : "○"}</span>
                  <span className="flex-1 min-w-0 text-sm truncate">{p.icon} {p.title}<span className="block text-[10px] text-muted truncate">{p.got}/{p.target} {AREAS[p.area].unit} · {p.why}</span></span>
                  <span className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <button onClick={() => setAdd(true)} className="chip justify-center !py-1.5 text-xs">＋ My task</button>
        <button onClick={() => setEdit(true)} className="chip justify-center !py-1.5 text-xs">✏️ Schedule</button>
        <button onClick={() => setReport(true)} className="chip justify-center !py-1.5 text-xs">📊 Report</button>
      </div>
      {edit && <RoutineSheet onClose={() => setEdit(false)} />}
      {add && <OwnTaskSheet onClose={() => setAdd(false)} />}
      {report && <MissionReport onClose={() => setReport(false)} />}
      {late && <DoneAtSheet s={late} onClose={() => setLate(null)} onSave={(at) => { tickStep(late, at); setLate(null); }} />}
    </section>
  );
}

function StepRow({ s, onTick, onLate, onGo }: { s: Step; onTick: () => void; onLate: () => void; onGo: () => void }) {
  const sub = s.state === "done" ? `done ${new Date(s.at!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${lateText(s.diff)}`
    : s.state === "missed" ? "didn't happen" : s.state === "due" ? "now" : "later";
  const body = (
    <>
      <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[s.state]}`}>{MARK[s.state]}</span>
      <span className="w-16 text-xs text-muted shrink-0">{fmt12(s.time)}</span>
      <span className="flex-1 min-w-0 text-sm truncate">{s.icon} {s.label}
        <span className={`block text-[10px] ${s.state === "done" ? ((s.diff ?? 0) > 15 ? "text-amber-300" : (s.diff ?? 0) < -15 ? "text-sky-300" : "text-emerald-400") : s.state === "missed" ? "text-rose-400" : "text-muted"}`}>{sub}</span>
      </span>
    </>
  );
  return (
    <li className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2 py-1.5">
      {s.href ? <Link href={s.href} className="flex flex-1 min-w-0 items-center gap-2">{body}</Link> : <button onClick={onGo} className="flex flex-1 min-w-0 items-center gap-2 text-left">{body}</button>}
      {s.state !== "done" && <button onClick={onTick} className="chip !px-2 !py-0.5 text-[11px] shrink-0">✓</button>}
      {s.state !== "done" && !["wake", "sleep", "meal"].includes(s.kind) && <button onClick={onLate} aria-label="Done at another time" className="chip !px-2 !py-0.5 text-[11px] shrink-0">🕒</button>}
    </li>
  );
}

function DoneAtSheet({ s, onClose, onSave }: { s: Step; onClose: () => void; onSave: (at: Date) => void }) {
  const [time, setTime] = useState(s.time);
  return (
    <Sheet title={`${s.icon} ${s.label}`} onClose={onClose}>
      <label className="flex items-center gap-2 text-sm">Done at <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <button onClick={() => { const at = new Date(); const [h, m] = time.split(":").map(Number); at.setHours(h, m, 0, 0); onSave(at); }} className="btn-primary w-full">Save</button>
    </Sheet>
  );
}

// ---------- ✏️ My daily schedule ----------
const KIND: [StepKind, string][] = [["step", "⭐ Step"], ["meal", "🍱 Meal"], ["water", "💧 Water"], ["study", "📖 Study"], ["workout", "🏋️ Exercise"], ["work", "💼 Work"]];
// Built-in steps edit these schedule times.
const FIELD: Record<string, keyof Schedule> = { "b-wake": "wake", "b-breakfast": "breakfast", "b-work": "workStart", "b-lunch": "lunch", "b-dinner": "dinner", "b-study": "studyStart", "b-exercise": "exercise", "b-sleep": "sleep" };

function RoutineSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, saveSettings } = useApp();
  const sc = sched(profile.settings.schedule);
  const [own, setOwn] = useState<RoutineItem[]>(profile.settings.routine ?? []);
  const [s, setS] = useState(sc);
  const base = steps({ ...data, profile: { ...profile, settings: { ...profile.settings, schedule: s, routine: [] } } }, toDay(new Date()));
  const setItem = (id: string, p: Partial<RoutineItem>) => setOwn((o) => o.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const save = () => { saveSettings({ schedule: s, routine: own.filter((x) => x.label.trim() && /^\d\d:\d\d$/.test(x.time)).sort((a, b) => a.time.localeCompare(b.time)) }); onClose(); };
  return (
    <Sheet title="✏️ My daily schedule" onClose={onClose}>
      <p className="text-xs text-muted">Every step here is checked each day: ✓ with how early or late, ✗ if it didn&apos;t happen. Everyday steps from your schedule can&apos;t be removed; change their time. Add your own steps (bathroom, brush, water…).</p>
      <ul className="space-y-1">
        {base.map((b) => (
          <li key={b.id} className="flex items-center gap-2 text-sm">
            <input type="time" className="input !w-28 !py-1" value={String(s[FIELD[b.id]] ?? b.time)} onChange={(e) => setS({ ...s, [FIELD[b.id]]: e.target.value })} />
            <span className="flex-1 truncate">{b.icon} {b.label}</span><span className="text-[10px] text-muted">🔒 every day</span>
          </li>
        ))}
        {own.map((o) => (
          <li key={o.id} className="flex items-center gap-1.5 text-sm">
            <input type="time" className="input !w-28 !py-1" value={o.time} onChange={(e) => setItem(o.id, { time: e.target.value })} />
            <input className="input flex-1 !py-1" value={o.label} placeholder="Brush teeth" onChange={(e) => setItem(o.id, { label: e.target.value })} />
            <select className="input !w-24 !py-1 text-xs" value={o.kind} onChange={(e) => setItem(o.id, { kind: e.target.value as StepKind })}>{KIND.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            {o.kind === "water" && <input className="input !w-16 !py-1" inputMode="numeric" value={o.ml ?? 250} onChange={(e) => setItem(o.id, { ml: Number(e.target.value) || 250 })} />}
            <button aria-label="Remove" onClick={() => setOwn((x) => x.filter((y) => y.id !== o.id))} className="text-rose-300 px-1">✕</button>
          </li>
        ))}
      </ul>
      <button onClick={() => setOwn((o) => [...o, { id: uid(), time: "06:00", label: "", kind: "step" }])} className="btn-ghost w-full border border-dashed border-white/25">＋ Add a step (time + what)</button>
      <button onClick={save} className="btn-primary w-full">Save schedule</button>
    </Sheet>
  );
}

// ---------- ＋ My own task (e.g. 12:00 go shopping) ----------
function OwnTaskSheet({ onClose }: { onClose: () => void }) {
  const { update } = useApp();
  const [name, setName] = useState("");
  const [time, setTime] = useState("12:00");
  const [area, setArea] = useState<Area>("other");
  const [every, setEvery] = useState(false);
  const save = () => {
    if (!name.trim()) return;
    const config = { area, time, days: [0, 1, 2, 3, 4, 5, 6], date: every ? undefined : toDay(new Date()), level: "normal" };
    update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "task", name: name.trim(), sort: Date.now(), config }] }));
    onClose();
  };
  return (
    <Sheet title="＋ My own task" onClose={onClose}>
      <input className="input" placeholder="Go shopping, call mum, clean room…" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">At <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <div className="flex flex-wrap gap-1">{(Object.keys(AREAS) as Area[]).map((a) => <button key={a} onClick={() => setArea(a)} className={`chip !py-0.5 text-[11px] ${area === a ? "chip-on" : ""}`}>{AREAS[a].icon} {AREAS[a].label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={every} onChange={(e) => setEvery(e.target.checked)} /> Every day (otherwise just today)</label>
      <button disabled={!name.trim()} onClick={save} className="btn-primary w-full disabled:opacity-40">Add to today&apos;s mission</button>
    </Sheet>
  );
}

// ---------- 📊 Day / month / year report ----------
export function MissionReport({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [by, setBy] = useState<"day" | "month" | "year">("month");
  const now = new Date();
  const from = by === "day" ? toDay(now) : by === "month" ? toDay(new Date(now.getTime() - 29 * 86_400_000)) : toDay(new Date(now.getTime() - 364 * 86_400_000));
  const r = useMemo(() => missionStats(data, from, toDay(now)), [data, from]); // eslint-disable-line react-hooks/exhaustive-deps
  // Year: one bar per month.
  const bars = by === "year"
    ? [...r.rows.reduce((m, x) => { const k = x.day.slice(0, 7); const v = m.get(k) ?? { label: k.slice(5), done: 0, missed: 0 }; v.done += x.done; v.missed += x.missed; return m.set(k, v); }, new Map<string, { label: string; done: number; missed: number }>()).values()]
    : r.rows.map((x) => ({ label: x.day.slice(8), done: x.done, missed: x.missed }));
  const max = Math.max(1, ...bars.map((b) => b.done + b.missed));
  const pct = Math.round((r.done / Math.max(1, r.done + r.missed)) * 100);
  return (
    <Sheet title="📊 Daily mission report" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">{(["day", "month", "year"] as const).map((b) => <button key={b} onClick={() => setBy(b)} className={`chip justify-center capitalize ${by === b ? "chip-on" : ""}`}>{b === "day" ? "Today" : b === "month" ? "30 days" : "Year"}</button>)}</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{r.done + r.missed}</div><div className="text-[10px] text-muted">checked</div></div>
        <div className="rounded-xl bg-emerald-500/15 p-2"><div className="font-game text-lg text-emerald-400">✓{r.done}</div><div className="text-[10px] text-muted">done</div></div>
        <div className="rounded-xl bg-rose-500/15 p-2"><div className="font-game text-lg text-rose-400">✗{r.missed}</div><div className="text-[10px] text-muted">missed</div></div>
        <div className="rounded-xl bg-amber-400/15 p-2"><div className="font-game text-lg text-amber-300">{r.late}</div><div className="text-[10px] text-muted">late</div></div>
      </div>
      <div className="rounded-xl p-3 text-center" style={{ background: `${r.path.color}22` }}>
        <div className="text-3xl">{r.path.icon}</div>
        <div className="font-bold" style={{ color: r.path.color }}>{r.path.side === "angel" ? "Angel way" : r.path.side === "devil" ? "Devil way" : "At the crossroads"}: {r.path.name}</div>
        <div className="text-xs text-muted">Discipline {pct}%: {r.done} of {r.done + r.missed} done{r.late ? `, ${r.late} late` : ""}. Missions get a bit harder when you keep them and easier when you miss many.</div>
      </div>
      {by !== "day" && (
        <div className="flex items-end gap-0.5 h-32">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-0.5 min-w-0">
              <div className="w-full bg-rose-500/80 rounded-t-sm" style={{ height: `${(b.missed / max) * 100}%` }} />
              <div className="w-full bg-emerald-400/90" style={{ height: `${(b.done / max) * 100}%` }} />
              <span className="text-[8px] text-muted">{b.label}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] text-muted">🟩 done · 🟥 missed, per {by === "year" ? "month" : "day"}.</div>
    </Sheet>
  );
}
