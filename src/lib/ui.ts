// Which tabs sit in the bottom menu and which Base Camp sections show.
// The hero changes both in Tools → Customize.

export type Tab = { href: string; icon: string; label: string };
export const ALL_TABS: Tab[] = [
  { href: "/", icon: "🏯", label: "Base" },
  { href: "/learn", icon: "📖", label: "Learn" },
  { href: "/focus", icon: "🧘", label: "Dojo" },
  { href: "/train", icon: "⚔️", label: "Train" },
  { href: "/shop", icon: "🏪", label: "Shop" },
  { href: "/tools", icon: "🧰", label: "Tools" },
  { href: "/calendar", icon: "📜", label: "Days" },
  { href: "/doctor", icon: "🩺", label: "Doctor" },
  { href: "/rank", icon: "🦸", label: "Hero" },
];
export const DEFAULT_TABS = ["/", "/learn", "/focus", "/train", "/shop", "/tools", "/calendar"];

export const SECTIONS: [string, string][] = [
  ["coach", "🥷 Sensei's next tasks"], ["learn", "📖 Learning today"], ["gaps", "🔍 What you're lacking"], ["sleep", "😴 Sleep and wake"],
  ["meals", "🍱 Food today"], ["gauges", "🎯 Today's gauges"], ["boss", "👹 Weekly boss and chest"], ["missions", "⚔ Daily missions"],
  ["potions", "🧪 Water and milk"], ["quests", "🗺 Side quests"], ["habits", "🔁 Habit quests"], ["library", "📚 Library"], ["pantry", "🎒 Inventory"],
];

export type Ui = { tabs?: string[]; hide?: string[] };
export const tabsOf = (ui?: Ui) => (ui?.tabs?.length ? ui.tabs : DEFAULT_TABS).map((h) => ALL_TABS.find((t) => t.href === h)).filter((t): t is Tab => !!t);
