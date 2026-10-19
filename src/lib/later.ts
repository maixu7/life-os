import type { Data } from "@/lib/store";
import { putPhoto, type Session } from "@/lib/vault";

// "Scan later": a photo saved (encrypted, synced) to scan whenever you want.
// items category "later": config { type, photo_ids (front, back…), thumb, at }.

export type LaterType = "food" | "drink" | "equipment" | "have" | "shop";
export const LATER_TYPES: [LaterType, string, string][] = [
  ["food", "🍱", "Food"], ["drink", "🥤", "Drink"], ["equipment", "🏋️", "Equipment"], ["have", "📦", "My stuff"], ["shop", "🛒", "To buy"],
];

const square = (img: HTMLImageElement | ImageBitmap, size: number) => {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width, h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const s = Math.min(w, h), c = document.createElement("canvas");
  c.width = c.height = size;
  c.getContext("2d")!.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.7);
};

/** Save a photo to scan later. `at` is when you ate / drank / bought it. */
export async function saveLater(s: Session, update: (f: (d: Data) => Data) => void, type: LaterType, photos: Blob | Blob[], at = new Date()) {
  const all = Array.isArray(photos) ? photos : [photos];
  const photo_ids: string[] = [];
  for (const p of all) { const id = crypto.randomUUID(); await putPhoto(s, id, p); photo_ids.push(id); }
  const thumb = square(await createImageBitmap(all[0]), 96);
  update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "later", name: "Photo", sort: Date.now(), config: { type, photo_ids, thumb, at: at.toISOString() } }] }));
}
/** The saved photo ids (older entries have one photo_id). */
export const laterIds = (c: Record<string, unknown>): string[] => (Array.isArray(c.photo_ids) ? (c.photo_ids as string[]) : c.photo_id ? [String(c.photo_id)] : []);

export const imgBlob = (img: HTMLImageElement) => new Promise<Blob>((ok, bad) => {
  const c = document.createElement("canvas");
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  c.toBlob((b) => (b ? ok(b) : bad(new Error("no image"))), "image/jpeg", 0.85);
});
