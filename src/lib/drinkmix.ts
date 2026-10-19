// Home-made, street and café drinks built from their recipes, so every variant
// (milk × sweetener × add-in) gets numbers that add up.
//
// Each component is [kcal, sugar g, protein g, caffeine mg] per 100 g or ml, plus
// the ml it adds per g (0 for things that dissolve or are strained out).
// Sources, rounded: milks USDA FDC / MEXT 2020 / IFCT 2017 / Amul labels; espresso
// 212 mg caffeine per 100 ml, brewed coffee 40 mg (USDA); black tea leaf ≈ 20 mg
// caffeine extracted per g (USDA brewed tea 20 mg/100 ml from ~1 g/100 ml);
// matcha 3.2 g caffeine per 100 g (MEXT); 1 tsp sugar = 4 g = 16 kcal; 1 tsp
// jaggery = 5 g; 1 tsp honey = 7 g; fruit pulp per 100 g raw and pressed juices
// per 100 ml (USDA / MEXT); protein powders from typical 30 g scoop labels.
// Per-100 ml values are total nutrients ÷ total volume of the finished serving.

import type { Drink, DrinkCat } from "@/lib/drinks";

type C = readonly [kcal: number, sugar: number, protein: number, caffeine: number, vol: number];
type Part = readonly [C, number]; // component, g or ml in one serving
type Parts = readonly Part[];

const c = (kcal: number, sugar: number, protein = 0, caffeine = 0, vol = 1): C => [kcal, sugar, protein, caffeine, vol];

// ── Liquids (per 100 ml) ──
const WATER = c(0, 0);
const ICE = WATER; // melted ice in an iced drink
const SODA = WATER;
const WHOLE = c(61, 5.0, 3.2); // 3.25 % fat, USDA / MEXT 普通牛乳
const TONED = c(58, 4.7, 3.1); // 3 % fat, Amul Taaza
const LOWFAT = c(46, 5.0, 3.4); // 1–1.5 % fat, USDA 1 % / MEXT 低脂肪乳
const SKIM = c(34, 5.1, 3.4); // USDA nonfat
const BUFFALO = c(97, 4.9, 3.8); // USDA / IFCT buffalo milk
const SOY = c(43, 1.5, 3.6); // unsweetened, MEXT 無調整豆乳
const OAT = c(55, 3.5, 1.0); // Oatly-type
const ALMOND = c(15, 0, 0.5); // unsweetened
const COCONUT_WATER = c(19, 2.6, 0.7);
const ESPRESSO = c(9, 0, 0.1, 212);
const BREWED = c(1, 0, 0.1, 40);
const COLD_BREW = c(2, 0, 0.1, 55);
const DECOCTION = c(5, 0, 0.3, 200); // South Indian filter coffee decoction
const LEMON = c(22, 2.5, 0.4); // lemon juice
const LIME = c(25, 1.7, 0.4); // lime juice
const ROSE_SYRUP = c(290, 72, 0, 0, 1); // Rooh Afza type
const KHUS_SYRUP = c(260, 65, 0, 0, 1);
const FLAVOUR_SYRUP = c(270, 67, 0, 0, 1); // vanilla / caramel / hazelnut café syrup (1 pump ≈ 7.5 ml)
const CHOC_SAUCE = c(256, 51, 2.6, 13, 0.75);
const BROWN_SUGAR_SYRUP = c(280, 70, 0, 0, 0.75);

// ── Solids (per 100 g) ──
const SUGAR = c(400, 100, 0, 0, 0);
const JAGGERY = c(380, 85, 0.4, 0, 0);
const HONEY = c(304, 82, 0.3, 0, 0.7);
const CONDENSED = c(321, 54, 7.9, 0, 0.77);
const TEA_LEAF = c(50, 0, 0, 2000, 0); // black tea, what a brew extracts
const GREEN_LEAF = c(50, 0, 0, 1500, 0);
const OOLONG_LEAF = c(50, 0, 0, 1700, 0);
const MATCHA = c(324, 0.5, 29.6, 3200, 0);
const HOJICHA_POWDER = c(300, 0.5, 24, 1500, 0);
const INSTANT = c(353, 0, 12.2, 3140, 0);
const COCOA = c(228, 1.8, 19.6, 230, 0);
const TARO_POWDER = c(410, 55, 2, 0, 0);
const PEARLS = c(155, 10, 0, 0, 1); // cooked tapioca pearls in syrup
const SPICE = c(300, 2, 10, 0, 0); // chai masala, cardamom, turmeric, ginger (small amounts)
const GINGER = c(80, 1.7, 1.8, 0, 0);
const ALMONDS = c(579, 4.4, 21.2, 0, 0.5);
const NUT_MIX = c(580, 4, 20, 0, 0.5); // almonds, cashews, pistachio, melon seeds
const RAGI = c(328, 0.6, 7.3, 0, 0.6);
const SATTU = c(380, 3, 22, 0, 0.6);
const OATS = c(379, 1, 13.2, 0, 1);
const PB = c(590, 9, 22, 0, 1);
const ICE_CREAM = c(207, 21.2, 3.5, 0, 1);
const OREO = c(480, 38, 5, 0, 0.8);
const YOGURT = c(61, 4.7, 3.5); // whole-milk dahi
const LOWFAT_YOGURT = c(56, 4.5, 3.3); // toned-milk dahi
const BUFFALO_YOGURT = c(95, 4.5, 3.8);
const GREEK = c(59, 3.2, 10.3); // nonfat Greek
const CREAM = c(195, 3.7, 2.7); // malai / light cream
const WHEY = c(400, 6.7, 80, 0, 0.7); // 30 g: 120 kcal, 24 g protein
const ISOLATE = c(367, 1.7, 87, 0, 0.7);
const PLANT = c(383, 3, 70, 0, 0.7); // pea/rice blend
const CASEIN = c(364, 3, 73, 0, 0.7);

