"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { allFoods, guessFood, type Eaten } from "@/lib/body";
import { emojiFor } from "@/lib/emoji";
import { lookupFood } from "@/lib/foodlookup";
import { useApp, useCustomItems } from "@/lib/store";

// Turns picked food names and amounts into calories and protein.
export function useEaten(picked: Record<string, number>): Eaten[] {
  const { data } = useApp();
  const foods = allFoods(data.items);
  return Object.entries(picked).flatMap(([name, qty]) => {
    const fd = foods.find((x) => x.name === name);
    return fd ? [{ name, qty, kcal: Math.round(fd.kcal * qty), protein: +(fd.protein * qty).toFixed(1) }] : [];
  });
}

// Add your own food: name, serving, contents, calories and protein.
// "Auto-fill" looks it up in the Open Food Facts database.
export function MyFoodForm({ initial = "", onSaved }: { initial?: string; onSaved?: (name: string) => void }) {
  const { add } = useCustomItems("food");
  const [name, setName] = useState(initial);
  const [per, setPer] = useState("1 serving");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [contents, setContents] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const auto = async () => {
    setBusy(true); setMsg("");
    const known = guessFood(name);
    const f = await lookupFood(name);
    setBusy(false);
    if (f) {
      if (f.kcalServing) { setPer(f.serving || "1 serving"); setKcal(String(f.kcalServing)); setProtein(String(f.proteinServing ?? "")); }
      else { setPer("100 g"); setKcal(String(f.kcal100)); setProtein(String(f.protein100)); }
      if (f.contents) setContents(f.contents);
      setMsg(`Found "${f.name}" in Open Food Facts. Check the numbers on the packet if you have it.`);
    } else if (known) {
      setPer(known.per); setKcal(String(known.kcal)); setProtein(String(known.protein));
      setMsg(`Used typical values for ${known.name}.`);
    } else setMsg("Couldn't find it. Type the calories from the packet (look for “Energy kcal”).");
  };
  const save = () => {
    if (!name.trim() || !Number(kcal)) return setMsg("Add a name and the calories.");
    add(name.trim(), { per, kcal: Number(kcal), protein: Number(protein) || 0, contents, emoji: emojiFor(name, "🍽️") });
    onSaved?.(name.trim());
    setName(""); setKcal(""); setProtein(""); setContents(""); setMsg("Saved to My foods.");
  };
  return (
    <div className="rounded-xl bg-black/20 p-3 space-y-2">
      <div className="text-xs font-semibold">➕ Add my food</div>
      <div className="flex gap-2">
        <input className="input" placeholder="Food name (e.g. Parle-G, Mom's khichdi)" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={auto} disabled={busy || name.trim().length < 2} className="btn-ghost !px-3 text-xs">{busy ? "…" : "Auto-fill"}</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[10px] text-muted">Serving<input className="input mt-0.5" value={per} onChange={(e) => setPer(e.target.value)} /></label>
        <label className="text-[10px] text-muted">kcal<input className="input mt-0.5" inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} /></label>
        <label className="text-[10px] text-muted">Protein g<input className="input mt-0.5" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} /></label>
      </div>
      <textarea className="input min-h-14 text-xs" placeholder="Contents / ingredients (optional)" value={contents} onChange={(e) => setContents(e.target.value)} />
      {msg && <div className="text-[11px] text-muted">{msg}</div>}
      <button onClick={save} className="btn-primary w-full !py-2 text-sm">Save food</button>
    </div>
  );
}

export function FoodPicker({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const { data } = useApp();
  const foods = allFoods(data.items);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const list = useEaten(value);
  const add = (name: string, n: number) => {
    const qty = Math.max(0, +((value[name] ?? 0) + n).toFixed(1));
    const c = { ...value };
    if (qty) c[name] = qty; else delete c[name];
    onChange(c);
  };
  const shown = q ? foods.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()) || x.re.test(q)) : foods.slice(0, 18);
  const kcal = list.reduce((n, x) => n + x.kcal, 0);
  return (
    <div className="rounded-xl bg-white/[.04] border border-white/10 p-3 space-y-2">
      <div className="flex justify-between text-xs"><span className="text-muted">What did you eat?</span>{kcal > 0 && <b>{kcal} kcal · {list.reduce((n, x) => n + x.protein, 0).toFixed(0)} g protein</b>}</div>
      <input className="input" placeholder="Search food (apple, roti, egg…)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-wrap gap-1.5">
        {shown.slice(0, 30).map((x) => (
          <button key={x.name} onClick={() => add(x.name, 1)} className={`chip !py-1 text-xs ${value[x.name] ? "chip-on" : ""}`}>
            {x.emoji} {x.name}{value[x.name] ? ` × ${value[x.name]}` : ""}
          </button>
        ))}
        <button onClick={() => setAdding(!adding)} className="chip !py-1 text-xs border-dashed">➕ {q && !shown.length ? `Add “${q}”` : "My food"}</button>
      </div>
      {adding && <MyFoodForm initial={q} onSaved={(n) => { add(n, 1); setAdding(false); setQ(""); }} />}
      {list.map((x) => {
        const fd = foods.find((y) => y.name === x.name)!;
        return (
          <div key={x.name} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{fd.emoji} {x.name} <span className="text-xs text-muted">({fd.per} = {fd.kcal} kcal)</span></span>
            <button onClick={() => add(x.name, -0.5)} className="chip !px-2 !py-0.5">−</button>
            <b className="w-8 text-center">{x.qty}</b>
            <button onClick={() => add(x.name, 0.5)} className="chip !px-2 !py-0.5">+</button>
            <span className="w-16 text-right text-xs">{x.kcal} kcal</span>
          </div>
        );
      })}
    </div>
  );
}

// Tools: list and add your own foods.
export function MyFoodsSheet({ onClose }: { onClose: () => void }) {
  const { items, remove } = useCustomItems("food");
  return (
    <Sheet title="🍽️ My foods" onClose={onClose}>
      <p className="text-xs text-muted">Foods you add here show up in every meal with their real calories and protein. Bought something new? Add it with the numbers from the packet, or tap Auto-fill.</p>
      <MyFoodForm />
      {items.length === 0 ? <p className="text-sm text-muted text-center py-2">No foods of your own yet.</p> : (
        <ul className="divide-y divide-white/5">
          {items.map((i) => (
            <li key={i.id} className="py-2 flex items-start gap-2 text-sm">
              <span className="text-xl">{String(i.config.emoji ?? "🍽️")}</span>
              <div className="flex-1">
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-muted">{String(i.config.per)} · {String(i.config.kcal)} kcal · {String(i.config.protein ?? 0)} g protein</div>
                {typeof i.config.contents === "string" && i.config.contents && <div className="text-[11px] text-muted">{i.config.contents}</div>}
              </div>
              <button onClick={() => remove(i.id)} className="text-xs text-muted">✕</button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
