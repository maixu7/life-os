"use client";

import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/safety";
import { useApp } from "@/lib/store";
import type { PlanRow } from "@/lib/have";

// Guided sets: Start → get ready → set 1 (timer) → rest → set 2 … → "Completed",
// then one workout record is saved and the plan row ticks itself. Times come
// from the clock, not a counter, so it stays right if the phone lags.

type Setup = { sets: number; work: number; rest: number };
type Phase = { kind: "ready" | "work" | "rest"; set: number; secs: number };
const KEY = "lifeos-runner";

function remembered(name: string): Partial<Setup> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}")[name] ?? {}; } catch { return {}; }
}
function remember(name: string, s: Setup) {
  try { const all = JSON.parse(localStorage.getItem(KEY) ?? "{}"); all[name] = s; localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

let ctx: AudioContext | null = null;
function beep(freq = 880, ms = 150) {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.25, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch {}
}
const say = (t: string) => speak(t, true);

export function WorkoutRunner({ row, onClose }: { row: PlanRow; onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const timed = /s$/i.test(row.reps.trim());
  const saved = remembered(row.name);
  const [setup, setSetup] = useState<Setup>({
    sets: Math.min(saved.sets ?? row.sets, row.sets),
    work: saved.work ?? (timed ? parseInt(row.reps) || 60 : 45),
    rest: saved.rest ?? (timed ? 15 : 60),
  });
  const [phase, setPhase] = useState<Phase | null>(null);
  const [end, setEnd] = useState(0); // when the current phase ends (ms)
  const [paused, setPaused] = useState<number | null>(null); // ms left when paused
  const [, tick] = useState(0);
  const [doneSets, setDoneSets] = useState(0);
  const started = useRef(0);
  const lastBeep = useRef(-1);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  const left = phase ? Math.max(0, Math.ceil(((paused ?? end - Date.now())) / 1000)) : 0;

  const go = (p: Phase) => {
    setPhase(p); setEnd(Date.now() + p.secs * 1000); lastBeep.current = -1;
    if (p.kind === "work") { beep(1200, 300); say(`Set ${p.set} of ${setup.sets}. Go!`); navigator.vibrate?.(300); }
    if (p.kind === "rest") { beep(600, 300); say(`Rest ${p.secs} seconds`); navigator.vibrate?.([100, 80, 100]); }
  };
  const start = () => {
    remember(row.name, setup);
    started.current = Date.now(); setDoneSets(0);
    (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen").then((w) => { wake.current = w; }).catch(() => {});
    say(`${row.name}. Get ready.`);
    go({ kind: "ready", set: 1, secs: 5 });
  };
  const save = (sets: number) => {
    wake.current?.release().catch(() => {}); wake.current = null;
    if (sets <= 0) return;
    const minutes = Math.max(1, Math.round((Date.now() - (started.current || Date.now())) / 60000));
    const r = logActivity("workout", {
      exercise: row.name, sets, reps: timed ? 0 : parseInt(row.reps) || 0, ...(timed ? { seconds: setup.work } : { set_secs: setup.work }), rest: setup.rest, weight: row.kg,
      minutes, from_plan: true, timed: true,
    });
    celebrate({ title: sets >= setup.sets ? "✅ COMPLETED!" : "✓ SAVED", subtitle: `${row.name} · ${sets} × ${setup.work} s`, xp: r.xp, icon: "💪" });
  };
  const ended = useRef(false);
  const finish = () => {
    if (ended.current) return;
    ended.current = true;
    beep(1400, 500); navigator.vibrate?.([200, 100, 200, 100, 400]);
    say(`Completed! ${row.name} done.`);
    save(setup.sets); setPhase(null); onClose();
  };
  const stop = () => { if (ended.current) return; ended.current = true; save(doneSets); setPhase(null); onClose(); };

  // The clock: move to the next phase when this one runs out.
  useEffect(() => {
    if (!phase || paused != null) return;
    const t = setInterval(() => {
      const s = Math.ceil((end - Date.now()) / 1000);
      if (s <= 3 && s >= 1 && lastBeep.current !== s) { lastBeep.current = s; beep(880, 120); }
      if (s <= 0) {
        if (phase.kind === "ready") go({ kind: "work", set: 1, secs: setup.work });
        else if (phase.kind === "work") {
          setDoneSets(phase.set);
          if (phase.set >= setup.sets) finish();
          else if (setup.rest > 0) go({ kind: "rest", set: phase.set + 1, secs: setup.rest });
          else go({ kind: "work", set: phase.set + 1, secs: setup.work });
        } else go({ kind: "work", set: phase.set, secs: setup.work });
      }
      tick((n) => n + 1);
    }, 200);
    return () => clearInterval(t);
  });

  useEffect(() => () => { wake.current?.release().catch(() => {}); }, []);

  const num = (k: keyof Setup, v: string, max: number) => setSetup({ ...setup, [k]: Math.max(0, Math.min(max, Number(v.replace(/\D/g, "")) || 0)) });

  if (!phase) {
    const total = setup.sets * setup.work + Math.max(0, setup.sets - 1) * setup.rest;
    return (
      <div className="fixed inset-0 z-[250] bg-[#07040f]/95 backdrop-blur flex flex-col p-5 overflow-y-auto">
        <button onClick={onClose} className="self-end text-muted text-xl px-2" aria-label="Close">✕</button>
        <div className="text-xs text-muted uppercase tracking-widest">{row.part}</div>
        <h2 className="font-game text-2xl font-bold">{row.name}</h2>
        <p className="text-sm text-muted">Plan: {row.sets} sets of {row.reps}{row.kg ? ` · ${row.kg} kg` : ""}</p>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <label className="text-xs text-muted">Sets<input className="input mt-1 text-center text-lg" inputMode="numeric" value={setup.sets} onChange={(e) => num("sets", e.target.value, 20)} /></label>
          <label className="text-xs text-muted">Seconds per set<input className="input mt-1 text-center text-lg" inputMode="numeric" value={setup.work} onChange={(e) => num("work", e.target.value, 900)} /></label>
          <label className="text-xs text-muted">Rest (sec)<input className="input mt-1 text-center text-lg" inputMode="numeric" value={setup.rest} onChange={(e) => num("rest", e.target.value, 600)} /></label>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[30, 45, 60, 90].map((s) => <button key={s} onClick={() => setSetup({ ...setup, work: s })} className={`chip !py-0.5 text-xs ${setup.work === s ? "chip-on" : ""}`}>{s}s set</button>)}
          {[15, 30, 60, 90].map((s) => <button key={`r${s}`} onClick={() => setSetup({ ...setup, rest: s })} className={`chip !py-0.5 text-xs ${setup.rest === s ? "chip-on" : ""}`}>{s}s rest</button>)}
        </div>
        {!timed && <p className="text-[11px] text-muted mt-2">Do your {row.reps} reps inside each timer. It moves on by itself.</p>}
        <p className="text-sm mt-4">Takes about <b>{Math.ceil(total / 60)} min</b>: {setup.sets} × {setup.work}s work, {setup.rest}s rest between sets. Voice and beeps tell you when to go and rest.</p>
        <button onClick={start} disabled={!setup.sets || !setup.work} className="btn-primary w-full text-lg mt-5 !py-4">▶ Start now</button>
      </div>
    );
  }

  const total = phase.secs || 1;
  const pct = Math.min(100, ((total - left) / total) * 100);
  const color = phase.kind === "work" ? "#38e8ff" : phase.kind === "rest" ? "#7cf29a" : "#ffd166";
  return (
    <div className="fixed inset-0 z-[250] bg-[#07040f] flex flex-col items-center justify-center p-5 text-center select-none">
      <div className="text-sm text-muted">{row.name}</div>
      <div className="font-game text-xl tracking-widest mt-1" style={{ color }}>
        {phase.kind === "ready" ? "GET READY" : phase.kind === "work" ? `SET ${phase.set} / ${setup.sets}` : `REST · NEXT SET ${phase.set}`}
      </div>
      <div className="relative my-6 h-64 w-64">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-7xl font-black tabular-nums">{left}</div>
      </div>
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: setup.sets }, (_, i) => <span key={i} className={`h-3 w-6 rounded-full ${i < doneSets ? "bg-emerald-400" : i + 1 === phase.set && phase.kind === "work" ? "bg-[var(--accent2)]" : "bg-white/15"}`} />)}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
        <button onClick={() => (paused == null ? setPaused(end - Date.now()) : (setEnd(Date.now() + paused), setPaused(null)))} className="btn-ghost">{paused == null ? "⏸ Pause" : "▶ Resume"}</button>
        <button onClick={() => setEnd(Date.now())} className="btn-ghost">⏭ Skip</button>
        <button onClick={stop} className="btn-ghost text-rose-300">■ Stop</button>
      </div>
      <p className="text-[11px] text-muted mt-3">Stop saves the sets you finished ({doneSets}).</p>
    </div>
  );
}
