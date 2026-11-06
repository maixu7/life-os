"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlaceCard, placeFromItem } from "@/components/PlaceSheet";
import { TripCard, TripHistory } from "@/components/Trip";
import { goodFor, isCheap, pickNow, planOuting, taste, TAGS, weatherAt, type Pick, type Stop, type Vote, type Weather } from "@/lib/goodfor";
import {
  CATS, DEFAULT_CATS, catOf, distText, googleNearby, googleOn, googlePlace, googleText, loadPlaces, metres, minText, openNow, searchPlaces, travel,
  type Box, type GSummary, type Place, type Route,
} from "@/lib/places";
import { lengthOf, MODES, guessMode, useTrip, type Pt } from "@/lib/trip";
import { toDay, useApp } from "@/lib/store";

// The Places page: a full-screen map with you on it, places around you (down
// to small street shrines), search and filters on top, and a pull-up panel
// with the list, "What should I do now?", your trips and the place card.

type LL = { lat: number; lon: number };
const TOKYO: LL = { lat: 35.6812, lon: 139.7671 };
const LS = { cats: "lifeos-map-cats", lang: "lifeos-map-lang", last: "lifeos-map-last", style: "lifeos-map-style", open: "lifeos-map-opennow", cheap: "lifeos-map-cheap" };
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const inside = (a: Box, b: Box) => a.s >= b.s && a.n <= b.n && a.w >= b.w && a.e <= b.e;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
type View = "near" | "saved" | "visited" | "trips";
type Snap = "peek" | "half" | "full";