// Fruit pulp per 100 g raw (USDA / MEXT / IFCT).
const F = {
  banana: c(89, 12.2, 1.1), mango: c(60, 13.7, 0.8), alphonso: c(65, 14.5, 0.8), chikoo: c(83, 14.7, 0.4),
  strawberry: c(32, 4.9, 0.7), blueberry: c(57, 10, 0.7), berries: c(48, 7, 0.9), raspberry: c(52, 4.4, 1.2),
  papaya: c(43, 7.8, 0.5), sitaphal: c(94, 17, 2.1), apple: c(52, 10.4, 0.3), avocado: c(160, 0.7, 2),
  dates: c(277, 66.5, 1.8, 0, 0.8), anjeer: c(249, 47.9, 3.3, 0, 0.8), muskmelon: c(34, 7.9, 0.8), lychee: c(66, 15.2, 0.8),
  malai: c(100, 3, 1.5), kiwi: c(61, 9, 1.1), pineapple: c(50, 9.9, 0.5), peach: c(39, 8.4, 0.9),
  orange: c(47, 9.4, 0.9), cherry: c(63, 12.8, 1.1), dragon: c(60, 8, 1.2), guava: c(68, 8.9, 2.6),
  pomegranate: c(83, 13.7, 1.7), watermelon: c(30, 6.2, 0.6), honeydew: c(36, 8.1, 0.5), jamun: c(60, 12, 0.7),
  passion: c(97, 11.2, 2.2), pear: c(57, 9.8, 0.4), spinach: c(23, 0.4, 2.9), rawMango: c(44, 4, 0.7),
  bael: c(137, 15, 1.8), tamarind: c(239, 57.4, 2.8, 0, 0.5),
};

// Pressed juices per 100 ml (USDA / MEXT straight juice).
const J = {
  orange: c(45, 8.4, 0.7), mosambi: c(42, 8, 0.5), mikan: c(45, 10.2, 0.5), grapefruit: c(39, 7.4, 0.5),
  pomegranate: c(54, 12.7, 0.2), apple: c(46, 9.6, 0.1), grape: c(60, 14.2, 0.4), pineapple: c(53, 10, 0.4),
  carrot: c(40, 3.9, 0.9), beet: c(42, 7.5, 1), yuzu: c(21, 0.4, 0.5), passion: c(51, 13.4, 0.4),
};

const HYDRATION: Record<DrinkCat, number> = {
  water: 1, tea: 1, coffee: 0.9, milk: 0.9, "plant milk": 0.9, soda: 0.9, sports: 1, energy: 0.85, juice: 0.85,
  smoothie: 0.8, "yogurt drink": 0.85, protein: 0.85, soup: 0.9, alcohol: 0.6, other: 0.9,
};

const r1 = (x: number) => Math.round(x * 10) / 10;

export const MIXED: Drink[] = [];
const seen = new Set<string>();

function add(name: string, cat: DrinkCat, emoji: string, parts: Parts, opt: { ml?: number; w?: number } = {}) {
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  let k = 0, s = 0, p = 0, caf = 0, v = 0;
  for (const [x, amt] of parts) {
    k += (x[0] * amt) / 100; s += (x[1] * amt) / 100; p += (x[2] * amt) / 100; caf += (x[3] * amt) / 100; v += x[4] * amt;
  }
  const kcal100 = Math.round((k * 100) / v);
  const drink: Drink = { name, cat, emoji, ml: opt.ml ?? Math.round(v / 10) * 10, kcal100, sugar100: Math.min(r1((s * 100) / v), Math.floor((kcal100 / 4) * 10) / 10) };
  const protein = r1((p * 100) / v);
  if (protein > 0) drink.protein100 = protein;
  const caffeine = Math.round((caf * 100) / v);
  if (caffeine > 0) drink.caffeine100 = caffeine;
  drink.water = opt.w ?? HYDRATION[cat];
  MIXED.push(drink);
}

// ── Option lists ──
type Opt = readonly [label: string, parts: Parts];
const one = (x: C, amt: number): Parts => [[x, amt]];

