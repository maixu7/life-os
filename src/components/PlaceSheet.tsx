"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBackCloses } from "@/components/Sheet";
import { goodFor, knowBefore, oneLine, stayOf, TAGS } from "@/lib/goodfor";
import {
  addressOf, catOf, directionsUrl, distText, factsOf, googleDetails, googleSearchUrl, metres, minText, openNow, phoneOf, photosOf, priceOf, routeTo, storyOf, travel, websiteOf, weekHours,
  type GSummary, type Photo, type Place, type Route, type Story,
} from "@/lib/places";
import { startTrip } from "@/lib/trip";
import { toDay, useApp, type CustomItem, type ShopItem } from "@/lib/store";
import { getPhoto, putPhoto } from "@/lib/vault";

// One place, laid out like a Google Maps card: name, rating, open now, a row
// of action buttons with Directions first, a photo grid that opens a full-screen
// viewer, then Overview / Photos / About / My notes. Free sources only unless
// the server has a Google key.

/** A saved place (items "place") back as a map place. */
export function placeFromItem(i: CustomItem): Place {
  const c = i.config as Record<string, unknown>;
  return { id: String(c.pid), lat: Number(c.lat), lon: Number(c.lon), name: i.name, en: (c.en as string) || undefined, cat: String(c.cat ?? "sight"), kind: String(c.kind ?? "Place"), tags: (c.tags as Record<string, string>) ?? {}, g: c.g as GSummary | undefined };
}
const KEEP = /^(name|name:en|name:ja|opening_hours|phone|contact:|website|url|addr:|fee|charge|wikipedia|wikidata|wikimedia_commons|image|religion|denomination|subject|cuisine|brand|operator|start_date|heritage|wheelchair|internet_access|historic|amenity|tourism|leisure|shop|description|toilets|payment:)/;
const pickTags = (t: Record<string, string>) => Object.fromEntries(Object.entries(t).filter(([k]) => KEEP.test(k)));
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
type Tab = "overview" | "photos" | "about" | "mine" | "reviews";
type Pic = { thumb: string; full: string; by?: string; mine?: boolean };

