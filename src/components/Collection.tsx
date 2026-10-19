"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Pic } from "@/components/Pic";
import { SnapChoice, type LabelRead, type Pick } from "@/components/SnapChoice";
import { useRunAction } from "@/components/Coach";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { guessKit, KIT_CATS, kitOfItem, kitTasks, myKit, type Kit, type KitCat } from "@/lib/learnkit";
import { useApp, useCustomItems } from "@/lib/store";

// 🗂️ My collection: books, coding apps, courses and screenshots of
// educational videos. Snap one like food or drinks: the phone reads the
// writing (no AI) and fills title, category, about and length; you can
// always change them. Sensei makes daily tasks from what's here.

type Draft = { id?: string; title: string; cat: KitCat; about: string; minutes: string; photo?: string; isbn?: string; filled: string[] };
const empty = (photo?: string): Draft => ({ title: "", cat: "book", about: "", minutes: "", photo, filled: [] });

export function CollectionSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const { items, add, update, remove } = useCustomItems("learnkit");
  const run = useRunAction();
  const ref = useRef<HTMLInputElement>(null);
  const [snap, setSnap] = useState<{ small: string; img: HTMLImageElement } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");
  const kit = useMemo(() => myKit(data), [data]);
  const picks = useMemo(() => kitTasks(data, new Date(), 2), [data]);
  // SnapChoice's list: what's already in the collection, so a known thing is found again.
  const list = useMemo<Pick[]>(() => kit.map((k) => ({ name: k.title, emoji: KIT_CATS[k.cat].icon, sub: KIT_CATS[k.cat].label, mine: true })), [kit]);

  const choose = async (file?: File) => {
    if (!file) return;
    const img = await loadImage(file);
    setSnap({ img, small: smallPhoto(img, 160) });
  };
  const edit = (k: Kit) => setDraft({ id: k.id, title: k.title, cat: k.cat, about: k.about, minutes: k.minutes ? String(k.minutes) : "", photo: k.photo, isbn: k.isbn, filled: [] });
  // A pick from the photo: an entry you already have opens it; anything else becomes a new entry filled from the photo's writing.
  const picked = (photo: string, p: Pick, label?: LabelRead) => {
    const have = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
    if (have) { const k = kitOfItem(have); edit({ ...k, photo: k.photo ?? photo }); return; }
    const g = guessKit(label?.text ?? "", p.name, label?.barcode);
    const filled = ["Title", g.cat !== "other" && "Category", g.about && "About", g.minutes && "Length"].filter(Boolean) as string[];
    setDraft({ title: p.name, cat: g.cat, about: g.about, minutes: g.minutes ? String(g.minutes) : "", photo, isbn: g.isbn, filled });
  };
  const save = () => {
    if (!draft?.title.trim()) return;
    const minutes = draft.cat === "video" ? Number(draft.minutes) || undefined : undefined;
    const config = { cat: draft.cat, about: draft.about.trim(), minutes, photo: draft.photo, isbn: draft.isbn };
    const old = draft.id && items.find((i) => i.id === draft.id);
    if (old) update(old.id, { name: draft.title.trim(), config: { ...old.config, ...config } });
    else add(draft.title.trim(), { ...config, added: new Date().toISOString() });
    setMsg(`✓ Saved ${draft.title.trim()}.`);
    setDraft(null);
  };
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  if (draft) return (
    <Sheet title={draft.id ? "✏️ Edit" : "🗂️ Add to my collection"} onClose={() => setDraft(null)}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {draft.photo ? <img src={draft.photo} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <span className="h-20 w-20 rounded-xl bg-white/5 grid place-items-center text-3xl">{KIT_CATS[draft.cat].icon}</span>}
        <p className="text-xs text-muted flex-1">{draft.filled.length ? <>📷 Filled from the photo on your phone (no AI): {draft.filled.join(", ")}. Check and fix anything wrong.</> : <>Type it in. Everything can be changed later.</>}</p>
      </div>
      <label className="block text-xs text-muted">1. Title
        <input className="input mt-1" placeholder="e.g. Atomic Habits, Progate, CS50 lecture 1" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
      </label>
      <div className="text-xs text-muted">2. Category</div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(KIT_CATS) as KitCat[]).map((c) => <button key={c} onClick={() => set({ cat: c })} className={`chip !py-1 text-xs ${draft.cat === c ? "chip-on" : ""}`}>{KIT_CATS[c].icon} {KIT_CATS[c].label}</button>)}
      </div>
      <label className="block text-xs text-muted">3. About
        <textarea className="input mt-1 min-h-16 text-sm" placeholder="What it teaches, e.g. Python basics, Japanese N4 grammar" value={draft.about} onChange={(e) => set({ about: e.target.value })} />
      </label>
      {draft.cat === "video" && (
        <label className="block text-xs text-muted">4. Length (minutes)
          <input className="input mt-1" inputMode="numeric" placeholder="e.g. 45" value={draft.minutes} onChange={(e) => set({ minutes: e.target.value.replace(/[^0-9]/g, "") })} />
        </label>
      )}
      {draft.isbn && <p className="text-[11px] text-muted">🔢 ISBN {draft.isbn}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={!draft.title.trim()} className="btn-primary flex-1 !py-2.5 disabled:opacity-40">Save</button>
        {draft.id && <button onClick={() => { remove(draft.id!); setDraft(null); setMsg("Removed."); }} className="btn-ghost !py-2.5 !px-3 text-sm">🗑️ Remove</button>}
      </div>
    </Sheet>
  );

  return (
    <Sheet title="🗂️ My collection" onClose={onClose}>
      <p className="text-xs text-muted">Books, coding apps, courses and screenshots of videos you learn from. Sensei picks something from here every day.</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => ref.current?.click()} className="btn-primary !py-3 text-sm">📷 Photo or screenshot</button>
        <button onClick={() => setDraft(empty())} className="btn-ghost !py-3 text-sm">✍️ Type it</button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; choose(f); }} />
      {snap && <SnapChoice photo={snap.small} img={snap.img} list={list} what="learning thing" kind="learn" laterType="have" addNew
        onClose={() => setSnap(null)}
        // No AI reader for learning things yet: open the form with the photo and let them type.
        onAI={() => setDraft(empty(snap.small))}
        onPick={(p, label) => picked(snap.small, p, label)} />}
      {msg && <p className="text-[11px] text-muted">{msg}</p>}
      {picks.length > 0 && (
        <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-2.5 space-y-1.5">
          <div className="text-xs font-semibold">🎯 Today from your collection</div>
          {picks.map((t) => (
            <button key={t.id} onClick={() => { onClose(); run(t.action); }} className="w-full text-left rounded-lg bg-white/5 px-2.5 py-1.5 text-sm flex items-center gap-2">
              <span>{t.icon}</span><span className="flex-1 min-w-0 truncate">{t.title}</span><span className="text-[var(--accent2)]">›</span>
            </button>
          ))}
        </div>
      )}
      {kit.length ? (
        <div className="space-y-1.5">
          {kit.map((k) => {
            const inner = <>
              <Pic name={k.title} emoji={KIT_CATS[k.cat].icon} hint={k.cat === "book" ? "book" : ""} size={44} src={k.photo} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{k.title}</span>
                <span className="block text-[11px] text-muted truncate">{KIT_CATS[k.cat].icon} {KIT_CATS[k.cat].label}{k.minutes ? ` · ${k.minutes} min` : ""}{k.about ? ` · ${k.about}` : ""}</span>
                {k.fromHave && <span className="block text-[10px] text-muted">from What I have</span>}
              </span>
            </>;
            return k.fromHave
              ? <div key={k.id} className="w-full flex items-center gap-3 rounded-xl bg-white/5 p-2">{inner}</div>
              : <button key={k.id} onClick={() => edit(k)} className="w-full flex items-center gap-3 rounded-xl bg-white/5 p-2 text-left">{inner}</button>;
          })}
        </div>
      ) : <p className="text-xs text-muted text-center py-3">Nothing here yet. Snap a book cover, an app or a video screenshot.</p>}
    </Sheet>
  );
}
