"use client";
/* eslint-disable @next/next/no-img-element -- small data: URL thumbnails */

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { SnapChoice, useRememberSnap, type Pick } from "@/components/SnapChoice";
import { DrinkSheet } from "@/components/Drinks";
import { EquipmentSheet } from "@/components/Equipment";
import { MealSheet } from "@/components/Meals";
import { emojiFor } from "@/lib/emoji";
import { aiPhotos, readProduct } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { goods } from "@/lib/goods";
import { LATER_TYPES, laterIds, saveLater, type LaterType } from "@/lib/later";
import { useApp, type CustomItem, type PantryItem, type ShopItem } from "@/lib/store";
import { deletePhoto, getPhoto } from "@/lib/vault";

// Photos to scan: anything saved with "Scan later", plus any photos you add
// here. Scan each whenever you want; it opens the right place with the photo.

type Open = { type: LaterType; files: Blob[]; at: Date; imgs?: HTMLImageElement[]; small?: string };

export function LaterSheet({ onClose }: { onClose: () => void }) {
  const { data, session, update, celebrate } = useApp();
  const items = data.items.filter((i) => i.category === "later").sort((a, b) => a.sort - b.sort);
  const [type, setType] = useState<LaterType>("food");
  const [open, setOpen] = useState<Open | null>(null);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const rememberAI = useRememberSnap();
  const picks = useMemo<Pick[]>(() => [
    ...data.pantry.map((p) => ({ name: p.name, emoji: p.emoji, ja: p.ja, sub: "in My stuff", mine: true })),
    ...goods().map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.cat })),
  ], [data.pantry]);

  const setTypeOf = (i: CustomItem, t: LaterType) => update((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, config: { ...x.config, type: t } } : x)) }));
  const drop = (i: CustomItem) => {
    update((d) => ({ ...d, items: d.items.filter((x) => x.id !== i.id), deleted: [...d.deleted, i.id] }));
    for (const p of laterIds(i.config)) deletePhoto(session, p).catch(() => {});
  };
  const scan = async (i: CustomItem) => {
    setMsg("Opening the photo…");
    const files = (await Promise.all(laterIds(i.config).map((p) => getPhoto(session, p).catch(() => null)))).filter((f): f is Blob => !!f);
    if (!files.length) { setMsg("That photo isn't on this phone yet. Try again when online."); return; }
    setMsg("");
    const t = i.config.type as LaterType, at = new Date(String(i.config.at));
    drop(i); // It's being scanned now; "Scan later" again puts it back.
    if (t === "have" || t === "shop") { const imgs = await Promise.all(files.map(loadImage)); setOpen({ type: t, files, at, imgs, small: smallPhoto(imgs[0], 160) }); }
    else setOpen({ type: t, files, at });
  };
  const [together, setTogether] = useState(false); // several photos of one thing (front and back)
  const addPhotos = async (files: File[]) => {
    if (together) await saveLater(session, update, type, files);
    else for (const f of files) await saveLater(session, update, type, f);
    setMsg(`📥 ${files.length} photo${files.length > 1 ? "s" : ""} saved${together && files.length > 1 ? " as one item" : ""}. Scan whenever you want.`);
  };
  // My stuff / To buy: add straight from the name.
  const put = (o: Open, name: string, emoji: string, extra: Partial<PantryItem> = {}) => {
    if (o.type === "have") {
      update((d) => ({ ...d, pantry: [...d.pantry, { id: crypto.randomUUID(), name, emoji, qty: 1, unit: "pcs", last_price: null, updated_at: new Date().toISOString(), photo: o.small, ...extra }] }));
    } else {
      const s: ShopItem = { id: crypto.randomUUID(), name, emoji, qty: 1, unit: "pcs", price: null, category: "", note: "", photo_id: null, status: "to_buy", purchased_at: null, created_at: new Date().toISOString() };
      update((d) => ({ ...d, shopping: [...d.shopping, s] }));
    }
    celebrate({ title: o.type === "have" ? "ADDED TO MY STUFF" : "ADDED TO THE LIST", subtitle: `${emoji} ${name}`, kind: "small" });
  };
  const askAI = async (o: Open) => {
    setMsg("🤖 AI is reading it…");
    const r = await readProduct(session, aiPhotos(o.imgs!));
    const p = r.product?.found ? r.product : null;
    if (!p?.name) { setMsg(`AI couldn't tell${r.error ? ` (${r.error})` : ""}. Save it again with Scan later, or type it in My stuff.`); return; }
    setMsg("");
    rememberAI(p.name, p.emoji);
    put(o, p.name, p.emoji || emojiFor(p.name, "📦"), { ja: p.name_ja || undefined, brand: p.brand || undefined, kcal: p.kcal ? Math.round(p.kcal) : undefined, per: p.per || undefined, protein: p.protein || undefined });
  };

  if (open?.type === "food") return <MealSheet file={open.files} at={open.at} onClose={() => setOpen(null)} />;
  if (open?.type === "drink") return <DrinkSheet file={open.files} at={open.at} onClose={() => setOpen(null)} />;
  if (open?.type === "equipment") return <EquipmentSheet file={open.files} onClose={() => setOpen(null)} />;
  return (
    <Sheet title="📥 Photos to scan" onClose={onClose}>
      {open?.imgs && <SnapChoice photo={open.small!} img={open.imgs} list={picks} what="item" kind="item" laterType={open.type} onClose={() => setOpen(null)}
        onAI={() => askAI(open)} onPick={(p, l) => put(open, p.name, p.emoji, l?.kcal != null ? { kcal: l.kcal, protein: l.protein, per: l.per ?? "1 serving" } : {})} />}
      <p className="text-xs text-muted">Photos you saved with ⏰ Scan later. Scan each whenever you want. Change its type first if needed.</p>
      {items.length ? (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl bg-white/5 p-2 flex gap-2">
              <span className="relative shrink-0"><img src={String(i.config.thumb)} alt="" className="h-16 w-16 rounded-lg object-cover" />{laterIds(i.config).length > 1 && <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold">{laterIds(i.config).length}</span>}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-[11px] text-muted">{new Date(String(i.config.at)).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                <div className="flex flex-wrap gap-1">
                  {LATER_TYPES.map(([t, e, l]) => <button key={t} onClick={() => setTypeOf(i, t)} className={`chip !px-1.5 !py-0 text-[10px] ${i.config.type === t ? "chip-on" : ""}`}>{e} {l}</button>)}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => scan(i)} className="btn-primary flex-1 !py-1 text-xs">🔍 Scan now</button>
                  <button onClick={() => drop(i)} className="btn-ghost !py-1 text-xs text-rose-300">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-center text-muted py-3">Nothing waiting.</p>}
      <div className="rounded-xl border border-white/10 p-2 space-y-1.5">
        <div className="text-xs font-semibold">＋ Save photos to scan later</div>
        <div className="flex flex-wrap gap-1">{LATER_TYPES.map(([t, e, l]) => <button key={t} onClick={() => setType(t)} className={`chip !py-0.5 text-xs ${type === t ? "chip-on" : ""}`}>{e} {l}</button>)}</div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} />These photos are one thing (front, back, side)</label>
        <button onClick={() => ref.current?.click()} className="btn-ghost w-full !py-2 text-sm">📷 Pick photos (any number)</button>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) addPhotos(f); }} />
      </div>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </Sheet>
  );
}
