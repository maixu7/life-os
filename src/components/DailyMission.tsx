"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { openSlotSheet } from "@/components/Blocks";
import { useRunAction } from "@/components/Coach";
import { lateText, missionStats, ownTasks, picks, steps, type RoutineItem, type Step, type StepEdit, type StepKind } from "@/lib/mission";
import { EditLog } from "@/components/EditLog";
import { AREAS, type Area } from "@/lib/mytasks";
import { fmt12, sched, toMin, type Schedule } from "@/lib/schedule";
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
  const [open, setOpen] = useState<Step | null>(null);
  const day = toDay(new Date());
  const list = steps(data, day);
  const own = ownTasks(data, day);
  const pk = useMemo(() => picks(data, day), [data, day]);
  const done = list.filter((s) => s.state === "done").length + own.filter((o) => o.done).length + pk.filter((p) => p.done).length;
  const missed = list.filter((s) => s.state === "missed").length;
  const total = list.length + own.length + pk.length;
  // Tick a step: wake/sleep/meals open their own sheet; the rest is logged now.
  // A step with a start and an end that is already over asks for the real times first.
  const tickStep = (s: Step, at = new Date(), end?: Date, ask = true) => {
    if (s.kind === "wake") return openSlotSheet({ kind: "wake" });
    if (s.kind === "sleep") return openSlotSheet({ kind: "sleep" });
    if (s.kind === "meal") return openSlotSheet({ kind: "meal", name: s.label });
    if (ask && s.end && s.state === "missed") return setOpen(s);
    if (s.kind === "water") { logActivity("water", { ml: s.ml ?? 250, name: s.label.replace(/\s*\d+\s*ml$/i, "") || "Water", routine: s.id }, at); return; }
    const kind = s.kind === "code" ? "coding" : "activity";
    const minutes = end ? Math.max(1, Math.round((end.getTime() - at.getTime()) / 60_000)) : undefined;
    logActivity(kind, { name: s.label, routine: s.id, ...(end ? { start: at.toISOString(), end: end.toISOString(), minutes } : {}) }, at);
  };
  const rows = [
    ...list.map((s) => ({ t: s.time, el: <StepRow key={s.id} s={s} onTick={() => tickStep(s)} onOpen={() => setOpen(s)} /> })),
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
      {open && <StepSheet s={open} onClose={() => setOpen(null)} onGo={() => { if (!open.href) run(open.action); }} onDone={(at, end) => { tickStep(open, at, end, false); setOpen(null); }} />}
    </section>
  );
}

