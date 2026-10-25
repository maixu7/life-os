"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp, type PantryItem } from "@/lib/store";
import { loadImage } from "@/lib/foodphoto";
import { readLabel } from "@/lib/label";
import { parseReceipt } from "@/lib/receipt";
import { readFood } from "@/lib/foodtext";
import { DRINKS, drinkMatch, type Drink } from "@/lib/drinks";
import { fuzzyHits } from "@/lib/identify";
import { haveFoods } from "@/lib/have";
import { perAmount } from "@/lib/label";
import type { Dish } from "@/components/Dishes";
import type { Eaten } from "@/lib/body";

// Ways to log food without AI and without guessing from a plate photo:
// a receipt (exact item names printed), and "I cooked" (the ingredients
// you used from What I have).

const r1 = (x: number) => Math.round(x * 10) / 10;

// ---------- 🧾 Receipt ----------
type Row = { line: string; price?: number; qty: number; on: boolean; food?: Partial<Dish>; drink?: Drink };

export function ReceiptButton({ onFoods }: { onFoods: (ds: Partial<Dish>[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState("");
  const { data, logActivity } = useApp();
  const drinkList = useMemo(() => [...data.items.filter((i) => i.category === "drink").map((i) => ({ name: i.name, ja: undefined, d: i })), ...DRINKS.map((d) => ({ name: d.name, ja: d.ja, d }))], [data.items]);
  const read = async (f: File) => {
    setBusy(true); setRows([]);
    const img = await loadImage(f, 2400);
    setPhoto(img.src);
    const text = (await readLabel(img).catch(() => null))?.text ?? "";
    const out: Row[] = [];
    for (const l of parseReceipt(text)) {
      // A drink in the drink list (exact, then half-read), else a food in the food tables.
      let drink = drinkMatch(l.name);
      if (!drink) { const h = [...fuzzyHits(drinkList, l.name)].sort((a, b) => b[1] - a[1])[0]; const x = h?.[0].d; if (x && "kcal100" in x) drink = x as Drink; }
      const f = drink ? null : readFood(l.name, data.items);
      out.push({ line: l.name, price: l.price, qty: l.qty, on: !!(drink || f), drink, food: f ? { name: f.name, qty: l.qty, per: f.per, kcal: String(f.kcal), protein: String(f.protein ?? ""), fat: f.fat != null ? String(f.fat) : "", carbs: f.carbs != null ? String(f.carbs) : "", sugar: f.sugar != null ? String(f.sugar) : "", salt: f.salt != null ? String(f.salt) : "", contents: f.contents, auto: true } : undefined });
    }
    setRows(out); setBusy(false);
  };
  const add = () => {
    const ok = (rows ?? []).filter((r) => r.on);
    onFoods(ok.filter((r) => !r.drink).map((r) => r.food ?? { name: r.line, qty: r.qty }));
    for (const r of ok) if (r.drink) {
      const d = r.drink, ml = d.ml * r.qty, k = ml / 100;
      logActivity("drink", { name: d.name, emoji: d.emoji, cat: d.cat, ml, kcal: Math.round(d.kcal100 * k), sugar: +(d.sugar100 * k).toFixed(1), caffeine: d.caffeine100 ? Math.round(d.caffeine100 * k) : undefined, alcohol: d.alcohol, water_ml: Math.round(ml * (d.water ?? 0.9)), from: "receipt" });
    }
    setRows(null);
  };
  const set = (i: number, p: Partial<Row>) => setRows((rs) => rs && rs.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <>
      <button onClick={() => ref.current?.click()} className="chip text-xs">🧾 Receipt</button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) read(f); }} />
      {rows && (
        <Sheet title="🧾 From the receipt" onClose={() => setRows(null)}>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt="" className="h-16 w-12 rounded-lg object-cover" />}
            <p className="text-xs text-muted flex-1">{busy ? <span className="animate-pulse text-[var(--accent2)]">🔍 Reading the receipt on your phone… no AI.</span> : rows.length ? "Untick anything you didn't eat or drink. Fix a name by typing it." : "Couldn't read item lines. Take the photo straight and close, in good light."}</p>
          </div>
          <div className="space-y-1">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl bg-white/5 px-2 py-1.5 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={r.on} onChange={(e) => set(i, { on: e.target.checked })} />
                <span className="flex-1 min-w-0">
                  <input className="input !py-0.5 !text-xs" value={r.food?.name ?? r.drink?.name ?? r.line} onChange={(e) => { const f = readFood(e.target.value, data.items); set(i, { drink: undefined, food: f ? { name: e.target.value, qty: r.qty, per: f.per, kcal: String(f.kcal), protein: String(f.protein ?? ""), contents: f.contents, auto: true } : { name: e.target.value, qty: r.qty } }); }} />
                  <span className="block text-[10px] text-muted truncate">{r.line}{r.price ? ` · ¥${r.price}` : ""}{r.qty > 1 ? ` · ×${r.qty}` : ""} · {r.drink ? `🥤 drink, ${r.drink.ml} ml` : r.food?.kcal ? `🍙 ${r.food.kcal} kcal per ${r.food.per}` : "not in the list: add its numbers after"}</span>
                </span>
              </div>
            ))}
          </div>
          {!busy && rows.some((r) => r.on) && <button onClick={add} className="btn-primary w-full">Add {rows.filter((r) => r.on).length} items</button>}
          <p className="text-[10px] text-muted text-center">Foods go into this meal; drinks are logged as drinks.</p>
        </Sheet>
      )}
    </>
  );
}

