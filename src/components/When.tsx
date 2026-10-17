"use client";

import { dtLocal } from "@/components/Sheet";

const AGO: [string, number][] = [["Now", 0], ["5 min ago", 5], ["15 min ago", 15], ["30 min ago", 30], ["40 min ago", 40], ["1 h ago", 60], ["2 h ago", 120]];

// Date and time picker used everywhere: quick "x min ago" chips plus a
// calendar date and a clock time. Value is a local "YYYY-MM-DDTHH:mm" string.
export function WhenPicker({ label = "When", value, onChange, quick = true, future = false }: {
  label?: string; value: string; onChange: (v: string) => void; quick?: boolean; future?: boolean;
}) {
  const [date, time] = (value || dtLocal(new Date())).split("T");
  const d = new Date(value);
  const set = (min: number) => onChange(dtLocal(new Date(Date.now() + (future ? min : -min) * 60_000)));
  const diff = Math.round((Date.now() - d.getTime()) / 60_000);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <b className="text-[var(--accent2)]">
          {Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          {Math.abs(diff) >= 1 && Math.abs(diff) < 600 ? <span className="text-muted font-normal"> · {Math.abs(diff) >= 60 ? `${Math.floor(Math.abs(diff) / 60)} h ${Math.abs(diff) % 60} min` : `${Math.abs(diff)} min`} {diff > 0 ? "ago" : "from now"}</span> : null}
        </b>
      </div>
      {quick && (
        <div className="flex flex-wrap gap-1.5">
          {AGO.map(([l, m]) => <button type="button" key={l} onClick={() => set(m)} className={`chip !py-1 text-xs ${Math.abs(diff - (future ? -m : m)) <= 1 ? "chip-on" : ""}`}>{future && m ? l.replace("ago", "from now") : l}</button>)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input type="date" aria-label={`${label} date`} className="input" value={date} onChange={(e) => e.target.value && onChange(`${e.target.value}T${time}`)} />
        <input type="time" aria-label={`${label} time`} className="input" value={time} onChange={(e) => e.target.value && onChange(`${date}T${e.target.value}`)} />
      </div>
    </div>
  );
}
