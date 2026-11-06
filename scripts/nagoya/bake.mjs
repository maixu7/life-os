// Bakes every fun place in and around Nagoya from OpenStreetMap into the app,
// plus photos and exact spots for the hand-picked list, so the phone never has
// to wait for a map server. Runs in GitHub Actions (see .github/workflows/nagoya-data.yml).
//   node scripts/nagoya/bake.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const OUT = "public/nagoya";
const UA = { "User-Agent": "LifeOS-data-bake/1.0 (https://github.com/maixu7/life-os)" };
const BB = "34.98,136.74,35.30,137.12"; // Nagoya city with a bike ride around it
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

// ---------- OpenStreetMap ----------
const SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
async function overpass(q) {
  for (let round = 0; round < 3; round++) {
    for (const url of SERVERS) {
      try {
        const r = await fetch(url, { method: "POST", body: `data=${encodeURIComponent(q)}`, headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(300_000) });
        if (!r.ok) { console.log(url, r.status); continue; }
        const j = await r.json();
        if (j.remark && !j.elements?.length) { console.log(url, j.remark); continue; }
        return j.elements ?? [];
      } catch (e) { console.log(url, String(e)); }
    }
    await sleep(20_000);
  }
  throw new Error("every Overpass server failed");
}

const FILTERS = [
  '["amenity"="place_of_worship"]["name"]', '["historic"="wayside_shrine"]',
  '["tourism"~"^(attraction|viewpoint|museum|gallery|aquarium|zoo|theme_park)$"]', '["historic"~"^(castle|monument|memorial|ruins|archaeological_site|building|tomb|city_gate)$"]["name"]',
  '["leisure"~"^(park|garden|nature_reserve)$"]["name"]', '["amenity"~"^(planetarium|arts_centre|cinema|theatre|concert_hall|karaoke_box|public_bath)$"]',
  '["leisure"~"^(amusement_arcade|bowling_alley|escape_game|miniature_golf|water_park|ice_rink|trampoline_park|sauna|stadium)$"]', '["leisure"="sports_centre"]["name"]',
  '["sport"="climbing"]["name"]', '["natural"="hot_spring"]',
  '["amenity"~"^(restaurant|fast_food|food_court|cafe|ice_cream)$"]["name"]',
  '["shop"~"^(mall|department_store|anime|books|games|video_games|toys|electronics|second_hand|gift|music|camera|hobby|model|pastry)$"]["name"]',
];
const KEEP = ["name", "name:en", "name:ja", "name:ja-Latn", "name:ja_rm", "amenity", "tourism", "historic", "leisure", "shop", "sport", "natural", "religion", "denomination", "cuisine",
  "opening_hours", "fee", "charge", "website", "contact:website", "phone", "contact:phone", "wikipedia", "wikidata", "wikimedia_commons", "image", "description", "description:en",
  "addr:full", "addr:province", "addr:city", "addr:suburb", "addr:quarter", "addr:neighbourhood", "addr:block_number", "addr:street", "addr:housenumber", "addr:postcode",
  "wheelchair", "toilets", "indoor", "smoking", "brand", "brand:en", "operator", "start_date", "heritage", "subject", "building"];

function catOf(t) {
  if (t.amenity === "place_of_worship" || t.historic === "wayside_shrine") return "shrine";
  if (/^(museum|gallery|aquarium|zoo)$/.test(t.tourism ?? "") || /^(planetarium|arts_centre)$/.test(t.amenity ?? "")) return "museum";
  if (t.leisure === "amusement_arcade") return "arcade";
  if (t.amenity === "karaoke_box") return "karaoke";
  if (/^(cinema|theatre|concert_hall)$/.test(t.amenity ?? "")) return "cinema";
  if (t.amenity === "public_bath" || t.leisure === "sauna" || t.natural === "hot_spring") return "bath";
  if (/^(restaurant|fast_food|food_court)$/.test(t.amenity ?? "")) return "food";
  if (/^(cafe|ice_cream)$/.test(t.amenity ?? "") || t.shop === "pastry") return "cafe";
  if (t.shop) return "shop";
  if (/^(park|garden|nature_reserve)$/.test(t.leisure ?? "")) return "park";
  if (t.tourism === "theme_park" || t.leisure || t.sport) return "fun";
  return "sight";
}

