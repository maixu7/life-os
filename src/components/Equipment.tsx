"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Pic } from "@/components/Pic";
import { EQUIP_TYPES, equipOf, parseGear } from "@/lib/equipment";
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
  const [photos, setPhotos] = useState<string[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const mine = data.pantry.filter((p) => itemKind(p) === "equipment");
  const kit = kitOf(data.pantry);

  // One or more things to save: a name, how many and the weight of each.
  const save = (items: { name: string; qty?: number; kg?: number; extra?: Partial<PantryItem> }[]) => {
    const made: PantryItem[] = items.map(({ name, qty, kg, extra }) => {
      const e = equipOf(name);
      return {
        id: crypto.randomUUID(), name: e?.name ?? name, emoji: e?.emoji ?? "🏋️", qty: qty || 1, unit: "pcs", last_price: null,
        updated_at: new Date().toISOString(), kind: "equipment", kg: kg ?? e?.kg, ja: e?.ja, brand: e?.brand, ...extra,
      };
    });
    if (!made.length) return;
    update((d) => ({ ...d, pantry: [...d.pantry, ...made] }));
    const g = made.map((p) => gearOf(p.name)).find(Boolean);
    const moves = g ? withGear(kitOf([...data.pantry, ...made]), g).length : 0;
    celebrate({ title: "GEAR GET!", subtitle: `${made.map((p) => `${p.emoji} ${p.name}`).slice(0, 3).join(", ")}${made.length > 3 ? ` +${made.length - 3}` : ""}${moves ? ` · unlocks ${moves} exercises` : ""}`, kind: "small" });
    setMsg(`✓ Saved ${made.map((p) => `${p.name}${p.qty > 1 ? ` ×${p.qty}` : ""}${p.kg ? ` (${p.kg} kg${p.qty > 1 ? " each" : ""})` : ""}`).join(", ")}.`);
  };
  const add = (name: string, extra: Partial<PantryItem>) => save([{ name, extra }]);

  // Read each photo like food and drinks: the AI names it, the equipment list
  // pins down exactly what it is. Several photos at once are fine.
  const snap = async (files: File[]) => {
    const out: Parameters<typeof save>[0] = [];
    const missed: string[] = [];
    setBusy(true);
    for (const [i, file] of files.entries()) {
      setMsg(`Looking at your equipment${files.length > 1 ? ` (${i + 1} of ${files.length})` : ""}…`);
      const img = await loadImage(file);
      const photo = smallPhoto(img, 160);
      setPhotos((ps) => [...ps, photo]);
      const r = await readProduct(session, aiPhoto(img), `workout or gym equipment${say.trim() ? `: ${say.trim()}` : ""}`);
      const p = r.product?.found ? r.product : null;
      const text = p ? `${p.brand} ${p.name} ${p.name_ja} ${p.grams && /kg|g/.test(p.unit) ? `${p.grams} kg` : ""} ${say}` : say;
      if (!text.trim()) { missed.push(r.error ?? "not sure what it is"); continue; }
      const line = parseGear(text)[0];
      out.push({ name: equipOf(text)?.name ?? p?.name ?? say.trim(), qty: line?.qty, kg: line?.kg, extra: { photo, brand: p?.brand || undefined, note: p?.note || undefined } });
    }
    setBusy(false);
    save(out);
    if (missed.length) setMsg((m) => `${out.length ? `${m} ` : ""}${missed.length} photo${missed.length > 1 ? "s" : ""} not read (${missed[0]}). Type what it is, then tap Read, or pick a type below.`);
    if (out.length) setSay("");
  };
  const typed = () => { const list = parseGear(say); if (!list.length) return; save(list); setSay(""); };

  return (
    <Sheet title="🏋️ My equipment" onClose={onClose}>
      <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-2.5 space-y-2">
        <div className="text-xs font-semibold">📷 Snap your equipment (dumbbell, band, bench…)</div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => ref.current?.click()} aria-label="Equipment photo" className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-white/25 grid place-items-center overflow-hidden text-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos.length ? <img src={photos[photos.length - 1]} alt="Equipment" className="h-full w-full object-cover" /> : "📷"}
          </button>
          <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) snap(f); }} />
          <textarea className="input flex-1 min-h-14 text-sm" placeholder={"or type it, one per line:\ndumbbell 10 kg ×2\nkettlebell 20 kg\nab wheel"} value={say} onChange={(e) => setSay(e.target.value)} />
        </div>
        <button disabled={busy || !say.trim()} onClick={typed} className="btn-primary w-full !py-1.5 text-sm disabled:opacity-40">{busy ? "Reading…" : "Read & add"}</button>
        <p className="text-[10px] text-muted">📷 Take a photo or pick several from your library. Many things at once? Type one per line with how many and the kg.</p>
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
