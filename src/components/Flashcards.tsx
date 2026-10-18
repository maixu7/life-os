"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { GRADES, grade, isNew, mature, parseBulk, preview, queueOf, srsOf, type Grade } from "@/lib/srs";
import { today, useApp, type CustomItem } from "@/lib/store";

// Flashcards on Learn: decks of cards (kanji, vocab, formulas…), reviewed
// with spaced repetition. A review session pays XP and Angel points.

const DECK_ICONS = ["🈶", "🔤", "📐", "🧪", "🧬", "📜", "🌍", "💻", "🧠", "🃏"];
const uid = () => crypto.randomUUID();
type Deck = CustomItem;

export function useCards() {
  const { data, update } = useApp();
  const decks = useMemo(() => data.items.filter((i) => i.category === "deck").sort((a, b) => a.sort - b.sort), [data.items]);
  const cards = useMemo(() => data.items.filter((i) => i.category === "card"), [data.items]);
  const put = (items: CustomItem[]) => update((d) => {
    const ids = new Set(items.map((i) => i.id));
    return { ...d, items: [...d.items.filter((i) => !ids.has(i.id)), ...items] };
  });
  const drop = (ids: string[]) => update((d) => ({ ...d, items: d.items.filter((i) => !ids.includes(i.id)), deleted: [...d.deleted, ...ids] }));
  return { decks, cards, put, drop };
}
// Adds cards to a deck, making the deck if needed. Stable ids (e.g. "kanji-日")
// keep the same card from being added twice, even from two devices.
export function newCard(deck: string, front: string, back: string, id = uid()): CustomItem {
  return { id, category: "card", name: front, config: { deck, back, due: today() }, sort: Date.now() };
}

export function Flashcards() {
  const { decks, cards, put } = useCards();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [review, setReview] = useState<string | null>(null); // deck id, or "all"
  const day = today();
  const stats = (id: string) => {
    const mine = cards.filter((c) => c.config.deck === id);
    const q = queueOf(mine, day);
    return { total: mine.length, due: q.due.length, fresh: q.fresh.length, mature: mature(mine) };
  };
  const allWaiting = decks.reduce((n, d) => { const s = stats(d.id); return n + s.due + s.fresh; }, 0);
  const addDeck = () => {
    const d: Deck = { id: uid(), category: "deck", name: "New deck", config: { icon: DECK_ICONS[decks.length % DECK_ICONS.length] }, sort: Date.now() };
    put([d]);
    setDeck(d);
  };

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">🃏 Flashcards</h2>
        <button onClick={addDeck} className="chip">＋ Deck</button>
      </div>
      <p className="text-xs text-muted mb-3">Kanji, words, formulas. Cards you know come back later; cards you miss come back soon.</p>
      {allWaiting > 0 && <button onClick={() => setReview("all")} className="btn-primary w-full mb-3">▶ Review all · {allWaiting} cards waiting</button>}
      <div className="space-y-2">
        {decks.map((d) => {
          const s = stats(d.id);
          return (
            <div key={d.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <span className="text-2xl">{String(d.config.icon ?? "🃏")}</span>
              <button onClick={() => setDeck(d)} className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold truncate">{d.name}</div>
                <div className="text-[11px] text-muted">{s.total} cards · <span className="text-amber-300">{s.due} due</span> · <span className="text-sky-300">{s.fresh} new</span> · {s.mature} known well</div>
              </button>
              {s.due + s.fresh > 0 ? <button onClick={() => setReview(d.id)} className="chip chip-on !py-1 text-xs">▶ {s.due + s.fresh}</button> : <span className="text-[11px] text-emerald-300">✓ done</span>}
            </div>
          );
        })}
        {!decks.length && <p className="text-xs text-muted">No decks yet. Tap ＋ Deck, or learn today&apos;s kanji in the JLPT card and they become cards by themselves.</p>}
      </div>
      {deck && <DeckSheet deck={decks.find((d) => d.id === deck.id) ?? deck} onClose={() => setDeck(null)} onReview={() => { setReview(deck.id); setDeck(null); }} />}
      {review && <ReviewSheet deckId={review} onClose={() => setReview(null)} />}
    </section>
  );
}