const atHM = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function StepRow({ s, onTick, onOpen }: { s: Step; onTick: () => void; onOpen: () => void }) {
  const sub = s.state === "done" ? `done ${atHM(s.at!)}${s.doneEnd ? `–${fmt12(s.doneEnd)}` : ""} · ${lateText(s.diff)}`
    : s.state === "missed" ? "didn't happen" : s.state === "due" ? "now" : s.end ? `${Math.round(((toMin(s.end) - toMin(s.time) + 1440) % 1440))} min` : "";
  return (
    <li className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2 py-1.5">
      <button onClick={onOpen} className="flex flex-1 min-w-0 items-center gap-2 text-left">
        <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[s.state]}`}>{MARK[s.state]}</span>
        <span className="w-[4.5rem] text-[11px] leading-tight text-muted shrink-0">{fmt12(s.time)}{s.end && <span className="block text-[9px]">to {fmt12(s.end)}</span>}</span>
        <span className="flex-1 min-w-0 text-sm truncate">{s.icon} {s.label}
          <span className={`block text-[10px] truncate ${s.state === "done" ? ((s.diff ?? 0) > 15 ? "text-amber-300" : (s.diff ?? 0) < -15 ? "text-sky-300" : "text-emerald-400") : s.state === "missed" ? "text-rose-400" : "text-muted"}`}>{sub}{s.note && s.state !== "done" ? `${sub ? " · " : ""}${s.note}` : ""}</span>
        </span>
      </button>
      {s.state !== "done" && <button onClick={onTick} aria-label="Done" className="chip !px-2 !py-0.5 text-[11px] shrink-0">✓</button>}
    </li>
  );
}

// Tap any step: change its time (start and end) and name, mark it done with the
// real start and end, fix the times of a step already done, or hide it.
function StepSheet({ s, onClose, onGo, onDone }: { s: Step; onClose: () => void; onGo: () => void; onDone: (at: Date, end?: Date) => void }) {
  const { data, profile, saveSettings, updateLog } = useApp();
  const sc = sched(profile.settings.schedule);
  const edits = profile.settings.routineEdit ?? {};
  const [time, setTime] = useState(s.time);
  const [end, setEnd] = useState(s.end ?? "");
  const [label, setLabel] = useState(s.label);
  const [ml, setMl] = useState(s.ml ?? 250);
  const done = s.state === "done";
  const [from, setFrom] = useState(done && s.at ? new Date(s.at).toTimeString().slice(0, 5) : s.time);
  const [to, setTo] = useState(s.doneEnd ?? s.end ?? "");
  const [rec, setRec] = useState(false);
  const log = s.logId ? data.logs.find((l) => l.id === s.logId) : undefined;
  const timed = !["wake", "sleep", "meal"].includes(s.kind);
  const dayOf = (hhmm: string, after?: Date) => {
    const base = log ? new Date(log.created_at) : new Date();
    const x = new Date(base); const [h, m] = hhmm.split(":").map(Number); x.setHours(h, m, 0, 0);
    if (after && x <= after) x.setDate(x.getDate() + 1); // ends after midnight
    return x;
  };
  const savePlan = () => {
    const routine = profile.settings.routine ?? [];
    const own = routine.find((r) => r.id === s.id);
    if (own) return saveSettings({ routine: routine.map((r) => (r.id === s.id ? { ...r, time, end: end || undefined, label: label.trim() || r.label, ml: s.kind === "water" ? ml : r.ml } : r)) });
    // Schedule steps also move the schedule, so the rest of the app follows.
    const sch: Partial<Schedule> = {};
    if (s.id === "b-work") Object.assign(sch, { workStart: time, ...(end ? { workEnd: end } : {}) });
    else if (s.id === "b-study") Object.assign(sch, { studyStart: time, ...(end ? { studyEnd: end } : {}) });
    else if (FIELD[s.id]) Object.assign(sch, { [FIELD[s.id]]: time });
    const e: StepEdit = { ...edits[s.id], ...(FIELD[s.id] ? {} : { time }), end, ...(label.trim() && label !== s.label ? { label: label.trim() } : {}), ...(s.kind === "water" ? { ml } : {}) };
    saveSettings({ ...(Object.keys(sch).length ? { schedule: { ...sc, ...sch } } : {}), routineEdit: { ...edits, [s.id]: e } });
  };
  const hide = () => {
    const routine = profile.settings.routine ?? [];
    if (routine.some((r) => r.id === s.id)) saveSettings({ routine: routine.filter((r) => r.id !== s.id) });
    else saveSettings({ routineEdit: { ...edits, [s.id]: { ...edits[s.id], off: true } } });
    onClose();
  };
  const markDone = () => {
    const a = dayOf(from), b = to ? dayOf(to, a) : undefined;
    if (log) {
      updateLog(log.id, { at: a, data: b ? { start: a.toISOString(), end: b.toISOString(), minutes: Math.round((b.getTime() - a.getTime()) / 60_000) } : {} });
      onClose();
    } else onDone(a, b);
  };
  const len = (a: string, b: string) => { const m = (toMin(b) - toMin(a) + 1440) % 1440; return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`; };
  return (
    <Sheet title={`${s.icon} ${s.label}`} onClose={onClose}>
      {s.note && <p className="text-xs text-muted">{s.note}</p>}
      <div className="rounded-xl bg-white/5 p-2.5 space-y-2">
        <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">PLANNED{s.fixed ? " · FROM YOUR SCHEDULE" : s.auto ? " · ADDED BY THE APP" : ""}</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Starts<input type="time" className="input mt-1" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="text-xs text-muted">Ends<input type="time" className="input mt-1" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        {end && <p className="text-[11px] text-muted">{len(time, end)}</p>}
        {!["wake", "sleep"].includes(s.kind) && <label className="text-xs text-muted">Name<input className="input mt-1" value={label} onChange={(e) => setLabel(e.target.value)} /></label>}
        {s.kind === "water" && <label className="text-xs text-muted">Amount (ml)<input className="input mt-1" inputMode="numeric" value={ml} onChange={(e) => setMl(Number(e.target.value) || 250)} /></label>}
        <button onClick={() => { savePlan(); onClose(); }} className="btn-ghost w-full border border-white/15 !py-1.5 text-sm">💾 Save plan (every day)</button>
      </div>
      {timed || log ? (
        <div className="rounded-xl bg-white/5 p-2.5 space-y-2">
          <div className="text-[10px] font-game tracking-widest text-emerald-400">{done ? "DONE: FIX THE REAL TIMES" : "I DID IT"}</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">From<input type="time" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-xs text-muted">To<input type="time" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          {to && <p className="text-[11px] text-muted">{len(from, to)}</p>}
          <button onClick={markDone} className="btn-primary w-full">{done ? "Save times" : "✓ Done"}</button>
          {log && <button onClick={() => setRec(true)} className="text-xs text-[var(--accent2)]">Open the whole record ›</button>}
        </div>
      ) : (
        <button onClick={() => { onDone(new Date()); }} className="btn-primary w-full">{done ? "Log it again" : `✓ ${s.kind === "wake" ? "I woke up" : s.kind === "sleep" ? "Going to sleep" : "Log it"}`}</button>
      )}
      <div className="flex gap-2">
        {s.href ? <Link href={s.href} className="chip flex-1 justify-center">Open {s.href.slice(1) || "page"} ›</Link> : !["step", "work"].includes(s.kind) && <button onClick={() => { onGo(); onClose(); }} className="chip flex-1 justify-center">Open ›</button>}
        {s.fixed ? <span className="chip flex-1 justify-center opacity-60">🔒 can&apos;t be removed</span> : <button onClick={hide} className="chip flex-1 justify-center text-rose-300">✕ Remove from my day</button>}
      </div>
      {rec && log && <EditLog log={log} onClose={() => { setRec(false); onClose(); }} />}
    </Sheet>
  );
}

