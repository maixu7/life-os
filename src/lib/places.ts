// Places near you, from free OpenStreetMap data (Overpass), with Wikipedia /
// Wikidata / Wikimedia Commons for the story and photos. Google Places adds
// ratings, reviews and photos when the server has a GOOGLE_PLACES_KEY.

export type Cat = {
  id: string; icon: string; label: string; color: string;
  q: string[]; // Overpass tag filters
  dense?: boolean; // many of them in a city: only load when zoomed in
  minZoom?: number; // very many (vending machines): only when zoomed right in
  useful?: boolean; // not a place to visit: a handy layer (toilets, ATMs…)
  google?: string[]; // Google Places types for the same chip
};

export const CATS: Cat[] = [
  { id: "shrine", icon: "⛩️", label: "Shrines & temples", color: "#e11d48", q: ['["amenity"="place_of_worship"]', '["historic"="wayside_shrine"]', '["historic"="wayside_cross"]', '["building"~"^(shrine|temple)$"]["name"]'], google: ["hindu_temple", "place_of_worship", "buddhist_temple", "shinto_shrine"] },
  { id: "sight", icon: "📸", label: "Sights", color: "#f59e0b", q: ['["tourism"~"^(attraction|viewpoint|artwork)$"]', '["historic"~"^(castle|monument|memorial|ruins|archaeological_site|building|tomb|city_gate)$"]["name"]'], google: ["tourist_attraction", "historical_landmark", "monument", "observation_deck"] },
  { id: "park", icon: "🌳", label: "Parks & gardens", color: "#16a34a", q: ['["leisure"~"^(park|garden|nature_reserve)$"]["name"]'], google: ["park", "garden", "national_park"] },
  { id: "museum", icon: "🏛️", label: "Museums", color: "#7c3aed", q: ['["tourism"~"^(museum|gallery|aquarium|zoo)$"]', '["amenity"~"^(planetarium|arts_centre)$"]'], google: ["museum", "art_gallery", "aquarium", "zoo", "planetarium"] },
  { id: "arcade", icon: "🎮", label: "Arcades", color: "#2563eb", q: ['["leisure"~"^(amusement_arcade|adult_gaming_centre)$"]', '["amenity"="gambling"]["name"]'], google: ["amusement_center", "video_arcade"] },
  { id: "karaoke", icon: "🎤", label: "Karaoke", color: "#db2777", q: ['["amenity"="karaoke_box"]', '["leisure"="karaoke"]'], google: ["karaoke"] },
  { id: "cinema", icon: "🎬", label: "Cinema & shows", color: "#0891b2", q: ['["amenity"~"^(cinema|theatre|events_venue|concert_hall)$"]'], google: ["movie_theater", "performing_arts_theater", "concert_hall"] },
  { id: "fun", icon: "🎳", label: "Fun & sports", color: "#ea580c", q: ['["tourism"="theme_park"]', '["leisure"~"^(bowling_alley|escape_game|miniature_golf|water_park|ice_rink|trampoline_park|sports_centre|fitness_centre|stadium)$"]["name"]', '["sport"="climbing"]["name"]'], google: ["amusement_park", "bowling_alley", "water_park", "sports_complex", "gym"] },
  { id: "bath", icon: "♨️", label: "Onsen & sento", color: "#be123c", q: ['["amenity"="public_bath"]', '["leisure"="sauna"]', '["natural"="hot_spring"]'], google: ["spa", "sauna", "public_bath"] },
  { id: "food", icon: "🍜", label: "Food", color: "#dc2626", dense: true, q: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'], google: ["restaurant"] },
  { id: "cafe", icon: "☕", label: "Cafés", color: "#92400e", dense: true, q: ['["amenity"~"^(cafe|ice_cream)$"]', '["shop"="pastry"]'], google: ["cafe"] },
  { id: "shop", icon: "🛍️", label: "Shopping", color: "#9333ea", dense: true, q: ['["shop"~"^(mall|department_store|anime|books|games|video_games|toys|electronics|second_hand|gift|variety_store|music|camera|hobby|model)$"]'], google: ["shopping_mall", "department_store", "book_store", "electronics_store"] },
  { id: "konbini", icon: "🏪", label: "Konbini", color: "#0d9488", dense: true, useful: true, q: ['["shop"~"^(convenience|supermarket)$"]'], google: ["convenience_store", "supermarket"] },
  { id: "station", icon: "🚉", label: "Stations", color: "#475569", useful: true, q: ['["railway"~"^(station|halt)$"]', '["public_transport"="station"]["name"]'], google: ["train_station", "subway_station"] },
  { id: "toilet", icon: "🚻", label: "Toilets", color: "#64748b", dense: true, useful: true, q: ['["amenity"="toilets"]'], google: [] },
  { id: "atm", icon: "🏧", label: "ATMs", color: "#15803d", dense: true, useful: true, q: ['["amenity"="atm"]', '["amenity"="bank"]["atm"="yes"]'], google: ["atm"] },
  { id: "locker", icon: "🧳", label: "Coin lockers", color: "#a16207", dense: true, useful: true, q: ['["amenity"~"^(luggage_locker|locker)$"]', '["vending"="lockers"]'], google: [] },
  { id: "water", icon: "🚰", label: "Drinking water", color: "#0284c7", dense: true, useful: true, q: ['["amenity"="drinking_water"]'], google: [] },
  { id: "vending", icon: "🥤", label: "Vending machines", color: "#ef4444", minZoom: 17, useful: true, q: ['["amenity"="vending_machine"]["vending"~"drinks|food|ice_cream|coffee"]'], google: [] },
];
export const DEFAULT_CATS = ["shrine", "sight", "park", "museum", "arcade", "karaoke", "cinema", "fun", "bath"];
export const catOf = (id: string) => CATS.find((c) => c.id === id) ?? CATS[1];

export type Place = {
  id: string; // "osm:n123" or "g:<google id>"
  lat: number; lon: number;
  name: string; // local name, or a description if it has none
  en?: string; // English name if different
  cat: string; kind: string;
  tags: Record<string, string>;
  g?: GSummary; // what Google says, when on
};
export type Box = { s: number; w: number; n: number; e: number };

// ---------- what kind of place ----------
const RELIGION: Record<string, string> = { shinto: "Shinto shrine", buddhist: "Buddhist temple", christian: "Church", muslim: "Mosque", hindu: "Hindu temple", jewish: "Synagogue", sikh: "Gurdwara" };
const KIND: Record<string, string> = {
  amusement_arcade: "Game arcade", adult_gaming_centre: "Pachinko / gaming hall", gambling: "Pachinko / gaming hall", karaoke_box: "Karaoke", karaoke: "Karaoke",
  cinema: "Cinema", theatre: "Theatre", events_venue: "Event venue", concert_hall: "Concert hall", park: "Park", garden: "Garden", nature_reserve: "Nature reserve",
  museum: "Museum", gallery: "Art gallery", aquarium: "Aquarium", zoo: "Zoo", planetarium: "Planetarium", arts_centre: "Arts centre",
  attraction: "Attraction", viewpoint: "Viewpoint", artwork: "Artwork / statue", castle: "Castle", monument: "Monument", memorial: "Memorial", ruins: "Ruins",
  archaeological_site: "Historic site", tomb: "Tomb", city_gate: "Old gate", building: "Historic building", theme_park: "Theme park", bowling_alley: "Bowling",
  escape_game: "Escape room", miniature_golf: "Mini golf", water_park: "Water park", ice_rink: "Ice rink", trampoline_park: "Trampoline park",
  sports_centre: "Sports centre", fitness_centre: "Gym", stadium: "Stadium", public_bath: "Public bath", sauna: "Sauna", hot_spring: "Hot spring",
  restaurant: "Restaurant", fast_food: "Fast food", food_court: "Food court", cafe: "Café", ice_cream: "Ice cream", pastry: "Bakery / sweets",
  mall: "Shopping mall", department_store: "Department store", anime: "Anime / manga shop", books: "Bookshop", games: "Game shop", video_games: "Video game shop",
  toys: "Toy shop", electronics: "Electronics", second_hand: "Second-hand shop", gift: "Gift shop", variety_store: "¥100 / variety shop", music: "Music shop",
  camera: "Camera shop", hobby: "Hobby shop", model: "Model shop", convenience: "Convenience store", supermarket: "Supermarket",
  station: "Station", halt: "Station", toilets: "Public toilet", atm: "ATM", bank: "Bank (ATM)", luggage_locker: "Coin lockers", locker: "Coin lockers", drinking_water: "Drinking water", vending_machine: "Vending machine", wayside_cross: "Wayside cross", climbing: "Climbing gym",
};
export function kindOf(t: Record<string, string>): string {
  if (t.historic === "wayside_shrine") {
    const s = `${t.name ?? ""} ${t.subject ?? ""} ${t["subject:wikidata"] ?? ""}`;
    if (/地蔵|jizo|jizō/i.test(s)) return "Jizō statue (street shrine)";
    if (/稲荷|inari/i.test(s)) return "Small Inari shrine";
    return t.religion === "buddhist" ? "Small Buddhist shrine" : "Small street shrine";
  }
  if (t.amenity === "place_of_worship" || t.building === "shrine" || t.building === "temple") {
    const k = RELIGION[t.religion ?? ""] ?? (t.building === "temple" ? "Temple" : t.building === "shrine" ? "Shrine" : "Place of worship");
    return /祠|小祠/.test(t.name ?? "") ? `Small ${k.toLowerCase()}` : k;
  }
  for (const key of ["tourism", "historic", "leisure", "amenity", "shop", "natural", "railway", "sport"]) {
    const v = t[key];
    if (v && KIND[v]) return KIND[v];
  }
  if (t.public_transport === "station") return "Station";
  return "Place";
}
function catFor(t: Record<string, string>): string {
  if (t.amenity === "place_of_worship" || t.historic === "wayside_shrine" || t.historic === "wayside_cross" || t.building === "shrine" || t.building === "temple") return "shrine";
  for (const c of CATS) {
    for (const q of c.q) {
      const parts = [...q.matchAll(/\["([^"]+)"(?:(=|~)"([^"]+)")?\]/g)];
      if (parts.every(([, k, op, v]) => (op === "=" ? t[k] === v : op === "~" ? new RegExp(v).test(t[k] ?? "") : k in t))) return c.id;
    }
  }
  return "sight";
}

