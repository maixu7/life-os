"use client";

import { useRef } from "react";
import { aiPhoto, readMeal } from "@/lib/foodai";
import { readFood, readMealText, type MealFood } from "@/lib/foodtext";
import { allFoods, type Eaten } from "@/lib/body";
import { emojiFor } from "@/lib/emoji";
import { lookupBarcode } from "@/lib/foodlookup";
import { animeStyle, loadImage, recognise, smallPhoto } from "@/lib/foodphoto";
import { readLabel } from "@/lib/label";
import { foodGoodness } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { produceOf, PRODUCE, SIZES, sized, type Produce } from "@/lib/produce";
import { useApp, useCustomItems } from "@/lib/store";

// One food in a meal, with its own photo (what it looked like) and its own
// packet label photo (how many calories). Numbers are for ONE serving; the
// meal stores totals (× how many you ate).
export type Dish = {
  key: string; name: string; qty: number; per: string; contents?: string;
  kcal: string; protein: string; fat: string; carbs: string; sugar: string; salt: string;
  photo?: string; label?: string; status?: string; busy?: boolean; size?: string;
  // Numbers were filled in by the app (not typed or read from a label), so
  // renaming the food fills them again.
  auto?: boolean;
};

const blank = { per: "1 serving", kcal: "", protein: "", fat: "", carbs: "", sugar: "", salt: "", contents: undefined, size: undefined };
// A food the reader found, as an editable dish.
export function dishFrom(f: MealFood, photo?: string): Partial<Dish> {
  const s = (v?: number) => (v != null ? String(v) : "");
  return { name: f.name, qty: f.qty, per: f.per, kcal: String(f.kcal), protein: s(f.protein), fat: s(f.fat), carbs: s(f.carbs), sugar: s(f.sugar), salt: s(f.salt), contents: f.contents, photo, auto: true, size: undefined };
}

// A vegetable or fruit at one of 10 sizes: grams and nutrition scale with it.
export function sizeFill(p: Produce, size: string): Partial<Dish> {
  const s = sized(p, size);
  return { auto: true, size, per: `${size.toLowerCase()} ${p.name.toLowerCase()} (~${s.g} g)`, kcal: String(s.kcal), protein: String(s.protein), carbs: String(s.carbs), sugar: String(s.sugar), fat: String(s.fat), salt: "" };
}

const n = (s: string) => Number(s) || 0;
const r1 = (x: number) => Math.round(x * 10) / 10;
export const newDish = (name = ""): Dish => ({ key: Math.random().toString(36).slice(2), name, qty: 1, per: "1 serving", kcal: "", protein: "", fat: "", carbs: "", sugar: "", salt: "" });

// Saved meal foods back into editable dishes.
export function dishesFrom(foods: Eaten[] = []): Dish[] {
  return foods.map((f) => {
    const q = f.qty || 1, per = (x?: number) => (x ? String(r1(x / q)) : "");
    return { ...newDish(f.name), qty: q, per: f.per ?? "1 serving", contents: f.contents, kcal: per(f.kcal), protein: per(f.protein), fat: per(f.fat), carbs: per(f.carbs), sugar: per(f.sugar), salt: per(f.salt), photo: f.photo };
  });
}
// Dishes into what a meal log stores (totals).
export function dishTotals(d: Dish): Eaten {
  const t = (s: string) => (s ? r1(n(s) * d.qty) : undefined);
  return { name: d.name.trim() || "Food", qty: d.qty, per: d.per, contents: d.contents || undefined, kcal: Math.round(n(d.kcal) * d.qty), protein: t(d.protein) ?? 0, fat: t(d.fat), carbs: t(d.carbs), sugar: t(d.sugar), salt: t(d.salt), photo: d.photo };
}

