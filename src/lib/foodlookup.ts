import type { FactKey, Facts } from "@/lib/label";
// Looks a food up on Open Food Facts (free, open database) to fill in
// calories, protein and ingredients automatically.

export type FoodFacts = { name: string; kcal100: number; protein100: number; serving?: string; kcalServing?: number; proteinServing?: number; contents?: string };

export async function lookupFood(q: string): Promise<FoodFacts | null> {
  if (q.trim().length < 2) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,ingredients_text,serving_size`;
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { products?: { product_name?: string; nutriments?: Record<string, number>; ingredients_text?: string; serving_size?: string }[] };
    const p = j.products?.find((x) => x.nutriments?.["energy-kcal_100g"]);
    if (!p?.nutriments) return null;
    const n = p.nutriments;
    return {
      name: p.product_name || q, kcal100: Math.round(n["energy-kcal_100g"]), protein100: +(n.proteins_100g ?? 0).toFixed(1),
      serving: p.serving_size, kcalServing: n["energy-kcal_serving"] ? Math.round(n["energy-kcal_serving"]) : undefined,
      proteinServing: n.proteins_serving ? +n.proteins_serving.toFixed(1) : undefined, contents: p.ingredients_text?.slice(0, 200),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Looks a packet up by its barcode number (JAN/EAN) on Open Food Facts.
export async function lookupBarcode(code: string): Promise<FoodFacts | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ja,nutriments,ingredients_text,serving_size`, { signal: ctl.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { product?: { product_name?: string; product_name_ja?: string; nutriments?: Record<string, number>; ingredients_text?: string; serving_size?: string } };
    const p = j.product, n = p?.nutriments;
    if (!p || !n?.["energy-kcal_100g"]) return null;
    return {
      name: p.product_name || p.product_name_ja || code, kcal100: Math.round(n["energy-kcal_100g"]), protein100: +(n.proteins_100g ?? 0).toFixed(1),
      serving: p.serving_size, kcalServing: n["energy-kcal_serving"] ? Math.round(n["energy-kcal_serving"]) : undefined,
      proteinServing: n.proteins_serving ? +n.proteins_serving.toFixed(1) : undefined, contents: p.ingredients_text?.slice(0, 200),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Everything the open database knows about one barcode: name, brand, size, picture, all nutrition (per 100 g/ml), ingredients, allergens. */
export type Product = { code: string; name: string; brand?: string; size?: string; image?: string; facts: Facts; contents?: string; allergens?: string; serving?: string };

// Open Food Facts nutrient names → the app's fields (it stores grams; the app shows mg where labels do).
const OFF: [FactKey, string, number][] = [
  ["kcal", "energy-kcal", 1], ["protein", "proteins", 1], ["fat", "fat", 1], ["satfat", "saturated-fat", 1], ["transfat", "trans-fat", 1],
  ["cholesterol", "cholesterol", 1000], ["carbs", "carbohydrates", 1], ["sugar", "sugars", 1], ["fiber", "fiber", 1], ["sodium", "sodium", 1000],
  ["salt", "salt", 1], ["caffeine", "caffeine", 1000], ["calcium", "calcium", 1000], ["iron", "iron", 1000], ["potassium", "potassium", 1000], ["vitc", "vitamin-c", 1000],
];

const FIELDS = "code,product_name,product_name_ja,product_name_en,brands,quantity,image_front_small_url,nutriments,ingredients_text,ingredients_text_ja,ingredients_text_en,allergens_tags,serving_size";

function toProduct(p: Record<string, unknown> | undefined, code: string): Product | null {
  const s = (k: string) => (typeof p?.[k] === "string" && (p[k] as string).trim() ? (p[k] as string).trim() : undefined);
  const name = s("product_name") || s("product_name_en") || s("product_name_ja");
  if (!p || !name) return null;
  const n = (p.nutriments ?? {}) as Record<string, number>, facts: Facts = {};
  for (const [k, off, x] of OFF) { const v = n[`${off}_100g`]; if (typeof v === "number" && isFinite(v)) facts[k] = Math.round(v * x * 100) / 100; }
  const allergens = Array.isArray(p.allergens_tags) ? (p.allergens_tags as string[]).map((a) => a.replace(/^\w+:/, "").replace(/-/g, " ")).filter((a) => a !== "none").join(", ") : "";
  return {
    code: s("code") ?? code, name, brand: s("brands")?.split(",")[0], size: s("quantity"), image: s("image_front_small_url"), facts,
    contents: s("ingredients_text") || s("ingredients_text_en") || s("ingredients_text_ja"), allergens: allergens || undefined, serving: s("serving_size"),
  };
}

async function off<T>(url: string, read: (j: T) => Product | null): Promise<Product | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? read((await r.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** The exact product for a barcode. */
export const productByBarcode = (code: string) =>
  off<{ product?: Record<string, unknown> }>(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, (j) => toProduct(j.product, code));

/** The closest product for a name (found some other way): the first one that lists what it contains. */
export const productByName = (q: string) =>
  off<{ products?: Record<string, unknown>[] }>(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=${FIELDS}`,
    (j) => (j.products ?? []).map((p) => toProduct(p, "")).find((p) => p && Object.keys(p.facts).length > 2) ?? null);
