import type { Data } from "@/lib/store";

export type Slot = "head" | "cape" | "chest" | "gloves" | "legs" | "boots" | "weapon" | "offhand" | "base";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Gear = { id: string; slot: Slot; name: string; icon: string; price: number; level: number; rarity: Rarity; desc: string };

export const SLOTS: { id: Slot; label: string; ghost: string }[] = [
  { id: "head", label: "Head", ghost: "🪖" }, { id: "cape", label: "Cape", ghost: "🧣" }, { id: "chest", label: "Chest", ghost: "🥋" },
  { id: "gloves", label: "Gloves", ghost: "🧤" }, { id: "legs", label: "Legs", ghost: "👖" }, { id: "boots", label: "Boots", ghost: "🥾" },
  { id: "weapon", label: "Main hand", ghost: "🗡️" }, { id: "offhand", label: "Off hand", ghost: "🛡️" }, { id: "base", label: "Ground", ghost: "🟫" },
];

export const RARITY: Record<Rarity, string> = { common: "#adb5bd", rare: "#4cc9f0", epic: "#b388ff", legendary: "#ffd166" };

const g = (slot: Slot, id: string, name: string, icon: string, price: number, level: number, rarity: Rarity, desc: string): Gear => ({ id, slot, name, icon, price, level, rarity, desc });

export const GEAR: Gear[] = [
  g("head", "none-head", "Nothing", "∅", 0, 1, "common", "Let the hair flow."),
  g("head", "headband", "Ninja headband", "🎗️", 0, 1, "common", "Classic shinobi plate."),
  g("head", "goggles", "Tinker goggles", "🥽", 120, 1, "rare", "For inventors and coders."),
  g("head", "hood", "Shadow hood", "🧥", 200, 3, "rare", "Move unseen."),
  g("head", "helmet", "Knight helmet", "🪖", 350, 5, "epic", "Steel for the disciplined."),
  g("head", "catears", "Cat ears", "🐱", 150, 1, "rare", "Nya."),
  g("head", "horns", "Demon horns", "😈", 0, 4, "epic", "Unlocked at level 4. Wear your dark side."),
  g("head", "halo", "Angel halo", "😇", 0, 6, "legendary", "Unlocked at level 6. A true angel's mark."),
  g("head", "crown", "Hero's crown", "👑", 1500, 10, "legendary", "Only for kings of discipline."),
  g("cape", "none-cape", "Nothing", "∅", 0, 1, "common", "Light and free."),
  g("cape", "scarf", "Wind scarf", "🧣", 0, 1, "common", "Flutters as you run."),
  g("cape", "cloak", "Traveller cloak", "🧥", 180, 2, "rare", "Long, dark, mysterious."),
  g("cape", "royalcape", "Royal cape", "🟥", 600, 7, "epic", "Red and gold, for champions."),
  g("chest", "tunic", "Cloth tunic", "👕", 0, 1, "common", "Takes your outfit colour."),
  g("chest", "ninja", "Ninja gi", "🥋", 0, 1, "common", "Dark and silent."),
  g("chest", "leather", "Leather armour", "🦺", 150, 2, "rare", "With strap and pouches."),
  g("chest", "robe", "Mage robe", "🔮", 250, 3, "rare", "Long robe with gold trim."),
  g("chest", "plate", "Plate armour", "🛡️", 500, 6, "epic", "Heavy steel. Heavy honour."),
  g("chest", "dragon", "Dragon scale", "🐉", 2000, 12, "legendary", "Forged from a dragon's discipline."),
  g("gloves", "none-gloves", "Bare hands", "✋", 0, 1, "common", "Feel everything."),
  g("gloves", "wraps", "Hand wraps", "🤜", 0, 1, "common", "Fighter's wraps."),
  g("gloves", "leathergloves", "Leather gloves", "🧤", 80, 1, "rare", "Grip and style."),
  g("gloves", "gauntlets", "Steel gauntlets", "🦾", 300, 5, "epic", "Iron fists."),
  g("legs", "pants", "Cloth pants", "👖", 0, 1, "common", "Takes your pants colour."),
  g("legs", "shorts", "Training shorts", "🩳", 0, 1, "common", "Ready to run."),
  g("legs", "armorlegs", "Armoured greaves", "🦿", 300, 5, "epic", "Knee guards included."),
  g("boots", "shoes", "Sneakers", "👟", 0, 1, "common", "Takes your shoe colour."),
  g("boots", "boots", "Leather boots", "🥾", 100, 2, "rare", "Tall and tough."),
  g("boots", "steelboots", "Steel boots", "🛡️", 280, 5, "epic", "Stomp with authority."),
  g("boots", "sandals", "Sandals", "🩴", 0, 1, "common", "Summer vibes."),
  g("weapon", "none-weapon", "Nothing", "∅", 0, 1, "common", "Peaceful."),
  g("weapon", "kunai", "Kunai", "🔪", 0, 1, "common", "A ninja's best friend."),
  g("weapon", "sword", "Iron sword", "🗡️", 200, 2, "rare", "Straight and true."),
  g("weapon", "torch", "Torch", "🔥", 120, 1, "rare", "Lights the way."),
  g("weapon", "bow", "Hunter's bow", "🏹", 260, 3, "rare", "Aim for your goals."),
  g("weapon", "staff", "Arcane staff", "🪄", 400, 4, "epic", "Glows with focus."),
  g("weapon", "katana", "Katana", "⚔️", 800, 8, "legendary", "Sharpened by 1000 sessions."),
  g("offhand", "none-off", "Nothing", "∅", 0, 1, "common", "Free hand."),
  g("offhand", "book", "Spell book", "📕", 0, 1, "common", "Knowledge is power."),
  g("offhand", "shield", "Round shield", "🛡️", 220, 3, "rare", "Blocks bad habits."),
  g("offhand", "lantern", "Lantern", "🏮", 160, 2, "rare", "For late-night study."),
  g("offhand", "orb", "Spirit orb", "🔮", 700, 7, "epic", "Pulses with your aura."),
  g("base", "grass", "Grass field", "🌾", 0, 1, "common", "Where every journey starts."),
  g("base", "stone", "Stone arena", "🪨", 150, 2, "rare", "Training ground."),
  g("base", "snow", "Snow peak", "❄️", 250, 4, "rare", "Cold discipline."),
  g("base", "sakura", "Sakura grove", "🌸", 400, 5, "epic", "Petals fall for heroes."),
  g("base", "lava", "Lava rock", "🌋", 600, 7, "epic", "Forged in fire."),
  g("base", "cloud", "Heaven cloud", "☁️", 0, 9, "legendary", "Unlocked at level 9."),
];

export const DEFAULT_GEAR: Record<Slot, string> = {
  head: "headband", cape: "scarf", chest: "tunic", gloves: "wraps", legs: "pants", boots: "shoes", weapon: "kunai", offhand: "none-off", base: "grass",
};

export const gearById = (id: string) => GEAR.find((x) => x.id === id);

// Free gear is yours once you reach its level; paid gear once bought with gold.
export function ownedGear(d: Data, level: number) {
  const bought = new Set(d.logs.filter((l) => l.kind === "redeem" && l.data.gear).map((l) => String(l.data.gear)));
  return new Set(GEAR.filter((x) => (x.price === 0 && level >= x.level) || bought.has(x.id)).map((x) => x.id));
}
