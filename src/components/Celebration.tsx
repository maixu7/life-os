"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

const COMIC = ["SUGOI!", "YATTA!", "KABOOM!", "LEGENDARY!", "FULL POWER!", "NICE!"];

// Synthesised victory chime, so no audio files are needed.
function chime(big: boolean) {
  try {
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
    const t = setTimeout(clearCelebration, celebration.big ? 3300 : 1600);
    return () => {
      stop();
      clearTimeout(t);
    };
  }, [celebration, clearCelebration]);

  if (!celebration) return null;
  const word = COMIC[Math.floor(Math.random() * COMIC.length)];
  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={clearCelebration}>
      <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
      {celebration.big && <div className="absolute inset-0 shimmer" />}
      {celebration.big ? (
        <div className="absolute top-0 inset-x-0 animate-banner">
          <div className="mx-auto mt-[22vh] max-w-md text-center px-6 py-5 card border-2 border-[var(--gold)] shadow-[0_0_40px_var(--gold)]">
            <div className="text-[var(--gold)] text-sm font-bold tracking-[.3em]">{word}</div>
            <div className="text-4xl font-black glow-text animate-pop">{celebration.title}</div>
            {celebration.subtitle && <div className="mt-1 text-muted">{celebration.subtitle}</div>}
          </div>
        </div>
      ) : (
        <div className="absolute top-[30vh] inset-x-0 text-center">
          <span className="inline-block animate-pop text-3xl font-black italic text-[var(--gold)] [text-shadow:3px_3px_0_#12051f,0_0_18px_var(--accent)]">
            {celebration.title}
          </span>
        </div>
      )}
      {celebration.xp ? (
        <div className="absolute top-[42vh] inset-x-0 text-center animate-pop text-xl font-bold text-[var(--accent2)]">
          +{celebration.xp} XP
        </div>
      ) : null}
    </div>
  );
}
