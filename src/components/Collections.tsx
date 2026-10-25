"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Pic } from "@/components/Pic";
import { UploadSheet } from "@/components/UploadSheet";
import { EditLog } from "@/components/EditLog";
import { DrinkSheet } from "@/components/Drinks";
import { FoodThumbs, MealSheet, isMealLog } from "@/components/Meals";
import { MealSlotSheet } from "@/components/Meals";
import { describe as describeLog } from "@/lib/describe";
const describe = (l: Log) => { const d = describeLog(l); return `${d.emoji} ${d.title}${d.detail ? ` · ${d.detail}` : ""}`; };
import { amountText, itemKind, kitOf, kitText, type Kind } from "@/lib/have";
import { mealSlots } from "@/lib/layout";
import { toDay, useApp, type Log, type PantryItem } from "@/lib/store";
import type { Eaten } from "@/lib/body";
import { pastOf, type Had } from "@/lib/past";

// "My collection": what you have (food, drinks, gym gear) and everything you
// ate or drank before, with photos, so the same thing is one tap next time.

export type Coll = "food" | "drink" | "gym";
export const openCollection = (c: Coll) => window.dispatchEvent(new CustomEvent("lifeos-coll", { detail: c }));

const FOODISH: Kind[] = ["food", "fruit", "veg"];
const ofColl = (c: Coll, p: PantryItem) => { const k = itemKind(p); return c === "food" ? FOODISH.includes(k) : c === "drink" ? k === "drink" : k === "equipment"; };
const hm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const ago = (iso: string) => { const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };

// Mounted once with the page's big buttons: opens whichever collection was asked for.
export function CollectionHost() {
  const [c, setC] = useState<Coll | null>(null);
  useEffect(() => {
    const go = (e: Event) => setC((e as CustomEvent<Coll>).detail);
    window.addEventListener("lifeos-coll", go);
    return () => window.removeEventListener("lifeos-coll", go);
  }, []);
  if (!c) return null;
  return c === "gym" ? <GymSheet onClose={() => setC(null)} /> : <FoodDrinkSheet c={c} onClose={() => setC(null)} />;
}

