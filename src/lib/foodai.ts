import { readMealText, type MealFood } from "@/lib/foodtext";
import type { CustomItem } from "@/lib/store";
import type { Session } from "@/lib/vault";

// A photo sized for the AI reader: long side 1024 px, JPEG.
export function aiPhoto(img: HTMLImageElement, max = 1024): string {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export type MealRead = { foods: MealFood[]; note: string; ai: boolean; unknown?: string[]; error?: string };

// What's in this meal and how much. Asks the AI reader (photo and/or words);
// if that's off or offline, reads the words with the built-in tables.
export async function readMeal(s: Session, { photo, text = "" }: { photo?: string; text?: string }, items: CustomItem[] = []): Promise<MealRead> {
  let error = "";
  try {
    const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: s.user, auth: s.auth, text, image: photo }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(j.foods)) {
      const foods: MealFood[] = j.foods.map((f: Record<string, unknown>) => ({
        name: String(f.name), qty: 1, per: String(f.portion ?? "1 serving"), kcal: Math.round(Number(f.kcal) || 0),
        protein: Number(f.protein) || 0, fat: Number(f.fat) || 0, carbs: Number(f.carbs) || 0, sugar: Number(f.sugar) || 0, salt: Number(f.salt) || 0, contents: f.contents ? String(f.contents) : undefined,
      }));
      return { foods, note: String(j.note ?? ""), ai: true };
    }
    error = j.error ?? "";
  } catch { error = "offline"; }
  if (text.trim()) {
    const { foods, unknown } = readMealText(text, items);
    return { foods, unknown, ai: false, error, note: unknown.length ? `I don't know: ${unknown.join(", ")}. Add their numbers or snap their labels.` : "" };
  }
  return { foods: [], note: "", ai: false, error };
}

// "What is this?" for What I have: reads the packet (Japanese labels too).
export type ProductRead = {
  found: boolean; name: string; name_ja: string; brand: string; kind: string; emoji: string; qty: number; unit: string; grams: number;
  per: string; kcal: number; protein: number; fat: number; carbs: number; salt: number; expiry: string; storage: string; allergens: string; note: string;
};
export async function readProduct(s: Session, photo: string, hint = ""): Promise<{ product?: ProductRead; error?: string }> {
  try {
    const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: s.user, auth: s.auth, image: photo, text: hint, mode: "product" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.name === "string") return { product: j as ProductRead };
    return { error: j.error ?? "Couldn't read it" };
  } catch { return { error: "offline" }; }
}

// Book cover scan for the Library: title, author, pages.
export type BookRead = { found: boolean; title: string; author: string; pages: number; kind: string; note: string };
export async function readBook(s: Session, photo: string, hint = ""): Promise<{ book?: BookRead; error?: string }> {
  try {
    const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: s.user, auth: s.auth, image: photo, text: hint, mode: "book" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.title === "string") return { book: j as BookRead };
    return { error: j.error ?? "Couldn't read it" };
  } catch { return { error: "offline" }; }
}

// Receipt scanner: every line of a shop receipt, with category and price.
export type ReceiptLine = { name: string; name_ja: string; qty: number; unit: string; price: number; category: string; kind: string; emoji: string };
export type ReceiptRead = { found: boolean; store: string; date: string; items: ReceiptLine[]; total: number; note: string };
export async function readReceipt(s: Session, photo: string): Promise<{ receipt?: ReceiptRead; error?: string }> {
  try {
    const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: s.user, auth: s.auth, image: photo, mode: "receipt" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(j.items)) return { receipt: j as ReceiptRead };
    return { error: j.error ?? "Couldn't read it" };
  } catch { return { error: "offline" }; }
}