type Milk = readonly [label: string, comp: C];
const M_WHOLE: Milk = ["whole milk", WHOLE], M_TONED: Milk = ["toned milk", TONED], M_LOW: Milk = ["low-fat milk", LOWFAT];
const M_SKIM: Milk = ["skim milk", SKIM], M_BUF: Milk = ["buffalo milk", BUFFALO], M_SOY: Milk = ["soy milk", SOY];
const M_OAT: Milk = ["oat milk", OAT], M_ALM: Milk = ["almond milk", ALMOND];
const INDIA_MILKS = [M_WHOLE, M_TONED, M_LOW, M_SKIM, M_BUF, M_SOY, M_OAT, M_ALM];
const CAFE_MILKS = [M_WHOLE, M_LOW, M_SKIM, M_SOY, M_OAT, M_ALM];
const SHAKE_MILKS = [M_WHOLE, M_TONED, M_LOW, M_SKIM, M_SOY, M_OAT, M_ALM];
const DAIRY = [M_WHOLE, M_TONED, M_LOW, M_BUF];

const tsp = (n: number): Opt => [`${n} tsp sugar`, one(SUGAR, 4 * n)];
const gur = (n: number): Opt => [`${n} tsp jaggery`, one(JAGGERY, 5 * n)];
const honey = (n: number): Opt => [`${n} tsp honey`, one(HONEY, 7 * n)];
const NONE: Opt = ["no sugar", []];
const SUGARS_3 = [NONE, tsp(1), tsp(2), tsp(3)];
const CHAI_SWEET = [NONE, tsp(1), tsp(2), tsp(3), gur(1), gur(2)];
const MILK_SWEET = [NONE, tsp(1), tsp(2), tsp(3), gur(1), gur(2)];

// ── Chai (150 ml cup; leaf and spices strained out) ──
const CHAIS: [string, string, number, number, number, Parts][] = [
  // name, emoji, water ml, milk ml, tea leaf g, extras
  ["Chai", "🫖", 75, 75, 1.8, []],
  ["Masala chai", "🫖", 75, 75, 1.8, [[SPICE, 0.5]]],
  ["Adrak chai", "🫚", 75, 75, 1.8, [[GINGER, 2]]],
  ["Elaichi chai", "🫖", 75, 75, 1.8, [[SPICE, 0.3]]],
  ["Tulsi chai", "🌿", 75, 75, 1.8, []],
  ["Lemongrass chai", "🌿", 75, 75, 1.8, []],
  ["Kesar chai", "🫖", 60, 90, 1.8, []],
  ["Kadak chai", "🫖", 60, 60, 2.4, [[GINGER, 1]]],
  ["Cutting chai", "🫖", 35, 45, 1.2, [[SPICE, 0.3]]],
  ["Doodh patti chai", "🫖", 10, 140, 2, []],
];
for (const [name, emoji, water, milk, leaf, extra] of CHAIS)
  for (const [ml, comp] of INDIA_MILKS)
    for (const [sl, sp] of CHAI_SWEET)
      add(`${name} · ${ml} · ${sl}`, "tea", emoji, [[WATER, water], [comp, milk], [TEA_LEAF, leaf], ...extra, ...sp], { w: 0.9 });
for (const [ml, comp] of DAIRY) add(`Noon chai (Kashmiri pink tea) · ${ml}`, "tea", "🫖", [[WATER, 50], [comp, 100], [GREEN_LEAF, 1.5]], { w: 0.9 });

// Black and green teas sweetened.
for (const [sl, sp] of [tsp(1), tsp(2), tsp(3), honey(1), honey(2), gur(1)]) {
  add(`Black tea · ${sl}`, "tea", "🫖", [[WATER, 200], [TEA_LEAF, 2], ...sp]);
  add(`Lemon tea · ${sl}`, "tea", "🍋", [[WATER, 190], [LEMON, 10], [TEA_LEAF, 2], ...sp]);
  add(`Green tea · ${sl}`, "tea", "🍵", [[WATER, 200], [GREEN_LEAF, 2], ...sp]);
}
for (const [sl, sp] of [tsp(1), tsp(2)]) add(`Sulaimani chai · ${sl}`, "tea", "🫖", [[WATER, 145], [LEMON, 5], [TEA_LEAF, 1.5], [SPICE, 0.3], ...sp]);
for (const [sl, sp] of [NONE, honey(1), honey(2)]) add(`Ginger lemon tea · ${sl}`, "tea", "🫚", [[WATER, 190], [LEMON, 10], [GINGER, 2], ...sp]);
for (const [ml, comp] of CAFE_MILKS)
  for (const [sl, sp] of SUGARS_3) add(`Tea with milk · ${ml} · ${sl}`, "tea", "🫖", [[WATER, 200], [comp, 30], [TEA_LEAF, 2.2], ...sp], { w: 0.95 });

// ── Japanese-style milk teas and lattes ──
for (const [ml, comp] of CAFE_MILKS)
  for (const [sl, sp] of SUGARS_3) {
    add(`Matcha latte · ${ml} · ${sl}`, "tea", "🍵", [[MATCHA, 2], [WATER, 30], [comp, 240], ...sp], { w: 0.9 });
    add(`Iced matcha latte · ${ml} · ${sl}`, "tea", "🍵", [[MATCHA, 2], [WATER, 30], [comp, 200], [ICE, 60], ...sp], { w: 0.9 });
    add(`Hojicha latte · ${ml} · ${sl}`, "tea", "🍵", [[HOJICHA_POWDER, 3], [WATER, 30], [comp, 240], ...sp], { w: 0.9 });
    add(`Iced hojicha latte · ${ml} · ${sl}`, "tea", "🍵", [[HOJICHA_POWDER, 3], [WATER, 30], [comp, 200], [ICE, 60], ...sp], { w: 0.9 });
    add(`Royal milk tea · ${ml} · ${sl}`, "tea", "🧋", [[WATER, 100], [comp, 150], [TEA_LEAF, 3], ...sp], { w: 0.9 });
    add(`Iced royal milk tea · ${ml} · ${sl}`, "tea", "🧋", [[WATER, 80], [comp, 130], [ICE, 60], [TEA_LEAF, 3], ...sp], { w: 0.9 });
  }

