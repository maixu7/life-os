"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { karma, logKarma } from "@/lib/karma";
import { CHALLENGES, PET_STAGES } from "@/lib/tools";
import { WISDOM } from "@/lib/wisdom";
import { toDay, today, useApp, useCustomItems } from "@/lib/store";

const seed = (day: string) => [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function QuoteOfDay() {
  const w = WISDOM[seed(today()) % WISDOM.length];
  return (
    <section className="card p-4 mb-4">
      <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">📜 WISDOM OF THE DAY</div>
      <p className="mt-1 text-sm">{w.kind === "quote" ? `“${w.text}”` : w.text}</p>
      {w.by && <p className="text-xs text-muted text-right mt-1">— {w.by}</p>}
    </section>
  );
}

export function DailyChallenge() {
  const { data, logActivity, celebrate } = useApp();
  const day = today();
  const name = CHALLENGES[seed(day) % CHALLENGES.length];
  const done = data.logs.some((l) => l.kind === "challenge" && l.day === day);
  return (
    <section className="card frame p-4 mb-4">
      <div className="text-[10px] font-game tracking-widest gold-text">🔥 DAILY CHALLENGE · +40 XP · 😇 +5</div>
      <div className="mt-1 font-game font-bold">{name}</div>
      <p className="text-xs text-muted">A new challenge every day. Beat it for bonus XP and angel points.</p>
      <button disabled={done} onClick={() => {
        const row = logActivity("challenge", { name }, new Date(), 40);
        celebrate({ title: "CHALLENGE BEATEN!", subtitle: name, xp: row.xp, big: true, icon: "🔥", quote: "What stands in the way becomes the way. (Marcus Aurelius)" });
      }} className={`${done ? "btn-ghost" : "btn-gold"} w-full mt-2 !py-2`}>{done ? "✓ Beaten today" : "I did it!"}</button>
    </section>
  );
}

const LOGIN_GOLD = [10, 15, 20, 25, 30, 40, 100];

export function LoginCalendar() {
  const { data, logActivity, celebrate } = useApp();
  const day = today();
  const claimed = data.logs.some((l) => l.kind === "login" && l.day === day);
  // Consecutive days (ending yesterday) on which you claimed a reward.
  const streak = useMemo(() => {
    const claimedDays = new Set(data.logs.filter((l) => l.kind === "login").map((l) => l.day));
    let n = 0;
    for (let t = Date.now() - 86_400_000; claimedDays.has(toDay(new Date(t))); t -= 86_400_000) n++;
    return n;
  }, [data.logs]);
  const idx = claimed ? (streak + 6) % 7 : streak % 7;
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">📅 Login rewards</h2>
        <span className="text-xs text-muted">Come back daily. Day 7 = 100 gold</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {LOGIN_GOLD.map((g, i) => (
          <div key={i} className={`rounded-lg p-1.5 text-center text-[10px] ${i < idx || (claimed && i === idx) ? "bg-[var(--accent2)]/25 border border-[var(--accent2)]" : i === idx ? "bg-[var(--gold)]/20 border border-[var(--gold)] animate-pulse" : "bg-white/5"}`}>
            <div className="text-base">{i === 6 ? "💎" : "🪙"}</div>
            <div className="font-bold">{g}</div>
            <div className="text-muted">D{i + 1}</div>
          </div>
        ))}
      </div>
      <button disabled={claimed} onClick={() => {
        logActivity("login", { n: idx + 1, gold: LOGIN_GOLD[idx] }, new Date(), 0);
        celebrate({ title: `DAY ${idx + 1} REWARD`, subtitle: `+${LOGIN_GOLD[idx]} gold`, big: idx === 6, icon: idx === 6 ? "💎" : "🪙" });
      }} className={`${claimed ? "btn-ghost" : "btn-gold"} w-full mt-3 !py-2`}>{claimed ? "Claimed. See you tomorrow!" : `Claim day ${idx + 1}`}</button>
    </section>
  );
}

const PRIZES = [5, 10, 15, 20, 25, 30, 50, 100];
const WEIGHTS = [20, 20, 16, 14, 12, 9, 6, 3];

