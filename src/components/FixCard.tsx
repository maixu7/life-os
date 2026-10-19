"use client";

import Link from "next/link";
import { atWork, fmt12, hm, phaseNow, sched, studyFrom } from "@/lib/schedule";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { eatNext, riskLevel, studyGate, worst } from "@/lib/worst";

// "Fix my worst habits": the riskiest habits first, each with today's fix
// task and a streak of days you did it, plus what to eat next.
export function FixCard({ open: start = true }: { open?: boolean }) {
  const { data } = useApp();
  const risks = useMemo(() => worst(data), [data]);
  const gate = useMemo(() => studyGate(data), [data]);
  const [open, setOpen] = useState(start);
  const [all, setAll] = useState(false);
  const shown = all ? risks : risks.slice(0, 3);
  return (
    <section className="card p-4 mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <h2 className="section-title">🚨 Fix my worst habits</h2>
        <span className="text-xs text-muted">{risks.length ? `${risks.length} to fix · ${risks.filter((r) => r.doneToday).length} done today ${open ? "▲" : "▼"}` : "Nothing risky ✓"}</span>
      </button>
      {gate.locked && <StudyLock />}
      {open && (
        <div className="mt-3 space-y-2">
          {!risks.length && <p className="text-xs text-muted">Log your meals, drinks, study, fun and sleep for a few days and I&apos;ll rank what hurts you most and give you a fix for every day.</p>}
          {shown.map((r, i) => {
            const [lvl, txt, bar] = riskLevel(r.risk);
            return (
              <div key={r.id} className={`rounded-xl p-3 text-xs ${i === 0 ? "bg-rose-500/10 border border-rose-400/30" : "bg-white/5"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">#{i + 1} {r.name}</div>
                    <div className="text-muted">{r.have} · goal {r.goal}</div>
                  </div>
                  <span className={`${txt} font-semibold whitespace-nowrap`}>{lvl} risk</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 mt-2"><div className={`h-full rounded-full ${bar}`} style={{ width: `${r.risk}%` }} /></div>
                <p className="mt-2 text-muted">{r.why}</p>
                <Link href={r.href} className={`mt-2 flex items-center gap-2 rounded-lg p-2 ${r.doneToday ? "bg-emerald-500/10" : "bg-black/30"}`}>
                  <span className={r.doneToday ? "text-emerald-300" : "text-amber-300"}>{r.doneToday ? "✓" : "○"}</span>
                  <span className="flex-1"><b>Today:</b> {r.today}<span className="block text-muted">{r.progress}</span></span>
                  {r.streak > 0 && <span className="whitespace-nowrap">🔥 {r.streak} day{r.streak > 1 ? "s" : ""}</span>}
                </Link>
              </div>
            );
          })}
          {risks.length > 3 && <button onClick={() => setAll(!all)} className="text-xs text-[var(--accent2)]">{all ? "Show top 3" : `Show all ${risks.length}`}</button>}
          <EatNextList />
          <p className="text-[10px] text-muted">Keep doing each &quot;Today&quot; task every day. When a habit is fixed for a week it drops off this list.</p>
        </div>
      )}
    </section>
  );
}

export function StudyLock() {
  const { data } = useApp();
  const g = studyGate(data);
  if (!g.locked) return null;
  const sc = sched(data.profile.settings.schedule);
  if (atWork(phaseNow(sc))) return <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs">💼 You&apos;re at work now. Study {g.left || ""} min after work, from {fmt12(hm(studyFrom(sc)))}.</p>;
  const href = `/focus?start=1${g.next ? `&subject=${encodeURIComponent(g.next.subject)}` : ""}`;
  return (
    <div className="mt-3 rounded-xl bg-violet-500/15 border border-violet-300/30 p-3 text-xs">
      <div className="font-semibold mb-1">🔒 Study first</div>
      <p>{g.text}</p>
      <Link href={href} className="btn-primary mt-2 block text-center !py-1.5 text-sm">▶ Study {g.next ? g.next.subject : ""} now</Link>
    </div>
  );
}

export function EatNextList({ title = "🍽️ What to eat next" }: { title?: string }) {
  const { data } = useApp();
  const list = useMemo(() => eatNext(data), [data]);
  if (!list.length) return null;
  return (
    <div className="rounded-xl bg-white/5 p-3 text-xs">
      <div className="font-semibold mb-1">{title}</div>
      <ol className="space-y-1.5">
        {list.slice(0, 5).map((e, i) => (
          <li key={e.what} className={e.avoid ? "text-rose-300" : ""}>
            <b>{i + 1}. {e.icon} {e.what}</b>: {e.why}
            {e.have.length > 0 && <span className="text-emerald-300"> · you have {e.have.join(", ")}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
