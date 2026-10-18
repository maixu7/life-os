"use client";

import { useMemo } from "react";
import { forestOf, forestStage, growing } from "@/lib/garden";
import { toDay, useApp } from "@/lib/store";

// The focus forest on the Dojo: this week's trees (one per finished focus
// session) and the whole forest's size. While a session runs, a sapling grows;
// ending early leaves it wilted. Plain emoji, no animation loops.

export function Garden({ pct, running, wilted }: { pct: number; running: boolean; wilted: boolean }) {
  const { data } = useApp();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => toDay(new Date(Date.now() - (6 - i) * 86_400_000))), []);
  const f = useMemo(() => forestOf(data.logs, days), [data.logs, days]);
  const stage = forestStage(f.trees);
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">🌳 Focus forest</h2>
        <span className="text-xs text-muted">{stage.icon} {stage.name}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-3">
        <span className="text-5xl leading-none">{wilted ? "🥀" : running ? growing(pct) : "🌰"}</span>
        <span className="text-xs">
          {wilted ? "Your sapling wilted. Plant a new one: start another session." : running ? `Growing… ${Math.round(pct * 100)}%. Stay focused and it becomes a tree.` : "Start a session to plant a seed. Finish it and a tree joins your forest."}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {f.week.map((d) => (
          <div key={d.day} className="rounded-lg bg-white/5 p-1 min-h-16">
            <div className="text-[9px] text-muted">{new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: "narrow" })}</div>
            <div className="text-base leading-tight break-all">{d.trees.length ? d.trees.slice(0, 6).join("") : <span className="opacity-30">·</span>}</div>
            {d.trees.length > 6 && <div className="text-[9px] text-muted">+{d.trees.length - 6}</div>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        {f.trees} trees · {Math.round(f.minutes / 60)} h focused in total.{stage.next ? ` ${stage.next.need} more to grow a ${stage.next.name}.` : " A legendary forest."} 🌱 short · 🌳 25 min · 🌲 50+ min
      </p>
    </section>
  );
}
