// Control Centre: how every screen is laid out. Each page has built-in
// blocks (which can be moved and hidden, never deleted) and the hero's own
// blocks (which can be added, edited and deleted). Blocks hold mini-slots:
// buttons that open a page, log something, or add food and drinks.
// Everything is saved in settings.ui, so it syncs to every device.

import type { Ui } from "@/lib/ui";

// What a mini-slot (a button inside a block, or in the quick bar) does.
export type SlotAction =
  | { type: "page"; href: string }
  | { type: "log"; name: string } // logs an activity by name ("Brush teeth")
  | { type: "meal"; name: string } // opens the food sheet for this meal button
  | { type: "drink" } | { type: "water"; ml?: number } | { type: "milk"; ml?: number }
  | { type: "photo" } // snap a meal
  | { type: "wake" } | { type: "sleep" } | { type: "anything" } // "log anything"
  | { type: "url"; url: string };
export type MiniSlot = { id: string; icon: string; label: string; action: SlotAction };

export type BlockKind = "slots" | "note" | "checklist" | "counter" | "widget";
export type Block = {
  id: string; kind: BlockKind; icon: string; title: string;
  slots?: MiniSlot[]; // kind "slots"
  text?: string; // kind "note"
  items?: string[]; // kind "checklist": each ticks off a log of that name for today
  goal?: number; unit?: string; // kind "counter"
  widget?: "water" | "kcal" | "study" | "exam"; // kind "widget" (Hero hub widgets)
};
export type PageLayout = { order?: string[]; hide?: string[]; blocks?: Block[]; open?: string[]; tuck?: string[] }; // open/tuck: kept on screen or moved into "More"
export type CustomPage = { id: string; icon: string; label: string }; // its blocks live in ui.pages["/custom/<id>"]

export const uid = () => Math.random().toString(36).slice(2, 10);
export const customHref = (id: string) => `/custom/${id}`;

// The built-in blocks of each page, in their default order.
export const PAGE_SECTIONS: Record<string, [string, string][]> = {
  "/today": [["quick", "⚡ Quick add (top icons)"], ["doing", "▶ In progress"], ["basics", "🗓️ Daily basics table"], ["mytasks", "📝 My tasks"], ["did", "✅ What you did"], ["fix", "🚨 Fix my worst habits"], ["quests", "🎯 App quests & goals"]],
  "/food": [["quick", "⚡ Quick add"], ["meals", "🍱 Food today"], ["drinks", "🥤 Drink today"], ["drink", "🥤 Log a drink"], ["next", "🍽️ What to eat next"], ["care", "🩺 Take care of me"], ["have", "🎒 Food you have"], ["packet", "🏷️ New packet food"], ["week", "📅 Last 7 days"], ["mine", "🍽️ My foods"],
    ["usual", "⭐ One-tap meals"], ["protein", "🥚 Protein today"], ["coffee", "☕ Caffeine"], ["bottle", "🍶 Water bottle"], ["ideas", "🧑‍🍳 Recipes, konbini, eating out"], ["cost", "💴 Food cost this week"]],
  "/train": [["list", "🏋️ My exercises"], ["plan", "📅 Today's full workout"], ["library", "📚 All exercises"], ["move", "🎯 Selected exercise"], ["lift", "📈 Strength forecast"], ["rest", "⏱️ Rest timer"], ["done", "✅ Today's sets"], ["streak", "🔥 Workout streak"], ["muscles", "🗺️ Muscle map"], ["records", "🏆 Personal records"]],
  "/learn": [["plan", "🗓️ Study plan"], ["today", "📖 Learning today"], ["books", "📚 Books you have"], ["library", "📚 Library (read, listen, watch)"], ["skills", "🧠 Skills: noob to expert"],
    ["cards", "🃏 Flashcards"], ["jlpt", "🈶 JLPT kanji"], ["mistakes", "📕 Mistake notebook"], ["papers", "📝 Past papers"]],
  "/": [["pins", "📌 Pinned actions & camera"], ["routine", "🌅 Morning routine"], ["event", "🎃 Seasonal event"], ["focus", "⏱️ Big focus button"], ["exam", "📝 Exam countdown and today's target"], ["coach", "🥷 Sensei's next tasks"], ["learn", "📖 Learning today"], ["gaps", "🔍 What you're lacking"], ["fix", "🚨 Fix my worst habits"], ["care", "🩺 Take care of me"], ["sleep", "😴 Sleep and wake"],
    ["meals", "🍱 Food today"], ["gauges", "🎯 Today's gauges"], ["boss", "👹 Weekly boss and chest"], ["missions", "⚔ Daily missions"],
    ["potions", "🧪 Water and milk"], ["quests", "🗺 Side quests"], ["habits", "🔁 Habit quests"], ["library", "📚 Library"], ["pantry", "🎒 Inventory"], ["rival", "⚔️ Rival duel & loot"]],
};
// Pages without a list above still get the hero's own blocks (shown at the top).

