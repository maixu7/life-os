"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { Pic } from "@/components/Pic";
import { Sheet } from "@/components/Sheet";
import { MealSheet } from "@/components/Meals";
import { guessFood } from "@/lib/body";
import { foodGoodness } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { emojiFor } from "@/lib/emoji";
import { loadImage, recognise, smallPhoto } from "@/lib/foodphoto";
import { aiPhoto, readProduct } from "@/lib/foodai";
import { GoodsSuggest } from "@/components/GoodsSuggest";
import { goods, type Good } from "@/lib/goods";
import { SnapChoice, type Pick } from "@/components/SnapChoice";
import { EQUIPMENT } from "@/lib/equipment";
import { fromPhoto, gearOf, itemKind, kindOf, KINDS, kitOf, kitText, whenToEat, withGear, type Kind } from "@/lib/have";
import { UNITS, useApp, type PantryItem } from "@/lib/store";

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
                    <span className="block text-[11px] text-muted">{KINDS.find(([x]) => x === k)?.[1]} {p.qty} {p.unit}{p.kg ? ` · ${p.kg} kg each` : ""}</span>
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

function HaveSheet({ item, onClose }: { item: PantryItem | null; onClose: () => void }) {
  const { data, update } = useApp();
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState<Kind | "">((item?.kind as Kind) ?? "");
  const [qty, setQty] = useState(String(item?.qty ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "pcs");
  const [kg, setKg] = useState(item?.kg ? String(item.kg) : "");
  const [note, setNote] = useState(item?.note ?? "");
  const [photo, setPhoto] = useState(item?.photo ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ja, setJa] = useState(item?.ja ?? "");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [expiry, setExpiry] = useState(item?.expiry ?? "");
  const [nut, setNut] = useState<{ per: string; kcal: number; protein: number } | null>(item?.kcal != null ? { per: item.per ?? "1", kcal: item.kcal, protein: item.protein ?? 0 } : null);
  const { session } = useApp();
  const pickGood = (g: Good) => {
    setName(g.name); setJa(g.ja);
    setKind(g.kind === "utensil" ? "other" : g.kind === "other" ? (kindOf(g.name) === "equipment" ? "equipment" : "other") : g.kind);
    if (g.kcal) setNut({ per: g.per, kcal: g.kcal, protein: g.protein });
    setMsg(`${g.emoji} ${g.name}${g.ja ? ` (${g.ja})` : ""}${g.kcal ? ` · ${g.kcal} kcal per ${g.per}` : ""}`);
  };
  const file = useRef<HTMLInputElement>(null);
  const k: Kind = kind || kindOf(name);
  const kit = kitOf(data.pantry);

  // A photo: first the app's own list (on the phone, no AI); AI only from its button.
  const [shot, setShot] = useState<HTMLImageElement | null>(null);
  const picks = useMemo<Pick[]>(() => [
    ...data.pantry.map((p) => ({ name: p.name, emoji: p.emoji, ja: p.ja, sub: "in What I have", mine: true })),
    ...goods().map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.kcal ? `${g.kcal} kcal per ${g.per}` : g.cat })),
    ...EQUIPMENT.map((e) => ({ name: e.name, emoji: e.emoji, ja: e.ja, sub: e.brand })),
  ], [data.pantry]);
  const snap = async (f: File) => {
    const img = await loadImage(f);
    setPhoto(smallPhoto(img, 160));
    setShot(img);
  };
  const pickListed = (p: Pick) => {
    const g = goods().find((x) => x.name === p.name);
    if (g) { pickGood(g); return; }
    const had = data.pantry.find((x) => x.name === p.name);
    setName(p.name); setJa(p.ja ?? ""); setKind(had ? itemKind(had) : kindOf(p.name));
    setMsg(`📋 ${p.emoji} ${p.name} (from the list).`);
  };
  const askAI = async (img: HTMLImageElement) => {
    setBusy(true);
    setMsg("🤖 AI is reading the packet (English and 日本語)…");
    // 1) The AI reader reads the packet: name, amount, calories, best-before date.
    const r0 = await readProduct(session, aiPhoto(img), name);
    setBusy(false);
    const p = r0.product;
    if (p && p.found !== false && p.name) {
      setName(p.name); setJa(p.name_ja || ""); setBrand(p.brand || "");
      const k = (["food", "fruit", "veg", "drink", "book", "equipment", "other"] as Kind[]).includes(p.kind as Kind) ? (p.kind as Kind) : kindOf(p.name);
      setKind(k);
      if (p.qty > 0) setQty(String(p.qty));
      if (p.unit && UNITS.includes(p.unit)) setUnit(p.unit);
      if (p.expiry) setExpiry(p.expiry);
      if (p.kcal || p.protein) setNut({ per: p.per || "1 serving", kcal: Math.round(p.kcal), protein: p.protein });
      const extra = [p.storage, p.allergens ? `Allergens: ${p.allergens}` : ""].filter(Boolean).join(". ");
      if (extra && !note) setNote(extra);
      setMsg(`🤖 ${p.emoji ?? ""} ${p.name}${p.name_ja ? ` · ${p.name_ja}` : ""}${p.brand ? ` · ${p.brand}` : ""}${p.kcal ? ` · ${Math.round(p.kcal)} kcal per ${p.per}` : ""}${p.expiry ? ` · best before ${p.expiry}` : ""}. ${p.note}`);
      return;
    }
    // 2) No AI (offline or switched off): the small on-device model guesses.
    setMsg(`${r0.error && r0.error !== "offline" ? `${r0.error} ` : ""}Trying the offline detector…`);
    try {
      const r = await recognise(img);
      const hit = fromPhoto(r.seen);
      const food = r.foods[0];
      if (hit) { if (!name) setName(hit.name); setKind(hit.kind); setMsg(`Looks like ${hit.name.toLowerCase()}.`); }
      else if (food) { if (!name) setName(food); setKind(kindOf(food) === "other" ? "food" : kindOf(food)); setMsg(`Looks like ${food}.`); }
      else setMsg(`I see ${r.seen.slice(0, 2).join(" or ")}. Type the name.`);
    } catch { setMsg("Type the name (the detector needs internet the first time)."); }
  };
  const save = () => {
    const p: PantryItem = {
      ...item, id: item?.id ?? crypto.randomUUID(), name: name.trim(), emoji: item?.emoji || emojiFor(name, KINDS.find(([x]) => x === k)?.[1] ?? "📦"),
      qty: Number(qty) || 0, unit, last_price: item?.last_price ?? null, updated_at: new Date().toISOString(),
      kind: k, photo: photo || undefined, kg: Number(kg) || undefined, note: note || undefined,
      ja: ja || undefined, brand: brand || undefined, expiry: expiry || undefined,
      per: nut?.per, kcal: nut?.kcal, protein: nut?.protein,
    };
    update((d) => {
      const next = { ...d, pantry: d.pantry.some((x) => x.id === p.id) ? d.pantry.map((x) => (x.id === p.id ? p : x)) : [...d.pantry, p] };
      // Food with calories also goes to My foods, so eating it counts the right calories.
      if (nut && ["food", "fruit", "veg", "drink"].includes(k) && !d.items.some((i) => i.category === "food" && i.name.toLowerCase() === p.name.toLowerCase())) {
        next.items = [...d.items, { id: crypto.randomUUID(), category: "food", name: p.name, sort: Date.now(), config: { per: nut.per, kcal: nut.kcal, protein: nut.protein, emoji: p.emoji, ja: ja || undefined, photo: photo || undefined } }];
      }
      return next;
    });
    onClose();
  };
  const del = () => { if (item && confirm(`Remove ${item.name}?`)) { update((d) => ({ ...d, pantry: d.pantry.filter((x) => x.id !== item.id), deleted: [...d.deleted, item.id] })); onClose(); } };
  const fd = guessFood(name, data.items);
  const moves = k === "equipment" && name ? withGear({ ...kit, ...kitOf([{ id: "n", name, emoji: "", qty: 1, unit, last_price: null, updated_at: "", kind: "equipment" }]) }, gearOf(name)) : [];

  return (
    <Sheet title={item ? `✏️ ${item.name}` : "🎒 Add something you have"} onClose={onClose}>
      <div className="flex gap-3">
        <button onClick={() => file.current?.click()} className="h-24 w-24 shrink-0 rounded-2xl border border-dashed border-white/25 bg-white/[.04] grid place-items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : <span className="text-xs text-muted text-center">📷<br />Photo</span>}
        </button>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) snap(f); e.target.value = ""; }} />
        {shot && <SnapChoice photo={photo} img={shot} list={picks} what="thing" onClose={() => setShot(null)} onAI={() => askAI(shot)} onPick={pickListed} />}
        <div className="flex-1 min-w-0 space-y-2">
          <input className="input" placeholder="Name or 日本語 (ウインナー, Apple, Dumbbell 10 kg…)" value={name} onChange={(e) => { setName(e.target.value); setNut(null); }} />
          {!nut && <GoodsSuggest q={name} onPick={pickGood} max={5} />}
          {msg && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
          <div className="flex flex-wrap gap-1">
            {KINDS.map(([x, e, l]) => <button key={x} onClick={() => setKind(x)} className={`chip !px-2 !py-0.5 text-[11px] ${k === x ? "chip-on" : ""}`}>{e} {l}</button>)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted">How many<input className="input mt-1" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="text-xs text-muted">Unit<select className="input mt-1" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
        {k === "equipment" && <label className="text-xs text-muted">kg each<input className="input mt-1" inputMode="decimal" placeholder="10" value={kg} onChange={(e) => setKg(e.target.value)} /></label>}
      </div>
      {["food", "fruit", "veg", "drink"].includes(k) && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Best before (賞味期限)<input type="date" className="input mt-1" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></label>
          <label className="text-xs text-muted">kcal per serving<input className="input mt-1" inputMode="numeric" value={nut?.kcal ?? ""} onChange={(e) => setNut({ per: nut?.per ?? "1 serving", kcal: Number(e.target.value) || 0, protein: nut?.protein ?? 0 })} /></label>
        </div>
      )}
      {(ja || brand || nut) && <div className="text-[11px] text-muted">{ja && <>🇯🇵 {ja} </>}{brand && <>· {brand} </>}{nut && <>· {nut.kcal} kcal, {nut.protein} g protein per {nut.per}</>}</div>}
      <textarea className="input min-h-12 text-sm" placeholder="Notes (where it is…)" value={note} onChange={(e) => setNote(e.target.value)} />

      {name && ["food", "fruit", "veg", "drink"].includes(k) && (
        <div className="rounded-xl bg-white/5 p-3 text-xs space-y-1">
          <div className="font-semibold">🍽️ When to eat it</div>
          <div>{whenToEat(name)}</div>
          <GoodBadge g={foodGoodness({ name, kcal: fd?.kcal, protein: fd?.protein })} />
          {fd && <div className="text-muted">{fd.emoji} {fd.per}: {fd.kcal} kcal, {fd.protein} g protein</div>}
          <div className="text-muted">It shows up in your meals and on the Food tab. Eating it takes it off this list.</div>
        </div>
      )}
      {k === "equipment" && moves.length > 0 && (
        <div className="rounded-xl bg-white/5 p-3 text-xs space-y-1">
          <div className="font-semibold">🏋️ What you can do with it ({moves.length})</div>
          <div className="flex flex-wrap gap-1">{moves.slice(0, 40).map((m) => <Link key={m.name} href={`/train?ex=${encodeURIComponent(m.name)}`} className="chip !py-0.5 text-[11px]">{m.name}</Link>)}</div>
          {Number(kg) > 0 && <div className="text-muted">Start each move at a weight you can lift 10 times with good form. With {Number(qty) || 1} × {kg} kg you have {(Number(qty) || 1) * Number(kg)} kg in total.</div>}
        </div>
      )}
      {k === "book" && name && <Link href="/learn" className="block rounded-xl bg-white/5 p-3 text-xs">📚 Read it on the Learn tab: log pages and minutes, and it counts as a good deed.</Link>}

      <div className="flex gap-2">
        {item && <button onClick={del} className="btn-ghost text-rose-400">Delete</button>}
        <button disabled={!name.trim()} onClick={save} className="btn-primary flex-1">Save</button>
      </div>
    </Sheet>
  );
}