// ---------- loading from OpenStreetMap ----------
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
export const overpassQuery = (cats: string[], b: Box, limit = 600) => {
  const bb = `(${b.s.toFixed(5)},${b.w.toFixed(5)},${b.n.toFixed(5)},${b.e.toFixed(5)})`;
  const lines = cats.flatMap((id) => catOf(id).q.map((q) => `nwr${q}${bb};`));
  return `[out:json][timeout:25];(${lines.join("")});out center tags ${limit};`;
};
type OsmEl = { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export function parseOsm(els: OsmEl[], lang: "en" | "ja" = "en"): Place[] {
  const out: Place[] = [];
  for (const e of els) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (lat == null || lon == null) continue;
    const kind = kindOf(t);
    const local = t.name ?? t["name:ja"] ?? "";
    const en = t["name:en"] ?? (t["name:ja-Latn"] || undefined);
    // Unnamed things only count when they are small shrines / statues people want to find.
    if (!local && !en && !(t.historic === "wayside_shrine" || t.amenity === "place_of_worship" || /^(toilets|atm|luggage_locker|locker|drinking_water|vending_machine)$/.test(t.amenity ?? "") || t.tourism === "viewpoint" || t.tourism === "artwork")) continue;
    const name = (lang === "en" ? en || local : local || en) || kind;
    out.push({ id: `osm:${e.type[0]}${e.id}`, lat, lon, name, en: en && en !== name ? en : local && local !== name ? local : undefined, cat: catFor(t), kind, tags: t });
  }
  return out;
}

