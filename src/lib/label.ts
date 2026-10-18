// Reads a food packet photo (English and Japanese) on the device with
// Tesseract OCR, then pulls out calories, protein, fat, carbs, salt, the
// serving, the ingredients, a name and the barcode number.

export type Label = {
  kcal?: number; protein?: number; fat?: number; carbs?: number; sugar?: number; salt?: number;
  per?: string; contents?: string; names: string[]; barcode?: string; text: string;
};

type Tess = { recognize: (img: string | HTMLCanvasElement, langs: string, opts?: object) => Promise<{ data: { text: string } }> };
declare global { interface Window { Tesseract?: Tess } }

const loadScript = (src: string) => new Promise<void>((ok, bad) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok();
  const s = document.createElement("script");
  s.src = src; s.async = true; s.onload = () => ok(); s.onerror = () => bad(new Error("load failed"));
  document.head.appendChild(s);
});

// Big, high-contrast grey image reads best.
function prep(img: HTMLImageElement, max = 1600) {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    const v = Math.max(0, Math.min(255, (g - 128) * 1.5 + 128));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

const num = (s?: string) => (s ? Number(s.replace(",", ".").replace(/[oO]/g, "0")) : undefined);

// Pulls nutrition numbers out of OCR text (exported for testing).
export function parseLabel(text: string): Label {
  // Japanese OCR puts spaces between characters; remove them for matching.
  const t = text.replace(/[ \t　]+/g, "").replace(/[：:]/g, "").replace(/ｋ|Ｋ/g, "k").replace(/ｃａｌ/gi, "cal").replace(/ｇ/g, "g");
  const after = (labels: string, unit: string) => {
    const m = t.match(new RegExp(`(?:${labels})[^0-9\\n]{0,8}([0-9]+(?:[.,][0-9]+)?)${unit}`, "i"));
    return num(m?.[1]);
  };
  let kcal = after("熱量|エネルギー|energy|calories|calorie|カロリー", "k?cal");
  if (kcal == null) { const m = t.match(/([0-9]{2,4}(?:\.[0-9])?)kcal/i); kcal = num(m?.[1]); }
  const protein = after("たんぱく質|タンパク質|蛋白質|たん白質|protein", "g");
  const fat = after("脂質|fat", "g");
  const carbs = after("炭水化物|糖質|carbohydrates?|carbs?", "g");
  const salt = after("食塩相当量|食塩|salt", "g");
  const sugar = after("糖類|砂糖|sugars?", "g");
  const perM = t.match(/(1(?:袋|個|本|枚|食|杯|包|箱|パック|切れ)(?:\([^)]{0,12}\))?|100g|100ml|1serving)(?:当たり|あたり|当り)?/i)
    ?? t.match(/per(100g|100ml|serving)/i);
  const per = perM ? perM[1].replace("1serving", "1 serving") : undefined;
  const ing = text.match(/(?:原材料名?|ingredients)[\s:：]*([^\n●■]{4,160})/i)?.[1]?.replace(/\s+/g, " ").trim();
  const barcode = t.match(/\b(4[59][0-9]{11}|[0-9]{13})\b/)?.[1];
  const names = [...new Set(text.split(/\n/).map((l) => l.replace(/\s+/g, l.match(/[a-z]{2}/i) ? " " : "").trim())
    .filter((l) => l.length >= 2 && l.length <= 24 && !/[0-9]{3}|[0-9](\.[0-9]+)?g|kcal|当たり|原材料|栄養|賞味|保存|製造|アレルギー/i.test(l) && /[\p{L}]{2}/u.test(l)))]
    .sort((a, b) => score(b) - score(a)).slice(0, 6);
  return { kcal, protein, fat, carbs, sugar, salt, per, contents: ing, names, barcode, text };
}
// Product names are usually short katakana words or capital English words.
const score = (l: string) => (/^[A-Z][A-Z ]{3,}$/.test(l) ? 3 : 0) + (/[ァ-ヶー]{3,}/.test(l) ? 2 : 0) - (/[、。]/.test(l) ? 2 : 0);

let busy: Promise<void> | null = null;
export async function readLabel(img: HTMLImageElement): Promise<Label> {
  busy ??= loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js").catch((e) => { busy = null; throw e; });
  await busy;
  const r = await window.Tesseract!.recognize(prep(img), "jpn+eng");
  return parseLabel(r.data.text);
}
