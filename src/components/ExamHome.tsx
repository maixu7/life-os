"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { daysToExam, studyDay } from "@/lib/worst";

// Base Camp: the exam countdown with today's target (minutes and pages from
// the study plan), and the big one-tap focus button.

export function ExamTarget() {
  const { data, profile, saveSettings } = useApp();
  const exam = daysToExam(data);
  const day = useMemo(() => studyDay(data), [data]);
  if (!profile.settings.exam_date) {
    return (
      <section className="card p-4 mb-4 flex items-center gap-3">
        <span className="text-3xl">📝</span>
        <label className="flex-1 text-xs text-muted">Got an exam coming? Set the date for a countdown and a daily target.
          <input type="date" className="input mt-1 !py-1 text-sm" onChange={(e) => e.target.value && saveSettings({ exam_date: e.target.value })} />
        </label>
      </section>
    );
  }
  if (exam == null) return null; // exam is over
  const pagesGoal = day.items.reduce((n, x) => n + (x.item.pages ?? 0), 0);
  const pages = day.items.reduce((n, x) => n + x.pages, 0);
  const pct = day.goal ? Math.min(100, Math.round((day.mins / day.goal) * 100)) : 0;
  return (
    <section className="card frame p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="text-center shrink-0">
          <div className="font-game text-4xl font-black glow-text leading-none">{exam}</div>
          <div className="text-[10px] text-muted">{exam === 1 ? "day" : "days"} left</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-game tracking-widest text-rose-300">{exam === 0 ? "EXAM DAY. GO WIN." : "FINAL BOSS: EXAM"}</div>
          {day.goal > 0 ? (
            <>
              <div className="text-sm">Today: <b>{day.mins}</b>/{day.goal} min{pagesGoal ? <> · <b>{pages}</b>/{pagesGoal} pages</> : null}</div>
              <div className="h-2 rounded-full bg-white/10 mt-1"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div>
              <div className={`text-[11px] mt-1 ${day.done ? "text-emerald-300" : "text-muted"}`}>{day.done ? "✓ Today's target done. Fun unlocked." : `${day.left} min to go${day.next ? ` · next: ${day.next.subject}${day.next.what ? ` (${day.next.what})` : ""}` : ""}`}</div>
            </>
          ) : <Link href="/learn" className="text-xs text-muted">Add subjects to your study plan on Learn to get a daily target →</Link>}
        </div>
      </div>
    </section>
  );
}

// One tap: straight into a 25-minute focus session on the next subject.
export function FocusButton() {
  const { data } = useApp();
  const next = useMemo(() => studyDay(data).next, [data]);
  const href = `/focus?start=1${next ? `&subject=${encodeURIComponent(next.subject)}` : ""}`;
  return (
    <Link href={href} className="btn-primary mb-4 flex w-full items-center justify-center gap-3 !py-4 text-xl font-black active:scale-[.98]">
      <span className="text-3xl">⏱️</span>
      <span className="text-left leading-tight">START FOCUS<span className="block text-xs font-normal opacity-80">25 min{next ? ` · ${next.subject}` : ""} · one tap</span></span>
    </Link>
  );
}
