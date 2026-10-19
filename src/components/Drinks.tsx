"use client";

import { StartButton } from "@/components/Doing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { DRINK_CATS, DRINKS, drinkCatOf, drinkMatch, drinkOf, type Drink, type DrinkCat } from "@/lib/drinks";
import { aiPhotos, readMeal, readProduct } from "@/lib/foodai";
import { perAmount } from "@/lib/label";
import { SnapChoice, useRememberSnap, type LabelRead, type Pick } from "@/components/SnapChoice";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { useApp } from "@/lib/store";
import { drinkGoodness, scoreColor } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { CaffeineWarning } from "@/components/FoodPlus";

// Any drink: pick it, pick how much, and the app logs calories, sugar and
// caffeine. Water and milk count toward their goals.
export function DrinkSheet({ onClose, at: when, start, slot, cat: startCat, file }: { onClose: () => void; at?: Date; start?: string; slot?: string; cat?: DrinkCat; file?: Blob[] }) {
  const { data, logActivity, celebrate, update } = useApp();
  const [photo, setPhoto] = useState("");
  // Your own drinks: ones read from a photo or words, saved with their photo for next time.
  const mine = useMemo(() => data.items.filter((i) => i.category === "drink").map((i) => ({ ...(i.config as Omit<Drink, "name">), name: i.name, photo: i.config.photo as string | undefined })), [data.items]);
  const all = useMemo<(Drink & { photo?: string })[]>(() => [...mine, ...DRINKS], [mine]);
  const [q, setQ] = useState(() => (start && DRINKS.some((d) => `${d.name} ${d.ja ?? ""}`.toLowerCase().includes(start.toLowerCase())) ? start : ""));
  const [cat, setCat] = useState<DrinkCat | "">(startCat ?? "");
  const first = startCat ? DRINKS.find((d) => d.cat === startCat) ?? null : null;
  const [pick, setPick] = useState<Drink | null>(first);
  const [ml, setMl] = useState(first ? 250 : 0);
  // When you drank it (now by default), so a glass from earlier lands at the right time.
  const [time, setTime] = useState(() => { const t = when ?? new Date(); return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`; });
  const atTime = () => { const t = new Date(when ?? Date.now()); const [h, m] = time.split(":").map(Number); if (!isNaN(h)) t.setHours(h, m || 0, 0, 0); return t; };
  const recent = useMemo(() => [...new Set(data.logs.filter((l) => l.kind === "drink").slice(-30).reverse().map((l) => String(l.data.name)))].slice(0, 8), [data.logs]);
  const list = all.filter((d) => (!cat || d.cat === cat) && (!q || `${d.name} ${d.ja ?? ""}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 80);
  const choose = (d: Drink, amount = d.ml) => { setPick(d); setMl(amount); };
  const k = ml / 100;
  const save = () => {
    if (!pick || ml <= 0) return;
    const at = atTime();
    const kcal = Math.round(pick.kcal100 * k), sugar = +(pick.sugar100 * k).toFixed(1);
    const pic = photo || undefined;
    // Keep new drinks (and their photo) in My drinks, so they're one tap next time.
    if (!DRINKS.some((x) => x.name === pick.name) || pic) {
      const config = { cat: pick.cat, emoji: pick.emoji, ml: pick.ml, kcal100: pick.kcal100, sugar100: pick.sugar100, protein100: pick.protein100, caffeine100: pick.caffeine100, alcohol: pick.alcohol, water: pick.water, photo: pic ?? mine.find((x) => x.name === pick.name)?.photo };
      update((d) => ({ ...d, items: d.items.some((i) => i.category === "drink" && i.name === pick.name)
        ? d.items.map((i) => (i.category === "drink" && i.name === pick.name ? { ...i, config } : i))
        : [...d.items, { id: crypto.randomUUID(), category: "drink", name: pick.name, sort: Date.now(), config }] }));
    }
    const r = pick.cat === "water" ? logActivity("water", { ml, name: pick.name, slot, photo: pic }, at)
      : pick.cat === "milk" && /^(whole |low.?fat |skim |)milk/i.test(pick.name) ? logActivity("milk", { ml, name: pick.name, slot, photo: pic }, at)
      : logActivity("drink", {
      photo: pic, name: pick.name, emoji: pick.emoji, cat: pick.cat, slot, ml, kcal, sugar, protein: pick.protein100 ? +(pick.protein100 * k).toFixed(1) : undefined,
      caffeine: pick.caffeine100 ? Math.round(pick.caffeine100 * k) : undefined, alcohol: pick.alcohol, water_ml: Math.round(ml * (pick.water ?? 0.9)),
    }, at);
    celebrate({ title: "GULP!", subtitle: `${pick.emoji} ${pick.name} ${ml} ml${kcal ? ` · ${kcal} kcal` : ""}${sugar >= 10 ? ` · ${sugar} g sugar` : ""}`, xp: r.xp, kind: "small" });
    onClose();
  };
  return (
    <Sheet title={slot ? `🥤 ${slot}` : "🥤 What did you drink?"} onClose={onClose}>
      <DrinkSnap photo={photo} setPhoto={setPhoto} onDrink={choose} all={all} mine={mine.length} file={file} />
      <input className="input" placeholder={`Search ${all.length} drinks (pocari, cola, soy milk, 麦茶…)`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setCat("")} className={`chip !py-0.5 text-[11px] shrink-0 ${!cat ? "chip-on" : ""}`}>All</button>
        {DRINK_CATS.map(([c, l]) => <button key={c} onClick={() => setCat(c)} className={`chip !py-0.5 text-[11px] shrink-0 ${cat === c ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      {recent.length > 0 && !q && !cat && <div className="flex flex-wrap gap-1">{recent.map((n) => { const d = all.find((x) => x.name === n); return d ? <button key={n} onClick={() => choose(d)} className="chip !py-0.5 text-[11px]">↺ {d.emoji} {n}</button> : null; })}</div>}
      <div className="max-h-56 overflow-y-auto divide-y divide-white/5 rounded-xl bg-white/[.03]">
        {list.map((d) => (
          <button key={d.name} onClick={() => choose(d)} className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs ${pick?.name === d.name ? "bg-[var(--accent2)]/15" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {d.photo ? <img src={d.photo} alt="" className="h-7 w-7 rounded-md object-cover" /> : <span className="text-lg">{d.emoji}</span>}
            <span className="flex-1 min-w-0"><span className="block truncate">{d.name}</span>{d.ja && <span className="block text-[10px] text-muted truncate">{d.ja}</span>}</span>
            <span className="text-muted whitespace-nowrap">{d.kcal100} kcal · {d.sugar100} g sugar</span>
            <span className={`w-6 text-right font-bold ${scoreColor(drinkGoodness(d).score)}`}>{drinkGoodness(d).score}</span>
          </button>
        ))}
        {!list.length && <p className="p-3 text-xs text-muted">Not found. Try another word.</p>}
      </div>
      {pick && (
        <div className="rounded-xl border border-white/10 p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt={pick.name} className="h-10 w-10 rounded-lg object-cover" />}
            <span>{pick.emoji} {pick.name}</span>
          </div>
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
          <label className="flex items-center gap-2 text-xs text-muted">🕒 When <input type="time" className="input !w-28 !py-0.5 text-xs" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <button onClick={save} className="btn-primary w-full">Log it (drank)</button>
          <StartButton onClick={save} label="▶ Start drinking, tick Complete after" />
        </div>
      )}
    </Sheet>
  );
}

// Snap the drink or say it, like food: the app finds it in the drink list,
// or reads its calories, sugar and protein for the amount.
function DrinkSnap({ photo, setPhoto, onDrink, all, mine, file }: { photo: string; setPhoto: (p: string) => void; onDrink: (d: Drink, ml: number) => void; all: Drink[]; mine: number; file?: Blob[] }) {
  const [ask, setAsk] = useState<{ ai: string; imgs: HTMLImageElement[] } | null>(null);
  const rememberAI = useRememberSnap();
  const [offer, setOffer] = useState(false); // "not in the list" → show the Ask AI button
  const guess = useCallback((text: string) => { const d = drinkMatch(text); return d ? [d.name] : []; }, []);
  // One photo or several (front and back) of the same drink.
  const takePhoto = async (fs: Blob[]) => {
    const imgs = await Promise.all(fs.map(loadImage));
    setPhoto(smallPhoto(imgs[0], 160));
    setAsk({ ai: aiPhotos(imgs), imgs });
  };
  // From the list, with the label's own numbers when it could read them.
  const picked = (p: Pick, l?: LabelRead) => {
    const x = all.find((d) => d.name === p.name);
    const base = perAmount(l?.per) ?? (l?.per ? undefined : 100);
    const per = (v?: number) => (v != null && base ? Math.round((v / base) * 1000) / 10 : undefined);
    if (x) {
      const k = l?.kcal != null && base ? { kcal100: per(l.kcal)!, sugar100: per(l.sugar) ?? x.sugar100, protein100: per(l.protein) ?? x.protein100 } : {};
      onDrink({ ...x, ...k }, x.ml); setMsg(`📋 ${x.name}, ${x.ml} ml (from the list${k.kcal100 != null ? ", numbers from the label" : ""}). Check the amount below.`); return;
    }
    // A new drink named from the label.
    const ml = perAmount(l?.per) ?? 500;
    onDrink({ name: p.name, cat: drinkCatOf(p.name), emoji: "🥤", ml, kcal100: per(l?.kcal) ?? 0, sugar100: per(l?.sugar ?? l?.carbs) ?? 0, protein100: per(l?.protein) ?? 0, water: 0.9 }, ml);
    setMsg(`🏷️ ${p.name} from the label. Check the amount and numbers below; it's saved to My drinks when you log it.`);
  };
  // A photo saved with "Scan later" opens straight away.
  useEffect(() => { if (file?.length) takePhoto(file); }, [file]); // eslint-disable-line react-hooks/exhaustive-deps
  const picks = useMemo<Pick[]>(() => all.map((x, i) => ({ name: x.name, emoji: x.emoji, ja: x.ja, sub: `${x.ml} ml · ${Math.round(x.kcal100 * x.ml / 100)} kcal`, mine: i < mine })), [all, mine]);
  const { data, session } = useApp();
  const [say, setSay] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const read = async (ai?: string, askAI = false) => {
    if (!ai && !say.trim()) return;
    // Typed a drink the list knows ("mango lassi 300 ml"): no need to ask the AI.
    const local = !ai ? drinkOf(say.replace(/\d+\s*ml|\b(a|one|big|small|glass|cup|bottle|can|of)\b/gi, " ").trim()) : undefined;
    if (local) { const ml = Number(/(\d+)\s*ml/i.exec(say)?.[1]) || local.ml; onDrink(local, ml); setMsg(`📖 ${local.name}, ${ml} ml. Check the amount below.`); setSay(""); setOffer(false); return; }
    // Not in the app's list: AI only when you tap the button.
    if (!ai && !askAI) { setOffer(true); setMsg("📋 Not in the app's drink list. Check the spelling, or tap Ask AI."); return; }
    setOffer(false);
    setBusy(true); setMsg(ai ? "Reading the label…" : "Reading…");
    // A photo: read the bottle's label first (name, size, nutrition), like a shop item.
    if (ai) {
      const { product: p } = await readProduct(session, ai, `A drink${say.trim() ? `: ${say.trim()}` : ""}`);
      if (p?.found && (p.kind === "drink" || p.grams > 0)) {
        setBusy(false); setSay("");
        const known = drinkMatch(p.name_ja, `${p.brand} ${p.name}`, p.name);
        const ml = Math.round(p.grams) || known?.ml || 500;
        rememberAI(known?.name ?? [p.brand, p.name].filter(Boolean).join(" ").trim(), known?.emoji ?? p.emoji);
        if (known) { onDrink(known, ml); setMsg(`🤖 ${known.name}${known.ja ? ` (${known.ja})` : ""}, ${ml} ml. Check the amount below.`); return; }
        // Not in the list: use the label. Its numbers are per 100 ml or for the serving in "per".
        const base = /100\s*(ml|g|ｍｌ)/i.test(p.per) ? 100 : Number(/(\d+)\s*(ml|g)/i.exec(p.per)?.[1]) || ml;
        const per = (x: number) => Math.round((x / base) * 1000) / 10;
        const name = [p.brand, p.name].filter(Boolean).join(" ").trim() || "Drink";
        onDrink({ name, ja: p.name_ja || undefined, cat: drinkCatOf(`${name} ${p.name_ja}`), emoji: p.emoji || "🥤", ml, kcal100: per(p.kcal), sugar100: per(p.carbs), protein100: per(p.protein), water: 0.9 }, ml);
        setMsg(`🤖 ${name}${p.name_ja ? ` (${p.name_ja})` : ""}, ${ml} ml, ${Math.round(per(p.kcal) * ml / 100)} kcal from the label. Check below; it's saved to My drinks when you log it.`);
        return;
      }
    }
    const r = await readMeal(session, { photo: ai, text: `A drink${say.trim() ? `: ${say.trim()}` : ""}` }, data.items);
    setBusy(false);
    const f = r.foods[0];
    if (!f) { setMsg(ai && !r.ai ? `Photo reading failed (${r.error || "unknown"}). Type what it is, then tap Read.` : "I couldn't tell. Search for it below or type it."); return; }
    const ml = Math.round(f.grams ?? 0) || 250;
    const known = drinkMatch(f.name);
    if (r.ai) rememberAI(known?.name ?? f.name, known?.emoji);
    if (known && r.ai) { onDrink(known, ml); setMsg(`${r.ai ? "🤖" : "📖"} ${known.name}, about ${ml} ml. Check the amount below.`); }
    else {
      const per = (x: number) => Math.round((x / ml) * 1000) / 10;
      onDrink({ name: f.name, cat: "other", emoji: "🥤", ml, kcal100: per(f.kcal * f.qty), sugar100: per((f.sugar ?? 0) * f.qty), protein100: per(f.protein * f.qty), water: 0.9 }, ml);
      setMsg(`${r.ai ? "🤖" : "📖"} ${f.name}, about ${ml} ml${f.kcal ? ` ≈ ${Math.round(f.kcal * f.qty)} kcal` : ""}. ${r.note} Check the amount below.`);
    }
    setSay("");
  };
  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-2.5 space-y-2">
      <div className="text-xs font-semibold">🔍 Snap or say your drink <span className="font-normal text-muted">(front + back photos OK)</span></div>
      <div className="flex gap-2">
        <button onClick={() => ref.current?.click()} aria-label="Drink photo" className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-white/25 grid place-items-center overflow-hidden text-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img src={photo} alt="Drink" className="h-full w-full object-cover" /> : "📷"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" multiple onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) takePhoto(f); }} />
        {ask && <SnapChoice photo={photo} img={ask.imgs} guess={guess} list={picks} what="drink" kind="drink" onClose={() => setAsk(null)} onAI={() => read(ask.ai)}
          onPick={picked} />}
        <textarea className="input flex-1 min-h-14 text-sm" placeholder="big glass of mango lassi, Starbucks latte, 2 cups chai…" value={say} onChange={(e) => { setSay(e.target.value); setOffer(false); }} />
      </div>
      <button disabled={busy || !say.trim()} onClick={() => read()} className="btn-primary w-full !py-1.5 text-sm disabled:opacity-40">{busy ? "Reading…" : "Find in the list"}</button>
      {offer && !busy && <button onClick={() => read(undefined, true)} className="btn-ghost w-full !py-1.5 text-sm ring-1 ring-[var(--accent)]">🤖 Ask AI about &quot;{say.trim().slice(0, 30)}&quot;</button>}
      {msg && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
    </div>
  );
}
