import { guessFood, type Eaten } from "@/lib/body";
import { howTo } from "@/lib/howto";
import { MOVES, type Move } from "@/lib/moves";
import type { Log, PantryItem } from "@/lib/store";

// "What I have": food, fruit, drinks, books and gym equipment at home, and
// what each one means for the rest of the app (meals, training, learning).

export type Kind = "food" | "fruit" | "veg" | "drink" | "book" | "equipment" | "other";
export const KINDS: [Kind, string, string][] = [
  ["food", "🍱", "Food"], ["fruit", "🍎", "Fruit"], ["veg", "🥦", "Vegetables"], ["drink", "🥤", "Drinks"],
  ["book", "📚", "Books"], ["equipment", "🏋️", "Equipment"], ["other", "📦", "Other"],
];

const RE: [Kind, RegExp][] = [
  ["equipment", /dumb+bel|kettle|kettel|kendal+ ?bel|k-?bell|barbell|\bbar\b|plate|pull.?up|chin.?up|dip (bar|station)|bench|resistance band|\bband\b|skipping|jump rope|yoga mat|\bmat\b|ab wheel|roller|\brings?\b|treadmill|exercise bike|cycle|weight vest|medicine ball|foam roll|push.?up (bar|handle)|grip|hand gripper/i],
  ["book", /book|novel|manga|textbook|notebook|dictionary|guide|workbook|本|教科書/i],
  ["fruit", /apple|banana|orange|mango|grape|melon|berr|pineapple|papaya|guava|kiwi|peach|pear|plum|cherry|lemon|lime|persimmon|kaki|mikan|pomegranate|fig|date|fruit/i],
  ["veg", /spinach|broccoli|carrot|cabbage|lettuce|tomato|cucumber|onion|potato|pepper|capsicum|eggplant|brinjal|okra|bean sprout|kale|radish|daikon|pumpkin|kabocha|mushroom|veg|greens|komatsuna|negi|sweet potato|corn/i],
  ["drink", /water|juice|milk|cola|soda|tea|coffee|drink|pocari|aquarius|beer|sake|yakult|smoothie|shake|calpis/i],
];
export const kindOf = (name: string): Kind => RE.find(([, re]) => re.test(name))?.[0] ?? (guessFood(name) ? "food" : "other");

// MobileNet labels that mean a kind (from a photo).
const SEEN: [RegExp, Kind, string][] = [
  [/dumbbell/i, "equipment", "Dumbbell"], [/barbell/i, "equipment", "Barbell"], [/horizontal bar|parallel bars/i, "equipment", "Pull-up bar"],
  [/book|comic|binder|notebook/i, "book", "Book"], [/granny smith|apple/i, "fruit", "Apple"], [/banana/i, "fruit", "Banana"], [/orange/i, "fruit", "Orange"],
  [/lemon/i, "fruit", "Lemon"], [/strawberry/i, "fruit", "Strawberries"], [/pineapple/i, "fruit", "Pineapple"], [/pomegranate/i, "fruit", "Pomegranate"], [/fig/i, "fruit", "Figs"],
  [/broccoli/i, "veg", "Broccoli"], [/cucumber/i, "veg", "Cucumber"], [/bell pepper/i, "veg", "Bell pepper"], [/mushroom|agaric/i, "veg", "Mushrooms"], [/cabbage/i, "veg", "Cabbage"], [/corn/i, "veg", "Corn"],
  [/water bottle|pop bottle|beer bottle|wine bottle|water jug/i, "drink", "Bottle"], [/coffee|espresso|cup/i, "drink", "Coffee"],
  [/mat\b|prayer rug/i, "equipment", "Mat"], [/rope/i, "equipment", "Skipping rope"], [/bicycle|tricycle/i, "equipment", "Bicycle"],
];
export const fromPhoto = (seen: string[]) => {
  for (const s of seen) { const hit = SEEN.find(([re]) => re.test(s)); if (hit) return { kind: hit[1], name: hit[2] }; }
  return null;
};
export const itemKind = (p: PantryItem): Kind => (p.kind as Kind) || kindOf(p.name);

// ---------- Food ----------
export const haveFoods = (pantry: PantryItem[]) => pantry.filter((p) => p.qty > 0 && ["food", "fruit", "veg", "drink"].includes(itemKind(p)));

