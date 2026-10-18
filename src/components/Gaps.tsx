"use client";

import { useMemo, useState } from "react";
import { useRunAction } from "@/components/Coach";
import { gaps, handledToday, PERIODS, type Period } from "@/lib/gaps";
import { useApp } from "@/lib/store";

// What's lacking in the hero's real life, by day, week, month or year.
export function GapsCard() {
  const { data } = useApp();
  const run = useRunAction();
  const [period, setPeriod] = useState<Period>("week");
  const r = useMemo(() => gaps(data, period), [data, period]);
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-2">🔍 What you&apos;re lacking</h2>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {PERIODS.map((p) => <button key={p.id} onClick={() => setPeriod(p.id)} className={`chip justify-center !px-1 text-xs ${period === p.id ? "chip-on" : ""}`}>{p.label}</button>)}
      </div>
      {r.days === 0 ? <p className="text-sm text-muted">Nothing tracked {period === "day" ? "today" : "in this period"} yet. Log your day and Sensei will find what&apos;s missing.</p>
        : r.gaps.length === 0 ? <p className="text-sm">✨ Nothing is lacking {period === "day" ? "today so far" : `over ${r.days} tracked day${r.days > 1 ? "s" : ""}`}. Real discipline, hero.</p> : (
        <div className="grid gap-2">
          {r.gaps.map((g) => (
            <div key={g.id} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{g.label}</div>
                  <div className="text-xs text-muted">Now: <span className="text-rose-300">{g.have}</span> · Need: {g.need}</div>
                </div>
                {handledToday(data, g.id) ? <span className="chip !py-1 text-xs text-emerald-300">✓ Done today</span> : <button onClick={() => run(g.task.action)} className="btn-primary !px-3 !py-1.5 text-xs">Fix</button>}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${Math.max(8, g.severity * 100)}%` }} /></div>
              <div className="mt-1 text-[11px] text-muted">➡️ {g.task.title}. {g.task.why}</div>
            </div>
          ))}
        </div>
      )}
      {r.days > 0 && period !== "day" && <p className="mt-2 text-[10px] text-muted">Based on {r.days} day{r.days > 1 ? "s" : ""} you tracked. Untracked days are not counted against you.</p>}
    </section>
  );
}
