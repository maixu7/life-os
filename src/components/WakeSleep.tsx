"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { today, useApp } from "@/lib/store";

const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const atTime = (time: string) => { const t = new Date(); const [h, m] = time.split(":").map(Number); t.setHours(h || 0, m || 0, 0, 0); return t; };

// "Woke up": pick the time. Once a day; tapping again lets you fix the time, no extra XP.
export function WakeSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, updateLog, celebrate } = useApp();
  const done = data.logs.find((l) => l.kind === "wake" && l.day === today());
  const [time, setTime] = useState(done ? String(done.data.time ?? hm(new Date(done.created_at))) : hm(new Date()));
  const save = () => {
    const at = atTime(time);
    if (done) {
      updateLog(done.id, { data: { ...done.data, time }, at });
      celebrate({ title: "✏️ FIXED", subtitle: `Woke up at ${time}`, kind: "small" });
      return onClose();
    }
    const open = [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
    if (open) updateLog(open.id, { data: { ...open.data, end: at.toISOString() } });
    const r = logActivity("wake", { time, slept_from: open?.data.start ?? null }, at);
    celebrate({ title: "OHAYO!", subtitle: `Woke up at ${time}`, xp: r.xp, icon: "🌅" });
    onClose();
  };
  return (
    <Sheet title="🌅 Woke up" onClose={onClose}>
      {done && <p className="text-xs text-amber-300">You already logged waking up today at {String(done.data.time ?? "")}. You can change the time; it won&apos;t give XP again.</p>}
      <label className="flex items-center gap-2 text-sm">What time did you wake up? <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <button onClick={save} className="btn-primary w-full">{done ? "Change time" : "Log wake-up"}</button>
    </Sheet>
  );
}

// "Sleep": pick when you went to bed. If you're already asleep in the app, say so.
export function SleepSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, updateLog, deleteLog, celebrate } = useApp();
  const open = [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
  const [time, setTime] = useState(open ? hm(new Date(String(open.data.start))) : hm(new Date()));
  const save = () => {
    const at = atTime(time);
    if (at.getTime() > Date.now() + 60_000) at.setDate(at.getDate() - 1); // "23:30" picked after midnight
    if (open) {
      updateLog(open.id, { data: { ...open.data, start: at.toISOString() } });
      celebrate({ title: "✏️ FIXED", subtitle: `Went to sleep at ${time}`, kind: "small" });
      return onClose();
    }
    const r = logActivity("sleep", { start: at.toISOString(), end: null, type: "night" }, at);
    celebrate({ title: "OYASUMI!", subtitle: "Sleep started. Tap Woke up in the morning.", xp: r.xp, icon: "😴" });
    onClose();
  };
  return (
    <Sheet title="😴 Sleep" onClose={onClose}>
      {open && <p className="text-xs text-amber-300">You&apos;re already asleep in the app since {hm(new Date(String(open.data.start)))}. Change the time, or cancel it if it was a mistake.</p>}
      <label className="flex items-center gap-2 text-sm">Going to sleep at <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <button onClick={save} className="btn-primary w-full">{open ? "Change time" : "Start sleep"}</button>
      {open && <button onClick={() => { deleteLog(open.id); onClose(); }} className="btn-ghost w-full">Cancel this sleep (tapped by mistake)</button>}
    </Sheet>
  );
}
