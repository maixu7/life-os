import type { PantryItem } from "@/lib/store";

// Cheap, healthy, quick dishes made from things sold in any Japanese
// supermarket. Each one is matched against What I have, so the dishes you can
// cook right now come first. Prices are per serving at supermarket prices.

export type Recipe = { id: string; name: string; emoji: string; mins: number; yen: number; kcal: number; protein: number; needs: [string, RegExp][]; basics: string; steps: string[]; tags: string[] };

// "Egg=egg|tamago|卵|たまご" → a label and what counts as having it.
const ing = (s: string): [string, RegExp] => { const [label, re] = s.split("="); return [label, new RegExp(re ?? label, "i")]; };
const R = (id: string, name: string, emoji: string, mins: number, yen: number, kcal: number, protein: number, needs: string, basics: string, steps: string, tags = ""): Recipe =>
  ({ id, name, emoji, mins, yen, kcal, protein, needs: needs.split(",").map((x) => ing(x.trim())), basics, steps: steps.split(" / "), tags: tags ? tags.split(",") : [] });

const EGG = "Eggs=egg|tamago|卵|たまご", RICE = "Rice=rice|ご飯|ごはん|米|gohan", TOFU = "Tofu=tofu|豆腐", NATTO = "Natto=natto|納豆";
const CHICKEN = "Chicken breast=chicken|鶏|とり|サラダチキン", CABBAGE = "Cabbage=cabbage|キャベツ", MOYASHI = "Bean sprouts=sprout|moyashi|もやし";
const NEGI = "Green onion=onion|negi|ねぎ|ネギ", TUNA = "Canned tuna=tuna|ツナ|シーチキン", SABA = "Canned mackerel=mackerel|saba|サバ|さば";
const SPINACH = "Spinach or komatsuna=spinach|komatsuna|ほうれん草|小松菜|greens", MILK = "Milk=milk|牛乳", OATS = "Oats=oat|オートミール";
const BANANA = "Banana=banana|バナナ", UDON = "Frozen udon=udon|うどん", PASTA = "Pasta=pasta|spaghetti|パスタ|スパゲッティ";
const PORK = "Pork slices=pork|豚", KIMCHI = "Kimchi=kimchi|キムチ", CARROT = "Carrot=carrot|にんじん|人参", ONION = "Onion=\\bonion|玉ねぎ|たまねぎ";
const POTATO = "Potato=potato|じゃがいも", MISO = "Miso=miso|味噌|みそ", TOMATO = "Tomato=tomato|トマト", YOGURT = "Yogurt=yog|ヨーグルト";
const WAKAME = "Wakame=wakame|わかめ|seaweed", BREAD = "Bread=bread|toast|パン|食パン", CHEESE = "Cheese=cheese|チーズ", FROZENVEG = "Frozen vegetables=frozen veg|mixed veg|冷凍野菜|broccoli|ブロッコリー";
const MINCE = "Minced meat=mince|ground|ひき肉|挽肉", SOYMILK = "Soy milk=soy milk|豆乳", NOODLE = "Instant ramen=ramen|ラーメン|noodle";

