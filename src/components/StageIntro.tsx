"use client";

import { useEffect, useMemo, useState } from "react";
import { line, timeTopic } from "@/lib/lore";
import { dailyMissions, weeklyBoss } from "@/lib/missions";
import { today, toDay, useApp } from "@/lib/store";

const STAGES: Record<string, string> = { morning: "Dawn Stage", afternoon: "Noon Stage", evening: "Dusk Stage", night: "Moonlight Stage" };
const AWAY_MS = 15 * 60 * 1000;

function whoosh() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(120, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.45);
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

function useTyping(text: string, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return text.slice(0, n);
}

// The "stage start" screen every time you open the app, and the stage report at night.
export function StageIntro() {
  const { data, profile } = useApp();
  const [open, setOpen] = useState(true);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) {
        setSeed((s) => s + 1);
        setOpen(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const day = today();
  const todays = useMemo(() => data.logs.filter((l) => l.day === day), [data.logs, day]);
  const missions = dailyMissions(todays, profile.settings);
  const cleared = missions.filter((m) => m.done).length;
  const first = data.logs.reduce((m, l) => (l.day < m ? l.day : m), day);
  const dayN = Math.round((new Date(`${day}T12:00`).getTime() - new Date(`${first}T12:00`).getTime()) / 86_400_000) + 1;
  const topic = timeTopic();
  const report = new Date().getHours() >= 21 && todays.length > 0;
  const yesterday = toDay(new Date(Date.now() - 86_400_000));
  const away = data.logs.length > 0 && !data.logs.some((l) => l.day === yesterday || l.day === day);
  const exam = profile.settings.exam_date;
  const examSoon = exam && (new Date(exam).getTime() - Date.now()) / 86_400_000 < 45 && new Date(exam).getTime() > Date.now();
  const quote = useMemo(
    () => line(report ? "evening" : away ? "comeback" : examSoon && Math.random() < 0.4 ? "exam" : topic),
    // a new line each time the stage opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, report, away, examSoon, topic],
  );
  const typed = useTyping(open ? quote : "");
  const boss = weeklyBoss(data);
  const xpToday = todays.reduce((s, l) => s + l.xp, 0);

  if (!open) return null;
  const close = () => {
    whoosh();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-[#05030f]/95 px-6 text-center animate-fade" onClick={close}>
      <div className="font-game text-xs tracking-[.5em] text-[var(--accent2)]">DAY {dayN}</div>
      <div className="mt-3 overflow-hidden">
        <h1 className="animate-slash font-game text-4xl font-black italic glow-text">{report ? "STAGE REPORT" : STAGES[topic]}</h1>
      </div>
      <div className="mt-1 text-sm text-muted">
        {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
      </div>

      {report ? (
        <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="card p-3"><div className="font-game text-2xl">{cleared}/6</div><div className="text-[10px] text-muted">MISSIONS</div></div>
          <div className="card p-3"><div className="font-game text-2xl text-[var(--accent2)]">{xpToday}</div><div className="text-[10px] text-muted">XP</div></div>
          <div className="card p-3"><div className="font-game text-2xl gold-text">{Math.floor(xpToday / 2)}</div><div className="text-[10px] text-muted">GOLD</div></div>
        </div>
      ) : (
        <div className="mt-6 w-full max-w-sm space-y-2">
          <div className="flex justify-center gap-1.5">
            {missions.map((m) => (
              <span key={m.id} title={m.name}
                className={`grid h-10 w-10 place-items-center rounded-lg border text-lg ${m.done ? "border-[var(--accent2)] bg-[var(--accent2)]/20" : "border-white/15 bg-white/5 grayscale"}`}>{m.icon}</span>
            ))}
          </div>
          <div className="text-xs text-muted">{cleared === 0 ? "6 missions await you today" : `${cleared} of 6 missions cleared`}</div>
          {!boss.defeated && (
            <div className="text-xs"><span className="text-rose-300">{boss.icon} {boss.name}</span> <span className="text-muted">· {boss.left} HP left this week</span></div>
          )}
        </div>
      )}

      <div className="card mt-8 w-full max-w-md p-4 text-left flex gap-3">
        <span className="text-4xl animate-float">🥷</span>
        <div className="min-h-[4.5rem]">
          <div className="font-game text-[10px] tracking-widest text-[var(--accent2)]">SENSEI KAITO</div>
          <p className="text-sm leading-relaxed">{typed}<span className="animate-pulse">▌</span></p>
        </div>
      </div>

      <button onClick={close} className={`btn-primary ${report ? "btn-hot" : ""} mt-8 w-full max-w-xs text-lg animate-pulse-glow`}>
        {report ? "Rest, hero" : cleared === 6 ? "Continue" : "Start stage"}
      </button>
    </div>
  );
}
