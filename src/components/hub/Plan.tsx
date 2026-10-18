"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { openSlotSheet, useRunSlot } from "@/components/Blocks";
import { askDetails } from "@/components/Details";
import { openHub } from "@/components/hub/registry";
import { surprise, type Surprise } from "@/lib/hub";
import { today, useApp, useCustomItems, type CustomItem } from "@/lib/store";

// ---------- 72 Morning routine: wake → water → stretch → plan, in order ----------
// Uses the same "Morning routine" list as Tools, and the same ticks.
const MORNING_DEFAULT = ["Drink a glass of water", "Brush teeth", "5 min stretch", "Plan the day"];
function useMorning() {
  const { data } = useApp();
  const list = useCustomItems("list:morning");
  const day = today();
  const woke = data.logs.some((l) => l.day === day && l.kind === "wake");
  const done = new Set(data.logs.filter((l) => l.kind === "routine" && l.day === day && l.data.list === "morning").map((l) => String(l.data.item)));
  const steps = list.items;
  const next = steps.find((s) => !done.has(s.id));
  const finished = woke && steps.length > 0 && !next;
  return { ...list, woke, done, steps, next, finished, day };
}
export function MorningSheet({ onClose }: { onClose: () => void }) {
  const m = useMorning();
  const { logActivity, celebrate } = useApp();
  const run = useRunSlot();
  const tick = (s: CustomItem) => askDetails({
    title: s.name, icon: "🌅", kind: "routine", data: { name: s.name, list: "morning", item: s.id }, xp: 5, ask: "minutes",
    after: () => {
      const last = m.steps.filter((x) => !m.done.has(x.id) && x.id !== s.id).length === 0;
      if (last) {
        const r = logActivity("routine", { name: "All steps in order", list: "morning-all", item: "all" }, new Date(), 20);
        celebrate({ title: "MORNING ROUTINE CLEAR!", subtitle: "Every step, in order. The day is yours.", xp: r.xp + 5, big: true, icon: "🌅" });
      }
      // Linked steps: the water step asks what and how much you drank.
      if (/water/i.test(s.name)) { onClose(); openSlotSheet({ kind: "drink", cat: "water" }); }
      if (/plan/i.test(s.name)) { onClose(); openHub("planner"); }
    },
  });
  return (
    <Sheet title="🌅 Morning routine" onClose={onClose}>
      <p className="text-sm text-muted">Do the steps in order. Each one unlocks the next.</p>
      <ol className="space-y-2">
        <li className={`rounded-xl p-3 flex items-center gap-3 ${m.woke ? "bg-emerald-500/15" : "bg-[var(--accent2)]/15 border border-[var(--accent2)]/50"}`}>
          <span className="text-xl">{m.woke ? "✅" : "1"}</span><span className="flex-1">🌅 Wake up (logged)</span>
          {!m.woke && <button className="btn-primary !py-1.5 text-sm" onClick={() => run({ type: "wake" })}>I&apos;m up</button>}
        </li>
        {m.steps.map((s, i) => {
          const ok = m.done.has(s.id);
          const isNext = m.woke && m.next?.id === s.id;
          return (
            <li key={s.id} className={`rounded-xl p-3 flex items-center gap-3 ${ok ? "bg-emerald-500/15" : isNext ? "bg-[var(--accent2)]/15 border border-[var(--accent2)]/50" : "bg-white/5 opacity-60"}`}>
              <span className="text-xl w-6 text-center">{ok ? "✅" : i + 2}</span>
              <span className={`flex-1 ${ok ? "line-through text-muted" : ""}`}>{s.name}</span>
              {isNext && <button className="btn-primary !py-1.5 text-sm" onClick={() => tick(s)}>Done</button>}
              {!ok && !isNext && <span className="text-xs">🔒</span>}
            </li>
          );
        })}
      </ol>
      {m.steps.length === 0 && <button className="btn-ghost w-full" onClick={() => MORNING_DEFAULT.forEach((n) => m.add(n, {}))}>Add the recommended steps (water, teeth, stretch, plan)</button>}
      {m.finished && <p className="text-center text-sm">🏆 Routine cleared today.</p>}
      <p className="text-[11px] text-muted">Change the steps in Tools → Morning routine. The water step also logs 250 ml; the plan step opens the day planner.</p>
    </Sheet>
  );
}
// Base Camp card: shows from wake-up until the routine is done (before noon).
export function MorningCard() {
  const m = useMorning();
  if (m.finished || new Date().getHours() >= 12 || !m.steps.length) return null;
  const n = m.steps.filter((s) => m.done.has(s.id)).length + (m.woke ? 1 : 0);
  return (
    <button onClick={() => openHub("morning")} className="card frame w-full p-3 mb-4 flex items-center gap-3 text-left bg-gradient-to-r from-amber-400/15 to-transparent">
      <span className="text-3xl">🌅</span>
      <span className="flex-1 min-w-0"><span className="block font-game text-sm font-bold">Morning routine</span>
        <span className="block text-xs text-muted truncate">{m.woke ? `Next: ${m.next?.name}` : "Start by logging your wake-up"}</span>
        <span className="mt-1 block h-1.5 rounded-full bg-white/10"><span className="block h-full rounded-full bg-amber-300" style={{ width: `${(n / (m.steps.length + 1)) * 100}%` }} /></span>
      </span>
      <span className="font-game text-sm text-amber-300">{n}/{m.steps.length + 1}</span>
    </button>
  );
}