function DeckSheet({ deck, onClose, onReview }: { deck: Deck; onClose: () => void; onReview: () => void }) {
  const { cards, put, drop } = useCards();
  const mine = cards.filter((c) => c.config.deck === deck.id).sort((a, b) => b.sort - a.sort);
  const [name, setName] = useState(deck.name === "New deck" ? "" : deck.name);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [edit, setEdit] = useState<CustomItem | null>(null);
  const [find, setFind] = useState("");
  const saveName = () => name.trim() && name.trim() !== deck.name && put([{ ...deck, name: name.trim() }]);
  const add = () => { if (!front.trim()) return; put([newCard(deck.id, front.trim(), back.trim())]); setFront(""); setBack(""); };
  const addBulk = () => { const rows = parseBulk(bulk); if (rows.length) put(rows.map((r) => newCard(deck.id, r.front, r.back))); setBulk(""); setShowBulk(false); };
  const shown = find ? mine.filter((c) => `${c.name} ${c.config.back}`.toLowerCase().includes(find.toLowerCase())) : mine;

  return (
    <Sheet title={`${String(deck.config.icon ?? "🃏")} ${deck.name}`} onClose={() => { saveName(); onClose(); }}>
      <input className="input" placeholder="Deck name (Kanji N4, Physics formulas…)" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
      <div className="flex flex-wrap gap-1.5">
        {DECK_ICONS.map((i) => <button key={i} onClick={() => put([{ ...deck, config: { ...deck.config, icon: i } }])} className={`chip !px-2 !py-1 ${deck.config.icon === i ? "chip-on" : ""}`}>{i}</button>)}
      </div>
      <div className="rounded-xl bg-white/5 p-3 space-y-2">
        <div className="text-xs text-muted">Add a card</div>
        <textarea className="input" rows={2} placeholder="Front: question, word or kanji" value={front} onChange={(e) => setFront(e.target.value)} />
        <textarea className="input" rows={2} placeholder="Back: answer, meaning, reading" value={back} onChange={(e) => setBack(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={add} disabled={!front.trim()} className="btn-primary flex-1 disabled:opacity-40">＋ Add card</button>
          <button onClick={() => setShowBulk(!showBulk)} className="btn-ghost text-sm">📋 Many</button>
        </div>
        {showBulk && (
          <>
            <textarea className="input font-mono text-xs" rows={5} placeholder={"One card per line: front - back\n食べる - to eat (たべる)\nF = ma - Newton's 2nd law"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
            <button onClick={addBulk} disabled={!bulk.trim()} className="btn-primary w-full disabled:opacity-40">Add {parseBulk(bulk).length} cards</button>
          </>
        )}
      </div>
      {mine.length > 0 && <button onClick={onReview} className="btn-ghost w-full">▶ Review this deck</button>}
      {mine.length > 6 && <input className="input" placeholder="🔎 Find a card" value={find} onChange={(e) => setFind(e.target.value)} />}
      <ul className="space-y-1.5">
        {shown.slice(0, 80).map((c) => edit?.id === c.id ? (
          <li key={c.id} className="rounded-xl border border-white/10 p-2 space-y-1.5">
            <textarea className="input text-sm" rows={2} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <textarea className="input text-sm" rows={2} value={String(edit.config.back ?? "")} onChange={(e) => setEdit({ ...edit, config: { ...edit.config, back: e.target.value } })} />
            <div className="flex gap-2">
              <button onClick={() => { if (edit.name.trim()) put([edit]); setEdit(null); }} className="btn-primary flex-1 !py-1.5 text-sm">Save</button>
              <button onClick={() => put([{ ...c, config: { deck: deck.id, back: c.config.back, due: today() } }])} className="btn-ghost !py-1.5 text-xs">↺ Reset</button>
              <button onClick={() => { drop([c.id]); setEdit(null); }} className="text-rose-300 px-2 text-sm">Delete</button>
            </div>
          </li>
        ) : (
          <li key={c.id}>
            <button onClick={() => setEdit(c)} className="w-full flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-left text-sm">
              <span className="font-semibold truncate max-w-[40%]">{c.name}</span>
              <span className="flex-1 truncate text-muted text-xs">{String(c.config.back ?? "")}</span>
              <span className="text-[10px] text-muted shrink-0">{isNew(c.config) ? "new" : `${Number(c.config.ivl) || 0}d`}</span>
            </button>
          </li>
        ))}
        {shown.length > 80 && <li className="text-xs text-muted">…and {shown.length - 80} more. Search to find one.</li>}
      </ul>
      <button onClick={() => { if (confirm(`Delete "${deck.name}" and its ${mine.length} cards?`)) { drop([deck.id, ...mine.map((c) => c.id)]); onClose(); } }} className="text-rose-300 text-xs w-full">🗑 Delete this deck</button>
    </Sheet>
  );
}

function ReviewSheet({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const { decks, cards, put } = useCards();
  const day = today();
  // The session's queue is fixed when it opens; "Again" cards go to the back once more.
  const [queue, setQueue] = useState<string[]>(() => {
    const ids = deckId === "all" ? decks.map((d) => d.id) : [deckId];
    return ids.flatMap((id) => { const q = queueOf(cards.filter((c) => c.config.deck === id), day); return [...q.due, ...q.fresh].map((c) => c.id); });
  });
  const [flip, setFlip] = useState(false);
  const [done, setDone] = useState({ n: 0, right: 0 });
  const started = useRef(Date.now());
  const logged = useRef(false);
  const card = cards.find((c) => c.id === queue[0]);
  const deckName = deckId === "all" ? "All decks" : decks.find((d) => d.id === deckId)?.name ?? "Deck";

  const finish = (n = done.n, right = done.right) => {
    if (logged.current || !n) return;
    logged.current = true;
    const minutes = Math.max(1, Math.round((Date.now() - started.current) / 60_000));
    const row = logActivity("cards", { deck: deckName, reviewed: n, right, minutes }, new Date(), Math.min(50, 5 + n * 2));
    celebrate({ kind: "mission", title: "🃏 CARDS CLEARED!", subtitle: `${n} cards · ${right} right · ${minutes} min`, xp: row.xp, icon: "🧠", quote: "Memory is a muscle. Every rep makes the next one easier." });
  };
  const rate = (g: Grade) => {
    if (!card) return;
    const s = grade(srsOf(card.config), g, day);
    put([{ ...card, config: { ...card.config, ...s } }]);
    const next = { n: done.n + 1, right: done.right + (g >= 2 ? 1 : 0) };
    setDone(next);
    const rest = queue.slice(1);
    setQueue(g === 0 && !rest.includes(card.id) ? [...rest, card.id] : rest);
    setFlip(false);
    if (!rest.length && g !== 0) finish(next.n, next.right);
  };

  return (
    <Sheet title={`🃏 ${deckName}`} onClose={() => { finish(); onClose(); }}>
      {card ? (
        <>
          <div className="flex justify-between text-xs text-muted"><span>{queue.length} left</span><span>{done.n} done · {done.right} right</span></div>
          <button onClick={() => setFlip(true)} className="w-full min-h-48 rounded-2xl border border-white/15 bg-white/[.04] p-4 flex flex-col items-center justify-center gap-3 text-center">
            <div className={`font-bold whitespace-pre-wrap ${card.name.length <= 3 ? "text-6xl" : card.name.length < 30 ? "text-2xl" : "text-base"}`}>{card.name}</div>
            {flip ? <div className="border-t border-white/10 pt-3 w-full text-lg whitespace-pre-wrap text-[var(--accent2)]">{String(card.config.back ?? "") || <span className="text-muted text-sm">(no back)</span>}</div>
              : <div className="text-xs text-muted">Think of the answer, then tap to flip</div>}
          </button>
          {flip ? (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map(({ g, label, cls }) => (
                <button key={g} onClick={() => rate(g)} className={`rounded-xl border py-2 text-sm font-semibold ${cls}`}>
                  {label}<span className="block text-[10px] font-normal text-muted">{preview(srsOf(card.config), g, day)}</span>
                </button>
              ))}
            </div>
          ) : <button onClick={() => setFlip(true)} className="btn-primary w-full">Show answer</button>}
        </>
      ) : (
        <div className="text-center py-6 space-y-2">
          <div className="text-5xl">🏆</div>
          <div className="font-bold">{done.n ? `All clear! ${done.n} cards reviewed.` : "Nothing due right now."}</div>
          <p className="text-xs text-muted">Come back tomorrow: the cards you&apos;re about to forget will be waiting.</p>
          <button onClick={() => { finish(); onClose(); }} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Sheet>
  );
}
