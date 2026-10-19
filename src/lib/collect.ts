import type { Task } from "@/lib/coach";
import { itemKind, kitOf, withGear, type Gear } from "@/lib/have";
import { toDay, type Data } from "@/lib/store";

// Tasks the app makes from your collections: food and drinks you have at
// home, and your gym gear (a different piece each day).

const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function collectionTasks(d: Data, now = new Date()): Task[] {
  const out: Task[] = [];
  const h = now.getHours(), day = toDay(now);
  const logs = d.logs.filter((l) => l.day === day);
  const ate = (name: string, days: number) => d.logs.some((l) => Date.now() - new Date(l.created_at).getTime() < days * 86_400_000 &&
    (String(l.data.name ?? "").toLowerCase() === name.toLowerCase() || ((l.data.foods as { name: string }[] | undefined) ?? []).some((f) => f.name.toLowerCase() === name.toLowerCase())));
  const meal = h < 11 ? "Breakfast" : h < 16 ? "Lunch" : "Dinner";
  // Fruit and vegetables at home that you haven't had for 2 days.
  if (h >= 7 && h < 21) {
    const fresh = d.pantry.filter((p) => p.qty > 0 && ["fruit", "veg"].includes(itemKind(p)) && !ate(p.name, 2));
    const p = fresh[seed(day) % Math.max(1, fresh.length)];
    if (p) out.push({ id: `coll-fresh-${p.id}`, icon: p.emoji || "🍎", title: `Have ${p.name} today (you have ${p.qty} ${p.unit})`, priority: 44, action: { type: "activity", name: meal },
      because: `${p.name} is in your food collection and you haven't had it for 2 days.`, why: "Fresh food at home gets eaten before it spoils, and it beats a snack you'd buy." });
  }
  // A drink from your collection when water is behind.
  const ml = logs.filter((l) => ["water", "drink", "milk"].includes(l.kind)).reduce((s, l) => s + (Number(l.data.ml) || 0), 0);
  const drinks = d.pantry.filter((p) => p.qty > 0 && itemKind(p) === "drink" && !/beer|sake|wine|chuhai|cola|energy/i.test(p.name));
  if (h >= 10 && h < 20 && drinks.length && ml < (d.profile.settings.water_goal_ml || 2000) * Math.min(1, (h - 7) / 14)) {
    const p = drinks[seed(day + h) % drinks.length];
    out.push({ id: `coll-drink-${p.id}`, icon: p.emoji || "🥤", title: `Drink a ${p.name} from your collection`, priority: 42, action: { type: "href", href: "/food" },
      because: `You've had ${ml} ml so far today, behind for this time, and you have ${p.qty} ${p.unit} at home.`, why: "Staying hydrated keeps focus and energy up." });
  }
  // One piece of your gym gear each day, with a move for it.
  const kit = kitOf(d.pantry), gear = Object.keys(kit) as Gear[];
  const trained = logs.some((l) => l.kind === "workout");
  if (gear.length && !trained && h >= 6 && h < 22) {
    const g = gear[seed(`${day}g`) % gear.length], moves = withGear(kit, g);
    const m = moves[seed(`${day}m`) % Math.max(1, moves.length)];
    if (m) out.push({ id: `coll-gear-${g}`, icon: "🏋️", title: `Use your ${kit[g]!.label.toLowerCase()}: ${m.name}, 3 sets`, priority: 39, action: { type: "href", href: `/train?ex=${encodeURIComponent(m.name)}` },
      because: `Picked from your gym collection for today (${kit[g]!.count} × ${kit[g]!.label.toLowerCase()}${kit[g]!.kg.length ? `, ${[...new Set(kit[g]!.kg)].join("/")} kg` : ""}).`, why: "Using what you own keeps training free and varied." });
  }
  return out;
}
