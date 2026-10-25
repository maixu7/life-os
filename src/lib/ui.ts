import type { CustomPage, MealSlot, MiniSlot, PageLayout } from "@/lib/layout";

// The bottom menu (which tabs, their order, names and icons, and folder tabs
// that open a small menu of mini tabs) and which Base Camp sections show.
// The hero changes all of it in Customize (Tools, or long-press the menu).

export type Tab = { href: string; icon: string; label: string; items?: string[] };
export const ALL_TABS: Tab[] = [
  { href: "/learn", icon: "📖", label: "Learn" },
  { href: "/food", icon: "🍱", label: "Food" },
  { href: "/doctor", icon: "🩺", label: "Doctor" },
  { href: "/train", icon: "⚔️", label: "Train" },
  { href: "/fit", icon: "🎯", label: "Focus Area" },
  { href: "/today", icon: "📋", label: "Today" },
  { href: "/focus", icon: "🧘", label: "Dojo" },
  { href: "/tools", icon: "🧰", label: "Tools" },
  { href: "/calendar", icon: "📜", label: "Days" },
  { href: "/shop", icon: "🛒", label: "Shopping" },
  { href: "/rank", icon: "🦸", label: "Hero" },
  { href: "/have", icon: "🎒", label: "My stuff" },
  { href: "/trophies", icon: "🏆", label: "Trophies" },
  { href: "/", icon: "🏯", label: "Base" },
  { href: "/quick", icon: "⚡", label: "Quick log" },
];
// Base sits on the right; the app opens on the leftmost tab.
export const DEFAULT_TABS = ["/learn", "/today", "/food", "/train", "/tools", "/doctor", "/calendar", "/"];
export const MAX_TABS = 9;

export const SECTIONS: [string, string][] = [
  ["focus", "⏱️ Big focus button"], ["exam", "📝 Exam countdown"], ["coach", "🥷 Sensei's next tasks"], ["learn", "📖 Learning today"], ["gaps", "🔍 What you're lacking"], ["fix", "🚨 Fix my worst habits"], ["care", "🩺 Take care of me"], ["sleep", "😴 Sleep and wake"],
  ["meals", "🍱 Food today"], ["gauges", "🎯 Today's gauges"], ["boss", "👹 Weekly boss and chest"], ["missions", "⚔ Daily missions"],
  ["potions", "🧪 Water and milk"], ["quests", "🗺 Side quests"], ["habits", "🔁 Habit quests"], ["library", "📚 Library"], ["pantry", "🎒 Inventory"],
  ["pins", "📌 Pinned actions & camera"], ["routine", "🌅 Morning routine"], ["event", "🎃 Seasonal event"], ["rival", "⚔️ Rival duel & loot"],
];

export type Folder = { id: string; icon: string; label: string; items: string[] };
export type Ui = {
  tabs?: string[]; hide?: string[]; names?: Record<string, { icon?: string; label?: string }>; folders?: Folder[]; startLeft?: boolean;
  // Control Centre
  pages?: Record<string, PageLayout>; // block order, hidden built-ins and own blocks per page
  custom?: CustomPage[]; // the hero's own pages (at /custom/<id>)
  quick?: string[]; quickOwn?: MiniSlot[]; // quick add icons at the top of Today and Food, and your own ones
  meals?: MealSlot[]; mealHide?: string[]; mealOrder?: string[]; // meal and drink buttons on Food today
};

// A tab with the hero's own name and icon; "folder:<id>" tabs hold mini tabs.
export function tabOf(href: string, ui?: Ui): Tab | undefined {
  const f = href.startsWith("folder:") ? ui?.folders?.find((x) => `folder:${x.id}` === href) : undefined;
  const cp = href.startsWith("/custom/") ? ui?.custom?.find((x) => `/custom/${x.id}` === href) : undefined;
  const base = f ? { href, icon: f.icon, label: f.label, items: f.items } : cp ? { href, icon: cp.icon, label: cp.label } : ALL_TABS.find((t) => t.href === href);
  if (!base) return undefined;
  const n = ui?.names?.[href];
  return { ...base, icon: n?.icon || base.icon, label: n?.label || base.label };
}
// Every page you can put on the menu: built-in ones and your own.
export const allPages = (ui?: Ui): Tab[] => [...ALL_TABS, ...(ui?.custom ?? []).map((c) => ({ href: `/custom/${c.id}`, icon: c.icon, label: c.label }))].map((t) => tabOf(t.href, ui) ?? t);
export const tabsOf = (ui?: Ui) => (ui?.tabs?.length ? ui.tabs : DEFAULT_TABS).map((h) => tabOf(h, ui)).filter((t): t is Tab => !!t);
