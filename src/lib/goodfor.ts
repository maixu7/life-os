// What a place is good for, a one-line summary and "know before you go",
// worked out from its details (no AI). Plus "What should I do now?" picks.

import { metres, openNow, priceOf, travel, type Place } from "@/lib/places";

export type Tag = "photos" | "food" | "cafe" | "family" | "date" | "rain" | "free" | "night" | "quick" | "calm" | "friends" | "learn" | "active" | "history";
export const TAGS: Record<Tag, string> = {
  photos: "📸 Photos", food: "🍜 Food", cafe: "☕ Coffee & sweets", family: "👨‍👩‍👧 Family", date: "💑 Date", rain: "🌧️ Rainy day", free: "💸 Free",
  night: "🌙 Night", quick: "⏱️ Quick visit", calm: "🧘 Calm", friends: "🎉 With friends", learn: "📚 Learn something", active: "🏃 Get moving", history: "🏯 History",
};

const has = (p: Place, k: string, re: RegExp) => re.test(p.tags[k] ?? "");
/** Usual time spent there, in minutes. */
export function stayOf(p: Place): number {
  const t = p.tags;
  if (t.historic === "wayside_shrine" || /^Small /.test(p.kind) || t.tourism === "artwork") return 10;
  if (p.cat === "konbini" || p.cat === "toilet" || p.cat === "station") return 10;
  if (p.cat === "shrine") return t.wikipedia || t.wikidata ? 45 : 20;
  if (t.tourism === "viewpoint") return 20;
  if (p.cat === "cafe") return 45;
  if (p.cat === "food") return 50;
  if (p.cat === "cinema") return 140;
  if (p.cat === "karaoke" || p.cat === "arcade" || p.cat === "bath") return 90;
  if (has(p, "tourism", /^(theme_park|zoo|aquarium)$/)) return 180;
  if (p.cat === "museum") return 90;
  if (p.cat === "park") return 60;
  if (p.cat === "shop") return 45;
  return 45;
}
export function isFree(p: Place) {
  const t = p.tags;
  if (t.fee === "no" || p.g?.price === "Free") return true;
  if (t.fee === "yes" || t.charge) return false;
  return p.cat === "shrine" || (p.cat === "park" && t.leisure !== "water_park") || t.tourism === "viewpoint" || t.tourism === "artwork";
}
export function isCheap(p: Place) {
  if (isFree(p)) return true;
  const c = Number(String(p.tags.charge ?? "").replace(/[^\d]/g, ""));
  if (c && c <= 1000) return true;
  if (p.g?.price && /cheap|Free/.test(p.g.price)) return true;
  if (p.cat === "konbini" || p.cat === "arcade" || p.tags.amenity === "fast_food") return true;
  return false;
}
function lateNight(p: Place) {
  const oh = p.tags.opening_hours ?? "";
  if (oh === "24/7") return true;
  return [...oh.matchAll(/-(\d{1,2}):\d\d/g)].some(([, h]) => Number(h) >= 22 || Number(h) <= 5);
}