export function whenToEat(name: string): string {
  const k = kindOf(name);
  if (/egg|oat|milk|yogh?urt|curd|bread|cereal/i.test(name)) return "🌅 Breakfast: protein to start the day";
  if (/nut|almond|cashew|peanut|seed/i.test(name)) return "🕓 4 PM snack, a small handful";
  if (/chicken|fish|meat|mutton|paneer|tofu|dal|bean|chana|rajma|soy/i.test(name)) return "🍱 Lunch or dinner, or after training";
  if (/chocolate|biscuit|cookie|chips|cake|candy|ice ?cream|sweet|soda|cola/i.test(name)) return "⚠️ Only sometimes, a small amount after a meal";
  if (k === "fruit") return "🌅 Morning or 🕓 afternoon snack (not late at night)";
  if (k === "veg") return "🍱 With lunch and dinner: half your plate";
  if (k === "drink") return /coffee|tea|energy/i.test(name) ? "☕ Before 2 PM so it doesn't spoil sleep" : "💧 Through the day";
  return "🍽️ With a meal";
}

// Foods eaten in the last two weeks, most recent first.
export function recentFoods(logs: Log[], days = 14) {
  const since = Date.now() - days * 86_400_000;
  const out: string[] = [];
  for (const l of [...logs].reverse()) {
    if (new Date(l.created_at).getTime() < since) break;
    for (const f of (l.data.foods as Eaten[] | undefined) ?? []) if (f.name && !out.includes(f.name)) out.push(f.name);
  }
  return out;
}

const same = (a: string, b: string) => { const x = a.toLowerCase().trim(), y = b.toLowerCase().trim(); return x === y || x.replace(/s$/, "") === y.replace(/s$/, ""); };
// Eating something you have uses it up.
export const takeFromPantry = (pantry: PantryItem[], foods: Eaten[]) =>
  pantry.map((p) => {
    const f = foods.find((x) => same(x.name, p.name));
    return f ? { ...p, qty: Math.max(0, +(p.qty - (f.qty || 1)).toFixed(2)), updated_at: new Date().toISOString() } : p;
  });

// ---------- Equipment ----------
export type Gear = "dumbbell" | "kettlebell" | "barbell" | "bar" | "dip" | "bench" | "band" | "rope" | "mat" | "wheel" | "rings" | "bike" | "gym";
const GEAR: [Gear, RegExp, string][] = [
  ["dumbbell", /dumb+bel/i, "Dumbbells"], ["kettlebell", /kettle|kettel|kendal+ ?bel|k-?bell/i, "Kettlebells"], ["barbell", /barbell|plate|ez.?bar/i, "Barbell"],
  ["bar", /pull.?up|chin.?up|door(way)? bar|\bbar\b(?!bell)/i, "Pull-up bar"], ["dip", /dip/i, "Dip bars"], ["bench", /bench/i, "Bench"],
  ["band", /band/i, "Resistance band"], ["rope", /rope|skipping/i, "Skipping rope"], ["mat", /\bmat\b/i, "Mat"], ["wheel", /ab wheel|roller/i, "Ab wheel"],
  ["rings", /\brings?\b/i, "Rings"], ["bike", /bike|cycle|bicycle/i, "Bike"], ["gym", /gym/i, "Gym membership"],
];
export type Kit = Partial<Record<Gear, { count: number; kg: number[]; label: string }>>;
export function kitOf(pantry: PantryItem[]): Kit {
  const kit: Kit = {};
  for (const p of pantry) {
    if (p.qty <= 0 || itemKind(p) !== "equipment") continue;
    const g = GEAR.find(([, re]) => re.test(p.name));
    if (!g) continue;
    const k = (kit[g[0]] ??= { count: 0, kg: [], label: g[2] });
    k.count += p.qty;
    const w = p.kg ?? Number(p.name.match(/(\d+(?:\.\d+)?)\s*kg/i)?.[1] ?? 0);
    if (w) for (let i = 0; i < p.qty; i++) k.kg.push(w);
  }
  return kit;
}
export const kitText = (k: Kit) => Object.values(k).map((g) => {
  if (!g!.kg.length) return `${g!.count > 1 ? `${g!.count} × ` : ""}${g!.label.toLowerCase()}`;
  const tot = g!.kg.reduce((a, b) => a + b, 0);
  const each = [...new Set(g!.kg)];
  return `${tot} kg of ${g!.label.toLowerCase()} (${each.length === 1 ? `${each[0]} kg × ${g!.kg.length}` : g!.kg.join(" + ") + " kg"})`;
}).join(", ");