// Matches the Overpass-style filters above against a tag set.
const RULES = FILTERS.map((f) => [...f.matchAll(/\["([^"]+)"(?:(=|~)"([^"]+)")?\]/g)].map(([, k, op, v]) => [k, op, v && op === "~" ? new RegExp(v) : v]));
const wanted = (t) => RULES.some((r) => r.every(([k, op, v]) => (op === "=" ? t[k] === v : op === "~" ? v.test(t[k] ?? "") : k in t)));
// osmium "geojsonseq": one feature per line; areas get their middle point.
function* features(file) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const j = line.replace(/^\x1e/, "").trim();
    if (!j) continue;
    let f; try { f = JSON.parse(j); } catch { continue; }
    const g = f.geometry; if (!g) continue;
    let lat, lon;
    if (g.type === "Point") [lon, lat] = g.coordinates;
    else {
      const pts = (g.type === "Polygon" ? g.coordinates[0] : g.type === "MultiPolygon" ? g.coordinates[0][0] : g.type === "LineString" ? g.coordinates : []) ?? [];
      if (!pts.length) continue;
      let w = 180, e = -180, so = 90, n = -90;
      for (const [x, y] of pts) { w = Math.min(w, x); e = Math.max(e, x); so = Math.min(so, y); n = Math.max(n, y); }
      lon = (w + e) / 2; lat = (so + n) / 2;
    }
    const raw = String(f.id ?? "");
    let id = raw;
    if (raw[0] === "a") { const k = Number(raw.slice(1)); id = k % 2 === 0 ? `w${k / 2}` : `r${(k - 1) / 2}`; }
    yield { id, lat, lon, tags: f.properties ?? {} };
  }
}

async function bakeOsm() {
  const els = process.env.OSM_FUN ? [...features(process.env.OSM_FUN)].filter((e) => wanted(e.tags)).map((e) => ({ type: e.id[0] === "n" ? "node" : e.id[0] === "w" ? "way" : "relation", id: e.id.slice(1), lat: e.lat, lon: e.lon, tags: e.tags }))
    : await overpass(`[out:json][timeout:280][maxsize:1073741824][bbox:${BB}];(${FILTERS.map((f) => `nwr${f};`).join("")});out center tags;`);
  console.log("osm elements", els.length);
  const seen = new Set(), rows = [];
  for (const e of els) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (lat == null || lon == null) continue;
    if (!t.name && !t["name:en"] && t.historic !== "wayside_shrine") continue;
    // Tiny unnamed bits of green and car parks dressed as parks.
    if (t.leisure === "park" && /児童遊園|ちびっこ広場|公開空地/.test(t.name ?? "")) continue;
    const key = `${t.name}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(key)) continue; seen.add(key);
    const k = {};
    for (const n of KEEP) if (t[n]) k[n] = String(t[n]).slice(0, 300);
    rows.push({ id: `${e.type[0]}${e.id}`, c: catOf(t), a: Math.round(lat * 1e5), o: Math.round(lon * 1e5), t: k });
  }
  // Photos for the well-known ones (Wikidata P18).
  const qids = [...new Set(rows.map((r) => r.t.wikidata).filter((q) => /^Q\d+$/.test(q ?? "")))];
  const img = await wikidataImages(qids);
  for (const r of rows) {
    const f = img.get(r.t.wikidata) ?? (r.t.wikimedia_commons?.startsWith("File:") ? r.t.wikimedia_commons.slice(5) : undefined) ?? (/^File:/.test(r.t.image ?? "") ? r.t.image.slice(5) : undefined);
    if (f) r.p = f;
  }
  rows.sort((x, y) => x.c.localeCompare(y.c) || x.a - y.a);
  writeFileSync(`${OUT}/places.json`, JSON.stringify({ at: new Date().toISOString().slice(0, 10), bbox: BB, n: rows.length, rows }));
  const by = {}; for (const r of rows) by[r.c] = (by[r.c] ?? 0) + 1;
  console.log("places", rows.length, by, "with photo", rows.filter((r) => r.p).length);
  return rows;
}

async function bakeStations() {
  const els = process.env.OSM_STATIONS ? [...features(process.env.OSM_STATIONS)].map((e) => ({ lat: e.lat, lon: e.lon, tags: e.tags }))
    : await overpass(`[out:json][timeout:120][bbox:${BB}];(node["railway"="station"]["name"];node["public_transport"="station"]["name"];);out tags;`);
  const seen = new Map();
  for (const e of els) {
    const t = e.tags ?? {}; const k = t.name;
    if (!k || seen.has(k)) continue;
    seen.set(k, [k, t["name:en"] ?? "", Math.round(e.lat * 1e5), Math.round(e.lon * 1e5)]);
  }
  const rows = [...seen.values()];
  writeFileSync(`${OUT}/stations.json`, JSON.stringify(rows));
  console.log("stations", rows.length);
}

async function wikidataImages(qids) {
  const out = new Map();
  for (let i = 0; i < qids.length; i += 200) {
    const vals = qids.slice(i, i + 200).map((q) => `wd:${q}`).join(" ");
    const sparql = `SELECT ?item ?img WHERE { VALUES ?item { ${vals} } ?item wdt:P18 ?img }`;
    try {
      const r = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`, { headers: { ...UA, Accept: "application/sparql-results+json" }, signal: AbortSignal.timeout(60_000) });
      const j = await r.json();
      for (const b of j.results.bindings) {
        const q = b.item.value.split("/").pop();
        if (!out.has(q)) out.set(q, decodeURIComponent(b.img.value.split("/").pop()).replace(/_/g, " "));
      }
    } catch (e) { console.log("wikidata", String(e)); }
    await sleep(500);
  }
  return out;
}

