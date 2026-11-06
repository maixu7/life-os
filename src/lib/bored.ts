// "I'm bored": every fun place in Nagoya, built into the app (no map server).
// Hand-picked places come with the app; the full OpenStreetMap list and photos
// are baked by scripts/nagoya/bake.mjs into /public/nagoya and load from our own site.

import { goodFor, isFree, oneLine, stayOf, type Tag } from "@/lib/goodfor";
import { addressOf, kindOf, metres, openNow, priceOf, type Place } from "@/lib/places";

export type Spot = {
  id: string; en: string; ja: string; cat: string; kind: string;
  lat: number; lon: number; area?: string; addr?: string;
  price: string; free: boolean; stay: number; inside: boolean; night: boolean; trip: boolean;
  good: Tag[]; why: string; hours?: string; oh?: string; web?: string; tel?: string;
  photos: string[]; wiki?: string; pick: boolean; own?: boolean; note?: string;
};

export const BCATS: { id: string; icon: string; label: string }[] = [
  { id: "arcade", icon: "🎮", label: "Arcade" }, { id: "karaoke", icon: "🎤", label: "Karaoke" }, { id: "shrine", icon: "⛩️", label: "Shrine & temple" },
  { id: "sight", icon: "🏯", label: "Sights" }, { id: "park", icon: "🌳", label: "Park" }, { id: "shop", icon: "🛍️", label: "Shopping" },
  { id: "food", icon: "🍜", label: "Food" }, { id: "cafe", icon: "☕", label: "Café" }, { id: "bath", icon: "♨️", label: "Onsen" },
  { id: "museum", icon: "🏛️", label: "Museum" }, { id: "fun", icon: "🎳", label: "Fun & sports" }, { id: "cinema", icon: "🎬", label: "Cinema & shows" },
];
export const bcat = (id: string) => BCATS.find((c) => c.id === id) ?? BCATS[3];
export const NAGOYA_STATION = { lat: 35.17092, lon: 136.88153 };

