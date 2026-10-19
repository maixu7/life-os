import { guessFood } from "@/lib/body";
import { produceOf, sized } from "@/lib/produce";
import type { CustomItem } from "@/lib/store";

// Reads a typed meal ("big bowl of rice and readymade ramen, 2 eggs") into
// separate foods with amounts and full nutrition. Works offline; the AI
// reader (/api/food) is used first when it's switched on.

export type MealFood = { name: string; qty: number; per: string; grams?: number; kcal: number; protein: number; fat?: number; carbs?: number; sugar?: number; salt?: number; contents?: string };

// One normal serving each, from standard tables (日本食品標準成分表 for Japanese food).
type N = [name: string, re: RegExp, per: string, g: number, kcal: number, protein: number, fat: number, carbs: number, sugar: number, salt: number, contents?: string];
const DISHES: N[] = [
  ["Instant ramen (with soup)", /instant|ready ?made|cup ?noodle|maggi|nissin|chicken ramen|インスタント|カップ麺|袋麺/i, "1 pack (~100 g dry)", 100, 450, 10, 18, 62, 3, 5.5, "fried wheat noodles, soup powder, oil"],
  ["Ramen (shop)", /ramen|ラーメン|拉麺/i, "1 bowl", 600, 550, 22, 18, 70, 4, 6.5, "wheat noodles, pork broth, chashu, egg"],
  ["Udon", /udon|うどん/i, "1 bowl", 450, 330, 9, 2, 65, 3, 5, "wheat noodles, dashi soup"],
  ["Soba", /soba(?!.*yaki)|そば|蕎麦/i, "1 bowl", 450, 380, 14, 3, 70, 3, 4.5, "buckwheat noodles, dashi soup"],
  ["Yakisoba", /yaki ?soba|焼きそば/i, "1 plate", 300, 550, 13, 22, 75, 8, 4, "fried noodles, cabbage, pork, sauce"],
  ["Pasta", /pasta|spaghetti|パスタ/i, "1 plate", 350, 600, 20, 18, 85, 6, 2.5, "pasta, sauce"],
  ["Curry rice", /curry ?rice|カレーライス|カレー/i, "1 plate", 450, 750, 18, 25, 105, 8, 3, "rice, curry roux, meat, potato, carrot"],
  ["Gyudon", /gyu ?don|beef bowl|牛丼/i, "1 regular bowl", 380, 650, 20, 22, 90, 10, 3, "rice, beef, onion, sweet soy sauce"],
  ["Katsudon", /katsu ?don|カツ丼/i, "1 bowl", 450, 900, 32, 30, 115, 10, 4, "rice, pork cutlet, egg"],
  ["Fried rice", /fried rice|chahan|炒飯|チャーハン/i, "1 plate", 300, 600, 15, 22, 85, 2, 2.5, "rice, egg, oil, pork"],
  ["Onigiri", /onigiri|rice ball|おにぎり/i, "1 piece", 110, 180, 3, 0.5, 39, 0, 1, "rice, nori, filling"],
  ["Sushi", /sushi|寿司/i, "1 piece", 35, 50, 2.5, 0.5, 8, 1, 0.3, "vinegared rice, fish"],
  ["Cooked rice", /rice|gohan|ご飯|ごはん|白米|米/i, "1 bowl (150 g)", 150, 234, 3.8, 0.5, 56, 0, 0, "white rice"],
  ["Bread", /bread|toast|食パン|パン/i, "1 slice (60 g)", 60, 150, 5.3, 2.5, 28, 2.6, 0.7, "wheat flour"],
  ["Egg", /\beggs?\b|卵|たまご|玉子/i, "1 egg", 50, 76, 6.2, 5.2, 0.2, 0.2, 0.2],
  ["Natto", /natto|納豆/i, "1 pack (45 g)", 45, 90, 7.4, 4.5, 5.4, 1, 0.3, "fermented soybeans"],
  ["Tofu", /tofu|豆腐/i, "1/2 block (150 g)", 150, 110, 10, 6.5, 2, 0.5, 0, "soybeans"],
  ["Miso soup", /miso|味噌汁|みそ汁/i, "1 bowl", 180, 40, 3, 1.5, 4, 1, 1.5, "miso, tofu, wakame"],
  ["Karaage", /karaage|唐揚げ|からあげ|fried chicken/i, "5 pieces (150 g)", 150, 450, 25, 28, 15, 1, 2, "chicken, flour, oil"],
  ["Gyoza", /gyoza|餃子|dumpling/i, "6 pieces", 140, 300, 12, 15, 28, 2, 1.6, "pork, cabbage, wheat wrapper"],
  ["Chicken breast", /chicken breast|鶏むね|サラダチキン/i, "100 g", 100, 120, 23, 2, 0, 0, 0.3],
  ["Chicken", /chicken|鶏/i, "100 g", 100, 200, 17, 14, 0, 0, 0.2],
  ["Pork", /pork|豚/i, "100 g", 100, 250, 18, 19, 0, 0, 0.1],
  ["Beef", /beef|牛肉/i, "100 g", 100, 280, 17, 23, 0, 0, 0.1],
  ["Salmon", /salmon|鮭|サーモン/i, "1 fillet (80 g)", 80, 110, 18, 3.5, 0, 0, 0.2],
  ["Fish", /fish|魚|saba|鯖/i, "1 fillet (80 g)", 80, 160, 17, 10, 0, 0, 0.3],
  ["Salad", /salad|サラダ/i, "1 bowl", 100, 30, 1.5, 0.2, 5, 3, 0],
  ["Milk", /milk|牛乳/i, "1 glass (200 ml)", 200, 134, 6.6, 7.6, 9.6, 9.6, 0.2],
  ["Yogurt", /yog(h)?urt|ヨーグルト/i, "1 cup (100 g)", 100, 60, 3.6, 3, 5, 5, 0.1],
];

