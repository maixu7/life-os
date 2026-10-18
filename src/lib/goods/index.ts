// 5,000+ things sold in Japanese supermarkets, convenience stores, drugstores
// and 100-yen shops, in English and Japanese, with calories and protein for
// food and drinks. Used to name things in What I have, to search foods, and
// to guess calories when you eat something by name.

import { KONBINI } from "./konbini";
import { SWEETS } from "./sweets";
import { GROCERY } from "./grocery";
import { PANTRY } from "./pantry";
import { DRINKS_JP } from "./drinks";
import { HOME } from "./home";
import { CHAINS } from "./chains";
import { DISHES } from "./dishes";
import { BRANDS } from "./brands";
import { SHOP100, SHOP100_MORE } from "./shop100";
import { MORE } from "./more";
import { BRANDS2 } from "./brands2";
import { WORLD } from "./world";
import { VARIETIES } from "./varieties";
import { PRODUCE } from "@/lib/produce";
import { DRINKS } from "@/lib/drinks";

export type GoodKind = "food" | "fruit" | "veg" | "drink" | "other" | "utensil";
export type Good = { name: string; ja: string; emoji: string; kind: GoodKind; per: string; kcal: number; protein: number; base: string; cat: string };
type Indexed = Good & { _en: string; _ne: string; _ja: string };
const KIND: Record<string, GoodKind> = { f: "food", r: "fruit", v: "veg", d: "drink", o: "other", u: "utensil" };

function parse(text: string): Good[] {
  const out: Good[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const [en0, ja, emoji, k, per, kcal, protein, variants] = line.split("|");
    // "*Group" lines are a shelf (Vegetables, Seasonings…): each variant is its own product name.
    const shelf = en0.startsWith("*"), en = en0.replace(/^\*/, "");
    const kind = KIND[k] ?? "other";
    const base = { emoji, kind, per: per ?? "", kcal: Number(kcal) || 0, protein: Number(protein) || 0, base: en, cat: en };
    if (!variants) { out.push({ ...base, name: en, ja }); continue; }
    for (const v of variants.split(";")) {
      const [ven, vja = "", d = ""] = v.split(":");
      if (!ven) continue;
      const delta = Number(d) || 0;
      // Protein moves a little with the calories.
      const kc = Math.max(0, base.kcal + delta);
      const name = shelf ? ven : `${en} (${ven.toLowerCase()})`;
      const jname = shelf ? vja || ven : vja ? (!ja || vja.includes(ja) ? vja : `${ja} ${vja}`) : ja;
      out.push({ ...base, name, ja: jname, kcal: kc, protein: base.kcal ? +(base.protein * (kc / base.kcal)).toFixed(1) : base.protein });
    }
  }
  return out;
}

// Katakana → hiragana and lower case, so ウインナー finds ういんなー and vice versa.
export const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/[\s・ー\-()（）]/g, "");

let cache: Indexed[] | null = null;
export function goods(): Indexed[] {
  if (cache) return cache;
  const all = [
    ...[KONBINI, SWEETS, GROCERY, PANTRY, DRINKS_JP, CHAINS, DISHES, BRANDS, BRANDS2, WORLD, VARIETIES, MORE, HOME, SHOP100, SHOP100_MORE].flatMap(parse),
    // The app's fruit, vegetable and drink tables join in too.
    ...PRODUCE.map((p): Good => ({ name: p.name, ja: p.ja ?? "", emoji: p.emoji, kind: p.kind === "fruit" ? "fruit" : "veg", per: `1 (${p.g} g)`, kcal: Math.round((p.kcal100 * p.g) / 100), protein: +((p.protein100 * p.g) / 100).toFixed(1), base: p.name, cat: p.kind === "fruit" ? "Fruit" : "Vegetable" })),
    ...DRINKS.map((d): Good => ({ name: d.name, ja: d.ja ?? "", emoji: d.emoji, kind: "drink", per: `${d.ml} ml`, kcal: Math.round((d.kcal100 * d.ml) / 100), protein: +(((d.protein100 ?? 0) * d.ml) / 100).toFixed(1), base: d.name, cat: d.cat })),
  ];
  const seen = new Set<string>();
  cache = all.filter((g) => { const k = g.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((g) => ({ ...g, _en: g.name.toLowerCase(), _ne: norm(g.name), _ja: norm(g.ja) }));
  return cache;
}


// Best matches for what you typed (English or Japanese), best first.
export function searchGoods(q: string, limit = 20, kinds?: GoodKind[]): Good[] {
  const n = norm(q);
  if (n.length < 1) return [];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: [number, Good][] = [];
  for (const g of goods()) {
    if (kinds && !kinds.includes(g.kind)) continue;
    const en = g._en, ja = g._ja, ne = g._ne;
    let s = 0;
    if (en === q.toLowerCase() || ja === n) s = 100;
    else if (en.startsWith(q.toLowerCase()) || ja.startsWith(n)) s = 60;
    else if (ne.includes(n) || ja.includes(n)) s = 40;
    else if (words.length > 1 && words.every((w) => en.includes(w))) s = 30;
    else continue;
    scored.push([s - g.name.length / 100, g]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, g]) => g);
}

// The one item a name most likely means (for calories), or undefined.
export function goodFor(name: string): Good | undefined {
  const n = norm(name);
  if (n.length < 2) return undefined;
  const all = goods();
  const food = (g: Indexed) => g.kind !== "other" && g.kind !== "utensil";
  return all.find((g) => food(g) && (g._ne === n || g._ja === n))
    ?? all.find((g) => food(g) && norm(g.base) === n)
    ?? (n.length >= 3 ? all.find((g) => food(g) && g._ja.length >= 3 && (n.includes(g._ja) || g._ja.includes(n))) : undefined);
}

export const GOODS_COUNT = () => goods().length;