// ── Bubble tea (≈500 ml cup: brewed tea, milk, ice; 100 % sugar ≈ 30 g) ──
const BOBA: [string, Parts][] = [
  ["Black milk tea", [[WATER, 250], [TEA_LEAF, 4]]],
  ["Jasmine green milk tea", [[WATER, 250], [GREEN_LEAF, 4]]],
  ["Oolong milk tea", [[WATER, 250], [OOLONG_LEAF, 4]]],
  ["Taro milk tea", [[WATER, 200], [TARO_POWDER, 25], [TEA_LEAF, 2]]],
  ["Matcha milk tea", [[WATER, 200], [MATCHA, 3]]],
  ["Hojicha milk tea", [[WATER, 200], [HOJICHA_POWDER, 4]]],
];
const BOBA_MILKS = [M_WHOLE, M_LOW, M_OAT, M_SOY];
for (const [name, base] of BOBA)
  for (const [ml, comp] of BOBA_MILKS)
    for (const pct of [0, 30, 50, 70, 100])
      for (const pearls of [true, false])
        add(`${name} · ${ml} · ${pct}% sugar · ${pearls ? "with pearls" : "no pearls"}`, "tea", "🧋",
          [...base, [comp, 120], [ICE, 60], [SUGAR, (30 * pct) / 100], ...(pearls ? [[PEARLS, 70] as Part] : [])], { ml: 500, w: 0.8 });
for (const [ml, comp] of BOBA_MILKS)
  for (const [lvl, g] of [["less sweet", 25], ["regular", 40]] as const) {
    add(`Brown sugar boba milk · ${ml} · ${lvl}`, "milk", "🧋", [[comp, 280], [ICE, 60], [BROWN_SUGAR_SYRUP, g], [PEARLS, 80]], { ml: 500, w: 0.8 });
    add(`Brown sugar milk tea · ${ml} · ${lvl}`, "tea", "🧋", [[WATER, 200], [TEA_LEAF, 3], [comp, 150], [ICE, 60], [BROWN_SUGAR_SYRUP, g], [PEARLS, 70]], { ml: 500, w: 0.8 });
  }

// ── Coffee ──
const ESPRESSO_DRINKS: [string, string, Parts, number][] = [
  // name, emoji, coffee + extras, milk ml
  ["Latte", "☕", [[ESPRESSO, 60]], 300],
  ["Iced latte", "🧊", [[ESPRESSO, 60], [ICE, 60]], 220],
  ["Cappuccino", "☕", [[ESPRESSO, 30]], 150],
  ["Flat white", "☕", [[ESPRESSO, 60]], 120],
  ["Cortado", "☕", [[ESPRESSO, 60]], 60],
  ["Cafe au lait", "☕", [[BREWED, 120]], 120],
  ["Iced cafe au lait", "🧊", [[BREWED, 120], [ICE, 50]], 100],
  ["Coffee with a splash of milk", "☕", [[BREWED, 200]], 30],
];
for (const [name, emoji, coffee, milk] of ESPRESSO_DRINKS)
  for (const [ml, comp] of CAFE_MILKS)
    for (const [sl, sp] of SUGARS_3) add(`${name} · ${ml} · ${sl}`, "coffee", emoji, [...coffee, [comp, milk], ...sp]);
for (const [ml, comp] of CAFE_MILKS) {
  for (const [lvl, g] of [["regular", 30], ["half sweet", 15]] as const) {
    add(`Cafe mocha · ${ml} · ${lvl}`, "coffee", "🍫", [[ESPRESSO, 60], [CHOC_SAUCE, g], [comp, 280]]);
    add(`Iced mocha · ${ml} · ${lvl}`, "coffee", "🧊", [[ESPRESSO, 60], [CHOC_SAUCE, g], [comp, 220], [ICE, 60]]);
  }
  add(`Spanish latte · ${ml}`, "coffee", "☕", [[ESPRESSO, 60], [CONDENSED, 30], [comp, 220]]);
  add(`Iced Spanish latte · ${ml}`, "coffee", "🧊", [[ESPRESSO, 60], [CONDENSED, 30], [comp, 180], [ICE, 60]]);
  for (const flav of ["Vanilla", "Caramel", "Hazelnut"])
    for (const [lvl, pumps] of [["1 pump", 1], ["2 pumps", 2], ["3 pumps", 3], ["sugar-free syrup", 0]] as const) {
      add(`${flav} latte · ${ml} · ${lvl}`, "coffee", "☕", [[ESPRESSO, 60], [comp, 290], [FLAVOUR_SYRUP, 7.5 * pumps]]);
      add(`Iced ${flav.toLowerCase()} latte · ${ml} · ${lvl}`, "coffee", "🧊", [[ESPRESSO, 60], [comp, 220], [ICE, 60], [FLAVOUR_SYRUP, 7.5 * pumps]]);
    }
}
for (const [ml, comp] of INDIA_MILKS) {
  for (const [sl, sp] of [...SUGARS_3, gur(1)]) add(`Filter coffee · ${ml} · ${sl}`, "coffee", "☕", [[DECOCTION, 30], [comp, 120], ...sp]);
  for (const [sl, sp] of SUGARS_3) {
    add(`Instant coffee with milk · ${ml} · ${sl}`, "coffee", "☕", [[INSTANT, 2], [WATER, 50], [comp, 100], ...sp]);
    add(`Cold coffee · ${ml} · ${sl}`, "coffee", "🧋", [[INSTANT, 4], [comp, 220], [ICE, 50], ...sp]);
  }
}
for (const [ml, comp] of [M_WHOLE, M_TONED])
  for (const [sl, sp] of SUGARS_3) add(`Cold coffee with ice cream · ${ml} · ${sl}`, "coffee", "🍨", [[INSTANT, 4], [comp, 180], [ICE_CREAM, 70], [ICE, 30], ...sp], { w: 0.8 });
