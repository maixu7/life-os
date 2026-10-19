"use client";

import { StartButton } from "@/components/Doing";
import { useEffect, useMemo, useRef, useState } from "react";
import { readMealText } from "@/lib/foodtext";
import { dtLocal, Sheet } from "@/components/Sheet";
import { WhenPicker } from "@/components/When";
import { DishCard, dishesFrom, dishFrom, dishTotals, FoodNames, newDish, type Dish } from "@/components/Dishes";
import { aiPhotos, readMeal } from "@/lib/foodai";
import { animeStyle, loadImage, smallPhoto } from "@/lib/foodphoto";
import { energy, type Eaten } from "@/lib/body";
import { SnapChoice, useRememberSnap, type LabelRead, type Pick } from "@/components/SnapChoice";
import { foodPicks } from "@/lib/foodpicks";
import { haveFoods, recentFoods, takeFromPantry } from "@/lib/have";
import { DrinkSheet } from "@/components/Drinks";
import { allMealSlots, ICONS, MEAL_IDEAS, mealSlots, uid, type MealSlot } from "@/lib/layout";
import type { Ui } from "@/lib/ui";
import { toDay, useApp, type Log } from "@/lib/store";
import { CookButton, ReceiptButton, usesOf } from "@/components/FoodWays";

export const MEALS: [string, string][] = [["Breakfast", "🍳"], ["Lunch", "🍱"], ["Snack", "🍪"], ["Dinner", "🍛"]];
// Every meal and drink button, including your own (Control Centre or the ＋ on Food today).
export const useMealSlots = () => { const { profile } = useApp(); return mealSlots(profile.settings.ui); };
export const iconOfMeal = (name: string, ui?: Ui) => allMealSlots(ui).find((m) => m.label.toLowerCase() === name.toLowerCase())?.icon ?? MEALS.find(([m]) => m === name)?.[1] ?? "🍽️";

// Which meal fits the clock, so a photo at 1 PM becomes lunch.
export function mealFor(d: Date) {
  const h = d.getHours();
  return h >= 4 && h < 11 ? "Breakfast" : h >= 11 && h < 16 ? "Lunch" : h >= 16 && h < 19 ? "Snack" : "Dinner";
}

export const isMealLog = (l: Log, ui?: Ui) => l.kind === "meal" || (l.kind === "activity" && (!!l.data.meal || MEALS.some(([m]) => m.toLowerCase() === String(l.data.name).toLowerCase()) || allMealSlots(ui).some((m) => m.label.toLowerCase() === String(l.data.name).toLowerCase())));

