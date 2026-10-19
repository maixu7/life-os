import type { Pick as Choice } from "@/components/SnapChoice";
import { FOODS } from "@/lib/body";
import { CHAIN_DISHES } from "@/lib/cheapeats";
import type { Data } from "@/lib/store";

export type FoodNums = { per: string; kcal: number; protein: number };

// The app's own food list for photos: your foods, food in What I have,
// everyday foods and chain-shop dishes, with their numbers.
export function foodPicks(d: Pick<Data, "items" | "pantry">): { picks: Choice[]; nums: Map<string, FoodNums> } {
  const nums = new Map<string, FoodNums>();
  const picks: Choice[] = [];
  for (const i of d.items.filter((x) => x.category === "food")) { picks.push({ name: i.name, emoji: String(i.config.emoji ?? "🍽️"), mine: true }); if (Number(i.config.kcal)) nums.set(i.name, { per: String(i.config.per ?? "1 serving"), kcal: Number(i.config.kcal), protein: Number(i.config.protein) || 0 }); }
  for (const p of d.pantry.filter((x) => x.qty > 0 && x.kind !== "equipment" && x.kind !== "book")) { picks.push({ name: p.name, emoji: p.emoji, ja: p.ja, sub: "in What I have", mine: true }); if (p.kcal) nums.set(p.name, { per: p.per ?? "1 serving", kcal: p.kcal, protein: p.protein ?? 0 }); }
  for (const f of FOODS) { picks.push({ name: f.name, emoji: f.emoji, sub: `${f.kcal} kcal per ${f.per}` }); nums.set(f.name, f); }
  for (const c of CHAIN_DISHES) { const name = `${c.name} (${c.chain})`; picks.push({ name, emoji: "🍱", ja: c.ja, sub: `${c.kcal} kcal` }); nums.set(name, { per: "1 serving", kcal: c.kcal, protein: c.protein }); }
  return { picks, nums };
}
