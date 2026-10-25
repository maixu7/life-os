"use client";

import { useMemo } from "react";
import { energy } from "@/lib/body";
import { sugarOn } from "@/lib/body";
import { toDay, useApp } from "@/lib/store";

// Food page: today's sugar (against the WHO's 25 g ideal and 50 g limit),
// calories in and out, caffeine and water, in one strip.
export function IntakeStrip() {
  const { data } = useApp();
  const day = toDay(new Date());
  const v = useMemo(() => {
    const e = energy(data, day);
    const logs = data.logs.filter((l) => l.day === day);
    const caffeine = Math.round(logs.filter((l) => l.kind === "drink").reduce((n, l) => n + (Number(l.data.caffeine) || 0), 0));
    const water = logs.filter((l) => ["water", "drink", "milk"].includes(l.kind)).reduce((n, l) => n + (Number(l.data.ml) || 0), 0);
    return { e, sugar: sugarOn(data, day), caffeine, water };
  }, [data, day]);
  const pct = Math.min(100, (v.sugar / 50) * 100);
  const tone = v.sugar >= 50 ? "bg-rose-500" : v.sugar >= 25 ? "bg-amber-400" : "bg-emerald-400";
  const goal = data.profile.settings.water_goal_ml;
  return (
    <div className="card p-3 mb-4 space-y-2 text-xs">
      <div className="flex items-center justify-between"><span className="font-semibold">🍬 Sugar today</span><span className={v.sugar >= 50 ? "text-rose-300" : "text-muted"}>{v.sugar} g · ideal 25 g, limit 50 g</span></div>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full ${tone}`} style={{ width: `${pct}%` }} /><div className="absolute top-0 left-1/2 h-full w-px bg-white/40" /></div>
      {v.sugar >= 50 && <p className="text-rose-300">Over the limit: no more sweets or sweet drinks today. A brisk walk was added to your plan.</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/5 p-1.5"><b>{v.e.intake}</b><br /><span className="text-muted">kcal in / {v.e.out} out</span></div>
        <div className="rounded-lg bg-white/5 p-1.5"><b>{v.water}</b><br /><span className="text-muted">of {goal} ml</span></div>
        <div className="rounded-lg bg-white/5 p-1.5"><b>{v.caffeine}</b><br /><span className="text-muted">mg caffeine</span></div>
      </div>
    </div>
  );
}
