"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Pic } from "@/components/Pic";
import { EQUIP_TYPES, equipOf } from "@/lib/equipment";
import { aiPhoto, readProduct } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { gearOf, itemKind, kitOf, kitText, withGear } from "@/lib/have";
import { useApp, type PantryItem } from "@/lib/store";

// 📷 My equipment: snap your dumbbells, bands or bench and the app knows
// exactly what it is (from the equipment list), saves it with the photo in
// What I have, and builds today's workout from it.
export function EquipmentSheet({ onClose }: { onClose: () => void }) {
  const { data, session, update, celebrate } = useApp();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [say, setSay] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const mine = data.pantry.filter((p) => itemKind(p) === "equipment");
  const kit = kitOf(data.pantry);

  const add = (name: string, extra: Partial<PantryItem>) => {
    const e = equipOf(name);
    const p: PantryItem = {
      id: crypto.randomUUID(), name: e?.name ?? name, emoji: e?.emoji ?? "🏋️", qty: 1, unit: "pcs", last_price: null,
      updated_at: new Date().toISOString(), kind: "equipment", kg: e?.kg, ja: e?.ja, brand: e?.brand, ...extra,
    };
    update((d) => ({ ...d, pantry: [...d.pantry, p] }));
    const moves = withGear(kitOf([...data.pantry, p]), gearOf(p.name)).length;
    celebrate({ title: "GEAR GET!", subtitle: `${p.emoji} ${p.name}${moves ? ` · unlocks ${moves} exercises` : ""}`, kind: "small" });
    setMsg(`${e ? "✓" : "?"} Saved ${p.name}${e ? "" : " (not in the equipment list; tap it in What I have to fix the name)"}.`);
  };

  const snap = async (file: File) => {
    setBusy(true); setMsg("Looking at your equipment…");
    const img = await loadImage(file);
    const photo = smallPhoto(img, 160);
    const r = await readProduct(session, aiPhoto(img), `workout or gym equipment${say.trim() ? `: ${say.trim()}` : ""}`);
    setBusy(false);
    const p = r.product?.found ? r.product : null;
    const text = p ? `${p.brand} ${p.name} ${p.grams && p.unit === "kg" ? `${p.grams} kg` : ""} ${say}` : say;
    if (!text.trim()) { setMsg(`Couldn't tell what it is${r.error ? ` (${r.error})` : ""}. Type it (like "10 kg hex dumbbell") and snap again, or pick below.`); return; }
    add(equipOf(text)?.name ?? p?.name ?? say.trim(), { photo, brand: p?.brand || undefined, note: p?.note || undefined });
    setSay("");
  };

  return (
    <Sheet title="🏋️ My equipment" onClose={onClose}>
      <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-2.5 space-y-2">
        <div className="text-xs font-semibold">📷 Snap your equipment (dumbbell, band, bench…)</div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => ref.current?.click()} aria-label="Equipment photo" className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-white/25 grid place-items-center text-xl">📷</button>
          <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) snap(f); }} />
          <input className="input flex-1 text-sm" placeholder="or type it: 10 kg hex dumbbell, Domyos band…" value={say} onChange={(e) => setSay(e.target.value)} />
        </div>
        <button disabled={busy || !say.trim()} onClick={() => { add(say.trim(), {}); setSay(""); }} className="btn-primary w-full !py-1.5 text-sm disabled:opacity-40">{busy ? "Reading…" : "Add it"}</button>
        {msg && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
      </div>
      {mine.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {mine.map((p) => (
            <div key={p.id} className={`rounded-xl bg-white/5 p-2 flex items-center gap-2 ${p.qty <= 0 ? "opacity-50" : ""}`}>
              <Pic name={p.name} emoji={p.emoji} size={40} src={p.photo} />
              <span className="min-w-0 text-xs"><span className="block font-semibold truncate">{p.name}</span><span className="text-muted">{p.qty} {p.unit}{p.kg ? ` · ${p.kg} kg` : ""}</span></span>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted">No equipment yet. Bodyweight workouts still work; add gear and the plan grows.</p>}
      {Object.keys(kit).length > 0 && <p className="text-xs">Today&apos;s workout uses: <b>{kitText(kit)}</b>.</p>}
      <details>
        <summary className="text-xs text-muted cursor-pointer">Pick a type instead ({EQUIP_TYPES.length})</summary>
        <div className="flex flex-wrap gap-1 mt-2 max-h-48 overflow-y-auto">
          {EQUIP_TYPES.map((t) => <button key={t.name} onClick={() => add(t.name, {})} className="chip !py-0.5 text-[11px]">{t.emoji} {t.name}</button>)}
        </div>
      </details>
      <Link href="/have" onClick={onClose} className="btn-ghost w-full text-center text-sm">🎒 Edit in What I have</Link>
    </Sheet>
  );
}
