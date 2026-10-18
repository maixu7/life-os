"use client";

import { useEffect, useRef, useState } from "react";
import { alarmPrefs, ring, stopRing, unlockAudioOnTap, type AlarmEvent } from "@/lib/alarm";

// Full-screen alarm: it keeps ringing and vibrating until you tap Stop or
// Snooze. Snooze rings again after a few minutes.
export function AlarmLayer() {
  const [on, setOn] = useState<AlarmEvent | null>(null);
  const snooze = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    unlockAudioOnTap();
    const go = (e: Event) => {
      const d = (e as CustomEvent<AlarmEvent>).detail;
      setOn(d);
      ring({ rounds: d.rounds });
    };
    window.addEventListener("lifeos-alarm", go);
    return () => { window.removeEventListener("lifeos-alarm", go); stopRing(); };
  }, []);
  if (!on) return null;
  const close = () => { stopRing(); on.onDone?.(); setOn(null); };
  const later = () => {
    stopRing();
    const again = on, mins = alarmPrefs().snoozeMin;
    setOn(null);
    if (snooze.current) clearTimeout(snooze.current);
    snooze.current = setTimeout(() => { setOn(again); ring({ rounds: again.rounds }); }, mins * 60_000);
  };
  return (
    <div data-overlay className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md grid place-items-center p-6" role="alertdialog" aria-label={on.title}>
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-7xl animate-bounce">{on.icon ?? "⏰"}</div>
        <div className="font-game text-2xl text-[var(--accent2)]">{on.title}</div>
        {on.body && <div className="text-lg">{on.body}</div>}
        <div className="text-sm text-muted">{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        <button onClick={close} className="btn-primary w-full !py-4 text-lg">■ Stop</button>
        {!on.rounds && <button onClick={later} className="btn-ghost w-full !py-3">💤 Snooze {alarmPrefs().snoozeMin} min</button>}
      </div>
    </div>
  );
}
