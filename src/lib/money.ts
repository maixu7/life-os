import { kindOf } from "@/lib/have";
import { toDay, type CustomItem, type Data, type Log, type ShopItem } from "@/lib/store";

// Money in one place: what was spent (bought items on the shop list, receipts,
// meals out), per category against its monthly budget, subscriptions, savings
// jars and the allowance payday. Everything here is pure, so it's easy to test.

export const CATS: [string, string][] = [
  ["Food", "🍚"], ["Eating out", "🍜"], ["Snacks", "🍫"], ["Drinks", "🥤"], ["Household", "🧻"], ["Transport", "🚃"],
  ["Phone & net", "📱"], ["Subscriptions", "📺"], ["Study", "📚"], ["Fun", "🎮"], ["Clothes", "👕"], ["Health & beauty", "💊"], ["Other", "📦"],
];
export const catIcon = (c: string) => CATS.find(([n]) => n.toLowerCase() === c.toLowerCase())?.[1] ?? "🏷️";

const FOODISH = /food|grocer|eat|meal|lunch|dinner|snack|konbini|restaurant|cafe|café|drink|bento|fruit|veg/i;
// A bought thing's category: what you typed, else a guess from its name.
export function catOf(i: Pick<ShopItem, "name" | "category">): string {
  if (i.category?.trim()) return i.category.trim();
  const k = kindOf(i.name);
  return k === "drink" ? "Drinks" : k === "food" || k === "fruit" || k === "veg" ? "Food" : k === "book" ? "Study" : "Other";
}
export const isFoodSpend = (i: Pick<ShopItem, "name" | "category">) => FOODISH.test(catOf(i));

export const bought = (d: Data) => d.shopping.filter((s) => s.status === "purchased" && s.purchased_at && s.price != null);
// Local day of a purchase (purchased_at is stored in UTC).
export const buyDay = (s: ShopItem) => toDay(new Date(s.purchased_at!));

export const daysIn = (month: string) => { const [y, m] = month.split("-").map(Number); return new Date(y, m, 0).getDate(); };
export const allowanceOf = (d: Data, month: string) => d.profile.settings.allowances[month] ?? d.profile.settings.budget_monthly;

// ---------- Subscriptions ----------
export type Sub = { id: string; name: string; emoji: string; price: number; cycle: "month" | "year"; day: number; since: string; uses?: number; checked?: string };
export const subOf = (i: CustomItem): Sub => ({
  id: i.id, name: i.name, emoji: String(i.config.emoji ?? "📺"), price: Number(i.config.price) || 0,
  cycle: i.config.cycle === "year" ? "year" : "month", day: Number(i.config.day) || 1, since: String(i.config.since ?? "2000-01"),
  uses: i.config.uses == null ? undefined : Number(i.config.uses), checked: i.config.checked ? String(i.config.checked) : undefined,
});
export const perMonth = (s: Sub) => (s.cycle === "year" ? s.price / 12 : s.price);
// Next charge date on or after today.
export function nextCharge(s: Sub, now = new Date()): Date {
  const clamp = (y: number, m: number) => new Date(y, m, Math.min(s.day, new Date(y, m + 1, 0).getDate()));
  let d = clamp(now.getFullYear(), now.getMonth());
  if (toDay(d) < toDay(now)) d = clamp(now.getFullYear(), now.getMonth() + 1);
  return d;
}
// "Is it worth it?": cost per use from how often you used it last month.
export function worth(s: Sub): { verdict: string; tone: string; perUse: number | null } {
  if (s.uses == null) return { verdict: "Tap 'Worth it?' to check", tone: "text-muted", perUse: null };
  const m = perMonth(s);
  if (s.uses === 0) return { verdict: "Not used: cancel it and save the money", tone: "text-rose-300", perUse: null };
  const per = m / s.uses;
  // About the price of a konbini drink per use is fine; a whole meal per use is not.
  return per <= 150 ? { verdict: "Worth it: you really use it", tone: "text-emerald-300", perUse: per }
    : per <= 500 ? { verdict: "Okay: use it more, or share a plan", tone: "text-amber-300", perUse: per }
      : { verdict: "Pricey per use: think about pausing it", tone: "text-rose-300", perUse: per };
}
export const subsMonthly = (subs: Sub[], month: string) => subs.filter((s) => s.since <= month).reduce((n, s) => n + perMonth(s), 0);

