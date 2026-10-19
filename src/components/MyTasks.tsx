"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { AREAS, DAY_NAMES, dueOn, LEVELS, taskOf, targetOf, type Area, type Level, type MyTask } from "@/lib/mytasks";
import { useApp, useCustomItems, type CustomItem } from "@/lib/store";

// Make your own tasks: what, which days (or one date), what time, how hard.
// Sensei shows them like its own tasks, with the same popup and reminder.

const BLANK: MyTask & { name: string } = { name: "", area: "study", time: "19:00", days: [1, 2, 3, 4, 5], level: "normal" };

export function MyTaskSheet({ edit, onClose }: { edit?: CustomItem | null; onClose: () => void }) {
  const { add, update, remove } = useCustomItems("task");
  const [t, setT] = useState(() => (edit ? { name: edit.name, ...taskOf(edit) } : BLANK));
  const [once, setOnce] = useState(!!t.date);
  const set = (patch: Partial<typeof t>) => setT((x) => ({ ...x, ...patch }));
  const a = AREAS[t.area];
  const save = () => {
    if (!t.name.trim()) return;
    const config = { area: t.area, time: t.time, days: t.days, date: once ? t.date ?? "" : "", level: t.level, amount: t.amount ?? 0, note: t.note ?? "" };
    if (edit) update(edit.id, { name: t.name.trim(), config }); else add(t.name.trim(), config);
    onClose();
  };
  return (
    <Sheet title={edit ? "✏️ Edit my task" : "＋ New task"} onClose={onClose}>
      <label className="text-xs text-muted block">What<input className="input mt-1" placeholder="Study kanji, Drink 500 ml, Code 1 hour…" value={t.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <div>
        <div className="text-xs text-muted mb-1">Part of the app (the task opens it, and logs there tick it off)</div>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(AREAS) as Area[]).map((k) => <button key={k} onClick={() => set({ area: k })} className={`chip !py-0.5 text-xs ${t.area === k ? "chip-on" : ""}`}>{AREAS[k].icon} {AREAS[k].label}</button>)}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOnce(false)} className={`chip text-xs ${!once ? "chip-on" : ""}`}>🔁 Every week</button>
        <button onClick={() => setOnce(true)} className={`chip text-xs ${once ? "chip-on" : ""}`}>📅 One date</button>
      </div>
      {once ? <input type="date" className="input" value={t.date ?? ""} onChange={(e) => set({ date: e.target.value })} />
        : <div className="flex flex-wrap gap-1">{DAY_NAMES.map((n, d) => <button key={n} onClick={() => set({ days: t.days.includes(d) ? t.days.filter((x) => x !== d) : [...t.days, d].sort() })} className={`chip !px-2 !py-0.5 text-xs ${t.days.includes(d) ? "chip-on" : ""}`}>{n}</button>)}</div>}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">From (time)<input type="time" className="input mt-1" value={t.time} onChange={(e) => set({ time: e.target.value })} /></label>
        {a.unit && <label className="text-xs text-muted">How much ({a.unit})<input className="input mt-1" inputMode="numeric" placeholder="optional" value={t.amount ?? ""} onChange={(e) => set({ amount: Number(e.target.value) || undefined })} /></label>}
      </div>
      <div>
        <div className="text-xs text-muted mb-1">Difficulty {t.amount ? `(easy ×0.75, hard ×1.5; days off add more)` : ""}</div>
        <div className="flex gap-1">{(Object.keys(LEVELS) as Level[]).map((k) => <button key={k} onClick={() => set({ level: k })} className={`chip flex-1 text-xs ${t.level === k ? "chip-on" : ""}`}>{LEVELS[k].label}</button>)}</div>
      </div>
      <label className="text-xs text-muted block">Why (shown on the task)<input className="input mt-1" placeholder="optional" value={t.note ?? ""} onChange={(e) => set({ note: e.target.value })} /></label>
      <div className="flex gap-2">
        <button onClick={save} disabled={!t.name.trim() || (once && !t.date) || (!once && !t.days.length)} className="btn-primary flex-1 disabled:opacity-40">Save task</button>
        {edit && <button onClick={() => { remove(edit.id); onClose(); }} className="btn-ghost text-rose-300">Delete</button>}
      </div>
    </Sheet>
  );
}

export function MyTasksCard() {
  const { data } = useApp();
  const { items } = useCustomItems("task");
  const [open, setOpen] = useState<CustomItem | null | "new">(null);
  const now = new Date();
  return (
    <section className="card p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">📝 My tasks</h2>
        <button onClick={() => setOpen("new")} className="chip chip-on text-xs">＋ Add</button>
      </div>
      {items.length ? (
        <div className="space-y-1.5">
          {items.map((i) => {
            const t = taskOf(i), want = targetOf(t, data, now);
            return (
              <button key={i.id} onClick={() => setOpen(i)} className={`w-full text-left rounded-xl bg-white/5 p-2 flex items-center gap-2 ${dueOn(t, now) ? "" : "opacity-60"}`}>
                <span className="text-xl">{AREAS[t.area].icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">{i.name}{want ? ` · ${want} ${AREAS[t.area].unit}` : ""}</span>
                  <span className="block text-[11px] text-muted">{t.date ?? t.days.map((d) => DAY_NAMES[d]).join(" ")} · from {t.time} · {LEVELS[t.level].label}</span>
                </span>
                <span className="text-muted text-xs">Edit</span>
              </button>
            );
          })}
        </div>
      ) : <p className="text-xs text-muted">Add your own tasks for any day and time. They pop up like Sensei&apos;s tasks and tick off when you log them.</p>}
      {open && <MyTaskSheet edit={open === "new" ? null : open} onClose={() => setOpen(null)} />}
    </section>
  );
}