function FoodDrinkSheet({ c, onClose }: { c: "food" | "drink"; onClose: () => void }) {
  const { data, update } = useApp();
  const [tab, setTab] = useState<"have" | "had">("have");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<PantryItem | "new" | null>(null);
  const [eat, setEat] = useState<Eaten[] | string | null>(null);
  const [drink, setDrink] = useState<string | null>(null);
  const match = (n: string) => !q || n.toLowerCase().includes(q.toLowerCase());
  const have = data.pantry.filter((p) => ofColl(c, p) && match(`${p.name} ${p.ja ?? ""}`)).sort((a, b) => Number(b.qty > 0) - Number(a.qty > 0) || b.updated_at.localeCompare(a.updated_at));
  const had = useMemo(() => pastOf(data.logs, c), [data.logs, c]).filter((h) => match(h.name));
  const step = (p: PantryItem, n: number) => update((d) => ({ ...d, pantry: d.pantry.map((x) => (x.id === p.id ? { ...x, qty: Math.max(0, +(x.qty + n).toFixed(2)), updated_at: new Date().toISOString() } : x)) }));
  const use = (name: string, h?: Had) => (c === "food" ? setEat(h?.food ? [h.food] : name) : setDrink(name));
  const word = c === "food" ? "food" : "drinks";
  return (
    <Sheet title={c === "food" ? "🍱 My food collection" : "🥤 My drink collection"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setTab("have")} className={`rounded-2xl border p-3 text-center ${tab === "have" ? "border-[var(--accent)] bg-[var(--accent)]/20" : "border-white/10 bg-white/5"}`}><span className="block text-3xl">🎒</span><span className="block text-sm font-bold">What I have</span><span className="block text-[10px] text-muted">{data.pantry.filter((p) => ofColl(c, p) && p.qty > 0).length} at home</span></button>
        <button onClick={() => setTab("had")} className={`rounded-2xl border p-3 text-center ${tab === "had" ? "border-[var(--accent)] bg-[var(--accent)]/20" : "border-white/10 bg-white/5"}`}><span className="block text-3xl">📜</span><span className="block text-sm font-bold">{c === "food" ? "What I've eaten" : "What I've drunk"}</span><span className="block text-[10px] text-muted">{pastOf(data.logs, c).length} so far</span></button>
      </div>
      <input className="input" placeholder={`Search my ${word}…`} value={q} onChange={(e) => setQ(e.target.value)} />
      {tab === "have" ? (
        <>
          <button onClick={() => setEdit("new")} className="btn-primary w-full">＋ Add {c === "food" ? "food" : "a drink"} I have (photo, name, how much)</button>
          {!have.length && <p className="text-xs text-muted">Nothing yet. Add what you have at home, like rice 10 kg, 1 banana, 2 cucumbers.</p>}
          <ul className="space-y-1.5">
            {have.map((p) => (
              <li key={p.id} className={`rounded-xl bg-white/5 p-2 flex items-center gap-2 ${p.qty > 0 ? "" : "opacity-50"}`}>
                <button onClick={() => setEdit(p)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <Pic name={p.name} emoji={p.emoji} size={40} src={p.photo} />
                  <span className="min-w-0"><span className="block text-sm font-semibold truncate">{p.name}</span><span className="block text-[11px] text-muted truncate">{p.qty > 0 ? `${p.qty} ${p.unit}` : "used up"}{p.kcal ? ` · ${p.kcal} kcal per ${p.per ?? "serving"}` : ""}{p.note ? ` · ${p.note}` : ""}</span></span>
                </button>
                <button aria-label="One less" onClick={() => step(p, -1)} className="chip !px-2 !py-0.5">−</button>
                <button aria-label="One more" onClick={() => step(p, 1)} className="chip !px-2 !py-0.5">＋</button>
                {p.qty > 0 && <button onClick={() => use(p.name)} className="chip chip-on !py-0.5 text-[11px]">{c === "food" ? "🍽️ Eat" : "🥤 Drink"}</button>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {!had.length && <p className="text-xs text-muted">Everything you {c === "food" ? "eat" : "drink"} shows up here with its photo, so next time you just tap it.</p>}
          <ul className="space-y-1.5">
            {had.map((h) => (
              <li key={h.name} className="rounded-xl bg-white/5 p-2 flex items-center gap-2">
                <Pic name={h.name} emoji={c === "food" ? "🍽️" : "🥤"} size={40} src={h.photo} />
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{h.name}</span>
                  <span className="block text-[11px] text-muted truncate">{h.food ? `${Math.round(h.food.kcal / (h.food.qty || 1))} kcal · ${Math.round((h.food.protein / (h.food.qty || 1)) * 10) / 10} g protein per ${h.food.per ?? "serving"}` : h.drink ? describe(h.drink) : ""}</span>
                  <span className="block text-[10px] text-muted truncate">{h.times}× · last {ago(h.last)}{h.food?.contents ? ` · ${h.food.contents}` : ""}</span>
                </span>
                <button onClick={() => use(h.name, h)} className="chip chip-on !py-0.5 text-[11px] shrink-0">{c === "food" ? "🍽️ Again" : "🥤 Again"}</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {edit && <UploadSheet cat={c} item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {eat && <MealSheet start={typeof eat === "string" ? [eat] : undefined} again={typeof eat === "string" ? undefined : eat} onClose={() => setEat(null)} />}
      {drink && <DrinkSheet start={drink} onClose={() => setDrink(null)} />}
    </Sheet>
  );
}

function GymSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [edit, setEdit] = useState<PantryItem | "new" | null>(null);
  const gear = data.pantry.filter((p) => ofColl("gym", p));
  const kit = kitOf(data.pantry);
  return (
    <Sheet title="🏋️ My gym collection" onClose={onClose}>
      <p className="text-xs text-muted">Add each thing you train with: a photo, your own description, how many pieces and the weight of each. Daily workouts and tasks use them (a few picked at random each day).</p>
      <button onClick={() => setEdit("new")} className="btn-primary w-full">＋ Add equipment (photo, description, how many, kg)</button>
      {Object.keys(kit).length > 0 && <div className="rounded-xl bg-white/5 p-2 text-xs">🧰 The app reads this as: {kitText(kit)}</div>}
      {!gear.length && <p className="text-xs text-muted">e.g. a photo of your dumbbells: 2, 10 kg each. Or dip bars: &quot;stomach-height dips&quot;.</p>}
      <ul className="space-y-1.5">
        {gear.map((p) => (
          <li key={p.id}>
            <button onClick={() => setEdit(p)} className={`w-full rounded-xl bg-white/5 p-2 flex items-center gap-2 text-left ${p.qty > 0 ? "" : "opacity-50"}`}>
              <Pic name={p.name} emoji={p.emoji} size={48} src={p.photo} />
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{p.name}</span>
                <span className="block text-[11px] text-muted">{amountText(p)}</span>
                {p.note && <span className="block text-[11px] text-muted truncate">“{p.note}”</span>}
              </span>
              <span className="text-muted text-xs">✏️</span>
            </button>
          </li>
        ))}
      </ul>
      {edit && <UploadSheet cat="equipment" item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
    </Sheet>
  );
}

// ---------- Today's lists you can fix: tap to edit, ✕ to delete ----------
export function TodayList({ title, pick, empty }: { title: string; pick: (l: Log) => boolean; empty: string }) {
  const { data, deleteLog } = useApp();
  const [fix, setFix] = useState<Log | null>(null);
  const [meal, setMeal] = useState<Log | null>(null);
  const { profile } = useApp();
  const day = toDay(new Date());
  const logs = data.logs.filter((l) => l.day === day && pick(l)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const del = (l: Log) => { if (confirm(`Delete "${describe(l)}"?`)) deleteLog(l.id); };
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-2">{title} <span className="text-xs text-muted font-normal">({logs.length})</span></h2>
      {!logs.length && <p className="text-xs text-muted">{empty}</p>}
      <ul className="space-y-1">
        {logs.map((l) => (
          <li key={l.id} className="flex items-center gap-2 text-xs">
            <button onClick={() => (isMealLog(l, profile.settings.ui) ? setMeal(l) : setFix(l))} className="flex-1 min-w-0 flex items-center gap-2 text-left rounded-lg bg-white/5 px-2 py-1.5">
              <span className="text-muted w-14 shrink-0">{hm(l.created_at)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {Array.isArray(l.data.foods) ? <FoodThumbs foods={l.data.foods as Eaten[]} /> : l.data.photo ? <img src={String(l.data.photo)} alt="" className="h-6 w-6 rounded object-cover" /> : null}
              <span className="flex-1 truncate">{describe(l)}</span>
              <span className="text-muted">✏️</span>
            </button>
            <button aria-label="Delete" onClick={() => del(l)} className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-300 shrink-0">✕</button>
          </li>
        ))}
      </ul>
      {fix && <EditLog log={fix} onClose={() => setFix(null)} />}
      {meal && <MealSheet log={meal} onClose={() => setMeal(null)} />}
    </section>
  );
}

// ---------- 🥤 Drink today: the same style as Food today ----------
export function DrinksCard() {
  const { data, profile } = useApp();
  const ui = profile.settings.ui;
  const day = toDay(new Date());
  const [open, setOpen] = useState<{ start?: string; slot?: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [fix, setFix] = useState<Log | null>(null);
  const logs = data.logs.filter((l) => l.day === day && ["drink", "water", "milk"].includes(l.kind));
  const ml = logs.reduce((s, l) => s + (Number(l.data.ml) || 0), 0);
  const kcal = logs.reduce((s, l) => s + (Number(l.data.kcal) || 0), 0);
  const caffeine = logs.reduce((s, l) => s + (Number(l.data.caffeine) || 0), 0);
  const sugar = logs.reduce((s, l) => s + (Number(l.data.sugar) || 0), 0);
  const goal = (profile.settings.water_goal_ml || 2000) + (profile.settings.milk_goal_ml || 0);
  const pct = Math.min(100, (ml / Math.max(1, goal)) * 100);
  // Your drink buttons (Control Centre), then what you drink most.
  const slots = mealSlots(ui).filter((m) => m.drink);
  const past = pastOf(data.logs, "drink").sort((a, b) => b.times - a.times).filter((h) => !slots.some((s) => s.label.toLowerCase() === h.name.toLowerCase())).slice(0, Math.max(0, 8 - slots.length));
  const tile = (key: string, icon: React.ReactNode, label: string, done: number, go: () => void) => (
    <button key={key} onClick={go} className={`relative rounded-2xl border bg-white/[.04] p-1 pb-1.5 flex flex-col items-center gap-1 active:scale-95 ${done ? "border-sky-400/60" : "border-white/10"}`}>
      {icon}<span className="text-[10px] leading-tight text-center line-clamp-2">{label}</span>
      {done > 0 && <span aria-label="Done" className="rounded-full bg-sky-500 px-1.5 text-[9px] font-bold leading-4 text-white">✓ {done > 1 ? `×${done}` : "Done"}</span>}
    </button>
  );
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">🥤 Drink today</h2>
        <span className="text-xs text-muted">{ml} / {goal} ml{kcal ? ` · ${kcal} kcal` : ""}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-1"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" style={{ width: `${pct}%` }} /></div>
      <div className="text-[10px] text-muted mb-3">{caffeine ? `☕ ${caffeine} mg caffeine · ` : ""}{sugar ? `🍬 ${Math.round(sugar)} g sugar · ` : ""}{logs.length} drink{logs.length === 1 ? "" : "s"}</div>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((m) => { const done = logs.filter((l) => l.data.slot === m.label); const pic = done[done.length - 1]?.data.photo;
          // eslint-disable-next-line @next/next/no-img-element
          return tile(m.id, pic ? <img src={String(pic)} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="text-2xl h-10 grid place-items-center">{m.icon}</span>, m.label, done.length, () => setOpen({ slot: m.label, start: m.label })); })}
        {past.map((h) => tile(h.name, h.photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={h.photo} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="text-2xl h-10 grid place-items-center">{String(h.drink?.data.emoji ?? "🥤")}</span>, h.name, logs.filter((l) => String(l.data.name) === h.name).length, () => setOpen({ start: h.name })))}
        {tile("photo", <span className="text-2xl h-10 grid place-items-center">📷</span>, "Photo", 0, () => setOpen({}))}
        <button onClick={() => setAdding(true)} aria-label="Add a drink button" className="rounded-2xl border border-dashed border-[var(--accent2)]/50 p-1 flex flex-col items-center justify-center gap-1 active:scale-95">
          <span className="text-2xl h-10 grid place-items-center text-[var(--accent2)]">＋</span><span className="text-[10px]">Add button</span>
        </button>
      </div>
      {logs.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {logs.map((l) => (
            <li key={l.id}><button onClick={() => setFix(l)} className="w-full flex gap-2 text-left items-center">
              <span className="text-muted w-14 shrink-0">{hm(l.created_at)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.data.photo ? <img src={String(l.data.photo)} alt="" className="h-5 w-5 rounded object-cover" /> : <span>{String(l.data.emoji ?? (l.kind === "water" ? "💧" : l.kind === "milk" ? "🥛" : "🥤"))}</span>}
              <span className="flex-1 truncate">{String(l.data.name ?? l.kind)}{l.data.ml ? ` · ${l.data.ml} ml` : ""}</span>
              {Number(l.data.kcal) > 0 && <b>{String(l.data.kcal)} kcal</b>}
            </button></li>
          ))}
        </ul>
      )}
      {open && <DrinkSheet slot={open.slot} start={open.start} onClose={() => setOpen(null)} />}
      {adding && <MealSlotSheet onClose={() => setAdding(false)} />}
      {fix && <EditLog log={fix} onClose={() => setFix(null)} />}
    </section>
  );
}

export const isIntake = (l: Log) => ["drink", "water", "milk"].includes(l.kind) || (l.kind === "activity" && (Array.isArray(l.data.foods) || !!l.data.meal));
export const isTraining = (l: Log) => l.kind === "workout" || (l.kind === "activity" && /walk|run|jog|swim|cycl|bike|yoga|stretch|gym|train|exercise|sport|hike|dance|push.?up|plank|squat/i.test(String(l.data.name ?? "")));
