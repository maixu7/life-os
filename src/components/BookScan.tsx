"use client";
/* eslint-disable @next/next/no-img-element -- tiny data: URL photos, nothing for next/image to optimise */

import { useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { aiPhoto, readBook } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { useApp, useCustomItems } from "@/lib/store";

// Snap a book cover; type it, or tap Ask AI to read title, author and pages, and the book joins
// your reading list (and My stuff, if you own it). Typing works too, offline.

export function BookScanSheet({ onClose, onRead }: { onClose: () => void; onRead: (title: string) => void }) {
  const { session, data, update, logActivity, celebrate } = useApp();
  const { items: books, add, update: upd } = useCustomItems("list:readlist");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [cover, setCover] = useState("");
  const [own, setOwn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState("");
  const file = useRef<HTMLInputElement>(null);

  // The photo becomes the cover; type the title, or tap Ask AI to read it.
  const [shot, setShot] = useState<HTMLImageElement | null>(null);
  const scan = async (f: File) => {
    try {
      const img = await loadImage(f);
      setCover(smallPhoto(img, 96)); setShot(img);
      setMsg("Type the title and pages, or tap 🤖 Ask AI to read the cover.");
    } catch { setMsg("Couldn't open that photo. Type the title instead."); }
  };
  const askAI = async (img: HTMLImageElement) => {
    setBusy(true); setMsg("🤖 AI is reading the cover…");
    try {
      const r = await readBook(session, aiPhoto(img), title);
      if (r.book?.found) {
        setTitle(r.book.title); setAuthor(r.book.author); if (r.book.pages > 0) setPages(String(Math.round(r.book.pages)));
        setMsg(`📖 ${r.book.note || "Got it."} Check the details, then add it.`);
      } else setMsg(r.error === "offline" ? "Offline. Type the title and pages instead." : r.book ? "Couldn't spot a book there. Type the title instead." : `${r.error}. Type the title instead.`);
    } catch { setMsg("Couldn't open that photo. Type the title instead."); }
    setBusy(false);
  };

  const save = () => {
    const name = title.trim();
    if (!name) return;
    const total = Number(pages) || null;
    const have = books.find((b) => b.name.toLowerCase() === name.toLowerCase());
    if (have) upd(have.id, { config: { ...have.config, total: total ?? have.config.total ?? null, author: author.trim() || have.config.author, cover: cover || have.config.cover } });
    else add(name, { total, page: 0, done: false, author: author.trim() || undefined, cover: cover || undefined, created: new Date().toISOString() });
    if (own && !data.pantry.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      update((d) => ({ ...d, pantry: [...d.pantry, { id: crypto.randomUUID(), name, emoji: "📚", qty: 1, unit: "pcs", last_price: null, updated_at: new Date().toISOString(), kind: "book", photo: cover || undefined, note: author.trim() || undefined }] }));
    }
    const row = logActivity("bookadd", { title: name, author: author.trim() || undefined, pages: total ?? undefined });
    celebrate({ kind: "mission", title: "📚 NEW BOOK ADDED!", subtitle: `${name}${total ? ` · ${total} pages` : ""} · +2 angel points`, xp: row.xp, icon: "😇", quote: "A room without books is like a body without a soul. (Cicero)" });
    setSaved(name);
  };

  return (
    <Sheet title="📷 Add a book" onClose={onClose}>
      {saved ? (
        <div className="text-center space-y-3 py-2">
          {cover ? <img src={cover} alt="" className="mx-auto h-24 w-24 rounded-xl object-cover" /> : <div className="text-5xl">📚</div>}
          <div className="font-bold">{saved} is on your reading list.</div>
          <button onClick={() => { onRead(saved); onClose(); }} className="btn-primary w-full">📖 Log reading now</button>
          <button onClick={() => { setSaved(""); setTitle(""); setAuthor(""); setPages(""); setCover(""); setMsg(""); }} className="btn-ghost w-full text-sm">＋ Add another book</button>
        </div>
      ) : (
        <>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) scan(f); e.target.value = ""; }} />
          <button onClick={() => file.current?.click()} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
            {cover && <img src={cover} alt="" className="h-8 w-8 rounded object-cover" />}{busy ? "Reading the cover…" : "📷 Snap the cover"}
          </button>
          {msg && <p className="text-xs text-muted">{msg}</p>}
          {shot && !busy && <button onClick={() => askAI(shot)} className="btn-ghost w-full !py-2 text-sm ring-1 ring-[var(--accent)]">🤖 Ask AI to read the cover</button>}
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <input className="input" placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <input className="input" inputMode="numeric" placeholder="Pages" value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />I own it (add to My stuff)</label>
          <button onClick={save} disabled={!title.trim() || busy} className="btn-primary w-full disabled:opacity-40">＋ Add to my books</button>
        </>
      )}
    </Sheet>
  );
}
