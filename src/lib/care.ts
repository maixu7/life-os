import { bodyOf, eaten, type Eaten } from "@/lib/body";
import { haveFoods } from "@/lib/have";
import { sched } from "@/lib/schedule";
import { toDay, type Data, type Log } from "@/lib/store";

// "Take care of me": reads the last 7 days of food and habits, warns about
// what is too much (sugar, salt, fat, sweets, fried food, bad packet
// ingredients) and what is missing (vegetables, fruit, eggs, protein,
// vitamins, sleep, exercise, learning), and says exactly what to take.

export type Group = "veg" | "fruit" | "egg" | "dairy" | "meat" | "fish" | "legume" | "grain" | "nuts" | "sweets" | "fried" | "sugary";
const G: [Group, RegExp][] = [
  ["veg", /veg|sabzi|sabji|salad|spinach|palak|broccoli|carrot|cabbage|lettuce|tomato|cucumber|onion|okra|bhindi|kale|radish|daikon|pumpkin|kabocha|mushroom|greens|komatsuna|bean sprout|moyashi|eggplant|brinjal|capsicum|pepper|野菜|サラダ|ほうれん草|キャベツ|味噌汁/i],
  ["fruit", /fruit|apple|banana|orange|mango|grape|melon|berr|pineapple|papaya|guava|kiwi|peach|pear|plum|cherry|mikan|persimmon|pomegranate|果物|りんご|バナナ|みかん/i],
  ["egg", /\begg|omelet|tamago|卵|たまご/i],
  ["dairy", /milk|curd|yogh?urt|dahi|paneer|cheese|lassi|yakult|牛乳|ヨーグルト|チーズ/i],
  ["meat", /chicken|mutton|beef|pork|meat|keema|kebab|karaage|tonkatsu|ham|sausage|bacon|肉|チキン/i],
  ["fish", /fish|salmon|tuna|mackerel|saba|sardine|prawn|shrimp|sushi|sashimi|魚|鮭|さば|ツナ/i],
  ["legume", /dal|lentil|bean|chana|rajma|tofu|natto|soy|edamame|chickpea|豆|納豆|豆腐/i],
  ["grain", /oat|brown rice|whole ?wheat|roti|chapat|multigrain|granola|玄米|オートミール/i],
  ["nuts", /nut|almond|cashew|peanut|walnut|seed|ナッツ/i],
  ["sweets", /chocolate|choco|cake|biscuit|cookie|candy|ice ?cream|donut|doughnut|sweet|mithai|jamun|laddu|halwa|pastry|wafer|dessert|pudding|チョコ|ケーキ|菓子|クッキー|ビスケット|アイス/i],
  ["fried", /chips|crisps|fries|fried|karaage|tempura|burger|pizza|maggi|instant noodle|cup noodle|ramen|samosa|pakora|kurkure|puri|nugget|揚げ|ポテト|カップ麺/i],
  ["sugary", /cola|coke|pepsi|soda|fanta|sprite|energy drink|red bull|monster|juice|frappuccino|sweet tea|ジュース|コーラ/i],
];
export const groupsOf = (f: Pick<Eaten, "name" | "contents">) => G.filter(([, re]) => re.test(`${f.name} ${f.contents ?? ""}`)).map(([g]) => g);

const BAD_INGREDIENTS: [RegExp, string][] = [
  [/ショートニング|shortening|margarine|マーガリン|hydrogenated/i, "trans fat (shortening/margarine)"],
  [/パーム油|palm oil/i, "palm oil (saturated fat)"],
  [/果糖ぶどう糖液糖|ぶどう糖果糖液糖|high.?fructose|glucose.?fructose/i, "high-fructose syrup"],
  [/アスパルテーム|スクラロース|アセスルファム|aspartame|sucralose|acesulfame/i, "artificial sweetener"],
  [/亜硝酸|nitrite/i, "nitrite (processed meat)"],
];

