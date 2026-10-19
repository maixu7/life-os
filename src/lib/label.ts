// Reads a food packet photo (English and Japanese) on the device with
// Tesseract OCR, then pulls out calories, protein, fat, carbs, salt, the
// serving, the ingredients, a name and the barcode number.

export type FactKey = "kcal" | "protein" | "fat" | "satfat" | "transfat" | "cholesterol" | "carbs" | "sugar" | "fiber" | "sodium" | "salt"
  | "caffeine" | "calcium" | "iron" | "potassium" | "vitc";
/** Everything the nutrition panel says, in English names and fixed units (g, mg, kcal). */
export type Facts = Partial<Record<FactKey, number>>;

export type Label = {
  kcal?: number; protein?: number; fat?: number; carbs?: number; sugar?: number; salt?: number;
  per?: string; contents?: string; names: string[]; barcode?: string; text: string; confidence?: number;
  facts: Facts;
};

// The nutrition panel, any language → English. Order matters: the more
// specific names (saturated fat) are read and cut out before the general (fat).
export const FACTS: [key: FactKey, name: string, unit: "g" | "mg" | "kcal", labels: string][] = [
  ["kcal", "Calories", "kcal", "熱量|エネルギー|energy|calories|calorie|カロリー|能量|热量|열량|에너지|ऊर्जा|calorías|valorenergético|énergie|energie|energia|энергетическаяценность|калорийность|พลังงาน|nănglượng|energi|enerji|الطاقة|السعرات"],
  ["satfat", "Saturated fat", "g", "飽和脂肪酸|饱和脂肪|포화지방|संतृप्तवसा|saturatedfat|saturates|grasassaturadas|acidesgrassaturés|gesättigtefettsäuren|acidigrassisaturi|gordurassaturadas|насыщенныежирныекислоты|ไขมันอิ่มตัว|chấtbéobãohòa|lemakjenuh|doymuşyağ|دهونمشبعة"],
  ["transfat", "Trans fat", "g", "トランス脂肪酸|反式脂肪|트랜스지방|ट्रांसवसा|transfat|grasastrans|acidesgrastrans|transfettsäuren|grassitrans|gordurastrans|трансжиры|ไขมันทรานส์|chấtbéochuyểnhóa|lemaktrans|transyağ|دهونمتحولة"],
  ["cholesterol", "Cholesterol", "mg", "コレステロール|胆固醇|콜레스테롤|कोलेस्ट्रॉल|cholesterol|colesterol|cholestérol|cholesterin|colesterolo|холестерин|คอเลสเตอรอล|kolesterol|كوليسترول"],
  ["fat", "Fat", "g", "脂質|脂肪|지방|वसा|totalfat|grasas?|matièresgrasses|lipides|fett|grassi|gorduras?|tłuszcz|жиры?|ไขมัน|chấtbéo|lemak|yağ|دهون|fat"],
  ["fiber", "Fiber", "g", "食物繊維|膳食纤维|식이섬유|फाइबर|dietaryfiber|dietaryfibre|fibre|fiber|fibra|fibres|ballaststoffe|błonnik|клетчатка|ใยอาหาร|chấtxơ|seratpangan|lif|ألياف"],
  ["sugar", "Sugars", "g", "糖類|砂糖|糖类|당류|चीनी|totalsugars|azúcares|sucres|zucker|zuccheri|açúcares|cukry|сахара?|น้ำตาล|đường|gula|şeker|سكريات|sugars?"],
  ["carbs", "Carbohydrate", "g", "炭水化物|糖質|碳水化合物|탄수화물|कार्बोहाइड्रेट|totalcarbohydrate|hidratosdecarbono|carbohidratos|glucides|kohlenhydrate|carboidrati|węglowodany|углеводы|คาร์โบไฮเดรต|carbohydrate|karbohidrat|karbonhidrat|كربوهيدرات|carbohydrates?|carbs?"],
  ["protein", "Protein", "g", "たんぱく質|タンパク質|蛋白質|たん白質|蛋白质|단백질|प्रोटीन|proteínas?|protéines|eiweiß|eiwit|proteine|białko|белки?|โปรตีน|chấtđạm|protein|بروتين"],
  ["salt", "Salt", "g", "食塩相当量|食塩|食盐|소금|नमक|sal|sel|salz|sale|sól|соль|เกลือ|muối|garam|tuz|ملح|salt"],
  ["sodium", "Sodium", "mg", "ナトリウム|钠|나트륨|सोडियम|sodium|sodio|natrium|sódio|sód|натрий|โซเดียม|natri|sodyum|صوديوم"],
  ["caffeine", "Caffeine", "mg", "カフェイン|咖啡因|카페인|कैफीन|caffeine|cafeína|caféine|koffein|caffeina|kofeina|кофеин|คาเฟอีน|kafein|كافيين"],
  ["calcium", "Calcium", "mg", "カルシウム|钙|칼슘|कैल्शियम|calcium|calcio|cálcio|wapń|кальций|แคลเซียม|canxi|kalsiyum|كالسيوم"],
  ["iron", "Iron", "mg", "鉄|铁|철분|आयरन|iron|hierro|fer|eisen|ferro|żelazo|железо|เหล็ก|sắt|besi|demir|حديد"],
  ["potassium", "Potassium", "mg", "カリウム|钾|칼륨|पोटैशियम|potassium|potasio|kalium|potássio|potas|калий|โพแทสเซียม|kali|potasyum|بوتاسيوم"],
  ["vitc", "Vitamin C", "mg", "ビタミンC|维生素C|비타민C|विटामिनसी|vitaminc|vitaminac|vitaminec|витаминC|วิตามินซี"],
];

