"use client";

import { useEffect, useMemo, useState } from "react";
import { Pic } from "@/components/Pic";
import { Sheet } from "@/components/Sheet";
import { guessMedia, lookupMedia, MEDIA, MODE_TYPES, mediaPoints, type MediaMode, type MediaType } from "@/lib/media";
import { useApp, type Log } from "@/lib/store";

const MODES: { id: MediaMode; label: string }[] = [
  { id: "read", label: "📖 Reading" },
  { id: "watch", label: "📺 Watching" },
  { id: "listen", label: "🎧 Listening" },
];

type Recent = { title: string; type: MediaType; mode: MediaMode; minutes?: number };

// "What are you reading or watching?" The app works out whether it is a good deed
// (books, study, documentaries) or a bad one (manga, anime, movies, reels).
export function Library({ at, onLogged, openSignal = 0 }: { at: () => Date; onLogged: (l: Log) => void; openSignal?: number }) {
  const { data } = useApp();
  const [open, setOpen] = useState<Recent | null>(null);
  useEffect(() => { if (openSignal) setOpen({ title: "", type: "book", mode: "read" }); }, [openSignal]);
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: Recent[] = [];
    for (const l of [...data.logs].filter((x) => x.kind === "media").sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      const key = String(l.data.title ?? "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ title: String(l.data.title), type: l.data.type as MediaType, mode: l.data.mode as MediaMode, minutes: Number(l.data.minutes) || undefined });
      if (out.length >= 6) break;
    }
    return out;
  }, [data.logs]);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">📚 Library</h2>
        <button onClick={() => setOpen({ title: "", type: "book", mode: "read" })} className="chip chip-on">+ Log</button>
      </div>
      <p className="text-xs text-muted mb-3">Books and study feed your angel 😇. Manga, anime, movies and reels feed your devil 😈.</p>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setOpen({ title: "", type: MODE_TYPES[m.id][0], mode: m.id })} className="btn-ghost !py-3 text-sm">{m.label}</button>
        ))}
      </div>
      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recent.map((r) => (
            <button key={r.title} onClick={() => setOpen(r)} className="chip !inline-flex items-center gap-1.5 !pl-1" style={{ borderColor: MEDIA[r.type]?.good ? "#ffe06688" : "#ff3b6b88" }}>
              <Pic name={r.title} hint={MEDIA[r.type]?.hint} emoji={MEDIA[r.type]?.emoji ?? "📚"} size={22} className="!rounded-md" /> {r.title}
            </button>
          ))}
        </div>
      )}
      {open && <MediaSheet start={open} at={at} onClose={() => setOpen(null)} onLogged={onLogged} />}
    </section>
  );
}

function MediaSheet({ start, at, onClose, onLogged }: { start: Recent; at: () => Date; onClose: () => void; onLogged: (l: Log) => void }) {
  const { logActivity, celebrate } = useApp();
  const [mode, setMode] = useState<MediaMode>(start.mode);
  const [title, setTitle] = useState(start.title);
  const [minutes, setMinutes] = useState(start.minutes ? String(start.minutes) : "");
  const [type, setType] = useState<MediaType>(start.type);
  const [manual, setManual] = useState(!!start.title);
  const [checking, setChecking] = useState(false);
  const [picking, setPicking] = useState(false);

  // Auto-detect as you type: keywords first, then an online lookup.
  useEffect(() => {
    if (manual) return;
    const g = guessMedia(title, mode);
    setType(g.type);
    if (g.sure || title.trim().length < 3) return setChecking(false);
    setChecking(true);
    let live = true;
    const t = setTimeout(async () => {
      const found = await lookupMedia(title, mode);
      if (!live) return;
      if (found) setType(found);
      setChecking(false);
    }, 700);
    return () => { live = false; clearTimeout(t); };
  }, [title, mode, manual]);

  const m = MEDIA[type];
  const pts = mediaPoints(type, minutes ? Number(minutes) : undefined);

  const save = () => {
    const name = title.trim();
    if (!name) return;
    const row = logActivity("media", { title: name, type, mode, minutes: minutes ? Number(minutes) : undefined, emoji: m.emoji, good: m.good }, at(), m.good ? 15 : 3);
    celebrate(m.good
      ? { kind: "mission", title: "😇 GOOD DEED!", subtitle: `${m.label} · +${pts} angel points`, xp: row.xp, icon: m.emoji, quote: "Every page you read is a feather in your wings. Knowledge is the one treasure no one can steal." }
      : { kind: "mission", title: "😈 THE DEVIL GRINS…", subtitle: `${m.label} · ${pts} devil points`, xp: row.xp, icon: "😈", quote: "Rest is fine, hero, but time-pass steals your future. Balance it with a chapter of something real." });
    onLogged(row);
    onClose();
  };

  return (
    <Sheet title="📚 What are you into?" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((x) => (
          <button key={x.id} onClick={() => { setMode(x.id); setManual(false); }} className={`chip justify-center py-2 ${mode === x.id ? "chip-on" : ""}`}>{x.label}</button>
        ))}
      </div>
      <input autoFocus className="input" placeholder={mode === "read" ? "Book or manga name" : mode === "watch" ? "Movie, anime, show or video" : "Podcast, audiobook or music"}
        value={title} onChange={(e) => { setTitle(e.target.value); setManual(false); }} />
      <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: m.good ? "#ffe0661a" : "#ff3b6b1a", border: `1px solid ${m.good ? "#ffe06666" : "#ff3b6b66"}` }}>
        <Pic name={title} hint={m.hint} emoji={m.emoji} size={64} />
        <div className="flex-1">
          <div className="font-bold">{m.label}{checking && <span className="text-xs text-muted"> · checking…</span>}</div>
          <div className="text-xs" style={{ color: m.good ? "#ffe066" : "#ff6b9b" }}>{m.good ? `😇 Good deed · +${pts} angel points` : `😈 Time waste · ${pts} devil points`}</div>
        </div>
        <button onClick={() => setPicking(!picking)} className="chip">Change</button>
      </div>
      {picking && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEDIA) as MediaType[]).map((t) => (
            <button key={t} onClick={() => { setType(t); setManual(true); setPicking(false); }} className={`chip ${t === type ? "chip-on" : ""}`}>
              {MEDIA[t].emoji} {MEDIA[t].label} {MEDIA[t].good ? "😇" : "😈"}
            </button>
          ))}
        </div>
      )}
      <label className="text-xs text-muted">How long (minutes)
        <input className="input mt-1" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="30" /></label>
      <button onClick={save} disabled={!title.trim()} className="btn-primary w-full">Log it</button>
    </Sheet>
  );
}
