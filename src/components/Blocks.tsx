"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DrinkSheet } from "@/components/Drinks";
import { MealSheet } from "@/components/Meals";
import { TaskLog } from "@/components/TaskLog";
import { SleepSheet, WakeSheet } from "@/components/WakeSleep";
import { askDetails } from "@/components/Details";
import { WidgetBlock } from "@/components/hub/Widgets";
import { emojiFor } from "@/lib/emoji";
import { arrange, onScreen, PAGE_SECTIONS, QUICK_DEFAULT, quickChoices, type Block, type MiniSlot, type SlotAction } from "@/lib/layout";
import { today, useApp } from "@/lib/store";
import { StatsButton } from "@/components/Review";
import { BLOCK_METRIC } from "@/lib/review";

// ---------- Running a mini-slot ----------
// Some slots log at once; others open a sheet, which <SlotHost/> (in the app
// layout) shows, so a slot works the same on every page.
type Open = { kind: "meal"; name?: string } | { kind: "drink"; cat?: "water" | "milk" } | { kind: "anything" } | { kind: "wake" } | { kind: "sleep" } | null;
export const openSlotSheet = (o: Exclude<Open, null>) => window.dispatchEvent(new CustomEvent("lifeos-slot", { detail: o }));

export function useRunSlot() {
  const { data } = useApp();
  const router = useRouter();
  return useCallback((a: SlotAction) => {
    switch (a.type) {
      case "page": router.push(a.href); return;
      case "url": window.open(a.url, "_blank", "noopener"); return;
      // Water and milk ask what, how much and when, like any drink.
      case "water": openSlotSheet({ kind: "drink", cat: "water" }); return;
      case "milk": openSlotSheet({ kind: "drink", cat: "milk" }); return;
      case "log": {
        // Doing the same thing twice in a day logs it, but XP only comes once.
        const again = data.logs.some((l) => l.day === today() && l.kind === "activity" && String(l.data.name) === a.name);
        askDetails({ title: a.name, icon: emojiFor(a.name), kind: "activity", data: { name: a.name, emoji: emojiFor(a.name) }, ask: "minutes", xp: again ? 0 : undefined });
        return;
      }
      case "wake": openSlotSheet({ kind: "wake" }); return;
      case "sleep": openSlotSheet({ kind: "sleep" }); return;
      case "meal": openSlotSheet({ kind: "meal", name: a.name || undefined }); return;
      case "photo": openSlotSheet({ kind: "meal" }); return;
      case "drink": openSlotSheet({ kind: "drink" }); return;
      case "anything": openSlotSheet({ kind: "anything" }); return;
    }
  }, [data.logs, router]);
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
  if (open.kind === "drink") return <DrinkSheet onClose={close} cat={open.cat} />;
  if (open.kind === "wake") return <WakeSheet onClose={close} />;
  if (open.kind === "sleep") return <SleepSheet onClose={close} />;
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
  const { data, deleteLog } = useApp();
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
  if (b.kind === "widget") return <WidgetBlock b={b} />;
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
              <li key={n}><button onClick={() => { if (l) deleteLog(l.id); else askDetails({ title: n, icon: emojiFor(n), kind: "activity", data: { name: n, emoji: emojiFor(n) }, ask: "minutes" }); }}
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
          <button aria-label="One more" onClick={() => askDetails({ title: b.title, icon: b.icon, kind: "counter", data: { name: b.title, block: b.id, unit: b.unit, emoji: b.icon }, ask: "count", unit: b.unit, start: 1 })} className="h-12 w-12 rounded-full bg-[var(--accent)] text-xl">＋</button>
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
  const { profile, saveSettings } = useApp();
  const ui = profile.settings.ui;
  const [shown, setShown] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const list = arrange(ui, page).filter(({ id, own }) => own || parts[id]);
  const label = (id: string) => PAGE_SECTIONS[page]?.find(([x]) => x === id)?.[1] ?? id;
  // Blocks with a matching chart get a small 📊 on their top edge (30-day chart).
  const render = (id: string, own?: Block) => {
    if (own) return <OwnBlock key={id} b={own} />;
    const metric = BLOCK_METRIC[`${page}:${id}`];
    return metric
      ? <div key={id} className="relative">{parts[id]}<StatsButton metric={metric} className="absolute -top-2.5 right-3 z-10" /></div>
      : <div key={id} className="contents">{parts[id]}</div>;
  };
  const main = list.filter(({ id, own }) => onScreen(ui, page, id, !!own));
  const more = list.filter(({ id, own }) => !onScreen(ui, page, id, !!own));
  // Move a block between the screen and "More" (saved, so every device matches).
  const place = (id: string, keep: boolean) => {
    const pages = { ...(ui?.pages ?? {}) };
    const p = { ...(pages[page] ?? {}) };
    p.open = keep ? [...new Set([...(p.open ?? []), id])] : (p.open ?? []).filter((x) => x !== id);
    p.tuck = keep ? (p.tuck ?? []).filter((x) => x !== id) : [...new Set([...(p.tuck ?? []), id])];
    pages[page] = p;
    saveSettings({ ui: { ...ui, pages } });
    if (keep && shown === id) setShown(null);
  };
  return (
    <>
      {main.map(({ id, own }) => render(id, own))}
      {(more.length > 0 || edit) && (
        <section className="card p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title">📂 More here</h2>
            <button onClick={() => setEdit(!edit)} className="text-[11px] text-muted">{edit ? "Done" : "✏️ Arrange"}</button>
          </div>
          {edit ? (
            <ul className="space-y-1">
              {list.filter(({ own }) => !own).map(({ id }) => {
                const on = onScreen(ui, page, id, false);
                return (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{label(id)}</span>
                    <button onClick={() => place(id, !on)} className={`chip !py-0.5 text-[11px] ${on ? "chip-on" : ""}`}>{on ? "On screen" : "In More"}</button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {more.map(({ id }) => (
                <button key={id} onClick={() => setShown(shown === id ? null : id)} className={`chip !py-1 text-xs ${shown === id ? "chip-on" : ""}`}>{label(id)}</button>
              ))}
            </div>
          )}
        </section>
      )}
      {shown && more.some((m) => m.id === shown) && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1 px-1">
            <button onClick={() => place(shown, true)}>📌 Keep on screen</button>
            <button onClick={() => setShown(null)}>✕ Close</button>
          </div>
          {render(shown, more.find((m) => m.id === shown)?.own)}
        </div>
      )}
    </>
  );
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