// A meal is any number of foods. Each food has its own photo (shown in the
// Today table) and its own label photo (read for the calories).
export function MealSheet({ meal: initial, log, onClose, start, file, at }: { meal?: string; log?: Log; onClose: () => void; start?: string[]; file?: Blob[]; at?: Date }) {
  const { data, profile, logActivity, updateLog, celebrate, update } = useApp();
  const ui = profile.settings.ui;
  const slots = mealSlots(ui);
  const [meal, setMeal] = useState(initial ?? (log ? String(log.data.name) : mealFor(at ?? new Date())));
  const icon = iconOfMeal(meal, ui);
  const [when, setWhen] = useState(dtLocal(log ? new Date(log.created_at) : at ?? new Date()));
  const [dishes, setDishes] = useState<Dish[]>(() => {
    const had = dishesFrom(log?.data.foods as Eaten[] | undefined);
    if (had.length && log?.data.photo && !had[0].photo) had[0].photo = String(log.data.photo);
    return had.length ? had : (start?.length ? start : [""]).map((n) => newDish(n));
  });
  const [contents, setContents] = useState(String(log?.data.note ?? ""));
  const [anime, setAnime] = useState(false);
  const set = (key: string) => (p: Partial<Dish>) => setDishes((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)));
  const foods = dishes.filter((d) => d.name.trim() || Number(d.kcal)).map(dishTotals);
  const kcal = foods.reduce((n, x) => n + x.kcal, 0);
  const protein = Math.round(foods.reduce((n, x) => n + x.protein, 0));
  // Quick picks: what you have at home and what you ate lately.
  const quick = [...new Set([...haveFoods(data.pantry).map((p) => p.name), ...recentFoods(data.logs)])].filter((nm) => !dishes.some((d) => d.name === nm)).slice(0, 14);

  // One tap: the same as yesterday's meal, or what you usually have for it.
  const past = useMemo(() => {
    const mine = data.logs.filter((l) => isMealLog(l, ui) && String(l.data.name).toLowerCase() === meal.toLowerCase() && (l.data.foods as Eaten[] | undefined)?.length && l.id !== log?.id);
    const yday = toDay(new Date(Date.now() - 86_400_000));
    const y = [...mine].reverse().find((l) => l.day === yday);
    const since = Date.now() - 30 * 86_400_000, count = new Map<string, { n: number; foods: Eaten[] }>();
    for (const l of mine) {
      if (new Date(l.created_at).getTime() < since) continue;
      const foods = l.data.foods as Eaten[], k = foods.map((f) => f.name).sort().join(" + ");
      count.set(k, { n: (count.get(k)?.n ?? 0) + 1, foods });
    }
    const usual = [...count.values()].sort((a, b) => b.n - a.n)[0];
    return { y: y?.data.foods as Eaten[] | undefined, usual: usual && usual.n >= 2 ? usual.foods : undefined };
  }, [data.logs, meal, ui, log?.id]);
  const takeFoods = (fs: Eaten[]) => setDishes((ds) => [...ds.filter((x) => x.name.trim() || Number(x.kcal) || x.photo), ...dishesFrom(fs)]);
  const save = () => {
    const first = foods.find((f) => f.photo)?.photo;
    const payload = { name: meal, emoji: icon, meal: true, foods, kcal, note: contents || undefined, photo: first };
    if (log) updateLog(log.id, { data: payload, at: new Date(when) });
    else {
      const row = logActivity("activity", payload, new Date(when));
      // Eaten food comes out of "What I have".
      update((d) => ({ ...d, pantry: takeFromPantry(d.pantry, [...foods, ...usesOf(foods)]) }));
      celebrate({ title: "ITADAKIMASU!", subtitle: `${meal} · ${foods.length} food${foods.length === 1 ? "" : "s"}${kcal ? ` · ${kcal} kcal · ${protein} g protein` : ""}`, xp: row.xp, icon: payload.emoji });
    }
    onClose();
  };

  return (
    <Sheet title={`${icon} ${meal}`} onClose={onClose}>
      <FoodNames />
      <div className="flex flex-wrap gap-1.5">
        {[...slots.filter((m) => !m.drink), ...(slots.some((m) => m.label === meal) ? [] : [{ id: "cur", icon, label: meal }])].map((m) => <button key={m.id} onClick={() => setMeal(m.label)} className={`chip !px-2 text-xs ${meal === m.label ? "chip-on" : ""}`}>{m.icon} {m.label}</button>)}
      </div>
      <WhenPicker label="When did you eat" value={when} onChange={setWhen} />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Each food: 📷 its photo, 🏷️ its packet label (reads the calories).</span>
        <button onClick={() => setAnime(!anime)} className={`chip !py-0.5 text-[11px] shrink-0 ${anime ? "chip-on" : ""}`}>🎨 Anime</button>
      </div>
      {!log && (past.y || past.usual) && (
        <div className="grid grid-cols-2 gap-2">
          {past.y && <button onClick={() => takeFoods(past.y!)} className="btn-ghost !py-2 text-xs text-left">🔁 Same as yesterday<span className="block text-[10px] text-muted truncate">{past.y.map((f) => f.name).join(" + ")}</span></button>}
          {past.usual && <button onClick={() => takeFoods(past.usual!)} className="btn-ghost !py-2 text-xs text-left">⭐ My usual {meal.toLowerCase()}<span className="block text-[10px] text-muted truncate">{past.usual.map((f) => f.name).join(" + ")}</span></button>}
        </div>
      )}
      {!log && <WholeMeal anime={anime} file={file} onFoods={(ps) => setDishes((ds) => [...ds.filter((x) => x.name.trim() || Number(x.kcal) || x.photo), ...ps.map((p) => ({ ...newDish(), ...p }))])} />}
      <div className="space-y-2">
        {dishes.map((d) => <DishCard key={d.key} d={d} set={set(d.key)} anime={anime} addMore={(ps) => setDishes((ds) => { const i = ds.findIndex((x) => x.key === d.key); return [...ds.slice(0, i + 1), ...ps.map((p) => ({ ...newDish(), ...p })), ...ds.slice(i + 1)]; })} remove={() => setDishes((ds) => (ds.length > 1 ? ds.filter((x) => x.key !== d.key) : [newDish()]))} />)}
      </div>
      <button onClick={() => setDishes([...dishes, newDish()])} className="btn-ghost w-full border border-dashed border-white/25">＋ Add another food</button>
      {quick.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quick.map((nm) => <button key={nm} onClick={() => setDishes((ds) => [...ds.filter((x) => x.name || x.kcal || x.photo), newDish(nm)])} className="chip !py-0.5 text-[11px]">+ {nm}</button>)}
        </div>
      )}
      <textarea className="input min-h-12 text-sm" placeholder="Notes (home made, how much oil…)" value={contents} onChange={(e) => setContents(e.target.value)} />
      <div className="rounded-xl bg-white/5 p-3 text-sm flex justify-between"><span>Total ({foods.length})</span><b>{kcal} kcal · {protein} g protein</b></div>
      <button onClick={save} className="btn-primary w-full">{log ? "Save changes" : `Log ${meal.toLowerCase()} (eaten)`}</button>
      {!log && <StartButton onClick={save} label="▶ Start eating, tick Complete after" />}
    </Sheet>
  );
}

