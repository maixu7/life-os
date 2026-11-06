"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import {
  addressOf, catOf, directionsUrl, distText, factsOf, googleDetails, googleSearchUrl, metres, minText, openNow, phoneOf, photosOf, priceOf, storyOf, travel, websiteOf, weekHours,
  type GSummary, type Photo, type Place, type Story,
} from "@/lib/places";
import { toDay, useApp, type CustomItem, type ShopItem } from "@/lib/store";
import { getPhoto, putPhoto } from "@/lib/vault";

// Everything about one place: photos, why it's known, price, hours, how far,
// directions, save, add to today's mission, visits, my notes and spend.

/** A saved place (items "place") back as a map place. */
export function placeFromItem(i: CustomItem): Place {
  const c = i.config as Record<string, unknown>;
  return { id: String(c.pid), lat: Number(c.lat), lon: Number(c.lon), name: i.name, en: (c.en as string) || undefined, cat: String(c.cat ?? "sight"), kind: String(c.kind ?? "Place"), tags: (c.tags as Record<string, string>) ?? {}, g: c.g as GSummary | undefined };
}
const KEEP = /^(name|name:en|name:ja|opening_hours|phone|contact:|website|url|addr:|fee|charge|wikipedia|wikidata|wikimedia_commons|image|religion|denomination|subject|cuisine|brand|operator|start_date|heritage|wheelchair|internet_access|historic|amenity|tourism|leisure|shop|description)/;
const pickTags = (t: Record<string, string>) => Object.fromEntries(Object.entries(t).filter(([k]) => KEEP.test(k)));
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

