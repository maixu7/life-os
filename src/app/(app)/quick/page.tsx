"use client";

import { useEffect, useMemo } from "react";
import { useRunSlot } from "@/components/Blocks";
import { openMood, useQuickLogs } from "@/components/hub/Hub";
import { hubOf, openHub, type HubId } from "@/components/hub/registry";
import { XpHeader } from "@/components/XpHeader";
import { sumMl } from "@/lib/goals";
import { studyMins } from "@/lib/hub";
import { today, useApp } from "@/lib/store";

// ---------- 6 Quick log: one screen, big buttons, like a lock-screen widget ----------
// Add it to the home screen (PWA shortcut "Quick log") or to the bottom menu.
export default function QuickPage() {
  const { data, profile } = useApp();
  const run = useRunSlot();
  const quick = useQuickLogs();
  const day = today();
  const logs = useMemo(() => data.logs.filter((l) => l.day === day), [data.logs, day]);
  // The "Snap" home-screen shortcut opens /quick?hub=camera.
  useEffect(() => {
    const h = new URLSearchParams(location.search).get("hub");
    if (h && hubOf(h)) { history.replaceState(null, "", "/quick"); setTimeout(() => openHub(h as HubId), 300); }
  }, []);
  const asleep = data.logs.some((l) => l.kind === "sleep" && !l.data.end);
  const meals = logs.filter((l) => l.kind === "meal" || (l.kind === "activity" && l.data.meal)).length;
  const stat: Record<string, string> = {
    meal: `${meals} today`, water: `${sumMl(logs, "water")} / ${profile.settings.water_goal_ml} ml`, study: `${studyMins(logs)} min today`,
    train: `${logs.filter((l) => l.kind === "workout").length} sets`, mood: logs.some((l) => l.kind === "mood") ? "logged" : "not yet",
  };
  return (
    <>
      <XpHeader title="Quick log" icon="⚡" subtitle="One tap, done. Pin this page to your home screen." />
      <div className="grid grid-cols-2 gap-3">
        {quick.map((q) => (
          <button key={q.id} onClick={q.id === "mood" ? openMood : q.go} className="card frame p-4 flex flex-col items-center gap-1 active:scale-95 transition min-h-32 justify-center">
            <span className="text-5xl">{q.icon}</span>
            <span className="font-game font-bold">{q.label}</span>
            <span className="text-[11px] text-muted">{stat[q.id]}</span>
          </button>
        ))}
        <button onClick={() => run({ type: asleep ? "wake" : "sleep" })} className="card frame p-4 flex flex-col items-center gap-1 active:scale-95 min-h-32 justify-center">
          <span className="text-5xl">{asleep ? "☀️" : "😴"}</span><span className="font-game font-bold">{asleep ? "Woke up" : "Sleep"}</span><span className="text-[11px] text-muted">{asleep ? "end your sleep" : "start sleep now"}</span>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {([["camera", "📸", "Snap"], ["sos", "🆘", "SOS"], ["urge", "🌊", "Urge"], ["dump", "🧠", "Dump"]] as const).map(([id, i, l]) => (
          <button key={id} onClick={() => openHub(id)} className="rounded-2xl border border-white/10 bg-white/[.04] py-3 flex flex-col items-center text-[11px]"><span className="text-2xl">{i}</span>{l}</button>
        ))}
      </div>
    </>
  );
}