// The main job of each page: these blocks stay on screen. Everything else
// waits in the page's "More" strip, one tap away (the hero can move any block
// either way). Own blocks stay on screen.
export const PAGE_MAIN: Record<string, string[]> = {
  "/": ["pins", "coach", "missions", "sleep"],
  "/today": ["quick", "doing", "basics", "mytasks", "did"],
  "/food": ["quick", "meals", "drinks", "next"],
  "/train": ["plan", "list", "move", "done"],
  "/learn": ["plan", "today"],
};
export function onScreen(ui: Ui | undefined, href: string, id: string, own: boolean) {
  const p = pageOf(ui, href);
  if (p.tuck?.includes(id)) return false;
  if (own || p.open?.includes(id)) return true;
  return !PAGE_MAIN[href] || PAGE_MAIN[href].includes(id);
}

export const pageOf = (ui: Ui | undefined, href: string): PageLayout => {
  const p = ui?.pages?.[href] ?? {};
  // Base Camp's older "hide" list still counts.
  return href === "/" ? { ...p, hide: [...new Set([...(p.hide ?? []), ...(ui?.hide ?? [])])] } : p;
};

// The page's blocks in the hero's order: built-in ids and own block ids.
export function arrange(ui: Ui | undefined, href: string): { id: string; own?: Block }[] {
  const p = pageOf(ui, href);
  const builtIn = (PAGE_SECTIONS[href] ?? []).map(([id]) => id);
  const own = p.blocks ?? [];
  const all = [...builtIn, ...own.map((b) => b.id)];
  const order = [...(p.order ?? []).filter((x) => all.includes(x)), ...all.filter((x) => !(p.order ?? []).includes(x))];
  // Own blocks without a saved place go first, so a new block is easy to see.
  const placed = new Set(p.order ?? []);
  const fresh = own.filter((b) => !placed.has(b.id)).map((b) => b.id);
  const rest = order.filter((x) => !fresh.includes(x));
  return [...fresh, ...rest].filter((id) => !(p.hide ?? []).includes(id)).map((id) => ({ id, own: own.find((b) => b.id === id) }));
}

// Quick add bar: the icons at the top of Today (and Food).
export const QUICK_ALL: MiniSlot[] = [
  { id: "q-food", icon: "🍽️", label: "Add food", action: { type: "meal", name: "" } },
  { id: "q-photo", icon: "📷", label: "Food photo", action: { type: "photo" } },
  { id: "q-drink", icon: "🥤", label: "Drink", action: { type: "drink" } },
  { id: "q-water", icon: "💧", label: "Water", action: { type: "water", ml: 250 } },
  { id: "q-milk", icon: "🥛", label: "Milk", action: { type: "milk", ml: 250 } },
  { id: "q-train", icon: "⚔️", label: "Workout", action: { type: "page", href: "/train" } },
  { id: "q-wake", icon: "🌅", label: "Woke up", action: { type: "wake" } },
  { id: "q-sleep", icon: "😴", label: "Sleep", action: { type: "sleep" } },
  { id: "q-study", icon: "📖", label: "Study", action: { type: "page", href: "/learn" } },
  { id: "q-any", icon: "📝", label: "Log anything", action: { type: "anything" } },
  { id: "q-doctor", icon: "🩺", label: "Doctor", action: { type: "page", href: "/doctor" } },
  { id: "q-have", icon: "🎒", label: "My stuff", action: { type: "page", href: "/have" } },
  { id: "q-focus", icon: "⏱️", label: "Focus now", action: { type: "page", href: "/focus?start=1" } },
];
// Every slot that can go on the quick bar: built-in ones, your own quick
// slots, and the buttons inside your blocks.
export const quickChoices = (ui: Ui | undefined): MiniSlot[] => [
  ...QUICK_ALL, ...(ui?.quickOwn ?? []),
  ...Object.values(ui?.pages ?? {}).flatMap((p) => p.blocks ?? []).flatMap((b) => b.slots ?? []),
];
export const QUICK_DEFAULT = ["q-food", "q-photo", "q-drink", "q-water", "q-milk", "q-train", "q-wake", "q-sleep", "q-study", "q-any"];

