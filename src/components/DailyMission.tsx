"use client";

import { isFundamental } from "@/lib/assistant";
import { quickTick } from "@/components/Assistant";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { openSlotSheet } from "@/components/Blocks";
import { useRunAction } from "@/components/Coach";
import { sleepDebt, timeMap, TIME_CAT, usualTime, waterPace, type TimeCat } from "@/lib/insights";
import { breakIn, lateText, lenText, missionStats, missionStreak, missionWeek, ownTasks, picks, steps, timeText, tone, type Pickd, type RoutineItem, type Step, type StepEdit, type StepKind } from "@/lib/mission";
import { EditLog } from "@/components/EditLog";
import { AREAS, type Area } from "@/lib/mytasks";
import { fmt12, hm, sched, toMin, type Schedule } from "@/lib/schedule";
import { setsText } from "@/lib/have";
import { useRouter } from "next/navigation";
import { uid } from "@/lib/layout";
import { toDay, useApp } from "@/lib/store";

// ⚔ Daily mission on Base: your schedule as a live checklist (✓ on time /
// late / early, ✗ missed), the app's picks for today, your own tasks, and a
// report of how disciplined you've been.

const MARK = { done: "✓", missed: "✗", due: "⏳", later: "○", skipped: "⏭" } as const;
const COLOR = { done: "text-emerald-400 bg-emerald-500/15", missed: "text-rose-400 bg-rose-500/15", due: "text-amber-300 bg-amber-400/15", later: "text-muted bg-white/5", skipped: "text-sky-300 bg-sky-500/10" } as const;
const SKIPS = ["😷 Sick", "🛌 Rest day", "✈️ Travelling", "🚫 Not needed today", "⏰ No time today"];

