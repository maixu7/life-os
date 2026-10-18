"use client";

import { StartButton } from "@/components/Doing";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { DRINK_CATS, DRINKS, type Drink, type DrinkCat } from "@/lib/drinks";
import { useApp } from "@/lib/store";
import { drinkGoodness, scoreColor } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { CaffeineWarning } from "@/components/FoodPlus";

// Any drink: pick it, pick how much, and the app logs calories, sugar and
// caffeine. Water and milk count toward their goals.
export function DrinkSheet({ onClose, at, start, slot }: { onClose: () => void; at?: Date; start?: string; slot?: string }) {
  const { data, logActivity, celebrate } = useApp();
  const [q, setQ] = useState(() => (start && DRINKS.some((d) => `${d.name} ${d.ja ?? ""}`.toLowerCase().includes(start.toLowerCase())) ? start : ""));
  const [cat, setCat] = useState<DrinkCat | "">("");
  const [pick, setPick] = useState<Drink | null>(null);
  const [ml, setMl] = useState(0);
  const recent = useMemo(() => [...new Set(data.logs.filter((l) => l.kind === "drink").slice(-30).reverse().map((l) => String(l.data.name)))].slice(0, 8), [data.logs]);
  const list = DRINKS.filter((d) => (!cat || d.cat === cat) && (!q || `${d.name} ${d.ja ?? ""}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 80);
  const choose = (d: Drink) => { setPick(d); setMl(d.ml); };
  const k = ml / 100;
  const save = () => {
    if (!pick) return;
    const kcal = Math.round(pick.kcal100 * k), sugar = +(pick.sugar100 * k).toFixed(1);
    if (pick.cat === "water") logActivity("water", { ml, name: pick.name, slot }, at);
    else if (pick.cat === "milk" && /^(whole |low.?fat |skim |)milk/i.test(pick.name)) logActivity("milk", { ml, name: pick.name, slot }, at);
    else logActivity("drink", {
      name: pick.name, emoji: pick.emoji, cat: pick.cat, slot, ml, kcal, sugar, protein: pick.protein100 ? +(pick.protein100 * k).toFixed(1) : undefined,
      caffeine: pick.caffeine100 ? Math.round(pick.caffeine100 * k) : undefined, alcohol: pick.alcohol, water_ml: Math.round(ml * (pick.water ?? 0.9)),
    }, at);
    celebrate({ title: "GULP!", subtitle: `${pick.emoji} ${pick.name} ${ml} ml${kcal ? ` · ${kcal} kcal` : ""}${sugar >= 10 ? ` · ${sugar} g sugar` : ""}` });
    onClose();
  };
  return (
    <Sheet title={slot ? `🥤 ${slot}` : "🥤 What did you drink?"} onClose={onClose}>
      <input className="input" placeholder={`Search ${DRINKS.length} drinks (pocari, cola, soy milk, 麦茶…)`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setCat("")} className={`chip !py-0.5 text-[11px] shrink-0 ${!cat ? "chip-on" : ""}`}>All</button>
        {DRINK_CATS.map(([c, l]) => <button key={c} onClick={() => setCat(c)} className={`chip !py-0.5 text-[11px] shrink-0 ${cat === c ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      {recent.length > 0 && !q && !cat && <div className="flex flex-wrap gap-1">{recent.map((n) => { const d = DRINKS.find((x) => x.name === n); return d ? <button key={n} onClick={() => choose(d)} className="chip !py-0.5 text-[11px]">↺ {d.emoji} {n}</button> : null; })}</div>}
      <div className="max-h-56 overflow-y-auto divide-y divide-white/5 rounded-xl bg-white/[.03]">
        {list.map((d) => (
          <button key={d.name} onClick={() => choose(d)} className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs ${pick?.name === d.name ? "bg-[var(--accent2)]/15" : ""}`}>
            <span className="text-lg">{d.emoji}</span>
            <span className="flex-1 min-w-0"><span className="block truncate">{d.name}</span>{d.ja && <span className="block text-[10px] text-muted truncate">{d.ja}</span>}</span>
            <span className="text-muted whitespace-nowrap">{d.kcal100} kcal · {d.sugar100} g sugar</span>
            <span className={`w-6 text-right font-bold ${scoreColor(drinkGoodness(d).score)}`}>{drinkGoodness(d).score}</span>
          </button>
        ))}
        {!list.length && <p className="p-3 text-xs text-muted">Not found. Try another word.</p>}
      </div>
      {pick && (
        <div className="rounded-xl border border-white/10 p-3 space-y-2 text-sm">
          <div className="font-semibold">{pick.emoji} {pick.name}</div>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set([150, 200, 250, 350, 500, pick.ml])].sort((a, b) => a - b).map((v) => <button key={v} onClick={() => setMl(v)} className={`chip !py-0.5 text-xs ${ml === v ? "chip-on" : ""}`}>{v} ml</button>)}
            <input className="input !w-20 !py-0.5 text-xs" inputMode="numeric" value={ml} onChange={(e) => setMl(Number(e.target.value) || 0)} aria-label="ml" />
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className="rounded-lg bg-white/5 p-1.5"><b>{Math.round(pick.kcal100 * k)}</b><br /><span className="text-muted">kcal</span></div>
            <div className={`rounded-lg p-1.5 ${pick.sugar100 * k > 25 ? "bg-rose-500/15" : "bg-white/5"}`}><b>{(pick.sugar100 * k).toFixed(1)}</b><br /><span className="text-muted">g sugar</span></div>
            <div className="rounded-lg bg-white/5 p-1.5"><b>{((pick.protein100 ?? 0) * k).toFixed(1)}</b><br /><span className="text-muted">g protein</span></div>
            <div className="rounded-lg bg-white/5 p-1.5"><b>{Math.round((pick.caffeine100 ?? 0) * k)}</b><br /><span className="text-muted">mg caffeine</span></div>
          </div>
          <GoodBadge g={drinkGoodness(pick, ml)} />
          {pick.sugar100 * k > 25 && <p className="text-[11px] text-rose-300">That&apos;s more sugar than the WHO&apos;s ideal for a whole day (25 g).</p>}
          <CaffeineWarning mg={Math.round((pick.caffeine100 ?? 0) * k)} />
          {pick.alcohol ? <p className="text-[11px] text-amber-300">Alcohol {pick.alcohol}%. Drink water too, and not before training.</p> : null}
          <button onClick={save} className="btn-primary w-full">Log it (drank)</button>
          <StartButton onClick={save} label="▶ Start drinking, tick Complete after" />
        </div>
      )}
    </Sheet>
  );
}