export type Warn = { icon: string; text: string; fix: string; level: "bad" | "watch" };
export type Need = { icon: string; name: string; days: number; sources: string; take: string };
export type Habit = { icon: string; name: string; have: string; goal: string; ok: boolean; fix: string };
export type Care = { days: number; foods: number; avg: { kcal: number; protein: number; sugar?: number; salt?: number; fatPct?: number }; warns: Warn[]; needs: Need[]; habits: Habit[]; take: string[] };

const VIT: [string, string, Group[], string][] = [
  ["🥬", "Vitamin A", ["veg", "egg", "dairy"], "carrot, spinach, pumpkin, egg, milk"],
  ["🍊", "Vitamin C", ["fruit", "veg"], "orange, kiwi, strawberries, broccoli, capsicum"],
  ["☀️", "Vitamin D", ["fish", "egg"], "salmon, mackerel (saba), eggs, 15 min sun"],
  ["🥩", "Vitamin B12", ["meat", "fish", "egg", "dairy"], "eggs, milk, fish, chicken"],
  ["🩸", "Iron", ["meat", "legume", "veg"], "spinach, dal, beans, natto, chicken, with vitamin C"],
  ["🦴", "Calcium", ["dairy", "legume"], "milk, yogurt, tofu, small fish, paneer"],
  ["🌾", "Fibre", ["veg", "fruit", "legume", "grain"], "vegetables, fruit, oats, beans, brown rice"],
  ["🐟", "Omega-3", ["fish", "nuts"], "salmon, saba, sardines, walnuts"],
];

const within = (l: Log, from: number) => new Date(l.created_at).getTime() >= from;

