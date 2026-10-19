// Every Hero hub tool, by id. Any screen can open one with openHub(id):
// the floating ＋ menu, pinned actions on Base Camp, the Tools tab, Quick log.

export type HubId =
  | "camera" | "later" | "sleepplan" | "urge" | "detox" | "sos" | "night" | "morning" | "dump" | "planner" | "surprise"
  | "chain" | "skills" | "map" | "freeze" | "rival" | "loot" | "events" | "buddy" | "chat" | "inbox" | "share" | "lang";

export const HUB: { id: HubId; icon: string; label: string; group: "Do" | "Calm" | "Play" | "Talk" }[] = [
  { id: "camera", icon: "📸", label: "Snap anything", group: "Do" },
  { id: "later", icon: "📥", label: "Photos to scan", group: "Do" },
  { id: "morning", icon: "🌅", label: "Morning routine", group: "Do" },
  { id: "planner", icon: "🗓️", label: "Day planner", group: "Do" },
  { id: "dump", icon: "🧠", label: "Brain dump", group: "Do" },
  { id: "surprise", icon: "🎲", label: "Surprise me", group: "Do" },
  { id: "sleepplan", icon: "🛌", label: "Sleep planner", group: "Do" },
  { id: "sos", icon: "🆘", label: "SOS calm", group: "Calm" },
  { id: "urge", icon: "🌊", label: "Urge surfing", group: "Calm" },
  { id: "detox", icon: "📵", label: "Detox day", group: "Calm" },
  { id: "night", icon: "🌙", label: "Night mode", group: "Calm" },
  { id: "rival", icon: "😤", label: "Rival duel", group: "Play" },
  { id: "events", icon: "🎃", label: "Seasonal event", group: "Play" },
  { id: "loot", icon: "💎", label: "Loot bag", group: "Play" },
  { id: "freeze", icon: "🛡️", label: "Streak freeze", group: "Play" },
  { id: "skills", icon: "🌳", label: "Skill tree", group: "Play" },
  { id: "map", icon: "🗺️", label: "World map", group: "Play" },
  { id: "chain", icon: "🔗", label: "Habit chains", group: "Play" },
  { id: "buddy", icon: "🤝", label: "Buddy & duel", group: "Talk" },
  { id: "chat", icon: "💬", label: "Ask Sensei", group: "Talk" },
  { id: "inbox", icon: "🔔", label: "Inbox", group: "Talk" },
  { id: "share", icon: "📤", label: "Share card", group: "Talk" },
  { id: "lang", icon: "🌐", label: "Language", group: "Talk" },
];
export const hubOf = (id: string) => HUB.find((h) => h.id === id);
export const DEFAULT_PINS: HubId[] = ["camera", "surprise", "sos", "planner", "chat"];

export const openHub = (id: HubId) => window.dispatchEvent(new CustomEvent("lifeos-hub", { detail: id }));