export function PlaceCard({ place, from, lang: lang0, gOn, onClose, onUpdate, onRoute }: {
  place: Place; from: { lat: number; lon: number } | null; lang: "en" | "ja"; gOn: boolean; like?: (p: Place) => number;
  onClose: () => void; onUpdate?: (p: Place) => void; onRoute: (r: Route | null) => void;
}) {
  const { data, update, session, logActivity, profile } = useApp();
  const p = place;
  const [lang, setLang] = useState(lang0);
  const [tab, setTab] = useState<Tab>("overview");
  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [g, setG] = useState<GSummary | null | undefined>(place.g?.reviews ? place.g : gOn ? undefined : null);
  const [gPics, setGPics] = useState<string[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [plan, setPlan] = useState(false);
  const [spend, setSpend] = useState(false);
  const [toast, setToast] = useState("");
  const [mine, setMine] = useState<Record<string, string>>({});
  const [dir, setDir] = useState<null | "foot" | "bike" | "transit">(null);
  const [route, setRoute] = useState<Route | null | "loading" | "none">(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useBackCloses(onClose);
  const cur = profile.settings.currency || "¥";
  const yen = /^(¥|JPY|円)$/i.test(cur) ? "¥" : `${cur} `;

  const item = data.items.find((i) => i.category === "place" && i.config.pid === p.id);
  const cfg = (item?.config ?? {}) as { stars?: number; note?: string; photos?: string[]; ai?: string; vote?: 1 | -1; saved?: string | false };
  const visits = data.logs.filter((l) => l.kind === "visit" && l.data.pid === p.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const spent = data.shopping.filter((s) => s.note === `place:${p.id}`);
  const d = from ? metres(from, p) : null;
  const t = d != null ? travel(d) : null;
  const cat = catOf(p.cat);
  const o = openNow(p.tags.opening_hours);
  const hours = weekHours(p.tags.opening_hours);
  const addr = addressOf(p.tags) || g?.address || "";
  const phone = phoneOf(p.tags) ?? g?.phone;
  const site = websiteOf(p.tags) ?? g?.website;
  const full: Place = useMemo(() => ({ ...p, g: g ?? p.g }), [p, g]);
  const price = priceOf(full, yen.trim());
  const facts = factsOf(p.tags);
  const tags = goodFor(full);
  const know = knowBefore(full);
  const say = (s: string) => { setToast(s); setTimeout(() => setToast(""), 2600); };
  const rating = g?.rating;
  const localName = p.tags.name && p.tags.name !== p.name ? p.tags.name : p.en && p.en !== p.name ? p.en : "";

  // The story and photos, free from Wikipedia / Wikimedia.
  useEffect(() => {
    let dead = false;
    setStory(undefined);
    storyOf(p, lang).then((s) => !dead && setStory(s)).catch(() => !dead && setStory(null));
    return () => { dead = true; };
  }, [p.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let dead = false;
    photosOf(p).then((x) => !dead && setPhotos(x)).catch(() => !dead && setPhotos([]));
    return () => { dead = true; };
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Google (only when the server has a key).
  useEffect(() => {
    if (!gOn || !session || (g && g.reviews)) return;
    let dead = false;
    googleDetails(session, p, lang).then((x) => { if (!dead) { setG(x); if (x) onUpdate?.({ ...p, g: x }); } }).catch(() => { if (!dead) setG(null); });
    return () => { dead = true; };
  }, [gOn, session, p.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!g?.photos?.length || !session) return;
    let dead = false;
    Promise.all(g.photos.slice(0, 8).map((name) => fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: session.user, auth: session.auth, op: "photo", name, lat: p.lat, lon: p.lon }) }).then((r) => r.json()).then((j) => j.url as string | undefined).catch(() => undefined)))
      .then((u) => !dead && setGPics(u.filter((x): x is string => !!x)));
    return () => { dead = true; };
  }, [g?.photos, session]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!session || !cfg.photos?.length) return;
    let dead = false;
    Promise.all(cfg.photos.map(async (id) => [id, await getPhoto(session, id).then((b) => (b ? URL.createObjectURL(b) : "")).catch(() => "")] as const))
      .then((x) => !dead && setMine(Object.fromEntries(x.filter(([, u]) => u))));
    return () => { dead = true; };
  }, [session, cfg.photos?.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- directions on our own map ----------
  const showDir = (m: "foot" | "bike" | "transit") => {
    setDir(m);
    if (m === "transit" || !from) { setRoute(null); onRoute(null); return; }
    setRoute("loading");
    routeTo(from, p, m).then((r) => { setRoute(r ?? "none"); onRoute(r); });
  };
  const closeDir = () => { setDir(null); setRoute(null); onRoute(null); };

  // ---------- saving ----------
  const saveItem = (patch: Record<string, unknown>) => update((dd) => {
    const old = dd.items.find((i) => i.category === "place" && i.config.pid === p.id);
    if (old) return { ...dd, items: dd.items.map((i) => (i.id === old.id ? { ...i, config: { ...i.config, ...patch } } : i)) };
    const it: CustomItem = { id: crypto.randomUUID(), category: "place", name: p.name, sort: Date.now(), config: { pid: p.id, lat: p.lat, lon: p.lon, en: p.en, cat: p.cat, kind: p.kind, tags: pickTags(p.tags), g: g ? { ...g, reviews: undefined, photos: undefined } : undefined, saved: new Date().toISOString(), ...patch } };
    return { ...dd, items: [...dd.items, it] };
  });
  const toggleSave = () => {
    if (item && cfg.saved !== false) {
      update((dd) => ({ ...dd, items: dd.items.map((i) => (i.id === item.id ? { ...i, config: { ...i.config, saved: false } } : i)) }));
      say("Removed from Saved");
    } else { saveItem({ saved: new Date().toISOString() }); say("🔖 Saved to My places"); }
  };
  const isSaved = !!item && (item.config as { saved?: unknown }).saved !== false;
  const visited = () => {
    logActivity("visit", { name: `Visit ${p.name}`, place: p.name, pid: p.id, lat: p.lat, lon: p.lon, cat: p.cat, kind: p.kind, emoji: cat.icon });
    if (!item) saveItem({ saved: false });
    say("✅ Visit saved to today's records. How was it? Tap 👍 or 👎 below.");
    setTab("overview");
  };
  const vote = (v: 1 | -1) => { saveItem({ vote: cfg.vote === v ? 0 : v, vtags: goodFor(full) }); say(v === 1 ? "👍 Got it, more places like this" : "👎 Got it, fewer places like this"); };
  const addPhoto = async (f: File | undefined) => {
    if (!f || !session) return;
    const id = crypto.randomUUID();
    await putPhoto(session, id, f);
    saveItem({ photos: [...(cfg.photos ?? []), id] });
    say("📷 Photo saved");
  };
  const share = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lon}`;
    const text = `${p.name}${localName ? ` (${localName})` : ""} · ${p.kind}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); say("🔗 Link copied"); }
    } catch { /* cancelled */ }
  };
  const askAi = async () => {
    if (!session) return;
    setAiBusy(true); setAi("");
    const factsText = [
      `Name: ${p.name}${localName ? ` (${localName})` : ""}`, `Type: ${p.kind}`, addr && `Address: ${addr}`, `Location: ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`,
      p.tags.opening_hours && `Hours: ${p.tags.opening_hours}`, `Price info: ${price}`, story?.text && `Wikipedia: ${story.text.slice(0, 900)}`,
      g?.rating && `Google rating ${g.rating} (${g.count} reviews)`,
    ].filter(Boolean).join("\n");
    try {
      const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: session.user, auth: session.auth, mode: "place", text: "How much does it cost, when is the best time to visit, and any tips?", summary: factsText }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.answer) throw new Error(j.error ?? "AI didn't answer. Try again.");
      setAi(j.answer);
      if (item) saveItem({ ai: j.answer });
    } catch (e) { setAi(`⚠️ ${(e as Error).message}`); }
    setAiBusy(false);
  };

  const pics: Pic[] = [
    ...Object.values(mine).map((u) => ({ thumb: u, full: u, mine: true, by: "My photo" })),
    ...gPics.map((u) => ({ thumb: u, full: u, by: "Google" })),
    ...(photos ?? []).map((x) => ({ thumb: x.thumb, full: x.full, by: x.by ? `${x.by} · Wikimedia Commons` : "Wikimedia Commons" })),
    ...(story?.image && !(photos ?? []).some((x) => x.thumb === story.image) ? [{ thumb: story.image, full: story.image, by: "Wikipedia" }] : []),
  ];
  const tabs: [Tab, string][] = [["overview", "Overview"], ...(g?.reviews?.length ? [["reviews", "Reviews"] as [Tab, string]] : []), ["photos", `Photos${pics.length ? ` ${pics.length}` : ""}`], ["about", "About"], ["mine", "My notes"]];
  const summary = g?.about ?? (story?.description ? oneLine(full, `${story.description[0].toUpperCase()}${story.description.slice(1)}`) : oneLine(full));
  const askVote = visits.length > 0 && !cfg.vote;

  // ---------- directions view ----------
  if (dir) {
    const r = route && typeof route === "object" ? route : null;
    const gmode = dir === "foot" ? "walking" : dir === "bike" ? "bicycling" : "transit";
    return (
      <div className="px-4 pb-6 space-y-3 min-w-0">
        <div className="flex items-center gap-2">
          <button onClick={closeDir} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0" aria-label="Back">←</button>
          <div className="flex-1 min-w-0"><div className="text-xs text-muted">Directions to</div><div className="font-bold truncate">{p.name}</div></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0" aria-label="Close">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {([["foot", "🚶", "Walk", t?.walk], ["bike", "🚲", "Bicycle", t?.bike], ["transit", "🚌", "Bus / train", t?.transit]] as const).map(([m, ic, lb, est]) => (
            <button key={m} onClick={() => showDir(m)} className={`rounded-xl p-2 text-center border ${dir === m ? "bg-[#2563eb] border-[#2563eb] text-white" : "border-white/15 bg-white/5"}`}>
              <div className="text-xl leading-none">{ic}</div>
              <div className="text-xs font-bold mt-1">{lb}</div>
              <div className="text-[11px] opacity-80">{dir === m && r ? minText(r.min) : est ? `~${minText(est)}` : m === "transit" ? "walk it" : "–"}</div>
            </button>
          ))}
        </div>
        {!from ? <p className="text-sm text-amber-400">Turn on location to see the route from where you are. Google Maps below still works.</p>
          : dir === "transit" ? <p className="text-sm">{t?.transit ? `About ${minText(t.transit)} by bus or train (estimate, incl. waiting). ` : "It's close: walking is quickest. "}Free maps don&apos;t have bus and train timetables, so open Google Maps for the exact line and times.</p>
          : route === "loading" ? <p className="text-sm text-muted">Finding the route…</p>
          : route === "none" ? <p className="text-sm text-muted">Couldn&apos;t get a route right now. About {minText(dir === "foot" ? t!.walk : t!.bike)} ({distText(d!)} straight). Use Google Maps below.</p>
          : r ? <div className="card p-3"><div className="text-2xl font-black">{minText(r.min)} <span className="text-base font-semibold text-muted">· {distText(r.m)}</span></div><div className="text-xs text-muted">{dir === "foot" ? "Walking" : "Cycling"} route is drawn on the map. Arrive about {fmt12(hhmm(new Date(Date.now() + r.min * 60_000)))}.</div></div> : null}
        <a href={directionsUrl(p, gmode)} target="_blank" rel="noreferrer" className="lo-pill lo-pill-main w-full justify-center !py-3">▲ Start in Google Maps</a>
        {from && dir !== "transit" && <button onClick={() => { startTrip(); say("Trip started: your route is recorded while the app stays open."); }} className="btn-ghost w-full">⏺️ Record this trip in the app</button>}
        {toast && <p className="text-sm text-green-400 font-semibold">{toast}</p>}
      </div>
    );
  }

  return (
    <div className="pb-8 min-w-0 break-words">
      {/* Title */}
      <div className="px-4 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black leading-tight">{p.name}</h2>
          {localName && <div className="text-sm text-muted">{localName}</div>}
        </div>
        <button onClick={toggleSave} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0" aria-label={isSaved ? "Saved" : "Save"}>{isSaved ? "🔖" : "📑"}</button>
        <button onClick={share} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0" aria-label="Share">↗</button>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0" aria-label="Close">✕</button>
      </div>
      <div className="px-4 mt-1 text-sm space-y-0.5">
        {rating ? <div><b>{rating.toFixed(1)}</b> <span className="text-amber-400">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span> <span className="text-muted">({(g?.count ?? 0).toLocaleString()})</span></div>
          : cfg.stars ? <div><span className="text-amber-400">{"★".repeat(cfg.stars)}{"☆".repeat(5 - cfg.stars)}</span> <span className="text-muted">my rating</span></div> : null}
        <div className="text-muted">{cat.icon} {p.kind}{g?.type && g.type !== p.kind ? ` · ${g.type}` : ""}{p.tags.wheelchair === "yes" || g?.wheelchair ? " · ♿" : ""}{d != null ? ` · ${distText(d)}` : ""}</div>
        {o ? <div className={o.open ? "text-green-400" : "text-red-400"}>{o.text}</div> : g?.open != null ? <div className={g.open ? "text-green-400" : "text-red-400"}>{g.open ? "Open now" : "Closed now"}</div> : null}
      </div>

      {/* Actions */}
      <div className="mt-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 w-max">
          <button onClick={() => showDir("foot")} className="lo-pill lo-pill-main">◆ Directions</button>
          <a href={directionsUrl(p, "walking") + "&dir_action=navigate"} target="_blank" rel="noreferrer" className="lo-pill">▲ Start</a>
          {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="lo-pill">📞 Call</a>}
          <button onClick={visited} className="lo-pill">✅ I&apos;m here</button>
          <button onClick={() => setPlan(!plan)} className="lo-pill">➕ Today</button>
          <button onClick={askAi} disabled={aiBusy} className="lo-pill">{aiBusy ? "✨ Asking…" : "✨ Ask AI"}</button>
          {site && <a href={site} target="_blank" rel="noreferrer" className="lo-pill">🌐 Website</a>}
          <button onClick={() => setSpend(!spend)} className="lo-pill">💴 I spent</button>
        </div>
      </div>
      <div className="px-4">
        {toast && <p className="text-sm text-green-400 font-semibold mt-2">{toast}</p>}
        {plan && <div className="mt-2"><PlanBox p={p} walk={t?.walk ?? 0} onDone={(s) => { setPlan(false); say(s); }} /></div>}
        {spend && <div className="card p-2.5 mt-2"><SpendBox p={p} yen={yen} onDone={(s) => { setSpend(false); say(s); }} /></div>}
        {(ai || cfg.ai) && <div className="card p-2.5 mt-2 text-sm whitespace-pre-line">✨ {ai || cfg.ai}<div className="text-[10px] text-muted mt-1">From AI. Check prices before you go.</div></div>}
      </div>

      {/* Photos (tap to open the viewer) */}
      <div className="mt-3 px-4">
        {pics.length ? (
          <div className={`grid gap-1.5 h-44 ${pics.length >= 3 ? "grid-cols-3 grid-rows-2" : pics.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {pics.slice(0, 3).map((x, i) => (
              <button key={x.thumb} onClick={() => setViewer(i)} className={`relative overflow-hidden rounded-xl bg-black/30 min-w-0 ${pics.length >= 3 && i === 0 ? "col-span-2 row-span-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                {i === 2 && pics.length > 3 && <span className="absolute inset-0 bg-black/50 grid place-items-center text-white font-bold">+{pics.length - 3}</span>}
              </button>
            ))}
          </div>
        ) : photos === null ? <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
          : <button onClick={() => fileRef.current?.click()} className="w-full h-24 rounded-xl border border-dashed border-white/20 text-sm text-muted">📷 No photos yet. Add yours</button>}
      </div>

      {/* Tabs */}
      <div className="mt-3 border-b border-white/10 overflow-x-auto no-scrollbar">
        <div className="flex px-2 w-max">
          {tabs.map(([k, lb]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm font-semibold border-b-2 ${tab === k ? "border-[var(--accent2)] text-[var(--accent2)]" : "border-transparent text-muted"}`}>{lb}</button>)}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {tab === "overview" && <>
          {askVote && (
            <div className="card p-3 flex items-center gap-2 border border-[var(--accent2)]/40">
              <span className="flex-1 text-sm">You visited {visits.length > 1 ? `${visits.length} times` : "here"}. Did you like it?</span>
              <button onClick={() => vote(1)} className="text-2xl px-1" aria-label="Liked it">👍</button>
              <button onClick={() => vote(-1)} className="text-2xl px-1" aria-label="Didn't like it">👎</button>
            </div>
          )}
          <p className="text-sm leading-relaxed">{summary}</p>
          {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map((x) => <span key={x} className="chip !py-0.5 text-xs">{TAGS[x]}</span>)}</div>}
          <div className="card p-3 space-y-1.5">
            <b className="text-sm">💡 Know before you go</b>
            {g?.know && <p className="text-sm">{g.know}</p>}
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>💴 {price}</li>
              {know.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>
          {d != null && t && (
            <button onClick={() => showDir("foot")} className="card w-full p-3 text-left">
              <div className="text-sm font-semibold">📏 {distText(d)} away</div>
              <div className="text-xs text-muted">🚶 {minText(t.walk)} · 🚲 {minText(t.bike)}{t.transit ? ` · 🚌 ~${minText(t.transit)}` : ""} · tap for the route</div>
            </button>
          )}
          <div className="card p-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><b className="flex-1">📖 Why it&apos;s known</b><button onClick={() => setLang(lang === "en" ? "ja" : "en")} className="chip !py-0.5 text-xs">{lang === "en" ? "日本語" : "English"}</button></div>
            {story === undefined ? <p className="text-muted text-xs">Looking on Wikipedia…</p>
              : story ? <><p className="leading-relaxed">{story.text}</p><a href={story.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent2)] underline">Read more on Wikipedia</a></>
              : <p className="text-muted text-xs">{p.tags.description ?? `Not on Wikipedia. ${p.cat === "shrine" ? "Small local shrines like this one are part of the neighbourhood rather than famous sights." : "A local place: the details above are what's known."}`}</p>}
          </div>
          {visits.length > 0 && <p className="text-xs text-muted">✅ Visited {visits.length} time{visits.length > 1 ? "s" : ""}, last on {new Date(visits[0].created_at).toLocaleDateString([], { month: "short", day: "numeric" })}{cfg.vote === 1 ? " · 👍 you liked it" : cfg.vote === -1 ? " · 👎 not for you" : ""}</p>}
        </>}

        {tab === "reviews" && g?.reviews?.map((r, i) => (
          <div key={i} className="border-b border-white/10 pb-2">
            <div className="text-sm"><b>{r.by}</b> <span className="text-muted text-xs">· {r.when}</span></div>
            <div className="text-amber-400 text-sm">{"★".repeat(Math.round(r.stars))}</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{r.text}</p>
          </div>
        ))}

        {tab === "photos" && <>
          <div className="grid grid-cols-3 gap-1.5">
            {pics.map((x, i) => (
              <button key={x.thumb} onClick={() => setViewer(i)} className="aspect-square overflow-hidden rounded-lg bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/25 text-xs text-muted">📷<br />Add my photo</button>
          </div>
          {!pics.length && photos !== null && <p className="text-xs text-muted">No public photos of this spot yet. Yours will show here and at the top.</p>}
        </>}

        {tab === "about" && <div className="space-y-2 text-sm">
          {addr && <div>📍 {addr}</div>}
          {hours ? <div><div>🕒 Hours {o ? <span className={o.open ? "text-green-400" : "text-red-400"}>· {o.text}</span> : null}</div><ul className="text-xs mt-1 font-mono pl-6">{hours.map((h) => <li key={h}>{h}</li>)}</ul></div>
            : g?.hours?.length ? <div>🕒 Hours<ul className="text-xs mt-1 pl-6">{g.hours.map((h) => <li key={h}>{h}</li>)}</ul></div>
            : p.tags.opening_hours ? <div>🕒 {p.tags.opening_hours}</div> : <div className="text-muted">🕒 Hours not listed{p.cat === "shrine" || p.cat === "park" ? " (usually open all day)" : ""}</div>}
          {phone && <div>📞 <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="underline">{phone}</a></div>}
          {site && <div className="truncate">🌐 <a href={site} target="_blank" rel="noreferrer" className="underline">{site.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}</a></div>}
          <div>💴 {price}</div>
          <div>⏱️ Usual visit: about {stayOf(full)} min</div>
          {facts.length > 0 && <table className="w-full text-xs"><tbody>{facts.map(([k, v]) => <tr key={k}><td className="text-muted pr-2 align-top whitespace-nowrap py-0.5">{k}</td><td className="break-words py-0.5">{v}</td></tr>)}</tbody></table>}
          <a href={g?.maps ?? googleSearchUrl(p)} target="_blank" rel="noreferrer" className="inline-block text-xs text-[var(--accent2)] underline">Open in Google Maps</a>
          <p className="text-[10px] text-muted">Data: OpenStreetMap contributors{story ? ", Wikipedia" : ""}{photos?.length ? ", Wikimedia Commons" : ""}{g ? ", Google" : ""}.</p>
        </div>}

        {tab === "mine" && <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex-1">Did you like it?</span>
            <button onClick={() => vote(1)} className={`text-2xl px-2 rounded-lg ${cfg.vote === 1 ? "bg-green-600/40" : ""}`} aria-label="Liked it">👍</button>
            <button onClick={() => vote(-1)} className={`text-2xl px-2 rounded-lg ${cfg.vote === -1 ? "bg-red-600/40" : ""}`} aria-label="Didn't like it">👎</button>
          </div>
          <div className="flex gap-1 items-center"><span className="flex-1">My stars</span>{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => saveItem({ stars: cfg.stars === n ? 0 : n })} className="text-2xl leading-none text-amber-400" aria-label={`${n} stars`}>{(cfg.stars ?? 0) >= n ? "★" : "☆"}</button>)}</div>
          <textarea className="input w-full text-sm" rows={3} placeholder="What I liked, what to try next time…" defaultValue={cfg.note ?? ""} onBlur={(e) => { if (e.target.value !== (cfg.note ?? "")) saveItem({ note: e.target.value }); }} />
          <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full">📷 Add my photo</button>
          <div className="text-xs text-muted">{visits.length ? `Visited ${visits.length} time${visits.length > 1 ? "s" : ""}, last on ${new Date(visits[0].created_at).toLocaleDateString([], { month: "short", day: "numeric" })}` : "Not visited yet"}{spent.length ? ` · spent ${spent.map((s) => `${yen}${Number(s.price).toLocaleString()}`).join(", ")}` : ""}</div>
        </div>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />

      {viewer != null && pics.length > 0 && <PhotoViewer pics={pics} start={viewer} title={p.name} onClose={() => setViewer(null)} />}
    </div>
  );
}

// Full-screen photos: swipe left/right, ✕ or Back to close (like Google Maps).
function PhotoViewer({ pics, start, title, onClose }: { pics: Pic[]; start: number; title: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(start);
  useBackCloses(onClose);
  useEffect(() => {
    const b = box.current;
    if (b) b.scrollLeft = start * b.clientWidth;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowRight" && b) b.scrollBy({ left: b.clientWidth, behavior: "smooth" });
      if (e.key === "ArrowLeft" && b) b.scrollBy({ left: -b.clientWidth, behavior: "smooth" });
    };
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (n: number) => { const b = box.current; if (b) b.scrollTo({ left: n * b.clientWidth, behavior: "smooth" }); };
  // On top of everything (the menu bar too), outside the map's layers.
  return createPortal(
    <div data-noedit="" className="fixed inset-0 z-[80] bg-black flex flex-col" role="dialog" aria-label="Photos">
      <div className="flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 text-white">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/15 grid place-items-center text-xl shrink-0" aria-label="Close photos">✕</button>
        <div className="flex-1 min-w-0"><div className="font-bold truncate">{title}</div><div className="text-xs text-white/70">{i + 1} / {pics.length}</div></div>
      </div>
      <div ref={box} onScroll={(e) => { const b = e.currentTarget; setI(Math.round(b.scrollLeft / Math.max(1, b.clientWidth))); }} className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {pics.map((x) => (
          <div key={x.full} className="w-full h-full shrink-0 snap-center grid place-items-center p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.full} alt="" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain select-none" draggable={false} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 pt-2 pb-[max(0.8rem,env(safe-area-inset-bottom))] text-white">
        <button onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} className="w-10 h-10 rounded-full bg-white/15 disabled:opacity-30 shrink-0" aria-label="Previous">‹</button>
        <div className="flex-1 min-w-0 text-center text-xs text-white/70 truncate">{pics[i]?.by ?? ""}</div>
        <button onClick={() => go(Math.min(pics.length - 1, i + 1))} disabled={i >= pics.length - 1} className="w-10 h-10 rounded-full bg-white/15 disabled:opacity-30 shrink-0" aria-label="Next">›</button>
      </div>
    </div>,
    document.body,
  );
}

// "Add to today's mission": a timed task of your own.
function PlanBox({ p, walk, onDone }: { p: Place; walk: number; onDone: (s: string) => void }) {
  const { update } = useApp();
  const start = new Date(Date.now() + Math.max(15, walk + 10) * 60_000);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const [time, setTime] = useState(hhmm(start));
  const [mins, setMins] = useState(p.cat === "shrine" && p.tags.historic === "wayside_shrine" ? 15 : p.cat === "park" || p.cat === "museum" || p.cat === "fun" ? 90 : 60);
  const add = () => {
    const [h, m] = time.split(":").map(Number);
    const endM = h * 60 + m + mins;
    const end = `${String(Math.floor(endM / 60) % 24).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`;
    const name = `Visit ${p.name}`;
    const config = { area: "other", time, end, at: Date.now(), days: [0, 1, 2, 3, 4, 5, 6], date: toDay(new Date()), level: "normal", note: `${p.kind}. ${walk ? `About ${minText(walk)} on foot.` : ""} Tap ✅ I'm here on the map when you arrive.`, place: p.id };
    update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "task", name, sort: Date.now(), config }] }));
    onDone(`✓ Added to today's mission at ${fmt12(time)}`);
  };
  return (
    <div className="card p-2.5 space-y-2 text-sm">
      <div className="font-semibold">➕ Add to today&apos;s mission</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs min-w-0">Start<input type="time" className="input w-full mt-0.5" value={time} onChange={(e) => setTime(e.target.value)} /></label>
        <label className="text-xs min-w-0">How long (min)<input type="number" inputMode="numeric" min={5} max={600} className="input w-full mt-0.5" value={mins} onChange={(e) => setMins(Math.max(5, Math.min(600, Number(e.target.value) || 60)))} /></label>
      </div>
      {walk > 0 && <p className="text-[11px] text-muted">Leave about {minText(walk)} before to walk there.</p>}
      <button onClick={add} className="btn-primary w-full">Add</button>
    </div>
  );
}

