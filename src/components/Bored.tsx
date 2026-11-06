"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBackCloses, Sheet } from "@/components/Sheet";
import { TripCard } from "@/components/Trip";
import { TAGS, type Tag } from "@/lib/goodfor";
import {
  BCATS, NAGOYA_STATION, bcat, copy, googleGo, googleSearch, isOpen, loadAll, loadPicks, loadStations, mins, nearestStation, openText,
  photoPage, photoUrl, ways, type Spot, type Station, type Ways,
} from "@/lib/bored";
import { toDay, useApp, type CustomItem } from "@/lib/store";
import { getPhoto, putPhoto } from "@/lib/vault";

type Me = { lat: number; lon: number; real: boolean };
type Filter = "bike" | "train" | "free" | "rain" | "open" | "saved" | "went";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "bike", label: "🚲 Bike" }, { id: "train", label: "🚃 Train" }, { id: "free", label: "💸 Free" }, { id: "rain", label: "🌧️ Rainy" },
  { id: "open", label: "🟢 Open now" }, { id: "saved", label: "⭐ Saved" }, { id: "went", label: "✅ Went" },
];
const ME_KEY = "lifeos-bored-me";
const PAGE = 40;
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;
const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

/** A place you added yourself, or one saved from the list. */
function ownSpot(i: CustomItem): Spot | null {
  const c = i.config as Record<string, unknown>;
  if (!c.own) return null;
  return {
    id: String(c.pid), en: i.name, ja: String(c.ja ?? ""), cat: String(c.cat ?? "sight"), kind: String(c.kind ?? "My place"), lat: Number(c.lat), lon: Number(c.lon),
    addr: (c.addr as string) || undefined, price: String(c.price ?? ""), free: !!c.free, stay: 60, inside: false, night: false, trip: false, good: [],
    why: String(c.note ?? "A place you added."), photos: ((c.photos as string[]) ?? []).map((id) => `vault:${id}`), pick: false, own: true,
  };
}