// Words for how much: "big bowl" ×1.6, "half" ×0.5, "2 eggs" ×2, "200 g" by weight.
const SIZE: [RegExp, number][] = [[/\b(huge|giant|extra large|tokumori)\b|特盛/i, 2], [/\b(double|two)\b|ダブル/i, 2], [/\b(big|large|oomori)\b|大盛|大/i, 1.6], [/\b(half)\b|半/i, 0.5], [/\b(small|mini|little)\b|小/i, 0.65]];
const COUNT: Record<string, number> = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5 };

export function splitMeal(text: string): string[] {
  return text.split(/\s*(?:,|\+|&|\n|;|、|と|・|\band\b|\bwith\b|\bplus\b)\s*/i).map((s) => s.trim()).filter((s) => s.length > 1);
}

export function readFood(part: string, items: CustomItem[] = []): MealFood | null {
  const words = part.toLowerCase();
  const grams = Number(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams?|グラム)\b/i.exec(part)?.[1]) || 0;
  const count = grams ? 1 : Number(/^(\d+(?:\.\d+)?)(?![\d.])\s*(?!g\b|gm|gram|ml)/i.exec(part)?.[1]) || COUNT[/^(one|a|an|two|three|four|five)\b/i.exec(words)?.[1] ?? ""] || 1;
  const mult = SIZE.find(([re]) => re.test(part))?.[1] ?? 1;
  const clean = (s: string) => s.replace(/^(\d+(?:\.\d+)?|one|a|an|two|three|four|five)\s+/i, "").replace(/\b(bowls?|plates?|cups?|packs?|of|some)\b/gi, " ").replace(/\s+/g, " ").trim();

  const d = DISHES.find(([, re]) => re.test(part));
  if (d) {
    const [name, , per, g, kcal, protein, fat, carbs, sugar, salt, contents] = d;
    const k = grams ? grams / g : mult;
    const r = (x: number) => Math.round(x * k * 10) / 10;
    return { name, qty: count, per: grams ? `${grams} g` : k === 1 ? per : `${per} × ${k}`, kcal: Math.round(kcal * k), protein: r(protein), fat: r(fat), carbs: r(carbs), sugar: r(sugar), salt: r(salt), contents };
  }
  const pr = produceOf(clean(part));
  if (pr) {
    const s = sized(pr, mult > 1.2 ? "Large" : mult < 0.9 ? "Small" : "Medium");
    return { name: pr.name, qty: count, per: `${pr.name.toLowerCase()} (~${s.g} g)`, kcal: s.kcal, protein: s.protein, fat: s.fat, carbs: s.carbs, sugar: s.sugar };
  }
  const f = guessFood(part, items);
  if (f) return { name: f.name, qty: count, per: mult === 1 ? f.per : `${f.per} × ${mult}`, kcal: Math.round(f.kcal * mult), protein: Math.round(f.protein * mult * 10) / 10, contents: f.contents };
  return null;
}

// The whole meal: every part it recognises, plus the parts it doesn't (named
// but with no numbers, so you can fill them in).
export function readMealText(text: string, items: CustomItem[] = []): { foods: MealFood[]; unknown: string[] } {
  const foods: MealFood[] = [], unknown: string[] = [];
  for (const p of splitMeal(text)) {
    const f = readFood(p, items);
    if (f) foods.push(f); else unknown.push(p);
  }
  return { foods, unknown };
}