export function care(d: Data, now = new Date()): Care {
  const from = now.getTime() - 7 * 86_400_000;
  const logs = d.logs.filter((l) => within(l, from));
  const days = new Set(logs.map((l) => l.day));
  const byDay = new Map<string, Eaten[]>();
  for (const l of logs) { const e = eaten([l], d.items); if (e.length) byDay.set(l.day, [...(byDay.get(l.day) ?? []), ...e]); }
  const all = [...byDay.values()].flat();
  const fd = Math.max(1, byDay.size);
  const sum = (k: keyof Eaten) => all.reduce((n, f) => n + (Number(f[k]) || 0), 0);
  const known = (k: keyof Eaten) => all.some((f) => f[k] != null);
  const kcal = sum("kcal"), fat = sum("fat");
  const avg = {
    kcal: Math.round(kcal / fd), protein: Math.round(sum("protein") / fd),
    sugar: known("sugar") ? Math.round(sum("sugar") / fd) : undefined, salt: known("salt") ? +(sum("salt") / fd).toFixed(1) : undefined,
    fatPct: known("fat") && kcal ? Math.round(((fat * 9) / kcal) * 100) : undefined,
  };
  const daysWith = (g: Group) => [...byDay.values()].filter((fs) => fs.some((f) => groupsOf(f).includes(g))).length;
  const count = (g: Group) => all.filter((f) => groupsOf(f).includes(g)).reduce((n, f) => n + (f.qty || 1), 0);
  const warns: Warn[] = [];
  const sweets = count("sweets"), fried = count("fried"), sugary = count("sugary");
  if (sweets >= 5) warns.push({ icon: "🍪", level: sweets >= 8 ? "bad" : "watch", text: `${sweets} sweet snacks this week (biscuits, chocolate, cake…). They are mostly sugar, white flour and fat.`, fix: "Keep it to 2 or 3 a week. Swap for fruit, nuts or yogurt." });
  if (fried >= 4) warns.push({ icon: "🍟", level: fried >= 7 ? "bad" : "watch", text: `${fried} fried or instant foods this week.`, fix: "Max 2 a week. Choose grilled, boiled or home cooked." });
  if (sugary >= 3) warns.push({ icon: "🥤", level: sugary >= 6 ? "bad" : "watch", text: `${sugary} sugary drinks this week (a cola has about 35 g sugar).`, fix: "Drink water, barley tea (麦茶) or unsweetened tea instead." });
  if (avg.sugar != null && avg.sugar > 25) warns.push({ icon: "🍬", level: avg.sugar > 50 ? "bad" : "watch", text: `About ${avg.sugar} g of sugar a day from labels you read (WHO: under 50 g, best under 25 g).`, fix: "Cut sweets and sweet drinks first." });
  if (avg.salt != null && avg.salt > 7.5) warns.push({ icon: "🧂", level: "watch", text: `About ${avg.salt} g of salt a day (Japan's target for men: under 7.5 g).`, fix: "Less instant noodles, soy sauce and snacks; more vegetables (potassium)." });
  if (avg.fatPct != null && avg.fatPct > 35) warns.push({ icon: "🧈", level: "watch", text: `${avg.fatPct}% of your calories come from fat (aim for 20 to 35%).`, fix: "Fewer fried foods and snacks." });
  const flagged = new Map<string, string[]>();
  for (const f of all) for (const [re, what] of BAD_INGREDIENTS) if (re.test(f.contents ?? "")) flagged.set(what, [...new Set([...(flagged.get(what) ?? []), f.name])]);
  for (const [what, names] of flagged) warns.push({ icon: "🏷️", level: "watch", text: `${names.join(", ")} contain${names.length === 1 ? "s" : ""} ${what}.`, fix: "Fine sometimes; don't make it daily." });
  const need = bodyOf(d).proteinNeed;
  if (byDay.size && avg.protein < need) warns.push({ icon: "🍗", level: avg.protein < need * 0.7 ? "bad" : "watch", text: `Protein about ${avg.protein} g a day; you need at least ${need} g (more, ${bodyOf(d).proteinBuild} g, to build muscle).`, fix: "Add eggs, chicken, fish, tofu, natto, dal, Greek yogurt or a protein shake to each meal." });

  const needs: Need[] = [
    { icon: "🥦", name: "Vegetables", days: daysWith("veg"), sources: "spinach, broccoli, cabbage, carrot, tomato, miso soup", take: "Half your plate vegetables at lunch and dinner" },
    { icon: "🍎", name: "Fruit", days: daysWith("fruit"), sources: "banana, apple, orange, kiwi, mikan", take: "1 or 2 fruits a day as a snack" },
    { icon: "🥚", name: "Eggs", days: daysWith("egg"), sources: "boiled egg, omelette, tamagoyaki", take: "1 or 2 eggs a day: cheap protein, B12 and vitamin D" },
    { icon: "🥛", name: "Milk / yogurt", days: daysWith("dairy"), sources: "milk, yogurt, cheese, paneer", take: "1 glass of milk or a yogurt a day for calcium" },
    { icon: "🫘", name: "Beans / tofu", days: daysWith("legume"), sources: "dal, natto, tofu, chana, edamame", take: "A bowl of dal or a pack of natto a day" },
    { icon: "🐟", name: "Fish", days: daysWith("fish"), sources: "salmon, saba, tuna, sardines", take: "Fish 2 times a week (omega-3, vitamin D)" },
  ].filter((n) => byDay.size > 0 && n.days < (n.name === "Fish" ? 2 : n.name === "Beans / tofu" ? 3 : 5));
  for (const [icon, name, gs, src] of VIT) {
    const dd = [...byDay.values()].filter((fs) => fs.some((f) => groupsOf(f).some((g) => gs.includes(g)))).length;
    if (byDay.size > 0 && dd < 4) needs.push({ icon, name, days: dd, sources: src, take: `Eat ${src.split(", ").slice(0, 3).join(", ")}` });
  }

  // Habits over the same 7 days.
  const sc = sched(d.profile.settings.schedule), s = d.profile.settings;
  const per = (n: number) => Math.round(n / Math.max(1, days.size));
  const mins = (re: RegExp, kinds: string[] = ["activity", "focus", "reading", "listening"]) => logs.filter((l) => kinds.includes(l.kind) && re.test(`${l.kind} ${l.data.name ?? ""} ${l.data.topic ?? ""}`)).reduce((n, l) => n + (Number(l.data.minutes) || (l.kind === "focus" ? 25 : 0)), 0);
  const learn = mins(/study|learn|read|focus|course|class|english|japanese|math|coding|code|listen/i);
  const pages = logs.filter((l) => l.kind === "pages" || l.data.pages).reduce((n, l) => n + (Number(l.data.pages) || 0), 0);
  const moveDays = new Set(logs.filter((l) => l.kind === "workout" || (l.kind === "activity" && /run|walk|gym|exercise|sport|yoga|swim|cycl|football/i.test(String(l.data.name)))).map((l) => l.day)).size;
  const water = per(logs.filter((l) => l.kind === "water").reduce((n, l) => n + (Number(l.data.ml) || 0), 0));
  const sleeps = logs.filter((l) => l.kind === "sleep" && l.data.end).map((l) => (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 3.6e6);
  const sleep = sleeps.length ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : 0;
  const screen = mins(/anime|manga|movie|series|youtube|game|reel|tiktok|instagram|netflix/i, ["activity", "media"]);
  const habits: Habit[] = [
    { icon: "📖", name: "Learning", have: `${per(learn)} min/day`, goal: `${sc.learnGoal} min`, ok: per(learn) >= sc.learnGoal * 0.8, fix: "Start with one 25-min focus session after breakfast" },
    { icon: "📚", name: "Reading", have: `${pages} pages/week`, goal: `${(s as unknown as { readGoal?: number }).readGoal ?? 10 * 7} pages`, ok: pages >= 50, fix: "Read 10 pages before bed instead of the phone" },
    { icon: "🏋️", name: "Exercise", have: `${moveDays} days/week`, goal: "4 days", ok: moveDays >= 4, fix: "Do today's workout on the Train tab (20 min)" },
    { icon: "💧", name: "Water", have: `${water} ml/day`, goal: `${s.water_goal_ml} ml`, ok: water >= s.water_goal_ml * 0.8, fix: "A glass after waking, with every meal, and every 2 hours" },
    { icon: "😴", name: "Sleep", have: sleep ? `${sleep} h` : "not logged", goal: `${s.sleep_goal_h} h`, ok: sleep >= s.sleep_goal_h - 0.5, fix: "Phone away 30 min before bed; same bed time daily" },
    { icon: "📺", name: "Screen fun", have: `${per(screen)} min/day`, goal: "under 60 min", ok: per(screen) <= 60, fix: "Watch after your learning goal is done, not before" },
  ];

  // What to take: the biggest gaps first, using what you already have.
  const have = haveFoods(d.pantry).map((p) => p.name.toLowerCase());
  const take: string[] = [];
  const mineFor = (re: RegExp) => have.filter((n) => re.test(n));
  if (byDay.size && avg.protein < need) { const m = mineFor(/egg|chicken|fish|tofu|natto|milk|yogh?urt|paneer|dal|protein|soy/); take.push(`Protein: ${m.length ? `you have ${m.slice(0, 3).join(", ")}; ` : ""}eggs, chicken, fish, tofu, natto or a protein shake`); }
  for (const n of needs.slice(0, 3)) { const m = mineFor(G.find(([g]) => n.name.toLowerCase().startsWith(g))?.[1] ?? /$^/); take.push(`${n.name}: ${m.length ? `you have ${m.slice(0, 3).join(", ")}; ` : ""}${n.take.toLowerCase()}`); }
  return { days: byDay.size, foods: all.length, avg, warns, needs, habits, take };
}

export const careToday = (d: Data) => care(d, new Date(`${toDay(new Date())}T23:59:59`));