for (const [sl, sp] of [tsp(1), tsp(2), tsp(3), honey(1)]) {
  add(`Black coffee · ${sl}`, "coffee", "☕", [[BREWED, 200], ...sp]);
  add(`Americano · ${sl}`, "coffee", "☕", [[ESPRESSO, 60], [WATER, 240], ...sp]);
  add(`Iced americano · ${sl}`, "coffee", "🧊", [[ESPRESSO, 60], [WATER, 180], [ICE, 60], ...sp]);
  add(`Cold brew · ${sl}`, "coffee", "🧊", [[COLD_BREW, 250], ...sp]);
  add(`Instant black coffee · ${sl}`, "coffee", "☕", [[INSTANT, 2], [WATER, 150], ...sp]);
}
add("Espresso · 1 tsp sugar", "coffee", "☕", [[ESPRESSO, 30], [SUGAR, 4]], { ml: 30 });

// ── Milk drinks (≈200–250 ml) ──
const MILK_DRINKS: [string, string, Parts, Opt[], Milk[]][] = [
  ["Haldi doodh", "🥛", [[SPICE, 2]], [NONE, tsp(1), tsp(2), gur(1), gur(2), honey(1), honey(2)], INDIA_MILKS],
  ["Badam milk", "🥛", [[ALMONDS, 15], [SPICE, 0.3]], MILK_SWEET, INDIA_MILKS],
  ["Kesar milk", "🥛", [[ALMONDS, 5]], MILK_SWEET, INDIA_MILKS],
  ["Elaichi milk", "🥛", [[SPICE, 0.3]], [tsp(1), tsp(2), tsp(3), gur(1), gur(2)], INDIA_MILKS],
  ["Hot milk", "🥛", [], [tsp(1), tsp(2), gur(1), honey(1), honey(2)], INDIA_MILKS],
  ["Hot chocolate", "🍫", [[COCOA, 8]], [NONE, tsp(1), tsp(2), tsp(3)], INDIA_MILKS],
  ["Thandai", "🥛", [[NUT_MIX, 15], [SPICE, 1]], [NONE, tsp(2), tsp(3), tsp(4)], INDIA_MILKS],
];
for (const [name, emoji, extra, sweets, milks] of MILK_DRINKS)
  for (const [ml, comp] of milks)
    for (const [sl, sp] of sweets) add(`${name} · ${ml} · ${sl}`, "milk", emoji, [[comp, 200], ...extra, ...sp]);
for (const [ml, comp] of INDIA_MILKS) {
  for (const [sl, sp] of [NONE, tsp(1), tsp(2), gur(1), gur(2)]) add(`Ragi malt · ${ml} · ${sl}`, "milk", "🥣", [[RAGI, 20], [WATER, 60], [comp, 150], ...sp]);
  for (const [lvl, syrup] of [["1 tbsp syrup", 15], ["2 tbsp syrup", 30]] as const) add(`Rose milk · ${ml} · ${lvl}`, "milk", "🌹", [[comp, 200], [ROSE_SYRUP, syrup]]);
}