// Base Camp and Food: today's meal and drink buttons with photos and the
// calories so far. ＋ adds your own button (any name, any icon).
export function MealsCard() {
  const { data, profile } = useApp();
  const ui = profile.settings.ui;
  const slots = mealSlots(ui);
  const day = toDay(new Date());
  const [open, setOpen] = useState<{ meal?: string; log?: Log } | null>(null);
  const [drink, setDrink] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const logs = data.logs.filter((l) => l.day === day && isMealLog(l, ui));
  const drinks = data.logs.filter((l) => l.day === day && ["drink", "water", "milk"].includes(l.kind));
  const e = energy(data, day);
  const pct = Math.min(100, (e.intake / Math.max(1, e.out)) * 100);
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">🍱 Food today</h2>
        <span className="text-xs text-muted">{e.intake} / {e.out} kcal · {e.protein} g protein</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${pct}%` }} /></div>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((m) => {
          const done = m.drink ? drinks.filter((l) => l.data.slot === m.label) : logs.filter((l) => String(l.data.name).toLowerCase() === m.label.toLowerCase());
          const last = done[done.length - 1];
          const pic = last?.data.photo ? String(last.data.photo) : "";
          return (
            <button key={m.id} onClick={() => (m.drink ? setDrink(m.label) : setOpen(last ? { log: last } : { meal: m.label }))}
              className={`relative rounded-2xl border bg-white/[.04] p-1 pb-1.5 flex flex-col items-center gap-1 active:scale-95 ${done.length ? "border-emerald-400/60" : "border-white/10"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {pic ? <img src={pic} alt={m.label} className="h-10 w-10 rounded-xl object-cover" /> : <span className="text-2xl h-10 grid place-items-center">{m.icon}</span>}
              <span className="text-[10px] leading-tight text-center line-clamp-2">{m.label}</span>
              {done.length > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-[11px] grid place-items-center">{done.length > 1 ? done.length : "✓"}</span>}
            </button>
          );
        })}
        <button onClick={() => setOpen({})} className="rounded-2xl border border-dashed border-white/25 p-1 flex flex-col items-center justify-center gap-1 active:scale-95">
          <span className="text-2xl h-10 grid place-items-center">📷</span><span className="text-[10px]">Photo</span>
        </button>
        <button onClick={() => setAdding(true)} aria-label="Add a food or drink button" className="rounded-2xl border border-dashed border-[var(--accent2)]/50 p-1 flex flex-col items-center justify-center gap-1 active:scale-95">
          <span className="text-2xl h-10 grid place-items-center text-[var(--accent2)]">＋</span><span className="text-[10px]">Add button</span>
        </button>
      </div>
      {logs.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {logs.map((l) => (
            <li key={l.id}><button onClick={() => setOpen({ log: l })} className="w-full flex gap-2 text-left">
              <span className="text-muted w-14 shrink-0">{new Date(l.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              <FoodThumbs foods={l.data.foods as Eaten[] | undefined} />
              <span className="flex-1 truncate">{String(l.data.emoji ?? "")} {String(l.data.name)}: {((l.data.foods as { name: string }[]) ?? []).map((f) => f.name).join(", ") || String(l.data.note ?? "no foods added")}</span>
              {Number(l.data.kcal) > 0 && <b>{String(l.data.kcal)} kcal</b>}
            </button></li>
          ))}
        </ul>
      )}
      {open && <MealSheet meal={open.meal} log={open.log} onClose={() => setOpen(null)} />}
      {drink && <DrinkSheet slot={drink} start={drink} onClose={() => setDrink(null)} />}
      {adding && <MealSlotSheet onClose={() => setAdding(false)} />}
    </section>
  );
}