// Meal buttons on Food today. The four classics are built in (they can be
// hidden, not deleted); the hero can add any eat or drink button with an icon.
export type MealSlot = { id: string; icon: string; label: string; drink?: boolean; builtIn?: boolean };
export const BUILTIN_MEALS: MealSlot[] = [
  { id: "m-breakfast", icon: "🍳", label: "Breakfast", builtIn: true }, { id: "m-lunch", icon: "🍱", label: "Lunch", builtIn: true },
  { id: "m-snack", icon: "🍪", label: "Snack", builtIn: true }, { id: "m-dinner", icon: "🍛", label: "Dinner", builtIn: true },
];
export const MEAL_IDEAS: [string, string, boolean?][] = [
  ["🥐", "Morning snack"], ["🍙", "Onigiri"], ["🍜", "Late-night ramen"], ["🍰", "Dessert"], ["🍌", "Fruit"], ["🥗", "Salad"], ["🥤", "Protein shake", true],
  ["☕", "Coffee", true], ["🍵", "Green tea", true], ["🧃", "Juice", true], ["🍺", "Beer", true], ["🥛", "Milk", true], ["🍫", "Sweets"], ["🌙", "Night snack"],
  ["🏋️", "Pre-workout", true], ["💪", "Post-workout meal"], ["🍱", "Bento"], ["🍞", "Bread"], ["🧋", "Bubble tea", true], ["🍦", "Ice cream"],
];
export function mealSlots(ui: Ui | undefined): MealSlot[] {
  const hide = ui?.mealHide ?? [];
  const order = ui?.mealOrder ?? [];
  const all = allMealSlots(ui);
  const sorted = [...order.map((id) => all.find((m) => m.id === id)).filter((m): m is MealSlot => !!m), ...all.filter((m) => !order.includes(m.id))];
  return sorted.filter((m) => !hide.includes(m.id));
}
// Built-in buttons can get the hero's own name and icon.
export const allMealSlots = (ui: Ui | undefined): MealSlot[] => [
  ...BUILTIN_MEALS.map((m) => ({ ...m, icon: ui?.names?.[m.id]?.icon || m.icon, label: ui?.names?.[m.id]?.label || m.label })),
  ...(ui?.meals ?? []),
];

// Emoji choices for icons (any emoji can also be typed).
export const ICONS = ("🍳 🍱 🍪 🍛 🍙 🍜 🍣 🍕 🍔 🌮 🥗 🍰 🍫 🍦 🍌 🍎 🍓 🥐 🍞 🧀 🥚 🍗 🥩 🐟 🥦 🥕 🍚 🍲 🥟 🍡 ☕ 🍵 🥤 🧃 🥛 🧋 🍺 🍷 💧 🍶 " +
  "📖 ✏️ 💻 🎧 🎮 📺 🎵 🏃 🚶 🏋️ ⚔️ 🧘 🚴 🏊 ⚽ 🛏️ 😴 🌅 🪥 🛁 🧹 🧺 🙏 💊 🩺 ❤️ 🔥 ⭐ ✅ 📝 📷 🎯 💰 🛒 🎒 🏠 🚗 ⏰ 📅 🧠 💡 🌱 🐶 🎁").split(" ");
