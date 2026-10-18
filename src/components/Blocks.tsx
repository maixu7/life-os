"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DrinkSheet } from "@/components/Drinks";
import { MealSheet } from "@/components/Meals";
import { TaskLog } from "@/components/TaskLog";
import { emojiFor } from "@/lib/emoji";
import { arrange, PAGE_SECTIONS, QUICK_DEFAULT, quickChoices, type Block, type MiniSlot, type SlotAction } from "@/lib/layout";
import { today, useApp } from "@/lib/store";
import { StatsButton } from "@/components/Review";
import { BLOCK_METRIC } from "@/lib/review";

// ---------- Running a mini-slot ----------
// Some slots log at once; others open a sheet, which <SlotHost/> (in the app
// layout) shows, so a slot works the same on every page.
type Open = { kind: "meal"; name?: string } | { kind: "drink" } | { kind: "anything" } | null;
export const openSlotSheet = (o: Exclude<Open, null>) => window.dispatchEvent(new CustomEvent("lifeos-slot", { detail: o }));

export function useRunSlot() {
  const { data, logActivity, updateLog, celebrate } = useApp();
  const router = useRouter();
  return useCallback((a: SlotAction) => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    switch (a.type) {
      case "page": router.push(a.href); return;
      case "url": window.open(a.url, "_blank", "noopener"); return;
      case "water": { const ml = a.ml ?? 250; const r = logActivity("water", { ml }); celebrate({ title: "GULP!", subtitle: `+${ml} ml water`, xp: r.xp, kind: "small", icon: "💧" }); return; }
      case "milk": { const ml = a.ml ?? 250; const r = logActivity("milk", { ml }); celebrate({ title: "STRONG BONES!", subtitle: `+${ml} ml milk`, xp: r.xp, kind: "small", icon: "🥛" }); return; }
      case "log": { const r = logActivity("activity", { name: a.name, emoji: emojiFor(a.name) }); celebrate({ title: "✓ DONE", subtitle: a.name, xp: r.xp, kind: "small" }); return; }
      case "wake": {
        const open = [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
        if (open) updateLog(open.id, { data: { end: now.toISOString() } });
        const r = logActivity("wake", { time: hhmm, slept_from: open?.data.start ?? null });
        celebrate({ title: "OHAYO!", subtitle: `Woke up at ${hhmm}`, xp: r.xp, icon: "🌅" });
        return;
      }
      case "sleep": {
        const r = logActivity("sleep", { start: now.toISOString(), end: null, type: "night" });
        celebrate({ title: "OYASUMI!", subtitle: "Sleep started. Tap Woke up in the morning.", xp: r.xp, icon: "😴" });
        return;
      }
      case "meal": openSlotSheet({ kind: "meal", name: a.name || undefined }); return;
      case "photo": openSlotSheet({ kind: "meal" }); return;
      case "drink": openSlotSheet({ kind: "drink" }); return;
      case "anything": openSlotSheet({ kind: "anything" }); return;
    }
  }, [data.logs, logActivity, updateLog, celebrate, router]);
}

export function SlotHost() {
  const [open, setOpen] = useState<Open>(null);
  useEffect(() => {
    const go = (e: Event) => setOpen((e as CustomEvent<Open>).detail);
    window.addEventListener("lifeos-slot", go);
    return () => window.removeEventListener("lifeos-slot", go);
  }, []);
  if (!open) return null;
  const close = () => setOpen(null);
  if (open.kind === "meal") return <MealSheet meal={open.name} onClose={close} />;
  if (open.kind === "drink") return <DrinkSheet onClose={close} />;
  return <TaskLog onClose={close} />;
}

// ---------- A row of icon buttons ----------
export function SlotGrid({ slots, done }: { slots: MiniSlot[]; done?: (s: MiniSlot) => boolean }) {
  const run = useRunSlot();
  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map((s) => {
        const ok = done?.(s);
        const body = (
          <>
            <span className="text-2xl leading-none">{s.icon}</span>
            <span className="text-[10px] leading-tight text-center line-clamp-2">{s.label}</span>
            {ok && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 text-[9px] grid place-items-center">✓</span>}
          </>
        );
        const cls = `relative rounded-2xl border bg-white/[.04] p-1.5 flex flex-col items-center gap-1 active:scale-95 transition ${ok ? "border-emerald-400/60" : "border-white/10"}`;
        return s.action.type === "page"
          ? <Link key={s.id} href={s.action.href} className={cls}>{body}</Link>
          : <button key={s.id} onClick={() => run(s.action)} className={cls}>{body}</button>;
      })}
    </div>
  );
}

// The quick add icons at the top of Today and Food.
export function QuickBar() {
  const { profile, data } = useApp();
  const ui = profile.settings.ui;
  const ids = ui?.quick?.length ? ui.quick : QUICK_DEFAULT;
  const all = quickChoices(ui);
  const slots = ids.map((id) => all.find((q) => q.id === id)).filter((s): s is MiniSlot => !!s);
  const day = today();
  const todays = data.logs.filter((l) => l.day === day);
  const done = (s: MiniSlot) => (s.action.type === "water" ? todays.some((l) => l.kind === "water")
    : s.action.type === "milk" ? todays.some((l) => l.kind === "milk")
      : s.action.type === "wake" ? todays.some((l) => l.kind === "wake")
        : s.action.type === "log" ? todays.some((l) => l.kind === "activity" && String(l.data.name) === (s.action as { name: string }).name) : false);
  return (
    <section className="card p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">⚡ Quick add</h2>
        <Link href="/control?tab=quick" className="text-[11px] text-muted">🎛️ Edit</Link>
      </div>
      <SlotGrid slots={slots} done={done} />
    </section>
  );
}

