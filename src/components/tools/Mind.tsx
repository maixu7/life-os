"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";

function bell(freq = 528) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    o.start(); o.stop(ctx.currentTime + 2.5);
  } catch {}
}

const PATTERNS = {
  "4-7-8 (sleep)": [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]],
  "Box (focus)": [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]],
  "Calm (stress)": [["Breathe in", 4], ["Breathe out", 6]],
} as const;
type P = keyof typeof PATTERNS;

export function BreathingSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [pattern, setPattern] = useState<P>("4-7-8 (sleep)");
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(0);
  const [rounds, setRounds] = useState(0);
  const steps = PATTERNS[pattern];

  useEffect(() => {
    if (!run) return;
    setLeft(steps[step][1]);
    const t = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [run, step, steps]);
  useEffect(() => {
    if (!run || left > 0) return;
    const next = (step + 1) % steps.length;
    if (next === 0) setRounds((r) => r + 1);
    setStep(next);
  }, [left, run, step, steps.length]);

  const [label, secs] = steps[step];
  const scale = label === "Breathe in" ? 1.35 : label === "Breathe out" ? 0.75 : undefined;
  return (
    <Sheet title="🌬️ Breathing" onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PATTERNS) as P[]).map((p) => <button key={p} onClick={() => { setPattern(p); setStep(0); }} className={`chip ${p === pattern ? "chip-on" : ""}`}>{p}</button>)}
      </div>
      <div className="grid place-items-center py-8">
        <div className="grid h-40 w-40 place-items-center rounded-full bg-[var(--accent2)]/20 border-2 border-[var(--accent2)] shadow-[0_0_40px_var(--accent2)]"
          style={{ transform: `scale(${run && scale ? scale : 1})`, transition: `transform ${secs}s ease-in-out` }}>
          <div className="text-center"><div className="font-game text-lg">{run ? label : "Ready"}</div>{run && <div className="text-3xl font-black">{left}</div>}</div>
        </div>
        <div className="mt-6 text-sm text-muted">Rounds: {rounds}</div>
      </div>
      {!run ? <button onClick={() => { setStep(0); setRounds(0); setRun(true); }} className="btn-primary w-full">Start</button> : (
        <button onClick={() => {
          setRun(false);
          if (rounds > 0) {
            const row = logActivity("breath", { pattern, rounds }, new Date(), 10);
            celebrate({ title: "MIND CALMED", subtitle: `${rounds} rounds of ${pattern}`, xp: row.xp });
          }
        }} className="btn-ghost w-full">Finish</button>
      )}
    </Sheet>
  );
}

export function MeditationSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [mins, setMins] = useState(5);
  const [end, setEnd] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!end) return;
    const t = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= end) {
        clearInterval(t);
        bell();
        setEnd(null);
        const row = logActivity("meditate", { minutes: mins }, new Date(), mins * 4);
        celebrate({ title: "🧘 INNER PEACE", subtitle: `${mins} min meditation`, xp: row.xp, big: true, quote: "Peace comes from within. Do not seek it without. (Buddha)" });
      }
    }, 500);
    return () => clearInterval(t);
  }, [end, mins, logActivity, celebrate]);
  const left = end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : mins * 60;
  return (
    <Sheet title="🧘 Meditation" onClose={onClose}>
      <div className="flex gap-2">{[1, 3, 5, 10, 15, 20].map((m) => <button key={m} disabled={!!end} onClick={() => setMins(m)} className={`chip ${mins === m ? "chip-on" : ""}`}>{m} min</button>)}</div>
      <div className="py-8 text-center">
        <div className={`text-6xl ${end ? "animate-float" : ""}`}>🧘</div>
        <div className="mt-3 font-game text-4xl">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
        <p className="mt-2 text-sm text-muted">Sit straight, close your eyes, follow your breath. When thoughts come, gently return.</p>
      </div>
      {end ? <button onClick={() => setEnd(null)} className="btn-ghost w-full">Stop</button>
        : <button onClick={() => { bell(396); setEnd(Date.now() + mins * 60_000); }} className="btn-primary w-full">Begin</button>}
    </Sheet>
  );
}

export function StopwatchSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [start, setStart] = useState<number | null>(null);
  const [acc, setAcc] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [what, setWhat] = useState("");
  const [, tick] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!start) return;
    const loop = () => { tick((n) => n + 1); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [start]);
  const ms = acc + (start ? Date.now() - start : 0);
  const fmt = (x: number) => `${String(Math.floor(x / 60000)).padStart(2, "0")}:${String(Math.floor(x / 1000) % 60).padStart(2, "0")}.${String(Math.floor(x / 10) % 100).padStart(2, "0")}`;
  return (
    <Sheet title="⏱️ Stopwatch" onClose={onClose}>
      <div className="py-6 text-center font-game text-5xl tabular-nums">{fmt(ms)}</div>
      <div className="grid grid-cols-3 gap-2">
        {start ? <button className="btn-ghost" onClick={() => { setAcc(ms); setStart(null); }}>Pause</button> : <button className="btn-primary" onClick={() => setStart(Date.now())}>{ms ? "Resume" : "Start"}</button>}
        <button className="btn-ghost" disabled={!start} onClick={() => setLaps([ms, ...laps])}>Lap</button>
        <button className="btn-ghost" onClick={() => { setStart(null); setAcc(0); setLaps([]); }}>Reset</button>
      </div>
      {laps.length > 0 && <ol className="text-sm space-y-1">{laps.map((l, i) => <li key={i} className="flex justify-between"><span className="text-muted">Lap {laps.length - i}</span><span className="tabular-nums">{fmt(l)}</span></li>)}</ol>}
      {ms > 60_000 && !start && (
        <div className="flex gap-2">
          <input className="input" placeholder="What were you doing? (e.g. Homework)" value={what} onChange={(e) => setWhat(e.target.value)} />
          <button className="btn-primary" disabled={!what.trim()} onClick={() => {
            const row = logActivity("activity", { name: what.trim(), minutes: Math.round(ms / 60000), emoji: "⏱️" }, new Date());
            celebrate({ title: "TIME LOGGED", subtitle: `${what} · ${Math.round(ms / 60000)} min`, xp: row.xp });
            onClose();
          }}>Log</button>
        </div>
      )}
    </Sheet>
  );
}
