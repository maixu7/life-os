// The bottom menu (which tabs, their order, names and icons, and folder tabs
// that open a small menu of mini tabs) and which Base Camp sections show.
// The hero changes all of it in Customize (Tools, or long-press the menu).

export type Tab = { href: string; icon: string; label: string; items?: string[] };
export const ALL_TABS: Tab[] = [
  { href: "/learn", icon: "📖", label: "Learn" },
  { href: "/food", icon: "🍱", label: "Food" },
  { href: "/doctor", icon: "🩺", label: "Doctor" },
  { href: "/train", icon: "⚔️", label: "Train" },
  { href: "/today", icon: "📋", label: "Today" },
  { href: "/focus", icon: "🧘", label: "Dojo" },
  { href: "/tools", icon: "🧰", label: "Tools" },
  { href: "/calendar", icon: "📜", label: "Days" },
  { href: "/shop", icon: "🏪", label: "Shop" },
  { href: "/rank", icon: "🦸", label: "Hero" },
  { href: "/have", icon: "🎒", label: "My stuff" },
  { href: "/", icon: "🏯", label: "Base" },
];
// Base sits on the right; the app opens on the leftmost tab.
export const DEFAULT_TABS = ["/learn", "/food", "/doctor", "/train", "/today", "/tools", "/calendar", "/"];
export const MAX_TABS = 9;

export const SECTIONS: [string, string][] = [
  ["coach", "🥷 Sensei's next tasks"], ["learn", "📖 Learning today"], ["gaps", "🔍 What you're lacking"], ["care", "🩺 Take care of me"], ["sleep", "😴 Sleep and wake"],
  ["meals", "🍱 Food today"], ["gauges", "🎯 Today's gauges"], ["boss", "👹 Weekly boss and chest"], ["missions", "⚔ Daily missions"],
  ["potions", "🧪 Water and milk"], ["quests", "🗺 Side quests"], ["habits", "🔁 Habit quests"], ["library", "📚 Library"], ["pantry", "🎒 Inventory"],
];

export type Folder = { id: string; icon: string; label: string; items: string[] };
export type Ui = { tabs?: string[]; hide?: string[]; names?: Record<string, { icon?: string; label?: string }>; folders?: Folder[]; startLeft?: boolean };

// A tab with the hero's own name and icon; "folder:<id>" tabs hold mini tabs.
export function tabOf(href: string, ui?: Ui): Tab | undefined {
  const f = href.startsWith("folder:") ? ui?.folders?.find((x) => `folder:${x.id}` === href) : undefined;
  const base = f ? { href, icon: f.icon, label: f.label, items: f.items } : ALL_TABS.find((t) => t.href === href);
  if (!base) return undefined;
  const n = ui?.names?.[href];
  return { ...base, icon: n?.icon || base.icon, label: n?.label || base.label };
}
export const tabsOf = (ui?: Ui) => (ui?.tabs?.length ? ui.tabs : DEFAULT_TABS).map((h) => tabOf(h, ui)).filter((t): t is Tab => !!t);
