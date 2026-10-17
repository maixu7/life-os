"use client";

import { WhenPicker } from "@/components/When";
import { useEffect, useMemo, useState } from "react";
import { Pic } from "@/components/Pic";
import { dtLocal, Sheet } from "@/components/Sheet";
import { WherePicker } from "@/components/Where";
import { CODE_KINDS, CODE_LANGS, codingStats, LEVELS, type CodeKind } from "@/lib/coding";
import { guessMedia, lookupMedia, MEDIA, MODE_TYPES, mediaPoints, type MediaMode, type MediaType } from "@/lib/media";
import { useApp, useCustomItems, type Log } from "@/lib/store";

const MODES: { id: MediaMode | "code"; label: string }[] = [
  { id: "read", label: "📖 Reading" },
  { id: "watch", label: "📺 Watching" },
  { id: "listen", label: "🎧 Listening" },
  { id: "code", label: "💻 Coding" },
];

type Recent = { title: string; type: MediaType; mode: MediaMode; minutes?: number };

// "What are you reading, watching or coding?" Books and study are good deeds;
// manga, anime, movies and reels are time-pass. Everything is logged in full detail.
export function Library({ at, onLogged, openSignal = 0, codeSignal = 0 }: { at: () => Date; onLogged: (l: Log) => void; openSignal?: number; codeSignal?: number }) {
  const { data } = useApp();
  const { items: books } = useCustomItems("list:readlist");
  const [open, setOpen] = useState<Recent | null>(null);
  const [coding, setCoding] = useState(false);
  useEffect(() => { if (openSignal) setOpen({ title: "", type: "book", mode: "read" }); }, [openSignal]);
  useEffect(() => { if (codeSignal) setCoding(true); }, [codeSignal]);
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
  const reading = books.filter((b) => !b.config.done && Number(b.config.page) > 0);
  const code = useMemo(() => codingStats(data.logs), [data.logs]);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">📚 Library</h2>
        <button onClick={() => setOpen({ title: "", type: "book", mode: "read" })} className="chip chip-on">+ Log</button>
      </div>
      <p className="text-xs text-muted mb-3">Books, study and coding feed your angel 😇. Manga, anime, movies and reels feed your devil 😈.</p>
      <div className="grid grid-cols-4 gap-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => (m.id === "code" ? setCoding(true) : setOpen({ title: "", type: MODE_TYPES[m.id][0], mode: m.id }))} className="btn-ghost !px-1 !py-3 text-xs">{m.label}</button>
        ))}
      </div>
      {reading.length > 0 && (
        <div className="mt-3 space-y-2">
          {reading.map((b) => {
            const total = Number(b.config.total) || 0, page = Number(b.config.page) || 0;
            return (
              <button key={b.id} onClick={() => setOpen({ title: b.name, type: "book", mode: "read" })} className="w-full flex items-center gap-3 rounded-xl bg-white/5 p-2 text-left">
                <Pic name={b.name} hint="book" emoji="📚" size={40} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">{b.name}</span>
                  <span className="block text-[11px] text-muted">Page {page}{total ? ` of ${total} · ${Math.round((page / total) * 100)}%` : ""}</span>
                  {total > 0 && <span className="mt-1 block h-1.5 rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--gold)]" style={{ width: `${Math.min(100, (page / total) * 100)}%` }} /></span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {code.langs.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/5 p-2">
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)] mb-1">💻 CODING SKILLS</div>
          <div className="flex flex-wrap gap-1.5">
            {code.langs.map((l) => <span key={l.lang} className="chip !py-1 text-xs">{l.lang} · {l.level} · {(l.minutes / 60).toFixed(1)} h</span>)}
          </div>
        </div>
      )}
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
      {coding && <CodingSheet at={at} onClose={() => setCoding(false)} onLogged={onLogged} />}
    </section>
  );
}

const num = (s: string) => (s === "" ? undefined : Number(s));

function MediaSheet({ start, at, onClose, onLogged }: { start: Recent; at: () => Date; onClose: () => void; onLogged: (l: Log) => void }) {
  const { logActivity, celebrate } = useApp();
  const { items: books, add: addBook, update: updateBook } = useCustomItems("list:readlist");
  const [mode, setMode] = useState<MediaMode>(start.mode);
  const [title, setTitle] = useState(start.title);
  const [minutes, setMinutes] = useState(start.minutes ? String(start.minutes) : "");
  const [type, setType] = useState<MediaType>(start.type);
  const [manual, setManual] = useState(!!start.title);
  const [checking, setChecking] = useState(false);
  const [picking, setPicking] = useState(false);
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState(dtLocal(at()));
  const [note, setNote] = useState("");
  // Reading progress
  const book = books.find((b) => b.name.toLowerCase() === title.trim().toLowerCase());
  const [total, setTotal] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // Watching / listening detail
  const [episode, setEpisode] = useState("");
  const [length, setLength] = useState("");

  useEffect(() => {
    setTotal(book?.config.total ? String(book.config.total) : "");
    setFrom(String((Number(book?.config.page) || 0) + 1));
    setTo("");
  }, [book?.id, book?.config.total, book?.config.page]);

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
  const isBook = mode === "read";
  const pages = isBook && to && from ? Math.max(0, Number(to) - Number(from) + 1) : 0;
  const pts = mediaPoints(type, minutes ? Number(minutes) : pages ? pages * 2 : undefined);

  const save = () => {
    const name = title.trim();
    if (!name) return;
    const t = num(total), pTo = num(to);
    if (isBook && (t || pTo)) {
      const page = pTo ?? Number(book?.config.page ?? 0);
      const done = !!t && page >= t;
      if (book) updateBook(book.id, { config: { ...book.config, total: t ?? book.config.total ?? null, page, ...(done ? { done: true, doneAt: new Date().toISOString() } : {}) } });
      else addBook(name, { total: t ?? null, page, done, created: new Date().toISOString() });
    }
    const row = logActivity("media", {
      title: name, type, mode, emoji: m.emoji, good: m.good, where: where || undefined, note: note || undefined,
      minutes: num(minutes) ?? (pages ? pages * 2 : undefined),
      ...(isBook && pages ? { pages_from: Number(from), pages_to: Number(to), pages, total_pages: t } : {}),
      ...(!isBook && episode ? { episode } : {}), ...(!isBook && length ? { length_min: Number(length) } : {}),
    }, new Date(when), m.good ? 15 : 3);
    const finished = isBook && t && pTo && pTo >= t;
    celebrate(finished ? { kind: "achievement", big: true, title: "BOOK FINISHED!", subtitle: `📚 ${name} · ${t} pages`, xp: row.xp, icon: "📚", quote: "A reader lives a thousand lives before he dies. (George R. R. Martin)" }
      : m.good
        ? { kind: "mission", title: "😇 GOOD DEED!", subtitle: `${m.label}${pages ? ` · ${pages} pages` : ""} · +${pts} angel points`, xp: row.xp, icon: m.emoji, quote: "Every page you read is a feather in your wings. Knowledge is the one treasure no one can steal." }
        : { kind: "mission", title: "😈 THE DEVIL GRINS…", subtitle: `${m.label} · ${pts} devil points`, xp: row.xp, icon: "😈", quote: "Rest is fine, hero, but time-pass steals your future. Balance it with a chapter of something real." });
    onLogged(row);
    onClose();
  };

  return (
    <Sheet title="📚 What are you into?" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {MODES.filter((x) => x.id !== "code").map((x) => (
          <button key={x.id} onClick={() => { setMode(x.id as MediaMode); setManual(false); }} className={`chip justify-center py-2 ${mode === x.id ? "chip-on" : ""}`}>{x.label}</button>
        ))}
      </div>
      <input autoFocus className="input" placeholder={mode === "read" ? "Book or manga name" : mode === "watch" ? "Movie, anime, show or video" : "Podcast, audiobook or music"}
        value={title} onChange={(e) => { setTitle(e.target.value); setManual(false); }} />
      {isBook && books.filter((b) => !b.config.done).length > 0 && !title && (
        <div className="flex flex-wrap gap-2">{books.filter((b) => !b.config.done).map((b) => <button key={b.id} onClick={() => setTitle(b.name)} className="chip">📖 {b.name}</button>)}</div>
      )}
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
      {isBook ? (
        <div className="rounded-xl bg-white/5 p-3 space-y-2">
          <div className="text-xs text-muted">{book ? `Bookmark: page ${book.config.page ?? 0}${book.config.total ? ` of ${book.config.total}` : ""}` : "New book: it will be added to your reading list."}</div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[11px] text-muted">Total pages<input className="input mt-1" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="300" /></label>
            <label className="text-[11px] text-muted">From page<input className="input mt-1" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-[11px] text-muted">To page<input className="input mt-1" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} placeholder={String(Number(from || 1) + 9)} /></label>
          </div>
          <div className="flex flex-wrap gap-2">{[5, 10, 20, 30, 50].map((n) => <button key={n} onClick={() => setTo(String(Number(from || 1) + n - 1))} className="chip !py-1 text-xs">+{n} pages</button>)}</div>
          {pages > 0 && <div className="text-xs text-[var(--accent2)]">{pages} pages this session{num(total) ? ` · ${Math.min(100, Math.round((Number(to) / Number(total)) * 100))}% of the book` : ""}</div>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">{mode === "watch" ? "Episode / part" : "Episode / chapter"}<input className="input mt-1" value={episode} onChange={(e) => setEpisode(e.target.value)} placeholder="S1 E4" /></label>
          <label className="text-xs text-muted">Total length (min)<input className="input mt-1" inputMode="numeric" value={length} onChange={(e) => setLength(e.target.value)} placeholder="24" /></label>
        </div>
      )}
      <label className="text-xs text-muted">How long (minutes)
        <input className="input mt-1" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder={pages ? `about ${pages * 2}` : "30"} /></label>
      <WherePicker value={where} onChange={setWhere} />
      <WhenPicker label="When" value={when} onChange={setWhen} />
      <input className="input" placeholder="Note: what did you learn or think? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button onClick={save} disabled={!title.trim()} className="btn-primary w-full">Log it</button>
    </Sheet>
  );
}

function CodingSheet({ at, onClose, onLogged }: { at: () => Date; onClose: () => void; onLogged: (l: Log) => void }) {
  const { data, logActivity, celebrate } = useApp();
  const stats = useMemo(() => codingStats(data.logs), [data.logs]);
  const [kind, setKind] = useState<CodeKind>("practice");
  const [lang, setLang] = useState(stats.langs[0]?.lang ?? "Python");
  const [customLang, setCustomLang] = useState("");
  const known = stats.langs.find((l) => l.lang === lang);
  const [level, setLevel] = useState(known?.level ?? "Beginner");
  useEffect(() => { if (known) setLevel(known.level); }, [known]);
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState("");
  const [video, setVideo] = useState("");
  const [platform, setPlatform] = useState("");
  const [videoLen, setVideoLen] = useState("");
  const [part, setPart] = useState("");
  const [solved, setSolved] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [wpm, setWpm] = useState("");
  const [acc, setAcc] = useState("");
  const [project, setProject] = useState("");
  const [progress, setProgress] = useState("");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState(dtLocal(at()));
  const k = CODE_KINDS[kind];
  const language = lang === "Other" ? customLang.trim() : lang;

  const save = () => {
    const mins = num(minutes) ?? (kind === "tutorial" ? num(videoLen) : undefined);
    const row = logActivity("coding", {
      sub: kind, lang: kind === "typing" ? undefined : language, level: kind === "typing" ? undefined : level, topic: topic || undefined, minutes: mins, where: where || undefined,
      ...(kind === "tutorial" ? { video: video || undefined, platform: platform || undefined, video_len: num(videoLen), part: part || undefined } : {}),
      ...(kind === "problems" ? { solved: num(solved), difficulty, platform: platform || undefined } : {}),
      ...(kind === "typing" ? { wpm: num(wpm), accuracy: num(acc) } : {}),
      ...(kind === "project" ? { project: project || undefined, progress: num(progress) } : {}),
      ...(kind === "docs" ? { video: video || undefined } : {}),
    }, new Date(when), 20);
    celebrate({ kind: "mission", title: "💻 CODE XP!", subtitle: `${k.icon} ${k.label}${language && kind !== "typing" ? ` · ${language} (${level})` : ""}${mins ? ` · ${mins} min` : ""}`, xp: row.xp, quote: "First, solve the problem. Then, write the code. (John Johnson)" });
    onLogged(row);
    onClose();
  };

  return (
    <Sheet title="💻 Coding session" onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CODE_KINDS) as CodeKind[]).map((x) => <button key={x} onClick={() => setKind(x)} className={`chip ${kind === x ? "chip-on" : ""}`}>{CODE_KINDS[x].icon} {CODE_KINDS[x].label}</button>)}
      </div>
      {kind !== "typing" && (
        <>
          <div className="text-xs text-muted">Language</div>
          <div className="flex flex-wrap gap-1.5">{[...CODE_LANGS, "Other"].map((l) => <button key={l} onClick={() => setLang(l)} className={`chip !py-1 text-xs ${lang === l ? "chip-on" : ""}`}>{l}</button>)}</div>
          {lang === "Other" && <input className="input" placeholder="Language or tool (e.g. Flutter, Excel)" value={customLang} onChange={(e) => setCustomLang(e.target.value)} />}
          <div className="text-xs text-muted">Your level</div>
          <div className="grid grid-cols-3 gap-2">{LEVELS.map((l) => <button key={l} onClick={() => setLevel(l)} className={`chip justify-center ${level === l ? "chip-on" : ""}`}>{l}</button>)}</div>
        </>
      )}
      {kind === "tutorial" && (
        <>
          <input className="input" placeholder="Video / course name" value={video} onChange={(e) => setVideo(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="YouTube, Udemy…" value={platform} onChange={(e) => setPlatform(e.target.value)} />
            <input className="input" inputMode="numeric" placeholder="Length min" value={videoLen} onChange={(e) => setVideoLen(e.target.value)} />
            <input className="input" placeholder="Part / lesson" value={part} onChange={(e) => setPart(e.target.value)} />
          </div>
        </>
      )}
      {kind === "docs" && <input className="input" placeholder="Book / docs name (e.g. MDN, Python docs)" value={video} onChange={(e) => setVideo(e.target.value)} />}
      {kind === "problems" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" inputMode="numeric" placeholder="Problems solved" value={solved} onChange={(e) => setSolved(e.target.value)} />
            <input className="input" placeholder="LeetCode, HackerRank…" value={platform} onChange={(e) => setPlatform(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">{["Easy", "Medium", "Hard"].map((d) => <button key={d} onClick={() => setDifficulty(d)} className={`chip justify-center ${difficulty === d ? "chip-on" : ""}`}>{d}</button>)}</div>
        </>
      )}
      {kind === "typing" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Speed (WPM)<input className="input mt-1" inputMode="numeric" value={wpm} onChange={(e) => setWpm(e.target.value)} placeholder="45" /></label>
          <label className="text-xs text-muted">Accuracy (%)<input className="input mt-1" inputMode="numeric" value={acc} onChange={(e) => setAcc(e.target.value)} placeholder="95" /></label>
          {stats.bestWpm > 0 && <p className="col-span-2 text-xs text-[var(--accent2)]">Your best so far: {stats.bestWpm} WPM</p>}
        </div>
      )}
      {kind === "project" && (
        <div className="grid grid-cols-[1fr_100px] gap-2">
          <input className="input" placeholder="Project name" value={project} onChange={(e) => setProject(e.target.value)} />
          <input className="input" inputMode="numeric" placeholder="Done %" value={progress} onChange={(e) => setProgress(e.target.value)} />
        </div>
      )}
      <input className="input" placeholder={k.topic} value={topic} onChange={(e) => setTopic(e.target.value)} />
      <div className="text-xs text-muted">How long</div>
      <div className="flex flex-wrap gap-2">
        {[15, 30, 45, 60, 90, 120, 180].map((m) => <button key={m} onClick={() => setMinutes(String(m))} className={`chip !py-1 text-xs ${minutes === String(m) ? "chip-on" : ""}`}>{m < 60 ? `${m} min` : `${m / 60} h`}</button>)}
      </div>
      <input className="input" inputMode="numeric" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      <WherePicker value={where} onChange={setWhere} />
      <WhenPicker label="When" value={when} onChange={setWhen} />
      <button onClick={save} disabled={kind !== "typing" && !language} className="btn-primary w-full">Log coding</button>
    </Sheet>
  );
}