export function DishCard({ d, set, remove, anime, addMore }: { d: Dish; set: (p: Partial<Dish>) => void; remove: () => void; anime: boolean; addMore?: (ds: Partial<Dish>[]) => void }) {
  const { data, session } = useApp();
  const { items, add, update } = useCustomItems("food");
  const pic = useRef<HTMLInputElement>(null), lab = useRef<HTMLInputElement>(null);
  const foods = allFoods(data.items);

  // A known food (built-in or saved from a label) fills its numbers in.
  const fill = (name: string, force = d.auto): Partial<Dish> => {
    if (!force && d.kcal) return {};
    const pr = name.trim().length > 2 ? produceOf(name) : undefined;
    if (pr) return sizeFill(pr, d.size ?? "Medium");
    // Your own saved food (from a label) wins, then the dish tables.
    const mine = items.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());
    const fd = mine && foods.find((x) => x.name.toLowerCase() === mine.name.toLowerCase());
    if (fd) {
      const c = mine.config ?? {};
      const s = (v: unknown) => (v != null && v !== "" ? String(v) : "");
      return { per: fd.per, kcal: String(fd.kcal), protein: String(fd.protein), fat: s(c.fat), carbs: s(c.carbs), sugar: s(c.sugar), salt: s(c.salt), contents: fd.contents, photo: d.photo || (c.photo ? String(c.photo) : undefined), auto: true, size: undefined };
    }
    const f = name.trim() ? readFood(name, data.items) : null;
    if (f) { const { name: _n, ...rest } = dishFrom(f, d.photo); void _n; return rest; }
    return force ? { ...blank, auto: false } : {};
  };
  // "rice and ramen" typed in one box becomes two foods.
  const named = (v: string) => {
    const m = readMealText(v, data.items);
    if (addMore && m.foods.length + m.unknown.length > 1 && m.foods.length && (d.auto || !d.kcal)) {
      set({ ...dishFrom(m.foods[0], d.photo), status: `Split into ${m.foods.length + m.unknown.length} foods.` });
      addMore([...m.foods.slice(1).map((f) => dishFrom(f)), ...m.unknown.map((u) => ({ name: u }))]);
    } else set(fill(v));
  };

  const takePhoto = async (f: File) => {
    const img = await loadImage(f);
    const photo = anime ? animeStyle(img, 160) : smallPhoto(img, 160);
    set({ photo, busy: true, status: "Looking at what's in it and how much…" });
    // The AI reader sees every food and its amount; the name you typed helps it.
    const r = await readMeal(session, { photo: aiPhoto(img), text: d.name }, items);
    if (r.ai && r.foods.length) {
      const [first, ...rest] = r.foods;
      set({ ...dishFrom(first, photo), busy: false, status: `${r.foods.length > 1 ? `Found ${r.foods.length} foods. ` : ""}${r.note}` });
      if (rest.length) addMore?.(rest.map((f) => dishFrom(f)));
      return;
    }
    if (r.ai) return set({ busy: false, status: "I couldn't see food in that photo. Type what it is." });
    if (d.name) return set({ busy: false, status: `Photo saved. Numbers come from the name you typed.${r.error ? ` (Photo reading failed: ${r.error})` : ""}` });
    try {
      const m = await recognise(img);
      const g = m.foods[0];
      if (g) set({ name: g, ...fill(g, true), busy: false, status: `Rough guess: ${g}. If that's wrong, type the real name and the numbers change.` });
      else set({ busy: false, status: `I see ${m.seen.slice(0, 2).join(" or ")}. Type the name or snap the label.` });
    } catch { set({ busy: false, status: "Type the name, or snap the label for the calories." }); }
  };

  const readPacket = async (files: File[]) => {
    set({ busy: true, status: "Reading the label (English + 日本語)… the first time downloads the reader." });
    let got: Partial<Dish> = {}, label = d.label, names: string[] = [];
    try {
      for (const f of files) {
        const img = await loadImage(f);
        label ||= smallPhoto(img, 120);
        const r = await readLabel(img);
        names = [...names, ...r.names];
        const s = (v?: number) => (v != null ? String(v) : undefined);
        got = Object.fromEntries(Object.entries({ kcal: s(r.kcal), protein: s(r.protein), fat: s(r.fat), carbs: s(r.carbs), sugar: s(r.sugar), salt: s(r.salt), per: r.per?.replace(/^1袋/, "1 bag ").replace(/^1個/, "1 piece ").replace(/^1本/, "1 bottle ").replace(/^1枚/, "1 piece "), contents: r.contents }).filter(([, v]) => v)) as Partial<Dish>;
        got = { ...got };
        if (!got.kcal && r.barcode) {
          const b = await lookupBarcode(r.barcode);
          if (b) { got.kcal = String(b.kcalServing ?? b.kcal100); got.protein = String(b.proteinServing ?? b.protein100); got.per = b.kcalServing ? b.serving : "100g"; names = [b.name, ...names]; }
        }
      }
    } catch {
      return set({ busy: false, label, status: "Couldn't load the label reader (needs internet the first time). Type the numbers." });
    }
    const name = d.name || names[0] || "";
    const next = { ...got, name, label, busy: false, auto: !got.kcal && d.auto, status: got.kcal ? `Read ${got.kcal} kcal per ${got.per ?? "serving"}. Saved to My foods for next time.` : "I couldn't find the calories. Take a straight, close photo of the nutrition table (栄養成分表示)." };
    set(next);
    // Remember it, so next time typing the name fills everything.
    if (got.kcal && name) {
      const cfg = { per: got.per ?? "1 serving", kcal: n(got.kcal), protein: n(got.protein ?? ""), fat: n(got.fat ?? "") || undefined, carbs: n(got.carbs ?? "") || undefined, sugar: n(got.sugar ?? "") || undefined, salt: n(got.salt ?? "") || undefined, contents: got.contents, photo: d.photo, emoji: emojiFor(name, "🍽️") };
      const had = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
      if (had) update(had.id, { config: { ...had.config, ...cfg } }); else add(name, cfg);
    }
  };

  const box = (src: string | undefined, label: string, icon: string, onClick: () => void) => (
    <button onClick={onClick} className="relative h-16 w-16 shrink-0 rounded-xl border border-dashed border-white/25 bg-white/[.04] grid place-items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : <span className="text-center text-[10px] leading-tight text-muted">{icon}<br />{label}</span>}
    </button>
  );
  const num = (k: "kcal" | "protein" | "fat" | "carbs" | "sugar" | "salt", l: string) => (
    <label className="text-[10px] text-muted">{l}<input className="input mt-0.5 !px-1.5 !py-1 text-xs" inputMode="decimal" value={d[k]} onChange={(e) => set({ [k]: e.target.value, auto: false })} /></label>
  );

  const pr = d.name.trim().length > 2 ? produceOf(d.name) : undefined;
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 space-y-2">
      <div className="flex gap-2">
        {box(d.photo, "Food photo", "📷", () => pic.current?.click())}
        {box(d.label, "Label photo", "🏷️", () => lab.current?.click())}
        <input ref={pic} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) takePhoto(f); e.target.value = ""; }} />
        <input ref={lab} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const l = [...(e.target.files ?? [])]; if (l.length) readPacket(l); e.target.value = ""; }} />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex gap-1">
            <input className="input !py-1.5 text-sm" list="all-foods" placeholder="What is it?" value={d.name}
              onChange={(e) => set({ name: e.target.value })} onBlur={(e) => named(e.target.value)} />
            <button aria-label={`Remove ${d.name || "food"}`} onClick={remove} className="text-muted px-1">✕</button>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button onClick={() => set({ qty: Math.max(0.5, d.qty - 0.5) })} className="chip !px-2 !py-0">−</button>
            <b className="w-7 text-center">{d.qty}</b>
            <button onClick={() => set({ qty: d.qty + 0.5 })} className="chip !px-2 !py-0">+</button>
            <input className="input !py-0.5 !px-1.5 text-[11px] flex-1 min-w-0" value={d.per} onChange={(e) => set({ per: e.target.value })} aria-label="Serving" />
          </div>
        </div>
      </div>
      {pr && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted">{pr.emoji} Size of the {pr.name.toLowerCase()} (medium ≈ {pr.g} g) · {pr.raw ? "fine to eat raw" : "cook it first"}{pr.vit.length ? ` · rich in ${pr.vit.slice(0, 3).join(", ")}` : ""}</div>
          <div className="flex flex-wrap gap-1">
            {SIZES.map(([s]) => <button key={s} onClick={() => set(sizeFill(pr, s))} className={`chip !px-1.5 !py-0 text-[10px] ${(d.size ?? "") === s ? "chip-on" : ""}`}>{s}</button>)}
          </div>
        </div>
      )}
      <div className="grid grid-cols-6 gap-1">{num("kcal", "kcal")}{num("protein", "Prot g")}{num("fat", "Fat g")}{num("carbs", "Carb g")}{num("sugar", "Sugar g")}{num("salt", "Salt g")}</div>
      {d.name.trim().length > 2 && <GoodBadge compact g={foodGoodness({ ...dishTotals(d), contents: d.contents })} />}
      {d.status && <p className={`text-[11px] ${d.busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{d.status}</p>}
      {n(d.kcal) > 0 && <div className="text-[11px] text-right">= <b>{Math.round(n(d.kcal) * d.qty)} kcal</b> · {r1(n(d.protein) * d.qty)} g protein</div>}
    </div>
  );
}

export function FoodNames() {
  const { data } = useApp();
  const names = [...new Set([...allFoods(data.items).map((f) => f.name), ...PRODUCE.map((p) => p.name)])];
  return <datalist id="all-foods">{names.map((n) => <option key={n} value={n} />)}</datalist>;
}
