"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { isMealLog, MealSheet } from "@/components/Meals";
import { fireAlarm } from "@/lib/alarm";
import { bodyOf, energy, guessFood, type Eaten } from "@/lib/body";
import { bedAt, cutoffOf, DAY_LIMIT, doses, hourText, left } from "@/lib/caffeine";
import { bestCombos, bestDishes, CHAIN_LIST, COMBO_GOALS, EAT_GOALS, KONBINI_PICKS, type ComboGoal, type EatGoal } from "@/lib/cheapeats";
import { haveFoods, takeFromPantry } from "@/lib/have";
import { weekFood } from "@/lib/money";
import { matchRecipes, type Recipe } from "@/lib/recipes";
import { sched, toMin, within } from "@/lib/schedule";
import { toDay, useApp, useCustomItems, type Log } from "@/lib/store";

// Food extras: one-tap usual meals, the protein target, caffeine and the water
// bottle, recipes from what you have, konbini and chain-restaurant picks, and
// what food costs each week.

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`;
const clean = (fs: Eaten[]) => fs.map(({ photo: _p, ...f }) => { void _p; return f; });
const sumK = (fs: Eaten[]) => fs.reduce((n, f) => n + (f.kcal || 0), 0);
const sumP = (fs: Eaten[]) => Math.round(fs.reduce((n, f) => n + (f.protein || 0), 0));

// Logs a ready-made meal. Bought food (konbini, eating out) is also added to
// spending, so it counts in Money and in the weekly food cost.
export function useEatLog() {
  const { logActivity, update, celebrate } = useApp();
  return (meal: string, foods: Eaten[], o: { emoji?: string; yen?: number; cat?: string; fromHome?: boolean; note?: string } = {}) => {
    const kcal = sumK(foods);
    const row = logActivity("activity", { name: meal, emoji: o.emoji ?? "🍽️", meal: true, foods, kcal, note: o.note, yen: o.yen });
    update((d) => ({
      ...d,
      pantry: o.fromHome ? takeFromPantry(d.pantry, foods) : d.pantry,
      shopping: o.yen ? [...d.shopping, {
        id: crypto.randomUUID(), name: o.note ?? foods.map((f) => f.name).join(" + "), emoji: o.emoji ?? "🍽️", qty: 1, unit: "pcs", price: o.yen,
        category: o.cat ?? "Eating out", note: "", photo_id: null, status: "purchased" as const, purchased_at: new Date().toISOString(), created_at: new Date().toISOString(),
      }] : d.shopping,
    }));
    celebrate({ title: "ITADAKIMASU!", subtitle: `${meal} · ${kcal} kcal · ${sumP(foods)} g protein${o.yen ? ` · ${yen(o.yen)}` : ""}`, xp: row.xp, icon: o.emoji ?? "🍽️" });
  };
}
const mealWord = (h: number) => (h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 19 ? "Snack" : "Dinner");

// ---------- 15. Repeat yesterday / my usual meals ----------
export function UsualMeals() {
  const { data, profile } = useApp();
  const ui = profile.settings.ui;
  const { items, add, remove } = useCustomItems("usual_meal");
  const eat = useEatLog();
  const day = toDay(new Date()), yday = toDay(new Date(Date.now() - 86_400_000));
  const meals = (d: string) => data.logs.filter((l) => l.day === d && isMealLog(l, ui) && (l.data.foods as Eaten[] | undefined)?.length);
  const yest = meals(yday), today = meals(day);
  const saved = (l: Log) => items.some((i) => String(i.config.meal) === String(l.data.name) && JSON.stringify((i.config.foods as Eaten[]).map((f) => f.name)) === JSON.stringify((l.data.foods as Eaten[]).map((f) => f.name)));
  const foodsOf = (l: Log) => clean(l.data.foods as Eaten[]);
  const names = (fs: Eaten[]) => fs.map((f) => f.name).join(", ");
  const again = (meal: string, emoji: string, fs: Eaten[]) => eat(meal, fs, { emoji, fromHome: true });
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-2">⭐ One-tap meals</h2>
      {items.length === 0 && yest.length === 0 && <p className="text-xs text-muted">Log a meal with its foods, then tap ⭐ on it to make it your usual. Yesterday&apos;s meals show here for one-tap repeat.</p>}
      {items.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {items.map((i) => {
            const fs = i.config.foods as Eaten[];
            return (
              <div key={i.id} className="flex items-center gap-2 text-xs">
                <button onClick={() => again(String(i.config.meal), String(i.config.emoji ?? "⭐"), fs)} className="flex-1 min-w-0 rounded-xl bg-[var(--accent2)]/10 border border-[var(--accent2)]/40 px-2 py-1.5 text-left">
                  <b>{String(i.config.emoji ?? "⭐")} {i.name}</b> <span className="text-muted">· {sumK(fs)} kcal · {sumP(fs)} g protein</span><br /><span className="text-muted truncate block">{names(fs)}</span>
                </button>
                <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)} className="text-muted px-1">✕</button>
              </div>
            );
          })}
        </div>
      )}
      {yest.length > 0 && <div className="text-[11px] text-muted mb-1">↺ Eat yesterday&apos;s again (one tap logs it now)</div>}
      <div className="flex flex-wrap gap-1.5">
        {yest.map((l) => <button key={l.id} onClick={() => again(String(l.data.name), String(l.data.emoji ?? "🍽️"), foodsOf(l))} className="chip !py-1 text-[11px] text-left">↺ {String(l.data.emoji ?? "")} {String(l.data.name)}: {names(foodsOf(l)).slice(0, 40)}</button>)}
      </div>
      {[...today, ...yest].filter((l) => !saved(l)).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...today, ...yest].filter((l) => !saved(l)).slice(0, 6).map((l) => (
            <button key={l.id} onClick={() => add(`My usual ${String(l.data.name).toLowerCase()}`, { meal: String(l.data.name), emoji: l.data.emoji ?? "⭐", foods: foodsOf(l) })} className="chip !py-0.5 text-[10px] text-muted">⭐ Save {l.day === day ? "today's" : "yesterday's"} {String(l.data.name).toLowerCase()} as usual</button>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- 17. Protein target bar ----------
const PROTEIN_IDEAS: [string, number, string][] = [
  ["Salad chicken", 24, "🍗"], ["Canned mackerel", 30, "🐟"], ["Canned tuna", 13, "🐟"], ["Natto", 8, "🫘"], ["Egg", 6, "🥚"],
  ["Tofu (half block)", 10, "🧈"], ["Greek yogurt", 10, "🥛"], ["Milk (glass)", 8, "🥛"], ["Edamame", 11, "🫛"], ["Chicken breast (100 g)", 23, "🍗"],
];
export function ProteinCard() {
  const { data, profile, saveSettings } = useApp();
  const [eat, setEat] = useState<string[] | null>(null);
  const [edit, setEdit] = useState(false);
  const b = bodyOf(data);
  const goal = profile.settings.protein_goal_g || b.proteinNeed;
  const got = energy(data, toDay(new Date())).protein;
  const need = Math.max(0, goal - got);
  const pct = Math.min(100, (got / Math.max(1, goal)) * 100);
  // What gets you there: food you have first, then cheap everyday picks.
  const plan = useMemo(() => {
    if (need <= 0) return [];
    const have = haveFoods(data.pantry).map((p) => ({ name: p.name, emoji: p.emoji, g: p.protein ?? guessFood(p.name, data.items)?.protein ?? 0, home: true })).filter((x) => x.g >= 4).sort((a, b) => b.g - a.g);
    const out: { name: string; emoji: string; g: number; home: boolean }[] = [];
    let left = need;
    for (const x of [...have, ...PROTEIN_IDEAS.map(([name, g, emoji]) => ({ name, g, emoji, home: false }))]) {
      if (left <= 0 || out.length >= 4) break;
      if (out.some((o) => o.name === x.name)) continue;
      out.push(x); left -= x.g;
    }
    return out;
  }, [need, data.pantry, data.items]);
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">🥚 Protein today</h2>
        <button onClick={() => setEdit(!edit)} className="text-xs text-muted">{got} / {goal} g ✎</button>
      </div>
      <div className="bar"><div style={{ width: `${pct}%`, background: pct >= 100 ? "#34d399" : undefined }} /></div>
      {edit && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <button onClick={() => saveSettings({ protein_goal_g: undefined })} className={`chip !py-0.5 ${!profile.settings.protein_goal_g ? "chip-on" : ""}`}>Health {b.proteinNeed} g</button>
          <button onClick={() => saveSettings({ protein_goal_g: b.proteinBuild })} className={`chip !py-0.5 ${profile.settings.protein_goal_g === b.proteinBuild ? "chip-on" : ""}`}>💪 Build muscle {b.proteinBuild} g</button>
          <input aria-label="Own protein goal" className="input !w-20 !py-0.5 text-xs" inputMode="numeric" placeholder="Own g" onBlur={(e) => Number(e.target.value) > 0 && saveSettings({ protein_goal_g: Number(e.target.value) })} />
          <span className="w-full text-muted">Health is 0.8 g per kg ({b.kg} kg). Training hard: 1.6 g per kg.</span>
        </div>
      )}
      {need <= 0 ? <p className="mt-2 text-xs text-emerald-300">✓ Protein goal reached. Your muscles thank you.</p> : (
        <div className="mt-2 text-xs">
          <p className="text-muted mb-1">{need} g to go. Eat this to reach it:</p>
          <div className="flex flex-wrap gap-1">
            {plan.map((x) => <span key={x.name} className={`chip !py-0.5 text-[11px] ${x.home ? "border-emerald-400/50" : ""}`}>{x.emoji} {x.name} +{Math.round(x.g)} g{x.home ? " · have" : ""}</span>)}
          </div>
          {plan.length > 0 && <button onClick={() => setEat(plan.map((x) => x.name))} className="btn-ghost w-full mt-2 !py-1.5 text-xs border border-white/15">🍽️ Eat these now</button>}
        </div>
      )}
      {eat && <MealSheet meal={mealWord(new Date().getHours())} start={eat} onClose={() => setEat(null)} />}
    </section>
  );
}

// ---------- 23. Caffeine ----------
export function CaffeineCard() {
  const { data, profile, saveSettings } = useApp();
  const ds = doses(data);
  const now = new Date();
  const bed = bedAt(sched(profile.settings.schedule).sleep, now);
  const total = ds.reduce((n, x) => n + x.mg, 0);
  const atBed = left(ds, bed);
  const cut = cutoffOf(data);
  const late = ds.filter((x) => x.at.getHours() >= cut);
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">☕ Caffeine</h2>
        <span className="text-xs text-muted">{total} / {DAY_LIMIT} mg</span>
      </div>
      <div className="bar"><div style={{ width: `${Math.min(100, (total / DAY_LIMIT) * 100)}%`, background: total > DAY_LIMIT ? "#ff3b5c" : undefined }} /></div>
      <p className="mt-2 text-xs text-muted">
        {ds.length ? <>Still in you at bedtime: <b className={atBed >= 50 ? "text-rose-300" : "text-emerald-300"}>~{atBed} mg</b>{atBed >= 50 ? " (enough to make sleep lighter)" : " (fine for sleep)"}.</> : "No caffeine today."}
        {now.getHours() >= cut ? <span className="text-amber-300"> 🚫 It&apos;s after {hourText(cut)}: no more coffee, tea or energy drinks today, for sleep.</span> : <> Last coffee before {hourText(cut)}.</>}
      </p>
      {late.length > 0 && <p className="text-[11px] text-rose-300 mt-1">⚠️ {late.map((x) => x.name).join(", ")} after {hourText(cut)}. Try barley tea (麦茶) or water instead.</p>}
      <div className="mt-2 flex gap-1 text-[11px] items-center"><span className="text-muted">Cut-off:</span>
        {[13, 14, 15, 16].map((h) => <button key={h} onClick={() => saveSettings({ caffeine_cutoff: h })} className={`chip !py-0 ${cut === h ? "chip-on" : ""}`}>{hourText(h)}</button>)}
      </div>
    </section>
  );
}
// Shown in the drink picker when a caffeinated drink is picked late in the day.
export function CaffeineWarning({ mg }: { mg: number }) {
  const { data, profile } = useApp();
  const now = new Date();
  const cut = cutoffOf(data);
  if (mg <= 0 || now.getHours() < cut) return null;
  const bed = bedAt(sched(profile.settings.schedule).sleep, now);
  const atBed = Math.round(mg * 0.5 ** ((bed.getTime() - now.getTime()) / 3_600_000 / 5));
  return <p className="text-[11px] text-amber-300">☕ It&apos;s after {hourText(cut)}. About {atBed} mg of this will still be in you at bedtime and make sleep lighter. Barley tea or water instead?</p>;
}

// ---------- 22. Water bottle ----------
export function BottleCard() {
  const { data, profile, saveSettings, logActivity, celebrate } = useApp();
  const s = profile.settings;
  const bottle = s.bottle_ml || 500;
  const day = toDay(new Date());
  const water = data.logs.filter((l) => l.day === day && l.kind === "water");
  const ml = water.reduce((n, l) => n + (Number(l.data.ml) || 0), 0);
  const want = Math.max(1, Math.ceil(s.water_goal_ml / bottle));
  const done = ml / bottle;
  const every = sched(s.schedule).waterEvery;
  const last = water[water.length - 1];
  const next = last ? new Date(new Date(last.created_at).getTime() + every * 60_000) : null;
  const drink = (part: number) => {
    const row = logActivity("water", { ml: Math.round(bottle * part), name: "Water bottle" });
    const after = ml + bottle * part;
    celebrate({ title: after >= s.water_goal_ml ? "💧 WATER GOAL!" : "GULP!", subtitle: `${Math.round(after / bottle * 10) / 10} of ${want} bottles today. Refill it now.`, xp: row.xp, icon: "🍶" });
  };
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">🍶 Water bottle</h2>
        <span className="text-xs text-muted">{ml} / {s.water_goal_ml} ml</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2" aria-label={`${done.toFixed(1)} of ${want} bottles`}>
        {Array.from({ length: want }, (_, i) => {
          const f = Math.max(0, Math.min(1, done - i));
          return (
            <svg key={i} width="22" height="38" viewBox="0 0 22 38" aria-hidden>
              <rect x="7" y="1" width="8" height="5" rx="1.5" fill="currentColor" opacity=".5" />
              <rect x="2" y="6" width="18" height="31" rx="5" fill="none" stroke="currentColor" strokeOpacity=".4" />
              <rect x="3" y={6 + 30 * (1 - f)} width="16" height={30 * f} rx="4" fill="#38bdf8" opacity=".85" />
            </svg>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => drink(1)} className="btn-primary !py-1.5 text-sm">🍶 Finished a bottle</button>
        <button onClick={() => drink(0.5)} className="btn-ghost !py-1.5 text-sm border border-white/15">½ bottle</button>
      </div>
      <p className="mt-2 text-[11px] text-muted">{ml >= s.water_goal_ml ? "Goal reached. Sip when thirsty." : next ? `Next refill by ${next.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} (every ${every} min).` : "Fill your bottle and keep it on your desk."}</p>
      <div className="mt-2 flex flex-wrap gap-1 text-[11px] items-center">
        <span className="text-muted">Bottle:</span>
        {[350, 500, 600, 1000].map((v) => <button key={v} onClick={() => saveSettings({ bottle_ml: v })} className={`chip !py-0 ${bottle === v ? "chip-on" : ""}`}>{v} ml</button>)}
        <button onClick={() => saveSettings({ bottle_remind: !s.bottle_remind })} className={`chip !py-0 ml-auto ${s.bottle_remind ? "chip-on" : ""}`}>⏰ Refill reminders {s.bottle_remind ? "on" : "off"}</button>
      </div>
    </section>
  );
}
// Rings a short reminder when the bottle should be refilled (in the app, while awake).
export function BottleWatcher() {
  const { data, profile } = useApp();
  const s = profile.settings;
  const on = !!s.bottle_remind;
  const lastWater = useMemo(() => [...data.logs].reverse().find((l) => l.kind === "water")?.created_at ?? "", [data.logs]);
  const dayMl = useMemo(() => { const day = toDay(new Date()); return data.logs.filter((l) => l.day === day && l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0); }, [data.logs]);
  useEffect(() => {
    if (!on) return;
    const sc = sched(s.schedule);
    const check = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      if (!within(mins, toMin(sc.wake) + 60, toMin(sc.sleep) - 30) || dayMl >= s.water_goal_ml) return;
      const since = lastWater && toDay(new Date(lastWater)) === toDay(now) ? new Date(lastWater).getTime() : new Date(`${toDay(now)}T${sc.wake}`).getTime();
      if (now.getTime() - since < sc.waterEvery * 60_000) return;
      const key = `lifeos-refill:${since}`;
      try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
      const body = `Time to drink up and refill your ${s.bottle_ml || 500} ml bottle (${dayMl} of ${s.water_goal_ml} ml so far).`;
      fireAlarm({ title: "🍶 REFILL YOUR BOTTLE", body, icon: "💧", rounds: 2 });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") navigator.serviceWorker?.getRegistration().then((r) => r?.showNotification("Life OS", { body, icon: "/icons/icon-192.png" })).catch(() => {});
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [on, lastWater, dayMl, s.schedule, s.water_goal_ml, s.bottle_ml]);
  return null;
}

// ---------- 19 / 20 / 21. Cook, konbini, eat out ----------
export function FoodIdeas() {
  const [open, setOpen] = useState<"" | "cook" | "konbini" | "out">("");
  const { data } = useApp();
  const can = useMemo(() => matchRecipes(data.pantry).filter((m) => m.pct === 1).length, [data.pantry]);
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-2">🧑‍🍳 Cheap, healthy food ideas</h2>
      <div className="grid grid-cols-3 gap-2">
        {([["cook", "🧑‍🍳", "Recipes", can ? `${can} you can cook now` : "From what you have"], ["konbini", "🏪", "Konbini combo", "Best protein per yen"], ["out", "🍜", "Eating out", "Sukiya, Matsuya…"]] as const).map(([k, i, n, sub]) => (
          <button key={k} onClick={() => setOpen(k)} className="rounded-2xl border border-white/10 bg-white/[.04] p-2 flex flex-col items-center gap-0.5 active:scale-95">
            <span className="text-2xl">{i}</span><span className="text-xs font-semibold">{n}</span><span className="text-[10px] text-muted text-center leading-tight">{sub}</span>
          </button>
        ))}
      </div>
      {open === "cook" && <RecipesSheet onClose={() => setOpen("")} />}
      {open === "konbini" && <KonbiniSheet onClose={() => setOpen("")} />}
      {open === "out" && <EatOutSheet onClose={() => setOpen("")} />}
    </section>
  );
}

export function RecipesSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useApp();
  const eat = useEatLog();
  const [only, setOnly] = useState<"" | "now" | string>("");
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => matchRecipes(data.pantry), [data.pantry]);
  const list = all.filter((m) => !only || (only === "now" ? m.pct === 1 : m.r.tags.includes(only)));
  const cook = (r: Recipe) => { eat(mealWord(new Date().getHours()), [{ name: r.name, qty: 1, kcal: r.kcal, protein: r.protein, per: "1 serving" }], { emoji: r.emoji }); onClose(); };
  const shop = (names: string[]) => update((d) => ({ ...d, shopping: [...d.shopping, ...names.filter((n) => !d.shopping.some((s) => s.status === "to_buy" && s.name.toLowerCase() === n.toLowerCase())).map((n) => ({
    id: crypto.randomUUID(), name: n, emoji: "🛒", qty: 1, unit: "pcs", price: null, category: "Food", note: "", photo_id: null, status: "to_buy" as const, purchased_at: null, created_at: new Date().toISOString(),
  }))] }));
  return (
    <Sheet title="🧑‍🍳 Recipes from what you have" onClose={onClose}>
      <p className="text-xs text-muted">Cheap, healthy and quick. Green = you have it in What I have. Prices are per serving.</p>
      <div className="flex flex-wrap gap-1">
        {[["", "All"], ["now", "✅ Can cook now"], ["fast", "⚡ Under 10 min"], ["muscle", "💪 High protein"], ["lean", "🔥 Light"], ["breakfast", "🌅 Breakfast"], ["cheap", "💴 Cheapest"]].map(([k, l]) => <button key={k} onClick={() => setOnly(k)} className={`chip !py-0.5 text-[11px] ${only === k ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <div className="space-y-2">
        {list.map(({ r, missing }) => (
          <div key={r.id} className="rounded-xl border border-white/10 p-2.5 text-xs">
            <button onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full text-left">
              <div className="flex justify-between gap-2"><b className="text-sm">{r.emoji} {r.name}</b><span className="text-muted shrink-0">{yen(r.yen)} · {r.mins} min</span></div>
              <div className="text-muted">{r.kcal} kcal · {r.protein} g protein</div>
              <div className="mt-1 flex flex-wrap gap-1">{r.needs.map(([l]) => <span key={l} className={`rounded-full px-1.5 text-[10px] ${missing.includes(l) ? "bg-white/5 text-muted" : "bg-emerald-500/20 text-emerald-200"}`}>{missing.includes(l) ? "" : "✓ "}{l}</span>)}</div>
            </button>
            {open === r.id && (
              <div className="mt-2 space-y-1.5">
                {r.basics && <div className="text-muted">Also: {r.basics}</div>}
                <ol className="list-decimal pl-4 space-y-0.5">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                <div className="flex gap-2">
                  {missing.length > 0 && <button onClick={() => shop(missing)} className="btn-ghost flex-1 !py-1 text-xs border border-white/15">🛒 Add {missing.length} missing to list</button>}
                  <button onClick={() => cook(r)} className="btn-primary flex-1 !py-1 text-xs">🍽️ Cooked and ate it</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!list.length && <p className="text-xs text-muted">Nothing fits yet. Add eggs, rice, tofu or natto to What I have.</p>}
      </div>
    </Sheet>
  );
}

export function KonbiniSheet({ onClose }: { onClose: () => void }) {
  const eat = useEatLog();
  const [budget, setBudget] = useState(600);
  const [goal, setGoal] = useState<ComboGoal>("protein");
  const [main, setMain] = useState("");
  const combos = useMemo(() => bestCombos(budget, goal, main || undefined), [budget, goal, main]);
  return (
    <Sheet title="🏪 Konbini meal builder" onClose={onClose}>
      <div className="flex flex-wrap gap-1 items-center text-[11px]"><span className="text-muted">Budget</span>
        {[400, 500, 600, 800, 1000].map((b) => <button key={b} onClick={() => setBudget(b)} className={`chip !py-0.5 ${budget === b ? "chip-on" : ""}`}>{yen(b)}</button>)}
      </div>
      <div className="flex flex-wrap gap-1">{COMBO_GOALS.map(([g, l]) => <button key={g} onClick={() => setGoal(g)} className={`chip !py-0.5 text-[11px] ${goal === g ? "chip-on" : ""}`}>{l}</button>)}</div>
      <p className="text-[11px] text-muted">{COMBO_GOALS.find(([g]) => g === goal)?.[2]}</p>
      <select aria-label="Main" className="input !py-1 text-xs" value={main} onChange={(e) => setMain(e.target.value)}>
        <option value="">Any rice or bread</option>
        {KONBINI_PICKS.filter((p) => p.type === "main").map((p) => <option key={p.name} value={p.name}>{p.emoji} {p.name} ({yen(p.yen)})</option>)}
      </select>
      {combos.length === 0 && <p className="text-xs text-muted">Nothing fits that budget for this goal. Try a bigger budget.</p>}
      {combos.map((c, i) => (
        <div key={i} className={`rounded-xl border p-2.5 text-xs ${i === 0 ? "border-[var(--accent2)]/60 bg-[var(--accent2)]/10" : "border-white/10"}`}>
          <div className="flex justify-between font-semibold text-sm"><span>{i === 0 ? "🏆 Best" : `#${i + 1}`}</span><span>{yen(c.yen)}</span></div>
          <ul className="my-1 space-y-0.5">{c.items.map((p) => <li key={p.name} className="flex justify-between"><span>{p.emoji} {p.name} <span className="text-muted">{p.ja}</span></span><span className="text-muted">{yen(p.yen)}</span></li>)}</ul>
          <div className="text-muted">{c.kcal} kcal · <b className="text-[var(--accent2)]">{c.protein} g protein</b> · {(c.protein / c.yen * 100).toFixed(1)} g per ¥100</div>
          <button onClick={() => { eat(mealWord(new Date().getHours()), c.items.map((p) => ({ name: p.name, qty: 1, kcal: p.kcal, protein: p.protein })), { emoji: "🏪", yen: c.yen, cat: "Food", note: `Konbini: ${c.items.map((p) => p.name).join(" + ")}` }); onClose(); }} className="btn-primary w-full mt-2 !py-1 text-xs">🍽️ Bought and ate this ({yen(c.yen)})</button>
        </div>
      ))}
      <p className="text-[10px] text-muted">Typical 7-Eleven, Lawson and FamilyMart prices with tax. They vary a little by store.</p>
    </Sheet>
  );
}

export function EatOutSheet({ onClose }: { onClose: () => void }) {
  const eat = useEatLog();
  const [goal, setGoal] = useState<EatGoal>("muscle");
  const [chain, setChain] = useState("");
  const list = bestDishes(goal, chain || undefined).slice(0, chain ? 8 : 10);
  const c = CHAIN_LIST.find((x) => x.id === chain);
  return (
    <Sheet title="🍜 Eating out picks" onClose={onClose}>
      <div className="flex flex-wrap gap-1">{EAT_GOALS.map(([g, l]) => <button key={g} onClick={() => setGoal(g)} className={`chip !py-0.5 text-[11px] ${goal === g ? "chip-on" : ""}`}>{l}</button>)}</div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button onClick={() => setChain("")} className={`chip !py-0.5 text-[11px] shrink-0 ${!chain ? "chip-on" : ""}`}>All</button>
        {CHAIN_LIST.map((x) => <button key={x.id} onClick={() => setChain(x.id)} className={`chip !py-0.5 text-[11px] shrink-0 ${chain === x.id ? "chip-on" : ""}`}>{x.emoji} {x.name}</button>)}
      </div>
      {c && <p className="rounded-xl bg-white/5 p-2 text-xs">💡 {c.tip}</p>}
      <div className="space-y-1.5">
        {list.map((x, i) => {
          const ch = CHAIN_LIST.find((y) => y.id === x.chain)!;
          return (
            <div key={x.chain + x.name} className="flex items-center gap-2 rounded-xl border border-white/10 p-2 text-xs">
              <span className="text-xl">{i === 0 ? "🏆" : ch.emoji}</span>
              <span className="flex-1 min-w-0"><b>{x.name}</b> <span className="text-muted">· {ch.name}</span><br /><span className="text-muted">{x.ja} · {x.kcal} kcal · {x.protein} g protein · {yen(x.yen)}</span></span>
              <button onClick={() => { eat(mealWord(new Date().getHours()), [{ name: `${ch.name} ${x.name}`, qty: 1, kcal: x.kcal, protein: x.protein }], { emoji: ch.emoji, yen: x.yen, cat: "Eating out", note: `${ch.name}: ${x.name}` }); onClose(); }} className="chip !py-0.5 text-[11px] shrink-0">🍽️ Ate</button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted">Prices and calories are typical; menus change. Logging adds the meal and what you paid.</p>
    </Sheet>
  );
}

// ---------- 24. Weekly food cost ----------
export function FoodCostCard() {
  const { data, profile } = useApp();
  const cur = profile.settings.currency;
  const weeks = [0, 1, 2, 3].map((i) => weekFood(data, new Date(), i));
  const w = weeks[0];
  const pct = w.share > 0 ? (w.spent / w.share) * 100 : 0;
  const max = Math.max(1, ...weeks.map((x) => Math.max(x.spent, x.share)));
  const money = (n: number) => `${cur} ${Math.round(n).toLocaleString()}`;
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">💴 Food cost this week</h2>
        <span className="text-xs text-muted">{money(w.spent)} / {money(w.share)}</span>
      </div>
      <div className="bar"><div style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? "#ff3b5c" : undefined }} /></div>
      <p className="mt-2 text-xs text-muted">
        {w.spent === 0 ? "No food bought in the last 7 days. Mark shop items as bought (with the price), scan a receipt, or log konbini and eating-out meals." :
          <>About <b>{money(w.spent / 7)}</b> a day. {pct > 100 ? <span className="text-rose-300">Over this week&apos;s share of your {profile.settings.cat_budgets?.Food ? "food budget" : "allowance"}. Cook at home: TKG or tofu steak cost under {money(100)}.</span> : <span className="text-emerald-300">Inside this week&apos;s share ({Math.round(pct)}%).</span>}</>}
      </p>
      <div className="mt-2 flex items-end gap-2 h-14">
        {[...weeks].reverse().map((x, i) => (
          <div key={x.from} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-10 flex items-end"><div className={`w-full rounded-t ${x.spent > x.share ? "bg-rose-400/80" : "bg-[var(--accent2)]/70"}`} style={{ height: `${(x.spent / max) * 100}%` }} /></div>
            <span className="text-[9px] text-muted">{i === 3 ? "This wk" : `${3 - i} wk ago`}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
