"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { gold } from "@/lib/economy";
import { toDay, today, useApp, useCustomItems, type CustomItem } from "@/lib/store";

export type ListKind = "todo" | "plan" | "goals" | "readlist" | "watchlist" | "bucket" | "morning" | "night";

export const LISTS: Record<ListKind, { name: string; icon: string; desc: string; placeholder: string }> = {
  todo: { name: "To-do quests", icon: "📋", desc: "Tasks with priority. Finishing one is a good deed.", placeholder: "Submit assignment" },
  plan: { name: "Plan tomorrow", icon: "🗓️", desc: "Pick tomorrow's 3 most important tasks tonight. Tomorrow they wait for you here.", placeholder: "Revise chapter 4" },
  goals: { name: "Big goals", icon: "🏔️", desc: "Long-term goals with a deadline and progress.", placeholder: "Score 90% in finals" },
  readlist: { name: "Reading list", icon: "📚", desc: "Books to read, with page progress.", placeholder: "Rich Dad Poor Dad" },
  watchlist: { name: "Watchlist (earn it)", icon: "🎬", desc: "Shows and anime you want to watch. Each watch costs 60 gold, so you earn it first.", placeholder: "Solo Leveling S2" },
  bucket: { name: "Bucket list", icon: "🌠", desc: "Dreams for your life. Tick them off one day.", placeholder: "See Mount Everest base camp" },
  morning: { name: "Morning routine", icon: "🌅", desc: "Your morning checklist. It resets every day.", placeholder: "Make bed" },
  night: { name: "Night routine", icon: "🌙", desc: "Your wind-down checklist. It resets every day.", placeholder: "Phone away" },
};

const DEFAULTS: Partial<Record<ListKind, string[]>> = {
  morning: ["Drink a glass of water", "Make bed", "Brush teeth", "5 min stretch", "Plan the day"],
  night: ["Brush teeth", "Pack bag for tomorrow", "Plan tomorrow", "Phone away from bed", "Read 10 minutes"],
};

const PRI = [["high", "🔴 High"], ["mid", "🟡 Medium"], ["low", "🟢 Low"]] as const;