export async function loadPlaces(cats: string[], b: Box, lang: "en" | "ja", signal?: AbortSignal): Promise<Place[]> {
  if (!cats.length) return [];
  const body = `data=${encodeURIComponent(overpassQuery(cats, b))}`;
  const ask = async (url: string) => {
    const r = await fetch(url, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: anySignal(signal, 25_000), referrerPolicy: "origin" });
    if (!r.ok) throw new Error(`map data server ${r.status}`);
    const j = await r.json();
    return parseOsm(j.elements ?? [], lang);
  };
  // Two free servers at once (the first answer wins), then the others.
  const start = Math.floor(Date.now() / 60000) % 2;
  const order = [...OVERPASS.slice(start), ...OVERPASS.slice(0, start)];
  try {
    const got = await Promise.any(order.slice(0, 2).map(ask));
    remember(cats, b, lang, got);
    return got;
  } catch {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
  }
  for (const url of order.slice(2)) {
    try { const got = await ask(url); remember(cats, b, lang, got); return got; } catch { if (signal?.aborted) throw new DOMException("aborted", "AbortError"); }
  }
  // Offline or every server busy: what was seen here before.
  const old = recall(cats, b, lang);
  if (old.length) return old;
  throw new Error(typeof navigator !== "undefined" && !navigator.onLine ? "You're offline. Places seen before still show." : "Map data is busy. Try again in a minute.");
}
// The last few areas you looked at, kept on this phone for offline use.
const CACHE = "lifeos-map-cache";
type Saved = { b: Box; cats: string[]; lang: string; at: number; ps: Place[] };
function remember(cats: string[], b: Box, lang: string, ps: Place[]) {
  try {
    const all: Saved[] = JSON.parse(localStorage.getItem(CACHE) ?? "[]");
    const slim = ps.slice(0, 500).map((p) => ({ ...p, g: undefined }));
    const next = [{ b, cats, lang, at: Date.now(), ps: slim }, ...all].slice(0, 4);
    localStorage.setItem(CACHE, JSON.stringify(next));
  } catch { /* full or private: skip */ }
}
function recall(cats: string[], b: Box, lang: string): Place[] {
  try {
    const all: Saved[] = JSON.parse(localStorage.getItem(CACHE) ?? "[]");
    const out = new Map<string, Place>();
    for (const a of all) {
      if (a.lang !== lang || a.b.s > b.n || a.b.n < b.s || a.b.w > b.e || a.b.e < b.w) continue;
      for (const p of a.ps) if (cats.includes(p.cat)) out.set(p.id, p);
    }
    return [...out.values()];
  } catch { return []; }
}
function anySignal(s: AbortSignal | undefined, ms: number) {
  const t = AbortSignal.timeout(ms);
  return s && "any" in AbortSignal ? (AbortSignal as unknown as { any: (a: AbortSignal[]) => AbortSignal }).any([s, t]) : s ?? t;
}

