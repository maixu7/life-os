"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";

// "▶ Start now" next to every log button: the task is set up now and
// recorded when you tick Complete.
export function StartButton({ onClick, disabled, label = "▶ Start now, tick Complete later" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  const { startNext } = useApp();
  return (
    <button type="button" disabled={disabled} onClick={() => { startNext(); onClick(); }} className="btn-ghost w-full border border-[var(--accent2)]/50 text-sm disabled:opacity-40">{label}</button>
  );
}

const since = (iso: string, now: number) => {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

function DoingList() {
  const { doing, completeDoing, cancelDoing } = useApp();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  if (!doing.length) return <p className="text-sm text-muted">Nothing in progress. Press ▶ Start on any task, exercise, meal, drink, book or game to start it here.</p>;
  return (
    <div className="space-y-2">
      {doing.map((d) => {
        const c = d.config as { kind: string; started: string; emoji?: string | null; data: Record<string, unknown> };
        const info = [c.data.sets && c.data.reps ? `${c.data.sets} × ${c.data.reps}${c.data.weight ? ` @ ${c.data.weight} kg` : ""}` : "", c.data.minutes ? `plan ${c.data.minutes} min` : "", c.data.ml ? `${c.data.ml} ml` : ""].filter(Boolean).join(" · ");
        return (
          <div key={d.id} className="rounded-xl bg-white/5 p-3 flex items-center gap-2">
            <span className="text-2xl">{c.emoji || "⏱️"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold break-words">{d.name}</div>
              <div className="text-xs text-muted">Started {since(c.started, now)} ago{info ? ` · ${info}` : ""}</div>
            </div>
            <button onClick={() => cancelDoing(d.id)} aria-label={`Cancel ${d.name}`} className="text-muted px-1">✕</button>
            <button onClick={() => completeDoing(d.id)} className="btn-primary !px-3 !py-2 text-xs">✓ Complete</button>
          </div>
        );
      })}
    </div>
  );
}

// A pill on every screen while something is in progress.
export function DoingTray() {
  const { doing } = useApp();
  const [open, setOpen] = useState(false);
  if (!doing.length && !open) return null;
  return (
    <>
      {doing.length > 0 && (
        <button onClick={() => setOpen(true)} className="fixed left-3 bottom-24 z-[35] rounded-full bg-[var(--accent2)] text-[#0b0420] font-bold text-xs px-3 py-2 shadow-lg">
          ⏱ {doing.length} in progress · tap to complete
        </button>
      )}
      {open && <Sheet title="⏱ In progress" onClose={() => setOpen(false)}><DoingList /></Sheet>}
    </>
  );
}

export function DoingCard() {
  const { doing } = useApp();
  if (!doing.length) return null;
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-2">⏱ In progress</h2>
      <DoingList />
    </section>
  );
}