// ---------- 🍳 I cooked ----------
type Use = { name: string; qty: number; unit: string; kcal: number; protein: number; fat: number; carbs: number };

/** Nutrition of `qty` (in the item's own unit) of something from What I have. */
export function ingredient(p: Pick<PantryItem, "name" | "unit" | "kcal" | "protein" | "per" | "kg">, qty: number, items = [] as Parameters<typeof readFood>[1]): Use {
  const u = p.unit.toLowerCase();
  const grams = u === "g" || u === "ml" ? qty : u === "kg" || u === "l" ? qty * 1000 : p.kg ? qty * p.kg * 1000 : undefined;
  const base = perAmount(p.per);
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  if (p.kcal && base && grams) { kcal = p.kcal * grams / base; protein = (p.protein ?? 0) * grams / base; }
  else if (p.kcal && !base && !grams) { kcal = p.kcal * qty; protein = (p.protein ?? 0) * qty; }
  else {
    const f = readFood(grams ? `${Math.round(grams)} g ${p.name}` : `${qty} ${p.name}`, items);
    if (f) { kcal = f.kcal * f.qty; protein = f.protein * f.qty; fat = (f.fat ?? 0) * f.qty; carbs = (f.carbs ?? 0) * f.qty; }
  }
  return { name: p.name, qty, unit: p.unit, kcal: Math.round(kcal), protein: r1(protein), fat: r1(fat), carbs: r1(carbs) };
}

export function CookButton({ onFoods, photo }: { onFoods: (ds: Partial<Dish>[]) => void; photo?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="chip text-xs">🍳 I cooked</button>
      {open && <CookSheet photo={photo} onClose={() => setOpen(false)} onFoods={onFoods} />}
    </>
  );
}