// What you paid here goes into your money records (Shopping → Collection).
function SpendBox({ p, yen, onDone }: { p: Place; yen: string; onDone: (s: string) => void }) {
  const { update } = useApp();
  const [amount, setAmount] = useState("");
  const [what, setWhat] = useState(p.cat === "food" || p.cat === "cafe" ? "Meal" : "Entry");
  const save = () => {
    const n = Number(amount);
    if (!(n > 0)) return;
    const now = new Date().toISOString();
    const s: ShopItem = { id: crypto.randomUUID(), name: `${what}: ${p.name}`, emoji: catOf(p.cat).icon, qty: 1, unit: "pcs", price: n, category: "Fun & outings", note: `place:${p.id}`, photo_id: null, status: "purchased", purchased_at: now, created_at: now };
    update((d) => ({ ...d, shopping: [...d.shopping, s] }));
    onDone(`💴 ${yen}${n.toLocaleString()} saved to your money records`);
  };
  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap gap-1">{["Entry", "Meal", "Drink", "Games", "Gift", "Other"].map((w) => <button key={w} onClick={() => setWhat(w)} className={`chip !py-0.5 text-xs ${what === w ? "chip-on" : ""}`}>{w}</button>)}</div>
      <div className="flex gap-2 min-w-0">
        <input className="input flex-1 min-w-0" type="number" inputMode="decimal" placeholder={`Amount (${yen.trim()})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={save} className="btn-primary shrink-0">Save</button>
      </div>
    </div>
  );
}
