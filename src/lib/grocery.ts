import { itemKind } from "@/lib/have";
import type { Data, ShopItem } from "@/lib/store";

// The grocery list that writes itself: things in What I have that ran out or
// are almost gone, food past its best-before date, and the things you buy
// regularly that are due again. Things already on the list are left out.

export type Need = { name: string; emoji: string; qty: number; unit: string; price: number | null; category: string; why: string; rank: number };

const key = (s: string) => s.trim().toLowerCase().replace(/s$/, "");
const COUNTED = new Set(["pcs", "pack", "bottle", "can", "jar", "box", "bag", "dozen"]);

export function autoList(d: Data, now = new Date()): Need[] {
  const skip = new Set((d.profile.settings.grocery_skip ?? []).map(key));
  const onList = new Set(d.shopping.filter((s) => s.status === "to_buy").map((s) => key(s.name)));
  const buys = d.shopping.filter((s) => s.status === "purchased" && s.purchased_at).sort((a, b) => a.purchased_at!.localeCompare(b.purchased_at!));
  const lastBuy = new Map<string, ShopItem>();
  for (const b of buys) lastBuy.set(key(b.name), b);
  const out = new Map<string, Need>();
  const put = (n: Need) => { const k = key(n.name); if (skip.has(k) || onList.has(k)) return; const was = out.get(k); if (!was || was.rank < n.rank) out.set(k, n); };
  const today = now.toISOString().slice(0, 10);

  for (const p of d.pantry) {
    const kind = itemKind(p);
    if (kind === "book" || kind === "equipment") continue;
    const last = lastBuy.get(key(p.name));
    const base = { name: p.name, emoji: p.emoji, qty: last?.qty ?? 1, unit: last?.unit ?? p.unit, price: last?.price ?? (p.last_price != null ? +(p.last_price * (last?.qty ?? 1)).toFixed(0) : null), category: last?.category ?? "" };
    if (p.qty <= 0) { put({ ...base, why: "ran out", rank: 3 }); continue; }
    // Almost gone: 1 left of a counted thing, or under a fifth of what you bought.
    const bigBuy = last?.qty ?? 0;
    const low = COUNTED.has(p.unit) ? p.qty <= 1 && bigBuy >= 2 : bigBuy > 0 && p.qty <= bigBuy * 0.2;
    if (low) put({ ...base, why: `almost gone (${p.qty} ${p.unit} left)`, rank: 2 });
    if (p.expiry && p.expiry < today && ["food", "fruit", "veg", "drink"].includes(kind)) put({ ...base, why: `past best-before (${p.expiry})`, rank: 1 });
  }

  // Regulars: bought 2+ times in 90 days and due again at your usual gap.
  const since = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const groups = new Map<string, ShopItem[]>();
  for (const b of buys) if (b.purchased_at! >= since) (groups.get(key(b.name)) ?? groups.set(key(b.name), []).get(key(b.name))!).push(b);
  for (const [k, list] of groups) {
    if (list.length < 2) continue;
    const t = list.map((b) => new Date(b.purchased_at!).getTime());
    const gap = (t[t.length - 1] - t[0]) / (t.length - 1) / 86_400_000;
    const ago = (now.getTime() - t[t.length - 1]) / 86_400_000;
    const stock = d.pantry.find((p) => key(p.name) === k);
    if (gap < 1 || ago < gap || (stock && stock.qty > 1)) continue;
    const b = list[list.length - 1];
    put({ name: b.name, emoji: b.emoji, qty: b.qty, unit: b.unit, price: b.price, category: b.category, why: `you buy it every ~${Math.round(gap)} days`, rank: 1.5 });
  }
  return [...out.values()].sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
}

export const toShopItem = (n: Need): ShopItem => ({
  id: crypto.randomUUID(), name: n.name, emoji: n.emoji, qty: n.qty, unit: n.unit, price: n.price, category: n.category, note: "",
  photo_id: null, status: "to_buy", purchased_at: null, created_at: new Date().toISOString(),
});
