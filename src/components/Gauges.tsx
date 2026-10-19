"use client";

import { canvasDpr, isLite } from "@/lib/perf";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { learnedOn } from "@/components/Learn";
import { MEALS } from "@/components/Meals";
import { dailyMissions } from "@/lib/missions";
import { goalsOn, sched } from "@/lib/schedule";
import { toDay, useApp, useCustomItems, type Log } from "@/lib/store";
import { emojiFor } from "@/lib/emoji";

export type Goal = { id: string; icon: string; name: string; have: number; need: number; unit: string; doneAt?: string };

const firstAt = (logs: Log[], test: (l: Log) => boolean, n = 1) => logs.filter(test).sort((a, b) => a.created_at.localeCompare(b.created_at))[n - 1]?.created_at;

// Everything the hero set a goal for today: missions, learning, meals and
// any side quest with a daily goal.
export function useGoals(day = toDay(new Date())): Goal[] {
  const { data, profile } = useApp();
  const { items } = useCustomItems("activity");
  const logs = data.logs.filter((l) => l.day === day);
  const out: Goal[] = dailyMissions(logs, profile.settings).map((m) => ({ id: m.id, icon: m.icon, name: m.name, have: m.progress, need: m.target, unit: m.unit, doneAt: m.done ? logs.at(-1)?.created_at : undefined }));
  const learn = learnedOn(data.logs, day).total, need = goalsOn(sched(profile.settings.schedule), new Date(`${day}T12:00:00`)).learnGoal || 60;
  out.push({ id: "learn", icon: "📖", name: "Learning", have: learn, need, unit: "min" });
  const meals = MEALS.filter(([m]) => m !== "Snack");
  const ate = (m: string) => (l: Log) => l.kind === "activity" && String(l.data.name).toLowerCase() === m.toLowerCase();
  for (const [m, e] of meals) out.push({ id: `meal-${m}`, icon: e, name: m, have: logs.some(ate(m)) ? 1 : 0, need: 1, unit: "", doneAt: firstAt(logs, ate(m)) });
  for (const it of items) {
    const g = Number(it.config.goal) || 0;
    if (!g) continue;
    const test = (l: Log) => l.kind === "activity" && String(l.data.name).toLowerCase() === it.name.toLowerCase();
    out.push({ id: it.id, icon: String(it.config.emoji ?? emojiFor(it.name)), name: it.name, have: logs.filter(test).length, need: g, unit: "times", doneAt: firstAt(logs, test, g) });
  }
  return out.map((g) => g.have >= g.need ? { ...g, doneAt: g.doneAt ?? new Date().toISOString() } : { ...g, doneAt: undefined });
}

