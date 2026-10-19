"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { fingerprint, smallPhoto } from "@/lib/foodphoto";
import { autoLangs, isAutoLangs, OCR_LANGS, ocrLangs, parseLabel, readLabel, resetOcrLangs, setOcrLangs, type Label } from "@/lib/label";
import { lookupBarcode, type FoodFacts } from "@/lib/foodlookup";
import { lastSnap, lookAlikes, pack, remember, setLastSnap, type Seen, type SnapKind } from "@/lib/snapmemory";
import { useApp } from "@/lib/store";
import { imgBlob, saveLater, type LaterType } from "@/lib/later";

// After a photo, the app first looks on the phone, no AI: photos you
// confirmed before that look the same, then names printed on the label.
// If it isn't there, you tap "Ask AI". AI never runs by itself. Whatever
// you pick (or AI finds) is remembered, so next time it's found instantly.

/** Everything read from the photos' writing (all sides), plus the barcode lookup. */
export type LabelRead = Label & { product?: FoodFacts | null };

export type Pick = { name: string; emoji: string; sub?: string; ja?: string; mine?: boolean };

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s\-・·.,'’()&＆]/g, "");

/** Names from the list printed in the photo's text (long enough to be real, not OCR noise). */
export function listHits(list: Pick[], text: string, extra: string[] = []): Pick[] {
  const t = norm(text);
  const score = new Map<Pick, number>();
  const bump = (p: Pick, s: number) => score.set(p, Math.max(score.get(p) ?? 0, s));
  for (const name of extra) { const p = list.find((x) => x.name === name); if (p) bump(p, 1000); }
  const real = (n: string) => n.length >= (/[\u3040-\u9fff]/.test(n) ? 3 : 5);
  if (t.length >= 3) for (const p of list) {
    for (const n of [norm(p.name), p.ja ? norm(p.ja) : ""]) if (real(n) && t.includes(n)) bump(p, n.length * 10 + (p.mine ? 5 : 0));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, 8);
}

/** After an AI answer: remember the last photo as this name. */
export function useRememberSnap() {
  const { update } = useApp();
  return (name: string, emoji?: string) => {
    const l = lastSnap();
    if (l && name) update((d) => remember(d, l.kind, name, l.vec, emoji, l.photo));
    setLastSnap(null);
  };
}