export function Bored() {
  const { data, update, logActivity } = useApp();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [full, setFull] = useState(false);
  const [st, setSt] = useState<Station[]>([]);
  const [me, setMe] = useState<Me>(() => {
    try { const j = JSON.parse(localStorage.getItem(ME_KEY) ?? "null"); if (j?.lat) return { ...j, real: true }; } catch { /* none yet */ }
    return { ...NAGOYA_STATION, real: false };
  });
  const [locNote, setLocNote] = useState("");
  const [locating, setLocating] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [on, setOn] = useState<Set<Filter>>(new Set());
  const [best, setBest] = useState(true);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Spot | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const more = useRef<HTMLDivElement>(null);

  // Hand-picked list first (instant), then everything else from our own site.
  useEffect(() => {
    let dead = false;
    loadPicks().then((p) => {
      if (dead) return;
      setSpots(p);
      loadAll(p).then((r) => { if (!dead) { setSpots(r.spots); setFull(true); } });
    });
    loadStations().then((s) => !dead && setSt(s));
    return () => { dead = true; };
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) { setLocNote("This browser can't share your location, so times are from Nagoya Station."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = { lat: pos.coords.latitude, lon: pos.coords.longitude, real: true };
        setMe(m); setLocNote(""); setLocating(false);
        try { localStorage.setItem(ME_KEY, JSON.stringify({ lat: m.lat, lon: m.lon })); } catch { /* private mode */ }
      },
      () => { setLocating(false); setLocNote("Location is off, so times are from Nagoya Station. To fix: allow location for this site in your browser settings, then tap 📍."); },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (s: string) => { setToast(s); if (toastT.current) clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(""), 2600); };

  const placeItems = useMemo(() => data.items.filter((i) => i.category === "place"), [data.items]);
  const savedIds = useMemo(() => new Set(placeItems.filter((i) => (i.config as { saved?: unknown }).saved !== false && (i.config as { saved?: unknown }).saved !== undefined).map((i) => String(i.config.pid))), [placeItems]);
  const wentIds = useMemo(() => new Set(data.logs.filter((l) => l.kind === "visit").map((l) => String(l.data.pid))), [data.logs]);
  const own = useMemo(() => placeItems.map(ownSpot).filter((s): s is Spot => !!s), [placeItems]);

  const mine = useMemo(() => (st.length ? nearestStation(st, me) : null), [st, me]);
  const all = useMemo(() => {
    const list = [...own, ...spots];
    return list.map((s) => ({ s, w: ways(me, s, st, mine) }));
  }, [own, spots, me, st, mine]);

  const list = useMemo(() => {
    const words = q.trim().toLowerCase();
    const wide = !!words || !!cat || on.has("saved") || on.has("went") || !best;
    const now = new Date();
    let out = all.filter(({ s, w }) => {
      if (!wide && !(s.pick || s.own || s.photos.length)) return false;
      if (cat && s.cat !== cat) return false;
      if (words && !`${s.en} ${s.ja} ${s.kind} ${s.area ?? ""} ${s.addr ?? ""}`.toLowerCase().includes(words)) return false;
      if (on.has("bike") && w.bike > 30) return false;
      if (on.has("train") && !w.train && w.walk > 20) return false;
      if (on.has("free") && !s.free) return false;
      if (on.has("rain") && !s.inside) return false;
      if (on.has("open") && isOpen(s, now) === false) return false;
      if (on.has("saved") && !savedIds.has(s.id)) return false;
      if (on.has("went") && !wentIds.has(s.id)) return false;
      return true;
    });
    const key = (w: Ways) => (on.has("train") ? (w.train?.min ?? w.walk) : on.has("bike") ? w.bike : w.m);
    out = out.sort((a, b) => key(a.w) - key(b.w));
    return out;
  }, [all, q, cat, on, best, savedIds, wentIds]);

  useEffect(() => setShown(PAGE), [q, cat, on, best]);
  useEffect(() => {
    const el = more.current; if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setShown((n) => n + PAGE), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length]);

  const toggle = (f: Filter) => setOn((o) => { const n = new Set(o); if (n.has(f)) n.delete(f); else n.add(f); return n; });

  // ---------- saving ----------
  const itemOf = (s: Spot) => placeItems.find((i) => String(i.config.pid) === s.id);
  const saveItem = (s: Spot, patch: Record<string, unknown>) => update((d) => {
    const old = d.items.find((i) => i.category === "place" && String(i.config.pid) === s.id);
    if (old) return { ...d, items: d.items.map((i) => (i.id === old.id ? { ...i, config: { ...i.config, ...patch } } : i)) };
    const it: CustomItem = { id: crypto.randomUUID(), category: "place", name: s.en, sort: Date.now(), config: { pid: s.id, lat: s.lat, lon: s.lon, en: s.en, ja: s.ja, cat: s.cat, kind: s.kind, addr: s.addr, tags: {}, ...patch } };
    return { ...d, items: [...d.items, it] };
  });
  const toggleSave = (s: Spot) => {
    if (savedIds.has(s.id)) { saveItem(s, { saved: false }); say("Removed from Saved"); }
    else { saveItem(s, { saved: new Date().toISOString() }); say("⭐ Saved"); }
  };
  const went = (s: Spot) => {
    logActivity("visit", { name: `Visit ${s.en}`, place: s.en, pid: s.id, lat: s.lat, lon: s.lon, cat: s.cat, kind: s.kind, emoji: bcat(s.cat).icon });
    if (!itemOf(s)) saveItem(s, { saved: false });
    say("✅ Saved to today's records");
  };
  const addToday = (s: Spot, w: Ways) => {
    const go = Math.min(w.bike, w.train?.min ?? Infinity, w.walk);
    const now = new Date();
    const startM = Math.ceil((now.getHours() * 60 + now.getMinutes() + Math.max(15, go + 10)) / 15) * 15;
    const time = hhmm(startM), end = hhmm(startM + s.stay);
    const how = w.walk <= 15 ? `${mins(w.walk)} on foot` : `${mins(w.bike)} by bike${w.train ? ` or ${mins(w.train.min)} by train (¥${w.train.yen})` : ""}`;
    const config = { area: "other", time, end, at: Date.now(), days: [0, 1, 2, 3, 4, 5, 6], date: toDay(now), level: "normal", note: `${s.kind}. About ${how}. Tap ✅ I went in "I'm bored" when you arrive.`, place: s.id };
    update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "task", name: `Visit ${s.en}`, sort: Date.now(), config }] }));
    say(`➕ Added to today's mission at ${fmt12(time)}`);
  };

  const openW = open ? ways(me, open, st, mine) : null;

  return (
    <div data-noedit="" className="space-y-3 pb-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">😴 I&apos;m bored</h1>
          <p className="text-sm text-muted">Fun places near you in Nagoya, nearest first. Tap one for everything about it.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-ghost shrink-0 text-sm rounded-full border border-white/15 px-3 py-2">➕ Add place</button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <button onClick={locate} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5" aria-label="Update my location">📍 {locating ? "Finding you…" : me.real ? "From where you are" : "From Nagoya Station"}</button>
        <span className="text-muted truncate">{full ? `${all.length.toLocaleString()} places` : "Loading all places…"}</span>
      </div>
      {locNote && <p className="text-xs rounded-xl bg-amber-500/15 text-amber-200 px-3 py-2">{locNote}</p>}

      <input className="input w-full" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: ramen, shrine, karaoke, Osu…" aria-label="Search places" />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => { setBest(!best); }} className={`lo-bchip ${best && !cat && !q ? "lo-bchip-on" : ""}`}>{best ? "✨ Best" : "📍 Everything"}</button>
        {FILTERS.map((f) => <button key={f.id} onClick={() => toggle(f.id)} className={`lo-bchip ${on.has(f.id) ? "lo-bchip-on" : ""}`}>{f.label}</button>)}
      </div>
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {BCATS.map((c) => <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className={`lo-bchip ${cat === c.id ? "lo-bchip-on" : ""}`}>{c.icon} {c.label}</button>)}
      </div>

      <p className="text-xs text-muted">{list.length.toLocaleString()} {list.length === 1 ? "place" : "places"}{best && !cat && !q && !on.has("saved") && !on.has("went") ? " · the best ones. Tap ✨ Best to see everything." : ""}</p>

      {list.length === 0 ? (
        <div className="card p-4 text-sm text-center">Nothing matches. Try fewer chips, or <button className="underline" onClick={() => { setOn(new Set()); setCat(null); setQ(""); }}>clear them all</button>.</div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {list.slice(0, shown).map(({ s, w }) => (
            <li key={s.id} className="min-w-0"><Card s={s} w={w} saved={savedIds.has(s.id)} went={wentIds.has(s.id)} onOpen={() => setOpen(s)} /></li>
          ))}
        </ul>
      )}
      {shown < list.length && <div ref={more} className="py-4 text-center"><button onClick={() => setShown((n) => n + PAGE)} className="text-sm underline text-muted">Show more</button></div>}

      <details className="card p-3">
        <summary className="font-semibold cursor-pointer">🚲 Record a ride or trip</summary>
        <div className="mt-2"><TripCard /></div>
      </details>
      <p className="text-[11px] text-muted">Places: © OpenStreetMap contributors and a hand-picked Nagoya list. Photos: Wikimedia Commons. Bike and train times are estimates.</p>

      {open && openW && (
        <Detail s={open} w={openW} saved={savedIds.has(open.id)} visits={data.logs.filter((l) => l.kind === "visit" && l.data.pid === open.id).length}
          onClose={() => setOpen(null)} onSave={() => toggleSave(open)} onWent={() => went(open)} onToday={() => addToday(open, openW)} say={say} />
      )}
      {adding && <AddPlace me={me} onClose={() => setAdding(false)} onDone={(s) => { setAdding(false); say(`➕ ${s} added`); }} />}
      {toast && <div role="status" className="pointer-events-none fixed z-[90] left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-w-[calc(100vw-2rem)] rounded-full bg-black/90 text-white text-sm px-4 py-2 shadow-xl">{toast}</div>}
    </div>
  );
}

