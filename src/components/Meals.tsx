"use client";

import { useRef, useState } from "react";
import { dtLocal, Sheet } from "@/components/Sheet";
import { WhenPicker } from "@/components/When";
import { FoodPicker, useEaten } from "@/components/FoodPicker";
import { energy } from "@/lib/body";
import { animeStyle, loadImage, recognise, smallPhoto } from "@/lib/foodphoto";
import { toDay, useApp, type Log } from "@/lib/store";

export const MEALS: [string, string][] = [["Breakfast", "🍳"], ["Lunch", "🍱"], ["Snack", "🍪"], ["Dinner", "🍛"]];

// Which meal fits the clock, so a photo at 1 PM becomes lunch.
export function mealFor(d: Date) {
  const h = d.getHours();
  return h >= 4 && h < 11 ? "Breakfast" : h >= 11 && h < 16 ? "Lunch" : h >= 16 && h < 19 ? "Snack" : "Dinner";
}

const isMealLog = (l: Log) => l.kind === "meal" || (l.kind === "activity" && MEALS.some(([m]) => m.toLowerCase() === String(l.data.name).toLowerCase()));

// What you ate, when, what was in it and how many calories, with an optional
// photo that the app redraws in anime style and tries to recognise.
export function MealSheet({ meal: initial, log, onClose }: { meal?: string; log?: Log; onClose: () => void }) {
  const { logActivity, updateLog, celebrate } = useApp();
  const [meal, setMeal] = useState(initial ?? (log ? String(log.data.name) : mealFor(new Date())));
  const [when, setWhen] = useState(dtLocal(log ? new Date(log.created_at) : new Date()));
  const [foods, setFoods] = useState<Record<string, number>>(() => Object.fromEntries(((log?.data.foods as { name: string; qty: number }[]) ?? []).map((f) => [f.name, f.qty])));
  const [contents, setContents] = useState(String(log?.data.note ?? ""));
  const [photo, setPhoto] = useState<string>(String(log?.data.photo ?? ""));
  const [real, setReal] = useState("");
  const [art, setArt] = useState("");
  const [anime, setAnime] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [guesses, setGuesses] = useState<string[]>([]);
  const file = useRef<HTMLInputElement>(null);
  const list = useEaten(foods);
  const kcal = list.reduce((n, x) => n + x.kcal, 0);
  const protein = Math.round(list.reduce((n, x) => n + x.protein, 0));

  const pick = async (f: File) => {
    setMsg(""); setGuesses([]);
    const img = await loadImage(f);
    const art = animeStyle(img), plain = smallPhoto(img);
    setReal(plain); setArt(art); setPhoto(anime ? art : plain);
    // The photo's own time is when you ate.
    if (f.lastModified && Date.now() - f.lastModified < 3 * 86_400_000) {
      const t = new Date(f.lastModified);
      setWhen(dtLocal(t));
      if (!initial && !log) setMeal(mealFor(t));
    }
    setBusy(true); setMsg("Looking at your photo…");
    try {
      const r = await recognise(img);
      setGuesses(r.foods);
      if (r.foods.length) {
        setFoods((prev) => (Object.keys(prev).length ? prev : { [r.foods[0]]: 1 }));
        setMsg(`Looks like ${r.seen.slice(0, 2).join(" or ")}. Added ${r.foods[0]}; fix it below if that's wrong.`);
      } else setMsg(`I see ${r.seen.slice(0, 2).join(" or ")}, but it isn't a food I know. Pick it from the list below.`);
    } catch {
      setMsg("Couldn't recognise it (the food detector needs internet the first time). Pick the food below.");
    }
    setBusy(false);
  };
  const toggleStyle = () => {
    if (real && art) setPhoto(anime ? real : art);
    setAnime(!anime);
  };

  const save = () => {
    const data = { name: meal, emoji: MEALS.find(([m]) => m === meal)?.[1] ?? "🍽️", foods: list, kcal, note: contents || undefined, photo: photo || undefined };
    if (log) updateLog(log.id, { data, at: new Date(when) });
    else {
      const row = logActivity("activity", data, new Date(when));
      celebrate({ title: "ITADAKIMASU!", subtitle: `${meal}${kcal ? ` · +${kcal} kcal · ${protein} g protein` : ""}`, xp: row.xp, icon: data.emoji });
    }
    onClose();
  };

  return (
    <Sheet title={`${MEALS.find(([m]) => m === meal)?.[1] ?? "🍽️"} ${meal}`} onClose={onClose}>
      <div className="grid grid-cols-4 gap-1.5">
        {MEALS.map(([m, e]) => <button key={m} onClick={() => setMeal(m)} className={`chip justify-center !px-1 text-xs ${meal === m ? "chip-on" : ""}`}>{e} {m}</button>)}
      </div>
      <div className="flex gap-3 items-center">
        <button onClick={() => file.current?.click()} className="relative h-28 w-28 shrink-0 rounded-2xl border border-dashed border-white/25 bg-white/[.04] grid place-items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img src={photo} alt={meal} className="h-full w-full object-cover" /> : <span className="text-center text-xs text-muted">📷<br />Add photo</span>}
        </button>
        <div className="flex-1 min-w-0 space-y-1.5 text-xs">
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
          {photo && real && <button onClick={toggleStyle} className="chip !py-1 text-xs">{anime ? "🎨 Anime style" : "📷 Real photo"} (tap to switch)</button>}
          {photo && <button onClick={() => { setPhoto(""); setReal(""); setGuesses([]); setMsg(""); }} className="chip !py-1 text-xs">Remove photo</button>}
          {busy && <div className="animate-pulse text-[var(--accent2)]">🔍 Recognising…</div>}
          {msg && !busy && <div className="text-muted">{msg}</div>}
          {guesses.length > 1 && <div className="flex flex-wrap gap-1">{guesses.slice(1).map((g) => <button key={g} onClick={() => setFoods({ ...foods, [g]: (foods[g] ?? 0) + 1 })} className="chip !py-0.5 text-[11px]">+ {g}</button>)}</div>}
          {!photo && <div className="text-muted">Snap your plate. The app sets the time from the photo, redraws it anime style and tries to tell what it is.</div>}
        </div>
      </div>
      <WhenPicker label="When did you eat" value={when} onChange={setWhen} />
      <FoodPicker value={foods} onChange={setFoods} />
      <textarea className="input min-h-14 text-sm" placeholder="What was in it? (ingredients, home made, how much oil…)" value={contents} onChange={(e) => setContents(e.target.value)} />
      <div className="rounded-xl bg-white/5 p-3 text-sm flex justify-between"><span>Total</span><b>{kcal} kcal · {protein} g protein</b></div>
      <button onClick={save} className="btn-primary w-full">{log ? "Save changes" : `Log ${meal.toLowerCase()}`}</button>
    </Sheet>
  );
}