// ---------- 73 Brain dump: every line becomes a task ----------
export function BrainDumpSheet({ onClose }: { onClose: () => void }) {
  const { add } = useCustomItems("list:todo");
  const { celebrate } = useApp();
  const [text, setText] = useState("");
  const lines = useMemo(() => text.split(/\n|;|•/).map((x) => x.replace(/^[-*\d.)\s]+/, "").trim()).filter((x) => x.length > 1), [text]);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const save = () => {
    const keep = lines.filter((_, i) => !skip.has(i));
    keep.forEach((l) => {
      const high = /^!|urgent|asap|today|exam|deadline/i.test(l);
      add(l.replace(/^!+\s*/, ""), { done: false, priority: high ? "high" : "mid", created: new Date().toISOString(), from: "dump" });
    });
    celebrate({ title: "MIND CLEARED", subtitle: `${keep.length} task${keep.length === 1 ? "" : "s"} saved to your To-do quests`, kind: "small", icon: "🧠" });
    onClose();
  };
  return (
    <Sheet title="🧠 Brain dump" onClose={onClose}>
      <p className="text-sm text-muted">Type everything on your mind, one thing per line. Don&apos;t sort it. Start a line with ! if it&apos;s urgent.</p>
      <textarea autoFocus className="input min-h-36 text-sm" placeholder={"buy shampoo\n!finish maths homework\ncall mom\nreturn library book"} value={text} onChange={(e) => { setText(e.target.value); setSkip(new Set()); }} />
      {lines.length > 0 && (
        <ul className="space-y-1">
          {lines.map((l, i) => (
            <li key={i}><button onClick={() => setSkip((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="w-full flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm text-left">
              <span>{skip.has(i) ? "⬜" : "☑️"}</span><span className={skip.has(i) ? "line-through text-muted" : ""}>{l}</span>
            </button></li>
          ))}
        </ul>
      )}
      <button disabled={!lines.length} onClick={save} className="btn-primary w-full">Turn {lines.length - skip.size || ""} lines into tasks</button>
      <button onClick={() => { onClose(); openHub("planner"); }} className="text-xs text-muted w-full">Then place them in today&apos;s hours → Day planner</button>
    </Sheet>
  );
}

// ---------- 68 Day planner: tap a task, then tap an hour ----------
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6:00 .. 24:00
export function PlannerSheet({ onClose }: { onClose: () => void }) {
  const { items, add, update } = useCustomItems("list:todo");
  const day = today();
  const [pick, setPick] = useState<string | null>(null);
  const [name, setName] = useState("");
  const open = items.filter((i) => !i.config.done || (i.config.plan_day === day));
  const placed = (h: number) => open.filter((i) => i.config.plan_day === day && Number(i.config.plan_hour) === h);
  const loose = open.filter((i) => !i.config.done && i.config.plan_day !== day);
  const nowH = new Date().getHours();
  const place = (h: number) => {
    if (!pick) return;
    const it = items.find((i) => i.id === pick);
    if (it) update(it.id, { config: { ...it.config, plan_day: day, plan_hour: h } });
    setPick(null);
  };
  const done = (i: CustomItem) => {
    askDetails({ title: i.name, icon: "✅", kind: "task", data: { name: i.name, list: "To-do" }, xp: 10, ask: "minutes",
      after: () => update(i.id, { config: { ...i.config, done: true, doneAt: new Date().toISOString() } }) });
  };
  return (
    <Sheet title="🗓️ Day planner" onClose={onClose}>
      <p className="text-xs text-muted">Tap a task, then tap an hour to put it there. Tasks come from your To-do quests.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { add(name.trim(), { done: false, priority: "mid", created: new Date().toISOString() }); setName(""); } }}>
        <input className="input" placeholder="New task" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn-primary">Add</button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {loose.map((i) => <button key={i.id} onClick={() => setPick(pick === i.id ? null : i.id)} className={`chip ${pick === i.id ? "chip-on" : ""}`}>{i.config.priority === "high" ? "🔴 " : ""}{i.name}</button>)}
        {!loose.length && <span className="text-xs text-muted">All tasks are placed. Add one above, or 🧠 brain dump.</span>}
      </div>
      <div className="rounded-xl border border-white/10 divide-y divide-white/5">
        {HOURS.map((h) => (
          <div key={h} onClick={() => place(h)} className={`flex gap-2 px-2 py-1.5 min-h-9 ${pick ? "cursor-pointer active:bg-[var(--accent2)]/20" : ""} ${h === nowH ? "bg-[var(--accent2)]/10" : ""} ${h < nowH ? "opacity-60" : ""}`}>
            <span className={`w-12 shrink-0 text-xs tabular-nums pt-1 ${h === nowH ? "text-[var(--accent2)] font-bold" : "text-muted"}`}>{String(h % 24).padStart(2, "0")}:00</span>
            <div className="flex-1 flex flex-wrap gap-1">
              {placed(h).map((i) => (
                <span key={i.id} className={`rounded-lg px-2 py-1 text-xs flex items-center gap-1.5 ${i.config.done ? "bg-emerald-500/20 line-through text-muted" : "bg-white/10"}`} onClick={(e) => e.stopPropagation()}>
                  {i.name}
                  {!i.config.done && <button aria-label="Done" onClick={() => done(i)}>✓</button>}
                  {!i.config.done && <button aria-label="Unplace" className="text-muted" onClick={() => { const { plan_day: _d, plan_hour: _h, ...rest } = i.config; void _d; void _h; update(i.id, { config: rest }); }}>✕</button>}
                </span>
              ))}
              {pick && !placed(h).length && <span className="text-[11px] text-muted pt-1">tap to place here</span>}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// ---------- 78 Surprise me ----------
export function SurpriseSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const router = useRouter();
  const [s, setS] = useState<Surprise | null>(null);
  const roll = (k: Surprise["kind"]) => setS(surprise(k, data));
  const go = () => {
    if (!s) return;
    onClose();
    if (s.kind === "meal") openSlotSheet({ kind: "meal" });
    else if (s.kind === "workout") router.push("/train");
    else router.push(`/focus?subject=${encodeURIComponent(s.text.split(/[:(]/)[0].trim())}&start=1`);
  };
  return (
    <Sheet title="🎲 Surprise me" onClose={onClose}>
      <p className="text-sm text-muted">Can&apos;t decide? Let the dice pick something healthy.</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => roll("meal")} className="btn-ghost py-3"><div className="text-2xl">🍱</div><div className="text-xs">Meal</div></button>
        <button onClick={() => roll("workout")} className="btn-ghost py-3"><div className="text-2xl">⚔️</div><div className="text-xs">Workout</div></button>
        <button onClick={() => roll("study")} className="btn-ghost py-3"><div className="text-2xl">📖</div><div className="text-xs">Study topic</div></button>
      </div>
      {s && (
        <div className="card frame p-4 text-center animate-pop">
          <div className="text-4xl">{s.icon}</div>
          <div className="mt-1 font-game font-bold">{s.text}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => roll(s.kind)} className="btn-ghost">🎲 Again</button>
            <button onClick={go} className="btn-primary">{s.kind === "meal" ? "Log meal" : s.kind === "workout" ? "Go train" : "Start focus"}</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
