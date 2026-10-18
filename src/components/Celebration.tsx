"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

const COMIC = ["SUGOI!", "YATTA!", "KABOOM!", "LEGENDARY!", "FULL POWER!", "NICE!"];

// Synthesised victory chime, so no audio files are needed.
function chime(big: boolean) {
  try {
    if (localStorage.getItem("lifeos-vibrate") !== "off") navigator.vibrate?.(big ? [60, 40, 120] : 40);
    if (localStorage.getItem("lifeos-sound") === "off") return;
    const ctx = new AudioContext();
    const notes = big ? [523, 659, 784, 1047, 1319] : [659, 988];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

function hanabi(canvas: HTMLCanvasElement, bursts: number) {
  const ctx = canvas.getContext("2d")!;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#ff4fd8", "#46e6ff", "#ffd166", "#7cff9b", "#ff6a2a", "#ffffff"];
  const parts: Particle[] = [];
  const burst = () => {
    const x = innerWidth * (0.15 + Math.random() * 0.7);
    const y = innerHeight * (0.15 + Math.random() * 0.35);
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      const s = 2 + Math.random() * 3.5;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
    }
  };
  for (let i = 0; i < bursts; i++) setTimeout(burst, i * 280);
  let raf = 0;
  const frame = () => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.985;
      p.life -= 0.012;
      if (p.life <= 0) continue;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => cancelAnimationFrame(raf);
}

export function CelebrationLayer() {
  const { celebration, clearCelebration } = useApp();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!celebration || !canvas.current) return;
    chime(!!celebration.big);
    navigator.vibrate?.(celebration.big ? [60, 40, 120] : 40);
    const stop = hanabi(canvas.current, celebration.big ? 7 : 2);
    // Small ones (+XP) fade on their own; big ones stay until tapped.
    const t = celebration.big ? undefined : setTimeout(clearCelebration, 1500);
    return () => {
      stop();
      clearTimeout(t);
    };
  }, [celebration, clearCelebration]);

  if (!celebration) return null;
  const word = COMIC[Math.floor(Math.random() * COMIC.length)];
  const color = celebration.kind === "achievement" ? "var(--gold)" : celebration.kind === "level" ? "var(--accent)" : "var(--accent2)";
  return (
    <div data-overlay className={`fixed inset-0 z-50 ${celebration.big ? "bg-black/70 animate-fade" : "pointer-events-none"}`} onClick={clearCelebration}>
      <canvas ref={canvas} className="absolute inset-0 w-full h-full pointer-events-none" />
      {celebration.big ? (
        <div className="absolute inset-x-0 top-[18vh] px-6 text-center">
          <div className="text-xs font-game font-bold tracking-[.4em]" style={{ color }}>{word}</div>
          {celebration.icon && <div className="mt-2 text-6xl animate-pop">{celebration.icon}</div>}
          <div className="relative mx-auto mt-2 max-w-lg overflow-hidden py-3 shimmer"
            style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${color} 35%, transparent), transparent)` }}>
            <div className="animate-slash font-game text-3xl sm:text-4xl font-black italic tracking-wide"
              style={{ color: "#fff", textShadow: `0 0 18px ${color}, 3px 3px 0 #000` }}>{celebration.title}</div>
          </div>
          {celebration.subtitle && <div className="mt-2 text-lg font-bold animate-pop">{celebration.subtitle}</div>}
          {celebration.xp ? (
            <div className="mt-3 flex justify-center gap-2 animate-pop">
              <span className="chip !border-[var(--accent2)] text-[var(--accent2)] font-bold">+{celebration.xp} XP</span>
              <span className="chip !border-[var(--gold)] gold-text font-bold">+{Math.floor(celebration.xp / 2)} 🪙</span>
            </div>
          ) : null}
          {celebration.quote && (
            <div className="card mx-auto mt-6 max-w-md p-4 text-left flex gap-3 animate-sheet">
              <span className="text-3xl">🥷</span>
              <div>
                <div className="font-game text-[10px] tracking-widest text-[var(--accent2)]">SENSEI KAITO</div>
                <p className="text-sm leading-relaxed">{celebration.quote}</p>
              </div>
            </div>
          )}
          <div className="mt-6 text-xs text-muted">Tap to continue</div>
        </div>
      ) : (
        <div className="absolute top-[28vh] inset-x-0 text-center">
          <span className="inline-block animate-pop font-game text-2xl font-black italic text-[var(--gold)] [text-shadow:3px_3px_0_#000,0_0_18px_var(--accent)]">
            {celebration.title}
          </span>
          {celebration.xp ? <div className="mt-1 animate-pop font-bold text-[var(--accent2)]">+{celebration.xp} XP · +{Math.floor(celebration.xp / 2)} 🪙</div> : null}
        </div>
      )}
    </div>
  );
}
