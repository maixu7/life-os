"use client";

import { useState } from "react";
import { dtLocal, Sheet } from "@/components/Sheet";
import { WherePicker } from "@/components/Where";
import { burned, FOODS, guessFood, metOf, type Eaten } from "@/lib/body";
import { emojiFor } from "@/lib/emoji";
import { ImpactCard } from "@/components/RealMe";
import { moveOf } from "@/lib/moves";
import { logKarma } from "@/lib/karma";
import { autoOption, optionsFor, ordinal, slotOf, SLOT_ICON } from "@/lib/slots";
import { toDay, useApp, type CustomItem, type Log } from "@/lib/store";

const MINUTES = [5, 10, 15, 30, 45, 60, 90];

// Logging an activity with its details: which time of day, what kind, how long.
export function ActivitySheet({ item, at, onClose, onLogged }: { item: CustomItem; at: Date; onClose: () => void; onLogged: (l: Log) => void }) {
  const { data, logActivity, celebrate } = useApp();
  const [when, setWhen] = useState(dtLocal(at));
  const time = new Date(when);
  const opts = optionsFor(item.name);
  const [picked, setPicked] = useState<string[]>(() => { const a = autoOption(item.name, at); return a ? [a] : []; });
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [where, setWhere] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(() => (/run|walk|drive|ride|cycle/i.test(item.name) ? "km" : /exercise|gym|push/i.test(item.name) ? "reps" : /read|study/i.test(item.name) ? "pages" : /typing/i.test(item.name) ? "wpm" : /writ/i.test(item.name) ? "words" : "times"));
  const emoji = String(item.config.emoji ?? emojiFor(item.name));
  const day = toDay(time);
  const nth = data.logs.filter((l) => l.day === day && l.kind === "activity" && String(l.data.name).toLowerCase() === item.name.toLowerCase()).length + 1;
  const slot = slotOf(time);
  const isMeal = /breakfast|lunch|dinner|snack|meal|eat|food/i.test(item.name);
  const [foods, setFoods] = useState<Record<string, number>>({});
  const [foodQ, setFoodQ] = useState("");
  const addFood = (name: string, n: number) => setFoods((p) => { const q = Math.max(0, +((p[name] ?? 0) + n).toFixed(1)); const c = { ...p }; if (q) c[name] = q; else delete c[name]; return c; });
  const eatenList: Eaten[] = Object.entries(foods).map(([name, qty]) => { const fd = FOODS.find((x) => x.name === name)!; return { name, qty, kcal: Math.round(fd.kcal * qty), protein: +(fd.protein * qty).toFixed(1) }; });
  const kcalIn = eatenList.reduce((n, x) => n + x.kcal, 0);
  const move = moveOf(item.name);
  const [variant, setVariant] = useState<string | null>(null);
  const factor = move?.variants?.find((x) => x.name === variant)?.factor ?? 1;
  const met = metOf(`${variant ?? ""} ${item.name}`);
  const kg = Number([...data.logs].reverse().find((l) => l.kind === "body" && l.data.weight)?.data.weight) || 60;
  const kcalOut = minutes && met && met[1] >= 2 ? burned([{ id: "", day, kind: "activity", data: { name: `${variant ?? ""} ${item.name}`, minutes: minutes * factor }, xp: 0, created_at: "" }], kg)[0]?.kcal ?? 0 : 0;
  const shown = foodQ ? FOODS.filter((x) => x.name.toLowerCase().includes(foodQ.toLowerCase()) || x.re.test(foodQ)) : FOODS.slice(0, 18);
  const toggle = (o: string) => setPicked(picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o]);

  const save = () => {
    const row = logActivity("activity", {
      name: item.name, emoji, alignment: item.config.alignment, options: picked.length ? picked : undefined,
      slot, count: nth, minutes: minutes ?? undefined, note: note || undefined, where: where || undefined,
      ...(amount ? { amount: Number(amount), unit } : {}),
      ...(variant ? { variant } : {}),
      ...(eatenList.length ? { foods: eatenList, kcal: kcalIn } : kcalOut ? { kcal: kcalOut } : {}),
    }, time);
    const k = logKarma(row);
    celebrate({ title: k < 0 ? "😈 THE DEVIL GRINS…" : `${item.name.toUpperCase()}!`, subtitle: `${SLOT_ICON[slot]} ${slot} · ${ordinal(nth)} time today${kcalIn ? ` · +${kcalIn} kcal eaten` : kcalOut ? ` · ${kcalOut} kcal burned` : ""}`, xp: row.xp });
    onLogged(row);
    onClose();
  };

  return (
    <Sheet title={`${emoji} ${item.name}`} onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3 text-sm flex items-center gap-2">
        <span className="text-2xl">{SLOT_ICON[slot]}</span>
        <span>Auto-detected: <b>{slot}</b> · <b>{ordinal(nth)}</b> time today</span>
      </div>
      {opts.length > 0 && (
        <>
          <div className="text-xs text-muted">Details (pick one or more)</div>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => <button key={o} onClick={() => toggle(o)} className={`chip ${picked.includes(o) ? "chip-on" : ""}`}>{o}</button>)}
          </div>
        </>
      )}
      {move?.variants && move.kind === "body" && (
        <div className="flex flex-wrap gap-1.5">
          {move.variants.map((x) => <button key={x.name} onClick={() => setVariant(variant === x.name ? null : x.name)} className={`chip !py-1 text-xs ${variant === x.name ? "chip-on" : ""}`}>{x.name}</button>)}
        </div>
      )}
      {!isMeal && <ImpactCard name={item.name} variant={variant ?? undefined} />}
      {isMeal && (
        <div className="rounded-xl bg-white/[.04] border border-white/10 p-3 space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted">What did you eat?</span>{kcalIn > 0 && <b>{kcalIn} kcal · {eatenList.reduce((n, x) => n + x.protein, 0).toFixed(0)} g protein</b>}</div>
          <input className="input" placeholder="Search food (apple, roti, egg…)" value={foodQ} onChange={(e) => setFoodQ(e.target.value)} />
          {foodQ && !shown.length && guessFood(foodQ) == null && <div className="text-xs text-muted">Not in the list yet. Pick the closest food.</div>}
          <div className="flex flex-wrap gap-1.5">
            {shown.map((x) => (
              <button key={x.name} onClick={() => addFood(x.name, 1)} className={`chip !py-1 text-xs ${foods[x.name] ? "chip-on" : ""}`}>
                {x.emoji} {x.name}{foods[x.name] ? ` × ${foods[x.name]}` : ""}
              </button>
            ))}
          </div>
          {eatenList.map((x) => {
            const fd = FOODS.find((y) => y.name === x.name)!;
            return (
              <div key={x.name} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{fd.emoji} {x.name} <span className="text-xs text-muted">({fd.per} = {fd.kcal} kcal)</span></span>
                <button onClick={() => addFood(x.name, -0.5)} className="chip !px-2 !py-0.5">−</button>
                <b className="w-8 text-center">{x.qty}</b>
                <button onClick={() => addFood(x.name, 0.5)} className="chip !px-2 !py-0.5">+</button>
                <span className="w-16 text-right text-xs">{x.kcal} kcal</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-xs text-muted">How long{kcalOut ? <> · <b className="text-[var(--accent2)]">≈ {kcalOut} kcal burned</b> ({met![2]}, {kg} kg)</> : null}</div>
      <div className="flex flex-wrap gap-2">
        {MINUTES.map((m) => <button key={m} onClick={() => setMinutes(minutes === m ? null : m)} className={`chip ${minutes === m ? "chip-on" : ""}`}>{m < 60 ? `${m} min` : `${m / 60} h`}</button>)}
      </div>
      <div className="text-xs text-muted">How much (optional)</div>
      <div className="flex gap-2">
        <input className="input !w-28" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">{["times", "km", "reps", "pages", "words", "wpm", "glasses", "pcs", "Rs"].map((u) => <button key={u} onClick={() => setUnit(u)} className={`chip !py-1 text-xs ${unit === u ? "chip-on" : ""}`}>{u}</button>)}</div>
      </div>
      <WherePicker value={where} onChange={setWhere} />
      <label className="text-xs text-muted">When<input type="datetime-local" className="input mt-1" value={when} onChange={(e) => e.target.value && setWhen(e.target.value)} /></label>
      <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button onClick={save} className="btn-primary w-full">Log {item.name}</button>
    </Sheet>
  );
}