export function DailyMission() {
  const { data, logActivity, updateLog } = useApp();
  const run = useRunAction();
  const router = useRouter();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);
  const [report, setReport] = useState(false);
  const [open, setOpen] = useState<Step | null>(null);
  const [task, setTask] = useState<string | null>(null);
  const [pick, setPick] = useState<Pickd | null>(null);
  const day = toDay(new Date());
  const list = steps(data, day);
  const own = ownTasks(data, day);
  const pk = useMemo(() => picks(data, day), [data, day]);
  const done = list.filter((s) => s.state === "done").length + own.filter((o) => o.done).length + pk.filter((p) => p.done).length;
  const missed = list.filter((s) => s.state === "missed").length;
  const total = list.filter((s) => s.state !== "skipped").length + own.length + pk.length;
  // Tick a step: wake/sleep/meals open their own sheet; the rest is logged now.
  // A step with a start and an end that is already over asks for the real times first.
  const tickStep = (s: Step, at = new Date(), end?: Date, ask = true, ml?: number) => {
    if (ask && s.moves?.length) return router.push(s.href ?? "/train");
    if (s.kind === "wake") return openSlotSheet({ kind: "wake" });
    if (s.kind === "sleep") return openSlotSheet({ kind: "sleep" });
    if (s.kind === "meal") return openSlotSheet({ kind: "meal", name: s.label });
    if (ask && s.end && s.state === "missed") return setOpen(s);
    // Work: "Start" records when you began, "Finish" adds when you ended to the same record.
    if (s.id === "b-work" && !end) { logActivity("activity", { name: s.label.replace(/^Start /, ""), routine: "b-work", start: at.toISOString() }, at); return; }
    if (s.id === "b-work-end" && !end) {
      const log = s.logId ? data.logs.find((l) => l.id === s.logId) : undefined;
      const from = log ? new Date(String(log.data.start ?? log.created_at)) : new Date(`${day}T${s.whole?.time ?? s.time}:00`);
      const minutes = Math.max(1, Math.round((at.getTime() - from.getTime()) / 60_000));
      if (log) updateLog(log.id, { data: { start: from.toISOString(), end: at.toISOString(), minutes } });
      else logActivity("activity", { name: s.label.replace(/^Finish /, ""), routine: "b-work", start: from.toISOString(), end: at.toISOString(), minutes }, from);
      return;
    }
    if (s.kind === "water") { logActivity("water", { ml: ml ?? s.ml ?? 250, name: s.label.replace(/\s*\d+\s*ml$/i, "") || "Water", routine: s.id }, at); return; }
    const kind = s.kind === "code" ? "coding" : "activity";
    const minutes = end ? Math.max(1, Math.round((end.getTime() - at.getTime()) / 60_000)) : undefined;
    logActivity(kind, { name: s.label, routine: s.id, ...(end ? { start: at.toISOString(), end: end.toISOString(), minutes } : {}) }, at);
  };
  // Two lists: your fixed routine (Fundamental) and what the app assigns.
  const [which, setWhich] = useState<"all" | "fund" | "app">(() => { try { return (localStorage.getItem("lifeos-mission-list") as "all" | "fund" | "app") || "all"; } catch { return "all"; } });
  const pickList = (w: typeof which) => { setWhich(w); try { localStorage.setItem("lifeos-mission-list", w); } catch {} };
  const shown = (fund: boolean) => which === "all" || (which === "fund") === fund;
  const streak = useMemo(() => missionStreak(data), [data]);
  const pace = waterPace(data);
  const waterToday = pace.got;
  const rows = [
    ...list.filter((s) => shown(isFundamental(s))).map((s) => ({ t: s.time, el: <StepRow key={s.id} s={s} onTick={() => tickStep(s)} onDone={() => quickTick(s, logActivity, data.logs, updateLog, true)} onOpen={() => setOpen(s.whole ?? s)} /> })),
    ...own.filter(() => shown(true)).map((o) => ({ t: o.time, el: (
      <li key={o.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
        <button onClick={() => setTask(o.id)} aria-label="Edit task" className="contents">
        <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[o.done ? "done" : "later"]}`}>{o.done ? "✓" : "○"}</span>
        <span className="w-[4.5rem] text-[11px] leading-tight text-muted shrink-0">{fmt12(o.time)}{o.end && <span className="block text-[9px]">to {fmt12(o.end)}</span>}</span>
        <span className="flex-1 min-w-0 text-sm truncate">{o.icon} {o.label}<span className="block text-[10px] text-muted">your task{o.want > 1 ? ` · ${o.got}/${o.want} ${AREAS[o.area].unit}` : ""}</span></span>
        </button>
        {!o.done && o.area === "other" && <button onClick={() => logActivity("activity", { name: o.label }, new Date())} aria-label={`Done: ${o.label}`} className="h-8 w-8 shrink-0 rounded-full border-2 border-emerald-400 text-emerald-300 font-black active:scale-90">✓</button>}
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
      <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[11px]">
        {streak > 0 && <span className="chip !py-0.5 !px-2">🔥 {streak} day{streak > 1 ? "s" : ""} in a row</span>}
        <WeekBars />
        <SleepChip />
        <span className="ml-auto flex items-center gap-1.5">
          <span className={pace.behind >= 300 ? "text-amber-300" : "text-muted"} title={`By now: ${pace.should} ml of ${pace.goal} ml`}>💧 {waterToday} ml{pace.behind >= 300 ? ` · ${pace.behind} behind` : pace.should ? " · on track" : ""}</span>
          {[250, 500].map((ml) => <button key={ml} onClick={() => logActivity("water", { ml, name: "Water" }, new Date())} className="chip !py-0.5 !px-2">+{ml}</button>)}
        </span>
      </div>
      <DayBar day={day} />
      <div className="grid grid-cols-3 gap-1 mb-2">
        {([["all", "All"], ["fund", "🏠 Fundamental"], ["app", "📱 App-assigned"]] as const).map(([w, l]) => <button key={w} onClick={() => pickList(w)} className={`chip justify-center !px-1 !py-1 text-[11px] ${which === w ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <ul className="space-y-1">{rows.map((r) => r.el)}</ul>
      {pk.length > 0 && which !== "fund" && (
        <>
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)] mt-3 mb-1">TODAY&apos;S PICKS (BY THE APP)</div>
          <ul className="space-y-1">
            {pk.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5">
                <Link href={p.href} className="flex flex-1 min-w-0 items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
                  <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[p.done ? "done" : "later"]}`}>{p.done ? "✓" : "○"}</span>
                  <span className="flex-1 min-w-0 text-sm truncate">{p.icon} {p.title}<span className="block text-[10px] text-muted truncate">{p.got}/{p.target} {AREAS[p.area].unit} · {p.why}</span></span>
                  <span className="text-muted">›</span>
                </Link>
                <button onClick={() => setPick(p)} aria-label="Edit pick" className="chip !px-2 !py-0.5 text-[11px] shrink-0">✏️</button>
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
      {task && <OwnTaskSheet id={task} onClose={() => setTask(null)} />}
      {pick && <PickSheet p={pick} day={day} onClose={() => setPick(null)} />}
      {report && <MissionReport onClose={() => setReport(false)} />}
      {open && <StepSheet s={open} onClose={() => setOpen(null)} onGo={() => { if (!open.href) run(open.action); }} onDone={(at, end, ml) => { tickStep(open, at, end, false, ml); setOpen(null); }} />}
    </section>
  );
}

/** A real end that comes after the start (up to 12 h later, so past midnight is fine). */
const endsAfter = (iso: string, end: string) => { const d = new Date(iso), [h, m] = end.split(":").map(Number); const gap = (h * 60 + m - d.getHours() * 60 - d.getMinutes() + 1440) % 1440; return gap > 0 && gap <= 720; };
const atHM = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function StepRow({ s, onTick, onDone, onOpen }: { s: Step; onTick: () => void; onDone: () => void; onOpen: () => void }) {
  const long = lenText(s);
  const sub = s.state === "done" ? (s.id === "b-work" ? `started ${atHM(s.at!)} · ${lateText(s.diff)}` : s.id === "b-work-end" ? `finished ${fmt12(s.doneEnd!)} · ${lateText(s.diff)}${long ? ` · work ${long}` : ""}`
    : `done ${atHM(s.at!)}${s.doneEnd && endsAfter(s.at!, s.doneEnd) ? `–${fmt12(s.doneEnd)}` : ""} · ${timeText(s.diff, s.endDiff)}${s.gotMl ? ` · ${s.gotMl} ml` : ""}${long ? ` · ${long}` : ""}`)
    : s.state === "skipped" ? `skipped today · ${s.skip}`
    : s.state === "missed" ? `didn't happen${s.progress?.done ? ` · ${s.progress.done}/${s.progress.total} moves done` : ""}`
    : s.state === "due" ? `now${s.progress ? ` · ${s.progress.done}/${s.progress.total} moves` : ""}`
    : s.end ? `${Math.round(((toMin(s.end) - toMin(s.time) + 1440) % 1440))} min${s.progress ? ` · ${s.progress.done}/${s.progress.total} moves` : ""}` : "";
  const t = tone(s);
  return (
    <li className="rounded-xl bg-white/5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <button onClick={onOpen} className="flex flex-1 min-w-0 items-center gap-2 text-left">
          <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-black ${COLOR[s.state]}`}>{MARK[s.state]}</span>
          <span className="w-[4.5rem] text-[11px] leading-tight text-muted shrink-0">{fmt12(s.time)}{s.end && <span className="block text-[9px]">to {fmt12(s.end)}</span>}</span>
          <span className="flex-1 min-w-0 text-sm truncate">{s.icon} {s.label}
            <span className={`block text-[10px] truncate ${s.state === "done" ? (t === "late" ? "text-amber-300" : t === "early" ? "text-sky-300" : "text-emerald-400") : s.state === "missed" ? "text-rose-400" : s.state === "skipped" ? "text-sky-300" : "text-muted"}`}>{sub}{s.note && s.state !== "done" ? `${sub ? " · " : ""}${s.note}` : ""}</span>
          </span>
        </button>
        {s.state !== "done" && s.moves?.length ? <button onClick={onTick} aria-label="Open workout" className="chip !px-2 !py-0.5 text-[11px] shrink-0">▶</button> : null}
        {s.state !== "done" && s.state !== "skipped" && <button onClick={onDone} aria-label={`Done: ${s.label}`} className="h-8 w-8 shrink-0 rounded-full border-2 border-emerald-400 text-emerald-300 font-black active:scale-90">✓</button>}
      </div>
      {s.moves && s.moves.length > 0 && s.state !== "done" && (
        <ul className="mt-1 ml-9 flex flex-wrap gap-1">
          {s.moves.map((m) => (
            <li key={m.part + m.name} className={`rounded-md px-1.5 py-0.5 text-[10px] ${m.done >= m.sets ? "bg-emerald-500/15 text-emerald-300 line-through" : "bg-white/5 text-muted"}`}>
              {m.done >= m.sets ? "✓ " : ""}{m.name} · {setsText(m.sets, m.reps).replace(/ of /, " × ")}{m.kg ? ` · ${m.kg} kg` : ""}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Tap any step: change its time (start and end) and name, mark it done with the
// real start and end, fix the times of a step already done, or hide it.
function StepSheet({ s, onClose, onGo, onDone }: { s: Step; onClose: () => void; onGo: () => void; onDone: (at: Date, end?: Date, ml?: number) => void }) {
  const { data, profile, saveSettings, updateLog, deleteLog } = useApp();
  const sc = sched(profile.settings.schedule);
  const edits = profile.settings.routineEdit ?? {};
  const [time, setTime] = useState(s.time);
  const [end, setEnd] = useState(s.end ?? "");
  const [label, setLabel] = useState(s.label);
  // Kept as text so the box can be cleared while typing (450 used to snap back to 250).
  const [ml, setMl] = useState(String(s.ml ?? 250));
  const done = s.state === "done";
  const [from, setFrom] = useState(done && s.at ? new Date(s.at).toTimeString().slice(0, 5) : s.time);
  const [to, setTo] = useState(s.doneEnd ?? s.end ?? "");
  const [rec, setRec] = useState(false);
  const log = s.logId ? data.logs.find((l) => l.id === s.logId) : undefined;
  const [drank, setDrank] = useState(String((log && Number(log.data.ml)) || s.ml || 250));
  const mlNum = (t: string, dflt: number) => { const n = Math.round(Number(t)); return n > 0 && n <= 5000 ? n : dflt; };
  const timed = !["wake", "sleep", "meal"].includes(s.kind);
  // When you actually manage it, from the last 30 days.
  const usual = useMemo(() => usualTime(data, (l) => l.data.routine === s.id
    || (s.kind === "study" && (l.kind === "focus" || (l.kind === "activity" && /study/i.test(String(l.data.name)))))
    || (s.kind === "workout" && l.kind === "workout")
    || (s.kind === "code" && l.kind === "coding")
    || (s.kind === "read" && (l.kind === "pages" || (l.kind === "media" && !!l.data.good)))
    || (s.kind === "step" && l.kind === "activity" && String(l.data.name).toLowerCase() === s.label.toLowerCase())), [data, s.id, s.kind, s.label]);
  const dayOf = (hhmm: string, after?: Date) => {
    const base = log ? new Date(log.created_at) : new Date();
    const x = new Date(base); const [h, m] = hhmm.split(":").map(Number); x.setHours(h, m, 0, 0);
    if (after && x <= after) x.setDate(x.getDate() + 1); // ends after midnight
    return x;
  };
  const savePlan = () => {
    // Only the start changed: keep the same length, so the end moves with it.
    const stop = s.end && end === s.end && time !== s.time ? hm((toMin(s.end) + toMin(time) - toMin(s.time) + 1440) % 1440) : end;
    const routine = profile.settings.routine ?? [];
    const own = routine.find((r) => r.id === s.id);
    if (own) return saveSettings({ routine: routine.map((r) => (r.id === s.id ? { ...r, time, end: stop || undefined, at: Date.now(), label: label.trim() || r.label, ml: s.kind === "water" ? mlNum(ml, r.ml ?? 250) : r.ml } : r)) });
    // Schedule steps also move the schedule, so the rest of the app follows.
    const sch: Partial<Schedule> = {};
    if (s.id === "b-work") Object.assign(sch, { workStart: time, ...(stop ? { workEnd: stop } : {}) });
    else if (s.id === "b-study") Object.assign(sch, { studyStart: time, ...(stop ? { studyEnd: stop } : {}) });
    else if (FIELD[s.id]) Object.assign(sch, { [FIELD[s.id]]: time });
    const e: StepEdit = { ...edits[s.id], ...(FIELD[s.id] && !["b-study", "b-exercise"].includes(s.id) ? {} : time !== s.time || stop !== (s.end ?? "") || edits[s.id]?.time ? { time, at: Date.now() } : {}), end: stop, ...(label.trim() && label !== s.label ? { label: label.trim() } : {}), ...(s.kind === "water" ? { ml: mlNum(ml, s.ml ?? 250) } : {}) };
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
    const water = s.kind === "water" ? { ml: mlNum(drank, s.ml ?? 250) } : {};
    if (log) {
      updateLog(log.id, { at: a, data: { ...water, ...(b ? { start: a.toISOString(), end: b.toISOString(), minutes: Math.round((b.getTime() - a.getTime()) / 60_000) } : {}) } });
      onClose();
    } else onDone(a, b, s.kind === "water" ? water.ml : undefined);
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
        {end && <p className="text-[11px] text-muted">{len(time, end)}{s.kind === "work" && /^\d\d:\d\d$/.test(time) ? (() => { const b = breakIn(data, toMin(time), toMin(end)); return b ? ` there · ${dur((toMin(end) - toMin(time) + 1440) % 1440 - b)} of work (${dur(b)} break)` : ""; })() : ""}</p>}
        {<label className="text-xs text-muted">Name<input className="input mt-1" value={label} onChange={(e) => setLabel(e.target.value)} /></label>}
        {s.kind === "water" && <label className="text-xs text-muted">Planned amount (ml)<input className="input mt-1" inputMode="numeric" value={ml} onChange={(e) => setMl(e.target.value.replace(/\D/g, ""))} /></label>}
        {usual && usual.time !== time && <p className="text-[11px] text-sky-300">💡 You really do this around <b>{fmt12(usual.time)}</b> ({usual.times} of the last {usual.of} times). <button className="underline" onClick={() => { const len = end ? (toMin(end) - toMin(time) + 1440) % 1440 : 0; setTime(usual.time); if (len) setEnd(hm((toMin(usual.time) + len) % 1440)); }}>Use that time</button></p>}
        <button onClick={() => { savePlan(); onClose(); }} className="btn-ghost w-full border border-white/15 !py-1.5 text-sm">💾 Save plan (every day)</button>
      </div>
      {timed || log ? (
        <div className="rounded-xl bg-white/5 p-2.5 space-y-2">
          <div className="text-[10px] font-game tracking-widest text-emerald-400">{done ? "DONE: FIX THE REAL TIMES" : "I DID IT"}</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">From<input type="time" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-xs text-muted">To<input type="time" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          {s.kind === "water" && <label className="text-xs text-muted">How much I drank (ml)<input className="input mt-1" inputMode="numeric" value={drank} onChange={(e) => setDrank(e.target.value.replace(/\D/g, ""))} /></label>}
          <Verdict s={s} from={from} to={to} />
          <button onClick={markDone} className="btn-primary w-full">{done ? "Save times" : "✓ Done"}</button>
          {log && <button onClick={() => setRec(true)} className="text-xs text-[var(--accent2)]">Open the whole record ›</button>}
        </div>
      ) : (
        <button onClick={() => { onDone(new Date()); }} className="btn-primary w-full">{done ? "Log it again" : `✓ ${s.kind === "wake" ? "I woke up" : s.kind === "sleep" ? "Going to sleep" : "Log it"}`}</button>
      )}
      {!done && <SkipBox s={s} onClose={onClose} />}
      <div className="flex gap-2">
        {s.href ? <Link href={s.href} className="chip flex-1 justify-center">Open {s.href.slice(1) || "page"} ›</Link> : !["step", "work"].includes(s.kind) && <button onClick={() => { onGo(); onClose(); }} className="chip flex-1 justify-center">Open ›</button>}
        <button onClick={hide} className="chip flex-1 justify-center text-rose-300">✕ Remove from my day</button>
      </div>
      {log && <button onClick={() => { if (confirm("Delete this record?")) { deleteLog(log.id); onClose(); } }} className="chip w-full justify-center text-rose-300">🗑 Delete this record (keeps the step)</button>}
      {rec && log && <EditLog log={log} onClose={() => { setRec(false); onClose(); }} />}
    </Sheet>
  );
}

// Live check while you type the real times: the start and the end against the plan,
// and how long it really took (work: without the breaks inside it).
function Verdict({ s, from, to }: { s: Step; from: string; to: string }) {
  const { data } = useApp();
  if (!/^\d\d:\d\d$/.test(from)) return null;
  const wrap = (m: number) => ((m + 2160) % 1440) - 720;
  const diff = wrap(toMin(from) - toMin(s.time));
  const hasTo = /^\d\d:\d\d$/.test(to);
  const endDiff = hasTo && s.end ? wrap(toMin(to) - toMin(s.end)) : undefined;
  let took = hasTo ? (toMin(to) - toMin(from) + 1440) % 1440 : undefined;
  const brk = took != null && s.kind === "work" ? breakIn(data, toMin(from), toMin(from) + took) : 0;
  if (took != null) took -= brk;
  const v = { diff, endDiff, planLen: s.planLen, doneLen: took };
  const long = lenText(v), t = tone(v);
  return (
    <p className={`text-[11px] ${t === "late" ? "text-amber-300" : t === "early" ? "text-sky-300" : "text-emerald-400"}`}>
      {timeText(diff, endDiff)}
      {took != null ? ` · ${s.kind === "work" ? "worked" : "took"} ${dur(took)}${brk ? ` (without ${dur(brk)} break)` : ""}${s.planLen ? `, plan ${dur(s.planLen)}` : ""}` : ""}
      {long ? ` · ⚠ ${long}` : took != null && s.planLen ? " · ✓ right length" : ""}
    </p>
  );
}
const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

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
  const base = steps({ ...data, profile: { ...profile, settings: { ...profile.settings, schedule: s, routine: [] } } }, toDay(new Date())).filter((b) => b.fixed && b.id !== "b-work-end").map((b) => b.whole ?? b);
  const names = new Map(steps({ ...data, profile: { ...profile, settings: { ...profile.settings, routineEdit: {} } } }, toDay(new Date())).map((x) => [x.id, `${x.icon} ${x.label}`]));
  const setItem = (id: string, p: Partial<RoutineItem>) => setOwn((o) => o.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const save = () => { saveSettings({ schedule: s, routineEdit: edits, routine: own.filter((x) => x.label.trim() && /^\d\d:\d\d$/.test(x.time)).map((x) => { const w = (profile.settings.routine ?? []).find((r) => r.id === x.id); return !w || w.time !== x.time || w.end !== x.end ? { ...x, at: Date.now() } : x; }).sort((a, b) => a.time.localeCompare(b.time)) }); onClose(); };
  return (
    <Sheet title="✏️ My daily schedule" onClose={onClose}>
      <p className="text-xs text-muted">Every step here is checked each day: ✓ with how early or late, ✗ if it didn&apos;t happen. You can change or remove any step (removed ones can be brought back below). A time you set stays where you put it; the app&apos;s own steps move around it. Add your own steps (bathroom, brush, water…).</p>
      <ul className="space-y-1">
        {base.map((b) => (
          <li key={b.id} className="flex items-center gap-2 text-sm">
            <input type="time" className="input !w-24 !py-1" value={String(s[FIELD[b.id]] ?? b.time)} onChange={(e) => { setS({ ...s, [FIELD[b.id]]: e.target.value }); setEdits((x) => (x[b.id]?.time ? { ...x, [b.id]: { ...x[b.id], time: undefined } } : x)); }} />
            {b.id === "b-work" || b.id === "b-study" ? <input type="time" aria-label="Ends" className="input !w-24 !py-1" value={String(s[b.id === "b-work" ? "workEnd" : "studyEnd"])} onChange={(e) => setS({ ...s, [b.id === "b-work" ? "workEnd" : "studyEnd"]: e.target.value })} /> : null}
            <span className="flex-1 truncate">{b.icon} {b.label}</span><span className="text-[10px] text-muted">📅</span>
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
          <div className="flex flex-wrap gap-1">{hidden.map(([id]) => <button key={id} onClick={() => setEdits((x) => ({ ...x, [id]: { ...x[id], off: false } }))} className="chip !py-0.5 text-[11px]">↩ {names.get(id) ?? (id.includes("@") ? `Pick ${id.replace(/^p-/, "").replace("@", " on ")}` : id)}</button>)}</div>
        </div>
      )}
      <p className="text-[11px] text-muted">The app also fills your day (toilet, sitz bath, brushing, water, snacks, training, reading, coding…). Tap any step in the mission to change its start, end and name, or remove it.</p>
      <button onClick={() => setOwn((o) => [...o, { id: uid(), time: "06:00", label: "", kind: "step" }])} className="btn-ghost w-full border border-dashed border-white/25">＋ Add a step (time + what)</button>
      <button onClick={save} className="btn-primary w-full">Save schedule</button>
    </Sheet>
  );
}

// ---------- ＋ My own task (e.g. 12:00 go shopping) ----------
// With an id it edits that task (times, name, kind, every day) or deletes it.
function OwnTaskSheet({ onClose, id }: { onClose: () => void; id?: string }) {
  const { data, update } = useApp();
  const old = id ? data.items.find((i) => i.id === id) : undefined;
  const c = (old?.config ?? {}) as Record<string, unknown>;
  const [name, setName] = useState(old?.name ?? "");
  const [time, setTime] = useState(typeof c.time === "string" ? c.time : "12:00");
  const [end, setEnd] = useState(typeof c.end === "string" ? c.end : old ? "" : "12:30");
  const [area, setArea] = useState<Area>((c.area as Area) ?? "other");
  const [every, setEvery] = useState(old ? !c.date : false);
  const save = () => {
    if (!name.trim()) return;
    const config = { ...c, area, time, end: end || undefined, at: Date.now(), days: (c.days as number[]) ?? [0, 1, 2, 3, 4, 5, 6], date: every ? undefined : (c.date as string) ?? toDay(new Date()), level: (c.level as string) ?? "normal" };
    if (old) update((d) => ({ ...d, items: d.items.map((i) => (i.id === old.id ? { ...i, name: name.trim(), config } : i)) }));
    else update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "task", name: name.trim(), sort: Date.now(), config }] }));
    onClose();
  };
  const remove = () => { if (old && confirm(`Delete "${old.name}"?`)) { update((d) => ({ ...d, items: d.items.filter((i) => i.id !== old.id) })); onClose(); } };
  return (
    <Sheet title={old ? `✏️ ${old.name}` : "＋ My own task"} onClose={onClose}>
      <input className="input" placeholder="Go shopping, call mum, clean room…" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Starts<input type="time" className="input mt-1" value={time} onChange={(e) => setTime(e.target.value)} /></label>
        <label className="text-xs text-muted">Ends<input type="time" className="input mt-1" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      <p className="text-[11px] text-muted">It goes in at this time and the app&apos;s own steps around it move to make room.</p>
      <div className="flex flex-wrap gap-1">{(Object.keys(AREAS) as Area[]).map((a) => <button key={a} onClick={() => setArea(a)} className={`chip !py-0.5 text-[11px] ${area === a ? "chip-on" : ""}`}>{AREAS[a].icon} {AREAS[a].label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={every} onChange={(e) => setEvery(e.target.checked)} /> Every day (otherwise just today)</label>
      <button disabled={!name.trim()} onClick={save} className="btn-primary w-full disabled:opacity-40">{old ? "Save" : "Add to today\u2019s mission"}</button>
      {old && <button onClick={remove} className="chip w-full justify-center text-rose-300">🗑 Delete this task</button>}
    </Sheet>
  );
}

// ---------- A pick by the app: rename it, change its goal, or remove it today ----------
function PickSheet({ p, day, onClose }: { p: Pickd; day: string; onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const edits = profile.settings.routineEdit ?? {};
  const [title, setTitle] = useState(p.title);
  const [target, setTarget] = useState(String(p.target));
  const save = () => {
    const n = Math.round(Number(target));
    saveSettings({ routineEdit: { ...edits, [p.id]: { ...edits[p.id], label: title.trim() || p.title, ...(n > 0 ? { ml: n } : {}) } } });
    onClose();
  };
  return (
    <Sheet title={`${p.icon} ${p.title}`} onClose={onClose}>
      <label className="text-xs text-muted">Name<input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="text-xs text-muted">Goal ({AREAS[p.area].unit})<input className="input mt-1" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} /></label>
      <button onClick={save} className="btn-primary w-full">Save (every day)</button>
      <button onClick={() => { saveSettings({ routineEdit: { ...edits, [`${p.id}@${day}`]: { off: true } } }); onClose(); }} className="chip w-full justify-center text-rose-300">✕ Remove for today</button>
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

// ---------- Small read-outs in the header ----------
// Last 7 days: one bar per day, green = share of steps done (tap a bar to see the numbers).
function WeekBars() {
  const { data } = useApp();
  const rows = useMemo(() => missionWeek(data), [data]);
  const [sel, setSel] = useState<number | null>(null);
  if (!rows.some((r) => r.total)) return null;
  const r = sel != null ? rows[sel] : null;
  return (
    <span className="chip !py-0.5 !px-2 gap-1" title="Last 7 days of the Daily mission">
      <span className="flex items-end gap-[2px] h-4" aria-label="Last 7 days">
        {rows.map((x, i) => (
          <button key={x.day} onClick={() => setSel(sel === i ? null : i)} aria-label={`${x.day}: ${x.done} of ${x.total} done`} className="w-[5px] h-4 rounded-sm bg-white/10 flex flex-col justify-end overflow-hidden">
            <span className={x.total && x.done / x.total >= 0.6 ? "bg-emerald-400" : "bg-amber-400"} style={{ height: `${x.total ? Math.max(8, (x.done / x.total) * 100) : 0}%` }} />
          </button>
        ))}
      </span>
      {r ? <span>{new Date(`${r.day}T12:00`).toLocaleDateString([], { weekday: "short" })} {r.done}/{r.total}</span> : <span>7 days</span>}
    </span>
  );
}

// 😴 Sleep debt this week: tap for each night and tonight's bedtime.
function SleepChip() {
  const { data } = useApp();
  const s = useMemo(() => sleepDebt(data), [data]);
  const [open, setOpen] = useState(false);
  if (!s.known) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className={`chip !py-0.5 !px-2 ${s.debt >= 3 ? "text-amber-300" : ""}`}>😴 {s.debt ? `${s.debt} h short` : "sleep OK"}</button>
      {open && (
        <Sheet title="😴 Sleep this week" onClose={() => setOpen(false)}>
          <p className="text-sm">Goal {s.goal} h a night. {s.avg != null ? `You averaged ${s.avg} h over ${s.known} logged night${s.known > 1 ? "s" : ""}.` : ""}</p>
          <ul className="space-y-1">
            {s.nights.map((n) => (
              <li key={n.day} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-muted">{new Date(`${n.day}T12:00`).toLocaleDateString([], { weekday: "short" })}</span>
                <span className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden"><span className={`block h-full ${n.hours != null && n.hours >= s.goal - 0.5 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${n.hours != null ? Math.min(100, (n.hours / s.goal) * 100) : 0}%` }} /></span>
                <span className="w-14 text-right">{n.hours != null ? `${n.hours} h` : "not logged"}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-xl bg-white/5 p-3 text-sm">{s.debt ? <>You are <b>{s.debt} h short</b> this week. {s.tonight ? <>Go to bed at <b>{fmt12(s.tonight)}</b> tonight ({s.earlier} min earlier) to win some back. Sleeping in on one day doesn&apos;t fix it.</> : null}</> : <>No sleep debt. Keep the same bedtime.</>}</p>
          <p className="text-[11px] text-muted">Worked out from the sleep you logged (🌙 Sleep and 🌅 Woke up). Nights you didn&apos;t log are left out.</p>
        </Sheet>
      )}
    </>
  );
}

// 🕐 Where today went: one bar from midnight to now, by kind (tap to see the minutes).
function DayBar({ day }: { day: string }) {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const t = useMemo(() => timeMap(data, day), [data, day]);
  const order: TimeCat[] = ["sleep", "work", "study", "exercise", "food", "fun", "other", "unlogged"];
  const h = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`);
  return (
    <div className="mb-2">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Where today went" className="flex w-full h-2.5 rounded-full overflow-hidden bg-white/5">
        {order.map((k) => t.mins[k] > 0 && <span key={k} style={{ width: `${(t.mins[k] / Math.max(1, t.total)) * 100}%`, background: TIME_CAT[k].color }} />)}
      </button>
      {open ? (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
          {order.filter((k) => t.mins[k] > 0).map((k) => <span key={k}><span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: TIME_CAT[k].color }} />{TIME_CAT[k].icon} {TIME_CAT[k].label} {h(t.mins[k])}</span>)}
          <span className="w-full text-muted">Where today went, from what you logged with a start and end (meals count 20 min). Log more to shrink ❔.</span>
        </div>
      ) : <div className="mt-0.5 text-[10px] text-muted">🕐 Where today went · tap the bar</div>}
    </div>
  );
}

// ⏭ Skip just today, with a reason: it shows as skipped (not ✗) and doesn't break your streak.
function SkipBox({ s, onClose }: { s: Step; onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const day = toDay(new Date());
  const all = profile.settings.routineSkip ?? {};
  const set = (why: string | null) => {
    const ids = s.id === "b-work-end" ? ["b-work"] : [s.id];
    const today = { ...all[day] };
    for (const id of ids) { if (why) today[id] = why; else delete today[id]; }
    // Keep two weeks of skips.
    const keep = Object.fromEntries(Object.entries({ ...all, [day]: today }).filter(([k, v]) => k >= toDay(new Date(Date.now() - 14 * 86_400_000)) && Object.keys(v).length));
    saveSettings({ routineSkip: keep });
    onClose();
  };
  if (s.state === "skipped") return <button onClick={() => set(null)} className="chip w-full justify-center text-sky-300">↩ Don&apos;t skip it today ({s.skip})</button>;
  return (
    <div className="rounded-xl bg-white/5 p-2.5 space-y-1.5">
      <div className="text-[10px] font-game tracking-widest text-sky-300">⏭ SKIP JUST TODAY</div>
      <div className="flex flex-wrap gap-1.5">{SKIPS.map((w) => <button key={w} onClick={() => set(w)} className="chip !py-1.5 text-xs">{w}</button>)}</div>
      <p className="text-[10px] text-muted">Shows as skipped, not missed, and doesn&apos;t break your streak. Tomorrow it&apos;s back.</p>
    </div>
  );
}