export const photoUrl = (f: string, w = 480) => (/^(https?:|data:|blob:)/.test(f) ? f : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=${w}`);
export const photoPage = (f: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, "_"))}`;

type Pick0 = { en: string; ja: string; cat: string; kind: string; lat: number; lon: number; area: string; price: string; stay: number; inside: boolean; trip: boolean; free: boolean; night: boolean; good: string[]; why: string; hours: string };
type PickX = { i: number; lat: number; lon: number; osm?: string; addr?: string; oh?: string; web?: string; tel?: string; wj?: string; we?: string; ph: string[] };
type Row = { id: string; c: string; a: number; o: number; t: Record<string, string>; p?: string };

/** The hand-picked list: instant (it ships inside the app). */
export async function loadPicks(): Promise<Spot[]> {
  const list = (await import("@/data/nagoya-picks.json")).default as Pick0[];
  return list.map((p, i) => ({
    id: `pick:${i}`, en: p.en, ja: p.ja, cat: p.cat, kind: p.kind, lat: p.lat, lon: p.lon, area: p.area,
    price: p.price, free: p.free, stay: p.stay, inside: p.inside, night: p.night, trip: p.trip,
    good: p.good as Tag[], why: p.why, hours: p.hours, photos: [], pick: true,
  }));
}

async function getJson<T>(path: string): Promise<T | null> {
  try { const r = await fetch(path); return r.ok ? ((await r.json()) as T) : null; } catch { return null; }
}

/** Exact spots and photos for the picks, then every other fun place. */
export async function loadAll(picks: Spot[]): Promise<{ spots: Spot[]; at?: string }> {
  const [px, pl] = await Promise.all([getJson<{ rows: PickX[] }>("/nagoya/picks.json"), getJson<{ at: string; rows: Row[] }>("/nagoya/places.json")]);
  const used = new Set<string>();
  const out = picks.map((s) => ({ ...s }));
  for (const x of px?.rows ?? []) {
    const s = out[x.i]; if (!s) continue;
    Object.assign(s, { lat: x.lat, lon: x.lon, addr: x.addr ?? s.addr, oh: x.oh, web: x.web, tel: x.tel, wiki: x.we ?? x.wj, photos: x.ph ?? [] });
    if (x.osm) used.add(x.osm);
  }
  for (const r of pl?.rows ?? []) {
    if (used.has(r.id)) continue;
    out.push(fromRow(r));
  }
  return { spots: out, at: pl?.at };
}

function fromRow(r: Row): Spot {
  const t = r.t, lat = r.a / 1e5, lon = r.o / 1e5;
  const kind = kindOf(t);
  const ja = t.name ?? t["name:ja"] ?? "";
  const en = t["name:en"] ?? (t["name:ja-Latn"] || t["name:ja_rm"] || "") ?? "";
  const p: Place = { id: `osm:${r.id}`, lat, lon, name: en || ja || kind, cat: r.c, kind, tags: t };
  const inside = ["museum", "cinema", "arcade", "karaoke", "shop", "bath", "food", "cafe"].includes(r.c) || /^(bowling_alley|ice_rink|escape_game|trampoline_park|sauna|sports_centre)$/.test(t.leisure ?? "");
  const pr = priceOf(p);
  return {
    id: `osm:${r.id}`, en: en || ja || kind, ja, cat: r.c, kind, lat, lon, addr: addressOf(t) || undefined,
    price: pr === "Price unknown" ? (isFree(p) ? "Usually free" : "") : pr, free: isFree(p), stay: stayOf(p), inside,
    night: /-(2[2-4]|0\d):/.test(t.opening_hours ?? "") || t.opening_hours === "24/7", trip: false,
    good: goodFor(p), why: t["description:en"] ?? oneLine(p, t.cuisine ? `${kind} · ${t.cuisine.replace(/_/g, " ").replace(/;/g, ", ")}` : undefined),
    oh: t.opening_hours, web: t.website ?? t["contact:website"], tel: t.phone ?? t["contact:phone"],
    wiki: t.wikipedia ? `https://${t.wikipedia.split(":")[0]}.wikipedia.org/wiki/${encodeURIComponent(t.wikipedia.split(":").slice(1).join(":"))}` : undefined,
    photos: r.p ? [r.p] : [], pick: false,
  };
}

// ---------- getting there ----------
export type Station = [string, string, number, number];
let stations: Promise<Station[]> | null = null;
export const loadStations = () => (stations ??= getJson<Station[]>("/nagoya/stations.json").then((s) => s ?? []));
const at = (s: Station) => ({ lat: s[2] / 1e5, lon: s[3] / 1e5 });
export function nearestStation(st: Station[], p: { lat: number; lon: number }) {
  let best: Station | null = null, bd = Infinity;
  for (const s of st) { const d = metres(p, at(s)); if (d < bd) { bd = d; best = s; } }
  return best ? { s: best, m: bd } : null;
}
const fare = (km: number) => (km <= 3 ? 210 : km <= 7 ? 240 : km <= 11 ? 270 : km <= 15 ? 310 : km <= 25 ? 400 : 600);
export type Ways = { m: number; walk: number; bike: number; train: { min: number; yen: number; from: string; to: string } | null };
/** Rough door-to-door times: bike on roads, and train = walk + wait + ride + walk. */
export function ways(me: { lat: number; lon: number }, p: { lat: number; lon: number }, st: Station[], mine?: { s: Station; m: number } | null): Ways {
  const m = metres(me, p);
  const road = m * 1.3;
  const walk = road / 80; // 4.8 km/h
  const bike = road / 230 + 2; // ~14 km/h plus parking
  let train: Ways["train"] = null;
  if (st.length && m > 1500) {
    const a = mine ?? nearestStation(st, me), b = nearestStation(st, p);
    if (a && b && a.s[0] !== b.s[0]) {
      const ride = metres(at(a.s), at(b.s));
      const min = (a.m * 1.3) / 80 + 6 + (ride * 1.25) / 500 + (b.m * 1.3) / 80;
      if (min < walk) train = { min, yen: fare((ride * 1.25) / 1000), from: a.s[1] || a.s[0], to: b.s[1] || b.s[0] };
    }
  }
  return { m, walk, bike, train };
}
export const mins = (n: number) => (n < 60 ? `${Math.max(1, Math.round(n))} min` : `${Math.floor(n / 60)} h ${Math.round(n % 60)} min`);

export function isOpen(s: Spot, now = new Date()): boolean | null {
  const o = openNow(s.oh, now);
  if (o) return o.open;
  if (/^Always|^24 hours|^Free to walk/.test(s.hours ?? "")) return true;
  if (s.cat === "park" || (s.cat === "shrine" && !s.hours) || s.kind === "Viewpoint") return true;
  return null;
}
export const openText = (s: Spot) => openNow(s.oh)?.text ?? s.hours;

export const googleSearch = (s: Spot) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.ja || s.en} ${s.addr ?? (s.area ? `${s.area} 名古屋` : "名古屋")}`)}`;
export const googleGo = (s: Spot, mode: "bicycling" | "transit" | "walking") => `https://www.google.com/maps/dir/?api=1&destination=${s.lat}%2C${s.lon}&travelmode=${mode}`;

/** Copy text, also on old phones. */
export async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}
