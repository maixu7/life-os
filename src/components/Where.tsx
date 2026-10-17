"use client";

import { useState } from "react";

export const PLACES = ["🏠 Home", "🏫 School / College", "📚 Library", "🚌 Travel", "🏋️ Gym", "🌳 Outside", "💼 Work", "☕ Café"];

// "Where did this happen?" chips with a free-text option.
export function WherePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(!!value && !PLACES.includes(value));
  return (
    <div>
      <div className="text-xs text-muted mb-1">Where</div>
      <div className="flex flex-wrap gap-1.5">
        {PLACES.map((p) => (
          <button type="button" key={p} onClick={() => { setCustom(false); onChange(value === p ? "" : p); }} className={`chip !py-1 text-xs ${value === p ? "chip-on" : ""}`}>{p}</button>
        ))}
        <button type="button" onClick={() => { setCustom(true); onChange(""); }} className={`chip !py-1 text-xs ${custom ? "chip-on" : ""}`}>✏️ Other</button>
      </div>
      {custom && <input className="input mt-2" placeholder="e.g. Grandma's house" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