// ---------- Spending by category ----------
export function spendByCat(d: Data, month: string, subs: Sub[] = []): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of bought(d)) if (buyDay(s).startsWith(month)) { const c = catOf(s); out[c] = (out[c] ?? 0) + Number(s.price); }
  const sm = subsMonthly(subs, month);
  // Subscriptions are charged whether you log them or not.
  if (sm) out.Subscriptions = (out.Subscriptions ?? 0) + Math.round(sm);
  return out;
}

// ---------- Food cost ----------
export type WeekCost = { from: string; to: string; spent: number; share: number; items: ShopItem[] };
// Food bought in the 7 days up to `end`, against this week's share of the
// food budget (or of the allowance when no food budget is set).
export function weekFood(d: Data, end = new Date(), back = 0): WeekCost {
  const to = toDay(new Date(end.getTime() - back * 7 * 86_400_000));
  const from = toDay(new Date(new Date(`${to}T12:00`).getTime() - 6 * 86_400_000));
  const items = bought(d).filter((s) => { const x = buyDay(s); return x >= from && x <= to && isFoodSpend(s); });
  const month = to.slice(0, 7);
  const b = d.profile.settings.cat_budgets ?? {};
  const foodBudget = (b.Food ?? 0) + (b["Eating out"] ?? 0) + (b.Snacks ?? 0) + (b.Drinks ?? 0);
  const base = foodBudget || allowanceOf(d, month);
  return { from, to, spent: items.reduce((n, s) => n + Number(s.price), 0), share: Math.round((base * 7) / daysIn(month)), items };
}

// ---------- Savings jars ----------
export type Jar = { id: string; name: string; emoji: string; target: number; saved: number };
const amt = (l: Log) => Number(l.data.amount) || 0;
export function jars(d: Data, items: CustomItem[]): { jars: Jar[]; loose: number } {
  const ids = new Set(items.map((i) => i.id));
  const first = items[0]?.id;
  const sum = (id: string | undefined) => d.logs.reduce((n, l) => {
    // Older saves (before jars) go into the first jar.
    const j = (l.data.jar as string | undefined) && ids.has(String(l.data.jar)) ? String(l.data.jar) : first;
    if (j !== id) return n;
    return n + (l.kind === "save" ? amt(l) : l.kind === "withdraw" ? -amt(l) : 0);
  }, 0);
  const out = items.map((i) => ({ id: i.id, name: i.name, emoji: String(i.config.emoji ?? "🫙"), target: Number(i.config.target) || 0, saved: sum(i.id) }));
  const loose = first ? 0 : d.logs.reduce((n, l) => n + (l.kind === "save" ? amt(l) : l.kind === "withdraw" ? -amt(l) : 0), 0);
  return { jars: out, loose };
}
// Weeks to the target at the pace of the last 8 weeks.
export function jarPace(d: Data, j: Jar, now = new Date()): number | null {
  const since = toDay(new Date(now.getTime() - 56 * 86_400_000));
  const added = d.logs.filter((l) => l.kind === "save" && l.day >= since && l.data.jar === j.id).reduce((n, l) => n + amt(l), 0);
  if (!j.target || j.saved >= j.target || added <= 0) return null;
  return Math.ceil((j.target - j.saved) / (added / 8));
}

// ---------- Payday ----------
export const monthKey = (now = new Date()) => toDay(now).slice(0, 7);
export const paidThisMonth = (d: Data, now = new Date()) => d.logs.some((l) => l.data.payday === monthKey(now));
export function paydayDue(d: Data, now = new Date()): boolean {
  const p = d.profile.settings.payday;
  if (!p?.day) return false;
  const day = Math.min(p.day, daysIn(monthKey(now)));
  return now.getDate() >= day && !paidThisMonth(d, now);
}
// What payday adds: the allowance, and the part that goes straight to savings.
export function paydayPlan(d: Data, now = new Date()) {
  const p = d.profile.settings.payday;
  const amount = p?.amount || allowanceOf(d, monthKey(now));
  const save = Math.round((amount * (p?.pct ?? 0)) / 100);
  return { amount, save, spend: amount - save, jar: p?.jar };
}
