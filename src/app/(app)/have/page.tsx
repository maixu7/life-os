"use client";

import Link from "next/link";
import { useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { HaveSheet } from "@/components/HaveSheet";
import { Pic } from "@/components/Pic";
import { MealSheet } from "@/components/Meals";
import { amountText, gearOf, itemKind, KINDS, kitOf, kitText, withGear, type Kind } from "@/lib/have";
import { useApp, type PantryItem } from "@/lib/store";

// Everything the hero owns, with photos and amounts. The rest of the app reads
// it: meals suggest your food, training builds workouts from your equipment,
// Learn shows your books.
export default function HavePage() {
  const { data, update } = useApp();
  const [kind, setKind] = useState<Kind | "">("");
  const [edit, setEdit] = useState<PantryItem | "new" | null>(null);
  const [eat, setEat] = useState<string | null>(null);
  const list = [...data.pantry].filter((p) => !kind || itemKind(p) === kind).sort((a, b) => Number(b.qty > 0) - Number(a.qty > 0) || a.name.localeCompare(b.name));
  const kit = kitOf(data.pantry);
  const step = (p: PantryItem, d: number) => update((x) => ({ ...x, pantry: x.pantry.map((i) => (i.id === p.id ? { ...i, qty: Math.max(0, +(i.qty + d).toFixed(2)), updated_at: new Date().toISOString() } : i)) }));

  return (
    <>
      <XpHeader title="What I have" icon="🎒" subtitle="Your food, books and gear. The whole app uses this list." />
      {Object.keys(kit).length > 0 && (
        <Link href="/train" className="card p-3 mb-3 block text-sm">
          🏋️ You have <b>{kitText(kit)}</b>. <span className="text-[var(--accent2)]">See today&apos;s workout made for it →</span>
        </Link>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setKind("")} className={`chip !py-1 text-xs ${!kind ? "chip-on" : ""}`}>All ({data.pantry.length})</button>
        {KINDS.map(([k, e, l]) => {
          const n = data.pantry.filter((p) => itemKind(p) === k).length;
          return n ? <button key={k} onClick={() => setKind(k)} className={`chip !py-1 text-xs ${kind === k ? "chip-on" : ""}`}>{e} {l} ({n})</button> : null;
        })}
        <button onClick={() => setEdit("new")} className="chip chip-on !py-1 text-xs ml-auto">＋ Add</button>
      </div>
      {list.length === 0 ? (
        <button onClick={() => setEdit("new")} className="card p-6 w-full text-center text-sm text-muted">Nothing here yet. Add your food, fruit, books, dumbbells, kettlebell, pull-up bar… Snap a photo and the app tells what it is.</button>
      ) : (
        <section className="grid grid-cols-2 gap-2 mb-4">
          {list.map((p) => {
            const k = itemKind(p);
            return (
              <div key={p.id} className={`card p-2.5 ${p.qty <= 0 ? "opacity-50" : ""}`}>
                <button onClick={() => setEdit(p)} className="flex w-full items-center gap-2 text-left">
                  <Pic name={p.name} emoji={p.emoji} size={48} src={p.photo} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{p.name}</span>
                    <span className="block text-[11px] text-muted">{KINDS.find(([x]) => x === k)?.[1]} {amountText(p)}</span>
                    {p.expiry && p.qty > 0 && (() => { const days = Math.ceil((new Date(`${p.expiry}T23:59`).getTime() - Date.now()) / 86_400_000); return days <= 7 ? <span className={`block text-[10px] ${days < 0 ? "text-rose-400" : days <= 2 ? "text-amber-300" : "text-muted"}`}>{days < 0 ? `⚠️ expired ${-days} d ago` : days === 0 ? "⏳ best before today" : `⏳ ${days} d left`}</span> : null; })()}
                  </span>
                </button>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button aria-label="One less" onClick={() => step(p, -1)} className="h-7 w-7 rounded-full bg-white/10">−</button>
                  <button aria-label="One more" onClick={() => step(p, 1)} className="h-7 w-7 rounded-full bg-white/10">+</button>
                  {["food", "fruit", "veg", "drink"].includes(k) && p.qty > 0 && <button onClick={() => setEat(p.name)} className="chip !py-0.5 text-[11px] ml-auto">🍽️ Eat</button>}
                  {k === "equipment" && <span className="text-[10px] text-muted ml-auto">{withGear(kit, gearOf(p.name)).length} moves</span>}
                </div>
              </div>
            );
          })}
        </section>
      )}
      {edit && <HaveSheet item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {eat && <MealSheet start={[eat]} onClose={() => setEat(null)} />}
    </>
  );
}