// Base Camp: today's meals with their photos and the calories so far.
export function MealsCard() {
  const { data } = useApp();
  const day = toDay(new Date());
  const [open, setOpen] = useState<{ meal?: string; log?: Log } | null>(null);
  const logs = data.logs.filter((l) => l.day === day && isMealLog(l));
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
        {MEALS.map(([m, emo]) => {
          const done = logs.filter((l) => String(l.data.name).toLowerCase() === m.toLowerCase());
          const last = done[done.length - 1];
          const pic = last?.data.photo ? String(last.data.photo) : "";
          return (
            <button key={m} onClick={() => setOpen(last ? { log: last } : { meal: m })}
              className={`relative rounded-2xl border bg-white/[.04] p-1 pb-1.5 flex flex-col items-center gap-1 active:scale-95 ${done.length ? "border-emerald-400/60" : "border-white/10"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {pic ? <img src={pic} alt={m} className="h-10 w-10 rounded-xl object-cover" /> : <span className="text-2xl h-10 grid place-items-center">{emo}</span>}
              <span className="text-[10px] leading-tight">{m}</span>
              {done.length > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-[11px] grid place-items-center">✓</span>}
            </button>
          );
        })}
        <button onClick={() => setOpen({})} className="rounded-2xl border border-dashed border-white/25 p-1 flex flex-col items-center justify-center gap-1 active:scale-95">
          <span className="text-2xl h-10 grid place-items-center">📷</span><span className="text-[10px]">Photo</span>
        </button>
      </div>
      {logs.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {logs.map((l) => (
            <li key={l.id}><button onClick={() => setOpen({ log: l })} className="w-full flex gap-2 text-left">
              <span className="text-muted w-14 shrink-0">{new Date(l.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              <span className="flex-1 truncate">{String(l.data.name)}: {((l.data.foods as { name: string }[]) ?? []).map((f) => f.name).join(", ") || String(l.data.note ?? "no foods added")}</span>
              {Number(l.data.kcal) > 0 && <b>{String(l.data.kcal)} kcal</b>}
            </button></li>
          ))}
        </ul>
      )}
      {open && <MealSheet meal={open.meal} log={open.log} onClose={() => setOpen(null)} />}
    </section>
  );
}