// ---------- The hero's own blocks ----------
export function OwnBlock({ b }: { b: Block }) {
  const { data, logActivity, deleteLog, celebrate } = useApp();
  const day = today();
  const todays = data.logs.filter((l) => l.day === day);
  const head = (
    <div className="flex items-center justify-between mb-2">
      <h2 className="section-title">{b.icon} {b.title}</h2>
      <span className="flex items-center gap-2">
        {b.kind === "counter" && <StatsButton metric={`counter:${b.id}`} title={`${b.icon} ${b.title}`} />}
        {b.kind === "checklist" && !!b.items?.length && <StatsButton metric={`done:${b.items.join("|")}`} title={`${b.icon} ${b.title} (ticks)`} />}
        <Link href="/control?tab=pages" className="text-[11px] text-muted">🎛️</Link>
      </span>
    </div>
  );
  if (b.kind === "note") return <section className="card p-4 mb-4">{head}<p className="text-sm whitespace-pre-wrap">{b.text || <span className="text-muted">Empty note. Edit it in Control Centre.</span>}</p></section>;
  if (b.kind === "checklist") {
    const items = b.items ?? [];
    const hit = (n: string) => todays.find((l) => l.kind === "activity" && String(l.data.name).toLowerCase() === n.toLowerCase());
    return (
      <section className="card p-4 mb-4">{head}
        <ul className="space-y-1.5">
          {items.map((n) => {
            const l = hit(n);
            return (
              <li key={n}><button onClick={() => { if (l) deleteLog(l.id); else { const r = logActivity("activity", { name: n, emoji: emojiFor(n) }); celebrate({ title: "✓ DONE", subtitle: n, xp: r.xp, kind: "small" }); } }}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-left ${l ? "bg-emerald-500/15" : "bg-white/5"}`}>
                <span className={`h-5 w-5 rounded-md border grid place-items-center text-xs ${l ? "bg-emerald-500 border-emerald-400" : "border-white/30"}`}>{l ? "✓" : ""}</span>
                <span className={l ? "line-through text-muted" : ""}>{n}</span>
              </button></li>
            );
          })}
          {!items.length && <li className="text-xs text-muted">No items yet. Add them in Control Centre.</li>}
        </ul>
        <div className="text-[11px] text-muted mt-2">{items.filter(hit).length}/{items.length} done today · resets every day</div>
      </section>
    );
  }
  if (b.kind === "counter") {
    const mine = todays.filter((l) => l.kind === "counter" && l.data.block === b.id);
    const n = mine.reduce((s, l) => s + (Number(l.data.n) || 1), 0);
    const goal = b.goal ?? 0;
    return (
      <section className="card p-4 mb-4">{head}
        <div className="flex items-center gap-3">
          <button aria-label="One less" disabled={!mine.length} onClick={() => deleteLog(mine[mine.length - 1].id)} className="h-12 w-12 rounded-full bg-white/10 text-xl">−</button>
          <div className="flex-1 text-center"><div className="text-4xl font-black tabular-nums">{n}</div><div className="text-xs text-muted">{b.unit || "times"} today{goal ? ` · goal ${goal}` : ""}</div></div>
          <button aria-label="One more" onClick={() => logActivity("counter", { name: b.title, block: b.id, n: 1, unit: b.unit, emoji: b.icon })} className="h-12 w-12 rounded-full bg-[var(--accent)] text-xl">＋</button>
        </div>
        {goal > 0 && <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (n / goal) * 100)}%` }} /></div>}
      </section>
    );
  }
  return <section className="card p-4 mb-4">{head}{b.slots?.length ? <SlotGrid slots={b.slots} /> : <p className="text-xs text-muted">No buttons yet. Add mini-slots in Control Centre.</p>}</section>;
}

// ---------- A page made of blocks ----------
// Shows the page's built-in blocks and the hero's own blocks in the order set
// in Control Centre, leaving out hidden ones.
export function Blocks({ page, parts }: { page: string; parts: Record<string, React.ReactNode> }) {
  const { profile } = useApp();
  // Blocks with a matching chart get a small 📊 on their top edge (30-day chart).
  return <>{arrange(profile.settings.ui, page).map(({ id, own }) => {
    if (own) return <OwnBlock key={id} b={own} />;
    if (!parts[id]) return null;
    const metric = BLOCK_METRIC[`${page}:${id}`];
    return metric
      ? <div key={id} className="relative">{parts[id]}<StatsButton metric={metric} className="absolute -top-2.5 right-3 z-10" /></div>
      : <div key={id} className="contents">{parts[id]}</div>;
  })}</>;
}

// Own blocks for pages without a built-in block list: shown under the page.
export function PageExtras() {
  const path = usePathname();
  const { profile } = useApp();
  if (PAGE_SECTIONS[path] || path.startsWith("/custom/") || path === "/control") return null;
  const blocks = profile.settings.ui?.pages?.[path]?.blocks ?? [];
  if (!blocks.length) return null;
  return <div className="mt-4">{blocks.map((b) => <OwnBlock key={b.id} b={b} />)}</div>;
}