export function ListSheet({ kind, onClose }: { kind: ListKind; onClose: () => void }) {
  const meta = LISTS[kind];
  const { data, logActivity, celebrate } = useApp();
  const { items, add, update, remove } = useCustomItems(`list:${kind}`);
  const [name, setName] = useState("");
  const [pri, setPri] = useState<string>("mid");
  const [extra, setExtra] = useState("");
  const day = today();
  const tomorrow = toDay(new Date(Date.now() + 86_400_000));
  const isRoutine = kind === "morning" || kind === "night";
  const doneToday = useMemo(() => new Set(data.logs.filter((l) => l.kind === "routine" && l.day === day && l.data.list === kind).map((l) => String(l.data.item))), [data.logs, day, kind]);

  const create = () => {
    const n = name.trim();
    if (!n) return;
    const config: Record<string, unknown> = { done: false, created: new Date().toISOString() };
    if (kind === "todo") config.priority = pri;
    if (kind === "plan") config.for = tomorrow;
    if (kind === "goals") { config.progress = 0; config.deadline = extra || null; }
    if (kind === "readlist") { config.total = Number(extra) || null; config.page = 0; }
    add(n, config);
    setName(""); setExtra("");
  };
  const complete = (i: CustomItem, list: string, xp = 10) => {
    update(i.id, { config: { ...i.config, done: true, doneAt: new Date().toISOString() } });
    logActivity("task", { name: i.name, list }, new Date(), xp);
    celebrate({ title: "QUEST CLEARED!", subtitle: `✅ ${i.name}`, xp });
  };

  let shown = items;
  if (kind === "plan") shown = items.filter((i) => !i.config.done && String(i.config.for) >= day || (i.config.done && toDay(new Date(String(i.config.doneAt))) === day));
  if (kind === "todo") shown = [...items].sort((a, b) => Number(!!a.config.done) - Number(!!b.config.done) || PRI.findIndex((p) => p[0] === a.config.priority) - PRI.findIndex((p) => p[0] === b.config.priority));

  return (
    <Sheet title={`${meta.icon} ${meta.name}`} onClose={onClose}>
      <p className="text-sm text-muted">{meta.desc}</p>
      {kind === "watchlist" && <p className="text-xs gold-text">🪙 You have {gold(data)} gold.</p>}
      <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-2">
        <div className="flex gap-2">
          <input className="input" placeholder={meta.placeholder} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary">Add</button>
        </div>
        {kind === "todo" && <div className="flex gap-2">{PRI.map(([v, l]) => <button type="button" key={v} onClick={() => setPri(v)} className={`chip ${pri === v ? "chip-on" : ""}`}>{l}</button>)}</div>}
        {kind === "goals" && <label className="text-xs text-muted">Deadline (optional)<input type="date" className="input mt-1" value={extra} onChange={(e) => setExtra(e.target.value)} /></label>}
        {kind === "readlist" && <input className="input" inputMode="numeric" placeholder="Total pages (optional)" value={extra} onChange={(e) => setExtra(e.target.value)} />}
      </form>
      {isRoutine && items.length === 0 && (
        <button className="btn-ghost w-full text-sm" onClick={() => DEFAULTS[kind]!.forEach((d) => add(d, {}))}>Add a recommended {kind} routine</button>
      )}
      {kind === "plan" && <p className="text-xs text-muted">New tasks are planned for tomorrow ({new Date(`${tomorrow}T12:00`).toLocaleDateString(undefined, { weekday: "long" })}).</p>}
      {isRoutine && items.length > 0 && (
        <div className="text-xs text-muted">{doneToday.size}/{items.length} done today
          <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent2)]" style={{ width: `${(doneToday.size / items.length) * 100}%` }} /></div>
        </div>
      )}
      <ul className="space-y-2">
        {shown.map((i) => {
          const done = isRoutine ? doneToday.has(i.id) : !!i.config.done;
          return (
            <li key={i.id} className={`rounded-xl bg-white/5 p-3 ${done ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <button aria-label="Done" disabled={done && !isRoutine}
                  onClick={() => {
                    if (isRoutine) {
                      if (done) return;
                      logActivity("routine", { name: i.name, list: kind, item: i.id }, new Date(), 5);
                      if (doneToday.size + 1 === items.length) celebrate({ title: `${kind === "morning" ? "🌅 MORNING" : "🌙 NIGHT"} ROUTINE COMPLETE`, big: true, xp: 5, quote: "Routines are how heroes win the day before it starts." });
                    } else if (kind === "watchlist") {
                      if (gold(data) < 60) return celebrate({ title: "NOT ENOUGH GOLD", subtitle: "Finish missions to earn 60 gold first." });
                      update(i.id, { config: { ...i.config, done: true, doneAt: new Date().toISOString() } });
                      logActivity("redeem", { name: `Watch: ${i.name}`, cost: 60, emoji: "🎬" }, new Date(), 0);
                      celebrate({ title: "REWARD UNLOCKED", subtitle: `🎬 Enjoy ${i.name}! Earned, so no devil points.` });
                    } else complete(i, meta.name, kind === "plan" ? 15 : kind === "bucket" ? 50 : 10);
                  }}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 ${done ? "border-[var(--accent2)] bg-[var(--accent2)] text-[#0b0420]" : "border-white/30"}`}>{done ? "✓" : ""}</button>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${done ? "line-through" : ""}`}>{i.name}</div>
                  <div className="text-[11px] text-muted">
                    {kind === "todo" && PRI.find((p) => p[0] === i.config.priority)?.[1]}
                    {kind === "plan" && (String(i.config.for) === day ? "For today" : "For tomorrow")}
                    {kind === "goals" && `${i.config.progress ?? 0}%${i.config.deadline ? ` · by ${i.config.deadline}` : ""}`}
                    {kind === "readlist" && `Page ${i.config.page ?? 0}${i.config.total ? ` of ${i.config.total}` : ""}`}
                    {kind === "watchlist" && (done ? "Watched" : "Costs 60 gold")}
                  </div>
                </div>
                <button aria-label="Delete" onClick={() => remove(i.id)} className="text-muted text-sm px-1">✕</button>
              </div>
              {kind === "goals" && !done && (
                <input type="range" min={0} max={100} step={5} value={Number(i.config.progress ?? 0)} className="w-full mt-2 accent-[var(--accent2)]"
                  onChange={(e) => update(i.id, { config: { ...i.config, progress: Number(e.target.value) } })}
                  onPointerUp={(e) => {
                    const p = Number((e.target as HTMLInputElement).value);
                    logActivity("goalstep", { name: i.name, progress: p }, new Date(), 10);
                    if (p >= 100) complete(i, "Goal", 100);
                  }} />
              )}
              {kind === "readlist" && !done && (
                <div className="mt-2 flex gap-2">
                  {[5, 10, 20, 50].map((pg) => (
                    <button key={pg} className="chip" onClick={() => {
                      const page = Number(i.config.page ?? 0) + pg;
                      const finished = !!i.config.total && page >= Number(i.config.total);
                      update(i.id, { config: { ...i.config, page, ...(finished ? { done: true, doneAt: new Date().toISOString() } : {}) } });
                      logActivity("pages", { name: i.name, pages: pg }, new Date(), 10);
                      celebrate(finished ? { title: "BOOK FINISHED!", subtitle: `📚 ${i.name}`, big: true, xp: 10 } : { title: `+${pg} PAGES`, subtitle: `😇 ${i.name}`, xp: 10 });
                    }}>+{pg} pages</button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
