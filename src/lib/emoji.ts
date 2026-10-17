// Picks a picture for anything you type, so "apple" shows 🍎 and "push-ups" shows 💪.
const MAP: [string[], string][] = [
  [["apple"], "🍎"], [["green apple"], "🍏"], [["banana"], "🍌"], [["orange", "mandarin", "tangerine", "suntala"], "🍊"],
  [["lemon", "lime", "kagati"], "🍋"], [["mango", "aanp"], "🥭"], [["grape"], "🍇"], [["watermelon", "tarbuja"], "🍉"],
  [["melon"], "🍈"], [["strawberr"], "🍓"], [["cherr"], "🍒"], [["peach"], "🍑"], [["pear"], "🍐"], [["pineapple"], "🍍"],
  [["kiwi"], "🥝"], [["coconut", "nariwal"], "🥥"], [["blueberr"], "🫐"], [["papaya", "guava", "pomegranate", "anar"], "🍈"],
  [["tomato", "golbheda"], "🍅"], [["potato", "aalu", "aloo"], "🥔"], [["carrot", "gajar"], "🥕"], [["corn", "makai"], "🌽"],
  [["chili", "chilli", "pepper", "khursani"], "🌶️"], [["cucumber", "kakra"], "🥒"], [["broccoli", "cauliflower", "cauli"], "🥦"],
  [["lettuce", "spinach", "saag", "cabbage", "leaf"], "🥬"], [["garlic", "lasun"], "🧄"], [["onion", "pyaj"], "🧅"],
  [["mushroom", "chyau"], "🍄"], [["eggplant", "brinjal", "bhanta"], "🍆"], [["avocado"], "🥑"], [["ginger", "aduwa"], "🫚"],
  [["bean", "lentil", "dal", "daal"], "🫘"], [["peanut", "nut", "almond", "cashew", "badam"], "🥜"],
  [["bread", "toast", "pauroti"], "🍞"], [["croissant"], "🥐"], [["rice", "bhat", "chamal"], "🍚"], [["noodle", "ramen", "chowmein", "wai wai", "waiwai"], "🍜"],
  [["pasta", "spaghetti"], "🍝"], [["egg", "anda", "phul"], "🥚"], [["cheese", "paneer"], "🧀"], [["butter"], "🧈"],
  [["chicken", "kukhura"], "🍗"], [["meat", "mutton", "buff", "masu"], "🍖"], [["beef", "steak"], "🥩"], [["bacon"], "🥓"],
  [["fish", "machha"], "🐟"], [["shrimp", "prawn"], "🦐"], [["momo", "dumpling"], "🥟"], [["pizza"], "🍕"], [["burger"], "🍔"],
  [["fries", "chips"], "🍟"], [["sandwich"], "🥪"], [["taco"], "🌮"], [["sushi"], "🍣"], [["curry", "tarkari"], "🍛"],
  [["soup"], "🥣"], [["salad"], "🥗"], [["popcorn"], "🍿"], [["salt", "nun"], "🧂"], [["sugar", "chini"], "🍬"],
  [["chocolate"], "🍫"], [["cookie", "biscuit"], "🍪"], [["cake"], "🍰"], [["ice cream"], "🍨"], [["candy", "sweet"], "🍬"],
  [["honey"], "🍯"], [["oil", "tel"], "🫗"], [["flour", "atta", "maida"], "🌾"],
  [["milk", "dudh"], "🥛"], [["water", "pani"], "💧"], [["coffee"], "☕"], [["tea", "chiya", "chai"], "🍵"], [["juice"], "🧃"],
  [["beer"], "🍺"], [["wine"], "🍷"], [["soda", "coke", "cola", "drink"], "🥤"], [["yogurt", "curd", "dahi"], "🥛"],
  [["soap", "sabun"], "🧼"], [["shampoo", "lotion"], "🧴"], [["toothpaste", "toothbrush", "brush teeth", "brush"], "🪥"],
  [["tissue", "toilet paper"], "🧻"], [["sponge"], "🧽"], [["detergent", "laundry", "washing"], "🧺"],
  [["medicine", "tablet", "pill", "vitamin"], "💊"], [["bandage"], "🩹"], [["battery"], "🔋"], [["charger", "cable"], "🔌"],
  [["pen", "pencil"], "✏️"], [["notebook", "copy"], "📓"], [["book"], "📚"], [["shirt", "t-shirt", "tshirt"], "👕"],
  [["pant", "jeans", "trouser"], "👖"], [["shoe", "sneaker"], "👟"], [["sock"], "🧦"], [["cap", "hat"], "🧢"],
  [["wake", "woke", "morning"], "🌅"], [["sleep", "nap", "bed"], "😴"], [["bath", "shower", "nuhau"], "🛁"],
  [["breakfast"], "🍳"], [["lunch"], "🍱"], [["dinner"], "🍽️"], [["snack", "khaja"], "🥨"], [["meal", "eat", "khana"], "🍽️"],
  [["typing"], "⌨️"], [["writing", "write"], "✍️"], [["speak", "speech"], "🗣️"],
  [["study", "homework", "exam", "padhai"], "📖"], [["read"], "📚"], [["listen", "music", "song", "podcast"], "🎧"],
  [["drive", "ride", "scooter"], "🛵"], [["toilet", "pee", "washroom"], "🚽"], [["walk"], "🚶"], [["run", "jog"], "🏃"], [["cycle", "bike"], "🚴"], [["swim"], "🏊"], [["yoga", "meditat", "stretch"], "🧘"],
  [["gym", "workout", "exercise", "train"], "🏋️"], [["push-up", "pushup", "pull-up", "pullup", "curl", "bench", "press"], "💪"],
  [["squat", "lunge"], "🦵"], [["clean", "sweep", "mop"], "🧹"], [["cook"], "🍳"], [["laundry", "clothes"], "🧺"],
  [["pray", "puja", "temple"], "🙏"], [["work", "office", "job"], "💼"], [["school", "college", "class"], "🏫"],
  [["anime"], "📺"], [["manga", "comic"], "📕"], [["game", "gaming"], "🎮"], [["phone", "social", "tiktok", "youtube"], "📱"],
  [["friend", "call"], "📞"], [["shop", "market", "groceries"], "🛒"], [["money", "pay", "bill"], "💵"], [["code", "program", "laptop", "computer"], "💻"],
  [["draw", "paint", "art"], "🎨"], [["guitar"], "🎸"], [["piano"], "🎹"], [["dog"], "🐕"], [["cat"], "🐈"], [["plant", "garden", "water plants"], "🪴"],
  [["skincare", "face wash"], "🧴"], [["haircut", "hair"], "💇"], [["vitamin"], "💊"],
];

export function emojiFor(name: string, fallback = "✨") {
  const n = ` ${name.toLowerCase().trim()} `;
  let best: { e: string; len: number } | null = null;
  for (const [words, e] of MAP) {
    for (const w of words) {
      if (n.includes(w) && (!best || w.length > best.len)) best = { e, len: w.length };
    }
  }
  return best?.e ?? fallback;
}