// ---------- the hand-picked list ----------
const dist = (a, b) => { const R = 6371e3, r = Math.PI / 180; const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r), y = (b[0] - a[0]) * r; return Math.hypot(x, y) * R; };
const norm = (s) => (s ?? "").replace(/[\s・·()（）〈〉「」]/g, "").toLowerCase();
async function wiki(lang, titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const u = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=coordinates|pageimages|info&piprop=name&inprop=url&titles=${encodeURIComponent(titles.slice(i, i + 40).join("|"))}`;
    try {
      const j = await (await fetch(u, { headers: UA, signal: AbortSignal.timeout(60_000) })).json();
      const back = new Map();
      for (const n of j.query?.normalized ?? []) back.set(n.to, n.from);
      for (const n of j.query?.redirects ?? []) back.set(n.to, back.get(n.from) ?? n.from);
      for (const p of Object.values(j.query?.pages ?? {})) {
        if (p.missing !== undefined) continue;
        const asked = back.get(p.title) ?? p.title;
        out.set(asked, { title: p.title, url: p.fullurl, img: p.pageimage, lat: p.coordinates?.[0]?.lat, lon: p.coordinates?.[0]?.lon });
      }
    } catch (e) { console.log("wiki", lang, String(e)); }
    await sleep(300);
  }
  return out;
}
const BADPIC = /\bsta\b|ent(r)?ance|map|logo|地図|location|svg|diagram|plan|murder|case|accident|incident|station|駅|platform|sign|看板|bus|train|car /i;
async function commonsPhotos(q, en) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=info`;
  try {
    const j = await (await fetch(u, { headers: UA, signal: AbortSignal.timeout(30_000) })).json();
    return Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index).map((p) => p.title.replace(/^File:/, "")).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !BADPIC.test(f))
      .filter((f) => { const words = [q, ...en.split(/[\s()]+/).filter((w) => w.length >= 4 && !/^(nagoya|park|temple|shrine|museum|garden|street|shopping|city|the)$/i.test(w))]; return words.some((w) => f.toLowerCase().includes(w.toLowerCase())); });
  } catch { return []; }
}

async function bakePicks(osm) {
  const file = "src/data/nagoya-picks.json";
  if (!existsSync(file)) return;
  const picks = JSON.parse(readFileSync(file, "utf8"));
  const jaW = await wiki("ja", picks.map((p) => p.wja ?? p.ja));
  const enW = await wiki("en", picks.map((p) => p.wen ?? p.en));
  const out = [];
  for (const [i, p] of picks.entries()) {
    const near = [p.lat, p.lon];
    const wj = jaW.get(p.wja ?? p.ja), we = enW.get(p.wen ?? p.en);
    const w = [wj, we].find((x) => x?.lat && dist(near, [x.lat, x.lon]) < 4000);
    // The same place in OpenStreetMap: same name, close by.
    const n = norm(p.ja);
    let best = null, bd = 2500;
    for (const r of osm) {
      const rn = norm(r.t.name), d = dist(near, [r.a / 1e5, r.o / 1e5]);
      const close = rn === n || (Math.min(n.length, rn.length) >= 3 && (rn.includes(n) || n.includes(rn)) && Math.min(n.length, rn.length) / Math.max(n.length, rn.length) >= 0.7);
      if (d < bd && rn && close) { best = r; bd = d; }
    }
    const lat = best ? best.a / 1e5 : w?.lat ?? p.lat, lon = best ? best.o / 1e5 : w?.lon ?? p.lon;
    let photos = [];
    const nearPic = (x) => x && (!x.lat || dist([p.lat, p.lon], [x.lat, x.lon]) < 4000) ? x.img : undefined;
    for (const f of [best?.p, nearPic(wj), we?.lat ? nearPic(we) : undefined]) if (f && !BADPIC.test(f) && !photos.includes(f.replace(/_/g, " "))) photos.push(f.replace(/_/g, " "));
    if (photos.length < 5) for (const f of await commonsPhotos(p.ja, p.en)) if (photos.length < 6 && !photos.includes(f)) photos.push(f);
    await sleep(150);
    const t = best?.t ?? {};
    const addr = t["addr:full"] ?? ["addr:province", "addr:city", "addr:suburb", "addr:quarter", "addr:neighbourhood", "addr:block_number", "addr:street", "addr:housenumber"].map((k) => t[k]).filter(Boolean).join(" ");
    out.push({ i, lat: +lat.toFixed(5), lon: +lon.toFixed(5), osm: best?.id, addr: addr || undefined, oh: t.opening_hours, web: t.website ?? t["contact:website"], tel: t.phone ?? t["contact:phone"], wj: wj?.url, we: we?.url, ph: photos });
    if (!best && !w) console.log("no match", p.en);
  }
  writeFileSync(`${OUT}/picks.json`, JSON.stringify({ at: new Date().toISOString().slice(0, 10), n: out.length, rows: out }));
  console.log("picks", out.length, "matched osm", out.filter((x) => x.osm).length, "with photos", out.filter((x) => x.ph.length).length);
}

const osm = await bakeOsm();
await bakeStations();
await bakePicks(osm);
