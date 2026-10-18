// Eating well for little money in Japan: the best konbini combo for your
// budget, and what to order at the gyudon and set-meal chains for your goal.
// Prices are typical 2026 prices including tax; they differ a little by
// store, so treat them as a guide.

export type Pick = { name: string; ja: string; emoji: string; yen: number; kcal: number; protein: number; type: "main" | "protein" | "side" | "drink" };
const P = (s: string): Pick[] => s.trim().split("\n").map((l) => {
  const [name, ja, emoji, yen, kcal, protein, type] = l.split("|");
  return { name, ja, emoji, yen: +yen, kcal: +kcal, protein: +protein, type: type as Pick["type"] };
});

export const KONBINI_PICKS = P(`
Salmon onigiri|鮭おにぎり|🍙|170|180|5|main
Tuna mayo onigiri|ツナマヨおにぎり|🍙|160|230|5|main
Brown rice onigiri|玄米おにぎり|🍙|180|170|4|main
Plain rice pack (180 g)|パックごはん|🍚|160|280|4|main
Whole-wheat bread roll (2)|全粒粉ロール|🍞|160|220|7|main
Egg sandwich|たまごサンド|🥪|320|330|13|main
Cold soba|ざるそば|🍜|450|400|15|main
Banana|バナナ|🍌|50|90|1|side
Salad chicken (plain)|サラダチキン|🍗|270|110|24|protein
Salad chicken bar|サラダチキンバー|🍢|180|70|11|protein
Boiled egg|ゆでたまご|🥚|90|70|6|protein
Seasoned egg (ajitama)|味付たまご|🥚|100|80|7|protein
Tofu bar|豆腐バー|🧈|170|120|11|protein
Grilled salted mackerel|焼きさば|🐟|320|250|18|protein
Greek yogurt (Oikos)|オイコス|🥛|180|92|10|protein
Protein milk drink (SAVAS)|ザバス ミルクプロテイン|🥤|170|102|15|protein
Milk 500 ml|牛乳 500ml|🥛|170|335|16|protein
Edamame|枝豆|🫛|200|130|11|protein
Yakitori, salt (1 stick)|焼き鳥 塩|🍢|140|80|8|protein
Karaage-kun (5 pcs)|からあげクン|🍗|260|220|15|protein
Famichiki|ファミチキ|🍗|230|250|13|protein
String cheese|さけるチーズ|🧀|140|80|6|protein
Protein bar|プロテインバー|🍫|160|180|15|protein
Natto (1 pack)|納豆|🫘|60|90|8|protein
Green salad|グリーンサラダ|🥗|250|30|1|side
Seaweed salad|海藻サラダ|🥗|280|50|2|side
Pork miso soup cup|豚汁|🍲|320|180|9|side
Instant miso soup|みそ汁|🥣|140|40|2|side
Soy milk 200 ml|豆乳 200ml|🥛|100|90|7|drink
Green tea 600 ml|緑茶|🍵|150|0|0|drink
`);

export type ComboGoal = "protein" | "lean" | "full";
export const COMBO_GOALS: [ComboGoal, string, string][] = [
  ["protein", "💪 Most protein", "The most protein your money buys, with a little rice or bread."],
  ["lean", "🔥 Lean", "High protein and under 550 kcal: good while cutting fat."],
  ["full", "🍱 Real meal", "Filling (600+ kcal) with 30 g+ protein, for lunch after training."],
];
export type Combo = { items: Pick[]; yen: number; kcal: number; protein: number };

// Tries every mix of one main (rice or bread) and up to three other things (no doubles) and
// keeps the best few for the goal. About 15,000 mixes: instant even on a tablet.
export function bestCombos(budget: number, goal: ComboGoal, main?: string, n = 3, picks = KONBINI_PICKS): Combo[] {
  const mains = picks.filter((p) => p.type === "main" && (!main || p.name === main));
  const rest = picks.filter((p) => p.type !== "main");
  const out: (Combo & { s: number })[] = [];
  const score = (c: Combo) => goal === "protein" ? c.protein * 10 + c.kcal / 100 - c.yen / 200
    : goal === "lean" ? (c.kcal > 550 ? -1 : c.protein * 10 - c.kcal / 20 - c.yen / 200)
      : c.kcal < 600 || c.protein < 30 ? -1 : c.protein * 4 + c.kcal / 20 - c.yen / 50;
  const add = (items: Pick[]) => {
    const c = items.reduce((a, p) => ({ items, yen: a.yen + p.yen, kcal: a.kcal + p.kcal, protein: a.protein + p.protein }), { items, yen: 0, kcal: 0, protein: 0 });
    if (c.yen > budget) return;
    const s = score(c);
    if (s > 0) out.push({ ...c, s });
  };
  for (const m of mains) {
    const base = [m];
    for (let i = 0; i < rest.length; i++) {
      add([...base, rest[i]]);
      for (let j = i + 1; j < rest.length; j++) {
        add([...base, rest[i], rest[j]]);
        for (let k = j + 1; k < rest.length; k++) add([...base, rest[i], rest[j], rest[k]]);
      }
    }
  }
  out.sort((a, b) => b.s - a.s);
  // Different combos, not the same one with a drink swapped.
  const seen: string[] = [];
  const res: Combo[] = [];
  for (const c of out) {
    const k = c.items.filter((p) => p.type === "protein").map((p) => p.name).sort().join("+");
    if (seen.includes(k)) continue;
    seen.push(k); res.push({ items: c.items, yen: c.yen, kcal: c.kcal, protein: c.protein });
    if (res.length >= n) break;
  }
  return res;
}

