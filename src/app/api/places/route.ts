import { NextResponse } from "next/server";
import { kv, limited, login, validAuth, validUser } from "@/lib/server/kv";

// Google Places for the map: ratings, reviews, photos and opening hours.
// Only switched on when Vercel has GOOGLE_PLACES_KEY; the key never reaches the phone.

export const runtime = "nodejs";
export const maxDuration = 30;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const key = () => (process.env.GOOGLE_PLACES_KEY ?? process.env.GOOGLE_MAPS_KEY ?? "").trim();
const API = "https://places.googleapis.com/v1";

export async function GET() {
  return NextResponse.json({ on: !!key() });
}

type G = {
  id: string; displayName?: { text: string }; location?: { latitude: number; longitude: number }; rating?: number; userRatingCount?: number;
  priceLevel?: string; priceRange?: { startPrice?: { units?: string; currencyCode?: string }; endPrice?: { units?: string; currencyCode?: string } };
  formattedAddress?: string; shortFormattedAddress?: string; nationalPhoneNumber?: string; websiteUri?: string; googleMapsUri?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }; regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  primaryType?: string; editorialSummary?: { text: string }; generativeSummary?: { overview?: { text: string } }; primaryTypeDisplayName?: { text: string };
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
  reviewSummary?: { text?: { text: string } }; goodForChildren?: boolean; goodForGroups?: boolean; restroom?: boolean; allowsDogs?: boolean;
  accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean }; paymentOptions?: { acceptsCreditCards?: boolean; acceptsCashOnly?: boolean };
  reviews?: { rating?: number; relativePublishTimeDescription?: string; text?: { text: string }; originalText?: { text: string }; authorAttribution?: { displayName?: string; photoUri?: string } }[];
};
const LEVEL: Record<string, string> = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "¥ · cheap", PRICE_LEVEL_MODERATE: "¥¥ · moderate", PRICE_LEVEL_EXPENSIVE: "¥¥¥ · expensive", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥ · very expensive" };
const yen = (p?: { units?: string; currencyCode?: string }) => (p?.units ? `${p.currencyCode === "JPY" || !p.currencyCode ? "¥" : `${p.currencyCode} `}${Number(p.units).toLocaleString("en")}` : "");
function shape(g: G, full: boolean) {
  const range = g.priceRange ? [yen(g.priceRange.startPrice), yen(g.priceRange.endPrice)].filter(Boolean).join("–") : "";
  const hours = g.currentOpeningHours ?? g.regularOpeningHours;
  return {
    id: g.id, name: g.displayName?.text ?? "", lat: g.location?.latitude, lon: g.location?.longitude, rating: g.rating, count: g.userRatingCount,
    price: range ? `${range} per person` : g.priceLevel ? LEVEL[g.priceLevel] : undefined,
    address: g.shortFormattedAddress ?? g.formattedAddress, phone: g.nationalPhoneNumber, website: g.websiteUri, maps: g.googleMapsUri,
    open: hours?.openNow, hours: full ? hours?.weekdayDescriptions : undefined, type: g.primaryTypeDisplayName?.text, gtype: g.primaryType,
    about: g.editorialSummary?.text ?? g.generativeSummary?.overview?.text,
    know: full ? g.reviewSummary?.text?.text : undefined, kids: g.goodForChildren, groups: g.goodForGroups, toilets: g.restroom, dogs: g.allowsDogs,
    wheelchair: g.accessibilityOptions?.wheelchairAccessibleEntrance, cards: g.paymentOptions?.acceptsCreditCards, cashOnly: g.paymentOptions?.acceptsCashOnly,
    photos: full ? (g.photos ?? []).slice(0, 8).map((p) => p.name) : undefined,
    reviews: full ? (g.reviews ?? []).slice(0, 5).map((r) => ({ by: r.authorAttribution?.displayName ?? "Google user", stars: r.rating ?? 0, when: r.relativePublishTimeDescription ?? "", text: (r.text?.text ?? r.originalText?.text ?? "").slice(0, 1200), photo: r.authorAttribution?.photoUri })) : undefined,
  };
}
const FULL = ["id", "displayName", "location", "rating", "userRatingCount", "priceLevel", "priceRange", "formattedAddress", "shortFormattedAddress", "nationalPhoneNumber", "websiteUri", "googleMapsUri", "currentOpeningHours", "regularOpeningHours", "editorialSummary", "primaryTypeDisplayName", "primaryType", "photos", "reviews", "goodForChildren", "goodForGroups", "restroom", "allowsDogs", "accessibilityOptions", "paymentOptions"];
// Newer AI summaries: asked for, but dropped if this key/region doesn't support them.
const EXTRA = ["generativeSummary", "reviewSummary"];
const LIST = ["id", "displayName", "location", "rating", "userRatingCount", "priceLevel", "shortFormattedAddress", "primaryTypeDisplayName", "primaryType", "currentOpeningHours.openNow"];
const mask = (f: string[]) => f.map((x) => `places.${x}`).join(",");

