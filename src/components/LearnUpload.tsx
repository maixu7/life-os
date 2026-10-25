"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { SnapChoice, type LabelRead, type Pick } from "@/components/SnapChoice";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { guessKit, KIT_CATS, kitOfItem, myKit, type KitCat } from "@/lib/learnkit";
import { toDay, useApp, useCustomItems, type CustomItem, type Log } from "@/lib/store";

// 📷 Upload on Learn: snap a book cover, a page, an app or a video screenshot
// (or type it), say what it is (title, author, subject, how big it is), where
// you are in it, and what you did today. It goes into My collection and today's
// record (pages read, minutes studied, coding time), so missions and goals count it.

type D = {
  id?: string; cat: KitCat; title: string; author: string; subject: string; level: string; about: string;
  total: string; at: string; // book/article: pages; course: lessons; video/podcast: minutes
  from: string; to: string; mins: string; chapter: string; note: string; hard: number;
  goal: string; status: "want" | "doing" | "done"; photo?: string; isbn?: string; filled: string[];
};
const blank = (photo?: string): D => ({ cat: "book", title: "", author: "", subject: "", level: "", about: "", total: "", at: "", from: "", to: "", mins: "", chapter: "", note: "", hard: 3, goal: "", status: "doing", photo, filled: [] });
const n = (s: string) => { const x = Number(s); return Number.isFinite(x) && x > 0 ? x : undefined; };
const digits = (s: string) => s.replace(/[^0-9]/g, "");
// What the size and progress count in, per kind of thing.
const UNIT: Record<KitCat, string> = { book: "pages", article: "pages", course: "lessons", video: "minutes", podcast: "minutes", lang: "lessons", code: "lessons", other: "pages" };
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function fromItem(i: CustomItem): D {
  const k = kitOfItem(i), c = i.config;
  const s = (v: unknown) => (v == null || v === "" ? "" : String(v));
  const at = Number(c.at) || 0;
  return { ...blank(k.photo), id: i.id, cat: k.cat, title: k.title, about: k.about, author: s(c.author), subject: s(c.subject), level: s(c.level),
    total: s(c.total ?? (k.cat === "video" ? k.minutes : "")), at: s(c.at), from: k.cat === "book" || k.cat === "article" ? String(at + 1) : "",
    goal: s(c.goal), status: (["want", "doing", "done"].includes(String(c.status)) ? c.status : "doing") as D["status"], isbn: k.isbn };
}

