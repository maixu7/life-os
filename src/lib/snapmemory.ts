import type { CustomItem, Data } from "@/lib/store";
import { colourSim } from "@/lib/identify";

// The app remembers what your photos look like (items category "snap"),
// so the same drink, meal or tool is found again next time without AI.
// Each photo you confirm (from the list or from AI) adds one more look.

export type SnapKind = "food" | "drink" | "equipment" | "item" | "learn";
export type Seen = { name: string; emoji: string; photo?: string; sim: number; times: number; col?: number };

const SURE = 0.7, MAYBE = 0.6; // tested on real photos: other shots of the same thing 0.62–0.87, different things ≤ 0.61
const PER_KIND = 300, PER_NAME = 6;

// 1,280 numbers → 4 bits each, 860 characters.
export function pack(v: number[]): string {
  const m = Math.max(...v) || 1;
  const b = new Uint8Array(Math.ceil(v.length / 2));
  v.forEach((x, i) => { const q = Math.max(0, Math.min(15, Math.round((x / m) * 15))); b[i >> 1] |= i & 1 ? q : q << 4; });
  let s = ""; b.forEach((c) => { s += String.fromCharCode(c); });
  return btoa(s);
}
export function unpack(s: string): Uint8Array {
  const raw = atob(s), out = new Uint8Array(raw.length * 2);
  for (let i = 0; i < raw.length; i++) { const c = raw.charCodeAt(i); out[2 * i] = c >> 4; out[2 * i + 1] = c & 15; }
  return out;
}
function cos(a: Uint8Array, b: Uint8Array) {
  let d = 0, x = 0, y = 0;
  for (let i = 0; i < a.length && i < b.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; }
  return x && y ? d / Math.sqrt(x * y) : 0;
}

const snaps = (items: CustomItem[], kind: SnapKind) => items.filter((i) => i.category === "snap" && i.config.kind === kind && typeof i.config.vec === "string" && i.config.vec);

/** Things you photographed before that look like this one, best first. */
export function lookAlikes(items: CustomItem[], kind: SnapKind, vec: string, col?: string): { sure: Seen[]; maybe: Seen[] } {
  const q = unpack(vec), best = new Map<string, Seen>();
  for (const i of snaps(items, kind)) {
    const sim = cos(q, unpack(String(i.config.vec)));
    const c = colourSim(col, i.config.col);
    const k = i.name.toLowerCase(), had = best.get(k);
    const times = (had?.times ?? 0) + 1;
    if (!had || sim > had.sim) best.set(k, { name: i.name, emoji: String(i.config.emoji ?? "📷"), photo: i.config.photo ? String(i.config.photo) : undefined, sim, times, col: c });
    else had.times = times;
  }
  // Same shape and the same colours: a near miss on shape counts as sure.
  const sure = (s: Seen) => s.sim >= SURE || (s.sim >= 0.65 && (s.col ?? 0) >= 0.8);
  const all = [...best.values()].sort((a, b) => b.sim + (b.col ?? 0) * 0.1 - a.sim - (a.col ?? 0) * 0.1);
  return { sure: all.filter(sure).slice(0, 3), maybe: all.filter((s) => s.sim >= MAYBE && !sure(s)).slice(0, 4) };
}

/** The thing you confirmed for this barcode before (any kind), newest first. */
export function byBarcode(items: CustomItem[], code?: string): Seen | undefined {
  if (!code) return undefined;
  const hit = items.filter((i) => i.category === "snap" && i.config.barcode === code).sort((a, b) => b.sort - a.sort)[0];
  return hit && { name: hit.name, emoji: String(hit.config.emoji ?? "📷"), photo: hit.config.photo ? String(hit.config.photo) : undefined, sim: 1, times: 1 };
}

/** Remember this photo as `name`. Keeps a few looks per thing and drops the oldest when full. */
export function remember(d: Data, kind: SnapKind, name: string, vec: string, emoji = "📷", photo?: string, barcode?: string, col?: string): Data {
  if (!name.trim()) return d;
  const mine = snaps(d.items, kind).sort((a, b) => a.sort - b.sort);
  const same = mine.filter((i) => i.name.toLowerCase() === name.trim().toLowerCase());
  const drop = new Set<string>();
  if (same.length >= PER_NAME) drop.add(same[0].id);
  if (mine.length - drop.size >= PER_KIND) mine.filter((i) => !drop.has(i.id)).slice(0, mine.length - drop.size - PER_KIND + 1).forEach((i) => drop.add(i.id));
  const item: CustomItem = { id: crypto.randomUUID(), category: "snap", name: name.trim(), sort: Date.now(), config: { kind, vec, emoji, photo, barcode, col } };
  return { ...d, items: [...d.items.filter((i) => !drop.has(i.id)), item], deleted: [...d.deleted, ...drop] };
}

// The last photo looked at, so an AI answer can be remembered too.
let last: { kind: SnapKind; vec: string; photo?: string; barcode?: string; col?: string } | null = null;
export const setLastSnap = (s: typeof last) => { last = s; };
export const lastSnap = () => last;