// Gauges that fill one by one with a tick when full, a "Completed" table,
// and fireworks when every gauge is full.
export function GaugesCard() {
  const goals = useGoals();
  const day = toDay(new Date());
  const done = goals.filter((g) => g.doneAt).sort((a, b) => a.doneAt!.localeCompare(b.doneAt!));
  const all = goals.length > 0 && done.length === goals.length;
  const [shown, setShown] = useState(false);
  const [boom, setBoom] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 100); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!all) return;
    const key = `lifeos-hanabi-${day}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
    const t = setTimeout(() => setBoom(true), goals.length * 120 + 600);
    return () => clearTimeout(t);
  }, [all, day, goals.length]);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">🎯 Today&apos;s gauges</h2>
        <button onClick={() => all && setBoom(true)} className={`font-game text-sm ${all ? "text-emerald-300" : "text-[var(--accent2)]"}`}>{done.length}/{goals.length}{all ? " 🎆" : ""}</button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {goals.map((g, i) => {
          const pct = Math.min(100, (g.have / Math.max(1, g.need)) * 100);
          const full = !!g.doneAt;
          return (
            <div key={g.id} className="flex flex-col items-center gap-1 w-11 shrink-0" title={`${g.name}: ${g.have}/${g.need} ${g.unit}`}>
              <div className={`relative h-20 w-6 rounded-full overflow-hidden border ${full ? "border-emerald-400/70 shadow-[0_0_10px_#34d39966]" : "border-white/15"} bg-white/5`}>
                <div className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-700 ease-out"
                  style={{ height: shown ? `${pct}%` : "0%", transitionDelay: `${i * 120}ms`, background: full ? "linear-gradient(to top,#10b981,#6ee7b7)" : "linear-gradient(to top,var(--accent),var(--accent2))" }} />
                {full && <span className="absolute inset-x-0 top-1 text-center text-[11px] font-black text-white animate-stamp" style={{ animationDelay: `${i * 120 + 600}ms` }}>✓</span>}
              </div>
              <span className="text-base leading-none">{g.icon}</span>
              <span className="text-[9px] text-muted text-center leading-tight line-clamp-2">{g.name}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[.04] p-2">
        <div className="text-xs font-game text-emerald-300 mb-1">✅ Completed</div>
        {done.length === 0 ? <p className="text-xs text-muted">Nothing completed yet. Each finished goal lands here with a tick.</p> : (
          <table className="w-full text-xs">
            <tbody>
              {done.map((g) => (
                <tr key={g.id} className="border-t border-white/5">
                  <td className="py-1 w-6">{g.icon}</td>
                  <td className="py-1">{g.name}</td>
                  <td className="py-1 text-muted text-right">{g.need > 1 ? `${g.have}/${g.need} ${g.unit}` : ""}</td>
                  <td className="py-1 w-16 text-right text-muted">{new Date(g.doneAt!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                  <td className="py-1 w-5 text-right text-emerald-300">✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {boom && <Fireworks onDone={() => setBoom(false)} />}
    </section>
  );
}

// 花火: a full-screen fireworks show. Tap to close.
export function Fireworks({ onDone, seconds = 7 }: { onDone: () => void; seconds?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const dpr = canvasDpr();
    const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
    const few = isLite();
    type Pt = { x: number; y: number; vx: number; vy: number; life: number; color: string; rocket?: boolean; ty?: number };
    let pts: Pt[] = [];
    const COLORS = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#ff9f1c", "#ffffff"];
    const launch = () => pts.push({ x: W * (0.15 + Math.random() * 0.7), y: H, vx: (Math.random() - 0.5) * 2, vy: -H / 70 - Math.random() * 4, life: 1, color: "#fff", rocket: true, ty: H * (0.15 + Math.random() * 0.35) });
    const burst = (x: number, y: number) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)], n = (few ? 40 : 60) + Math.floor(Math.random() * 30), sp = 3 + Math.random() * 4;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, s = sp * (0.6 + Math.random() * 0.4) * dpr; pts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color }); }
    };
    let raf = 0, last = 0, prev = performance.now();
    const start = prev;
    // Real-time movement: slow devices skip frames instead of slow motion.
    const tick = (t: number) => {
      const k = Math.min(4, (t - prev) / 16.7);
      prev = t;
      if (t - last > 380 && t - start < seconds * 1000 - 1500) { launch(); if (Math.random() < 0.5) launch(); last = t; }
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.9, 0.22 * k)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const next: Pt[] = [];
      for (const p of pts) {
        p.x += p.vx * k; p.y += p.vy * k;
        if (p.rocket) {
          if (p.y <= p.ty!) { burst(p.x, p.y); continue; }
        } else { p.vy += 0.06 * dpr * k; p.vx *= Math.pow(0.985, k); p.vy *= Math.pow(0.985, k); p.life -= 0.012 * k; }
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.rocket ? 2.5 : 2) * dpr, 0, Math.PI * 2); ctx.fill();
        next.push(p);
      }
      ctx.globalAlpha = 1;
      pts = next;
      if (t - start < seconds * 1000) raf = requestAnimationFrame(tick); else onDone();
    };
    raf = requestAnimationFrame(tick);
    navigator.vibrate?.([60, 80, 60, 80, 200]);
    return () => cancelAnimationFrame(raf);
  }, [host, onDone, seconds]);
  if (!host) return null;
  return createPortal(
    <div data-overlay onClick={onDone} className="fixed inset-0 z-[60] bg-black/70 grid place-items-center">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="relative text-center pointer-events-none animate-stamp">
        <div className="text-6xl font-black text-[var(--gold)] drop-shadow-[0_0_20px_#ffd166]">花火</div>
        <div className="mt-2 font-game text-lg">ALL GAUGES FULL!</div>
        <div className="text-sm text-muted">Every goal for today is done. Real progress, hero.</div>
      </div>
    </div>,
    host,
  );
}