// ---------- Eating out ----------
export type Chain = { id: string; name: string; ja: string; emoji: string; tip: string };
export const CHAIN_LIST: Chain[] = [
  { id: "sukiya", name: "Sukiya", ja: "すき家", emoji: "🐮", tip: "Ask for 'mini' or 'rice less' and add a raw egg and salad. Pork miso soup (とん汁) beats plain miso." },
  { id: "matsuya", name: "Matsuya", ja: "松屋", emoji: "🍚", tip: "Set meals come with miso soup free. Swap rice for 'small' (小盛) at no cost and add a raw egg." },
  { id: "yoshinoya", name: "Yoshinoya", ja: "吉野家", emoji: "🥩", tip: "Order 'atama no ōmori' (more meat, normal rice) for protein without extra rice." },
  { id: "nakau", name: "Nakau", ja: "なか卯", emoji: "🐔", tip: "Oyakodon is the lean pick. Mini sizes are cheap: two minis beat one large." },
  { id: "ootoya", name: "Ootoya", ja: "大戸屋", emoji: "🐟", tip: "Grilled fish sets with brown rice (五穀米) are the healthiest chain meal in Japan." },
  { id: "saizeriya", name: "Saizeriya", ja: "サイゼリヤ", emoji: "🍝", tip: "Cheap protein: chicken dishes and the green bean salad. Skip the bread, fries and drink bar sodas." },
  { id: "coco", name: "CoCo Ichibanya", ja: "CoCo壱番屋", emoji: "🍛", tip: "Pick 200 g rice (less rice gets cheaper) and add chicken or boiled egg toppings." },
];

export type Dish = { chain: string; name: string; ja: string; yen: number; kcal: number; protein: number };
const D = (chain: string, s: string): Dish[] => s.trim().split("\n").map((l) => { const [name, ja, yen, kcal, protein] = l.split("|"); return { chain, name, ja, yen: +yen, kcal: +kcal, protein: +protein }; });
export const CHAIN_DISHES: Dish[] = [
  ...D("sukiya", `
Gyudon regular|牛丼 並盛|450|733|23
Gyudon mini + raw egg + salad|牛丼ミニ+生卵+サラダ|560|600|25
Gyudon regular + pork miso soup|牛丼 並+とん汁|640|870|30
Oroshi ponzu gyudon|おろしポン酢牛丼|560|740|23
Tuna tataki bowl|まぐろたたき丼|720|560|26
Morning set (rice, egg, natto)|たまかけ朝食|300|480|17`),
  ...D("matsuya", `
Gyumeshi regular|牛めし 並|430|711|22
Ginger pork set (small rice)|生姜焼定食 小盛|680|760|30
Grilled chicken set|鶏の炭火焼定食|790|820|42
Natto breakfast set|納豆定食|430|560|21
Beef yakiniku set (small rice)|牛焼肉定食 小盛|750|820|33`),
  ...D("yoshinoya", `
Gyudon regular|牛丼 並盛|498|635|20
Atama no ōmori (more meat)|アタマの大盛|598|715|26
Gyusara (beef plate) set|牛皿定食|690|780|30
Grilled salmon breakfast|焼鮭定食|598|560|28
Karaage bowl|から揚げ丼|598|840|28`),
  ...D("nakau", `
Oyakodon regular|親子丼 並|530|650|30
Oyakodon mini + small udon|親子丼ミニ+はいからうどん小|650|720|28
Katsudon|カツ丼|690|900|32`),
  ...D("ootoya", `
Grilled mackerel set (brown rice)|しまほっけ定食 五穀米|1090|700|40
Chicken and vegetable black vinegar set|鶏と野菜の黒酢あん定食|1190|800|35
Tofu and pork steamed set|豆腐と豚の蒸し定食|990|600|32`),
  ...D("saizeriya", `
Diavola-style grilled chicken|若鶏のディアボラ風|500|560|36
Green bean salad|やわらかお豆の温サラダ|350|230|13
Milan-style doria|ミラノ風ドリア|300|520|15
Chicken + bean salad|ディアボラ+豆サラダ|850|790|49`),
  ...D("coco", `
Pork curry (200 g rice)|ポークカレー 200g|650|650|15
Chicken curry + boiled egg (200 g)|チキンカレー+ゆで卵|900|820|32
Vegetable curry (200 g rice)|野菜カレー 200g|800|640|12`),
];

export type EatGoal = "muscle" | "lean" | "cheap";
export const EAT_GOALS: [EatGoal, string][] = [["muscle", "💪 Build muscle"], ["lean", "🔥 Lose fat"], ["cheap", "💴 Cheapest good meal"]];
export function bestDishes(goal: EatGoal, chain?: string): Dish[] {
  const s = (x: Dish) => goal === "muscle" ? x.protein * 3 - x.yen / 100 : goal === "lean" ? (x.protein * 1000) / x.kcal - (x.kcal > 750 ? 20 : 0) : (x.protein * 100 + x.kcal / 2) / x.yen;
  return CHAIN_DISHES.filter((x) => !chain || x.chain === chain).sort((a, b) => s(b) - s(a));
}