// ── Fruit ──
type Fruit = { name: string; emoji: string; parts: Parts }; // parts for one ~120 g blender portion
const fr = (name: string, emoji: string, ...parts: Part[]): Fruit => ({ name, emoji, parts });
const BANANA: Part = [F.banana, 120];
const SHAKE_FRUITS: [Fruit, number][] = [ // fruit, max tsp sugar that people add
  [fr("Banana", "🍌", BANANA), 2], [fr("Mango", "🥭", [F.mango, 130]), 3], [fr("Alphonso mango", "🥭", [F.alphonso, 130]), 2],
  [fr("Chikoo", "🟤", [F.chikoo, 120]), 2], [fr("Strawberry", "🍓", [F.strawberry, 120]), 3], [fr("Papaya", "🥭", [F.papaya, 130]), 3],
  [fr("Sitaphal", "🍏", [F.sitaphal, 100]), 2], [fr("Apple", "🍎", [F.apple, 120]), 3], [fr("Avocado", "🥑", [F.avocado, 80]), 3],
  [fr("Dates", "🌴", [F.dates, 40]), 1], [fr("Anjeer", "🟣", [F.anjeer, 30]), 2], [fr("Muskmelon", "🍈", [F.muskmelon, 150]), 3],
  [fr("Blueberry", "🫐", [F.blueberry, 100]), 3], [fr("Mixed berry", "🫐", [F.berries, 120]), 3], [fr("Lychee", "🥤", [F.lychee, 120]), 2],
  [fr("Tender coconut", "🥥", [F.malai, 80], [COCONUT_WATER, 50]), 3], [fr("Peach", "🍑", [F.peach, 130]), 3],
  [fr("Strawberry banana", "🍓", [F.strawberry, 70], [F.banana, 70]), 2], [fr("Mango banana", "🥭", [F.mango, 70], [F.banana, 70]), 2],
  [fr("Banana date", "🍌", BANANA, [F.dates, 20]), 1], [fr("Peanut butter banana", "🥜", BANANA, [PB, 16]), 2],
  [fr("Chocolate banana", "🍫", BANANA, [COCOA, 6]), 3], [fr("Chocolate", "🍫", [COCOA, 10]), 3], [fr("Oreo", "🍪", [OREO, 35]), 2],
];
for (const [f, max] of SHAKE_FRUITS) {
  const sweets = SUGARS_3.slice(0, max + 1);
  for (const [ml, comp] of SHAKE_MILKS)
    for (const [sl, sp] of sweets) add(`${f.name} milkshake · ${ml} · ${sl}`, "smoothie", f.emoji, [...f.parts, [comp, 200], ...sp]);
  for (const [ml, comp] of [M_WHOLE, M_TONED])
    for (const [sl, sp] of sweets.slice(0, 3)) add(`${f.name} milkshake · ${ml} · ice cream · ${sl}`, "smoothie", f.emoji, [...f.parts, [comp, 170], [ICE_CREAM, 70], ...sp], { w: 0.75 });
}

const SMOOTHIE_FRUITS: Fruit[] = [
  fr("Banana", "🍌", [F.banana, 150]), fr("Mango", "🥭", [F.mango, 150]), fr("Strawberry", "🍓", [F.strawberry, 150]),
  fr("Blueberry", "🫐", [F.blueberry, 150]), fr("Mixed berry", "🫐", [F.berries, 150]), fr("Raspberry", "🫐", [F.raspberry, 150]),
  fr("Papaya", "🥭", [F.papaya, 150]), fr("Pineapple", "🍍", [F.pineapple, 150]), fr("Kiwi", "🥝", [F.kiwi, 150]),
  fr("Peach", "🍑", [F.peach, 150]), fr("Apple", "🍎", [F.apple, 150]), fr("Orange", "🍊", [F.orange, 150]),
  fr("Cherry", "🍒", [F.cherry, 150]), fr("Avocado", "🥑", [F.avocado, 80], [F.banana, 60]), fr("Dragon fruit", "🐉", [F.dragon, 150]),
  fr("Guava", "🍐", [F.guava, 150]), fr("Pomegranate", "🍎", [F.pomegranate, 150]), fr("Muskmelon", "🍈", [F.muskmelon, 150]),
  fr("Chikoo", "🟤", [F.chikoo, 150]), fr("Lychee", "🥤", [F.lychee, 150]),
  fr("Strawberry banana", "🍓", [F.strawberry, 75], [F.banana, 75]), fr("Mango banana", "🥭", [F.mango, 75], [F.banana, 75]),
  fr("Blueberry banana", "🫐", [F.blueberry, 75], [F.banana, 75]), fr("Mango pineapple", "🥭", [F.mango, 75], [F.pineapple, 75]),
  fr("Green (spinach banana)", "🥬", [F.spinach, 40], [F.banana, 100], [F.apple, 50]), fr("Banana oat", "🌾", [F.banana, 120], [OATS, 30]),
  fr("Peanut butter banana", "🥜", [F.banana, 120], [PB, 16]), fr("Banana date", "🍌", [F.banana, 120], [F.dates, 20]),
  fr("Chocolate banana", "🍫", [F.banana, 120], [COCOA, 6]), fr("Kiwi spinach", "🥝", [F.kiwi, 100], [F.spinach, 30], [F.apple, 50]),
];
const SMOOTHIE_BASES: Opt[] = [
  ["yogurt", [[YOGURT, 100], [WATER, 50]]], ["Greek yogurt", [[GREEK, 100], [WATER, 50]]], ["milk & yogurt", [[YOGURT, 80], [WHOLE, 100]]],
  ["almond milk", one(ALMOND, 150)], ["oat milk", one(OAT, 150)], ["soy milk", one(SOY, 150)], ["coconut water", one(COCONUT_WATER, 150)],
];
for (const f of SMOOTHIE_FRUITS)
  for (const [bl, bp] of SMOOTHIE_BASES)
    for (const [sl, sp] of [["unsweetened", []] as Opt, honey(1), honey(2)])
      add(`${f.name} smoothie · ${bl} · ${sl}`, "smoothie", f.emoji, [...f.parts, ...bp, ...sp]);