export function SpinSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const done = data.logs.some((l) => l.kind === "spin" && l.day === today());
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const seg = 360 / PRIZES.length;
  const spin = () => {
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b);
    let i = 0;
    while (r > WEIGHTS[i]) { r -= WEIGHTS[i]; i++; }
    setSpinning(true);
    setAngle(360 * 6 + (360 - i * seg - seg / 2));
    setTimeout(() => {
      setSpinning(false);
      logActivity("spin", { gold: PRIZES[i] }, new Date(), 0);
      celebrate({ title: PRIZES[i] >= 50 ? "JACKPOT!" : "LUCKY SPIN", subtitle: `+${PRIZES[i]} gold`, big: PRIZES[i] >= 50, icon: "🎡" });
    }, 4200);
  };
  const colors = ["#7b2cbf", "#3a0ca3", "#f72585", "#4361ee", "#4cc9f0", "#b5179e", "#ffd166", "#ff4d6d"];
  return (
    <Sheet title="🎡 Lucky spin" onClose={onClose}>
      <p className="text-sm text-muted text-center">One free spin every day.</p>
      <div className="relative mx-auto my-4 h-64 w-64">
        <div className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 text-3xl">🔻</div>
        <svg viewBox="-100 -100 200 200" className="h-full w-full" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4s cubic-bezier(.17,.67,.12,1)" : "none" }}>
          {PRIZES.map((p, i) => {
            const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
            const mid = ((i + 0.5) * seg - 90) * Math.PI / 180;
            return (
              <g key={i}>
                <path d={`M0 0 L${95 * Math.cos(a0)} ${95 * Math.sin(a0)} A95 95 0 0 1 ${95 * Math.cos(a1)} ${95 * Math.sin(a1)} Z`} fill={colors[i]} stroke="#0b0716" strokeWidth="2" />
                <text x={62 * Math.cos(mid)} y={62 * Math.sin(mid)} fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{p}</text>
              </g>
            );
          })}
          <circle r="16" fill="#0b0716" stroke="#ffd166" strokeWidth="3" />
        </svg>
      </div>
      <button disabled={done || spinning} onClick={spin} className="btn-gold w-full">{done ? "Come back tomorrow" : spinning ? "Spinning…" : "SPIN!"}</button>
    </Sheet>
  );
}

// A spirit companion that evolves with every good deed you collect.
export function Pet() {
  const { data } = useApp();
  const { items, add, update } = useCustomItems("pet");
  const pet = items[0];
  const k = useMemo(() => karma(data), [data]);
  const pts = k.total.good;
  const stage = [...PET_STAGES].reverse().find((s) => pts >= s.min)!;
  const next = PET_STAGES.find((s) => s.min > pts);
  const todays = data.logs.filter((l) => l.day === today());
  const net = todays.reduce((n, l) => n + logKarma(l), 0);
  const mood = net >= 15 ? "😍 overjoyed" : net >= 5 ? "😊 happy" : net >= 0 ? "🙂 waiting for your good deeds" : "😟 sad, the devil is feeding on it";
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  return (
    <section className="card frame p-4 mb-4 text-center">
      <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">🐾 SPIRIT COMPANION</div>
      <div className={`text-7xl my-2 ${net >= 0 ? "animate-float" : "grayscale"}`}>{stage.icon}</div>
      <div className="font-game font-bold">{String(pet?.name ?? "Unnamed")} · {stage.name}</div>
      <p className="text-xs text-muted">Feeling {mood}</p>
      {next && (
        <div className="mt-2 text-left text-xs text-muted">Evolves into {next.icon} {next.name} at {next.min} angel points ({pts}/{next.min})
          <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${Math.min(100, (pts / next.min) * 100)}%` }} /></div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">Your companion grows with your good deeds and gets sad when you feed the devil.</p>
      {naming ? (
        <div className="mt-2 flex gap-2">
          <input className="input" placeholder="Name your companion" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary" onClick={() => { if (!name.trim()) return; if (pet) update(pet.id, { name: name.trim() }); else add(name.trim(), {}); setNaming(false); }}>Save</button>
        </div>
      ) : <button onClick={() => setNaming(true)} className="chip mt-2">{pet ? "Rename" : "Give it a name"}</button>}
    </section>
  );
}
