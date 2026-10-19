import { guessFood, type Eaten } from "@/lib/body";
import { EQUIPMENT } from "@/lib/equipment";
import { howTo } from "@/lib/howto";
import { MOVES, type Move } from "@/lib/moves";
import { produceOf } from "@/lib/produce";
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
export const kindOf = (name: string): Kind => {
  const hit = RE.find(([, re]) => re.test(name))?.[0];
  if (hit) return hit;
  const p = name.trim().length > 2 ? produceOf(name) : undefined;
  return p ? (p.kind === "fruit" ? "fruit" : "veg") : guessFood(name) ? "food" : "other";
};

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
let byName: Map<string, Gear | null> | null = null;
const gearByName = () => (byName ??= new Map(EQUIPMENT.map((e) => [e.name, e.gear])));
export function kitOf(pantry: PantryItem[]): Kit {
  const kit: Kit = {};
  for (const p of pantry) {
    if (p.qty <= 0 || itemKind(p) !== "equipment") continue;
    // Items from the equipment list carry their real gear (a foam roller isn't an ab wheel).
    const known = gearByName().get(p.name);
    const g = known !== undefined ? (known ? GEAR.find(([x]) => x === known) : undefined) : GEAR.find(([, re]) => re.test(p.name));
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
// Which gear an item counts as (by its name); "gym" when unknown.
export const gearOf = (name: string): Gear => {
  const k = kitOf([{ id: "x", name, emoji: "", qty: 1, unit: "pcs", last_price: null, updated_at: "", kind: "equipment" }]);
  return (Object.keys(k)[0] ?? "gym") as Gear;
};
export const withGear = (kit: Kit, g: Gear) => MOVES.filter((m) => m.kind === "body" && needs(m).includes(g) && canDo(m, kit));

// A full day's workout from what you own: warm-up, one move per body part, a
// finisher and a cool-down. It changes each day.
export type PlanRow = { part: string; name: string; sets: number; reps: string; kg?: number };
// "3 × 8-12" in plain words: "3 sets of 8–12 reps", "1 round of 60 seconds".
export function setsText(sets: number, reps: string) {
  const r = String(reps).trim().replace(/-/g, "–");
  const secs = /^(\d+(?:–\d+)?)\s*s(ec(onds?)?)?$/i.exec(r);
  const what = secs ? `${secs[1]} seconds` : /^\d+(–\d+)?$/.test(r) ? `${r} ${r === "1" ? "rep" : "reps"}` : r;
  if (sets <= 1) return secs ? `1 round of ${what}` : `1 set of ${what}`;
  return `${sets} sets of ${what}`;
}
// A random number source that gives the same numbers all day, so the plan
// stays put when you reopen the app, and a new plan tomorrow.
const dayRng = (day: Date, salt = 0) => {
  let a = (Math.floor((day.getTime() - day.getTimezoneOffset() * 60_000) / 86_400_000) * 2654435761 + salt) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

/** The tools for today: one or two of what you have, a different mix each day. */
export function todayKit(kit: Kit, day = new Date()): Kit {
  const keys = (Object.keys(kit) as Gear[]).filter((g) => g !== "gym");
  if (keys.length <= 1) return kit;
  const rnd = dayRng(day, 7);
  const order = keys.map((g) => [g, rnd()] as const).sort((x, y) => x[1] - y[1]).map(([g]) => g);
  const n = keys.length >= 4 && rnd() < 0.5 ? 3 : 2;
  return Object.fromEntries(order.slice(0, n).map((g) => [g, kit[g]])) as Kit;
}

/** Today's workout: bodyweight moves plus some of your tools (not all at once).
 *  `hard` (holidays and days off) adds a set to each move, more reps and extra moves. */
export function dayPlan(kit: Kit, day = new Date(), hard = false): PlanRow[] {
  const rnd = dayRng(day);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const tools = todayKit(kit, day);
  // Sports, breathing and rest poses are great, but not plan moves.
  const all = doable(tools).filter((m) => !/badminton|tennis|basketball|football|cricket|kata|gardening|meditation|breathing|corpse|legs up the wall|mountain pose|swimming|aqua|hill sprint|stair sprint|sled|foam roll|intervals/i.test(m.name));
  const weighted = (m: Move) => needs(m).length > 0;
  // Elite skills and holds don't belong in an everyday plan.
  const HARD = /handstand|planche|one-arm|human flag|muscle-up|front lever|back lever|dragon flag|pistol|shrimp|nordic|skin the cat|l-sit|crow|wheel pose|double unders|typewriter|archer|deficit|behind-the-neck|z press|clap/i;
  const NOT_PLAN = /zumba|trampoline|^sports$|pinch|pilates|hula|wood ?chop|belt squat|hack squat|yoga|tai chi|dancing|hiking|skating|climbing|kayak|gardening|spin bike|treadmill|elliptical|wrist|seated calf|stretch|pose|kick|band|rope|cable|machine|walk|reach|shadow|boxing|jab|uppercut|hold|carry|circles|swing intervals|leg swings|flow|salutation|breathing/i;
  const strong = (ms: Move[]) => ms.filter((m) => m.type !== "time");
  // Each row flips a coin: a move with today's tools, or a bodyweight one.
  const by = (pats: string[], extra?: RegExp) => {
    const hits = all.filter((m) => pats.includes(m.pattern ?? "") && !HARD.test(m.name) && !NOT_PLAN.test(m.name) && (!extra || extra.test(`${m.name} ${m.muscles?.join(" ")}`)));
    const w = hits.filter(weighted), bw = hits.filter((m) => !weighted(m));
    return w.length && (rnd() < 0.55 || !bw.length) ? w : bw.length ? bw : hits;
  };
  const light = (g?: Gear) => (g && tools[g]?.kg.length ? Math.min(...tools[g]!.kg) : undefined);
  // A dumbbell move can be done with the kettlebell and the other way round.
  const kgFor = (m: Move) => { const n = needs(m); return light(n.find((x) => tools[x]) ?? (n.includes("dumbbell") ? "kettlebell" : n.includes("kettlebell") ? "dumbbell" : undefined)); };
  const up = (reps: string) => (hard ? reps.replace(/(\d+)-(\d+)/, (_, a, b) => `${Math.round(+a * 1.25)}-${Math.round(+b * 1.25)}`).replace(/^(\d+) s$/, (_, a) => `${Math.round(+a * 1.5)} s`) : reps);
  const used = new Set<string>();
  const row = (part: string, ms: Move[], sets: number, reps: string): PlanRow | null => {
    const left = ms.filter((m) => !used.has(m.name));
    const m = left.length ? pick(left) : undefined;
    if (!m) return null;
    used.add(m.name);
    return { part, name: m.name, sets: sets + (hard ? 1 : 0), reps: up(m.type === "time" ? "30 s" : reps), kg: weighted(m) ? kgFor(m) : undefined };
  };
  const stretches = all.filter((m) => m.pattern === "stretch" && m.type === "time" && !HARD.test(m.name));
  return [
    { part: "Warm-up", name: pick(["Jumping jacks", "Marching in place", "Arm circles", "Butt kicks", "High knees"]), sets: 1, reps: hard ? "90 s" : "60 s" },
    row("Legs", strong(by(["squat", "lunge"])), 3, "10-12"),
    row("Push", strong(by(["push", "press", "dip"], /chest|shoulder|tricep/i)), 3, "8-12"),
    row("Pull", strong(by(["pull", "row"])), 3, "8-12"),
    row("Hips", strong(by(["hinge", "bridge"])), 3, "10-15"),
    row("Arms", strong(by(["curl", "dip"], /bicep|tricep|forearm/i)), 2, "10-12"),
    row("Core", by(["plank", "crunch", "raise", "twist"]), 3, "12-15"),
    hard ? row("Legs 2", strong(by(["squat", "lunge", "hinge"])), 3, "10-12") : null,
    hard ? row("Core 2", by(["plank", "crunch", "raise", "twist"]), 3, "12-15") : null,
    row("Finisher", by(["jump", "run"]), 2, "30 s"),
    stretches.length ? { part: "Cool-down", name: pick(stretches).name, sets: 1, reps: "60 s" } : { part: "Cool-down", name: "Hamstring stretch", sets: 1, reps: "60 s" },
  ].filter((x): x is PlanRow => !!x);
}