// Add or edit a food or drink button: name, icon, eat or drink. Built-in
// buttons can be hidden but not deleted.
export function MealSlotSheet({ slot, onClose }: { slot?: MealSlot; onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const ui = profile.settings.ui ?? {};
  const [label, setLabel] = useState(slot?.label ?? "");
  const [icon, setIcon] = useState(slot?.icon ?? "🍽️");
  const [isDrink, setDrink] = useState(!!slot?.drink);
  const save = () => {
    if (!label.trim()) return;
    if (slot?.builtIn) { saveSettings({ ui: { ...ui, names: { ...ui.names, [slot.id]: { icon, label: label.trim() } } } }); onClose(); return; }
    const m: MealSlot = { id: slot?.id ?? `m-${uid()}`, icon, label: label.trim(), drink: isDrink };
    const meals = ui.meals ?? [];
    saveSettings({ ui: { ...ui, meals: meals.some((x) => x.id === m.id) ? meals.map((x) => (x.id === m.id ? m : x)) : [...meals, m] } });
    onClose();
  };
  const del = () => { if (slot && !slot.builtIn) { saveSettings({ ui: { ...ui, meals: (ui.meals ?? []).filter((x) => x.id !== slot.id) } }); onClose(); } };
  return (
    <Sheet title={slot ? `✏️ ${slot.label}` : "＋ New food or drink button"} onClose={onClose}>
      <div className="grid grid-cols-[4rem_1fr] gap-2">
        <input aria-label="Icon" className="input text-center text-2xl" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <input className="input" placeholder="Name (Onigiri, Coffee, Protein shake…)" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      {!slot?.builtIn && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setDrink(false)} className={`chip justify-center ${!isDrink ? "chip-on" : ""}`}>🍽️ Something I eat</button>
          <button onClick={() => setDrink(true)} className={`chip justify-center ${isDrink ? "chip-on" : ""}`}>🥤 Something I drink</button>
        </div>
      )}
      <div className="text-xs text-muted">Pick an icon (or type any emoji above)</div>
      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
        {ICONS.map((x) => <button key={x} onClick={() => setIcon(x)} className={`h-9 w-9 rounded-lg text-xl ${icon === x ? "bg-[var(--accent2)]/30 ring-1 ring-[var(--accent2)]" : "bg-white/5"}`}>{x}</button>)}
      </div>
      {!slot && (
        <>
          <div className="text-xs text-muted">Ideas</div>
          <div className="flex flex-wrap gap-1">
            {MEAL_IDEAS.map(([e, n, d]) => <button key={n} onClick={() => { setIcon(e); setLabel(n); setDrink(!!d); }} className="chip !py-0.5 text-[11px]">{e} {n}</button>)}
          </div>
        </>
      )}
      <div className="flex gap-2">
        {slot && !slot.builtIn && <button onClick={del} className="btn-ghost text-rose-300">Delete</button>}
        <button onClick={save} disabled={!label.trim()} className="btn-primary flex-1">Save</button>
      </div>
      <p className="text-[10px] text-muted">Move, hide or edit every button in 🎛️ Control Centre → Food buttons.</p>
    </Sheet>
  );
}