// ---------- distance and time ----------
export function metres(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
export const distText = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
export const minText = (min: number) => (min < 60 ? `${Math.max(1, Math.round(min))} min` : `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`);
// Streets aren't straight: about 1.3× the straight line.
export function travel(m: number) {
  const road = m * 1.3;
  return {
    walk: (road / 1000 / 4.8) * 60,
    bike: (road / 1000 / 14) * 60,
    transit: road < 1500 ? null : (road / 1000 / 22) * 60 + 10, // bus/train incl. waiting
  };
}

// ---------- opening hours ----------
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };
type Rule = { days: Set<number>; spans: [number, number][]; off: boolean };
function parseRules(oh: string): Rule[] | null {
  const s = oh.trim();
  if (s === "24/7") return [{ days: new Set([0, 1, 2, 3, 4, 5, 6]), spans: [[0, 1440]], off: false }];
  const rules: Rule[] = [];
  for (const raw of s.split(";").map((x) => x.trim()).filter(Boolean)) {
    const m = /^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su|PH|SH)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\[[^\]]*\])?\s*,?\s*)+)?\s*(.*)$/.exec(raw);
    if (!m) return null;
    const daysPart = (m[1] ?? "").trim();
    let rest = m[2].trim().replace(/"[^"]*"/g, "").trim();
    const days = new Set<number>();
    if (!daysPart) [0, 1, 2, 3, 4, 5, 6].forEach((d) => days.add(d));
    else {
      for (const d of daysPart.split(",").map((x) => x.trim().replace(/\[.*\]/, "")).filter(Boolean)) {
        if (d === "PH" || d === "SH") continue;
        const [a, b] = d.split("-");
        const i = DAYS.indexOf(a), j = b ? DAYS.indexOf(b) : i;
        if (i < 0 || j < 0) return null;
        for (let k = i; ; k = (k + 1) % 7) { days.add(k); if (k === j) break; }
      }
      if (!days.size) continue; // holidays only
    }
    if (/^(off|closed)$/i.test(rest)) { rules.push({ days, spans: [], off: true }); continue; }
    if (!rest) return null;
    rest = rest.replace(/\+$/, "");
    const spans: [number, number][] = [];
    for (const r of rest.split(",").map((x) => x.trim())) {
      const t = /^(\d{1,2}:\d\d)\s*-\s*(\d{1,2}:\d\d)\+?$/.exec(r);
      if (!t) return null;
      const a = toMin(t[1]);
      let b = toMin(t[2]);
      if (b <= a) b += 1440; // past midnight
      spans.push([a, b]);
    }
    rules.push({ days, spans, off: false });
  }
  return rules.length ? rules : null;
}
const fmtMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** Open now? null when the hours can't be read. */
export function openNow(oh: string | undefined, now = new Date()): { open: boolean; text: string } | null {
  if (!oh) return null;
  const rules = parseRules(oh);
  if (!rules) return null;
  const dayRule = (d: number) => { let r: Rule | undefined; for (const x of rules) if (x.days.has(d)) r = x; return r; };
  const d = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  const today = dayRule(d), yest = dayRule((d + 6) % 7);
  for (const [, b] of yest?.off ? [] : yest?.spans ?? []) if (b > 1440 && mins < b - 1440) return { open: true, text: `Open now · until ${fmtMin(b)}` };
  for (const [a, b] of today?.off ? [] : today?.spans ?? []) {
    if (a === 0 && b === 1440) return { open: true, text: "Open 24 hours" };
    if (mins >= a && mins < b) return { open: true, text: `Open now · until ${fmtMin(b)}` };
  }
  const next = (today?.off ? [] : today?.spans ?? []).find(([a]) => a > mins);
  return { open: false, text: next ? `Closed · opens ${fmtMin(next[0])}` : "Closed now" };
}
/** The week's hours as readable lines (Mon … Sun). */
export function weekHours(oh: string | undefined): string[] | null {
  if (!oh) return null;
  const rules = parseRules(oh);
  if (!rules) return null;
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    let r: Rule | undefined; for (const x of rules) if (x.days.has(d)) r = x;
    const t = !r || r.off ? "Closed" : r.spans.map(([a, b]) => (a === 0 && b === 1440 ? "24 hours" : `${fmtMin(a)}–${fmtMin(b)}`)).join(", ");
    return `${names[d]}  ${t}`;
  });
}

