"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp, type Log } from "@/lib/store";

// No XP for a bare tap: every quick button asks when, how long / how many,
// and lets you add a note, then logs. <DetailsHost/> (app layout) shows it.
export type Ask = "minutes" | "count" | "ml";
export type DetailsReq = {
  title: string; icon?: string; kind: string; data: Record<string, unknown>; xp?: number;
  ask: Ask; unit?: string; start?: number; // pre-filled amount, still editable
  after?: (row: Log) => void;
};
export const askDetails = (r: DetailsReq) => window.dispatchEvent(new CustomEvent("lifeos-details", { detail: r }));

const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const LABEL: Record<Ask, string> = { minutes: "How long? (minutes)", count: "How many?", ml: "How much? (ml)" };
const PRESETS: Record<Ask, number[]> = { minutes: [5, 10, 15, 30, 45, 60], count: [1, 2, 3, 5, 10], ml: [150, 200, 250, 350, 500] };

export function DetailsHost() {
  const [req, setReq] = useState<DetailsReq | null>(null);
  useEffect(() => {
    const go = (e: Event) => setReq((e as CustomEvent<DetailsReq>).detail);
    window.addEventListener("lifeos-details", go);
    return () => window.removeEventListener("lifeos-details", go);
  }, []);
  return req ? <DetailsSheet key={Date.now()} req={req} onClose={() => setReq(null)} /> : null;
}

function DetailsSheet({ req, onClose }: { req: DetailsReq; onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [time, setTime] = useState(hm(new Date()));
  const [amount, setAmount] = useState(req.start ? String(req.start) : "");
  const [note, setNote] = useState("");
  const n = Number(amount);
  const ok = n > 0 && /^\d{1,2}:\d{2}$/.test(time);
  const save = () => {
    if (!ok) return;
    const at = new Date(); const [h, m] = time.split(":").map(Number); at.setHours(h, m, 0, 0);
    if (at.getTime() > Date.now() + 60_000) at.setDate(at.getDate() - 1); // a late-night time picked after midnight
    const field = req.ask === "minutes" ? { minutes: n } : req.ask === "count" ? { n } : { ml: n };
    const row = logActivity(req.kind, { ...req.data, ...field, ...(note.trim() ? { note: note.trim() } : {}), at_time: time }, at, req.xp);
    celebrate({ title: "✓ LOGGED", subtitle: `${req.icon ?? ""} ${req.title} · ${n} ${req.ask === "minutes" ? "min" : req.ask === "ml" ? "ml" : req.unit || "times"} at ${time}`, xp: row.xp, kind: "small" });
    req.after?.(row);
    onClose();
  };
  return (
    <Sheet title={`${req.icon ?? "📝"} ${req.title}`} onClose={onClose}>
      <label className="flex items-center gap-2 text-sm">🕒 When? <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <div className="space-y-1.5">
        <div className="text-sm">{req.ask === "count" && req.unit ? `How many ${req.unit}?` : LABEL[req.ask]}</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS[req.ask].map((v) => <button key={v} onClick={() => setAmount(String(v))} className={`chip !py-0.5 text-xs ${n === v ? "chip-on" : ""}`}>{v}</button>)}
          <input className="input !w-20 !py-0.5 text-xs" inputMode="decimal" placeholder="other" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} aria-label="amount" />
        </div>
      </div>
      <input className="input" placeholder="Note (optional): what exactly, where, how it went" value={note} onChange={(e) => setNote(e.target.value)} />
      <button onClick={save} disabled={!ok} className="btn-primary w-full">Log it</button>
      {!ok && <p className="text-[11px] text-muted text-center">Fill in the time and how much to log it. No details, no XP.</p>}
    </Sheet>
  );
}
