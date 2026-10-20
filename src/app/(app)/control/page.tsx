"use client";

import { WIDGETS } from "@/components/hub/Widgets";
import Link from "next/link";
import { useEffect, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { MenuEditor } from "@/components/Customize";
import { openAutos, startEdit } from "@/components/EditLayer";
import { MealSlotSheet } from "@/components/Meals";
import { Sheet } from "@/components/Sheet";
import {
  allMealSlots, arrange, customHref, ICONS, PAGE_SECTIONS, QUICK_DEFAULT, quickChoices, uid,
  type Block, type BlockKind, type MealSlot, type MiniSlot, type PageLayout, type SlotAction,
} from "@/lib/layout";
import { allPages, tabOf, type Ui } from "@/lib/ui";
import { useApp, useCustomItems } from "@/lib/store";

// Control Centre: one place to change the whole app. Every change is saved
// at once and shows up everywhere (and on your other devices).
type TabId = "menu" | "pages" | "quick" | "food" | "new";
const TABS: [TabId, string][] = [["menu", "📱 Main buttons"], ["pages", "🧩 Pages & blocks"], ["quick", "⚡ Quick add"], ["food", "🍱 Food buttons"], ["new", "➕ New page"]];

export default function ControlPage() {
  const [tab, setTab] = useState<TabId>("menu");
  const [page, setPage] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("tab") as TabId | null;
    if (t && TABS.some(([x]) => x === t)) setTab(t);
    if (q.get("page")) { setTab("pages"); setPage(q.get("page")); }
  }, []);
  return (
    <>
      <XpHeader title="Control Centre" icon="🎛️" subtitle="Move, add, rename and hide anything. Changes apply everywhere at once." />
      <section className="card p-3 mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted w-full">✏️ Edit mode: tap any word, icon, picture, tile, report or pop-up in the app to rename it, change its picture or colour, move it, remove it or add a new button next to it.</p>
        <button onClick={startEdit} className="btn-gold !py-2 text-sm flex-1">✏️ Edit anything</button>
        <button onClick={openAutos} className="chip !py-2 text-sm">⚙️ Automatic or manual</button>
      </section>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {TABS.map(([id, l]) => <button key={id} onClick={() => { setTab(id); setPage(null); }} className={`chip shrink-0 !py-1.5 text-xs ${tab === id ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      {tab === "menu" && <section className="card p-4 mb-4"><h2 className="section-title mb-2">📱 Main buttons (bottom menu)</h2><MenuEditor live /><p className="text-[11px] text-muted mt-3">Built-in pages can be taken off the menu but never deleted: add them back any time from “Add a tab”.</p></section>}
      {tab === "pages" && (page ? <PageEditor href={page} onBack={() => setPage(null)} /> : <PageList onPick={setPage} />)}
      {tab === "quick" && <QuickEditor />}
      {tab === "food" && <FoodButtons />}
      {tab === "new" && <NewPage onMade={(h) => { setTab("pages"); setPage(h); }} />}
    </>
  );
}

// Saves a change to the menu settings straight away.
function useUi() {
  const { profile, saveSettings } = useApp();
  const ui: Ui = profile.settings.ui ?? {};
  return { ui, save: (p: Partial<Ui>) => saveSettings({ ui: { ...ui, ...p } }) };
}
const pageLayout = (ui: Ui, href: string): PageLayout => ui.pages?.[href] ?? {};

// ---------- Pages ----------
function PageList({ onPick }: { onPick: (href: string) => void }) {
  const { ui } = useUi();
  const pages = allPages(ui);
  return (
    <section className="card p-4 mb-4 space-y-2">
      <h2 className="section-title">🧩 Pick a page to change</h2>
      <p className="text-xs text-muted">Move blocks up and down, hide built-in blocks, and add your own blocks with buttons (mini-slots), checklists, counters or notes.</p>
      <div className="grid grid-cols-2 gap-2">
        {pages.map((p) => {
          const own = pageLayout(ui, p.href).blocks?.length ?? 0;
          return (
            <button key={p.href} onClick={() => onPick(p.href)} className="rounded-xl bg-white/5 p-3 text-left active:scale-95">
              <div className="text-2xl">{p.icon}</div>
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-[10px] text-muted">{(PAGE_SECTIONS[p.href]?.length ?? 0) + own} blocks{own ? ` · ${own} yours` : ""}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PageEditor({ href, onBack }: { href: string; onBack: () => void }) {
  const { ui, save } = useUi();
  const t = tabOf(href, ui);
  const p = pageLayout(ui, href);
  const own = p.blocks ?? [];
  const builtIn = PAGE_SECTIONS[href] ?? [];
  const isCustom = href.startsWith("/custom/");
  const [edit, setEdit] = useState<Block | null>(null);
  const [add, setAdd] = useState(false);
  // Full order including hidden ones, so hidden blocks keep their place.
  const all = [...builtIn.map(([id]) => id), ...own.map((b) => b.id)];
  const shown = arrange(ui, href).map((x) => x.id);
  const order = [...shown, ...all.filter((x) => !shown.includes(x))];
  const hidden = new Set(href === "/" ? [...(p.hide ?? []), ...(ui.hide ?? [])] : p.hide ?? []);
  const setPage = (np: PageLayout, extra: Partial<Ui> = {}) => save({ pages: { ...ui.pages, [href]: np }, ...extra });
  const move = (i: number, d: number) => {
    const o = [...order]; const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    setPage({ ...p, order: o });
  };
  const toggle = (id: string) => {
    const h = new Set(p.hide ?? []);
    const old = new Set(ui.hide ?? []);
    if (hidden.has(id)) { h.delete(id); old.delete(id); } else h.add(id);
    setPage({ ...p, order, hide: [...h] }, href === "/" ? { hide: [...old] } : {});
  };
  const saveBlock = (b: Block) => {
    const blocks = own.some((x) => x.id === b.id) ? own.map((x) => (x.id === b.id ? b : x)) : [...own, b];
    setPage({ ...p, blocks, order: order.includes(b.id) ? order : [b.id, ...order] });
    setEdit(null);
  };
  const delBlock = (b: Block) => {
    if (!confirm(`Delete your block “${b.title}”?`)) return;
    setPage({ ...p, blocks: own.filter((x) => x.id !== b.id), order: order.filter((x) => x !== b.id) });
    setEdit(null);
  };
  const delPage = () => {
    if (!confirm(`Delete your page “${t?.label}” and its blocks?`)) return;
    const pages = { ...ui.pages }; delete pages[href];
    save({ custom: (ui.custom ?? []).filter((c) => customHref(c.id) !== href), pages, tabs: (ui.tabs ?? []).filter((x) => x !== href) });
    onBack();
  };
  return (
    <section className="card p-4 mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn-ghost !px-3 !py-1">‹</button>
        <h2 className="section-title flex-1">{t?.icon} {t?.label}</h2>
        <Link href={href} className="chip !py-1 text-xs">Open ›</Link>
      </div>
      {!builtIn.length && !isCustom && <p className="text-xs text-muted">This page&apos;s own parts stay as they are; your blocks show under them.</p>}
      <ul className="space-y-1.5">
        {order.map((id, i) => {
          const b = own.find((x) => x.id === id);
          const label = b ? `${b.icon} ${b.title}` : builtIn.find(([x]) => x === id)?.[1];
          if (!label) return null;
          const off = hidden.has(id);
          return (
            <li key={id} className={`rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm ${b ? "bg-[var(--accent)]/15" : "bg-white/5"} ${off ? "opacity-50" : ""}`}>
              <span className="flex-1 min-w-0 truncate">{label}{b ? <span className="text-[10px] text-muted"> · yours ({b.kind === "slots" ? `${b.slots?.length ?? 0} buttons` : b.kind})</span> : <span className="text-[10px] text-muted"> · built-in</span>}</span>
              <button aria-label="Move up" onClick={() => move(i, -1)} className="chip !px-2 !py-0.5">▲</button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="chip !px-2 !py-0.5">▼</button>
              <button aria-label={off ? "Show" : "Hide"} onClick={() => toggle(id)} className="chip !px-2 !py-0.5">{off ? "🙈" : "👁️"}</button>
              {b && <button aria-label="Edit" onClick={() => setEdit(b)} className="chip !px-2 !py-0.5">✏️</button>}
            </li>
          );
        })}
        {!order.length && <li className="text-xs text-muted">No blocks yet. Add one below.</li>}
      </ul>
      <button onClick={() => setAdd(true)} className="btn-primary w-full">＋ Add a block</button>
      {isCustom && <PageRename href={href} />}
      {isCustom && <button onClick={delPage} className="btn-ghost w-full text-rose-300">Delete this page</button>}
      <p className="text-[10px] text-muted">👁️ hides a block, 🙈 shows it again. Built-in blocks can be hidden but not deleted; your own blocks can be edited and deleted.</p>
      {add && <NewBlock onPick={(k) => { setAdd(false); setEdit(blankBlock(k)); }} onClose={() => setAdd(false)} />}
      {edit && <BlockEditor block={edit} isNew={!own.some((x) => x.id === edit.id)} onSave={saveBlock} onDelete={() => delBlock(edit)} onClose={() => setEdit(null)} />}
    </section>
  );
}

const KINDS: [BlockKind, string, string][] = [
  ["slots", "🔘 Buttons (mini-slots)", "A row of icon buttons that open a page, log something, add food, water, a drink…"],
  ["checklist", "☑️ Checklist", "Things to tick off each day. Each tick is logged and counts in Today."],
  ["counter", "🔢 Counter", "Tap + to count anything today (push-ups, cigarettes avoided, pages…) with a goal."],
  ["note", "📝 Note", "Text you want to see on this page: a goal, a reminder, a motto."],
  ["widget", "🧩 Widget", "A live picture: water glass, calorie ring, study bar or exam countdown."],
];
const blankBlock = (kind: BlockKind): Block => ({ id: `b-${uid()}`, kind, icon: kind === "slots" ? "🔘" : kind === "checklist" ? "☑️" : kind === "counter" ? "🔢" : kind === "widget" ? "💧" : "📝", title: kind === "widget" ? "Water glass" : "", widget: kind === "widget" ? "water" : undefined, slots: [], items: [], text: "", goal: 0, unit: "" });

function NewBlock({ onPick, onClose }: { onPick: (k: BlockKind) => void; onClose: () => void }) {
  return (
    <Sheet title="＋ Add a block" onClose={onClose}>
      {KINDS.map(([k, l, d]) => (
        <button key={k} onClick={() => onPick(k)} className="w-full rounded-xl bg-white/5 p-3 text-left active:scale-[.98]">
          <div className="font-semibold text-sm">{l}</div><div className="text-xs text-muted">{d}</div>
        </button>
      ))}
    </Sheet>
  );
}

function IconPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
      {ICONS.map((x) => <button key={x} onClick={() => onChange(x)} className={`h-8 w-8 rounded-lg text-lg ${value === x ? "bg-[var(--accent2)]/30 ring-1 ring-[var(--accent2)]" : "bg-white/5"}`}>{x}</button>)}
    </div>
  );
}

function BlockEditor({ block, isNew, onSave, onDelete, onClose }: { block: Block; isNew: boolean; onSave: (b: Block) => void; onDelete: () => void; onClose: () => void }) {
  const [b, setB] = useState<Block>(block);
  const [slot, setSlot] = useState<MiniSlot | null>(null);
  const [item, setItem] = useState("");
  const set = (p: Partial<Block>) => setB({ ...b, ...p });
  const slots = b.slots ?? [];
  const moveSlot = (i: number, d: number) => { const s = [...slots]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; set({ slots: s }); };
  return (
    <Sheet title={isNew ? "＋ New block" : `✏️ ${block.title || "Block"}`} onClose={onClose}>
      <div className="grid grid-cols-[3.5rem_1fr] gap-2">
        <input aria-label="Icon" className="input text-center text-xl" value={b.icon} onChange={(e) => set({ icon: e.target.value })} />
        <input className="input" placeholder="Block name (Morning routine, Study tools…)" value={b.title} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <IconPick value={b.icon} onChange={(icon) => set({ icon })} />
      {b.kind === "slots" && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted">Mini-slots (buttons)</div>
          {slots.map((s, i) => (
            <div key={s.id} className="rounded-xl bg-white/5 px-2 py-1.5 flex items-center gap-1.5 text-sm">
              <span className="text-xl">{s.icon}</span><span className="flex-1 truncate">{s.label}<span className="text-[10px] text-muted"> · {actionText(s.action)}</span></span>
              <button onClick={() => moveSlot(i, -1)} className="chip !px-2 !py-0.5">▲</button>
              <button onClick={() => moveSlot(i, 1)} className="chip !px-2 !py-0.5">▼</button>
              <button onClick={() => setSlot(s)} className="chip !px-2 !py-0.5">✏️</button>
              <button onClick={() => set({ slots: slots.filter((x) => x.id !== s.id) })} className="chip !px-2 !py-0.5">✕</button>
            </div>
          ))}
          <button onClick={() => setSlot({ id: `s-${uid()}`, icon: "⭐", label: "", action: { type: "log", name: "" } })} className="btn-ghost w-full border border-dashed border-white/25 text-sm">＋ Add a mini-slot</button>
        </div>
      )}
      {b.kind === "checklist" && (
        <div className="space-y-1.5">
          {(b.items ?? []).map((n, i) => (
            <div key={n + i} className="rounded-xl bg-white/5 px-3 py-1.5 flex items-center gap-2 text-sm">
              <span className="flex-1">☐ {n}</span>
              <button onClick={() => set({ items: (b.items ?? []).filter((_, j) => j !== i) })} className="chip !px-2 !py-0.5">✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="input" placeholder="Brush teeth, Take vitamins, 10 min reading…" value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && item.trim()) { set({ items: [...(b.items ?? []), item.trim()] }); setItem(""); } }} />
            <button onClick={() => { if (item.trim()) { set({ items: [...(b.items ?? []), item.trim()] }); setItem(""); } }} className="btn-primary !px-3">Add</button>
          </div>
        </div>
      )}
      {b.kind === "counter" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Goal per day<input className="input mt-1" inputMode="numeric" value={b.goal || ""} onChange={(e) => set({ goal: Number(e.target.value) || 0 })} /></label>
          <label className="text-xs text-muted">Unit<input className="input mt-1" placeholder="push-ups, glasses…" value={b.unit ?? ""} onChange={(e) => set({ unit: e.target.value })} /></label>
        </div>
      )}
      {b.kind === "widget" && (
        <div className="grid grid-cols-2 gap-2">
          {WIDGETS.map((w) => (
            <button key={w.id} onClick={() => set({ widget: w.id, icon: w.icon, title: w.title })} className={`rounded-xl p-2 text-left ${b.widget === w.id ? "bg-[var(--accent2)]/20 ring-1 ring-[var(--accent2)]" : "bg-white/5"}`}>
              <div className="text-2xl">{w.icon}</div><div className="text-sm font-semibold">{w.title}</div><div className="text-[10px] text-muted">{w.desc}</div>
            </button>
          ))}
        </div>
      )}
      {b.kind === "note" && <textarea className="input min-h-28 text-sm" placeholder="Write anything…" value={b.text ?? ""} onChange={(e) => set({ text: e.target.value })} />}
      <div className="flex gap-2">
        {!isNew && <button onClick={onDelete} className="btn-ghost text-rose-300">Delete</button>}
        <button onClick={() => onSave({ ...b, title: b.title.trim() || KINDS.find(([k]) => k === b.kind)![1].replace(/^\S+\s/, "") })} className="btn-primary flex-1">Save block</button>
      </div>
      {slot && <SlotEditor slot={slot} onClose={() => setSlot(null)} onSave={(s) => { set({ slots: slots.some((x) => x.id === s.id) ? slots.map((x) => (x.id === s.id ? s : x)) : [...slots, s] }); setSlot(null); }} />}
    </Sheet>
  );
}

const ACTIONS: [SlotAction["type"], string][] = [
  ["log", "✅ Log an activity"], ["page", "📱 Open a page"], ["meal", "🍽️ Add food (meal)"], ["photo", "📷 Food photo"], ["drink", "🥤 Log a drink"],
  ["water", "💧 Add water"], ["milk", "🥛 Add milk"], ["wake", "🌅 Woke up"], ["sleep", "😴 Going to sleep"], ["anything", "📝 Log anything"], ["url", "🔗 Open a website"],
];
function actionText(a: SlotAction): string {
  switch (a.type) {
    case "log": return `log “${a.name}”`;
    case "page": return `open ${a.href}`;
    case "meal": return a.name ? `food: ${a.name}` : "add food";
    case "water": return `+${a.ml ?? 250} ml water`;
    case "milk": return `+${a.ml ?? 250} ml milk`;
    case "url": return a.url;
    default: return ACTIONS.find(([t]) => t === a.type)?.[1].replace(/^\S+\s/, "").toLowerCase() ?? a.type;
  }
}

function SlotEditor({ slot, onSave, onClose }: { slot: MiniSlot; onSave: (s: MiniSlot) => void; onClose: () => void }) {
  const { ui } = useUi();
  const { items: acts } = useCustomItems("activity");
  const [s, setS] = useState<MiniSlot>(slot);
  const a = s.action;
  const setA = (x: SlotAction) => setS({ ...s, action: x });
  const pages = allPages(ui);
  const meals = allMealSlots(ui).filter((m) => !m.drink);
  const ready = !!s.label.trim() && (a.type !== "log" || !!a.name.trim()) && (a.type !== "url" || /^https?:\/\//.test(a.url));
  return (
    <Sheet title="🔘 Mini-slot" onClose={onClose}>
      <div className="text-xs text-muted">What it does</div>
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map(([t, l]) => (
          <button key={t} onClick={() => setA(t === "log" ? { type: "log", name: s.label } : t === "page" ? { type: "page", href: "/today" } : t === "meal" ? { type: "meal", name: "" } : t === "url" ? { type: "url", url: "https://" } : t === "water" ? { type: "water", ml: 250 } : t === "milk" ? { type: "milk", ml: 250 } : ({ type: t } as SlotAction))}
            className={`chip !py-0.5 text-[11px] ${a.type === t ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>
      {a.type === "log" && (
        <>
          <input className="input" placeholder="Activity name (Brush teeth, Meditate, Stretch…)" value={a.name} onChange={(e) => setS({ ...s, action: { type: "log", name: e.target.value }, label: s.label || "" })} />
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">{acts.slice(0, 40).map((x) => <button key={x.id} onClick={() => setS({ ...s, label: s.label || x.name, icon: String(x.config.emoji ?? s.icon), action: { type: "log", name: x.name } })} className="chip !py-0.5 text-[11px]">{String(x.config.emoji ?? "")} {x.name}</button>)}</div>
        </>
      )}
      {a.type === "page" && (
        <div className="flex flex-wrap gap-1">{pages.map((p) => <button key={p.href} onClick={() => setS({ ...s, label: s.label || p.label, icon: s.label ? s.icon : p.icon, action: { type: "page", href: p.href } })} className={`chip !py-0.5 text-[11px] ${a.href === p.href ? "chip-on" : ""}`}>{p.icon} {p.label}</button>)}</div>
      )}
      {a.type === "meal" && (
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setA({ type: "meal", name: "" })} className={`chip !py-0.5 text-[11px] ${!a.name ? "chip-on" : ""}`}>Pick by the clock</button>
          {meals.map((m) => <button key={m.id} onClick={() => setS({ ...s, label: s.label || m.label, icon: s.label ? s.icon : m.icon, action: { type: "meal", name: m.label } })} className={`chip !py-0.5 text-[11px] ${a.name === m.label ? "chip-on" : ""}`}>{m.icon} {m.label}</button>)}
        </div>
      )}
      {(a.type === "water" || a.type === "milk") && (
        <div className="flex flex-wrap gap-1">{[100, 200, 250, 350, 500].map((ml) => <button key={ml} onClick={() => setA({ type: a.type, ml })} className={`chip !py-0.5 text-[11px] ${a.ml === ml ? "chip-on" : ""}`}>{ml} ml</button>)}</div>
      )}
      {a.type === "url" && <input className="input" placeholder="https://…" value={a.url} onChange={(e) => setA({ type: "url", url: e.target.value })} />}
      <div className="grid grid-cols-[3.5rem_1fr] gap-2">
        <input aria-label="Icon" className="input text-center text-xl" value={s.icon} onChange={(e) => setS({ ...s, icon: e.target.value })} />
        <input className="input" placeholder="Button name" value={s.label} onChange={(e) => setS({ ...s, label: e.target.value })} />
      </div>
      <IconPick value={s.icon} onChange={(icon) => setS({ ...s, icon })} />
      <button disabled={!ready} onClick={() => onSave({ ...s, label: s.label.trim() })} className="btn-primary w-full">Save mini-slot</button>
    </Sheet>
  );
}

function PageRename({ href }: { href: string }) {
  const { ui, save } = useUi();
  const c = (ui.custom ?? []).find((x) => customHref(x.id) === href);
  if (!c) return null;
  const set = (p: Partial<typeof c>) => save({ custom: (ui.custom ?? []).map((x) => (x.id === c.id ? { ...x, ...p } : x)) });
  return (
    <div className="rounded-xl bg-white/5 p-3 space-y-2">
      <div className="text-xs text-muted">Page name and icon</div>
      <div className="grid grid-cols-[3.5rem_1fr] gap-2">
        <input aria-label="Page icon" className="input text-center text-xl" value={c.icon} onChange={(e) => set({ icon: e.target.value })} />
        <input aria-label="Page name" className="input" value={c.label} onChange={(e) => set({ label: e.target.value })} />
      </div>
      {!(ui.tabs ?? []).includes(href) && <button onClick={() => save({ tabs: [...(ui.tabs?.length ? ui.tabs : ["/learn", "/food", "/doctor", "/train", "/today", "/tools", "/calendar", "/"]), href].slice(0, 9) })} className="btn-ghost w-full text-sm">＋ Put it on the bottom menu</button>}
    </div>
  );
}

function NewPage({ onMade }: { onMade: (href: string) => void }) {
  const { ui, save } = useUi();
  const [icon, setIcon] = useState("⭐");
  const [label, setLabel] = useState("");
  const [onMenu, setOnMenu] = useState(true);
  const make = () => {
    const id = uid();
    const href = customHref(id);
    const tabs = ui.tabs?.length ? ui.tabs : ["/learn", "/food", "/doctor", "/train", "/today", "/tools", "/calendar", "/"];
    save({ custom: [...(ui.custom ?? []), { id, icon, label: label.trim() }], ...(onMenu ? { tabs: [...tabs.filter((x) => x !== href), href].slice(-9) } : {}) });
    onMade(href);
  };
  return (
    <section className="card p-4 mb-4 space-y-3">
      <h2 className="section-title">➕ Make your own page</h2>
      <p className="text-xs text-muted">A page of your own blocks: buttons, checklists, counters and notes. Put it on the bottom menu or inside a folder tab.</p>
      <div className="grid grid-cols-[3.5rem_1fr] gap-2">
        <input aria-label="Icon" className="input text-center text-xl" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <input className="input" placeholder="Page name (Japanese study, Gym, Skin care…)" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <IconPick value={icon} onChange={setIcon} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onMenu} onChange={(e) => setOnMenu(e.target.checked)} /> Put it on the bottom menu (up to 9 buttons)</label>
      <button disabled={!label.trim()} onClick={make} className="btn-primary w-full">Make page and add blocks →</button>
    </section>
  );
}

// ---------- Quick add ----------
function QuickEditor() {
  const { ui, save } = useUi();
  const ids = ui.quick?.length ? ui.quick : QUICK_DEFAULT;
  const choices = quickChoices(ui);
  const [slot, setSlot] = useState<MiniSlot | null>(null);
  const move = (i: number, d: number) => { const s = [...ids]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; save({ quick: s }); };
  return (
    <section className="card p-4 mb-4 space-y-3">
      <h2 className="section-title">⚡ Quick add icons</h2>
      <p className="text-xs text-muted">These icons sit at the top of Today and Food. Order them, remove them, or make your own.</p>
      <ul className="space-y-1.5">
        {ids.map((id, i) => {
          const s = choices.find((x) => x.id === id);
          if (!s) return null;
          return (
            <li key={id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center gap-1.5 text-sm">
              <span className="text-xl">{s.icon}</span><span className="flex-1 truncate">{s.label}</span>
              <button onClick={() => move(i, -1)} className="chip !px-2 !py-0.5">▲</button>
              <button onClick={() => move(i, 1)} className="chip !px-2 !py-0.5">▼</button>
              <button onClick={() => save({ quick: ids.filter((x) => x !== id) })} className="chip !px-2 !py-0.5">✕</button>
            </li>
          );
        })}
      </ul>
      <div className="text-xs text-muted">Add</div>
      <div className="flex flex-wrap gap-1.5">
        {choices.filter((c) => !ids.includes(c.id)).map((c) => <button key={c.id} onClick={() => save({ quick: [...ids, c.id] })} className="chip !py-1 text-xs">+ {c.icon} {c.label}</button>)}
        <button onClick={() => setSlot({ id: `q-${uid()}`, icon: "⭐", label: "", action: { type: "log", name: "" } })} className="chip !py-1 text-xs border-dashed">＋ Make my own</button>
      </div>
      <button onClick={() => save({ quick: QUICK_DEFAULT })} className="btn-ghost w-full text-muted text-sm">↺ Reset</button>
      {slot && <SlotEditor slot={slot} onClose={() => setSlot(null)} onSave={(s) => { save({ quickOwn: [...(ui.quickOwn ?? []).filter((x) => x.id !== s.id), s], quick: [...ids, s.id] }); setSlot(null); }} />}
    </section>
  );
}

// ---------- Food buttons ----------
function FoodButtons() {
  const { ui, save } = useUi();
  const all = allMealSlots(ui);
  const order = [...(ui.mealOrder ?? []).filter((id) => all.some((m) => m.id === id)), ...all.map((m) => m.id).filter((id) => !(ui.mealOrder ?? []).includes(id))];
  const hide = new Set(ui.mealHide ?? []);
  const [edit, setEdit] = useState<MealSlot | "new" | null>(null);
  const move = (i: number, d: number) => { const s = [...order]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; save({ mealOrder: s }); };
  return (
    <section className="card p-4 mb-4 space-y-3">
      <h2 className="section-title">🍱 Food and drink buttons</h2>
      <p className="text-xs text-muted">The buttons on Food today and in the Today table. Add anything you eat or drink, with any icon.</p>
      <ul className="space-y-1.5">
        {order.map((id, i) => {
          const m = all.find((x) => x.id === id)!;
          const off = hide.has(id);
          return (
            <li key={id} className={`rounded-xl bg-white/5 px-3 py-2 flex items-center gap-1.5 text-sm ${off ? "opacity-50" : ""}`}>
              <span className="text-xl">{m.icon}</span>
              <span className="flex-1 truncate">{m.label}<span className="text-[10px] text-muted"> · {m.builtIn ? "built-in" : m.drink ? "drink" : "food"}</span></span>
              <button onClick={() => move(i, -1)} className="chip !px-2 !py-0.5">▲</button>
              <button onClick={() => move(i, 1)} className="chip !px-2 !py-0.5">▼</button>
              <button onClick={() => save({ mealHide: off ? [...hide].filter((x) => x !== id) : [...hide, id] })} className="chip !px-2 !py-0.5">{off ? "🙈" : "👁️"}</button>
              <button onClick={() => setEdit(m)} className="chip !px-2 !py-0.5">✏️</button>
            </li>
          );
        })}
      </ul>
      <button onClick={() => setEdit("new")} className="btn-primary w-full">＋ Add a food or drink button</button>
      {edit && <MealSlotSheet slot={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
    </section>
  );
}
