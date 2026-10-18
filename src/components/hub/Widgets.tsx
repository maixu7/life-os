"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRunSlot } from "@/components/Blocks";
import { bodyOf, energy } from "@/lib/body";
import { sumMl } from "@/lib/goals";
import { studyMins } from "@/lib/hub";
import type { Block } from "@/lib/layout";
import { today, useApp } from "@/lib/store";
import { daysToExam, studyDay } from "@/lib/worst";

// ---------- 91 Widgets: Control Centre blocks that show a live number ----------
export const WIDGETS: { id: NonNullable<Block["widget"]>; icon: string; title: string; desc: string }[] = [
  { id: "water", icon: "💧", title: "Water glass", desc: "A glass that fills up; tap to drink 250 ml." },
  { id: "kcal", icon: "🔥", title: "Calorie ring", desc: "Calories eaten today against what your body uses." },
  { id: "study", icon: "📖", title: "Study bar", desc: "Minutes studied today against your study plan." },
  { id: "exam", icon: "📝", title: "Exam days", desc: "Big countdown to your exam date." },
];

export function WidgetBlock({ b }: { b: Block }) {
  const { data, profile } = useApp();
  const run = useRunSlot();
  const day = today();
  const logs = useMemo(() => data.logs.filter((l) => l.day === day), [data.logs, day]);
  const s = profile.settings;
  const head = (
    <div className="flex items-center justify-between mb-2">
      <h2 className="section-title">{b.icon} {b.title}</h2>
      <Link href="/control?tab=pages" className="text-[11px] text-muted">🎛️</Link>
    </div>
  );
  if (b.widget === "water") {
    const ml = sumMl(logs, "water"), pct = Math.min(100, (ml / s.water_goal_ml) * 100);
    return (
      <section className="card p-4 mb-4">{head}
        <button onClick={() => run({ type: "water", ml: 250 })} className="w-full flex items-center gap-4 text-left">
          <svg viewBox="0 0 60 80" className="h-24 w-16 shrink-0">
            <defs><clipPath id={`g-${b.id}`}><path d="M8 4 H52 L46 76 H14 Z" /></clipPath></defs>
            <rect x="0" y={80 - (pct / 100) * 76} width="60" height="80" fill="#46c8ff" clipPath={`url(#g-${b.id})`} />
            <path d="M8 4 H52 L46 76 H14 Z" fill="none" stroke="#ffffff88" strokeWidth="2.5" />
          </svg>
          <span><span className="block text-3xl font-black tabular-nums">{ml}</span><span className="text-xs text-muted">of {s.water_goal_ml} ml · tap to drink a glass</span></span>
        </button>
      </section>
    );
  }
  if (b.widget === "kcal") {
    const e = energy(data, day), b2 = bodyOf(data);
    const pct = Math.min(1, e.intake / Math.max(1, e.out)), c = 2 * Math.PI * 34;
    return (
      <section className="card p-4 mb-4">{head}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#ffffff18" strokeWidth="9" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={e.intake > e.out ? "#ff6b6b" : "#ffb347"} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
          </svg>
          <div><div className="text-3xl font-black tabular-nums">{e.intake}</div><div className="text-xs text-muted">of ~{e.out} kcal used today · {e.protein}/{b2.proteinNeed} g protein</div></div>
        </div>
      </section>
    );
  }
  if (b.widget === "study") {
    const sd = studyDay(data, day), mins = Math.max(sd.mins, studyMins(logs)), goal = sd.goal || 60;
    return (
      <section className="card p-4 mb-4">{head}
        <div className="flex items-baseline justify-between"><span className="text-3xl font-black tabular-nums">{mins}<span className="text-sm text-muted"> / {goal} min</span></span>
          <Link href="/focus?start=1" className="chip chip-on">▶ Study</Link></div>
        <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[var(--accent2)]" style={{ width: `${Math.min(100, (mins / goal) * 100)}%` }} /></div>
        {sd.next && <div className="mt-1 text-xs text-muted">Next: {sd.next.subject}{sd.next.what ? ` · ${sd.next.what}` : ""}</div>}
      </section>
    );
  }
  const n = daysToExam(data);
  return (
    <section className="card p-4 mb-4">{head}
      {n == null ? <p className="text-sm text-muted">No exam date set. Add it in Tools → Settings.</p> : (
        <div className="text-center"><div className="text-5xl font-black glow-text tabular-nums">{n === 0 ? "TODAY" : n}</div><div className="text-xs text-muted">{n === 0 ? "Exam day. Go win." : `day${n === 1 ? "" : "s"} to the exam (${s.exam_date})`}</div></div>
      )}
    </section>
  );
}