// Fresh juices (250 ml glass).
const PRESSED: [string, string, C][] = [
  ["orange", "🍊", J.orange], ["mosambi", "🍊", J.mosambi], ["mikan", "🍊", J.mikan], ["grapefruit", "🍊", J.grapefruit],
  ["pomegranate", "🧃", J.pomegranate], ["apple", "🍎", J.apple], ["black grape", "🍇", J.grape], ["pineapple", "🍍", J.pineapple],
  ["carrot", "🥕", J.carrot],
];
const BLENDED: [string, string, Parts][] = [
  ["mango", "🥭", [[F.mango, 150], [WATER, 100]]], ["watermelon", "🍉", [[F.watermelon, 250]]], ["muskmelon", "🍈", [[F.muskmelon, 200], [WATER, 50]]],
  ["papaya", "🥭", [[F.papaya, 150], [WATER, 100]]], ["guava", "🍐", [[F.guava, 120], [WATER, 130]]], ["kiwi", "🥝", [[F.kiwi, 150], [WATER, 100]]],
  ["lychee", "🧃", [[F.lychee, 150], [WATER, 100]]], ["jamun", "🧃", [[F.jamun, 100], [WATER, 150]]], ["dragon fruit", "🐉", [[F.dragon, 150], [WATER, 100]]],
  ["peach", "🍑", [[F.peach, 150], [WATER, 100]]], ["pear", "🍐", [[F.pear, 150], [WATER, 100]]], ["strawberry", "🍓", [[F.strawberry, 150], [WATER, 100]]],
  ["honeydew", "🍈", [[F.honeydew, 200], [WATER, 50]]], ["passion fruit", "🧃", [[F.passion, 60], [WATER, 190]]],
  ["ABC (apple beet carrot)", "🧃", [[J.apple, 90], [J.beet, 70], [J.carrot, 90]]],
];
const JUICE_SWEET = [NONE, tsp(1), tsp(2)];
for (const [n, e, comp] of PRESSED) for (const [sl, sp] of JUICE_SWEET) add(`Fresh ${n} juice · ${sl}`, "juice", e, [[comp, 250], ...sp]);
for (const [n, e, parts] of BLENDED) for (const [sl, sp] of JUICE_SWEET) add(`Fresh ${n} juice · ${sl}`, "juice", e, [...parts, ...sp], { ml: 250 });
for (const [sl, sp] of JUICE_SWEET) {
  add(`Fresh orange soda · ${sl}`, "soda", "🍊", [[J.orange, 100], [SODA, 150], ...sp]);
  add(`Grapefruit soda · ${sl}`, "soda", "🍊", [[J.grapefruit, 100], [SODA, 150], ...sp]);
  add(`Passion fruit soda · ${sl}`, "soda", "🧃", [[J.passion, 60], [SODA, 190], ...sp]);
}
for (const [sl, sp] of [honey(1), honey(2), honey(3)]) add(`Yuzu honey soda · ${sl}`, "soda", "🍋", [[J.yuzu, 15], [SODA, 235], ...sp]);

// Lemon drinks (250 ml glass).
const LEMONS: [string, string, Parts, DrinkCat, Opt[]][] = [
  ["Nimbu pani", "🍋", [[LIME, 20], [WATER, 230]], "juice", [["no sugar (salted)", []], tsp(1), tsp(2), tsp(3), gur(2), honey(1), honey(2)]],
  ["Shikanji", "🍋", [[LIME, 20], [WATER, 230]], "juice", [tsp(1), tsp(2), tsp(3)]],
  ["Pudina nimbu pani", "🌿", [[LIME, 20], [WATER, 230]], "juice", [tsp(1), tsp(2), tsp(3)]],
  ["Masala nimbu soda", "🍋", [[LIME, 20], [SODA, 230]], "soda", [["salted", []], tsp(1), tsp(2), tsp(3)]],
  ["Fresh lime soda", "🍋", [[LIME, 20], [SODA, 230]], "soda", [tsp(1), tsp(2), tsp(3), ["sweet & salted · 2 tsp sugar", one(SUGAR, 8)]]],
  ["Lemonade", "🍋", [[LEMON, 30], [WATER, 220]], "juice", [tsp(2), tsp(3), tsp(4), honey(2)]],
  ["Mint lemonade", "🌿", [[LEMON, 30], [WATER, 220]], "juice", [tsp(2), tsp(3), tsp(4)]],
  ["Ginger lemonade", "🫚", [[LEMON, 30], [WATER, 215], [GINGER, 5]], "juice", [tsp(2), tsp(3), honey(2)]],
  ["Honey lemon water", "🍯", [[LEMON, 15], [WATER, 235]], "water", [honey(1), honey(2), honey(3)]],
];
for (const [n, e, base, cat, sweets] of LEMONS) for (const [sl, sp] of sweets) add(`${n} · ${sl}`, cat, e, [...base, ...sp]);