// ---------- ✏️ My daily schedule ----------
const KIND: [StepKind, string][] = [["step", "⭐ Step"], ["meal", "🍱 Meal"], ["water", "💧 Water"], ["study", "📖 Study"], ["code", "💻 Coding"], ["read", "📚 Reading"], ["workout", "🏋️ Exercise"], ["work", "💼 Work"]];
// Built-in steps edit these schedule times.
const FIELD: Record<string, keyof Schedule> = { "b-wake": "wake", "b-breakfast": "breakfast", "b-work": "workStart", "b-lunch": "lunch", "b-dinner": "dinner", "b-study": "studyStart", "b-exercise": "exercise", "b-sleep": "sleep" };

function RoutineSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, saveSettings } = useApp();
  const sc = sched(profile.settings.schedule);
  const [own, setOwn] = useState<RoutineItem[]>(profile.settings.routine ?? []);
  const [edits, setEdits] = useState(profile.settings.routineEdit ?? {});
  const hidden = Object.entries(edits).filter(([, e]) => e.off);
  const [s, setS] = useState(sc);
  const base = steps({ ...data, profile: { ...profile, settings: { ...profile.settings, schedule: s, routine: [] } } }, toDay(new Date())).filter((b) => b.fixed);
  const names = new Map(steps({ ...data, profile: { ...profile, settings: { ...profile.settings, routineEdit: {} } } }, toDay(new Date())).map((x) => [x.id, `${x.icon} ${x.label}`]));
  const setItem = (id: string, p: Partial<RoutineItem>) => setOwn((o) => o.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const save = () => { saveSettings({ schedule: s, routineEdit: edits, routine: own.filter((x) => x.label.trim() && /^\d\d:\d\d$/.test(x.time)).sort((a, b) => a.time.localeCompare(b.time)) }); onClose(); };
  return (
    <Sheet title="✏️ My daily schedule" onClose={onClose}>
      <p className="text-xs text-muted">Every step here is checked each day: ✓ with how early or late, ✗ if it didn&apos;t happen. Everyday steps from your schedule can&apos;t be removed; change their time. Add your own steps (bathroom, brush, water…).</p>
      <ul className="space-y-1">
        {base.map((b) => (
          <li key={b.id} className="flex items-center gap-2 text-sm">
            <input type="time" className="input !w-24 !py-1" value={String(s[FIELD[b.id]] ?? b.time)} onChange={(e) => setS({ ...s, [FIELD[b.id]]: e.target.value })} />
            {b.id === "b-work" || b.id === "b-study" ? <input type="time" aria-label="Ends" className="input !w-24 !py-1" value={String(s[b.id === "b-work" ? "workEnd" : "studyEnd"])} onChange={(e) => setS({ ...s, [b.id === "b-work" ? "workEnd" : "studyEnd"]: e.target.value })} /> : null}
            <span className="flex-1 truncate">{b.icon} {b.label}</span><span className="text-[10px] text-muted">🔒</span>
          </li>
        ))}
        {own.map((o) => (
          <li key={o.id} className="flex items-center gap-1.5 text-sm">
            <input type="time" className="input !w-24 !py-1" value={o.time} onChange={(e) => setItem(o.id, { time: e.target.value })} />
            <input type="time" aria-label="Ends" className="input !w-24 !py-1" value={o.end ?? ""} onChange={(e) => setItem(o.id, { end: e.target.value || undefined })} />
            <input className="input flex-1 !py-1" value={o.label} placeholder="Brush teeth" onChange={(e) => setItem(o.id, { label: e.target.value })} />
            <select className="input !w-24 !py-1 text-xs" value={o.kind} onChange={(e) => setItem(o.id, { kind: e.target.value as StepKind })}>{KIND.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            {o.kind === "water" && <input className="input !w-16 !py-1" inputMode="numeric" value={o.ml ?? 250} onChange={(e) => setItem(o.id, { ml: Number(e.target.value) || 250 })} />}
            <button aria-label="Remove" onClick={() => setOwn((x) => x.filter((y) => y.id !== o.id))} className="text-rose-300 px-1">✕</button>
          </li>
        ))}
      </ul>
      {hidden.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted">Steps you removed (tap to bring back):</div>
          <div className="flex flex-wrap gap-1">{hidden.map(([id]) => <button key={id} onClick={() => setEdits((x) => ({ ...x, [id]: { ...x[id], off: false } }))} className="chip !py-0.5 text-[11px]">↩ {names.get(id) ?? id}</button>)}</div>
        </div>
      )}
      <p className="text-[11px] text-muted">The app also fills your day (toilet, sitz bath, brushing, water, snacks, training, reading, coding…). Tap any step in the mission to change its start, end and name, or remove it.</p>
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
