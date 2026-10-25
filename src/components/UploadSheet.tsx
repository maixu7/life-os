"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { SnapChoice, useRememberSnap, type LabelRead, type Pick } from "@/components/SnapChoice";
import { aiPhotos, readProduct } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { DRINKS } from "@/lib/drinks";
import { EQUIPMENT } from "@/lib/equipment";
import { goods } from "@/lib/goods";
import { FOODS } from "@/lib/body";
import { emojiFor } from "@/lib/emoji";
import { UNITS, useApp, type PantryItem, type ShopItem } from "@/lib/store";
import { putPhoto } from "@/lib/vault";
import { openHub } from "@/components/hub/registry";

// One upload screen per collection (food, drink, equipment, shopping):
// 1. Gallery upload, or Scan now (AI scan / Non-AI scan) at the top,
// 2. that collection's own fields in the middle,
// 3. Save at the bottom, straight into the collection.
// Photos come from the gallery or file picker (no forced camera), show a
// thumbnail at once and are shrunk before they are kept.

export type UploadCat = "food" | "drink" | "equipment" | "shopping";
const TITLE: Record<UploadCat, string> = { food: "🍱 Add food", drink: "🥤 Add a drink", equipment: "🏋️ Add equipment", shopping: "🛒 Add to shopping" };
const LB = 0.45359237;

