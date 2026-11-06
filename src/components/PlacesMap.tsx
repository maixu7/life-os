"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BIG_TILE } from "@/components/MainActions";
import { PlaceSheet, placeFromItem } from "@/components/PlaceSheet";
import { TripCard, TripHistory } from "@/components/Trip";
import {
  CATS, DEFAULT_CATS, catOf, distText, googleNearby, googleOn, googlePlace, googleText, loadPlaces, metres, minText, openNow, searchPlaces, travel,
  type Box, type GSummary, type Place,
} from "@/lib/places";
import { useTrip, type Pt } from "@/lib/trip";
import { useApp } from "@/lib/store";

// The Places page: a real map with you on it, places to visit around you
// (down to small street shrines), a list sorted by distance and a detail card.

type LL = { lat: number; lon: number };
const TOKYO: LL = { lat: 35.6812, lon: 139.7671 };
const LS = { cats: "lifeos-map-cats", lang: "lifeos-map-lang", last: "lifeos-map-last" };
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const inside = (a: Box, b: Box) => a.s >= b.s && a.n <= b.n && a.w >= b.w && a.e <= b.e;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
type View = "near" | "saved" | "visited";

export function PlacesMap() {
  const { data, session } = useApp();
  const el = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const meLayer = useRef<Leaflet.LayerGroup | null>(null);
  const routeLayer = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [cats, setCats] = useState<string[]>(DEFAULT_CATS);
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [me, setMe] = useState<LL | null>(null);
  const [acc, setAcc] = useState(0);
  const [geoErr, setGeoErr] = useState("");
  const [center, setCenter] = useState<LL>(TOKYO);
  const [zoom, setZoom] = useState(15);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<Place | null>(null);
  const [view, setView] = useState<View>("near");
  const [shown, setShown] = useState(30);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [gOn, setGOn] = useState(false);
  const [showRoute, setShowRoute] = useState<Pt[] | null>(null);
  const loaded = useRef<{ box: Box; key: string } | null>(null);
  const gLoaded = useRef<{ c: LL; key: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const follow = useRef(true);
  const trip = useTrip();

  // Remembered choices on this device.
  useEffect(() => {
    setCats(read(LS.cats, DEFAULT_CATS));
    setLang(read(LS.lang, "en"));
    googleOn().then(setGOn);
  }, []);

  // ---------- the map ----------
  useEffect(() => {
    let dead = false;
    import("leaflet").then((mod) => {
      if (dead || !el.current || map.current) return;
      const Lf = (mod.default ?? mod) as typeof Leaflet;
      L.current = Lf;
      const last = read<LL & { z: number } | null>(LS.last, null);
      const m = Lf.map(el.current, { zoomControl: false, attributionControl: true, center: [last?.lat ?? TOKYO.lat, last?.lon ?? TOKYO.lon], zoom: last?.z ?? 15, maxZoom: 19, minZoom: 4, tapTolerance: 20 } as Leaflet.MapOptions);
      Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        referrerPolicy: "strict-origin-when-cross-origin", crossOrigin: false,
      } as Leaflet.TileLayerOptions).addTo(m);
      m.attributionControl.setPrefix(false);
      layer.current = Lf.layerGroup().addTo(m);
      routeLayer.current = Lf.layerGroup().addTo(m);
      meLayer.current = Lf.layerGroup().addTo(m);
      const moved = () => {
        const c = m.getCenter();
        setCenter({ lat: c.lat, lon: c.lng });
        setZoom(m.getZoom());
        write(LS.last, { lat: c.lat, lon: c.lng, z: m.getZoom() });
      };
      m.on("moveend", moved);
      m.on("dragstart", () => { follow.current = false; });
      map.current = m;
      moved();
      setReady(true);
      // The box can change size (rotate, keyboard): keep the map filling it.
      const ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(el.current);
      (m as unknown as { _ro: ResizeObserver })._ro = ro;
    });
    return () => {
      dead = true;
      const m = map.current as (Leaflet.Map & { _ro?: ResizeObserver }) | null;
      m?._ro?.disconnect();
      m?.remove();
      map.current = null;
    };
  }, []);

  // ---------- where you are ----------
  useEffect(() => {
    if (!navigator.geolocation) { setGeoErr("This device has no location."); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const ll = { lat: p.coords.latitude, lon: p.coords.longitude };
        setMe(ll); setAcc(p.coords.accuracy); setGeoErr("");
      },
      (e) => setGeoErr(e.code === 1 ? "Location is off for this app. Allow it in your browser or phone settings to see what's near you." : "Finding where you are…"),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  // First fix (or the map finishing loading after it): go to where you are once.
  useEffect(() => {
    if (!ready || !me || !follow.current || !map.current) return;
    follow.current = false;
    map.current.setView([me.lat, me.lon], Math.max(map.current.getZoom(), 15));
  }, [ready, me]);
  const locate = () => {
    follow.current = true;
    if (me && map.current) { follow.current = false; map.current.setView([me.lat, me.lon], Math.max(map.current.getZoom(), 16)); }
    else navigator.geolocation?.getCurrentPosition((p) => map.current?.setView([p.coords.latitude, p.coords.longitude], 16), () => setGeoErr("Location is off for this app. Allow it in your browser or phone settings."));
  };
  useEffect(() => {
    const Lf = L.current, g = meLayer.current;
    if (!Lf || !g || !ready) return;
    g.clearLayers();
    if (!me) return;
    if (acc > 15 && acc < 2000) Lf.circle([me.lat, me.lon], { radius: acc, color: "#3b82f6", weight: 1, fillOpacity: 0.08, interactive: false }).addTo(g);
    Lf.marker([me.lat, me.lon], { icon: Lf.divIcon({ className: "", html: '<div class="lo-me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false, zIndexOffset: 1000 }).addTo(g);
  }, [me, acc, ready]);

  // ---------- loading places for the area on screen ----------
  const load = useCallback(async (force = false) => {
    const m = map.current;
    if (!m) return;
    const z = m.getZoom();
    const use = cats.filter((c) => !catOf(c).dense || z >= 15);
    const skipped = cats.length - use.length;
    if (z < 12) { setNote("Zoom in to see places."); return; }
    setNote(skipped ? "Zoom in closer to see food, cafés, shops and konbini." : "");
    if (!use.length) return;
    const b = m.getBounds().pad(0.3);
    const box: Box = { s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() };
    const key = `${use.sort().join(",")}|${lang}`;
    const view: Box = { s: m.getBounds().getSouth(), w: m.getBounds().getWest(), n: m.getBounds().getNorth(), e: m.getBounds().getEast() };
    if (!force && loaded.current && loaded.current.key === key && inside(view, loaded.current.box)) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setLoading(true); setErr("");
    try {
      const got = await loadPlaces(use, box, lang, ac.signal);
      if (ac.signal.aborted) return;
      loaded.current = { box, key };
      setPlaces((old) => {
        const next = new Map(old);
        // Keep at most ~2500 in memory: drop the ones far away.
        if (next.size > 2500) for (const [k, p] of next) if (metres(p, { lat: m.getCenter().lat, lon: m.getCenter().lng }) > 8000) next.delete(k);
        for (const p of got) next.set(p.id, { ...p, g: old.get(p.id)?.g });
        return next;
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message);
    } finally {
      if (abort.current === ac) setLoading(false);
    }
  }, [cats, lang]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => load(), 450);
    return () => clearTimeout(t);
  }, [ready, center, zoom, load]);

  // Google: ratings for the places here (only when the server has the key).
  useEffect(() => {
    if (!gOn || !ready || !session || zoom < 13) return;
    const key = `${[...cats].sort().join(",")}|${lang}`;
    if (gLoaded.current && gLoaded.current.key === key && metres(gLoaded.current.c, center) < 900) return;
    const t = setTimeout(() => {
      const m = map.current;
      if (!m) return;
      const radius = Math.min(3000, m.getCenter().distanceTo(m.getBounds().getNorthEast()));
      gLoaded.current = { c: center, key };
      googleNearby(session, cats, center, radius, lang).then((gs) => setPlaces((old) => mergeGoogle(old, gs))).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [gOn, ready, session, center, zoom, cats, lang]);

  const pickCat = (id: string) => {
    const next = id === "all" ? (cats.length === DEFAULT_CATS.length && DEFAULT_CATS.every((c) => cats.includes(c)) ? [] : DEFAULT_CATS) : cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id];
    setCats(next); write(LS.cats, next); setShown(30);
  };
  const pickLang = (l: "en" | "ja") => { setLang(l); write(LS.lang, l); setPlaces(new Map()); loaded.current = null; };

  // ---------- what's shown ----------
  const from = me ?? center;
  const saved = useMemo(() => data.items.filter((i) => i.category === "place"), [data.items]);
  const savedIds = useMemo(() => new Set(saved.map((i) => String(i.config.pid))), [saved]);
  const visits = useMemo(() => data.logs.filter((l) => l.kind === "visit"), [data.logs]);
  const list = useMemo(() => {
    if (hits) return hits;
    if (view === "saved") return saved.map(placeFromItem);
    if (view === "visited") {
      const seen = new Map<string, Place>();
      for (const l of [...visits].reverse()) {
        const pid = String(l.data.pid ?? l.id);
        if (seen.has(pid)) continue;
        const it = saved.find((i) => i.config.pid === pid);
        seen.set(pid, it ? placeFromItem(it) : { id: pid, lat: Number(l.data.lat), lon: Number(l.data.lon), name: String(l.data.place ?? l.data.name), cat: String(l.data.cat ?? "sight"), kind: String(l.data.kind ?? "Place"), tags: {} });
      }
      return [...seen.values()].filter((p) => Number.isFinite(p.lat));
    }
    return [...places.values()].filter((p) => cats.includes(p.cat) || (p.id.startsWith("g:") && p.cat === "sight" && cats.length > 0));
  }, [hits, view, saved, visits, places, cats]);
  const sorted = useMemo(() => [...list].map((p) => ({ p, d: metres(from, p) })).sort((a, b) => a.d - b.d), [list, from]);

  // Pins: the nearest 400 to the middle of the map, so phones stay fast.
  useEffect(() => {
    const Lf = L.current, g = layer.current;
    if (!Lf || !g || !ready) return;
    g.clearLayers();
    const c = center;
    const pins = [...list].map((p) => ({ p, d: metres(c, p) })).sort((a, b) => a.d - b.d).slice(0, 400);
    for (const { p } of pins) {
      const cat = catOf(p.cat);
      const star = savedIds.has(p.id) ? '<span class="lo-star">★</span>' : "";
      const small = p.tags.historic === "wayside_shrine" || /^Small /.test(p.kind);
      const html = `<div class="lo-pin${small ? " lo-pin-s" : ""}" style="--c:${cat.color}"><span>${p.g && !p.tags.name ? "📍" : cat.icon}</span>${star}</div>`;
      const mk = Lf.marker([p.lat, p.lon], { icon: Lf.divIcon({ className: "", html, iconSize: small ? [26, 26] : [32, 32], iconAnchor: small ? [13, 26] : [16, 32] }), title: p.name, keyboard: false, riseOnHover: true });
      if (zoom >= 16) mk.bindTooltip(esc(p.name), { direction: "top", offset: [0, small ? -24 : -30], className: "lo-tip" });
      mk.on("click", () => setOpen(p));
      mk.addTo(g);
    }
  }, [list, ready, savedIds, zoom, center]);

  // A trip being recorded, or an old one you tapped, on the map.
  useEffect(() => {
    const Lf = L.current, g = routeLayer.current;
    if (!Lf || !g || !ready) return;
    g.clearLayers();
    const pts = showRoute ?? trip?.pts;
    if (!pts || pts.length < 2) return;
    const line = Lf.polyline(pts.map((p) => [p[0], p[1]] as [number, number]), { color: showRoute ? "#a855f7" : "#2563eb", weight: 5, opacity: 0.85 }).addTo(g);
    Lf.circleMarker([pts[0][0], pts[0][1]], { radius: 6, color: "#16a34a", fillOpacity: 1 }).addTo(g);
    if (showRoute) {
      Lf.circleMarker([pts[pts.length - 1][0], pts[pts.length - 1][1]], { radius: 6, color: "#dc2626", fillOpacity: 1 }).addTo(g);
      map.current?.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
  }, [trip?.pts, showRoute, ready]);

  // ---------- search ----------
  const search = async () => {
    const s = q.trim();
    if (!s) { setHits(null); return; }
    setSearching(true);
    const low = s.toLowerCase();
    const local = [...places.values()].filter((p) => `${p.name} ${p.en ?? ""} ${p.kind} ${p.tags["name:ja"] ?? ""}`.toLowerCase().includes(low));
    let more: Place[] = [];
    try {
      if (gOn && session) more = (await googleText(session, s, center, lang)).map(googlePlace);
      else more = (await searchPlaces(s, center, lang)).map((h, i) => ({ id: `s:${i}:${h.lat},${h.lon}`, lat: h.lat, lon: h.lon, name: h.name, cat: "sight", kind: h.what || "Place", tags: { name: h.name } }));
    } catch { /* offline: local matches only */ }
    const all = [...local, ...more.filter((m) => !local.some((l) => metres(l, m) < 60))];
    setHits(all);
    setSearching(false);
    if (all.length && map.current) {
      const near = [...all].sort((a, b) => metres(center, a) - metres(center, b))[0];
      if (metres(center, near) > 3000) map.current.setView([near.lat, near.lon], 16);
    }
  };
  const clearSearch = () => { setQ(""); setHits(null); };

  const fly = (p: Place) => map.current?.setView([p.lat, p.lon], Math.max(16, map.current.getZoom()));
  const tile = (icon: string, label: string, sub: string, go: () => void, on = false) => (
    <button onClick={go} className={`${BIG_TILE} relative !min-h-24 min-w-0 short:!min-h-0 short:!flex-row short:!py-2 ${on ? "ring-2 ring-[var(--accent2)]" : ""}`}>
      <span className="text-3xl leading-none short:text-xl">{icon}</span><span className="font-black text-sm leading-tight">{label}</span><span className="text-[10px] text-muted leading-tight break-words short:hidden">{sub}</span>
    </button>
  );
  const allOn = DEFAULT_CATS.every((c) => cats.includes(c));

  return (
    <div className="space-y-3 min-w-0">
      <div className="grid grid-cols-3 gap-2">
        {tile("📍", "Near me", me ? "Places around you" : "Show where I am", () => { setView("near"); clearSearch(); locate(); }, view === "near" && !hits)}
        {tile(trip ? "⏺️" : "🚶", trip ? "Trip on" : "Start trip", trip ? "Recording your route" : "Walk, bike or bus", () => document.getElementById("lo-trip")?.scrollIntoView({ behavior: "smooth", block: "center" }), !!trip)}
        {tile("⭐", "My places", `${saved.length} saved · ${new Set(visits.map((v) => v.data.pid)).size} visited`, () => { clearSearch(); setView(view === "saved" ? "near" : "saved"); }, view !== "near")}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex gap-2 min-w-0">
        <input className="input flex-1 min-w-0" enterKeyHint="search" placeholder="Search a place, e.g. Round1, 浅草寺, ramen" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setHits(null); }} />
        <button className="btn-primary !px-3 shrink-0" disabled={searching}>{searching ? "…" : "🔍"}</button>
        <button type="button" onClick={() => pickLang(lang === "en" ? "ja" : "en")} className="btn-ghost !px-2 shrink-0 text-xs" aria-label="Names language">{lang === "en" ? "EN" : "日本"}</button>
      </form>

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 w-max pb-1">
          <button onClick={() => pickCat("all")} className={`chip whitespace-nowrap ${allOn ? "chip-on" : ""}`}>✨ All fun</button>
          {CATS.map((c) => <button key={c.id} onClick={() => pickCat(c.id)} className={`chip whitespace-nowrap ${cats.includes(c.id) ? "chip-on" : ""}`}>{c.icon} {c.label}</button>)}
        </div>
      </div>

      <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-[var(--border)] h-[58dvh] min-h-[260px] max-h-[720px] landscape:h-[72dvh] landscape:max-h-none bg-[#dfe7ef]">
        <div ref={el} className="absolute inset-0" />
        <div className="absolute top-2 left-2 right-14 z-[500] flex flex-wrap gap-1 pointer-events-none">
          {loading && <span className="lo-badge">Loading places…</span>}
          {!loading && note && <span className="lo-badge">{note}</span>}
          {err && <button onClick={() => load(true)} className="lo-badge pointer-events-auto !bg-red-600 !text-white">{err} Tap to retry</button>}
          {geoErr && !me && <span className="lo-badge">{geoErr}</span>}
        </div>
        <div className="absolute right-2 top-2 z-[500] flex flex-col gap-1.5">
          <button onClick={() => map.current?.zoomIn()} className="lo-ctl" aria-label="Zoom in">＋</button>
          <button onClick={() => map.current?.zoomOut()} className="lo-ctl" aria-label="Zoom out">－</button>
          <button onClick={locate} className="lo-ctl" aria-label="Where am I">◎</button>
        </div>
        {showRoute && <button onClick={() => setShowRoute(null)} className="absolute bottom-7 left-1/2 -translate-x-1/2 z-[500] lo-badge !text-sm pointer-events-auto">✕ Hide trip route</button>}
      </div>

      <section className="space-y-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-bold flex-1 min-w-0 truncate">
            {hits ? `Results for “${q}”` : view === "saved" ? "⭐ Saved places" : view === "visited" ? "✅ Places I visited" : `Near ${me ? "you" : "the map centre"}`}
            <span className="text-muted text-xs font-normal"> · {sorted.length}</span>
          </h2>
          {hits ? <button onClick={clearSearch} className="chip shrink-0">✕ Clear</button> : (
            <div className="flex gap-1 shrink-0">
              {(["near", "saved", "visited"] as View[]).map((v) => <button key={v} onClick={() => setView(v)} className={`chip !px-2 text-xs ${view === v ? "chip-on" : ""}`}>{v === "near" ? "Near" : v === "saved" ? "Saved" : "Visited"}</button>)}
            </div>
          )}
        </div>
        {!sorted.length && <p className="card p-3 text-sm text-muted">{hits ? "Nothing found. Try another name or the Japanese name." : view === "saved" ? "Nothing saved yet. Tap a place, then ⭐ Save." : view === "visited" ? "No visits yet. Tap a place, then ✅ I'm here." : loading ? "Loading…" : cats.length ? "No places here yet. Move the map or zoom out." : "Pick a type above to see places."}</p>}
        <ul className="space-y-1.5">
          {sorted.slice(0, shown).map(({ p, d }) => <Row key={p.id} p={p} d={d} saved={savedIds.has(p.id)} onOpen={() => { setOpen(p); fly(p); }} />)}
        </ul>
        {sorted.length > shown && <button onClick={() => setShown(shown + 30)} className="btn-ghost w-full">Show more ({sorted.length - shown} left)</button>}
      </section>

      <TripCard />
      <TripHistory onShow={(pts) => { setShowRoute(pts); el.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />

      <p className="text-[10px] text-muted leading-snug">Map and places: © OpenStreetMap contributors. Stories and photos: Wikipedia and Wikimedia Commons.{gOn ? " Ratings and reviews: Google." : ""} Times are estimates.</p>

      {open && <PlaceSheet place={open} from={me} lang={lang} gOn={gOn} onClose={() => setOpen(null)} onUpdate={(p) => setPlaces((old) => (old.has(p.id) ? new Map(old).set(p.id, p) : old))} />}
    </div>
  );
}

function Row({ p, d, saved, onOpen }: { p: Place; d: number; saved: boolean; onOpen: () => void }) {
  const cat = catOf(p.cat);
  const o = openNow(p.tags.opening_hours);
  const t = travel(d);
  const open = o ?? (p.g?.open != null ? { open: p.g.open, text: p.g.open ? "Open now" : "Closed now" } : null);
  return (
    <li>
      <button onClick={onOpen} className="card w-full p-2.5 flex items-center gap-2.5 text-left min-w-0 active:scale-[0.99]">
        <span className="shrink-0 w-10 h-10 rounded-xl grid place-items-center text-xl" style={{ background: `${cat.color}33` }}>{cat.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{saved && "⭐ "}{p.name}</span>
          <span className="block text-xs text-muted truncate">{p.kind}{p.en ? ` · ${p.en}` : ""}</span>
          <span className="block text-xs truncate">
            {p.g?.rating ? <span className="text-amber-400">★ {p.g.rating.toFixed(1)} <span className="text-muted">({p.g.count ?? 0})</span> · </span> : null}
            {open ? <span className={open.open ? "text-green-400" : "text-red-400"}>{open.text}</span> : null}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs">
          <span className="block font-bold">{distText(d)}</span>
          <span className="block text-muted">🚶 {minText(t.walk)}</span>
        </span>
      </button>
    </li>
  );
}

// Google's places join the free ones: same place → ratings added; new place → its own pin.
function mergeGoogle(old: Map<string, Place>, gs: GSummary[]): Map<string, Place> {
  const next = new Map(old);
  const n = (s: string) => s.toLowerCase().replace(/[\s・·\-_'"()（）]/g, "");
  for (const g of gs) {
    if (g.lat == null || g.lon == null) continue;
    let best: Place | null = null;
    for (const p of next.values()) {
      if (p.id.startsWith("g:")) continue;
      const m = metres(p, { lat: g.lat, lon: g.lon });
      if (m > 120) continue;
      const a = n(p.tags.name ?? p.name), b = n(g.name);
      if (a && b && (a === b || a.includes(b) || b.includes(a))) { best = p; break; }
    }
    if (best) next.set(best.id, { ...best, g: { ...best.g, ...g } });
    else {
      const cat = CATS.find((c) => (c.google ?? []).includes(g.gtype ?? ""))?.id ?? "sight";
      next.set(`g:${g.id}`, { ...googlePlace(g), cat });
    }
  }
  return next;
}
