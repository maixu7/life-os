"use client";

import { useMemo } from "react";
import { useRunAction } from "@/components/Coach";
import { logKarma } from "@/lib/karma";
import { moveOf } from "@/lib/moves";
import { goalsOn, sched } from "@/lib/schedule";
import { toDay, useApp, type Log } from "@/lib/store";

// Learning comes first in Life OS: every day should make you a "Day 1" smarter.

export function learnKind(l: Log): string | null {
  if (l.kind === "coding") return "💻 Coding";
  if (l.kind === "focus") return "🎯 Study";
  if (l.kind === "media" && l.data.mode !== "watch" && logKarma(l) > 0) return l.data.mode === "listen" ? "🎧 Listening" : "📚 Reading";
  if (l.kind === "activity") {
    const n = String(l.data.name);
    if (/study|homework|learn|class|lecture/i.test(n)) return "🎯 Study";
    const m = moveOf(n);
    if (m?.kind === "mind" && m.name !== "Meditation") return `🧠 ${m.name}`;
  }
  return null;
}

export function learnedOn(logs: Log[], day: string) {
  const by = new Map<string, number>();
  for (const l of logs) {
    if (l.day !== day) continue;
    const k = learnKind(l);
    if (k) by.set(k, (by.get(k) ?? 0) + (Number(l.data.minutes) || (l.kind === "focus" ? 25 : 15)));
  }
  return { total: [...by.values()].reduce((a, b) => a + b, 0), by: [...by.entries()].sort((a, b) => b[1] - a[1]) };
}

const QUICK: [string, string, Parameters<ReturnType<typeof useRunAction>>[0]][] = [
  ["📚", "Read", { type: "library" }], ["💻", "Code", { type: "activity", name: "Coding" }], ["🎯", "Focus 25 min", { type: "href", href: "/focus" }],
  ["⌨️", "Typing", { type: "activity", name: "Typing practice" }], ["✍️", "Writing", { type: "activity", name: "Writing practice" }],
  ["🎧", "Listening", { type: "activity", name: "Listening practice" }], ["🗣️", "Speaking", { type: "activity", name: "Speaking practice" }],
];

export function LearnToday({ compact = false }: { compact?: boolean }) {
  const { data } = useApp();
  const run = useRunAction();
  const goal = goalsOn(sched(data.profile.settings.schedule)).learnGoal;
  const day = toDay(new Date());
  const t = useMemo(() => learnedOn(data.logs, day), [data.logs, day]);
  const week = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) out.push(learnedOn(data.logs, toDay(new Date(Date.now() - i * 86_400_000))).total);
    return out;
  }, [data.logs]);
  const pct = Math.min(100, (t.total / Math.max(1, goal)) * 100);
  const streak = (() => { let n = 0; for (let i = week.length - 1; i >= 0 && week[i] > 0; i--) n++; return n; })();
  return (
    <section className="card frame p-4 mb-4 border-[var(--accent2)]/40">
      <div className="flex items-center justify-between">
        <h2 className="section-title">📖 Learning: today&apos;s main quest</h2>
        {streak > 0 && <span className="chip text-xs">🔥 {streak}-day streak</span>}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="font-game text-3xl">{t.total}<span className="text-sm text-muted"> / {goal} min</span></div>
        <div className="text-xs text-muted">{pct >= 100 ? "✅ Goal done. Day 1 smarter!" : `${goal - t.total} min to go`}</div>
      </div>
      <div className="mt-1 h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] transition-all" style={{ width: `${Math.max(2, pct)}%` }} /></div>
      {t.by.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{t.by.map(([k, m]) => <span key={k} className="chip !py-0.5 text-xs">{k} {m} min</span>)}</div>}
      {!compact && (
        <div className="mt-3 flex items-end gap-1 h-12">
          {week.map((m, i) => <div key={i} className="flex-1 rounded-t bg-[var(--accent2)]/70" style={{ height: `${Math.max(4, Math.min(100, (m / Math.max(1, goal)) * 100))}%` }} title={`${m} min`} />)}
        </div>
      )}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {QUICK.slice(0, compact ? 4 : 7).map(([i, l, a]) => (
          <button key={l} onClick={() => run(a)} className="rounded-xl bg-white/5 py-2 flex flex-col items-center gap-0.5 active:scale-95 transition">
            <span className="text-xl">{i}</span><span className="text-[10px] text-center leading-tight">{l}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