export function LearnUpload({ onClose }: { onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const { items, add, update } = useCustomItems("learnkit");
  const ref = useRef<HTMLInputElement>(null);
  const [snap, setSnap] = useState<{ small: string; img: HTMLImageElement } | null>(null);
  const [d, setD] = useState<D | null>(null);
  const [msg, setMsg] = useState("");
  const kit = useMemo(() => myKit(data).filter((k) => !k.fromHave), [data]);
  const list = useMemo<Pick[]>(() => kit.map((k) => ({ name: k.title, emoji: KIT_CATS[k.cat].icon, sub: KIT_CATS[k.cat].label, mine: true })), [kit]);
  const set = (p: Partial<D>) => setD((x) => (x ? { ...x, ...p } : x));
  // This week: pages read, minutes learnt, and days in a row with any learning.
  const week = useMemo(() => {
    const from = toDay(new Date(Date.now() - 6 * 86_400_000));
    const learnt = (l: Log) => (l.kind === "media" && l.data.good !== false) || l.kind === "coding" || l.kind === "focus";
    const ls = data.logs.filter((l) => l.day >= from && learnt(l));
    let streak = 0;
    for (let i = 0; i < 60; i++) { const day = toDay(new Date(Date.now() - i * 86_400_000)); if (data.logs.some((l) => l.day === day && learnt(l))) streak++; else if (i > 0) break; }
    return { pages: ls.reduce((n, l) => n + (Number(l.data.pages) || 0), 0), mins: ls.reduce((n, l) => n + (Number(l.data.minutes) || 0), 0), streak };
  }, [data.logs]);

  const choose = async (file?: File) => {
    if (!file) return;
    const img = await loadImage(file);
    setSnap({ img, small: smallPhoto(img, 200) });
  };
  const picked = (photo: string, p: Pick, label?: LabelRead) => {
    setSnap(null);
    const have = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
    if (have) { const x = fromItem(have); setD({ ...x, photo: x.photo ?? photo }); return; }
    const g = guessKit(label?.text ?? "", p.name, label?.barcode);
    // "312 pages" or "全312頁" on a cover or back.
    const pages = /(\d{2,4})\s*(?:pages|pp\.?|頁|ページ)/i.exec(label?.text ?? "")?.[1];
    const filled = ["Title", g.cat !== "other" && "Type", g.about && "About", g.minutes && "Length", pages && "Pages", g.isbn && "ISBN"].filter(Boolean) as string[];
    setD({ ...blank(photo), title: p.name, cat: g.cat === "other" ? "book" : g.cat, about: g.about, total: pages ?? (g.minutes ? String(g.minutes) : ""), isbn: g.isbn, filled, from: "1" });
  };

  const save = () => {
    if (!d?.title.trim()) return;
    const title = d.title.trim(), unit = UNIT[d.cat];
    const paged = unit === "pages";
    const from = n(d.from), to = n(d.to), mins = n(d.mins), total = n(d.total);
    const readNow = paged && from && to && to >= from ? to - from + 1 : 0;
    const doneNow = !paged ? n(d.to) : undefined; // lessons or minutes done today
    const at = paged ? (to ?? n(d.at) ?? 0) : (n(d.at) ?? 0) + (doneNow ?? 0);
    const finished = d.status === "done" || (!!total && at >= total);
    const config = {
      cat: d.cat, about: d.about.trim(), author: d.author.trim() || undefined, subject: d.subject.trim() || undefined, level: d.level || undefined,
      total, at: at || undefined, unit, goal: n(d.goal), status: finished ? "done" : d.status, photo: d.photo, isbn: d.isbn,
      minutes: d.cat === "video" ? total : undefined, ...(finished ? { doneAt: new Date().toISOString() } : {}),
    };
    const old = d.id ? items.find((i) => i.id === d.id) : undefined;
    if (old) update(old.id, { name: title, config: { ...old.config, ...config } });
    else add(title, { ...config, added: new Date().toISOString() });
    // Today's record, so goals, missions and reports count it.
    const note = [d.chapter && `Chapter: ${d.chapter}`, d.note.trim(), `Difficulty ${d.hard}/5`].filter(Boolean).join(" · ");
    let logged = "";
    if (readNow || mins || doneNow) {
      const subject = d.subject.trim() || undefined;
      if (d.cat === "code") logActivity("coding", { sub: "tutorial", topic: title, lang: subject, minutes: mins ?? (doneNow ? doneNow * 15 : 20), note }, new Date(), 10);
      else {
        const type = d.cat === "book" ? "book" : d.cat === "article" ? "article" : d.cat === "podcast" ? "podcast" : d.cat === "video" || d.cat === "course" ? "course" : "study";
        const mode = d.cat === "podcast" ? "listen" : d.cat === "video" || d.cat === "course" ? "watch" : "read";
        logActivity("media", {
          title, type, mode, emoji: KIT_CATS[d.cat].icon, good: true, subject, note,
          minutes: mins ?? (readNow ? readNow * 2 : d.cat === "video" || d.cat === "podcast" ? doneNow : doneNow ? doneNow * 20 : undefined),
          ...(readNow ? { pages_from: from, pages_to: to, pages: readNow, total_pages: total } : {}),
          ...(!paged && doneNow ? { [unit]: doneNow } : {}),
        }, new Date(), 15);
      }
      logged = readNow ? ` · ${readNow} pages today` : doneNow ? ` · ${doneNow} ${unit} today` : ` · ${mins} min today`;
    }
    if (finished && !old?.config.doneAt) celebrate({ kind: "achievement", big: true, title: "FINISHED!", subtitle: `${KIT_CATS[d.cat].icon} ${title}`, icon: KIT_CATS[d.cat].icon, xp: 0 });
    setMsg(`✓ Saved ${title}${logged}.`);
    setD(null);
  };

  if (d) {
    const unit = UNIT[d.cat], paged = unit === "pages";
    const total = n(d.total), at = n(d.at) ?? (n(d.from) ? n(d.from)! - 1 : 0), goal = n(d.goal);
    const left = total ? Math.max(0, total - at) : 0;
    const eta = goal && left ? new Date(Date.now() + Math.ceil(left / goal) * 86_400_000).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
    return (
      <Sheet title={d.id ? "✏️ Update" : "📷 Add learning"} onClose={() => setD(null)}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.photo ? <img src={d.photo} alt="" className="h-20 w-16 rounded-lg object-cover" /> : <span className="h-20 w-16 rounded-lg bg-white/5 grid place-items-center text-3xl">{KIT_CATS[d.cat].icon}</span>}
          <p className="text-xs text-muted flex-1">{d.filled.length ? <>Read from the photo on your phone (no AI): {d.filled.join(", ")}. Check it.</> : d.id ? "Change anything and add what you did today." : "Fill in what you know; everything can be changed later."}</p>
        </div>
        <div className="text-xs text-muted">1. What is it?</div>
        <div className="flex flex-wrap gap-1.5">{(Object.keys(KIT_CATS) as KitCat[]).map((c) => <button key={c} onClick={() => set({ cat: c })} className={`chip !py-1 text-xs ${d.cat === c ? "chip-on" : ""}`}>{KIT_CATS[c].icon} {KIT_CATS[c].label}</button>)}</div>
        <label className="block text-xs text-muted">2. Title<input className="input mt-1" placeholder="e.g. Genki I, CS50, JLPT N3 kanji" value={d.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-muted">{d.cat === "video" || d.cat === "podcast" ? "Channel / host" : d.cat === "course" ? "Teacher / site" : "Author"}<input className="input mt-1" value={d.author} onChange={(e) => set({ author: e.target.value })} /></label>
          <label className="block text-xs text-muted">Subject<input className="input mt-1" placeholder="Japanese, Python…" value={d.subject} onChange={(e) => set({ subject: e.target.value })} /></label>
        </div>
        <div className="flex gap-1.5">{LEVELS.map((l) => <button key={l} onClick={() => set({ level: d.level === l ? "" : l })} className={`chip flex-1 justify-center !py-1 text-[11px] ${d.level === l ? "chip-on" : ""}`}>{l}</button>)}</div>
        <div className="text-xs text-muted pt-1">3. How big is it, and where are you?</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-muted">Total {unit}<input className="input mt-1" inputMode="numeric" value={d.total} onChange={(e) => set({ total: digits(e.target.value) })} /></label>
          <label className="block text-xs text-muted">{paged ? "I'm on page" : `${unit[0].toUpperCase()}${unit.slice(1)} done so far`}<input className="input mt-1" inputMode="numeric" value={d.at} onChange={(e) => set({ at: digits(e.target.value), from: paged && e.target.value ? String(Number(digits(e.target.value)) + 1) : d.from })} /></label>
        </div>
        {total ? <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (at / total) * 100)}%` }} /></div> : null}
        <div className="text-xs text-muted pt-1">4. Today</div>
        {paged ? (
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-muted">From page<input className="input mt-1" inputMode="numeric" value={d.from} onChange={(e) => set({ from: digits(e.target.value) })} /></label>
            <label className="block text-xs text-muted">To page<input className="input mt-1" inputMode="numeric" value={d.to} onChange={(e) => set({ to: digits(e.target.value) })} /></label>
            <label className="block text-xs text-muted">Minutes<input className="input mt-1" inputMode="numeric" value={d.mins} onChange={(e) => set({ mins: digits(e.target.value) })} /></label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-muted">{unit === "minutes" ? "Minutes watched" : `${unit[0].toUpperCase()}${unit.slice(1)} done today`}<input className="input mt-1" inputMode="numeric" value={d.to} onChange={(e) => set({ to: digits(e.target.value) })} /></label>
            {unit !== "minutes" && <label className="block text-xs text-muted">Minutes<input className="input mt-1" inputMode="numeric" value={d.mins} onChange={(e) => set({ mins: digits(e.target.value) })} /></label>}
          </div>
        )}
        <label className="block text-xs text-muted">Chapter / lesson / topic<input className="input mt-1" value={d.chapter} onChange={(e) => set({ chapter: e.target.value })} /></label>
        <label className="block text-xs text-muted">What I learnt<textarea className="input mt-1 min-h-14 text-sm" placeholder="3 things I remember" value={d.note} onChange={(e) => set({ note: e.target.value })} /></label>
        <div className="text-xs text-muted">How hard was it?</div>
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((h) => <button key={h} onClick={() => set({ hard: h })} className={`chip flex-1 justify-center !py-1 ${d.hard === h ? "chip-on" : ""}`}>{["😌", "🙂", "😐", "😓", "🤯"][h - 1]}</button>)}</div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <label className="block text-xs text-muted">Daily goal ({unit})<input className="input mt-1" inputMode="numeric" value={d.goal} onChange={(e) => set({ goal: digits(e.target.value) })} /></label>
          <p className="text-[11px] text-muted pb-2">{eta ? `At ${goal} a day you finish about ${eta}.` : total && left === 0 ? "Finished 🎉" : "Set a goal to see when you'll finish."}</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5">{([["want", "📌 Want to"], ["doing", "📖 Doing"], ["done", "✅ Finished"]] as const).map(([v, l]) => <button key={v} onClick={() => set({ status: v })} className={`chip justify-center !py-1 text-[11px] ${d.status === v ? "chip-on" : ""}`}>{l}</button>)}</div>
        {d.isbn && <p className="text-[11px] text-muted">🔢 ISBN {d.isbn}</p>}
        <button onClick={save} disabled={!d.title.trim()} className="btn-primary w-full !py-3 disabled:opacity-40">Save</button>
      </Sheet>
    );
  }

  return (
    <Sheet title="📷 Upload learning" onClose={onClose}>
      <p className="text-xs text-muted">A book cover or page, an app, a course or a video screenshot. It goes into My collection and today&apos;s record.</p>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/5 p-1.5"><b>{week.pages}</b><br /><span className="text-muted">pages this week</span></div>
        <div className="rounded-lg bg-white/5 p-1.5"><b>{week.mins}</b><br /><span className="text-muted">min this week</span></div>
        <div className="rounded-lg bg-white/5 p-1.5"><b>🔥 {week.streak}</b><br /><span className="text-muted">days in a row</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => ref.current?.click()} className="btn-primary !py-4 text-sm">📷 Photo or screenshot</button>
        <button onClick={() => setD(blank())} className="btn-ghost !py-4 text-sm">✍️ Type it</button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; choose(f); }} />
      {snap && <SnapChoice photo={snap.small} img={snap.img} list={list} what="learning thing" kind="learn" laterType="have" addNew
        onClose={() => setSnap(null)} onAI={() => { setD(blank(snap.small)); setSnap(null); }} onPick={(p, label) => picked(snap.small, p, label)} />}
      {msg && <p className="text-xs text-emerald-300">{msg}</p>}
      {kit.length > 0 && <>
        <div className="text-xs text-muted pt-1">Or update one you have:</div>
        <div className="space-y-1.5">
          {items.map((i) => {
            const k = kitOfItem(i), total = Number(i.config.total) || 0, at = Number(i.config.at) || 0;
            return (
              <button key={i.id} onClick={() => setD(fromItem(i))} className="w-full flex items-center gap-2 rounded-xl bg-white/5 p-2 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {k.photo ? <img src={k.photo} alt="" className="h-10 w-8 rounded object-cover" /> : <span className="text-2xl w-8 text-center">{KIT_CATS[k.cat].icon}</span>}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{k.title}</span>
                  <span className="block text-[10px] text-muted truncate">{KIT_CATS[k.cat].label}{total ? ` · ${at}/${total} ${String(i.config.unit ?? UNIT[k.cat])}` : ""}{i.config.status === "done" ? " · ✅ finished" : ""}</span>
                  {total > 0 && <span className="block h-1 mt-1 rounded-full bg-white/10 overflow-hidden"><span className="block h-full bg-emerald-400" style={{ width: `${Math.min(100, (at / total) * 100)}%` }} /></span>}
                </span>
              </button>
            );
          })}
        </div>
      </>}
    </Sheet>
  );
}
