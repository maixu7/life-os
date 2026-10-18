import { groupsOf, type Group } from "@/lib/care";
import type { Drink } from "@/lib/drinks";
import type { Move } from "@/lib/moves";
import { produceOf } from "@/lib/produce";
import { judge } from "@/lib/tasks";

// How good each thing is for a long, healthy life: a score from 1 to 10, what
// it is rich in (best at) and what it is poor in or too high in.

export type Goodness = { score: number; rich: string[]; poor: string[] };

const RICH: Partial<Record<Group, string[]>> = {
  veg: ["Fibre", "Vitamins A, C, K", "Potassium"], fruit: ["Vitamin C", "Fibre", "Antioxidants"], egg: ["Protein", "Vitamin B12", "Vitamin D", "Choline"],
  dairy: ["Calcium", "Protein", "Vitamin B12"], meat: ["Protein", "Iron", "Zinc", "Vitamin B12"], fish: ["Omega-3", "Protein", "Vitamin D"],
  legume: ["Protein", "Fibre", "Iron", "Folate"], grain: ["Fibre", "Slow energy", "Magnesium"], nuts: ["Healthy fats", "Vitamin E", "Magnesium"],
};
const BASE: Partial<Record<Group, number>> = { veg: 9, fruit: 8, legume: 8, fish: 8, egg: 7, nuts: 7, grain: 7, dairy: 7, meat: 6, sweets: 2, fried: 2, sugary: 2 };

type FoodLike = { name: string; kcal?: number; protein?: number; fat?: number; carbs?: number; sugar?: number; salt?: number; contents?: string; qty?: number };
export function foodGoodness(f: FoodLike): Goodness {
  const q = f.qty || 1;
  const per = (x?: number) => (x == null ? undefined : x / q);
  const p = f.name.trim().length > 2 ? produceOf(f.name) : undefined;
  const groups = groupsOf({ name: f.name, contents: f.contents });
  const rich = new Set<string>(p?.vit ?? []);
  for (const g of groups) for (const r of RICH[g] ?? []) rich.add(r);
  const poor: string[] = [];
  let score = p ? (p.kind === "fruit" ? 8 : 9) : Math.max(5, ...groups.map((g) => BASE[g] ?? 5));
  if (groups.some((g) => g === "sweets" || g === "fried" || g === "sugary")) score = Math.min(score, 3);
  const prot = per(f.protein), sugar = per(f.sugar), salt = per(f.salt), fat = per(f.fat), kcal = per(f.kcal);
  if (prot != null && prot >= 10) { rich.add("Protein"); score += 1; }
  if (sugar != null && sugar >= 15) { poor.push(`High sugar (${Math.round(sugar)} g)`); score -= 2; }
  if (salt != null && salt >= 1.5) { poor.push(`High salt (${salt.toFixed(1)} g)`); score -= 1; }
  if (fat != null && fat >= 15) { poor.push(`High fat (${Math.round(fat)} g)`); score -= 1; }
  if (kcal && kcal >= 300 && (prot ?? 0) < 5) { poor.push("Empty calories (energy, little nutrition)"); score -= 1; }
  if (groups.includes("sweets")) poor.push("Sugar and white flour, few vitamins");
  if (groups.includes("fried")) poor.push("Fried fat and salt, little fibre");
  if (groups.includes("sugary")) poor.push("Liquid sugar");
  if (!p && !groups.some((g) => ["veg", "fruit", "legume", "grain"].includes(g)) && !poor.length) poor.push("Little fibre");
  if (/ショートニング|shortening|margarine|パーム油|palm oil|果糖ぶどう糖液糖|high.?fructose/i.test(f.contents ?? "")) { poor.push("Processed fats or syrup in the packet"); score -= 1; }
  return { score: clamp(score), rich: [...rich].slice(0, 5), poor: poor.slice(0, 4) };
}