function CookSheet({ onFoods, onClose, photo }: { onFoods: (ds: Partial<Dish>[]) => void; onClose: () => void; photo?: string }) {
  const { data, update } = useApp();
  const have = haveFoods(data.pantry).filter((p) => p.kind !== "drink");
  const recipes = data.items.filter((i) => i.category === "food" && Array.isArray(i.config.uses));
  const [name, setName] = useState("");
  const [uses, setUses] = useState<Use[]>([]);
  const [other, setOther] = useState("");
  const [serves, setServes] = useState(1);
  const add = (p: PantryItem) => setUses((us) => us.some((u) => u.name === p.name) ? us : [...us, ingredient(p, /^(g|ml)$/i.test(p.unit) ? 100 : /^(kg|l)$/i.test(p.unit) ? 0.15 : 1, data.items)]);
  const change = (i: number, qty: number) => setUses((us) => us.map((u, j) => { if (j !== i) return u; const p = data.pantry.find((x) => x.name === u.name) ?? { name: u.name, unit: u.unit }; return ingredient(p as PantryItem, qty, data.items); }));
  const addOther = () => { const f = readFood(other, data.items); if (!other.trim()) return; setUses((us) => [...us, f ? { name: f.name, qty: f.qty, unit: "", kcal: f.kcal * f.qty, protein: r1(f.protein * f.qty), fat: r1((f.fat ?? 0) * f.qty), carbs: r1((f.carbs ?? 0) * f.qty) } : { name: other.trim(), qty: 1, unit: "", kcal: 0, protein: 0, fat: 0, carbs: 0 }]); setOther(""); };
  const tot = uses.reduce((t, u) => ({ kcal: t.kcal + u.kcal, protein: t.protein + u.protein, fat: t.fat + u.fat, carbs: t.carbs + u.carbs }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
  const per = (x: number) => r1(x / serves);
  const loadRecipe = (c: Record<string, unknown>, n: string) => { setName(n); setUses((c.uses as Use[]) ?? []); setServes(Number(c.serves) || 1); };
  const done = () => {
    const dish = name.trim() || uses.map((u) => u.name).slice(0, 3).join(" + ") || "Home cooking";
    const contents = uses.map((u) => `${u.name} ${u.qty}${u.unit ? ` ${u.unit}` : ""}`).join(", ");
    // One serving eaten; the rest of the pot stays as the recipe.
    const share = uses.map((u) => ({ name: u.name, qty: +(u.qty / serves).toFixed(3) }));
    onFoods([{ name: dish, qty: 1, per: serves > 1 ? `1 of ${serves} servings` : "1 serving", kcal: String(Math.round(per(tot.kcal))), protein: String(per(tot.protein)), fat: String(per(tot.fat)), carbs: String(per(tot.carbs)), sugar: "", salt: "", contents, photo, uses: share, auto: false }]);
    // Saved as My food with its ingredients: next time it's one tap (and the photo finds it).
    const config = { emoji: "🍳", per: "1 serving", kcal: Math.round(per(tot.kcal)), protein: per(tot.protein), contents, uses, serves, photo };
    update((d) => ({ ...d, items: d.items.some((i) => i.category === "food" && i.name.toLowerCase() === dish.toLowerCase())
      ? d.items.map((i) => (i.category === "food" && i.name.toLowerCase() === dish.toLowerCase() ? { ...i, config: { ...i.config, ...config } } : i))
      : [...d.items, { id: crypto.randomUUID(), category: "food", name: dish, sort: Date.now(), config }] }));
    onClose();
  };
  return (
    <Sheet title="🍳 I cooked" onClose={onClose}>
      <p className="text-xs text-muted">Tap what you used from What I have and set how much. The app adds up the nutrition and takes it off What I have when you log the meal. No AI.</p>
      {recipes.length > 0 && <div className="flex flex-wrap gap-1">{recipes.slice(-12).reverse().map((r) => <button key={r.id} onClick={() => loadRecipe(r.config, r.name)} className="chip !py-0.5 text-[11px]">↺ {r.name}</button>)}</div>}
      <input className="input" placeholder="Dish name (e.g. chicken curry, egg fried rice)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="text-[10px] text-muted">From What I have</div>
      <div className="flex flex-wrap gap-1">
        {have.map((p) => <button key={p.id} onClick={() => add(p)} className={`chip !py-0.5 text-[11px] ${uses.some((u) => u.name === p.name) ? "chip-on" : ""}`}>{p.emoji} {p.name} <span className="text-muted">({p.qty} {p.unit})</span></button>)}
        {!have.length && <span className="text-[11px] text-muted">Nothing in What I have yet. Type ingredients below.</span>}
      </div>
      <div className="flex gap-2"><input className="input flex-1" placeholder="Other ingredient (e.g. 2 eggs, 150 g rice)" value={other} onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOther()} /><button onClick={addOther} className="btn-ghost !px-3">＋</button></div>
      <div className="space-y-1">
        {uses.map((u, i) => (
          <div key={u.name + i} className="rounded-xl bg-white/5 px-2 py-1 flex items-center gap-2 text-xs">
            <span className="flex-1 truncate">{u.name}</span>
            <input type="number" inputMode="decimal" className="input !w-20 !py-0.5 !text-xs" value={u.qty} onChange={(e) => change(i, Number(e.target.value) || 0)} />
            <span className="w-8 text-muted">{u.unit}</span>
            <span className="w-16 text-right text-muted">{u.kcal} kcal</span>
            <button onClick={() => setUses((us) => us.filter((_, j) => j !== i))} className="text-muted">✕</button>
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs">Servings in the pot <input type="number" min={1} className="input !w-16 !py-0.5" value={serves} onChange={(e) => setServes(Math.max(1, Number(e.target.value) || 1))} /> <span className="text-muted">(you eat one)</span></label>
      <div className="rounded-xl bg-white/5 p-2 text-sm flex justify-between"><span>Your serving</span><b>{Math.round(per(tot.kcal))} kcal · {per(tot.protein)} g protein</b></div>
      <button disabled={!uses.length} onClick={done} className="btn-primary w-full disabled:opacity-40">Add to this meal</button>
    </Sheet>
  );
}

/** Ingredients a cooked dish used come out of What I have too. */
export const usesOf = (foods: Eaten[]) => foods.flatMap((f) => (f.uses ?? []).map((u) => ({ name: u.name, qty: u.qty * (f.qty || 1), kcal: 0, protein: 0 })));
