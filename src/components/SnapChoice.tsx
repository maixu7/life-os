"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { fingerprint, smallPhoto } from "@/lib/foodphoto";
import { autoLangs, isAutoLangs, OCR_LANGS, ocrLangs, parseLabel, readLabel, resetOcrLangs, setOcrLangs, type Label } from "@/lib/label";
import { productByBarcode, productByName, type FoodFacts, type Product } from "@/lib/foodlookup";
import { byBarcode, lastSnap, lookAlikes, pack, remember, setLastSnap, type Seen, type SnapKind } from "@/lib/snapmemory";
import { scanBarcode, validCode } from "@/lib/barcode";
import { useApp } from "@/lib/store";
import { FactsTable } from "@/components/FactsTable";
import { imgBlob, saveLater, type LaterType } from "@/lib/later";
import { brandsIn, colours, fuzzyHits, habits, norm, sameSize, sizeIn } from "@/lib/identify";

// After a photo, the app first looks on the phone, no AI: photos you
// confirmed before that look the same, then names printed on the label.
// If it isn't there, you tap "Ask AI". AI never runs by itself. Whatever
// you pick (or AI finds) is remembered, so next time it's found instantly.
// Ways it looks, best first: barcode, your past photos (shape + colours),
// names on the label (even half-misread), QR code text, the brand word and
// pack size, then what you usually have, buy and log at this time.

/** Everything read from the photos' writing (all sides), plus the barcode lookup. */
export type LabelRead = Label & { product?: FoodFacts | null; item?: Product | null };

/** A QR code that carries a product number (GS1 Digital Link …/01/04901234567894) → that barcode. */
export function qrBarcode(qr?: string): string | undefined {
  const m = qr?.match(/\/01\/(\d{8,14})(?:\/|\?|$)/);
  if (!m) return undefined;
  const c = m[1].replace(/^0+(?=\d{13}$)/, "").replace(/^0+(?=\d{12,13}$)/, "");
  return validCode(c) ? c : validCode(m[1].slice(-13)) ? m[1].slice(-13) : undefined;
}

/** Fill the label's numbers from the barcode's product when the photo's own writing didn't give them. */
function withProduct(l: LabelRead): LabelRead {
  const it = l.item;
  if (!it || Object.keys(l.facts).length) return { ...l, contents: l.contents ?? it?.contents };
  const f = it.facts, ml = /ml|ℓ|\bl\b|cl/i.test(it.size ?? "");
  return { ...l, facts: f, per: `100${ml ? "ml" : "g"}`, kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs, sugar: f.sugar, salt: f.salt, contents: l.contents ?? it.contents };
}

export type Pick = { name: string; emoji: string; sub?: string; ja?: string; mine?: boolean; /** Your own words, typed when nothing else found it. */ note?: string };

/** Names from the list printed in the photo's text (long enough to be real, not OCR noise). */
export function listHits(list: Pick[], text: string, extra: string[] = [], habit?: Map<string, number>): Pick[] {
  const t = norm(text);
  const score = new Map<Pick, number>();
  const bump = (p: Pick, s: number) => score.set(p, Math.max(score.get(p) ?? 0, s));
  for (const name of extra) { const p = list.find((x) => x.name === name); if (p) bump(p, 1000); }
  const real = (n: string) => n.length >= (/[\u3040-\u9fff]/.test(n) ? 3 : 5);
  if (t.length >= 3) for (const p of list) {
    for (const n of [norm(p.name), p.ja ? norm(p.ja) : ""]) if (real(n) && t.includes(n)) bump(p, n.length * 10 + (p.mine ? 5 : 0));
  }
  // Half-read names (a letter or two wrong), then the size on the pack and your habits break ties.
  for (const [p, f] of fuzzyHits(list, text)) if (!score.has(p)) bump(p, f * 40);
  const size = sizeIn(text);
  for (const [p, s] of score) score.set(p, s + (sameSize(p, size) ? 15 : 0) + Math.min(20, habit?.get(norm(p.name)) ?? 0));
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, 8);
}