const DRINK: Record<string, [number, string[], string[]]> = {
  water: [10, ["Hydration"], []], tea: [8, ["Hydration", "Antioxidants"], []], coffee: [7, ["Focus (caffeine)", "Antioxidants"], ["Caffeine: max 400 mg a day, none after 2 PM"]],
  milk: [8, ["Calcium", "Protein", "Vitamin B12"], []], "plant milk": [7, ["Plant protein (soy)", "Calcium if fortified"], []], sports: [5, ["Electrolytes when sweating"], ["Sugar when not exercising"]],
  energy: [2, ["Short energy boost"], ["Sugar and lots of caffeine", "Bad for sleep and heart"]], soda: [2, [], ["Liquid sugar", "No nutrition"]],
  juice: [4, ["Vitamin C"], ["Sugar without the fruit's fibre"]], smoothie: [6, ["Vitamins", "Some fibre"], ["Easy to drink a lot of sugar"]],
  "yogurt drink": [6, ["Probiotics", "Calcium"], ["Often sweetened"]], protein: [7, ["Protein for muscle"], ["Not needed if food has enough protein"]],
  soup: [7, ["Hydration", "Minerals"], ["Often salty"]], alcohol: [1, [], ["Alcohol harms liver, brain and sleep", "Empty calories"]], other: [5, [], []],
};
export function drinkGoodness(d: Drink, ml = d.ml): Goodness {
  const [s, rich, poor] = DRINK[d.cat] ?? [5, [], []];
  let score = s;
  const sugar = (d.sugar100 * ml) / 100;
  const out = [...poor];
  if (sugar >= 25) { score -= 2; out.unshift(`${Math.round(sugar)} g sugar (a whole day's ideal)`); } else if (sugar >= 10) { score -= 1; out.unshift(`${Math.round(sugar)} g sugar`); }
  if (d.sugar100 === 0 && d.cat !== "water" && d.cat !== "alcohol") score += 1;
  return { score: clamp(score), rich, poor: out };
}

export function moveGoodness(m: Move): Goodness {
  const score = m.kind === "body" ? (m.type === "time" && /run|walk|cycl|swim/i.test(m.name) ? 10 : 9) : 9;
  return { score, rich: [...m.body, ...m.mind].slice(0, 5), poor: m.science ? [] : [] };
}

export function taskGoodness(name: string): Goodness {
  const j = judge(name);
  return { score: j.deed === "good" ? 8 : j.deed === "bad" ? 2 : 5, rich: j.deed !== "bad" ? [j.why] : [], poor: j.deed === "bad" ? [j.why] : [] };
}

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
export const scoreColor = (s: number) => (s >= 8 ? "text-emerald-300" : s >= 5 ? "text-amber-300" : "text-rose-300");

// What a long, healthy life needs each day and week (WHO, Japan MHLW and
// large long-term studies).
export const LONG_LIFE: [string, string, string][] = [
  ["🥦", "Vegetables", "350 g a day (about 5 handfuls), half of them green or coloured"],
  ["🍎", "Fruit", "200 g a day (1 to 2 pieces), whole fruit, not juice"],
  ["🍗", "Protein", "0.8 to 1.6 g per kg body weight, spread over meals"],
  ["🌾", "Fibre", "21 g or more a day: vegetables, beans, oats, brown rice"],
  ["🐟", "Fish", "2 times a week for omega-3"],
  ["🍬", "Sugar", "under 25 g of added sugar a day"],
  ["🧂", "Salt", "under 7.5 g a day"],
  ["💧", "Water", "1.5 to 2.5 L a day, more when hot or training"],
  ["😴", "Sleep", "7 to 9 hours, same times every day"],
  ["🚶", "Steps", "8,000 or more a day"],
  ["❤️", "Cardio", "150 minutes a week of brisk walking, running or cycling"],
  ["🏋️", "Strength", "2 or more days a week, all big muscles"],
  ["🧠", "Learning", "Keep learning new skills: protects the brain with age"],
  ["🤝", "People", "Talk to family and friends often: loneliness shortens life"],
  ["🚭", "Avoid", "No smoking, little or no alcohol, less sitting and late-night screens"],
];