function Pic({ src, alt, className, w = 480 }: { src?: string; alt: string; className?: string; w?: number }) {
  const [url, setUrl] = useState<string | null>(src && !src.startsWith("vault:") ? photoUrl(src, w) : null);
  const [bad, setBad] = useState(false);
  const { session } = useApp();
  useEffect(() => {
    if (!src?.startsWith("vault:") || !session) return;
    let u = "";
    getPhoto(session, src.slice(6)).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [src, session]);
  if (!url || bad) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className={className} />;
}

const GRAD: Record<string, string> = {
  arcade: "from-blue-600/50 to-indigo-900/60", karaoke: "from-pink-600/50 to-fuchsia-900/60", shrine: "from-rose-600/50 to-red-900/60", sight: "from-amber-500/50 to-orange-900/60",
  park: "from-green-600/50 to-emerald-900/60", shop: "from-purple-600/50 to-violet-900/60", food: "from-red-500/50 to-orange-900/60", cafe: "from-amber-700/50 to-stone-900/60",
  bath: "from-rose-500/50 to-sky-900/60", museum: "from-violet-600/50 to-slate-900/60", fun: "from-orange-500/50 to-red-900/60", cinema: "from-cyan-600/50 to-slate-900/60",
};

function Card({ s, w, saved, went, onOpen }: { s: Spot; w: Ways; saved: boolean; went: boolean; onOpen: () => void }) {
  const c = bcat(s.cat);
  return (
    <button onClick={onOpen} className="w-full h-full text-left rounded-2xl overflow-hidden border border-white/10 bg-white/[.04] active:scale-[.98] transition flex flex-col" aria-label={`${s.en}, ${s.kind}`}>
      <div className={`relative aspect-[4/3] w-full bg-gradient-to-br ${GRAD[s.cat] ?? GRAD.sight} grid place-items-center`}>
        <span className="text-4xl" aria-hidden>{c.icon}</span>
        <Pic src={s.photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover" w={360} />
        <div className="absolute left-1.5 top-1.5 flex gap-1">
          {s.pick && <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold">✨ Top</span>}
          {s.own && <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold">Mine</span>}
        </div>
        <div className="absolute right-1.5 top-1.5 flex gap-1 text-xs">{saved && <span className="rounded-full bg-black/60 px-1">⭐</span>}{went && <span className="rounded-full bg-black/60 px-1">✅</span>}</div>
        {(s.free || s.price) && <span className="absolute left-1.5 bottom-1.5 max-w-[90%] truncate rounded-full bg-black/65 px-2 py-0.5 text-[10px]">{s.free ? "💸 Free" : s.price}</span>}
      </div>
      <div className="p-2 flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="font-semibold text-sm leading-tight line-clamp-2 break-words">{s.en}</div>
        <div className="text-[11px] text-muted truncate">{c.icon} {s.kind}</div>
        <div className="mt-auto pt-1 text-[11px] leading-snug">
          {w.walk <= 15 ? <span>🚶 {mins(w.walk)}</span> : <span>🚲 {mins(w.bike)}</span>}
          {w.train && <span className="text-muted"> · 🚃 {mins(w.train.min)} ¥{w.train.yen}</span>}
        </div>
      </div>
    </button>
  );
}

function Detail({ s, w, saved, visits, onClose, onSave, onWent, onToday, say }: {
  s: Spot; w: Ways; saved: boolean; visits: number; onClose: () => void; onSave: () => void; onWent: () => void; onToday: () => void; say: (s: string) => void;
}) {
  useBackCloses(onClose);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [idx, setIdx] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setHost(document.body);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = old; };
  }, [onClose]);
  if (!host) return null;
  const c = bcat(s.cat);
  const cp = async (t: string, what: string) => say((await copy(t)) ? `📋 ${what} copied` : "Couldn't copy on this phone");
  const go = (i: number) => { const el = strip.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };
  const open = openText(s);
  const o = isOpen(s);
  return createPortal(
    <div data-noedit="" role="dialog" aria-label={s.en} className="fixed inset-0 z-[80] bg-[#141218] text-white overflow-y-auto overscroll-contain animate-fade">
      <div className="mx-auto max-w-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="relative">
          {s.photos.length ? (
            <div ref={strip} onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}
              className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[38dvh] min-h-[200px] max-h-[420px] bg-black">
              {s.photos.map((f, i) => (
                <div key={f} className={`relative shrink-0 w-full h-full snap-center bg-gradient-to-br ${GRAD[s.cat] ?? GRAD.sight} grid place-items-center`}>
                  <span className="text-6xl" aria-hidden>{c.icon}</span>
                  <Pic src={f} alt={`${s.en} photo ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" w={1024} />
                </div>
              ))}
            </div>
          ) : (
            <div className={`h-[22dvh] min-h-[140px] bg-gradient-to-br ${GRAD[s.cat] ?? GRAD.sight} grid place-items-center`}><span className="text-7xl" aria-hidden>{c.icon}</span></div>
          )}
          <button onClick={onClose} aria-label="Close" className="fixed z-10 right-3 top-[max(0.75rem,env(safe-area-inset-top))] h-11 w-11 rounded-full bg-black/70 shadow-lg text-xl grid place-items-center">✕</button>
          {s.photos.length > 1 && (
            <>
              <button onClick={() => go(Math.max(0, idx - 1))} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-xl hidden sm:grid place-items-center">‹</button>
              <button onClick={() => go(Math.min(s.photos.length - 1, idx + 1))} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-xl hidden sm:grid place-items-center">›</button>
              <span className="absolute bottom-2 right-3 rounded-full bg-black/70 px-2 py-0.5 text-xs">{idx + 1} / {s.photos.length} · swipe</span>
            </>
          )}
        </div>

        <div className="px-4 pt-3 space-y-3">
          <div>
            <div className="flex items-start gap-2">
              <h2 className="text-2xl font-bold leading-tight flex-1 min-w-0 break-words">{s.en}</h2>
              <button onClick={() => cp(s.en, "Name")} className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs" aria-label="Copy name">📋 Copy</button>
            </div>
            {s.ja && s.ja !== s.en && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base text-white/80 flex-1 min-w-0 break-words">{s.ja}</span>
                <button onClick={() => cp(s.ja, "Japanese name")} className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs" aria-label="Copy Japanese name">📋 Copy</button>
              </div>
            )}
            <p className="text-sm text-white/70 mt-1">{c.icon} {s.kind}{s.area ? ` · ${s.area}` : ""}</p>
            {open && <p className={`text-sm mt-0.5 ${o === false ? "text-red-400" : o ? "text-green-400" : "text-white/70"}`}>{open}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={googleSearch(s)} target="_blank" rel="noopener noreferrer" className="col-span-2 rounded-full bg-[#a8c7fa] text-[#062e6f] font-semibold text-center py-3">🔍 Search in Google Maps</a>
            <button onClick={onSave} className="rounded-full bg-[#0f3651] text-[#c2e7ff] font-semibold py-2.5">{saved ? "⭐ Saved" : "☆ Save"}</button>
            <button onClick={onWent} className="rounded-full bg-[#0f3651] text-[#c2e7ff] font-semibold py-2.5">✅ I went</button>
            <button onClick={onToday} className="col-span-2 rounded-full bg-[#0f3651] text-[#c2e7ff] font-semibold py-2.5">➕ Add to today&apos;s mission</button>
          </div>
          {visits > 0 && <p className="text-xs text-green-300">✅ You went here {visits === 1 ? "once" : `${visits} times`}.</p>}

          <section className="rounded-2xl bg-white/5 p-3 space-y-2">
            <h3 className="font-semibold">Getting there</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <a href={googleGo(s, "walking")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/5 py-2"><div className="text-lg">🚶</div>{mins(w.walk)}</a>
              <a href={googleGo(s, "bicycling")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/5 py-2"><div className="text-lg">🚲</div>{mins(w.bike)}</a>
              <a href={googleGo(s, "transit")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/5 py-2"><div className="text-lg">🚃</div>{w.train ? `${mins(w.train.min)} · ¥${w.train.yen}` : "Walk or bike"}</a>
            </div>
            <p className="text-xs text-white/60">{(w.m / 1000).toFixed(1)} km away.{w.train ? ` Train: ${w.train.from} → ${w.train.to}.` : ""} Tap a way to open directions in Google Maps.</p>
          </section>

          {s.addr && (
            <section className="rounded-2xl bg-white/5 p-3 flex items-start gap-2">
              <div className="flex-1 min-w-0"><h3 className="font-semibold">Address</h3><p className="text-sm break-words">{s.addr}</p></div>
              <button onClick={() => cp(s.addr ?? "", "Address")} className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs" aria-label="Copy address">📋 Copy</button>
            </section>
          )}

          <section className="rounded-2xl bg-white/5 p-3 space-y-2">
            <h3 className="font-semibold">Why it&apos;s fun</h3>
            <p className="text-sm leading-relaxed">{s.why}</p>
            {s.good.length > 0 && <div className="flex flex-wrap gap-1.5">{s.good.filter((g) => TAGS[g as Tag]).map((g) => <span key={g} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{TAGS[g as Tag]}</span>)}</div>}
          </section>

          <section className="rounded-2xl bg-white/5 p-3 text-sm divide-y divide-white/10">
            <Row k="💴 Price" v={s.free ? (s.price && !/^Free$/.test(s.price) ? s.price : "Free") : s.price || "Not listed. Check in Google."} />
            <Row k="🕒 Hours" v={s.hours ?? (s.oh ? s.oh.replace(/;\s*/g, "; ") : "Not listed. Check in Google.")} />
            <Row k="⏳ Time to spend" v={s.stay < 60 ? `About ${s.stay} min` : `About ${Math.round((s.stay / 60) * 2) / 2} h`} />
            {s.inside && <Row k="🌧️ Rain" v="Indoors, good on a rainy day" />}
            {s.trip && <Row k="🧭 Trip" v="A day trip outside the city" />}
            {s.tel && <Row k="📞 Phone" v={<a className="underline" href={`tel:${s.tel}`}>{s.tel}</a>} />}
            {s.web && <Row k="🌐 Website" v={<a className="underline break-all" href={s.web} target="_blank" rel="noopener noreferrer">{s.web.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}</a>} />}
            {s.wiki && <Row k="📖 Story" v={<a className="underline" href={s.wiki} target="_blank" rel="noopener noreferrer">Read on Wikipedia</a>} />}
          </section>
          {s.photos.some((f) => !f.startsWith("vault:")) && (
            <p className="text-[11px] text-white/50">Photos from Wikimedia Commons: {s.photos.filter((f) => !f.startsWith("vault:")).slice(0, 3).map((f, i) => <a key={f} className="underline mr-1" href={photoPage(f)} target="_blank" rel="noopener noreferrer">photo {i + 1}</a>)}</p>
          )}
          <button onClick={onClose} className="w-full rounded-full border border-white/15 py-3 font-semibold">← Back to the list</button>
        </div>
      </div>
    </div>,
    host,
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex gap-3 py-2 first:pt-0 last:pb-0"><span className="w-28 shrink-0 text-white/60">{k}</span><span className="flex-1 min-w-0 break-words">{v}</span></div>;
}

function AddPlace({ me, onClose, onDone }: { me: Me; onClose: () => void; onDone: (name: string) => void }) {
  const { update, session } = useApp();
  const [name, setName] = useState("");
  const [ja, setJa] = useState("");
  const [cat, setCat] = useState("sight");
  const [addr, setAddr] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    let photos: string[] = [];
    if (file && session) { const id = crypto.randomUUID(); try { await putPhoto(session, id, file); photos = [id]; } catch { /* keep going without it */ } }
    const pid = `own:${crypto.randomUUID()}`;
    update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "place", name: name.trim(), sort: Date.now(), config: { pid, own: true, ja: ja.trim(), cat, kind: bcat(cat).label, addr: addr.trim(), note: note.trim(), lat: me.lat, lon: me.lon, photos, saved: new Date().toISOString(), tags: {} } }] }));
    onDone(name.trim());
  };
  return (
    <Sheet title="➕ Add my own place" onClose={onClose}>
      <p className="text-xs text-muted">{me.real ? "It's saved at where you are now." : "Location is off, so it's saved at Nagoya Station. Turn location on for the real spot."}</p>
      <input className="input w-full" placeholder="Name (e.g. Cool ramen shop)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input w-full" placeholder="Japanese name (optional)" value={ja} onChange={(e) => setJa(e.target.value)} />
      <select className="input w-full" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Type">{BCATS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
      <input className="input w-full" placeholder="Address (optional)" value={addr} onChange={(e) => setAddr(e.target.value)} />
      <textarea className="input w-full" rows={2} placeholder="Why it's good (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <label className="block text-sm">📷 Photo (optional)<input type="file" accept="image/*" className="block mt-1 text-xs" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <button disabled={!name.trim() || busy} onClick={save} className="btn-primary w-full disabled:opacity-50">{busy ? "Saving…" : "Save place"}</button>
    </Sheet>
  );
}