// Map looks: English labels (Esri), local names (OpenStreetMap), satellite.
export type MapStyle = "en" | "local" | "sat";
const STYLES: Record<MapStyle, { label: string; url: string; attr: string; max: number }> = {
  en: { label: "English", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", attr: "Tiles © Esri · Places © OpenStreetMap", max: 19 },
  local: { label: "日本語 (local)", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attr: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>', max: 19 },
  sat: { label: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Imagery © Esri · Places © OpenStreetMap", max: 19 },
};

export function PlacesMap() {
  const { data, session, profile, update } = useApp();
  const [toast, setToast] = useState("");
  const el = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const tiles = useRef<Leaflet.TileLayer | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const meLayer = useRef<Leaflet.LayerGroup | null>(null);
  const routeLayer = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [cats, setCats] = useState<string[]>(DEFAULT_CATS);
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [style, setStyle] = useState<MapStyle>("en");
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
  const [snap, setSnap] = useState<Snap>("peek");
  const [shown, setShown] = useState(30);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [gOn, setGOn] = useState(false);
  const [showRoute, setShowRoute] = useState<Pt[] | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [full, setFull] = useState(false);
  const [navH, setNavH] = useState(64);
  // Wide or short-and-wide screens (tablet, desktop, phone on its side): the panel sits on the left, like Google Maps.
  const [side, setSide] = useState(false);
  const [tall, setTall] = useState(true);
  useEffect(() => {
    const f = () => { setSide(innerWidth >= 900 || (innerWidth > innerHeight && innerHeight < 520)); setTall(innerHeight >= 760); };
    f(); addEventListener("resize", f);
    return () => removeEventListener("resize", f);
  }, []);
  const [menu, setMenu] = useState(false);
  const [picks, setPicks] = useState<{ list: Pick[]; why: string; weather: Weather | null; free: number } | null>(null);
  const [outing, setOuting] = useState<Stop[] | null>(null);
  const [wx, setWx] = useState<Weather | null>(null);
  const [picking, setPicking] = useState(false);
  const loaded = useRef<{ box: Box; key: string } | null>(null);
  const gLoaded = useRef<{ c: LL; key: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const follow = useRef(true);
  const trip = useTrip();

  // Remembered choices on this device.
  useEffect(() => {
    setCats(read(LS.cats, DEFAULT_CATS));
    setLang(read(LS.lang, "en"));
    setStyle(read<MapStyle>(LS.style, "en"));
    setOpenOnly(read(LS.open, false));
    setCheap(read(LS.cheap, false));
    googleOn().then(setGOn);
  }, []);

  // The page doesn't scroll: the map is the page. Keep clear of the menu bar.
  useEffect(() => {
    const body = document.body.style, html = document.documentElement.style;
    const ob = body.overflow, oh = html.overscrollBehavior;
    body.overflow = "hidden"; html.overscrollBehavior = "none";
    window.scrollTo(0, 0);
    const nav = document.querySelector("nav");
    const measure = () => setNavH(nav ? Math.round(nav.getBoundingClientRect().height) : 0);
    measure();
    const ro = nav ? new ResizeObserver(measure) : null;
    if (nav) ro!.observe(nav);
    addEventListener("resize", measure);
    return () => { body.overflow = ob; html.overscrollBehavior = oh; ro?.disconnect(); removeEventListener("resize", measure); };
  }, []);

  // ---------- the map ----------
  useEffect(() => {
    let dead = false;
    import("leaflet").then((mod) => {
      if (dead || !el.current || map.current) return;
      const Lf = (mod.default ?? mod) as typeof Leaflet;
      L.current = Lf;
      const last = read<LL & { z: number } | null>(LS.last, null);
      const m = Lf.map(el.current, { zoomControl: false, attributionControl: false, center: [last?.lat ?? TOKYO.lat, last?.lon ?? TOKYO.lon], zoom: last?.z ?? 15, maxZoom: 19, minZoom: 4, tapTolerance: 20 } as Leaflet.MapOptions);
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
      m.on("dragstart", () => { follow.current = false; setMenu(false); });
      map.current = m;
      moved();
      setReady(true);
      // The box changes size (rotate, full screen, keyboard): keep the map filling it.
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
  useEffect(() => {
    const Lf = L.current, m = map.current;
    if (!Lf || !m || !ready) return;
    tiles.current?.remove();
    const s = STYLES[style];
    tiles.current = Lf.tileLayer(s.url, { maxZoom: 19, maxNativeZoom: s.max, attribution: s.attr, referrerPolicy: "strict-origin-when-cross-origin" } as Leaflet.TileLayerOptions).addTo(m);
    tiles.current.bringToBack();
  }, [style, ready]);

  // ---------- where you are ----------
  useEffect(() => {
    if (!navigator.geolocation) { setGeoErr("This device has no location."); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setMe({ lat: p.coords.latitude, lon: p.coords.longitude }); setAcc(p.coords.accuracy); setGeoErr(""); },
      (e) => setGeoErr(e.code === 1 ? "off" : "Finding where you are…"),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  useEffect(() => {
    if (!ready || !me || !follow.current || !map.current) return;
    follow.current = false;
    map.current.setView([me.lat, me.lon], Math.max(map.current.getZoom(), 15));
  }, [ready, me]);
  const locate = () => {
    if (me && map.current) { follow.current = false; map.current.setView([me.lat, me.lon], Math.max(map.current.getZoom(), 16)); return; }
    follow.current = true;
    navigator.geolocation?.getCurrentPosition((p) => { setMe({ lat: p.coords.latitude, lon: p.coords.longitude }); setGeoErr(""); }, (e) => setGeoErr(e.code === 1 ? "off" : "Finding where you are…"));
  };
  useEffect(() => {
    const Lf = L.current, g = meLayer.current;
    if (!Lf || !g || !ready) return;
    g.clearLayers();
    if (!me) return;
    if (acc > 15 && acc < 2000) Lf.circle([me.lat, me.lon], { radius: acc, color: "#3b82f6", weight: 1, fillOpacity: 0.08, interactive: false }).addTo(g);
    Lf.marker([me.lat, me.lon], { icon: Lf.divIcon({ className: "", html: '<div class="lo-me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false, zIndexOffset: 1000 }).addTo(g);
  }, [me, acc, ready]);

  // Weather and sunset where you are (free, no key).
  const wxAt = me ?? (ready ? center : null);
  const wxKey = wxAt ? `${wxAt.lat.toFixed(1)},${wxAt.lon.toFixed(1)}` : "";
  useEffect(() => {
    if (!wxAt) return;
    let dead = false;
    weatherAt(wxAt.lat, wxAt.lon).then((w) => !dead && setWx(w));
    return () => { dead = true; };
  }, [wxKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- loading places for the area on screen ----------
  const load = useCallback(async (force = false) => {
    const m = map.current;
    if (!m) return;
    const z = m.getZoom();
    const use = cats.filter((c) => z >= (catOf(c).minZoom ?? (catOf(c).dense ? 15 : 12)));
    const skipped = cats.filter((c) => !use.includes(c)).map((c) => catOf(c).label.toLowerCase());
    if (z < 12) { setNote("Zoom in to see places."); return; }
    setNote(skipped.length ? `Zoom in closer to see ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}.` : "");
    if (!use.length) return;
    const b = m.getBounds().pad(0.3);
    const box: Box = { s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() };
    const key = `${[...use].sort().join(",")}|${lang}`;
    const v = m.getBounds();
    const view: Box = { s: v.getSouth(), w: v.getWest(), n: v.getNorth(), e: v.getEast() };
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

  const allOn = DEFAULT_CATS.every((c) => cats.includes(c));
  const pickCat = (id: string) => {
    const next = id === "all" ? (allOn && cats.length === DEFAULT_CATS.length ? [] : DEFAULT_CATS) : cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id];
    setCats(next); write(LS.cats, next); setShown(30);
  };
  const pickLang = (l: "en" | "ja") => { setLang(l); write(LS.lang, l); setPlaces(new Map()); loaded.current = null; };
  const pickStyle = (s: MapStyle) => { setStyle(s); write(LS.style, s); if (s === "local" && lang === "en") { /* names in the list stay English */ } };

  // ---------- what's shown ----------
  const from = me ?? center;
  const known = useMemo(() => data.items.filter((i) => i.category === "place"), [data.items]);
  const saved = useMemo(() => known.filter((i) => i.config.saved !== false), [known]);
  const savedIds = useMemo(() => new Set(saved.map((i) => String(i.config.pid))), [saved]);
  const visits = useMemo(() => data.logs.filter((l) => l.kind === "visit"), [data.logs]);
  const votes = useMemo<Vote[]>(() => known.filter((i) => i.config.vote === 1 || i.config.vote === -1).map((i) => ({ cat: String(i.config.cat), tags: (i.config.vtags as Vote["tags"]) ?? [], v: i.config.vote as 1 | -1 })), [known]);
  const like = useMemo(() => taste(votes), [votes]);
  const filtered = useCallback((ps: Place[]) => ps.filter((p) => (!openOnly || openNow(p.tags.opening_hours)?.open !== false && !(p.g?.open === false)) && (!cheap || isCheap(p))), [openOnly, cheap]);
  const list = useMemo(() => {
    if (hits) return hits;
    if (view === "saved") return saved.map(placeFromItem);
    if (view === "visited") {
      const seen = new Map<string, Place>();
      for (const l of [...visits].reverse()) {
        const pid = String(l.data.pid ?? l.id);
        if (seen.has(pid)) continue;
        const it = known.find((i) => i.config.pid === pid);
        seen.set(pid, it ? placeFromItem(it) : { id: pid, lat: Number(l.data.lat), lon: Number(l.data.lon), name: String(l.data.place ?? l.data.name), cat: String(l.data.cat ?? "sight"), kind: String(l.data.kind ?? "Place"), tags: {} });
      }
      return [...seen.values()].filter((p) => Number.isFinite(p.lat));
    }
    return filtered([...places.values()].filter((p) => cats.includes(p.cat) || (p.id.startsWith("g:") && p.cat === "sight" && cats.length > 0)));
  }, [hits, view, saved, known, visits, places, cats, filtered]);
  const sorted = useMemo(() => [...list].map((p) => ({ p, d: metres(from, p) })).sort((a, b) => a.d - b.d), [list, from]);
  const pickIds = useMemo(() => new Set(picks?.list.map((x) => x.p.id) ?? []), [picks]);

  // Pins: the nearest 400 to the middle of the map, so phones stay fast.
  useEffect(() => {
    const Lf = L.current, g = layer.current;
    if (!Lf || !g || !ready) return;
    g.clearLayers();
    const pins = [...(view === "trips" ? [] : list), ...(open && !list.some((p) => p.id === open.id) ? [open] : [])].map((p) => ({ p, d: metres(center, p) })).sort((a, b) => a.d - b.d).slice(0, 400);
    for (const { p } of pins) {
      const cat = catOf(p.cat);
      const star = savedIds.has(p.id) ? '<span class="lo-star">★</span>' : pickIds.has(p.id) ? '<span class="lo-star">✨</span>' : "";
      const small = p.tags.historic === "wayside_shrine" || /^Small /.test(p.kind);
      const on = open?.id === p.id;
      const html = `<div class="lo-pin${small && !on ? " lo-pin-s" : ""}${on ? " lo-pin-on" : ""}" style="--c:${cat.color}"><span>${p.g && !p.tags.name ? "📍" : cat.icon}</span>${star}</div>`;
      const sz = on ? 42 : small ? 26 : 32;
      const mk = Lf.marker([p.lat, p.lon], { icon: Lf.divIcon({ className: "", html, iconSize: [sz, sz], iconAnchor: [sz / 2, sz] }), title: p.name, keyboard: false, riseOnHover: true, zIndexOffset: on ? 900 : 0 });
      if (zoom >= 16 || on) mk.bindTooltip(esc(p.name), { direction: "top", offset: [0, -sz + 2], className: "lo-tip", permanent: on });
      mk.on("click", () => openPlace(p, false));
      mk.addTo(g);
    }
  }, [list, ready, savedIds, zoom, center, open, pickIds, view]);

  // Lines on the map: directions to a place, the trip being recorded, or an old trip.
  useEffect(() => {
    const Lf = L.current, g = routeLayer.current, m = map.current;
    if (!Lf || !g || !m || !ready) return;
    g.clearLayers();
    if (route) {
      Lf.polyline(route.pts, { color: "#1d4ed8", weight: 9, opacity: 0.35 }).addTo(g);
      const line = Lf.polyline(route.pts, { color: route.mode === "bike" ? "#16a34a" : "#2563eb", weight: 5, opacity: 0.95, dashArray: route.mode === "foot" ? "1 9" : undefined, lineCap: "round" }).addTo(g);
      m.fitBounds(line.getBounds(), { paddingTopLeft: [30, 130], paddingBottomRight: [30, Math.round(el.current!.clientHeight * 0.5)] });
      return;
    }
    const pts = showRoute ?? trip?.pts;
    if (!pts || pts.length < 2) return;
    const line = Lf.polyline(pts.map((p) => [p[0], p[1]] as [number, number]), { color: showRoute ? "#a855f7" : "#dc2626", weight: 5, opacity: 0.9 }).addTo(g);
    Lf.circleMarker([pts[0][0], pts[0][1]], { radius: 6, color: "#16a34a", fillOpacity: 1 }).addTo(g);
    if (showRoute) {
      Lf.circleMarker([pts[pts.length - 1][0], pts[pts.length - 1][1]], { radius: 6, color: "#dc2626", fillOpacity: 1 }).addTo(g);
      m.fitBounds(line.getBounds(), { paddingTopLeft: [30, 130], paddingBottomRight: [30, Math.round(el.current!.clientHeight * 0.5)] });
    }
  }, [trip?.pts, showRoute, route, ready]);

  // ---------- opening a place ----------
  const openPlace = (p: Place, fly = true) => {
    setRoute(null); setShowRoute(null); setMenu(false);
    setOpen(p);
    setSnap("half");
    const m = map.current;
    if (!m) return;
    // Put the pin in the visible part above the card.
    const z = fly ? Math.max(16, m.getZoom()) : m.getZoom();
    const pt = m.project([p.lat, p.lon], z).add([0, Math.round((el.current?.clientHeight ?? 600) * 0.22)]);
    m.setView(m.unproject(pt, z), z, { animate: true });
  };
  const closePlace = () => { setOpen(null); setRoute(null); setSnap("peek"); };

  // ---------- search ----------
  const search = async () => {
    const s = q.trim();
    if (!s) { setHits(null); return; }
    setSearching(true); setView("near"); setPicks(null);
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
    setSnap("half");
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (all.length === 1) openPlace(all[0]);
    else if (all.length && map.current) {
      const near = [...all].sort((a, b) => metres(center, a) - metres(center, b))[0];
      if (metres(center, near) > 3000) map.current.setView([near.lat, near.lon], 15);
    }
  };
  const clearSearch = () => { setQ(""); setHits(null); };

  // ---------- "What should I do now?" ----------
  const whatNow = async () => {
    setPicking(true); setOpen(null); setRoute(null); setHits(null); setView("near"); setSnap("half");
    try {
      const now = new Date();
      const [{ steps }, { phaseNow, sched, toMin }, { bought, allowanceOf, daysIn }] = await Promise.all([import("@/lib/mission"), import("@/lib/schedule"), import("@/lib/money")]);
      const sc = sched(profile.settings.schedule);
      const ph = phaseNow(sc, now);
      const mins = now.getHours() * 60 + now.getMinutes();
      // Free until your next fixed thing today (work, a meal, bedtime…).
      let free = 180, until = "";
      try {
        const next = steps(data, toDay(now), now).filter((s) => s.fixed && s.state !== "done" && s.state !== "skipped" && toMin(s.time) > mins + 10).sort((a, b) => toMin(a.time) - toMin(b.time))[0];
        if (next) { free = toMin(next.time) - mins; until = `${next.label} at ${next.time}`; }
      } catch { /* mission not ready */ }
      if (ph.phase === "work" || ph.phase === "break") { free = Math.min(free, ph.minsLeft ?? 30); until = until || ph.label; }
      if (ph.phase === "sleep" || ph.phase === "winddown") { free = Math.min(free, 45); until = "bedtime"; }
      free = Math.max(30, Math.min(free, 360));
      const month = toDay(now).slice(0, 7);
      const spent = bought(data).filter((s) => (s.purchased_at ?? "").startsWith(month)).reduce((n, s) => n + Number(s.price), 0);
      const allow = allowanceOf(data, month);
      const left = allow ? (allow - spent) / Math.max(1, daysIn(month) - now.getDate() + 1) : null;
      const w = await weatherAt(from.lat, from.lon);
      const pool = filtered([...places.values()].filter((p) => cats.includes(p.cat) || p.id.startsWith("g:")));
      const list = pickNow(pool, { from, freeMin: free, weather: w, budgetLeft: left, like, visited: new Set(visits.map((v) => String(v.data.pid))), now });
      const why = [`You have about ${minText(free)} free${until ? ` (next: ${until})` : ""}`, w ? `${w.temp}°C ${w.text.toLowerCase()}` : "", left != null ? `about ${Math.round(left).toLocaleString()} a day left to spend` : ""].filter(Boolean).join(" · ");
      setPicks({ list, why, weather: w, free });
      setOuting(null);
    } finally { setPicking(false); }
  };

  const planIt = () => {
    if (!picks) return;
    const now = new Date();
    const start = now.getHours() * 60 + now.getMinutes() + 10;
    const pool = filtered([...places.values()].filter((p) => cats.includes(p.cat) || p.id.startsWith("g:")));
    const stops = planOuting(pool, { from, startMin: start, freeMin: picks.free - 10, like, weather: picks.weather, visited: new Set(visits.map((v) => String(v.data.pid))) });
    setOuting(stops);
    if (stops.length) setRoute({ pts: [[from.lat, from.lon], ...stops.map((x) => [x.p.lat, x.p.lon] as [number, number]), [from.lat, from.lon]], m: 0, min: 0, mode: "foot" });
  };
  const addOuting = () => {
    if (!outing?.length) return;
    const hm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;
    const day = toDay(new Date());
    update((d) => ({
      ...d,
      items: [...d.items, ...outing.map((x, i) => ({ id: crypto.randomUUID(), category: "task", name: `Visit ${x.p.name}`, sort: Date.now() + i, config: { area: "other", time: hm(x.arrive), end: hm(x.leave), at: Date.now() + i, days: [0, 1, 2, 3, 4, 5, 6], date: day, level: "normal", note: `${x.p.kind}. ${Math.max(1, Math.round(x.walk))} min walk from the last stop. Tap ✅ I'm here on the map when you arrive.`, place: x.p.id } }))],
    }));
    setOuting(null); setRoute(null);
    setToast(`✓ ${outing.length} ${outing.length === 1 ? "stop" : "stops"} added to today's mission`);
    setTimeout(() => setToast(""), 3000);
  };

  // Android Back closes the card first.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePlace();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const top = full ? 0 : 0;
  const bottom = full ? 0 : navH;
  const tripKm = trip ? lengthOf(trip.pts) / 1000 : 0;
  const located = !!me;

  return (
    <div data-noedit="" className={`lo-map fixed inset-x-0 ${full ? "z-[32]" : "z-[20]"} bg-[#dfe7ef] overflow-hidden`} style={{ top, bottom }}>
      <div ref={el} className="absolute inset-0" />

      {/* Top: search, chips, status */}
      <div className="absolute right-0 top-0 z-[600] px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pointer-events-none space-y-2" style={{ left: side ? "min(400px, 46%)" : 0, right: side ? "3.5rem" : 0 }}>
        <form onSubmit={(e) => { e.preventDefault(); search(); }} className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#2b2c30] border border-white/10 shadow-lg pl-3 pr-1 py-1 min-w-0 max-w-2xl mx-auto">
          <span className="text-lg shrink-0">{searching ? "⏳" : "🔍"}</span>
          <input className="flex-1 min-w-0 bg-transparent outline-none text-[16px] py-1.5 placeholder:text-white/50" enterKeyHint="search" placeholder="Search places, e.g. ramen, shrine" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setHits(null); }} />
          {q && <button type="button" onClick={clearSearch} className="shrink-0 w-8 h-8 grid place-items-center text-white/70" aria-label="Clear search">✕</button>}
          <button type="button" onClick={() => setMenu(!menu)} className="shrink-0 w-9 h-9 rounded-full grid place-items-center bg-white/10" aria-label="Map options">⋮</button>
        </form>
        {menu && (
          <div className="pointer-events-auto max-w-2xl mx-auto rounded-2xl bg-[#2b2c30] border border-white/10 shadow-xl p-3 space-y-2 text-sm">
            <div className="text-xs text-white/60">Map look</div>
            <div className="flex flex-wrap gap-1.5">{(Object.keys(STYLES) as MapStyle[]).map((s) => <button key={s} onClick={() => pickStyle(s)} className={`chip ${style === s ? "chip-on" : ""}`}>{s === "en" ? "🔤 " : s === "sat" ? "🛰️ " : "🗾 "}{STYLES[s].label}</button>)}</div>
            <div className="text-xs text-white/60">Place names in the list</div>
            <div className="flex flex-wrap gap-1.5"><button onClick={() => pickLang("en")} className={`chip ${lang === "en" ? "chip-on" : ""}`}>English</button><button onClick={() => pickLang("ja")} className={`chip ${lang === "ja" ? "chip-on" : ""}`}>日本語</button></div>
            <button onClick={() => { setFull(!full); setMenu(false); }} className="btn-ghost w-full text-left">{full ? "↙️ Show the menu bar" : "⛶ Hide the menu bar (full screen)"}</button>
          </div>
        )}
        <div className="pointer-events-auto -mx-3 px-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 w-max pb-0.5">
            <button onClick={whatNow} className="lo-mchip lo-mchip-main">{picking ? "⏳ Thinking…" : "✨ What should I do now?"}</button>
            <button onClick={() => { setOpenOnly(!openOnly); write(LS.open, !openOnly); }} className={`lo-mchip ${openOnly ? "lo-mchip-on" : ""}`}>🟢 Open now</button>
            <button onClick={() => { setCheap(!cheap); write(LS.cheap, !cheap); }} className={`lo-mchip ${cheap ? "lo-mchip-on" : ""}`}>💸 Free / cheap</button>
            <button onClick={() => pickCat("all")} className={`lo-mchip ${allOn ? "lo-mchip-on" : ""}`}>✨ All fun</button>
            {CATS.map((c) => <button key={c.id} onClick={() => pickCat(c.id)} className={`lo-mchip ${cats.includes(c.id) ? "lo-mchip-on" : ""}`}>{c.icon} {c.label}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-2xl mx-auto">
          {wx && <span className="lo-badge">{wx.icon} {wx.temp}°C{wx.sunset ? ` · sunset ${wx.sunset}` : ""}{wx.rainLater && !wx.rain ? " · rain likely soon ☂️" : ""}</span>}
          {toast && <span className="lo-badge !bg-green-600 !text-white">{toast}</span>}
          {loading && <span className="lo-badge">Loading places…</span>}
          {!loading && note && <span className="lo-badge">{note}</span>}
          {err && <button onClick={() => load(true)} className="lo-badge pointer-events-auto !bg-red-600 !text-white">{err} Tap to retry</button>}
          {geoErr === "off" && !located && <button onClick={() => setMenu(false)} className="lo-badge pointer-events-auto !bg-amber-500 !text-black text-left">📍 Location is off. iPhone: Settings › Privacy &amp; Security › Location Services › Safari Websites › While Using. Android: tap 🔒 next to the address › Permissions › Location. Then reload.</button>}
        </div>
      </div>

      {/* Right: map buttons */}
      <div className={`absolute right-3 z-[600] flex-col gap-2 ${!side && !tall && snap !== "peek" ? "hidden" : "flex"}`} style={{ top: "calc(max(0.6rem, env(safe-area-inset-top)) + 7.2rem)" }}>
        <button onClick={() => pickStyle(style === "en" ? "sat" : style === "sat" ? "local" : "en")} className="lo-ctl text-base" aria-label="Map look">{style === "en" ? "🛰️" : style === "sat" ? "🗾" : "🔤"}</button>
        <button onClick={() => setFull(!full)} className="lo-ctl text-base" aria-label="Full screen">{full ? "↙️" : "⛶"}</button>
        <div className="hidden flex-col gap-2 [@media(pointer:fine)_and_(min-height:501px)]:flex">
          <button onClick={() => map.current?.zoomIn()} className="lo-ctl" aria-label="Zoom in">＋</button>
          <button onClick={() => map.current?.zoomOut()} className="lo-ctl" aria-label="Zoom out">－</button>
        </div>
      </div>

      {/* Bottom: a place card, or the list / trips panel */}
      {open ? (
        <Panel side={side} snap={snap} setSnap={setSnap} onLocate={locate} located={located} credit={style === "local" ? "© OpenStreetMap" : "© Esri · OpenStreetMap"}>
          <PlaceCard key={open.id} place={open} from={me} lang={lang} gOn={gOn} onClose={closePlace} like={like}
            onRoute={(r) => { setRoute(r); setSnap("half"); }} onUpdate={(p) => { setOpen(p); setPlaces((old) => (old.has(p.id) ? new Map(old).set(p.id, p) : old)); }} />
        </Panel>
      ) : (
        <Panel side={side} snap={snap} setSnap={setSnap} onLocate={locate} located={located} credit={style === "local" ? "© OpenStreetMap" : "© Esri · OpenStreetMap"}
          extra={trip ? (
            <button onClick={() => { setView("trips"); setSnap("half"); }} className="pointer-events-auto rounded-full bg-red-600 text-white text-xs font-bold px-3 py-2 shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />{MODES[trip.mode ?? guessMode(trip.pts)].icon} {tripKm < 1 ? `${Math.round(tripKm * 1000)} m` : `${tripKm.toFixed(2)} km`}
            </button>
          ) : (
            <button onClick={() => { setView("trips"); setSnap("half"); }} className="pointer-events-auto rounded-full bg-[#2b2c30] border border-white/10 text-sm font-bold px-3 py-2 shadow-lg">🚶 Start trip</button>
          )}>
          <div className="flex items-center gap-2 min-w-0 px-4 pb-2">
            <div className="flex-1 min-w-0 font-bold truncate">
              {hits ? `Results for “${q}”` : view === "trips" ? "🗺️ Trips" : view === "saved" ? "⭐ Saved" : view === "visited" ? "✅ Visited" : picks ? "✨ Picks for right now" : `${sorted.length} places ${located ? "near you" : "here"}`}
            </div>
            {hits ? <button onClick={clearSearch} className="chip shrink-0">✕ Clear</button> : null}
          </div>
          {!hits && (
            <div className="flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar">
              {(["near", "saved", "visited", "trips"] as View[]).map((v) => (
                <button key={v} onClick={() => { setView(v); setPicks(v === "near" ? picks : null); if (snap === "peek") setSnap("half"); }} className={`chip shrink-0 !px-3 text-xs ${view === v ? "chip-on" : ""}`}>
                  {v === "near" ? "📍 Nearby" : v === "saved" ? `⭐ Saved ${saved.length || ""}` : v === "visited" ? "✅ Visited" : "🚶 Trips"}
                </button>
              ))}
            </div>
          )}
          <div className="px-4 space-y-2 pb-6">
            {view === "trips" && !hits ? (<><TripCard /><TripHistory onShow={(pts) => { setShowRoute(pts); setSnap("peek"); }} /></>) : (
              <>
                {picks && view === "near" && !hits && (
                  <div className="card p-3 space-y-2 border border-[var(--accent2)]/50">
                    <div className="flex items-start gap-2"><p className="text-xs text-muted flex-1">{picks.why}</p><button onClick={() => setPicks(null)} className="text-muted px-1" aria-label="Close picks">✕</button></div>
                    {picks.list.length ? picks.list.map((x, i) => (
                      <button key={x.p.id} onClick={() => openPlace(x.p)} className="w-full text-left rounded-xl bg-white/5 p-2.5 flex gap-2.5 items-start min-w-0">
                        <span className="text-2xl shrink-0">{["🥇", "🥈", "🥉"][i]}</span>
                        <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{catOf(x.p.cat).icon} {x.p.name}</span><span className="block text-xs text-muted">{x.why.slice(0, 4).join(" · ")}</span></span>
                      </button>
                    )) : <p className="text-sm">Nothing fits your free time right now. Try zooming out, turning on more types, or turning off filters.</p>}
                    {picks.list.length > 0 && !outing && <button onClick={planIt} className="lo-pill w-full justify-center">📅 Plan an outing ({minText(picks.free)})</button>}
                    {outing && (
                      <div className="space-y-1.5">
                        <div className="text-sm font-bold">📅 Your outing</div>
                        {outing.length ? outing.map((x, i) => (
                          <button key={x.p.id} onClick={() => openPlace(x.p)} className="w-full text-left flex gap-2 items-start text-sm min-w-0">
                            <span className="shrink-0 w-12 text-xs font-mono text-[var(--accent2)] pt-0.5">{`${String(Math.floor(x.arrive / 60) % 24).padStart(2, "0")}:${String(Math.round(x.arrive) % 60).padStart(2, "0")}`}</span>
                            <span className="flex-1 min-w-0"><span className="block truncate">{i + 1}. {catOf(x.p.cat).icon} {x.p.name}</span><span className="block text-[11px] text-muted">🚶 {minText(x.walk)} there · ~{Math.round(x.leave - x.arrive)} min stay</span></span>
                          </button>
                        )) : <p className="text-sm">Couldn&apos;t fit a route into your free time. Zoom out or turn on more types.</p>}
                        {outing.length > 0 && <div className="grid grid-cols-2 gap-2"><button onClick={() => { setOuting(null); setRoute(null); }} className="lo-pill justify-center">✕ Cancel</button><button onClick={addOuting} className="lo-pill lo-pill-main justify-center">➕ Add to today</button></div>}
                      </div>
                    )}
                  </div>
                )}
                {!sorted.length && <p className="card p-3 text-sm text-muted">{hits ? "Nothing found. Try another name or the Japanese name." : view === "saved" ? "Nothing saved yet. Tap a place, then 🔖 Save." : view === "visited" ? "No visits yet. Tap a place, then ✅ I'm here." : loading ? "Loading…" : cats.length ? "No places here yet. Move the map, zoom out, or turn off filters." : "Pick a type above to see places."}</p>}
                <ul className="space-y-1.5">
                  {sorted.slice(0, shown).map(({ p, d }) => <Row key={p.id} p={p} d={d} saved={savedIds.has(p.id)} onOpen={() => openPlace(p)} />)}
                </ul>
                {sorted.length > shown && <button onClick={() => setShown(shown + 30)} className="btn-ghost w-full">Show more ({sorted.length - shown} left)</button>}
                <p className="text-[10px] text-muted leading-snug">Places: © OpenStreetMap contributors. Stories and photos: Wikipedia and Wikimedia Commons.{gOn ? " Ratings and reviews: Google." : ""} Times are estimates.</p>
              </>
            )}
          </div>
        </Panel>
      )}
      {showRoute && !open && <button onClick={() => setShowRoute(null)} className="absolute left-1/2 -translate-x-1/2 z-[650] lo-badge !text-sm" style={{ top: "calc(max(0.6rem, env(safe-area-inset-top)) + 7.4rem)" }}>✕ Hide trip route</button>}
    </div>
  );
}

// The pull-up panel: drag the handle (or tap it) between peek, half and full.
function Panel({ side, snap, setSnap, children, extra, onLocate, located, credit }: { side: boolean; snap: Snap; setSnap: (s: Snap) => void; children: React.ReactNode; extra?: React.ReactNode; onLocate: () => void; located: boolean; credit: string }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  const [h, setH] = useState<number | null>(null);
  const H = { peek: "7.5rem", half: "52%", full: "calc(100% - 4.4rem - env(safe-area-inset-top))" }[snap];
  const down = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, h: box.current?.getBoundingClientRect().height ?? 0, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 6) d.moved = true;
    const parent = box.current?.parentElement?.clientHeight ?? 800;
    if (d.moved) setH(Math.max(90, Math.min(parent - 60, d.h + dy)));
  };
  const up = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    if (!d.moved) { setSnap(snap === "peek" ? "half" : snap === "half" ? "full" : "peek"); setH(null); return; }
    const parent = box.current?.parentElement?.clientHeight ?? 800;
    const cur = h ?? d.h, r = cur / parent;
    setSnap(r < 0.3 ? "peek" : r < 0.72 ? "half" : "full");
    setH(null);
  };
  if (side) return (
    <div className="absolute left-0 top-0 bottom-0 z-[700] flex flex-col" style={{ width: "min(400px, 46%)" }}>
      <div className="flex-1 min-h-0 bg-[#1e1f22] border-r border-white/10 shadow-[6px_0_24px_rgba(0,0,0,.35)] flex flex-col pt-[max(0.6rem,env(safe-area-inset-top))]">
        <div className="shrink-0 px-3 pb-1 text-right text-[9px] text-white/40 truncate">{credit}</div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
      <div className="absolute -right-2 bottom-3 translate-x-full flex flex-col items-start gap-2">
        <button onClick={onLocate} className="lo-ctl" aria-label="Show where I am" style={located ? { color: "#2563eb" } : undefined}>◎</button>
        {extra}
      </div>
    </div>
  );
  return (
    <div ref={box} className={`absolute inset-x-0 bottom-0 z-[700] flex flex-col max-w-2xl mx-auto ${h == null ? "transition-[height] duration-200" : ""}`} style={{ height: h ?? H }}>
      <div className="absolute -top-14 inset-x-0 px-3 flex items-end justify-between pointer-events-none">
        <div>{extra}</div>
        <button onClick={onLocate} className="lo-ctl pointer-events-auto" aria-label="Show where I am" style={located ? { color: "#2563eb" } : undefined}>◎</button>
      </div>
      <div className="flex-1 min-h-0 rounded-t-3xl bg-[#1e1f22] border-t border-x border-white/10 shadow-[0_-6px_24px_rgba(0,0,0,.35)] flex flex-col">
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="shrink-0 pt-2 pb-2 cursor-grab touch-none" role="button" aria-label="Drag to resize">
          <div className="relative"><div className="mx-auto w-11 h-1.5 rounded-full bg-white/30" /><span className="absolute right-3 -top-1 text-[9px] text-white/40 max-w-[40%] truncate">{credit}</span></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

function Row({ p, d, saved, onOpen }: { p: Place; d: number; saved: boolean; onOpen: () => void }) {
  const cat = catOf(p.cat);
  const o = openNow(p.tags.opening_hours);
  const t = travel(d);
  const open = o ?? (p.g?.open != null ? { open: p.g.open, text: p.g.open ? "Open now" : "Closed now" } : null);
  const tags = goodFor(p).slice(0, 3);
  return (
    <li>
      <button onClick={onOpen} className="relative w-full rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] p-2.5 flex items-center gap-2.5 text-left min-w-0 active:scale-[0.99]">
        <span className="shrink-0 w-10 h-10 rounded-xl grid place-items-center text-xl" style={{ background: `${cat.color}33` }}>{cat.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{saved && "⭐ "}{p.name}</span>
          <span className="block text-xs text-muted truncate">{p.kind}{p.en ? ` · ${p.en}` : ""}</span>
          <span className="block text-xs truncate">
            {p.g?.rating ? <span className="text-amber-400">★ {p.g.rating.toFixed(1)} <span className="text-muted">({p.g.count ?? 0})</span> · </span> : null}
            {open ? <span className={open.open ? "text-green-400" : "text-red-400"}>{open.text}</span> : null}
          </span>
          {tags.length > 0 && <span className="block text-[11px] text-muted truncate">{tags.map((x) => TAGS[x]).join(" · ")}</span>}
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