export function PlaceSheet({ place, from, lang: lang0, gOn, onClose, onUpdate }: {
  place: Place; from: { lat: number; lon: number } | null; lang: "en" | "ja"; gOn: boolean; onClose: () => void; onUpdate?: (p: Place) => void;
}) {
  const { data, update, session, logActivity, profile } = useApp();
  const [p, setP] = useState(place);
  const [lang, setLang] = useState(lang0);
  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [g, setG] = useState<GSummary | null | undefined>(place.g?.reviews ? place.g : gOn ? undefined : null);
  const [gErr, setGErr] = useState("");
  const [gPics, setGPics] = useState<string[]>([]);
  const [big, setBig] = useState<string | null>(null);
  const [ai, setAi] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [plan, setPlan] = useState(false);
  const [spend, setSpend] = useState(false);
  const [toast, setToast] = useState("");
  const [mine, setMine] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const cur = profile.settings.currency || "¥";
  const yen = /^(¥|JPY|円)$/i.test(cur) ? "¥" : `${cur} `;

  const item = data.items.find((i) => i.category === "place" && i.config.pid === p.id);
  const cfg = (item?.config ?? {}) as { stars?: number; note?: string; photos?: string[]; ai?: string };
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
  const price = priceOf({ ...p, g: g ?? p.g }, yen.trim());
  const facts = factsOf(p.tags);
  const say = (s: string) => { setToast(s); setTimeout(() => setToast(""), 2600); };

  useEffect(() => { setP(place); }, [place]);
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
  // Google: rating, reviews, photos (when switched on).
  useEffect(() => {
    if (!gOn || !session || (g && g.reviews)) return;
    let dead = false;
    googleDetails(session, p, lang).then((x) => {
      if (dead) return;
      setG(x);
      if (x) { const np = { ...p, g: x }; onUpdate?.(np); }
    }).catch((e) => { if (!dead) { setG(null); setGErr((e as Error).message); } });
    return () => { dead = true; };
  }, [gOn, session, p.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!g?.photos?.length || !session) return;
    let dead = false;
    Promise.all(g.photos.slice(0, 6).map((name) => fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: session.user, auth: session.auth, op: "photo", name, lat: p.lat, lon: p.lon }) }).then((r) => r.json()).then((j) => j.url as string | undefined).catch(() => undefined)))
      .then((u) => !dead && setGPics(u.filter((x): x is string => !!x)));
    return () => { dead = true; };
  }, [g?.photos, session]); // eslint-disable-line react-hooks/exhaustive-deps
  // My own photos of this place.
  useEffect(() => {
    if (!session || !cfg.photos?.length) return;
    let dead = false;
    Promise.all(cfg.photos.map(async (id) => [id, await getPhoto(session, id).then((b) => (b ? URL.createObjectURL(b) : "")).catch(() => "")] as const))
      .then((x) => !dead && setMine(Object.fromEntries(x.filter(([, u]) => u))));
    return () => { dead = true; };
  }, [session, cfg.photos?.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- saving ----------
  const saveItem = (patch: Record<string, unknown>) => update((dd) => {
    const old = dd.items.find((i) => i.category === "place" && i.config.pid === p.id);
    if (old) return { ...dd, items: dd.items.map((i) => (i.id === old.id ? { ...i, config: { ...i.config, ...patch } } : i)) };
    const it: CustomItem = { id: crypto.randomUUID(), category: "place", name: p.name, sort: Date.now(), config: { pid: p.id, lat: p.lat, lon: p.lon, en: p.en, cat: p.cat, kind: p.kind, tags: pickTags(p.tags), g: g ? { ...g, reviews: undefined, photos: undefined } : undefined, saved: new Date().toISOString(), ...patch } };
    return { ...dd, items: [...dd.items, it] };
  });
  const toggleSave = () => {
    if (item) {
      if (!confirm(`Remove "${p.name}" from saved places?`)) return;
      update((dd) => ({ ...dd, items: dd.items.filter((i) => i.id !== item.id), deleted: [...dd.deleted, item.id] }));
      say("Removed from saved");
    } else { saveItem({}); say("⭐ Saved to My places"); }
  };
  const visited = () => {
    logActivity("visit", { name: `Visit ${p.name}`, place: p.name, pid: p.id, lat: p.lat, lon: p.lon, cat: p.cat, kind: p.kind, emoji: cat.icon });
    if (!item) saveItem({});
    say(`✅ Visit saved to today's records`);
  };
  const addPhoto = async (f: File | undefined) => {
    if (!f || !session) return;
    const id = crypto.randomUUID();
    await putPhoto(session, id, f);
    saveItem({ photos: [...(cfg.photos ?? []), id] });
    say("📷 Photo saved");
  };
  const askAi = async () => {
    if (!session) return;
    setAiBusy(true); setAi("");
    const factsText = [
      `Name: ${p.name}${p.en ? ` (${p.en})` : ""}`, `Type: ${p.kind}`, addr && `Address: ${addr}`, `Location: ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`,
      p.tags.opening_hours && `Hours: ${p.tags.opening_hours}`, `Price info: ${price}`, story?.text && `Wikipedia: ${story.text.slice(0, 900)}`,
      g?.rating && `Google rating ${g.rating} (${g.count} reviews)`, g?.price && `Google price: ${g.price}`,
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

  const pics = [...Object.values(mine), ...gPics, ...(photos ?? []).map((x) => x.thumb), ...(story?.image && !(photos ?? []).length ? [story.image] : [])];
  const fullOf = (u: string) => photos?.find((x) => x.thumb === u)?.full ?? u;
  const rating = g?.rating;

  return (
    <Sheet title={`${cat.icon} ${p.name}`} onClose={onClose}>
      <div className="space-y-3 min-w-0 break-words">
        {/* Photos */}
        {pics.length > 0 ? (
          <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 w-max">
              {pics.slice(0, 20).map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="" loading="lazy" referrerPolicy="no-referrer" onClick={() => setBig(fullOf(u))} className="h-36 w-auto max-w-[70vw] rounded-xl object-cover bg-black/20 shrink-0" />
              ))}
            </div>
          </div>
        ) : photos === null ? <div className="h-20 rounded-xl bg-white/5 animate-pulse" /> : null}

        <div className="min-w-0">
          {p.en && <div className="text-sm text-muted">{p.en}</div>}
          <div className="text-sm">{p.kind}{g?.type && g.type !== p.kind ? ` · ${g.type}` : ""}</div>
          <div className="text-sm flex flex-wrap gap-x-2">
            {rating ? <span className="text-amber-400 font-bold">★ {rating.toFixed(1)} <span className="text-muted font-normal">({g?.count ?? 0} Google reviews)</span></span> : null}
            {o ? <span className={o.open ? "text-green-400" : "text-red-400"}>{o.text}</span> : g?.open != null ? <span className={g.open ? "text-green-400" : "text-red-400"}>{g.open ? "Open now" : "Closed now"}</span> : null}
          </div>
        </div>

        {/* Main buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <a href={directionsUrl(p, "walking")} target="_blank" rel="noreferrer" className="lo-act"><span>🧭</span>Go</a>
          <button onClick={toggleSave} className={`lo-act ${item ? "!border-amber-400" : ""}`}><span>{item ? "⭐" : "☆"}</span>{item ? "Saved" : "Save"}</button>
          <button onClick={() => setPlan(!plan)} className={`lo-act ${plan ? "!border-[var(--accent2)]" : ""}`}><span>➕</span>Today</button>
          <button onClick={visited} className="lo-act"><span>✅</span>I&apos;m here</button>
        </div>
        {toast && <p className="text-sm text-green-400 font-semibold">{toast}</p>}
        {plan && <PlanBox p={p} walk={t?.walk ?? 0} onDone={(s) => { setPlan(false); say(s); }} />}

        {/* How far */}
        {d != null && t && (
          <div className="card p-2.5 text-sm">
            <div className="font-semibold mb-1">📏 {distText(d)} from you</div>
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <a href={directionsUrl(p, "walking")} target="_blank" rel="noreferrer" className="rounded-lg bg-white/5 p-1.5">🚶<br />{minText(t.walk)}</a>
              <a href={directionsUrl(p, "bicycling")} target="_blank" rel="noreferrer" className="rounded-lg bg-white/5 p-1.5">🚲<br />{minText(t.bike)}</a>
              <a href={directionsUrl(p, "transit")} target="_blank" rel="noreferrer" className="rounded-lg bg-white/5 p-1.5">🚌🚆<br />{t.transit ? `~${minText(t.transit)}` : "walk it"}</a>
            </div>
            <div className="text-[10px] text-muted mt-1">Estimates. Tap one for the real route in Google Maps.</div>
          </div>
        )}

        {/* Cost */}
        <div className="card p-2.5 text-sm space-y-1">
          <div>💴 <b>{price}</b></div>
          {spent.length > 0 && <div className="text-xs">You spent here: {spent.map((s) => `${yen}${Number(s.price).toLocaleString()} (${(s.purchased_at ?? s.created_at).slice(5, 10)})`).join(", ")}</div>}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSpend(!spend)} className="chip text-xs">💴 I spent…</button>
            <button onClick={askAi} disabled={aiBusy} className="chip text-xs">{aiBusy ? "🤖 Asking…" : "🤖 Ask AI: price, best time, tips"}</button>
          </div>
          {spend && <SpendBox p={p} yen={yen} onDone={(s) => { setSpend(false); say(s); }} />}
          {(ai || cfg.ai) && <div className="rounded-lg bg-white/5 p-2 text-xs whitespace-pre-line">{ai || cfg.ai}<div className="text-[10px] text-muted mt-1">From AI. Check prices before you go.</div></div>}
        </div>

        {/* Why it's known */}
        <div className="card p-2.5 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <b className="flex-1">📖 Why it&apos;s known</b>
            <button onClick={() => setLang(lang === "en" ? "ja" : "en")} className="chip !py-0.5 text-xs">{lang === "en" ? "日本語" : "English"}</button>
          </div>
          {story === undefined ? <p className="text-muted text-xs">Looking on Wikipedia…</p>
            : story ? <>
              {story.description && <p className="text-xs text-muted">{story.description}</p>}
              <p className="leading-relaxed">{story.text}</p>
              <a href={story.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent2)] underline">Read more on Wikipedia ({story.lang === "ja" ? "日本語" : "English"})</a>
            </>
            : <p className="text-muted text-xs">{g?.about ?? p.tags.description ?? `No story found. Small ${p.cat === "shrine" ? "shrines" : "places"} like this one often aren't on Wikipedia.`}</p>}
          {story && g?.about && <p className="text-xs text-muted">Google: {g.about}</p>}
        </div>

        {/* Details */}
        <div className="card p-2.5 text-sm space-y-1.5">
          {addr && <div>📍 {addr}</div>}
          {hours ? <details><summary className="cursor-pointer">🕒 Hours {o ? `· ${o.text}` : ""}</summary><ul className="text-xs mt-1 font-mono">{hours.map((h) => <li key={h}>{h}</li>)}</ul></details>
            : g?.hours?.length ? <details><summary className="cursor-pointer">🕒 Hours</summary><ul className="text-xs mt-1">{g.hours.map((h) => <li key={h}>{h}</li>)}</ul></details>
            : p.tags.opening_hours ? <div>🕒 {p.tags.opening_hours}</div> : <div className="text-muted">🕒 Hours not listed</div>}
          {phone && <div>📞 <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="underline">{phone}</a></div>}
          {site && <div className="truncate">🌐 <a href={site} target="_blank" rel="noreferrer" className="underline">{site.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}</a></div>}
          {facts.length > 0 && <table className="w-full text-xs"><tbody>{facts.map(([k, v]) => <tr key={k}><td className="text-muted pr-2 align-top whitespace-nowrap">{k}</td><td className="break-words">{v}</td></tr>)}</tbody></table>}
          <a href={g?.maps ?? googleSearchUrl(p)} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent2)] underline">Open in Google Maps</a>
        </div>

        {/* Google reviews */}
        {gOn && (
          <div className="card p-2.5 text-sm space-y-2">
            <b>⭐ Reviews (Google)</b>
            {g === undefined ? <p className="text-xs text-muted">Loading…</p>
              : g?.reviews?.length ? g.reviews.map((r, i) => (
                <div key={i} className="border-t border-white/10 pt-1.5">
                  <div className="text-xs"><span className="text-amber-400">{"★".repeat(Math.round(r.stars))}</span> <b>{r.by}</b> <span className="text-muted">· {r.when}</span></div>
                  <p className="text-xs leading-relaxed whitespace-pre-line">{r.text}</p>
                </div>
              ))
              : <p className="text-xs text-muted">{gErr || "No Google reviews for this place."}</p>}
          </div>
        )}

        {/* Mine */}
        <div className="card p-2.5 text-sm space-y-2">
          <b>📝 My notes</b>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => saveItem({ stars: cfg.stars === n ? 0 : n })} className="text-2xl leading-none" aria-label={`${n} stars`}>{(cfg.stars ?? 0) >= n ? "★" : "☆"}</button>)}
          </div>
          <textarea className="input w-full text-sm" rows={2} placeholder="What I liked, what to try next time…" defaultValue={cfg.note ?? ""} onBlur={(e) => { if (e.target.value !== (cfg.note ?? "")) saveItem({ note: e.target.value }); }} />
          <div className="flex flex-wrap gap-1.5 items-center">
            <button onClick={() => fileRef.current?.click()} className="chip text-xs">📷 Add my photo</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            <span className="text-xs text-muted">{visits.length ? `Visited ${visits.length} time${visits.length > 1 ? "s" : ""}, last on ${new Date(visits[0].created_at).toLocaleDateString([], { month: "short", day: "numeric" })}` : "Not visited yet"}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted">Data: OpenStreetMap contributors{story ? ", Wikipedia" : ""}{photos?.length ? ", Wikimedia Commons" : ""}{g ? ", Google" : ""}.</p>
      </div>

      {big && (
        <div className="fixed inset-0 z-[60] bg-black/90 grid place-items-center p-3" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big} alt="" referrerPolicy="no-referrer" className="max-w-full max-h-[85dvh] object-contain rounded-lg" />
          <button className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 text-white text-3xl" aria-label="Close">✕</button>
        </div>
      )}
    </Sheet>
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