// ---------- details from the tags ----------
export function addressOf(t: Record<string, string>) {
  if (t["addr:full"]) return t["addr:full"];
  const parts = [t["addr:province"], t["addr:city"], t["addr:suburb"] ?? t["addr:quarter"], t["addr:neighbourhood"], t["addr:block_number"] ?? t["addr:street"], t["addr:housenumber"]].filter(Boolean);
  return parts.length ? parts.join(" ") : t["addr:postcode"] ? `〒${t["addr:postcode"]}` : "";
}
export function priceOf(p: Place, cur = "¥"): string {
  const t = p.tags;
  const charge = t.charge ?? t.fee_amount ?? t["charge:adult"] ?? t.price;
  if (charge) return `Entry: ${charge.replace(/\s*(JPY|yen)\b/i, "").replace(/^(\d)/, `${cur}$1`)}`;
  if (t.fee === "no") return "Free entry";
  if (t.fee === "yes") return "Has an entry fee (amount not listed)";
  if (p.g?.price) return p.g.price;
  if (p.cat === "shrine") return "Usually free to visit (some halls or gardens charge)";
  if (p.cat === "park" && t.leisure === "park") return "Usually free";
  return "Price unknown";
}
const YES: Record<string, string> = { yes: "Yes", no: "No", limited: "Limited", designated: "Yes" };
export function factsOf(t: Record<string, string>): [string, string][] {
  const out: [string, string][] = [];
  const add = (k: string, v?: string) => v && out.push([k, v]);
  add("Religion", t.religion && `${t.religion[0].toUpperCase()}${t.religion.slice(1)}${t.denomination ? ` (${t.denomination.replace(/_/g, " ")})` : ""}`);
  add("Dedicated to", t.subject ?? t["subject:en"]);
  add("Cuisine", t.cuisine?.replace(/_/g, " ").replace(/;/g, ", "));
  add("Brand", t.brand ?? t.operator);
  add("Built / opened", t.start_date ?? t.opening_date);
  add("Heritage", t.heritage ? "Protected heritage site" : undefined);
  add("Wheelchair", t.wheelchair && (YES[t.wheelchair] ?? t.wheelchair));
  add("Wi-Fi", t.internet_access && (t.internet_access === "no" ? "No" : "Yes"));
  add("Smoking", t.smoking && t.smoking.replace(/_/g, " "));
  add("Toilets", t.toilets && (YES[t.toilets] ?? t.toilets));
  add("Takeaway", t.takeaway && (YES[t.takeaway] ?? t.takeaway));
  add("Vegetarian", t["diet:vegetarian"] && (YES[t["diet:vegetarian"]] ?? t["diet:vegetarian"]));
  const pay = Object.entries(t).filter(([k, v]) => k.startsWith("payment:") && v === "yes").map(([k]) => k.slice(8).replace(/_/g, " "));
  add("Pay with", pay.length ? pay.join(", ") : undefined);
  add("Floor", t.level ?? t["addr:floor"]);
  add("Seats", t.capacity);
  return out;
}
export const websiteOf = (t: Record<string, string>) => t.website ?? t["contact:website"] ?? t.url;
export const phoneOf = (t: Record<string, string>) => t.phone ?? t["contact:phone"];
export const directionsUrl = (p: { lat: number; lon: number; name: string }, mode: "walking" | "transit" | "bicycling" = "walking") =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=${mode}`;
export const googleSearchUrl = (p: { lat: number; lon: number }) => `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lon}`;

// ---------- the story (Wikipedia / Wikidata) and photos (Commons) ----------
export type Story = { title: string; text: string; url: string; image?: string; lang: string; description?: string };
const wjson = async (url: string) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(12_000), referrerPolicy: "origin" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};
async function summary(lang: string, title: string): Promise<Story | null> {
  const j = await wjson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`).catch(() => null);
  if (!j?.extract || j.type === "disambiguation") return null;
  return { title: j.title, text: j.extract, url: j.content_urls?.mobile?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`, image: j.thumbnail?.source, lang, description: j.description };
}
const norm = (s: string) => s.toLowerCase().replace(/[\s・·\-_'"()（）「」]/g, "");
/** Why it's known: its Wikipedia article in your language (or the other one). */
export async function storyOf(p: Place, lang: "en" | "ja"): Promise<Story | null> {
  const t = p.tags;
  const other = lang === "en" ? "ja" : "en";
  const links: Record<string, string> = {};
  if (t.wikipedia) { const m = /^([a-z-]+):(.+)$/.exec(t.wikipedia); if (m) links[m[1]] = m[2]; }
  for (const l of ["en", "ja"]) if (t[`wikipedia:${l}`]) links[l] = t[`wikipedia:${l}`];
  const qid = t.wikidata ?? t["subject:wikidata"] ?? t["brand:wikidata"];
  if (qid && !(links[lang])) {
    const j = await wjson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=enwiki|jawiki&format=json&origin=*`).catch(() => null);
    const sl = j?.entities?.[qid]?.sitelinks ?? {};
    if (sl.enwiki && !links.en) links.en = sl.enwiki.title;
    if (sl.jawiki && !links.ja) links.ja = sl.jawiki.title;
  }
  for (const l of [lang, other]) if (links[l]) { const s = await summary(l, links[l]); if (s) return s; }
  // No link: look for an article about something with this name right here.
  const names = [t.name, t["name:ja"], t["name:en"], p.en].filter(Boolean).map((x) => norm(String(x)));
  if (!names.length || /^(small|jizō|place)/i.test(p.name) && !t.name) return null;
  for (const l of ["ja", "en"]) {
    const j = await wjson(`https://${l}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${p.lat}|${p.lon}&gsradius=${p.cat === "park" ? 800 : 400}&gslimit=20&format=json&origin=*`).catch(() => null);
    const hit = (j?.query?.geosearch ?? []).find((g: { title: string }) => { const n = norm(g.title.replace(/\s*\(.*\)$/, "")); return names.some((x) => x.length >= 2 && (n === x || (x.length >= 3 && (n.includes(x) || x.includes(n)) && n.length >= 3))); });
    if (hit) {
      // Prefer your language when the article has one.
      if (l !== lang) {
        const ll = await wjson(`https://${l}.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=${lang}&titles=${encodeURIComponent(hit.title)}&format=json&origin=*`).catch(() => null);
        const pg = ll && (Object.values(ll.query?.pages ?? {})[0] as { langlinks?: { "*": string }[] } | undefined);
        const tr = pg?.langlinks?.[0]?.["*"];
        if (tr) { const s = await summary(lang, tr); if (s) return s; }
      }
      const s = await summary(l, hit.title);
      if (s) return s;
    }
  }
  return null;
}