type Tess = { recognize: (img: string | HTMLCanvasElement, langs: string, opts?: object) => Promise<{ data: { text: string; confidence: number } }> };
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
  const t = text.replace(/[ \t　]+/g, "").replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[：:]/g, "").replace(/ｋ|Ｋ/g, "k").replace(/ｃａｌ/gi, "cal").replace(/ｇ/g, "g");
  // Read each panel line; a name that has been read is cut out so "fat" can't re-read "saturated fat".
  let rest = t;
  const facts: Facts = {};
  for (const [key, , unit, labels] of FACTS) {
    const re = new RegExp(`(?:${labels})[^0-9\\n]{0,10}?([0-9]+(?:[.,][0-9]+)?)\\s*(kcal|kj|cal|mg|g|µg|μg|mcg)?`, "i");
    const m = rest.match(re);
    if (!m) continue;
    let v = num(m[1]);
    const u = (m[2] ?? "").toLowerCase();
    if (v == null || Number.isNaN(v)) continue;
    if (unit === "kcal" && u && u !== "kcal" && u !== "cal") continue; // "energy 1046 kJ": the kcal number is found below
    if (unit === "g" && u === "mg") v /= 1000;
    if (unit === "mg" && u === "g") v *= 1000;
    if (unit === "mg" && /µg|μg|mcg/.test(u)) v /= 1000;
    if (!u && unit !== "kcal") continue; // a number with no unit is usually something else
    facts[key] = Math.round(v * 100) / 100;
    rest = rest.replace(m[0], " ");
  }
  if (facts.kcal == null) { const m = t.match(/([0-9]{2,4}(?:\.[0-9])?)kcal/i); if (m) facts.kcal = num(m[1]); }
  // Japanese labels give salt; others give sodium. Fill whichever is missing (salt g = sodium mg × 2.54 / 1000).
  if (facts.salt == null && facts.sodium != null) facts.salt = Math.round(facts.sodium * 2.54) / 1000;
  if (facts.sodium == null && facts.salt != null) facts.sodium = Math.round((facts.salt * 1000) / 2.54);
  const { kcal, protein, fat, carbs, sugar, salt } = facts;
  const perM = t.match(/(1(?:袋|個|本|枚|食|杯|包|箱|パック|切れ)(?:\([^)]{0,12}\))?|100g|100ml|1serving)(?:当たり|あたり|当り)?/i)
    ?? t.match(/per(100g|100ml|serving)/i);
  // Or the serving / whole pack size: "Serving size 1 can (473mL)", "内容量 500ml", "총 내용량 250ml".
  const serv = t.match(/servingsize[^\n]*?([0-9]+(?:\.[0-9]+)?)(ml|g)/i);
  const pack = t.match(/(?:内容量|총내용량|내용량|净含量|netwt|netcontents?|netvol)[^0-9\n]{0,6}([0-9]+(?:\.[0-9]+)?)(ml|g)/i);
  const per = perM ? perM[1].replace("1serving", "1 serving") : serv ? `1 serving (${serv[1]}${serv[2].toLowerCase()})` : pack ? `1 pack (${pack[1]}${pack[2].toLowerCase()})` : undefined;
  const ing = text.match(/(?:原材料名?|配料表?|원재료명?|ingredients|ingredientes|ingrédients|zutaten|ingredienti|składniki|состав|ส่วนประกอบ|thành phần|komposisi|bahan|içindekiler|المكونات|सामग्री)[\s:：]*([^\n●■]{4,160})/i)?.[1]?.replace(/\s+/g, " ").trim();
  const barcode = t.match(/\b(4[59][0-9]{11}|[0-9]{13})\b/)?.[1];
  const names = [...new Set(text.split(/\n/).map((l) => l.replace(/\s+/g, l.match(/[a-z]{2}/i) ? " " : "").trim())
    .filter((l) => l.length >= 2 && l.length <= 24 && !/[0-9]{3}|[0-9](\.[0-9]+)?g|kcal|当たり|原材料|栄養|賞味|保存|製造|アレルギー/i.test(l) && /[\p{L}]{2}/u.test(l)))]
    .sort((a, b) => score(b) - score(a)).slice(0, 6);
  return { kcal, protein, fat, carbs, sugar, salt, per, contents: ing, names, barcode, text, facts };
}
// Product names are usually short katakana words or capital English words.
const score = (l: string) => (/^[A-Z][A-Z ]{3,}$/.test(l) ? 3 : 0) + (/[ァ-ヶー]{3,}/.test(l) ? 2 : 0) - (/[、。]/.test(l) ? 2 : 0);

