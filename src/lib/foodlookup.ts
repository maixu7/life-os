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