export function goodFor(p: Place): Tag[] {
  const t = p.tags, g = p.g as (Place["g"] & { kids?: boolean; groups?: boolean }) | undefined;
  const out = new Set<Tag>();
  const indoor = ["museum", "cinema", "arcade", "karaoke", "shop", "bath", "food", "cafe"].includes(p.cat) || has(p, "tourism", /^(aquarium|gallery)$/) || has(p, "leisure", /^(bowling_alley|escape_game|ice_rink|trampoline_park|sports_centre|fitness_centre)$/);
  const famous = !!(t.wikipedia || t.wikidata);
  if (p.cat === "sight" || t.tourism === "viewpoint" || famous || p.cat === "park" || has(p, "historic", /castle|ruins|city_gate/)) out.add("photos");
  if (p.cat === "food" || t.cuisine) out.add("food");
  if (p.cat === "cafe") out.add("cafe");
  if (g?.kids || has(p, "tourism", /^(zoo|aquarium|theme_park|museum)$/) || p.cat === "park" || has(p, "leisure", /^(water_park|trampoline_park|miniature_golf)$/)) out.add("family");
  if (has(p, "tourism", /^(viewpoint|aquarium|theme_park)$/) || has(p, "leisure", /^garden$/) || p.cat === "cafe" || p.cat === "cinema" || (p.cat === "shrine" && famous)) out.add("date");
  if (indoor) out.add("rain");
  if (isFree(p)) out.add("free");
  if (lateNight(p) || p.cat === "karaoke" || t.tourism === "viewpoint") out.add("night");
  if (stayOf(p) <= 20) out.add("quick");
  if (p.cat === "shrine" || has(p, "leisure", /^(garden|park|nature_reserve)$/) || p.cat === "bath") out.add("calm");
  if (g?.groups || ["arcade", "karaoke", "fun"].includes(p.cat)) out.add("friends");
  if (p.cat === "museum" || (famous && (p.cat === "shrine" || p.cat === "sight"))) out.add("learn");
  if (p.cat === "fun" || has(p, "leisure", /^(park|sports_centre|fitness_centre)$/)) out.add("active");
  if (t.historic || t.heritage || (t.start_date && Number(t.start_date.slice(0, 4)) < 1900)) out.add("history");
  return [...out];
}

/** One line that says what the place is, without AI. */
export function oneLine(p: Place, about?: string): string {
  const o = openNow(p.tags.opening_hours);
  const bits: string[] = [];
  bits.push(about ? about.replace(/\.$/, "") : p.kind);
  const price = priceOf(p);
  if (isFree(p)) bits.push(price.startsWith("Usually") ? "usually free" : "free");
  else if (/^Entry/.test(price)) bits.push(price.replace("Entry: ", "entry "));
  if (p.tags.opening_hours === "24/7") bits.push("open 24 h");
  else if (o) bits.push(o.open ? o.text.replace("Open now · ", "open ") : "closed now");
  const tags = goodFor(p).filter((x) => x !== "free").slice(0, 2).map((x) => TAGS[x].replace(/^\S+\s/, "").toLowerCase());
  return `${bits.join(" · ")}${tags.length ? `. Good for ${tags.join(" and ")}.` : "."}`;
}

/** Short practical lines, like Google's "Know before you go" (from the details, not reviews). */
export function knowBefore(p: Place): string[] {
  const t = p.tags, out: string[] = [];
  const stay = stayOf(p);
  out.push(`Most people spend about ${stay < 60 ? `${stay} min` : `${Math.round((stay / 60) * 2) / 2} h`} here.`);
  if (p.cat === "shrine" && !/^Small|Jizō/.test(p.kind)) out.push("Bow once at the gate, wash hands at the water basin, and keep quiet near the main hall.");
  if (t.historic === "wayside_shrine") out.push("A small street shrine: locals leave a coin or bow when passing.");
  if (t.wheelchair === "yes") out.push("Wheelchair accessible."); else if (t.wheelchair === "limited") out.push("Partly wheelchair accessible."); else if (t.wheelchair === "no") out.push("Not wheelchair accessible.");
  if (t.toilets === "yes") out.push("Has toilets.");
  if (t["payment:cash"] === "only" || (t["payment:cash"] === "yes" && t["payment:credit_cards"] === "no")) out.push("Cash only, bring yen.");
  else if (t["payment:credit_cards"] === "yes" || t["payment:ic_cards"] === "yes") out.push("Cards accepted.");
  if (t.smoking === "yes") out.push("Smoking allowed inside.");
  if (p.cat === "bath") out.push("Bring a small towel. Tattoos may not be allowed; check first.");
  if (p.cat === "karaoke") out.push("Usually charged per 30 min per person; drinks may be required.");
  if (t["internet_access"] && t["internet_access"] !== "no") out.push("Free Wi-Fi.");
  return out.slice(0, 5);
}