// Sharbats (250 ml glass).
const SHARBAT_SWEET = [tsp(1), tsp(2), tsp(3), gur(2), gur(3)];
for (const [sl, sp] of SHARBAT_SWEET) {
  add(`Bael sharbat · ${sl}`, "juice", "🧃", [[F.bael, 60], [WATER, 190], ...sp]);
  add(`Aam panna · ${sl}`, "juice", "🥭", [[F.rawMango, 60], [WATER, 190], ...sp]);
  add(`Imli sharbat · ${sl}`, "juice", "🧃", [[F.tamarind, 20], [WATER, 230], ...sp]);
  add(`Sattu sharbat · ${sl}`, "other", "🥣", [[SATTU, 30], [WATER, 220], [LIME, 5], ...sp]);
}
add("Sattu drink · salted", "other", "🥣", [[SATTU, 30], [WATER, 220], [LIME, 5]]);
for (const [lvl, syrup] of [["1 tbsp", 15], ["2 tbsp", 30], ["3 tbsp", 45]] as const) {
  add(`Rooh Afza sharbat · ${lvl}`, "other", "🌹", [[ROSE_SYRUP, syrup], [WATER, 250 - syrup]]);
  add(`Khus sharbat · ${lvl}`, "other", "🌿", [[KHUS_SYRUP, syrup], [WATER, 250 - syrup]]);
  add(`Rose sharbat with lime · ${lvl}`, "other", "🌹", [[ROSE_SYRUP, syrup], [LIME, 10], [WATER, 240 - syrup]]);
}

// ── Lassi and chaas (250 ml) ──
const CURDS: Opt[] = [["whole-milk curd", one(YOGURT, 200)], ["low-fat curd", one(LOWFAT_YOGURT, 200)], ["buffalo-milk curd", one(BUFFALO_YOGURT, 200)]];
for (const [cl, cp] of CURDS) {
  for (const [sl, sp] of [NONE, tsp(1), tsp(2), tsp(3), tsp(4)]) add(`Sweet lassi · ${cl} · ${sl}`, "yogurt drink", "🥛", [...cp, [WATER, 50], ...sp]);
  add(`Salted lassi · ${cl}`, "yogurt drink", "🥛", [...cp, [WATER, 50]]);
  for (const [sl, sp] of [tsp(2), tsp(3), tsp(4)]) {
    add(`Malai lassi · ${cl} · ${sl}`, "yogurt drink", "🥛", [...cp, [CREAM, 25], [WATER, 30], ...sp], { w: 0.8 });
    add(`Kesar lassi · ${cl} · ${sl}`, "yogurt drink", "🥛", [...cp, [WATER, 50], ...sp]);
    add(`Dry fruit lassi · ${cl} · ${sl}`, "yogurt drink", "🥛", [...cp, [NUT_MIX, 15], [WATER, 40], ...sp], { w: 0.8 });
  }
  for (const [sl, sp] of [NONE, tsp(1), tsp(2)]) add(`Rose lassi · ${cl} · ${sl}`, "yogurt drink", "🌹", [...cp, [ROSE_SYRUP, 15], [WATER, 40], ...sp]);
}
const LASSI_FRUITS: Fruit[] = [
  fr("Mango", "🥭", [F.mango, 100]), fr("Alphonso mango", "🥭", [F.alphonso, 100]), fr("Banana", "🍌", [F.banana, 100]),
  fr("Strawberry", "🍓", [F.strawberry, 100]), fr("Pineapple", "🍍", [F.pineapple, 100]), fr("Chikoo", "🟤", [F.chikoo, 100]),
];
for (const f of LASSI_FRUITS)
  for (const [cl, cp] of CURDS.slice(0, 2))
    for (const [sl, sp] of SUGARS_3) add(`${f.name} lassi · ${cl} · ${sl}`, "yogurt drink", f.emoji, [[cp[0][0], 150], ...f.parts, [WATER, 30], ...sp], { ml: 250 });
for (const kind of ["Masala chaas", "Jeera chaas", "Pudina chaas", "Plain chaas"])
  for (const [cl, cp] of CURDS.slice(0, 2)) add(`${kind} · ${cl}`, "yogurt drink", "🥛", [[cp[0][0], 100], [WATER, 150]], { w: 0.95 });

// ── Protein shakes (one 30 g scoop unless 2) ──
const POWDERS: [string, C][] = [["Whey shake", WHEY], ["Whey isolate shake", ISOLATE], ["Plant protein shake", PLANT], ["Casein shake", CASEIN]];
const LIQUIDS: Opt[] = [["water", one(WATER, 300)], ...SHAKE_MILKS.map(([l, m]): Opt => [l, one(m, 300)])];
const ADDINS: Opt[] = [
  ["", []], ["banana", [BANANA]], ["oats", [[OATS, 40]]], ["peanut butter", [[PB, 16]]], ["banana + peanut butter", [BANANA, [PB, 16]]],
  ["banana + oats", [BANANA, [OATS, 40]]], ["banana + oats + peanut butter", [BANANA, [OATS, 40], [PB, 16]]],
  ["espresso shot", [[ESPRESSO, 30]]], ["2 dates", [[F.dates, 48]]], ["berries", [[F.berries, 100]]],
];
for (const [pn, powder] of POWDERS)
  for (const [ll, lp] of LIQUIDS) {
    for (const [al, ap] of ADDINS) add(`${pn} · ${ll}${al ? ` · ${al}` : ""}`, "protein", "💪", [[powder, 30], ...lp, ...ap]);
    add(`${pn} · 2 scoops · ${ll}`, "protein", "💪", [[powder, 60], ...lp]);
  }
