import type { Data } from "@/lib/store";

// Extra ways to tell what a photo shows, all on the phone, no AI:
// fuzzy name match (OCR often misreads a letter), the brand word, the size
// printed on the pack, the photo's colours, and your own habits (what you
// own, buy and usually log at this time of day).

type P = { name: string; ja?: string; sub?: string; mine?: boolean };

export const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s\-・·.,'’()&＆]/g, "");
const cjk = (s: string) => /[぀-鿿]/.test(s);
// Common reading slips between letters: 0→o, 1→l, 5→s (SUNT0RY → suntory).
const fix = (t: string) => t.replace(/(?<=[a-z])[015](?=[a-z])/g, (d) => ({ 0: "o", 1: "l", 5: "s" })[d as "0" | "1" | "5"]);
/** Fewest letter changes to turn a into b. */
function edits(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const grams = (s: string, n: number) => { const g = new Set<string>(); for (let i = 0; i + n <= s.length; i++) g.add(s.slice(i, i + n)); return g; };

/** Names printed in the text even when the reader got a few letters wrong (0–1 per name). */
export function fuzzyHits<T extends P>(list: T[], text: string): Map<T, number> {
  const t = fix(norm(text)), out = new Map<T, number>();
  if (t.length < 4) return out;
  const t3 = grams(t, 3), t2 = grams(t, 2);
  for (const p of list) {
    let best = 0;
    for (const raw of [p.name, p.ja ?? ""]) {
      const n = norm(raw);
      if (n.length < (cjk(n) ? 3 : 6)) continue;
      if (t.includes(n)) { best = 1; break; }
      // Share of the name's letter groups found in the text: one misread letter still leaves most of them.
      const g = cjk(n) ? grams(n, 2) : grams(n, 3), have = cjk(n) ? t2 : t3;
      let hit = 0; g.forEach((x) => { if (have.has(x)) hit++; });
      if (hit / g.size < 0.4) continue;
      // Then the closest stretch of the text: about one slip per five letters is still the same name.
      const L = n.length, allow = Math.floor(L / 5);
      for (let i = 0; i + L - 1 <= t.length && best < 1; i++) for (const w of [L - 1, L, L + 1]) {
        if (i + w > t.length) continue;
        const e = edits(n, t.slice(i, i + w));
        if (e <= allow) best = Math.max(best, 1 - e / L);
      }
    }
    if (best >= 0.75) out.set(p, best);
  }
  return out;
}

/** Brand words in the text: the first word of several list names (e.g. SUNTORY, Kirin, Ito En). */
export function brandsIn<T extends P>(list: T[], text: string): { brand: string; items: T[] }[] {
  const t = fix(norm(text)), by = new Map<string, T[]>();
  for (const p of list) {
    const w = p.name.split(/\s+/)[0];
    if (!w || norm(w).length < 4) continue;
    const k = norm(w); (by.get(k) ?? by.set(k, []).get(k)!).push(p);
  }
  return [...by.entries()].filter(([k, v]) => v.length >= 2 && t.includes(k))
    .sort((a, b) => b[0].length - a[0].length).slice(0, 2)
    .map(([, v]) => ({ brand: v[0].name.split(/\s+/)[0], items: v }));
}

/** The size printed on the pack (e.g. 500ml, 1.5L, 350g), as ml or g. */
export function sizeIn(text: string): { n: number; unit: "ml" | "g" } | undefined {
  const m = text.normalize("NFKC").match(/(\d+(?:[.,]\d+)?)\s*(ml|mℓ|l|ℓ|g|kg)\b/i);
  if (!m) return undefined;
  const v = parseFloat(m[1].replace(",", ".")), u = m[2].toLowerCase();
  if (u === "l" || u === "ℓ") return v <= 5 ? { n: Math.round(v * 1000), unit: "ml" } : undefined;
  if (u === "kg") return v <= 20 ? { n: Math.round(v * 1000), unit: "g" } : undefined;
  return v >= 30 && v <= 5000 ? { n: Math.round(v), unit: u === "g" ? "g" : "ml" } : undefined;
}
export const sameSize = (p: P, s?: { n: number; unit: string }) => !!s && new RegExp(`\\b${s.n}\\s*${s.unit}\\b`, "i").test(`${p.name} ${p.sub ?? ""}`);

/** How much you use each name: logs (more if usually at this hour), what you have, what you buy. */
export function habits(d: Data, now = new Date()): Map<string, number> {
  const score = new Map<string, number>(), add = (n: unknown, s: number) => { if (typeof n === "string" && n.length >= 2 && n.length < 60) { const k = norm(n); score.set(k, (score.get(k) ?? 0) + s); } };
  const hour = now.getHours();
  const walk = (v: unknown, s: number, depth = 0): void => {
    if (depth > 3) return;
    if (typeof v === "string") add(v, s);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, s, depth + 1));
    else if (v && typeof v === "object") { const o = v as Record<string, unknown>; walk(o.name, s, depth + 1); walk(o.items ?? o.foods, s, depth + 1); }
  };
  for (const l of d.logs.slice(-600)) {
    const h = new Date(l.created_at).getHours(), near = Math.min(Math.abs(h - hour), 24 - Math.abs(h - hour)) <= 2;
    walk(l.data.name, near ? 3 : 1); walk(l.data.items ?? l.data.foods ?? l.data.dishes, near ? 3 : 1);
  }
  for (const p of d.pantry) add(p.name, p.qty > 0 ? 6 : 2);
  for (const s of d.shopping) add(s.name, s.status === "purchased" ? 3 : 4);
  return score;
}

// ---- Colours: a 64-box colour count of the photo's middle, kept with each remembered photo ----
export function colours(img: HTMLImageElement): string {
  const c = document.createElement("canvas"); c.width = c.height = 48;
  const x = c.getContext("2d")!, s = Math.min(img.naturalWidth, img.naturalHeight) * 0.8;
  x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 48, 48);
  const px = x.getImageData(0, 0, 48, 48).data, h = new Array(64).fill(0);
  for (let i = 0; i < px.length; i += 4) h[(px[i] >> 6) * 16 + (px[i + 1] >> 6) * 4 + (px[i + 2] >> 6)]++;
  const n = 48 * 48;
  return h.map((v) => Math.min(35, Math.round((v / n) * 100))).map((v) => String.fromCharCode(48 + v)).join("");
}
/** 0–1: how much the two colour counts overlap. */
export function colourSim(a?: unknown, b?: unknown): number | undefined {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== 64 || b.length !== 64) return undefined;
  let same = 0, ta = 0, tb = 0;
  for (let i = 0; i < 64; i++) { const x = a.charCodeAt(i) - 48, y = b.charCodeAt(i) - 48; same += Math.min(x, y); ta += x; tb += y; }
  return ta && tb ? same / Math.max(ta, tb) : 0;
}