// Small photos of each food in a meal.
export function FoodThumbs({ foods, size = 22 }: { foods?: Eaten[]; size?: number }) {
  const pics = (foods ?? []).filter((f) => f.photo);
  if (!pics.length) return null;
  return (
    <span className="flex -space-x-1.5 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pics.slice(0, 5).map((f, i) => <img key={i} src={f.photo} alt={f.name} title={f.name} style={{ width: size, height: size }} className="rounded-md object-cover ring-1 ring-black/40" />)}
    </span>
  );
}

// Snap the whole plate or say the whole meal; every food is found with its amount.
function WholeMeal({ anime, file, onFoods }: { anime: boolean; file?: Blob[]; onFoods: (ds: Partial<Dish>[]) => void }) {
  const { data: d0 } = useApp();
  type Pic = { ai: string; small: string; imgs: HTMLImageElement[] };
  const [ask, setAsk] = useState<Pic | null>(null);
  const [offer, setOffer] = useState(false); // typed words not all in the list → Ask AI button
  // The app's own food list: your foods, everyday foods and chain-shop dishes.
  const { picks, nums } = useMemo(() => foodPicks(d0), [d0]);
  const { data, session } = useApp();
  const [say, setSay] = useState("");
  const [pic, setPic] = useState<Pic | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  // One photo or several (the plate, the packet front and back).
  const takePhoto = async (fs: Blob[]) => {
    const imgs = await Promise.all(fs.map(loadImage));
    const p = { ai: aiPhotos(imgs), small: anime ? animeStyle(imgs[0], 160) : smallPhoto(imgs[0], 160), imgs };
    setPic(p); setAsk(p);
  };
  const rememberAI = useRememberSnap();
  // From the list; the label's own numbers win when it could read them.
  const picked = (x: Pick, l?: LabelRead) => {
    const n = nums.get(x.name);
    const fromLabel = l?.kcal != null ? { per: l.per ?? "1 serving", kcal: String(l.kcal), protein: l.protein != null ? String(l.protein) : "", fat: l.fat != null ? String(l.fat) : "", carbs: l.carbs != null ? String(l.carbs) : "", sugar: l.sugar != null ? String(l.sugar) : "", salt: l.salt != null ? String(l.salt) : "", contents: l.contents, facts: l.facts } : null;
    // A dish you cooked before brings its ingredients (taken off What I have).
    const mine = data.items.find((i) => i.category === "food" && i.name === x.name && Array.isArray(i.config.uses));
    const uses = mine ? (mine.config.uses as { name: string; qty: number }[]).map((u) => ({ name: u.name, qty: +(u.qty / (Number(mine.config.serves) || 1)).toFixed(3) })) : undefined;
    onFoods([{ name: x.name, photo: ask?.small, auto: !fromLabel, uses, ...(mine?.config.contents ? { contents: String(mine.config.contents) } : {}), ...(fromLabel ?? (n ? { per: n.per, kcal: String(n.kcal), protein: String(n.protein) } : {})) }]);
    setPic(null); setMsg(`${fromLabel ? "🏷️" : "📋"} ${x.name} (${fromLabel ? "numbers from the label" : "from the list"}). Check the amount below.`);
  };
  // A photo saved with "Scan later" opens straight away.
  useEffect(() => { if (file?.length) takePhoto(file); }, [file]); // eslint-disable-line react-hooks/exhaustive-deps
  // Photo → AI only from the Ask AI button. Words → the app's food tables first;
  // AI only when you tap Ask AI.
  const read = async (photo?: Pic | null, askAI = false) => {
    if (!photo && !say.trim()) { if (pic) setAsk(pic); return; }
    setOffer(false);
    if (!photo && !askAI) {
      const { foods, unknown } = readMealText(say, data.items);
      if (foods.length) {
        onFoods([...foods.map((f, i) => dishFrom(f, i === 0 ? pic?.small : undefined)), ...unknown.map((u) => ({ name: u }))]);
        const total = foods.reduce((n, f) => n + f.kcal * f.qty, 0);
        setMsg(`📖 ${foods.map((f) => f.name).join(" + ")}${total ? ` ≈ ${total} kcal` : ""} (from the list).${unknown.length ? ` Not in the list: ${unknown.join(", ")}. Add their numbers below, or tap Ask AI.` : ""} Check the amounts below.`);
        if (unknown.length) setOffer(true); else { setSay(""); setPic(null); }
      } else { setOffer(true); setMsg("📋 Not in the app's food list. Check the spelling, add it below with its numbers, or tap Ask AI."); }
      return;
    }
    setBusy(true); setMsg(photo ? "🤖 AI is looking at every food on the plate and how much…" : "🤖 Asking AI…");
    const r = await readMeal(session, { photo: photo?.ai, text: say }, data.items);
    setBusy(false);
    if (r.foods.length || r.unknown?.length) {
      if (photo && r.ai && r.foods[0]) rememberAI(r.foods.map((f) => f.name).join(" + "), "🍱");
      onFoods([...r.foods.map((f, i) => dishFrom(f, i === 0 ? photo?.small : undefined)), ...(r.unknown ?? []).map((u) => ({ name: u }))]);
      const total = r.foods.reduce((n, f) => n + f.kcal * f.qty, 0);
      setMsg(`${r.ai ? "🤖" : "📖"} ${r.foods.map((f) => f.name).join(" + ")}${total ? ` ≈ ${total} kcal` : ""}. ${r.note}${!r.ai ? ` (AI failed: ${r.error || "unknown"}. I used the list.)` : ""} Check the amounts below.`);
      setSay(""); setPic(null);
    } else if (!r.ai) setMsg(`AI failed: ${r.error || "unknown"}. Type what's in it, like "big bowl rice and instant ramen", then tap Find.`);
    else setMsg("AI couldn't see food there. Try a closer photo or type it.");
  };
  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-2.5 space-y-2">
      <div className="text-xs font-semibold">🔍 Snap or say the whole meal <span className="font-normal text-muted">(several photos OK)</span></div>
      <div className="flex gap-2">
        <button onClick={() => ref.current?.click()} className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-white/25 grid place-items-center overflow-hidden text-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pic ? <img src={pic.small} alt="Meal" className="h-full w-full object-cover" /> : "📷"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" multiple onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) takePhoto(f); }} />
        {ask && <SnapChoice photo={ask.small} img={ask.imgs} list={picks} what="food" kind="food" onClose={() => setAsk(null)} onAI={() => read(ask)}
          onPick={picked} />}
        <textarea className="input flex-1 min-h-14 text-sm" placeholder="big bowl of rice and instant ramen, 2 eggs…" value={say} onChange={(e) => { setSay(e.target.value); setOffer(false); }} />
      </div>
      <div className="flex flex-wrap gap-1.5 items-center"><span className="text-[10px] text-muted">Also, no AI:</span><ReceiptButton onFoods={onFoods} /><CookButton onFoods={onFoods} photo={pic?.small} /></div>
      <button disabled={busy || (!say.trim() && !pic)} onClick={() => read()} className="btn-primary w-full !py-1.5 text-sm disabled:opacity-40">{busy ? "Reading…" : say.trim() || !pic ? "Find in the list" : "📋 Pick the photo from the list"}</button>
      {offer && !busy && <button onClick={() => read(null, true)} className="btn-ghost w-full !py-1.5 text-sm ring-1 ring-[var(--accent)]">🤖 Ask AI about &quot;{say.trim().slice(0, 30)}&quot;</button>}
      {msg && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
    </div>
  );
}