type F = {
  name: string; qty: string; unit: string;
  kcal: string; grams: string; protein: string; carbs: string; fat: string; vits: string; // food
  ml: string; sugar: string; minerals: string; // drink
  each: string; eachUnit: "kg" | "lb" | "L"; price: string; // equipment (price per piece) and shopping (unit price)
  type: string; // shopping: quality / type
  note: string;
};
const num = (s: string) => { const n = Number(String(s).replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const str = (n?: number | null) => (n == null || !Number.isFinite(n) || n === 0 ? "" : String(+n.toFixed(2)));

export function UploadSheet({ cat, item, onClose, onShop }: {
  cat: UploadCat; item?: PantryItem | null; onClose: () => void;
  /** Shopping: the page saves the item (and its photo) to the list. */
  onShop?: (i: ShopItem, photo: File | null) => void;
}) {
  const { data, update, session } = useApp();
  const remember = useRememberSnap();
  const per = item?.per ?? "";
  const [f, setF] = useState<F>({
    name: item?.name ?? "", qty: String(item?.qty ?? 1), unit: cat === "food" ? (item?.unit ?? "pcs") : cat === "drink" ? (item?.unit ?? "bottle") : "pcs",
    kcal: str(item?.kcal), grams: /g$/.test(per) ? String(parseFloat(per) || "") : "", protein: str(item?.protein), carbs: str(item?.facts?.carbs), fat: str(item?.facts?.fat),
    vits: "", ml: /ml$/.test(per) ? String(parseFloat(per) || "") : "", sugar: str(item?.facts?.sugar), minerals: "",
    each: str(item?.kg), eachUnit: "kg", price: str(item?.last_price), type: "", note: item?.note ?? "",
  });
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [files, setFiles] = useState<File[]>([]);
  const [imgs, setImgs] = useState<HTMLImageElement[]>([]);
  const [thumb, setThumb] = useState(item?.photo ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [choose, setChoose] = useState(false);
  const next = useRef<"none" | "ai" | "list">("none");
  const pickRef = useRef<HTMLInputElement>(null);

  // What the Non-AI scan can match against, for this collection only.
  const list = useMemo<Pick[]>(() => {
    if (cat === "drink") return [...data.pantry.filter((p) => p.kind === "drink").map((p) => ({ name: p.name, emoji: p.emoji, sub: "in my drinks", mine: true })), ...DRINKS.map((d) => ({ name: d.name, emoji: d.emoji, ja: d.ja, sub: `${d.ml} ml` }))];
    if (cat === "equipment") return [...data.pantry.filter((p) => p.kind === "equipment").map((p) => ({ name: p.name, emoji: p.emoji, sub: "in my gym", mine: true })), ...EQUIPMENT.map((e) => ({ name: e.name, emoji: e.emoji, ja: e.ja, sub: e.brand }))];
    if (cat === "shopping") return [...new Set(data.shopping.map((s) => s.name))].map((n) => ({ name: n, emoji: emojiFor(n, "🛍️"), sub: "bought before", mine: true })).concat(goods().map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.cat, mine: false })));
    return [...data.pantry.filter((p) => ["food", "fruit", "veg"].includes(p.kind ?? "")).map((p) => ({ name: p.name, emoji: p.emoji, sub: "in my food", mine: true })), ...goods().filter((g) => g.kind !== "drink" && g.kind !== "utensil").map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.kcal ? `${g.kcal} kcal per ${g.per}` : g.cat }))];
  }, [cat, data.pantry, data.shopping]);

  // Gallery or file picker only, then a thumbnail at once.
  const got = async (fs: File[]) => {
    if (!fs.length) return;
    setBusy(true);
    try {
      const im = await Promise.all(fs.map(loadImage));
      setFiles(fs); setImgs(im); setThumb(smallPhoto(im[0], 192));
      setMsg(`🖼️ ${fs.length} photo${fs.length > 1 ? "s" : ""} added.`);
      const n = next.current; next.current = "none";
      if (n === "ai") await aiScan(im);
      if (n === "list") setChoose(true);
    } catch { setMsg("That picture couldn't be opened. Try another one."); }
    finally { setBusy(false); }
  };
  const open = (then: "none" | "ai" | "list") => {
    if (then !== "none" && imgs.length) { if (then === "ai") aiScan(imgs); else setChoose(true); return; }
    next.current = then; pickRef.current?.click();
  };

  // Fill the fields from what was read (label, list entry or AI).
  const fillFromName = (name: string) => {
    if (cat === "drink") {
      const d = DRINKS.find((x) => x.name === name);
      if (d) setF((x) => ({ ...x, name, ml: String(d.ml), kcal: str((d.kcal100 * d.ml) / 100), sugar: str((d.sugar100 * d.ml) / 100), protein: str(((d.protein100 ?? 0) * d.ml) / 100) }));
      else setF((x) => ({ ...x, name }));
    } else if (cat === "equipment") {
      const e = EQUIPMENT.find((x) => x.name === name);
      setF((x) => ({ ...x, name, each: e?.kg ? String(e.kg) : x.each, note: x.note || [e?.brand, e?.note].filter(Boolean).join(" · ") }));
    } else {
      const g = goods().find((x) => x.name === name);
      const fd = FOODS.find((x) => x.re.test(name));
      setF((x) => ({ ...x, name, kcal: g?.kcal ? String(g.kcal) : fd ? String(fd.kcal) : x.kcal, protein: g?.protein ? String(g.protein) : fd ? String(fd.protein) : x.protein, grams: /\d+\s*g/.test(g?.per ?? "") ? String(parseFloat(g!.per)) : x.grams }));
    }
  };
  const onPick = (p: Pick, l?: LabelRead) => {
    setChoose(false);
    fillFromName(p.name);
    if (l) setF((x) => ({
      ...x,
      kcal: l.kcal != null ? String(l.kcal) : x.kcal, protein: l.protein != null ? String(l.protein) : x.protein, carbs: l.carbs != null ? String(l.carbs) : x.carbs,
      fat: l.fat != null ? String(l.fat) : x.fat, sugar: l.sugar != null ? String(l.sugar) : x.sugar,
      grams: /g$/.test(l.per ?? "") ? String(parseFloat(l.per!)) : x.grams, ml: /ml$/.test(l.per ?? "") ? String(parseFloat(l.per!)) : x.ml,
      note: x.note || (l.contents ? `Contains: ${l.contents}` : ""),
    }));
    setMsg(`📋 ${p.emoji} ${p.name}${l?.kcal != null ? ` · ${l.kcal} kcal from the label` : ""}. Check the fields, then Save.`);
  };
  const aiScan = async (im: HTMLImageElement[]) => {
    setBusy(true); setMsg("🤖 AI scan is reading the photo…");
    const hint = cat === "equipment" ? "gym equipment" : cat === "shopping" ? "something I want to buy" : cat;
    const r = await readProduct(session, aiPhotos(im), [hint, f.name].filter(Boolean).join(": "));
    setBusy(false);
    const p = r.product;
    if (!p || p.found === false || !p.name) { setMsg(`AI couldn't read it${r.error ? ` (${r.error})` : ""}. Try Non-AI scan or type it.`); return; }
    remember(p.name, p.emoji);
    setF((x) => ({
      ...x, name: p.name, qty: p.qty > 0 && cat !== "equipment" ? String(p.qty) : x.qty, unit: p.unit && UNITS.includes(p.unit) && cat !== "equipment" ? p.unit : x.unit,
      kcal: p.kcal ? String(Math.round(p.kcal)) : x.kcal, protein: p.protein ? String(p.protein) : x.protein, carbs: p.carbs ? String(p.carbs) : x.carbs, fat: p.fat ? String(p.fat) : x.fat,
      grams: /g$/.test(p.per) ? String(parseFloat(p.per)) : p.grams && cat === "food" ? String(p.grams) : x.grams, ml: /ml$/.test(p.per) ? String(parseFloat(p.per)) : x.ml,
      note: x.note || [p.brand, p.name_ja, p.allergens ? `Allergens: ${p.allergens}` : ""].filter(Boolean).join(" · "),
    }));
    setMsg(`🤖 ${p.emoji ?? ""} ${p.name}${p.brand ? ` · ${p.brand}` : ""}. Check the fields, then Save.`);
  };

  // Equipment: pieces × weight each = total.
  const eachKg = f.eachUnit === "lb" ? num(f.each) * LB : num(f.each);
  const pieces = Math.max(0, num(f.qty));
  const total = cat === "equipment" ? +(pieces * eachKg).toFixed(2) : 0;
  const shopTotal = +(num(f.qty) * num(f.price)).toFixed(2);

  const save = () => {
    const name = f.name.trim();
    if (!name) return;
    const now = new Date().toISOString();
    if (cat === "shopping") {
      onShop?.({
        id: crypto.randomUUID(), name, emoji: emojiFor(name, "🛍️"), qty: num(f.qty) || 1, unit: f.unit, price: f.price ? shopTotal : null,
        category: f.type.trim(), note: f.note.trim(), photo_id: null, status: "to_buy", purchased_at: null, created_at: now,
      }, files[0] ?? null);
      onClose();
      return;
    }
    const kind = cat === "equipment" ? "equipment" : cat === "drink" ? "drink" : "food";
    const facts = cat === "equipment" ? undefined : Object.fromEntries(Object.entries({ kcal: num(f.kcal), protein: num(f.protein), carbs: num(f.carbs), fat: num(f.fat), sugar: num(f.sugar) }).filter(([, v]) => v > 0));
    const extra = [cat === "food" && f.vits.trim() ? `Vitamins/minerals: ${f.vits.trim()}` : "", cat === "drink" && f.vits.trim() ? `Vitamins: ${f.vits.trim()}` : "", cat === "drink" && f.minerals.trim() ? `Minerals: ${f.minerals.trim()}` : ""].filter(Boolean);
    const p: PantryItem = {
      ...item, id: item?.id ?? crypto.randomUUID(), name, emoji: item?.emoji || emojiFor(name, kind === "equipment" ? "🏋️" : kind === "drink" ? "🥤" : "🍱"),
      qty: num(f.qty), unit: cat === "equipment" ? "pcs" : f.unit, last_price: f.price ? num(f.price) : item?.last_price ?? null, updated_at: now, kind,
      photo: thumb || undefined, kg: cat === "equipment" && eachKg > 0 ? +eachKg.toFixed(2) : undefined,
      note: [f.note.trim(), ...extra].filter(Boolean).join(" · ") || undefined,
      kcal: cat === "equipment" || !f.kcal ? undefined : num(f.kcal), protein: cat === "equipment" || !f.protein ? undefined : num(f.protein),
      per: cat === "food" ? (f.grams ? `${num(f.grams)} g` : "1 serving") : cat === "drink" ? (f.ml ? `${num(f.ml)} ml` : "1 bottle") : undefined,
      facts: facts && Object.keys(facts).length ? facts : undefined,
    };
    update((d) => {
      const nd = { ...d, pantry: d.pantry.some((x) => x.id === p.id) ? d.pantry.map((x) => (x.id === p.id ? p : x)) : [...d.pantry, p] };
      // Food and drinks with calories also go to My foods, so eating them counts right.
      if (p.kcal && cat !== "equipment" && !d.items.some((i) => i.category === "food" && i.name.toLowerCase() === name.toLowerCase()))
        nd.items = [...d.items, { id: crypto.randomUUID(), category: "food", name, sort: Date.now(), config: { per: p.per, kcal: p.kcal, protein: p.protein ?? 0, emoji: p.emoji, photo: thumb || undefined } }];
      return nd;
    });
    onClose();
  };

  // A labelled field (a plain function, so typing never loses focus).
  const L = ({ t, k, ph, w }: { t: string; k: keyof F; ph?: string; w?: string }) => (
    <label key={k} className={`text-xs text-muted ${w ?? ""}`}>{t}<input className="input mt-1" inputMode={["name", "vits", "minerals", "note", "type"].includes(k) ? "text" : "decimal"} placeholder={ph} value={f[k] as string} onChange={set(k)} /></label>
  );

  return (
    <Sheet title={item ? `✏️ ${item.name}` : TITLE[cat]} onClose={onClose}>
      {/* 1. Photo: gallery, or scan now */}
      <section className="space-y-2">
        <div className="flex gap-3 items-stretch">
          <button onClick={() => open("none")} className="h-24 w-24 shrink-0 rounded-2xl border border-dashed border-white/25 bg-white/[.04] grid place-items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {thumb ? <img src={thumb} alt={f.name || "Photo"} className="h-full w-full object-cover" /> : <span className="text-xs text-muted text-center">🖼️<br />No photo</span>}
          </button>
          <div className="flex-1 grid gap-2">
            <button disabled={busy} onClick={() => open("none")} className="btn-primary !py-2 text-sm">🖼️ Gallery upload</button>
            <div className="text-[11px] text-muted">Scan now</div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => open("ai")} className="chip chip-on !py-2 text-xs justify-center">🤖 AI scan</button>
              <button disabled={busy} onClick={() => open("list")} className="chip !py-2 text-xs justify-center">📋 Non-AI scan</button>
            </div>
          </div>
        </div>
        <input ref={pickRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const fs = [...(e.target.files ?? [])]; e.target.value = ""; got(fs); }} />
        {msg && <p className={`text-[11px] ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
      </section>
      {choose && imgs.length > 0 && <SnapChoice photo={thumb} img={imgs} list={list} what={cat === "equipment" ? "equipment" : cat === "drink" ? "drink" : "item"} kind={cat === "equipment" ? "equipment" : cat === "drink" ? "drink" : cat === "food" ? "food" : "item"} addNew laterType={cat === "shopping" ? "shop" : cat === "equipment" ? "equipment" : cat === "drink" ? "drink" : "food"} onClose={() => setChoose(false)} onAI={() => { setChoose(false); aiScan(imgs); }} onPick={onPick} />}

      {/* 2. This collection's own fields */}
      <section className="space-y-2">
        {L({ t: cat === "shopping" ? "Item name" : "Name", k: "name", ph: cat === "equipment" ? "Dumbbell" : cat === "drink" ? "Green tea" : cat === "shopping" ? "Rice" : "Onigiri" })}
        {cat === "food" && (<>
          <div className="grid grid-cols-3 gap-2">{L({ t: "Calories (kcal)", k: "kcal" })}{L({ t: "Grams", k: "grams" })}{L({ t: "How many", k: "qty" })}</div>
          <div className="grid grid-cols-3 gap-2">{L({ t: "Protein g", k: "protein" })}{L({ t: "Carbs g", k: "carbs" })}{L({ t: "Fats g", k: "fat" })}</div>
          {L({ t: "Vitamins / minerals", k: "vits", ph: "Vitamin C, iron…" })}
        </>)}
        {cat === "drink" && (<>
          <div className="grid grid-cols-3 gap-2">{L({ t: "Volume ml", k: "ml" })}{L({ t: "Calories", k: "kcal" })}{L({ t: "Sugar g", k: "sugar" })}</div>
          <div className="grid grid-cols-2 gap-2">{L({ t: "Vitamins", k: "vits", ph: "B6, C…" })}{L({ t: "Minerals", k: "minerals", ph: "Calcium, potassium…" })}</div>
          {L({ t: "How many bottles / cans", k: "qty" })}
        </>)}
        {cat === "equipment" && (<>
          <div className="grid grid-cols-3 gap-2">
            {L({ t: "Pieces", k: "qty" })}
            {L({ t: "Weight / volume each", k: "each", ph: "10" })}
            <label className="text-xs text-muted">Unit<select className="input mt-1" value={f.eachUnit} onChange={set("eachUnit")}><option value="kg">kg</option><option value="lb">lb</option><option value="L">L</option></select></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted">Total<div className="input mt-1 !bg-white/5 font-semibold text-[var(--text)]">{pieces} {pieces === 1 ? "piece" : "pieces"}{num(f.each) > 0 ? ` · ${num(f.each)} ${f.eachUnit} each · ${f.eachUnit === "L" ? `${+(pieces * num(f.each)).toFixed(2)} L` : `${total} kg`} total` : ""}</div></div>
            {L({ t: "Price tag (each)", k: "price", ph: "0" })}
          </div>
        </>)}
        {cat === "shopping" && (<>
          <div className="grid grid-cols-3 gap-2">
            {L({ t: "Quantity", k: "qty" })}
            <label className="text-xs text-muted">Unit<select className="input mt-1" value={f.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
            {L({ t: "Quality / type", k: "type", ph: "Organic, brand…" })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {L({ t: "Unit price", k: "price", ph: "0" })}
            <div className="text-xs text-muted">Total price<div className="input mt-1 !bg-white/5 font-semibold text-[var(--text)]">{f.price ? shopTotal.toLocaleString() : "—"}</div></div>
          </div>
        </>)}
        {(cat === "food" || cat === "drink") && <label className="text-xs text-muted">Unit<select className="input mt-1" value={f.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>}
        <label className="text-xs text-muted block">Note<textarea className="input mt-1 min-h-12 text-sm" value={f.note} onChange={set("note")} placeholder={cat === "equipment" ? "Your words (adjustable 2–10 kg, door bar…)" : "Optional"} /></label>
      </section>

      {/* 3. Save */}
      <button disabled={!f.name.trim() || busy} onClick={save} className="btn-primary w-full !py-3 text-base">💾 Save to {cat === "shopping" ? "shopping list" : cat === "equipment" ? "my gym collection" : cat === "drink" ? "my drinks" : "my food"}</button>
    </Sheet>
  );
}

// "Upload" from anywhere: pick which collection, then its own upload screen.
export { openUpload } from "@/lib/openUpload";
export function UploadHost() {
  const [open, setOpen] = useState<UploadCat | "pick" | null>(null);
  useEffect(() => {
    const go = (e: Event) => setOpen((e as CustomEvent<UploadCat | null>).detail ?? "pick");
    window.addEventListener("lifeos-upload", go);
    return () => window.removeEventListener("lifeos-upload", go);
  }, []);
  const { update, session } = useApp();
  if (!open) return null;
  if (open !== "pick") return <UploadSheet cat={open} onClose={() => setOpen(null)} onShop={async (item, photo) => {
    let photo_id: string | null = null;
    if (photo) { photo_id = crypto.randomUUID(); await putPhoto(session, photo_id, photo).catch(() => { photo_id = null; }); }
    update((d) => ({ ...d, shopping: [...d.shopping, { ...item, photo_id }] }));
  }} />;
  const ROWS: [UploadCat, string, string][] = [["food", "🍱 Food", "Name, calories, grams, protein, carbs, fats"], ["drink", "🥤 Drink", "Name, volume, calories, sugar, vitamins"], ["equipment", "🏋️ Equipment", "Pieces, weight each, total, price"], ["shopping", "🛒 Shopping", "Quantity, type, unit price, total"]];
  return (
    <Sheet title="📷 Upload: what is it?" onClose={() => setOpen(null)}>
      {ROWS.map(([c, t, s]) => (
        <button key={c} onClick={() => setOpen(c)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
          <span className="block font-bold">{t}</span><span className="block text-[11px] text-muted">{s}</span>
        </button>
      ))}
      <button onClick={() => { setOpen(null); openHub("later"); }} className="w-full chip !py-2 text-xs justify-center">⏰ Save photos to scan later</button>
    </Sheet>
  );
}