export const RECIPES: Recipe[] = [
  R("tkg", "Natto egg rice (TKG)", "🍚", 3, 90, 520, 22, `${RICE},${EGG},${NATTO}`, "soy sauce", "Put hot rice in a bowl / Make a hole, crack in a fresh egg / Add natto with its sauce and a drop of soy sauce, mix", "breakfast,fast"),
  R("tamago-don", "Fluffy egg and onion bowl", "🍳", 10, 110, 560, 20, `${RICE},${EGG},${NEGI}`, "soy sauce, mirin or sugar, dashi or water", "Simmer sliced onion in 80 ml water, 1 tbsp soy sauce and 1 tsp sugar / Pour in 2 beaten eggs, cover 1 minute until just set / Slide onto hot rice", "fast"),
  R("moyashi-egg", "Bean sprout and egg stir-fry", "🥚", 8, 70, 260, 15, `${MOYASHI},${EGG}`, "oil, salt, pepper, soy sauce", "Scramble 2 eggs in oil and take them out / Fry a bag of bean sprouts on high heat for 2 minutes / Add the eggs back, season with salt, pepper and soy sauce", "cheap,lean"),
  R("tofu-steak", "Crispy tofu steak", "🧈", 12, 80, 300, 21, `${TOFU}`, "potato starch or flour, oil, soy sauce", "Press the tofu in kitchen paper 5 minutes, cut into 2 thick slices / Dust with starch and fry 3 minutes a side until golden / Pour over 1 tbsp soy sauce (and grated ginger or negi)", "cheap,lean"),
  R("hiyayakko", "Cold tofu with negi and katsuobushi", "🧊", 2, 60, 160, 14, `${TOFU},${NEGI}`, "soy sauce, katsuobushi (optional)", "Put cold tofu on a plate / Top with chopped negi and katsuobushi / Pour a little soy sauce", "fast,lean"),
  R("chicken-cabbage", "Chicken and cabbage miso stir-fry", "🍗", 15, 220, 380, 35, `${CHICKEN},${CABBAGE},${MISO}`, "oil, sugar", "Cut chicken into strips and fry until white / Add a quarter cabbage, cut rough, and fry 3 minutes / Mix in 1 tbsp miso, 1 tsp sugar and a splash of water", "muscle"),
  R("salad-chicken-rice", "Salad chicken rice bowl", "🥗", 5, 300, 560, 36, `${RICE},${CHICKEN},${CABBAGE}`, "sesame dressing or soy sauce", "Shred cabbage and put it on hot rice / Slice the salad chicken on top / Add dressing", "muscle,fast"),
  R("oyakodon", "Oyakodon (chicken and egg bowl)", "🍲", 15, 250, 650, 38, `${RICE},${CHICKEN},${EGG},${ONION}`, "soy sauce, mirin or sugar, dashi", "Simmer sliced onion and bite-size chicken in 100 ml dashi, 1.5 tbsp soy sauce and 1 tbsp mirin, 5 minutes / Pour in 2 beaten eggs, cover 1 minute / Slide onto rice", "muscle"),
  R("tuna-rice", "Tuna mayo rice with seaweed", "🍙", 3, 150, 560, 20, `${RICE},${TUNA}`, "mayonnaise, soy sauce, nori (optional)", "Drain a can of tuna / Mix with a little mayo and soy sauce / Pile on rice, wrap with nori", "fast"),
  R("saba-don", "Mackerel can rice bowl", "🐟", 4, 200, 620, 30, `${RICE},${SABA},${NEGI}`, "soy sauce, ginger (optional)", "Warm the mackerel in its liquid / Put it on rice and pour over a little of the liquid / Top with lots of negi", "fast,omega-3"),
  R("saba-miso-soup", "Mackerel and veg miso soup", "🍜", 10, 180, 300, 22, `${SABA},${MISO},${CABBAGE}`, "water", "Boil 400 ml water with cabbage or any veg 4 minutes / Add the mackerel with its liquid / Turn off the heat and melt in 1.5 tbsp miso", "omega-3"),
  R("tonjiru", "Pork and vegetable miso soup (tonjiru)", "🍲", 20, 180, 280, 15, `${PORK},${MISO},${CARROT},${POTATO}`, "oil, water", "Fry pork slices until white / Add sliced carrot, potato (and any root veg) and 600 ml water, simmer 12 minutes / Melt in 2.5 tbsp miso. Serves 2", "warm"),
  R("butakimchi", "Pork kimchi stir-fry", "🌶️", 10, 230, 420, 24, `${PORK},${KIMCHI},${MOYASHI}`, "oil, soy sauce", "Fry pork slices until crispy at the edges / Add bean sprouts and kimchi, fry 2 minutes / A splash of soy sauce", "muscle"),
  R("ginger-pork", "Ginger pork (shogayaki) with cabbage", "🐖", 12, 260, 480, 26, `${PORK},${CABBAGE}`, "soy sauce, sugar or mirin, ginger", "Fry pork slices / Add 1 tbsp soy sauce, 1 tbsp mirin and grated ginger, coat the meat / Serve on shredded cabbage", "muscle"),
  R("spinach-ohitashi", "Spinach ohitashi with egg", "🥬", 8, 90, 120, 9, `${SPINACH},${EGG}`, "soy sauce, katsuobushi", "Boil the greens 1 minute, cool in water, squeeze and cut / Boil an egg 8 minutes / Top greens with soy sauce and katsuobushi, egg on the side", "lean"),
  R("veg-omelette", "Vegetable omelette", "🍳", 10, 110, 300, 18, `${EGG},${FROZENVEG}`, "oil, salt, ketchup (optional)", "Fry a handful of frozen veg 2 minutes / Pour in 3 beaten eggs with a pinch of salt / Fold when the edges set", "lean,breakfast"),
  R("overnight-oats", "Overnight oats with banana", "🥣", 3, 90, 380, 15, `${OATS},${MILK},${BANANA}`, "honey (optional)", "Mix 40 g oats with 150 ml milk in a cup / Leave in the fridge overnight / Top with sliced banana in the morning", "breakfast,fast"),
  R("yogurt-bowl", "Yogurt banana oat bowl", "🍌", 2, 120, 330, 14, `${YOGURT},${BANANA},${OATS}`, "", "Put yogurt in a bowl / Add sliced banana and 2 spoons of oats", "breakfast,fast"),
  R("kimchi-udon", "Kimchi egg udon", "🍜", 8, 130, 450, 17, `${UDON},${KIMCHI},${EGG}`, "soy sauce or mentsuyu, water", "Boil 350 ml water with 2 tbsp mentsuyu / Add frozen udon and kimchi, 3 minutes / Crack in an egg, cover 1 minute", "warm"),
  R("niku-udon", "Pork and negi udon", "🍜", 10, 200, 520, 22, `${UDON},${PORK},${NEGI}`, "mentsuyu or soy sauce, water", "Boil 350 ml water with 2 tbsp mentsuyu / Add pork slices, then frozen udon, 3 minutes / Top with lots of negi", "warm"),
  R("tuna-pasta", "Tuna and tomato pasta", "🍝", 12, 180, 600, 28, `${PASTA},${TUNA},${TOMATO}`, "olive oil, garlic, salt", "Boil 100 g pasta / Fry chopped tomato in oil and garlic, add tuna / Toss with pasta and a splash of the pasta water", ""),
  R("ramen-upgrade", "Instant ramen upgrade (egg + veg)", "🍥", 6, 130, 520, 18, `${NOODLE},${EGG},${MOYASHI}`, "", "Cook the noodles as on the pack, add bean sprouts for the last minute / Crack in an egg and cover / Use half the soup powder to cut the salt", "fast"),
  R("mapo-tofu", "Easy mapo tofu", "🌶️", 15, 200, 450, 28, `${TOFU},${MINCE},${NEGI}`, "miso, soy sauce, chili oil, starch", "Fry minced meat until brown / Add 150 ml water, 1 tbsp miso, 1 tsp soy sauce and cubed tofu, simmer 3 minutes / Thicken with starch water, top with negi", "muscle"),
  R("cheese-toast", "Egg cheese toast", "🍞", 6, 100, 380, 19, `${BREAD},${EGG},${CHEESE}`, "mayonnaise", "Make a mayo ring on the bread / Crack an egg in the middle, add cheese / Toast 6 to 8 minutes", "breakfast"),
  R("soy-milk-soup", "Soy milk tofu soup", "🥛", 10, 120, 240, 18, `${SOYMILK},${TOFU},${CABBAGE}`, "miso or consommé", "Simmer cabbage in 150 ml water 3 minutes / Add tofu and 200 ml soy milk, heat without boiling / Season with miso", "lean,warm"),
  R("curry-veg", "Chicken vegetable curry", "🍛", 30, 220, 700, 30, `${RICE},${CHICKEN},${ONION},${CARROT},${POTATO}`, "curry roux, oil, water", "Fry chicken and onion / Add carrot, potato and water, simmer 15 minutes / Melt in the roux. Makes 4: freeze the rest", "batch"),
  R("wakame-soup", "Wakame egg soup", "🥣", 5, 50, 90, 7, `${WAKAME},${EGG},${NEGI}`, "chicken stock powder, soy sauce", "Boil 400 ml water with stock powder / Add dried wakame / Drizzle in a beaten egg, top with negi", "lean,fast"),
];

// How many of a recipe's main ingredients you have (names and Japanese names).
export function matchRecipes(pantry: PantryItem[]) {
  const have = pantry.filter((p) => p.qty > 0).map((p) => `${p.name} ${p.ja ?? ""}`);
  return RECIPES.map((r) => {
    const got = r.needs.filter(([, re]) => have.some((h) => re.test(h)));
    const missing = r.needs.filter((n) => !got.includes(n)).map(([l]) => l);
    return { r, got: got.length, missing, pct: got.length / r.needs.length };
  }).sort((a, b) => b.pct - a.pct || a.missing.length - b.missing.length || b.r.protein / b.r.yen - a.r.protein / a.r.yen);
}
