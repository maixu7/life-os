"use client";

import { useEffect, useRef, useState } from "react";
import { emojiFor } from "@/lib/emoji";
import { lookupBarcode } from "@/lib/foodlookup";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { readLabel, type Label } from "@/lib/label";
import { useCustomItems } from "@/lib/store";

type Draft = { name: string; per: string; kcal: string; protein: string; fat: string; carbs: string; salt: string; contents: string; barcode: string; photo: string };
const EMPTY: Draft = { name: "", per: "1 pack", kcal: "", protein: "", fat: "", carbs: "", salt: "", contents: "", barcode: "", photo: "" };

// Snap the packet (front and back): the app reads the nutrition table in
// English or Japanese and saves it as one of your foods with real numbers.
export function LabelScan({ files, onSaved, compact }: { files?: File[]; onSaved?: (name: string) => void; compact?: boolean }) {
  const { add } = useCustomItems("food");
  const [d, setD] = useState<Draft>(EMPTY);
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const done = useRef(new Set<File>());

  const read = async (list: File[]) => {
    setBusy(true);
    let merged: Partial<Label> = {};
    let photo = d.photo;
    for (const [i, f] of list.entries()) {
      if (done.current.has(f)) continue;
      done.current.add(f);
      setStatus(`Reading photo ${i + 1} of ${list.length} (English + 日本語)… the first time downloads the reader.`);
      try {
        const img = await loadImage(f);
        photo ||= smallPhoto(img, 160);
        const r = await readLabel(img);
        merged = { ...r, ...Object.fromEntries(Object.entries(merged).filter(([, v]) => v != null && v !== "")), names: [...(merged.names ?? []), ...r.names] };
      } catch {
        setStatus("Couldn't load the label reader (needs internet the first time). Type the numbers below.");
      }
    }
    let { kcal, protein } = merged;
    if (merged.barcode && kcal == null) {
      setStatus("Checking the barcode online…");
      const b = await lookupBarcode(merged.barcode);
      if (b) { kcal = b.kcalServing ?? b.kcal100; protein = b.proteinServing ?? b.protein100; merged.per ||= b.kcalServing ? b.serving : "100g"; merged.names = [b.name, ...(merged.names ?? [])]; merged.contents ||= b.contents; }
    }
    const nm = merged.names ?? [];
    setNames(nm);
    setD((p) => ({
      ...p, photo,
      name: p.name || nm[0] || "",
      per: merged.per ? merged.per.replace(/^1袋/, "1 bag ").replace(/^1個/, "1 piece ").replace(/^1本/, "1 bottle ").replace(/^1枚/, "1 piece ").replace(/^1食/, "1 meal ") : p.per,
      kcal: kcal != null ? String(kcal) : p.kcal, protein: protein != null ? String(protein) : p.protein,
      fat: merged.fat != null ? String(merged.fat) : p.fat, carbs: merged.carbs != null ? String(merged.carbs) : p.carbs,
      salt: merged.salt != null ? String(merged.salt) : p.salt, contents: merged.contents || p.contents, barcode: merged.barcode || p.barcode,
    }));
    setFound(kcal != null);
    setStatus(kcal != null ? `Found ${kcal} kcal${merged.per ? ` per ${merged.per}` : ""}. Check the name and save.` : "I couldn't find the calories. Take a clear, straight photo of the nutrition table (栄養成分表示), or type them.");
    setBusy(false);
  };
  useEffect(() => { if (files?.length) read(files); }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!d.name.trim() || !Number(d.kcal)) return setStatus("Add a name and the calories.");
    add(d.name.trim(), { per: d.per, kcal: Number(d.kcal), protein: Number(d.protein) || 0, fat: Number(d.fat) || undefined, carbs: Number(d.carbs) || undefined, salt: Number(d.salt) || undefined, contents: d.contents, barcode: d.barcode || undefined, photo: d.photo || undefined, emoji: emojiFor(d.name, "🍽️") });
    onSaved?.(d.name.trim());
    setStatus(`Saved “${d.name.trim()}” to My foods.`);
    setD(EMPTY); setNames([]); setFound(false);
  };
  const f = (k: keyof Draft, label: string, mode: "decimal" | "text" = "decimal") => (
    <label className="text-[10px] text-muted">{label}<input className="input mt-0.5 !py-1.5" inputMode={mode} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} /></label>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs font-semibold">🏷️ Read the packet {found && <span className="text-emerald-300">✓</span>}</div>
        <button onClick={() => input.current?.click()} disabled={busy} className="btn-ghost !px-3 !py-1.5 text-xs">{busy ? "Reading…" : "📷 Snap label"}</button>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const l = [...(e.target.files ?? [])]; if (l.length) read(l); e.target.value = ""; }} />
      </div>
      {!compact && !status && <p className="text-[11px] text-muted">Photograph the back of the packet (the nutrition table, 栄養成分表示). You can pick the front and back together.</p>}
      {status && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{status}</p>}
      {(found || d.kcal || names.length > 0) && (
        <>
          {names.length > 0 && <div className="flex flex-wrap gap-1">{names.map((n) => <button key={n} onClick={() => setD({ ...d, name: n })} className={`chip !py-0.5 text-[11px] ${d.name === n ? "chip-on" : ""}`}>{n}</button>)}</div>}
          <div className="grid grid-cols-2 gap-2">{f("name", "Name", "text")}{f("per", "Per (serving)", "text")}</div>
          <div className="grid grid-cols-3 gap-2">{f("kcal", "kcal")}{f("protein", "Protein g")}{f("fat", "Fat g")}{f("carbs", "Carbs g")}{f("salt", "Salt g")}{f("barcode", "Barcode", "text")}</div>
          <textarea className="input min-h-12 text-xs" placeholder="Ingredients" value={d.contents} onChange={(e) => setD({ ...d, contents: e.target.value })} />
          <button onClick={save} className="btn-primary w-full !py-2 text-sm">Save to My foods{onSaved ? " and add" : ""}</button>
        </>
      )}
    </div>
  );
}