async function google(path: string, body: unknown, fields: string) {
  const r = await fetch(`${API}/${path}`, {
    method: "POST", signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key(), "X-Goog-FieldMask": fields },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message ? `Google: ${String(j.error.message).slice(0, 160)}` : `Google ${r.status}`);
  return j as { places?: G[] };
}

export async function POST(req: Request) {
  if (!key()) return bad("Google Places isn't switched on.", 501);
  const b = await req.json().catch(() => null);
  const { user, auth, op } = b ?? {};
  if (!validUser(user) || !validAuth(auth)) return bad("Invalid request.");
  const res = await login(user, auth);
  if ("error" in res) return bad(res.error, res.status);
  if (await limited(`placesmin:${user}`, 30, 60_000)) return bad("Too many lookups at once. Wait a minute.", 429);
  // A daily cap keeps the Google bill inside its free monthly amount.
  const photo = op === "photo";
  const dk = `places${photo ? "pic" : ""}:${user}:${new Date().toISOString().slice(0, 10)}`;
  const used = (await kv!.get<number>(dk)) ?? 0;
  if (used >= (photo ? 300 : 150)) return bad("That's today's limit of Google lookups. The free map details still work.", 429);
  await kv!.set(dk, used + 1);

  const lat = Number(b.lat), lon = Number(b.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return bad("Bad location.");
  const languageCode = b.lang === "ja" ? "ja" : "en";
  try {
    if (op === "find") {
      const name = String(b.name ?? "").slice(0, 120).trim();
      if (!name) return bad("No name.");
      const body = { textQuery: name, languageCode, maxResultCount: 1, locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: 250 } } };
      const j = await google("places:searchText", body, mask([...FULL, ...EXTRA])).catch((e) => (/field|mask|invalid/i.test(String(e)) ? google("places:searchText", body, mask(FULL)) : Promise.reject(e)));
      const g = j.places?.[0];
      // Too far from the pin: it's a different place with the same name.
      const far = g?.location && Math.hypot((g.location.latitude - lat) * 111_000, (g.location.longitude - lon) * 91_000) > 600;
      return NextResponse.json({ place: g && !far ? shape(g, true) : null });
    }
    if (op === "text") {
      const q = String(b.q ?? "").slice(0, 120).trim();
      if (!q) return bad("Type what to find.");
      const j = await google("places:searchText", { textQuery: q, languageCode, maxResultCount: 15, locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: 5000 } } }, mask(LIST));
      return NextResponse.json({ places: (j.places ?? []).map((g) => shape(g, false)) });
    }
    if (op === "nearby") {
      const types = (Array.isArray(b.types) ? b.types : []).filter((t: unknown) => typeof t === "string" && /^[a-z_]{2,40}$/.test(t)).slice(0, 50);
      if (!types.length) return NextResponse.json({ places: [] });
      const radius = Math.min(50_000, Math.max(100, Number(b.radius) || 1500));
      const j = await google("places:searchNearby", { includedTypes: types, maxResultCount: 20, rankPreference: "POPULARITY", languageCode, locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius } } }, mask(LIST));
      return NextResponse.json({ places: (j.places ?? []).map((g) => shape(g, false)) });
    }
    if (op === "photo") {
      const name = String(b.name ?? "");
      if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) return bad("Bad photo.");
      const r = await fetch(`${API}/${name}/media?maxWidthPx=800&skipHttpRedirect=true`, { headers: { "X-Goog-Api-Key": key() }, signal: AbortSignal.timeout(10_000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.photoUri) return bad("Photo not available.", 502);
      return NextResponse.json({ url: j.photoUri });
    }
    return bad("Unknown request.");
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Google didn't answer.", 502);
  }
}