/** After an AI answer: remember the last photo as this name. */
export function useRememberSnap() {
  const { update } = useApp();
  return (name: string, emoji?: string) => {
    const l = lastSnap();
    if (l && name) update((d) => remember(d, l.kind, name, l.vec, emoji, l.photo, l.barcode, l.col));
    setLastSnap(null);
  };
}

export function SnapChoice({ photo, img, list, what, kind, laterType, more, guess, addNew, onAI, onPick, onClose }: {
  /** One photo, or several of the same thing (front, back, side). */
  photo: string; img?: HTMLImageElement | HTMLImageElement[] | null; list: Pick[]; what: string; kind: SnapKind; more?: string;
  /** Where "Scan later" files it (defaults from kind). */
  laterType?: LaterType;
  /** Extra matching for this kind of thing (e.g. drink or equipment names from the label text). */
  guess?: (text: string) => string[];
  /** Always offer "Save as new" with the name read from the photo (or typed in the search box). */
  addNew?: boolean;
  onAI: () => void; onPick: (p: Pick, label?: LabelRead) => void; onClose: () => void;
}) {
  const imgs = useMemo(() => (Array.isArray(img) ? img : img ? [img] : []), [img]);
  const { data, update, session } = useApp();
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [own, setOwn] = useState({ name: "", note: "" });
  const [found, setFound] = useState<Pick[] | null>(img ? null : []);
  const [seen, setSeen] = useState<{ sure: (Seen & { barcode?: boolean })[]; maybe: Seen[] }>({ sure: [], maybe: [] });
  const [read, setRead] = useState("");
  const [vec, setVec] = useState("");
  const [col, setCol] = useState<string>();
  const [brand, setBrand] = useState<{ brand: string; items: Pick[] } | null>(null);
  const [usual, setUsual] = useState<Pick[]>([]);
  const [qr, setQr] = useState<string>();
  const [viaQr, setViaQr] = useState(false);
  const [named, setNamed] = useState<{ name: string; p: Product | null } | null>(null);
  const [size, setSize] = useState<string>();
  const [label, setLabel] = useState<LabelRead | null>(null);
  const [langs, setLangs] = useState(ocrLangs);
  const [pickLang, setPickLang] = useState(false);
  const [auto, setAuto] = useState(isAutoLangs);
  const [weak, setWeak] = useState(false); // the writing didn't read well: offer other languages
  const toggleLang = (c: string) => { const next = langs.includes(c) ? langs.filter((x) => x !== c) : [...langs, c]; if (!next.length) return; setOcrLangs(next); setLangs(next); setAuto(false); setFound(null); };
  const goAuto = () => { resetOcrLangs(); setLangs(autoLangs()); setAuto(true); setFound(null); };
  const items = data.items;
  useEffect(() => {
    if (!imgs.length) return;
    let live = true;
    (async () => {
      // All on the phone: the look of the first photo, and all writing on every photo.
      const [texts, look, codes] = await Promise.all([
        Promise.all(imgs.map((i) => readLabel(i, langs).catch(() => null))),
        fingerprint(imgs[0]).catch(() => null),
        Promise.all(imgs.map((i) => scanBarcode(i).catch(() => ({ code: undefined, qr: undefined })))),
      ]);
      if (!live) return;
      const qrText = codes.map((c) => c.qr).find(Boolean);
      setQr(qrText);
      // A QR code's text (often the maker's web address with the product in it) is read like label writing.
      const text = [...texts.map((t) => t?.text ?? ""), qrText ? decodeURIComponent(qrText).replace(/[/_?=&]+/g, " ") : ""].join("\n");
      // Poorly read writing usually means another language: say so and offer the list.
      const conf = Math.max(0, ...texts.map((t) => t?.confidence ?? 0));
      setWeak(text.replace(/\s/g, "").length > 15 && conf < 55);
      const l: LabelRead = parseLabel(text);
      // The barcode (read from its bars, or its printed digits when they check out) is the surest way to know a product.
      const bars = codes.map((c) => c.code).find(Boolean);
      setViaQr(!bars && !!qrBarcode(qrText));
      l.barcode = bars ?? qrBarcode(qrText) ?? (l.barcode && validCode(l.barcode) ? l.barcode : undefined);
      // Already confirmed this barcode before → that's it.
      const known = byBarcode(items, l.barcode);
      if (known) setSeen((s) => ({ ...s, sure: [{ ...known, barcode: true }] }));
      // Look the exact product up in the open food database (not AI): name, brand, size, all it contains.
      // Books and learning things are not food: no food database lookup.
      if (l.barcode && kind !== "learn") {
        l.item = await productByBarcode(l.barcode).catch(() => null);
        const f = l.item?.facts;
        if (l.item && f?.kcal != null) l.product = { name: l.item.name, kcal100: f.kcal, protein100: f.protein ?? 0, serving: l.item.serving, contents: l.item.contents };
      }
      if (!live) return;
      setLabel(l);
      setRead(l.names.filter((n) => n.length >= 3).slice(0, 2).join(", "));
      const all = `${text}\n${l.product?.name ?? ""}`;
      const habit = habits(data);
      const hits = listHits(list, all, guess?.(`${text} ${l.product?.name ?? ""}`) ?? [], habit);
      setFound(hits);
      const sz = sizeIn(all); setSize(sz && `${sz.n} ${sz.unit}`);
      // The brand word alone (e.g. SUNTORY): that brand's things, same size and your usual ones first.
      const b = brandsIn(list, all)[0];
      const rank = (p: Pick) => (sameSize(p, sz) ? 30 : 0) + (habit.get(norm(p.name)) ?? 0) + (p.mine ? 5 : 0);
      setBrand(b ? { brand: b.brand, items: b.items.filter((p) => !hits.includes(p)).sort((x, y) => rank(y) - rank(x)).slice(0, 6) } : null);
      // Nothing read at all: what you usually have, buy or log around this time.
      setUsual(hits.length || b || kind === "learn" ? [] : list.filter((p) => (habit.get(norm(p.name)) ?? 0) > 0 || p.mine).sort((x, y) => rank(y) - rank(x)).slice(0, 5));
      const c = imgs[0] ? colours(imgs[0]) : undefined; setCol(c);
      if (look) {
        const v = pack(look); setVec(v);
        const near = lookAlikes(items, kind, v, c);
        setSeen(known ? { sure: [{ ...known, barcode: true }, ...near.sure.filter((x) => x.name !== known.name)], maybe: near.maybe } : near);
      }
    })();
    return () => { live = false; };
  }, [imgs, list, guess, kind, langs]); // eslint-disable-line react-hooks/exhaustive-deps
  const thumb = useMemo(() => (imgs[0] ? smallPhoto(imgs[0], 48) : undefined), [imgs]);
  // Picking teaches the app this photo.
  const choose = (p: Pick, extra?: Product | null) => {
    if (vec || label?.barcode) update((d) => remember(d, kind, p.name, vec, p.emoji, thumb, label?.barcode, col));
    const l = label ? withProduct({ ...label, item: label.item ?? extra }) : undefined;
    onClose(); onPick(p, p.note ? { ...(l ?? { names: [], text: "", facts: {} }), contents: p.note } : l);
  };
  const facts = label && [
    label.contents && kind !== "learn" && `Contains: ${label.contents}`, !label.item && label.barcode && kind !== "learn" && `🔢 Barcode ${label.barcode} (not in the open food database yet: pick or save it once and it's known forever)`,
  ].filter(Boolean) as string[];
  const hasFacts = !!label && Object.keys(label.facts).length > 0;
  const asPick = (s: Seen): Pick => list.find((p) => p.name === s.name) ?? { name: s.name, emoji: s.emoji, mine: true };
  const newName = q.trim() || label?.item?.name || label?.names[0] || "";
  const item = label?.item;
  // The barcode's product as a list pick: the same name from your list if you have it.
  const itemPick: Pick | undefined = item ? (list.find((p) => norm(p.name) === norm(item.name) || (p.ja && norm(p.ja) === norm(item.name))) ?? (seen.sure[0]?.barcode ? asPick(seen.sure[0]) : { name: item.name, emoji: "🔢" })) : undefined;
  // One best answer, whichever no-AI way found it first (surest way first).
  const best: { pick: Pick; how: string; photo?: string } | undefined = !found ? undefined
    : itemPick ? { pick: itemPick, how: `🔢 Exact product from its ${viaQr ? "QR code" : "barcode"}`, photo: item?.image }
    : seen.sure[0] ? { pick: asPick(seen.sure[0]), how: seen.sure[0].barcode ? "🔢 Same barcode as your earlier photo" : `📸 Same as your earlier photo (${Math.round(seen.sure[0].sim * 100)}% same look)`, photo: seen.sure[0].photo }
    : found[0] ? { pick: found[0], how: "🏷️ Its name is printed on the label" }
    : brand?.items[0] ? { pick: brand.items[0], how: `🏭 Brand ${brand.brand} on the label${size ? `, size ${size}` : ""}` }
    : seen.maybe[0] ? { pick: asPick(seen.maybe[0]), how: `📸 Looks like your earlier photo (${Math.round(seen.maybe[0].sim * 100)}%)`, photo: seen.maybe[0].photo }
    : usual[0] ? { pick: usual[0], how: "⭐ What you usually have at this time" } : undefined;
  // What the best answer contains: its own label if the photo showed one, else the open food database by its name (not AI).
  const bestName = best && !item && !hasFacts && kind !== "equipment" && kind !== "learn" ? best.pick.name : "";
  useEffect(() => {
    if (!bestName || named?.name === bestName) return;
    let live = true;
    productByName(bestName).then((p) => { if (live) setNamed({ name: bestName, p }); });
    return () => { live = false; };
  }, [bestName, named?.name]);
  const typical = named?.name === bestName ? named.p : null;
  const askAI = () => { setLastSnap(vec || label?.barcode ? { kind, vec, photo: thumb, barcode: label?.barcode, col } : null); onClose(); onAI(); };
  // Save the photo to scan whenever you want (📥 Photos to scan).
  const later = async () => {
    if (!imgs.length) return;
    setSaving(true);
    try { await saveLater(session, update, laterType ?? (kind === "item" || kind === "learn" ? "have" : kind), await Promise.all(imgs.map(imgBlob))); } catch { /* stays open to try again */ setSaving(false); return; }
    onClose();
  };
  const hits = useMemo(() => {
    const n = norm(q);
    if (!n) return list.filter((p) => p.mine).slice(0, 30);
    return list.filter((p) => norm(p.name).includes(n) || (p.ja && norm(p.ja).includes(n)))
      .sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || a.name.length - b.name.length).slice(0, 60);
  }, [list, q]);
  const row = (p: Pick, i: number) => (
    <button key={`${p.name}-${i}`} onClick={() => choose(p)} className="w-full text-left rounded-xl bg-white/5 px-2.5 py-1.5 flex items-center gap-2">
      <span className="text-xl">{p.emoji}</span>
      <span className="flex-1 min-w-0"><span className="block text-sm truncate">{p.name}{p.mine ? " ⭐" : ""}</span>{(p.ja || p.sub) && <span className="block text-[10px] text-muted truncate">{[p.ja, p.sub].filter(Boolean).join(" · ")}</span>}</span>
    </button>
  );
  return (
    <Sheet title={`📷 What is this ${what}?${more ? ` (${more})` : ""}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="relative shrink-0"><img src={photo} alt="" className="h-20 w-20 rounded-xl object-cover" />{imgs.length > 1 && <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold">{imgs.length} photos</span>}</span>
        <p className="text-xs text-muted flex-1">
          {found == null ? <span className="animate-pulse text-[var(--accent2)]">🔍 Looking on your phone (barcode, your past photos, the label)… no AI.</span>
            : seen.sure.length ? <>📸 You&apos;ve had this before. Tap it.</>
            : found.length || seen.maybe.length || brand?.items.length || usual.length ? <>📋 Maybe one of these{read ? ` (label: ${read})` : ""}. Tap the right one.</>
            : <>📋 Not found yet{read ? ` (label: ${read})` : ""}. Search below, or tap Ask AI. Next time this photo is remembered.</>}
        </p>
      </div>
      <div className="text-[11px]">
        <button onClick={() => setPickLang((v) => !v)} className="text-[var(--accent2)]">🌐 Reads{auto ? " (auto)" : ""}: {langs.map((c) => OCR_LANGS.find(([x]) => x === c)?.[1] ?? c).join(", ")} ({pickLang ? "done" : "change"})</button>
        {weak && !pickLang && found && <div className="text-amber-300 text-[10px]">The writing didn&apos;t read clearly. If the label is in another language, tap change and pick it.</div>}
        {pickLang && <div className="flex flex-wrap gap-1 mt-1"><button onClick={goAuto} className={`chip !px-1.5 !py-0 text-[10px] ${auto ? "chip-on" : ""}`}>✨ Auto</button>{OCR_LANGS.map(([c, n]) => <button key={c} onClick={() => toggleLang(c)} className={`chip !px-1.5 !py-0 text-[10px] ${langs.includes(c) ? "chip-on" : ""}`}>{n}</button>)}
          <span className="text-[10px] text-muted w-full">Auto reads 日本語, English and your phone&apos;s languages (English letters also cover Spanish, French and similar). Add others when a label uses them: each is a one-time download and makes reading a bit slower.</span></div>}
      </div>
      {best && (
        <div className="rounded-xl bg-[var(--accent)]/15 ring-1 ring-[var(--accent)] p-2 space-y-1.5">
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">BEST MATCH · NO AI</div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {best.photo ? <img src={best.photo} alt="" className="h-14 w-14 rounded-lg object-contain bg-white" /> : <span className="text-4xl">{best.pick.emoji}</span>}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{best.pick.name}</div>
              {item ? <div className="text-[10px] text-muted">{[item.brand, item.size, `barcode ${item.code}`].filter(Boolean).join(" · ")}</div>
                : (best.pick.ja || best.pick.sub) && <div className="text-[10px] text-muted">{[best.pick.ja, best.pick.sub].filter(Boolean).join(" · ")}</div>}
              <div className="text-[10px] text-[var(--accent2)]">{best.how}</div>
            </div>
          </div>
          {item && Object.keys(item.facts).length > 0 && <FactsTable facts={item.facts} title={`What it contains (per 100 ${/ml|ℓ|cl|\bl\b/i.test(item.size ?? "") ? "ml" : "g"})`} className="!p-0 !bg-transparent" />}
          {item?.contents && <div className="text-[10px] text-muted line-clamp-4">Ingredients: {item.contents}</div>}
          {item?.allergens && <div className="text-[10px] text-amber-300">⚠️ Allergens: {item.allergens}</div>}
          {!item && hasFacts && <div className="text-[10px] text-muted">What it contains: read from your photo&apos;s label below.</div>}
          {bestName && !named && <div className="text-[10px] text-muted animate-pulse">Looking up what it contains…</div>}
          {typical && <>
            <FactsTable facts={typical.facts} title={`What it contains (per 100 ${/ml|ℓ|cl|\bl\b/i.test(typical.size ?? "") ? "ml" : "g"}, from the food database: ${typical.name.slice(0, 30)})`} className="!p-0 !bg-transparent" />
            {typical.contents && <div className="text-[10px] text-muted line-clamp-3">Ingredients: {typical.contents}</div>}
            {typical.allergens && <div className="text-[10px] text-amber-300">⚠️ Allergens: {typical.allergens}</div>}
          </>}
          <button onClick={() => choose(best.pick, typical)} className="btn-primary w-full !py-2">✅ This is it: {best.pick.name.slice(0, 32)}</button>
        </div>
      )}
      {seen.sure.length > 0 && <div className="space-y-1">{seen.sure.map((s, i) => (
        <button key={`s-${s.name}`} onClick={() => choose(asPick(s))} className={`w-full text-left rounded-xl px-2.5 py-2 flex items-center gap-2 ${i === 0 ? "bg-[var(--accent)]/25 ring-1 ring-[var(--accent)]" : "bg-white/5"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.photo ? <img src={s.photo} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="text-xl">{s.emoji}</span>}
          <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{s.name}</span><span className="block text-[10px] text-muted">{s.barcode ? "🔢 Same barcode as before" : `${Math.round(s.sim * 100)}% same look${s.col != null ? ` · ${Math.round(s.col * 100)}% same colours` : ""} · photographed ${s.times}×`}</span></span>
        </button>
      ))}</div>}
      {seen.maybe.length > 0 && <div className="space-y-1">{seen.maybe.map((s) => (
        <button key={`m-${s.name}`} onClick={() => choose(asPick(s))} className="w-full text-left rounded-xl bg-white/5 px-2.5 py-1.5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.photo ? <img src={s.photo} alt="" className="h-7 w-7 rounded-md object-cover" /> : <span className="text-xl">{s.emoji}</span>}
          <span className="flex-1 min-w-0 text-sm truncate">{s.name} <span className="text-[10px] text-muted">({Math.round(s.sim * 100)}% look-alike)</span></span>
        </button>
      ))}</div>}
      {label && (hasFacts || facts!.length > 0) && (
        <div className="rounded-xl bg-white/5 p-2 text-[11px] space-y-1">
          <FactsTable facts={label.facts} title={`🏷️ The label says${label.per ? ` (per ${label.per})` : ""}`} className="!p-0 !bg-transparent" />
          {facts!.map((f) => <div key={f} className="text-muted">{f}</div>)}
          {newName && <button onClick={() => choose({ name: newName, emoji: "🏷️" })} className="chip chip-on text-xs mt-1">＋ Save as new: {newName.slice(0, 30)}</button>}
          <div className="text-[10px] text-muted">Picking an item below fills in all these label numbers. Type a better name in the search box first if needed.</div>
        </div>
      )}
      {addNew && newName && !(label && (hasFacts || facts!.length > 0)) && <button onClick={() => choose({ name: newName, emoji: "🏷️" })} className="btn-primary w-full !py-2 text-sm">＋ Save as new: {newName.slice(0, 40)}</button>}
      {found && found.length > 0 && <><div className="text-[10px] text-muted">From the label{size ? ` · size ${size}` : ""}</div><div className="space-y-1">{found.map(row)}</div></>}
      {brand && brand.items.length > 0 && <><div className="text-[10px] text-muted">🏭 Brand on the label: {brand.brand}{size ? ` · size ${size} first` : ""}</div><div className="space-y-1">{brand.items.map(row)}</div></>}
      {usual.length > 0 && <><div className="text-[10px] text-muted">⭐ What you usually have around this time</div><div className="space-y-1">{usual.map(row)}</div></>}
      {qr && <div className="text-[10px] text-muted truncate">🔳 QR code: {qr}</div>}
      <input className="input" placeholder={`Search the ${what} list (English or 日本語)…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {hits.map(row)}
        {q && !hits.length && <p className="text-xs text-muted">Nothing with that name in the list.</p>}
      </div>
      {/* When the app and AI both miss: write it yourself. */}
      <details className="rounded-xl bg-white/5 p-2 text-xs">
        <summary className="cursor-pointer font-semibold">✍️ Type it myself (name and description)</summary>
        <div className="space-y-1.5 mt-2">
          <input className="input" placeholder={`Name of this ${what}`} value={own.name} onChange={(e) => setOwn({ ...own, name: e.target.value })} />
          <textarea className="input min-h-14 text-sm" placeholder="Description: what it is, what it contains, size, anything" value={own.note} onChange={(e) => setOwn({ ...own, note: e.target.value })} />
          <button disabled={!own.name.trim()} onClick={() => choose({ name: own.name.trim(), emoji: "✍️", note: own.note.trim() || undefined })} className="btn-primary w-full !py-2 disabled:opacity-40">Use this</button>
        </div>
      </details>
      <div className="flex gap-2">
        <button onClick={askAI} className="btn-ghost flex-1 !py-2.5 ring-1 ring-[var(--accent)]">🤖 Not in the list? Ask AI</button>
        {imgs.length > 0 && <button onClick={later} disabled={saving} className="btn-ghost !py-2.5 !px-3 text-sm">{saving ? "Saving…" : "⏰ Scan later"}</button>}
      </div>
      <p className="text-[10px] text-muted text-center">Scan later keeps the photo in 📥 Photos to scan (Sensei reminds you).</p>
    </Sheet>
  );
}