export function SnapChoice({ photo, img, list, what, kind, laterType, more, guess, onAI, onPick, onClose }: {
  /** One photo, or several of the same thing (front, back, side). */
  photo: string; img?: HTMLImageElement | HTMLImageElement[] | null; list: Pick[]; what: string; kind: SnapKind; more?: string;
  /** Where "Scan later" files it (defaults from kind). */
  laterType?: LaterType;
  /** Extra matching for this kind of thing (e.g. drink or equipment names from the label text). */
  guess?: (text: string) => string[];
  onAI: () => void; onPick: (p: Pick, label?: LabelRead) => void; onClose: () => void;
}) {
  const imgs = useMemo(() => (Array.isArray(img) ? img : img ? [img] : []), [img]);
  const { data, update, session } = useApp();
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Pick[] | null>(img ? null : []);
  const [seen, setSeen] = useState<{ sure: Seen[]; maybe: Seen[] }>({ sure: [], maybe: [] });
  const [read, setRead] = useState("");
  const [vec, setVec] = useState("");
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
      const [texts, look] = await Promise.all([
        Promise.all(imgs.map((i) => readLabel(i, langs).catch(() => null))),
        fingerprint(imgs[0]).catch(() => null),
      ]);
      if (!live) return;
      const text = texts.map((t) => t?.text ?? "").join("\n");
      // Poorly read writing usually means another language: say so and offer the list.
      const conf = Math.max(0, ...texts.map((t) => t?.confidence ?? 0));
      setWeak(text.replace(/\s/g, "").length > 15 && conf < 55);
      const l: LabelRead = parseLabel(text);
      // A barcode number on the back: look it up in the open food database (not AI).
      if (l.barcode) l.product = await lookupBarcode(l.barcode).catch(() => null);
      if (!live) return;
      setLabel(l);
      setRead(l.names.filter((n) => n.length >= 3).slice(0, 2).join(", "));
      setFound(listHits(list, `${text}\n${l.product?.name ?? ""}`, guess?.(`${text} ${l.product?.name ?? ""}`) ?? []));
      if (look) { const v = pack(look); setVec(v); setSeen(lookAlikes(items, kind, v)); }
    })();
    return () => { live = false; };
  }, [imgs, list, guess, kind, langs]); // eslint-disable-line react-hooks/exhaustive-deps
  const thumb = useMemo(() => (imgs[0] ? smallPhoto(imgs[0], 48) : undefined), [imgs]);
  // Picking teaches the app this photo.
  const choose = (p: Pick) => {
    if (vec) update((d) => remember(d, kind, p.name, vec, p.emoji, thumb));
    onClose(); onPick(p, label ?? undefined);
  };
  const facts = label && [
    label.product && `🔢 Barcode ${label.barcode}: ${label.product.name} · ${label.product.kcal100} kcal/100`,
    label.kcal != null && `${label.kcal} kcal`, label.protein != null && `protein ${label.protein} g`, label.fat != null && `fat ${label.fat} g`,
    label.carbs != null && `carbs ${label.carbs} g`, label.sugar != null && `sugar ${label.sugar} g`, label.salt != null && `salt ${label.salt} g`,
    label.per && `per ${label.per}`, label.contents && `contains: ${label.contents}`, !label.product && label.barcode && `barcode ${label.barcode}`,
  ].filter(Boolean) as string[];
  const newName = q.trim() || label?.product?.name || label?.names[0] || "";
  const askAI = () => { setLastSnap(vec ? { kind, vec, photo: thumb } : null); onClose(); onAI(); };
  // Save the photo to scan whenever you want (📥 Photos to scan).
  const later = async () => {
    if (!imgs.length) return;
    setSaving(true);
    try { await saveLater(session, update, laterType ?? (kind === "item" ? "have" : kind), await Promise.all(imgs.map(imgBlob))); } catch { /* stays open to try again */ setSaving(false); return; }
    onClose();
  };
  const asPick = (s: Seen): Pick => list.find((p) => p.name === s.name) ?? { name: s.name, emoji: s.emoji, mine: true };
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
          {found == null ? <span className="animate-pulse text-[var(--accent2)]">🔍 Looking on your phone (your past photos and the label)… no AI.</span>
            : seen.sure.length ? <>📸 You&apos;ve had this before. Tap it.</>
            : found.length || seen.maybe.length ? <>📋 Maybe one of these{read ? ` (label: ${read})` : ""}. Tap the right one.</>
            : <>📋 Not found yet{read ? ` (label: ${read})` : ""}. Search below, or tap Ask AI. Next time this photo is remembered.</>}
        </p>
      </div>
      <div className="text-[11px]">
        <button onClick={() => setPickLang((v) => !v)} className="text-[var(--accent2)]">🌐 Reads{auto ? " (auto)" : ""}: {langs.map((c) => OCR_LANGS.find(([x]) => x === c)?.[1] ?? c).join(", ")} ({pickLang ? "done" : "change"})</button>
        {weak && !pickLang && found && <div className="text-amber-300 text-[10px]">The writing didn&apos;t read clearly. If the label is in another language, tap change and pick it.</div>}
        {pickLang && <div className="flex flex-wrap gap-1 mt-1"><button onClick={goAuto} className={`chip !px-1.5 !py-0 text-[10px] ${auto ? "chip-on" : ""}`}>✨ Auto</button>{OCR_LANGS.map(([c, n]) => <button key={c} onClick={() => toggleLang(c)} className={`chip !px-1.5 !py-0 text-[10px] ${langs.includes(c) ? "chip-on" : ""}`}>{n}</button>)}
          <span className="text-[10px] text-muted w-full">Auto reads 日本語, English and your phone&apos;s languages (English letters also cover Spanish, French and similar). Add others when a label uses them: each is a one-time download and makes reading a bit slower.</span></div>}
      </div>
      {seen.sure.length > 0 && <div className="space-y-1">{seen.sure.map((s, i) => (
        <button key={`s-${s.name}`} onClick={() => choose(asPick(s))} className={`w-full text-left rounded-xl px-2.5 py-2 flex items-center gap-2 ${i === 0 ? "bg-[var(--accent)]/25 ring-1 ring-[var(--accent)]" : "bg-white/5"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.photo ? <img src={s.photo} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="text-xl">{s.emoji}</span>}
          <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{s.name}</span><span className="block text-[10px] text-muted">{Math.round(s.sim * 100)}% same look · photographed {s.times}×</span></span>
        </button>
      ))}</div>}
      {seen.maybe.length > 0 && <div className="space-y-1">{seen.maybe.map((s) => (
        <button key={`m-${s.name}`} onClick={() => choose(asPick(s))} className="w-full text-left rounded-xl bg-white/5 px-2.5 py-1.5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.photo ? <img src={s.photo} alt="" className="h-7 w-7 rounded-md object-cover" /> : <span className="text-xl">{s.emoji}</span>}
          <span className="flex-1 min-w-0 text-sm truncate">{s.name} <span className="text-[10px] text-muted">({Math.round(s.sim * 100)}% look-alike)</span></span>
        </button>
      ))}</div>}
      {facts && facts.length > 0 && (
        <div className="rounded-xl bg-white/5 p-2 text-[11px] space-y-0.5">
          <div className="font-semibold">🏷️ The label says</div>
          {facts.map((f) => <div key={f} className="text-muted">{f}</div>)}
          {newName && <button onClick={() => choose({ name: newName, emoji: "🏷️" })} className="chip chip-on text-xs mt-1">＋ Save as new: {newName.slice(0, 30)}</button>}
          <div className="text-[10px] text-muted">Picking an item below uses these label numbers. Type a better name in the search box first if needed.</div>
        </div>
      )}
      {found && found.length > 0 && <><div className="text-[10px] text-muted">From the label</div><div className="space-y-1">{found.map(row)}</div></>}
      <input className="input" placeholder={`Search the ${what} list (English or 日本語)…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {hits.map(row)}
        {q && !hits.length && <p className="text-xs text-muted">Nothing with that name in the list.</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={askAI} className="btn-ghost flex-1 !py-2.5 ring-1 ring-[var(--accent)]">🤖 Not in the list? Ask AI</button>
        {imgs.length > 0 && <button onClick={later} disabled={saving} className="btn-ghost !py-2.5 !px-3 text-sm">{saving ? "Saving…" : "⏰ Scan later"}</button>}
      </div>
      <p className="text-[10px] text-muted text-center">Scan later keeps the photo in 📥 Photos to scan (Sensei reminds you).</p>
    </Sheet>
  );
}