export type Photo = { thumb: string; full: string; by?: string; page?: string };
/** Real photos taken at this spot (Wikimedia Commons), plus its tagged picture. */
export async function photosOf(p: Place): Promise<Photo[]> {
  const out: Photo[] = [];
  const t = p.tags;
  const file = (t.wikimedia_commons ?? "").startsWith("File:") ? t.wikimedia_commons : t.image?.includes("commons.wikimedia.org/wiki/File:") ? decodeURIComponent(t.image.split("/wiki/")[1]) : "";
  const titles: string[] = file ? [file] : [];
  if (t.image && /^https:\/\/.*\.(jpe?g|png|webp)$/i.test(t.image) && !file) out.push({ thumb: t.image, full: t.image });
  const big = p.cat === "park" || /castle|theme|zoo|stadium/i.test(p.kind);
  const r = big ? 250 : p.cat === "shrine" && t.historic === "wayside_shrine" ? 30 : 80;
  const geo = await wjson(`https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${p.lat}|${p.lon}&gsradius=${r}&gslimit=16&gsnamespace=6&format=json&origin=*`).catch(() => null);
  for (const g of geo?.query?.geosearch ?? []) if (!titles.includes(g.title)) titles.push(g.title);
  if (!titles.length) return out;
  const info = await wjson(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 16).join("|"))}&prop=imageinfo&iiprop=url|extmetadata|mime&iiextmetadatafilter=Artist&iiurlwidth=480&format=json&origin=*`).catch(() => null);
  const pages = Object.values(info?.query?.pages ?? {}) as { title: string; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; mime?: string; extmetadata?: { Artist?: { value: string } } }[] }[];
  const order = (x: { title: string }) => titles.indexOf(x.title);
  for (const pg of pages.sort((a, b) => order(a) - order(b))) {
    const ii = pg.imageinfo?.[0];
    if (!ii?.thumburl || (ii.mime && !/jpeg|png|webp/.test(ii.mime))) continue;
    out.push({ thumb: ii.thumburl, full: ii.url, page: ii.descriptionurl, by: ii.extmetadata?.Artist?.value.replace(/<[^>]+>/g, "").trim().slice(0, 60) });
  }
  return out;
}

// ---------- Google Places (only when the server has a key) ----------
export type GReview = { by: string; stars: number; when: string; text: string; photo?: string };
export type GSummary = {
  id: string; name: string; rating?: number; count?: number; price?: string; address?: string; phone?: string; website?: string; maps?: string;
  open?: boolean; hours?: string[]; about?: string; type?: string; gtype?: string;
  know?: string; kids?: boolean; groups?: boolean; toilets?: boolean; dogs?: boolean; wheelchair?: boolean; cards?: boolean; cashOnly?: boolean; photos?: string[]; reviews?: GReview[]; lat?: number; lon?: number;
};
let gOn: Promise<boolean> | null = null;
export const googleOn = () => (gOn ??= fetch("/api/places").then((r) => r.json()).then((j) => !!j.on).catch(() => false));

type Sess = { user: string; auth: string };
async function gcall<T>(s: Sess, body: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: s.user, auth: s.auth, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `Google ${r.status}`);
  return j as T;
}
const gcache = new Map<string, Promise<GSummary | null>>();
export function googleDetails(s: Sess, p: Place, lang: "en" | "ja"): Promise<GSummary | null> {
  const k = `${p.id}|${lang}`;
  if (!gcache.has(k)) gcache.set(k, gcall<{ place: GSummary | null }>(s, { op: "find", name: p.tags.name ?? p.name, lat: p.lat, lon: p.lon, lang }).then((j) => j.place).catch((e) => { gcache.delete(k); throw e; }));
  return gcache.get(k)!;
}
export const googleNearby = (s: Sess, cats: string[], c: { lat: number; lon: number }, radius: number, lang: "en" | "ja") =>
  gcall<{ places: GSummary[] }>(s, { op: "nearby", types: [...new Set(cats.flatMap((id) => catOf(id).google ?? []))].slice(0, 50), lat: c.lat, lon: c.lon, radius: Math.min(50000, Math.max(100, radius)), lang }).then((j) => j.places);
export const googleText = (s: Sess, q: string, c: { lat: number; lon: number }, lang: "en" | "ja") =>
  gcall<{ places: GSummary[] }>(s, { op: "text", q, lat: c.lat, lon: c.lon, lang }).then((j) => j.places);
export const googlePlace = (g: GSummary): Place => ({ id: `g:${g.id}`, lat: g.lat ?? 0, lon: g.lon ?? 0, name: g.name, cat: "sight", kind: g.type ?? "Place", tags: {}, g });

// ---------- search by name (free) ----------
export type Hit = { name: string; lat: number; lon: number; what: string };
export async function searchPlaces(q: string, near: { lat: number; lon: number }, lang: "en" | "ja"): Promise<Hit[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&accept-language=${lang},ja&q=${encodeURIComponent(q)}&viewbox=${near.lon - 0.5},${near.lat + 0.5},${near.lon + 0.5},${near.lat - 0.5}`;
  const j = await wjson(url).catch(() => []);
  return (Array.isArray(j) ? j : []).map((h: { name?: string; display_name: string; lat: string; lon: string; type?: string; category?: string }) => ({
    name: h.name || h.display_name.split(",")[0], lat: Number(h.lat), lon: Number(h.lon), what: h.display_name.split(",").slice(1, 3).join(",").trim() || (h.type ?? ""),
  }));
}

// ---------- routes on our own map (free OSM routing; walk and bicycle) ----------
export type Route = { pts: [number, number][]; m: number; min: number; mode: "foot" | "bike" };
const rcache = new Map<string, Promise<Route | null>>();
export function routeTo(a: { lat: number; lon: number }, b: { lat: number; lon: number }, mode: "foot" | "bike"): Promise<Route | null> {
  const k = `${a.lat.toFixed(4)},${a.lon.toFixed(4)}>${b.lat.toFixed(5)},${b.lon.toFixed(5)}|${mode}`;
  if (!rcache.has(k)) rcache.set(k, (async () => {
    const url = `https://routing.openstreetmap.de/routed-${mode}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;
    const r = await fetch(url, { signal: AbortSignal.timeout(12_000), referrerPolicy: "origin" }).catch(() => null);
    const j = await r?.json().catch(() => null);
    const rt = j?.routes?.[0];
    if (!rt?.geometry?.coordinates?.length) { rcache.delete(k); return null; }
    return { pts: rt.geometry.coordinates.map(([x, y]: [number, number]) => [y, x] as [number, number]), m: rt.distance, min: rt.duration / 60, mode };
  })());
  return rcache.get(k)!;
}
