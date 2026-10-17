"use client";

import { useState } from "react";
import { dtLocal, Sheet } from "@/components/Sheet";
import { emojiFor } from "@/lib/emoji";
import { logKarma } from "@/lib/karma";
import { autoOption, optionsFor, ordinal, slotOf, SLOT_ICON } from "@/lib/slots";
import { toDay, useApp, type CustomItem, type Log } from "@/lib/store";

const MINUTES = [5, 10, 15, 30, 45, 60, 90];

// Logging an activity with its details: which time of day, what kind, how long.
export function ActivitySheet({ item, at, onClose, onLogged }: { item: CustomItem; at: Date; onClose: () => void; onLogged: (l: Log) => void }) {
  const { data, logActivity, celebrate } = useApp();
  const [when, setWhen] = useState(dtLocal(at));
  const time = new Date(when);
  const opts = optionsFor(item.name);
  const [picked, setPicked] = useState<string[]>(() => { const a = autoOption(item.name, at); return a ? [a] : []; });
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const emoji = String(item.config.emoji ?? emojiFor(item.name));
  const day = toDay(time);
  const nth = data.logs.filter((l) => l.day === day && l.kind === "activity" && String(l.data.name).toLowerCase() === item.name.toLowerCase()).length + 1;
  const slot = slotOf(time);
  const toggle = (o: string) => setPicked(picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o]);

  const save = () => {
    const row = logActivity("activity", {
      name: item.name, emoji, alignment: item.config.alignment, options: picked.length ? picked : undefined,
      slot, count: nth, minutes: minutes ?? undefined, note: note || undefined,
    }, time);
    const k = logKarma(row);
    celebrate({ title: k < 0 ? "😈 THE DEVIL GRINS…" : `${item.name.toUpperCase()}!`, subtitle: `${SLOT_ICON[slot]} ${slot} · ${ordinal(nth)} time today`, xp: row.xp });
    onLogged(row);
    onClose();
  };

  return (
    <Sheet title={`${emoji} ${item.name}`} onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3 text-sm flex items-center gap-2">
        <span className="text-2xl">{SLOT_ICON[slot]}</span>
        <span>Auto-detected: <b>{slot}</b> · <b>{ordinal(nth)}</b> time today</span>
      </div>
      {opts.length > 0 && (
        <>
          <div className="text-xs text-muted">Details (pick one or more)</div>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => <button key={o} onClick={() => toggle(o)} className={`chip ${picked.includes(o) ? "chip-on" : ""}`}>{o}</button>)}
          </div>
        </>
      )}
      <div className="text-xs text-muted">How long</div>
      <div className="flex flex-wrap gap-2">
        {MINUTES.map((m) => <button key={m} onClick={() => setMinutes(minutes === m ? null : m)} className={`chip ${minutes === m ? "chip-on" : ""}`}>{m < 60 ? `${m} min` : `${m / 60} h`}</button>)}
      </div>
      <label className="text-xs text-muted">When<input type="datetime-local" className="input mt-1" value={when} onChange={(e) => e.target.value && setWhen(e.target.value)} /></label>
      <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button onClick={save} className="btn-primary w-full">Log {item.name}</button>
    </Sheet>
  );
}