// ---------- what you like ----------
export type Vote = { cat: string; tags: Tag[]; v: 1 | -1 };
/** Taste per type and tag from your 👍/👎 (+ visits), between −1 and 1. */
export function taste(votes: Vote[]) {
  const sum = new Map<string, number>(), n = new Map<string, number>();
  const add = (k: string, v: number) => { sum.set(k, (sum.get(k) ?? 0) + v); n.set(k, (n.get(k) ?? 0) + 1); };
  for (const x of votes) { add(`c:${x.cat}`, x.v); for (const t of x.tags) add(`t:${t}`, x.v * 0.5); }
  return (p: Place) => {
    let s = (sum.get(`c:${p.cat}`) ?? 0) / Math.max(2, n.get(`c:${p.cat}`) ?? 0);
    for (const t of goodFor(p)) s += ((sum.get(`t:${t}`) ?? 0) / Math.max(3, n.get(`t:${t}`) ?? 0)) * 0.5;
    return Math.max(-1, Math.min(1, s));
  };
}

// ---------- weather (Open-Meteo, free, no key) ----------
export type Weather = { temp: number; rain: boolean; code: number; day: boolean; text: string; icon: string; sunset?: string; rainLater?: boolean };
const WMO: [number[], string][] = [[[0], "Clear"], [[1, 2], "Partly cloudy"], [[3], "Cloudy"], [[45, 48], "Fog"], [[51, 53, 55, 56, 57], "Drizzle"], [[61, 63, 65, 66, 67, 80, 81, 82], "Rain"], [[71, 73, 75, 77, 85, 86], "Snow"], [[95, 96, 99], "Thunderstorm"]];
let wx: { at: number; key: string; w: Weather | null } | null = null;
export async function weatherAt(lat: number, lon: number): Promise<Weather | null> {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (wx && wx.key === key && Date.now() - wx.at < 20 * 60_000) return wx.w;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,precipitation,weather_code,is_day&daily=sunset&hourly=precipitation_probability&forecast_hours=4&timezone=auto`, { signal: AbortSignal.timeout(8000), referrerPolicy: "no-referrer" });
    const j = await r.json();
    const c = j.current;
    const code = Number(c.weather_code);
    const text = WMO.find(([cs]) => cs.includes(code))?.[1] ?? "";
    const icon = code === 0 ? (c.is_day ? "☀️" : "🌙") : code <= 2 ? "⛅" : code === 3 ? "☁️" : code <= 48 ? "🌫️" : code <= 67 || (code >= 80 && code <= 82) ? "🌧️" : code <= 86 ? "❄️" : "⛈️";
    const sunset = typeof j.daily?.sunset?.[0] === "string" ? j.daily.sunset[0].slice(11, 16) : undefined;
    const rainLater = Array.isArray(j.hourly?.precipitation_probability) && j.hourly.precipitation_probability.some((x: number) => x >= 60);
    const w: Weather = { temp: Math.round(c.temperature_2m), code, day: !!c.is_day, rain: Number(c.precipitation) > 0.1 || (code >= 51 && code <= 99 && code !== 77), text, icon, sunset, rainLater };
    wx = { at: Date.now(), key, w };
    return w;
  } catch { wx = { at: Date.now(), key, w: null }; return null; }
}

// ---------- "What should I do now?" ----------
export type Pick = { p: Place; score: number; why: string[]; walk: number; stay: number };
export function pickNow(ps: Place[], o: { from: { lat: number; lon: number }; freeMin: number; weather: Weather | null; budgetLeft: number | null; like: (p: Place) => number; visited: Set<string>; now?: Date }): Pick[] {
  const now = o.now ?? new Date();
  const hour = now.getHours();
  const out: Pick[] = [];
  for (const p of ps) {
    if (["toilet", "station", "konbini"].includes(p.cat)) continue;
    const d = metres(o.from, p), walk = travel(d).walk, stay = stayOf(p);
    const need = walk * 2 + stay;
    if (need > o.freeMin + 10) continue;
    const op = openNow(p.tags.opening_hours, now);
    if (op && !op.open) continue;
    if (!op && (p.cat === "museum" || p.cat === "cinema") && (hour >= 18 || hour < 9)) continue; // usually closed then
    const tags = goodFor(p);
    let s = 50 - walk * 0.8;
    const why: string[] = [];
    if (op?.open) { s += 6; why.push(op.text.replace("Open now · ", "open ")); }
    if (o.weather?.rain) { if (tags.includes("rain")) { s += 20; why.push("indoors, it's raining"); } else s -= 25; }
    else if (o.weather && o.weather.temp >= 33 && tags.includes("rain")) { s += 8; why.push("cool indoors"); }
    else if (o.weather && !o.weather.rain && (p.cat === "park" || p.cat === "sight")) { s += 6; why.push(`${o.weather.text.toLowerCase()} outside`); }
    if (o.budgetLeft != null && o.budgetLeft < 1500) { if (isFree(p)) { s += 15; why.push("free, budget is low"); } else if (!isCheap(p)) s -= 20; }
    else if (isFree(p)) { s += 4; why.push("free"); }
    const l = o.like(p);
    if (l > 0.2) { s += l * 25; why.push("you liked places like this"); } else if (l < -0.2) s += l * 30;
    if (!o.visited.has(p.id) && (p.tags.wikipedia || p.tags.wikidata)) { s += 10; why.push("famous, not visited yet"); }
    if (p.g?.rating) s += (p.g.rating - 3.8) * 10;
    if (hour >= 19 && tags.includes("night")) { s += 8; why.push("good at night"); }
    if (/^Small |Jizō/.test(p.kind)) s -= 12; // fine to pass by, not a plan
    why.unshift(`${Math.max(1, Math.round(walk))} min walk, ~${stay} min there`);
    out.push({ p, score: s, why, walk, stay });
  }
  // Variety: no two picks of the same type.
  const best: Pick[] = [];
  for (const x of out.sort((a, b) => b.score - a.score)) {
    if (best.some((b) => b.p.cat === x.p.cat) && best.length < 2) continue;
    best.push(x);
    if (best.length === 3) break;
  }
  return best;
}

// ---------- "Plan an outing": a timed walk through a few places ----------
export type Stop = { p: Place; arrive: number; leave: number; walk: number };
/** Greedy: from where you are, the best next place within reach, until time runs out. */
export function planOuting(ps: Place[], o: { from: { lat: number; lon: number }; startMin: number; freeMin: number; like: (p: Place) => number; weather: Weather | null; visited: Set<string>; max?: number }): Stop[] {
  const out: Stop[] = [];
  let at = o.from, t = o.startMin;
  const end = o.startMin + o.freeMin;
  const used = new Set<string>(), cats = new Map<string, number>();
  const max = o.max ?? 5;
  while (out.length < max) {
    let best: { p: Place; s: number; walk: number; stay: number } | null = null;
    for (const p of ps) {
      if (used.has(p.id) || ["toilet", "station", "konbini", "atm", "locker", "water", "vending"].includes(p.cat)) continue;
      const walk = travel(metres(at, p)).walk, stay = stayOf(p);
      const home = travel(metres(p, o.from)).walk;
      if (t + walk + stay + home > end) continue;
      const tags = goodFor(p);
      let s = 40 - walk * 1.2 + o.like(p) * 20 - (cats.get(p.cat) ?? 0) * 12;
      if (p.tags.wikipedia || p.tags.wikidata) s += o.visited.has(p.id) ? 2 : 10;
      if (o.weather?.rain) s += tags.includes("rain") ? 15 : -20;
      if (/^Small |Jizō/.test(p.kind)) s -= 6;
      if (p.cat === "food" || p.cat === "cafe") s += out.length >= 1 && !cats.has("food") && !cats.has("cafe") ? 8 : -10;
      if (!best || s > best.s) best = { p, s, walk, stay };
    }
    if (!best) break;
    const arrive = t + best.walk;
    out.push({ p: best.p, arrive, leave: arrive + best.stay, walk: best.walk });
    used.add(best.p.id); cats.set(best.p.cat, (cats.get(best.p.cat) ?? 0) + 1);
    t = arrive + best.stay; at = best.p;
  }
  return out;
}