// Languages the label reader can read (Tesseract). Each one is a download
// (1 to 15 MB, once) and makes reading slower, so you choose which to use.
export const OCR_LANGS: [code: string, name: string][] = [
  ["eng", "English"], ["jpn", "日本語"], ["chi_sim", "中文 简体"], ["chi_tra", "中文 繁體"], ["kor", "한국어"], ["hin", "हिन्दी"],
  ["ben", "বাংলা"], ["urd", "اردو"], ["nep", "नेपाली"], ["tam", "தமிழ்"], ["tha", "ไทย"], ["vie", "Tiếng Việt"], ["ind", "Indonesia"],
  ["msa", "Melayu"], ["tgl", "Filipino"], ["ara", "العربية"], ["fas", "فارسی"], ["tur", "Türkçe"], ["rus", "Русский"], ["ukr", "Українська"],
  ["spa", "Español"], ["por", "Português"], ["fra", "Français"], ["deu", "Deutsch"], ["ita", "Italiano"], ["nld", "Nederlands"], ["pol", "Polski"],
];
const LANG_KEY = "lifeos:ocr-langs";
// Phone language codes → reader languages. English letters also cover most
// Latin-script labels (Spanish, French…), so those mostly read fine anyway.
const PHONE: Record<string, string> = {
  en: "eng", ja: "jpn", zh: "chi_sim", "zh-tw": "chi_tra", "zh-hk": "chi_tra", ko: "kor", hi: "hin", bn: "ben", ur: "urd", ne: "nep", ta: "tam", th: "tha",
  vi: "vie", id: "ind", ms: "msa", fil: "tgl", tl: "tgl", ar: "ara", fa: "fas", tr: "tur", ru: "rus", uk: "ukr", es: "spa", pt: "por", fr: "fra", de: "deu", it: "ita", nl: "nld", pl: "pol",
};
/** Auto: Japanese + English + your phone's languages, unless you chose your own. */
export function autoLangs(): string[] {
  const phone = typeof navigator === "undefined" ? [] : navigator.languages.map((l) => PHONE[l.toLowerCase()] ?? PHONE[l.toLowerCase().split("-")[0]]).filter(Boolean);
  return [...new Set(["jpn", "eng", ...phone])].slice(0, 4);
}
export function ocrLangs(): string[] {
  try { const v = JSON.parse(localStorage.getItem(LANG_KEY) ?? "null"); if (Array.isArray(v) && v.length) return v.filter((c) => OCR_LANGS.some(([x]) => x === c)); } catch { /* default */ }
  return autoLangs();
}
export const isAutoLangs = () => { try { return !localStorage.getItem(LANG_KEY); } catch { return true; } };
export function resetOcrLangs() { try { localStorage.removeItem(LANG_KEY); } catch { /* private mode */ } }
export function setOcrLangs(codes: string[]) {
  try { localStorage.setItem(LANG_KEY, JSON.stringify(codes.length ? codes : ["eng"])); } catch { /* private mode */ }
}

let busy: Promise<void> | null = null;
export async function readLabel(img: HTMLImageElement, langs = ocrLangs()): Promise<Label> {
  busy ??= loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js").catch((e) => { busy = null; throw e; });
  await busy;
  const r = await window.Tesseract!.recognize(prep(img), langs.join("+"));
  return { ...parseLabel(r.data.text), confidence: r.data.confidence };
}

/** The ml or g the label's numbers are for: "100ml" → 100, "1本(500ml)" → 500, unknown → undefined. */
export function perAmount(per?: string): number | undefined {
  if (!per) return undefined;
  const n = /(\d+(?:\.\d+)?)\s*(ml|g|ｍｌ|ｇ)/i.exec(per)?.[1];
  return n ? Number(n) : undefined;
}

/** The facts for `amount` ml/g when they were read for `base` ml/g. */
export function scaleFacts(f: Facts, base: number, amount: number): Facts {
  const k = base > 0 ? amount / base : 1;
  return Object.fromEntries(Object.entries(f).map(([key, v]) => [key, Math.round((v as number) * k * 100) / 100])) as Facts;
}