const MACHINE = /cable|machine|pulldown|leg press|leg curl|leg extension|smith|pec deck|rowing|\berg\b|elliptical|treadmill|sled|battle rope|hack squat|glute ham|face pull|pallof|landmine|meadows|ladder|tyre|tire|sledge|wall ball|ball slam|swimming|cycling|spin bike|skating|kayak|climbing/i;
// What an exercise needs. Weight exercises can use any free weight.
export function needs(m: Move): Gear[] {
  const n = m.name;
  if (MACHINE.test(n)) return /cycl|spin bike/i.test(n) ? ["bike"] : ["gym"];
  if (/skipping|jump rope/i.test(n)) return ["rope"];
  if (/ab wheel/i.test(n)) return ["wheel"];
  if (/ring/i.test(n)) return ["rings"];
  const h = howTo(m);
  const out: Gear[] = [];
  if (h.prop === "kettlebell" || /kettle/i.test(n)) out.push("kettlebell");
  else if (h.prop === "barbell") out.push("barbell");
  else if (h.prop === "dumbbell") out.push("dumbbell");
  if (["pull", "chinup", "widepull"].includes(h.pose ?? "") || /pull.?up|chin|muscle.?up|hang|toes.?to.?bar|lever|skin the cat|scap/i.test(n)) out.push("bar");
  if (/^dips?$|parallel/i.test(n)) out.push("dip");
  return out;
}
// Free weights can stand in for each other.
const SWAP: Partial<Record<Gear, Gear[]>> = { dumbbell: ["kettlebell"], kettlebell: ["dumbbell"], barbell: [], dip: ["bench"] };
export const canDo = (m: Move, kit: Kit) => needs(m).every((g) => kit[g] || (SWAP[g] ?? []).some((s) => kit[s]));

export const doable = (kit: Kit) => MOVES.filter((m) => m.kind === "body" && canDo(m, kit));
export const withGear = (kit: Kit, g: Gear) => MOVES.filter((m) => m.kind === "body" && needs(m).includes(g) && canDo(m, kit));

// A full day's workout from what you own: warm-up, one move per body part, a
// finisher and a cool-down. It changes each day.
export type PlanRow = { part: string; name: string; sets: number; reps: string; kg?: number };
export function dayPlan(kit: Kit, day = new Date()): PlanRow[] {
  const seed = Math.floor(day.getTime() / 86_400_000);
  const pick = <T,>(xs: T[], i = 0) => xs[(seed + i) % Math.max(1, xs.length)];
  const all = doable(kit);
  const weighted = (m: Move) => needs(m).some((g) => g === "dumbbell" || g === "kettlebell" || g === "barbell");
  const by = (re: RegExp, pref = true) => {
    const hits = all.filter((m) => re.test(`${m.pattern} ${howTo(m).pose} ${m.muscles?.join(" ")}`));
    const w = hits.filter(weighted);
    return pref && w.length ? w : hits;
  };
  const light = (g?: Gear) => (g && kit[g]?.kg.length ? Math.min(...kit[g]!.kg) : undefined);
  const kgFor = (m: Move) => { const g = needs(m).find((x) => kit[x]) ?? (needs(m).includes("dumbbell") ? "kettlebell" : needs(m).includes("kettlebell") ? "dumbbell" : undefined); return light(g as Gear | undefined); };
  const row = (part: string, ms: Move[], sets: number, reps: string, i: number): PlanRow | null => {
    const m = pick(ms, i);
    return m ? { part, name: m.name, sets, reps: m.type === "time" ? "30 s" : reps, kg: weighted(m) ? kgFor(m) : undefined } : null;
  };
  return [
    { part: "Warm-up", name: "Jumping jacks", sets: 1, reps: "60 s" },
    row("Legs", by(/squat|lunge|Quads/), 3, "10-12", 1),
    row("Push", by(/push|press|benchpress|ohpress|Chest/), 3, "8-12", 2),
    row("Pull", by(/pull|row|chinup|widepull|Back|Lats/), 3, "8-12", 3),
    row("Hips", by(/hinge|swing|deadlift|bridge|hipthrust|Glutes|Hamstrings/), 3, "10-15", 4),
    row("Arms", by(/curl|Biceps|Triceps|dip/), 2, "10-12", 5),
    row("Core", by(/plank|crunch|situp|raise|twist|flutter|Abs|Core/, false), 3, "12-15", 6),
    row("Finisher", by(/jump|burpee|climber|highknee|swing|run/, false), 2, "30 s", 7),
    { part: "Cool-down", name: "Hamstring stretch", sets: 1, reps: "60 s" },
  ].filter((x): x is PlanRow => !!x);
}
