"use client";

import { useState } from "react";
import { alarmPrefs, ring, saveAlarmPrefs, stopRing, TONES, type AlarmPrefs } from "@/lib/alarm";

// Sound, loudness, how long it rings, snooze, and schedule alarms.
export function AlarmSettings() {
  const [p, setP] = useState<AlarmPrefs>(() => alarmPrefs());
  const [testing, setTesting] = useState(false);
  const set = (x: Partial<AlarmPrefs>) => { const n = { ...p, ...x }; setP(n); saveAlarmPrefs(x); };
  const test = () => {
    if (testing) { stopRing(); setTesting(false); return; }
    setTesting(true);
    ring({ ...p, rounds: 4 });
    setTimeout(() => setTesting(false), 6000);
  };
  return (
    <div className="rounded-xl bg-white/5 p-3 space-y-2 text-sm">
      <div className="font-semibold">⏰ Alarm sound</div>
      <div className="flex flex-wrap gap-1.5">
        {TONES.map(([t, l]) => <button key={t} onClick={() => set({ tone: t })} className={`chip !py-1 text-xs ${p.tone === t ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <label className="block text-xs text-muted">Loudness {Math.round(p.volume * 100)}%
        <input type="range" min={0.3} max={1} step={0.05} value={p.volume} onChange={(e) => set({ volume: Number(e.target.value) })} className="w-full" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Keeps ringing for
          <select className="input mt-1" value={p.maxMin} onChange={(e) => set({ maxMin: Number(e.target.value) })}>
            {[1, 3, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min (until I stop it)</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">Snooze
          <select className="input mt-1" value={p.snoozeMin} onChange={(e) => set({ snoozeMin: Number(e.target.value) })}>
            {[1, 3, 5, 10, 15].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
      </div>
      {([["vibrate", "📳 Vibrate with the alarm"], ["wake", "🌅 Wake-up alarm at my wake time"], ["bed", "😴 Bedtime alarm at my bed time"], ["phase", "🔔 Short ring when study, work or break time starts"]] as const).map(([k, l]) => (
        <label key={k} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!p[k]} onChange={(e) => set({ [k]: e.target.checked })} />{l}</label>
      ))}
      <button onClick={test} className="btn-ghost w-full !py-1.5 text-sm">{testing ? "■ Stop test" : "▶ Test alarm"}</button>
      <p className="text-[10px] text-muted">Alarms ring while Life OS is open (even in the background tab). When the app is fully closed, phones only show a notification, so keep it open for important alarms. Turn your phone volume up and silent mode off.</p>
    </div>
  );
}
