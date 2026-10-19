// Food photos, all on the device: shrink the photo, redraw it in an anime
// (cel-shaded) style, and try to recognise the food with a small image model.

export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function square(img: HTMLImageElement, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
  return { c, ctx };
}

// Anime look: bright flat colours (posterised), then dark ink outlines
// where the picture has strong edges.
export function animeStyle(img: HTMLImageElement, size = 192): string {
  const { c, ctx } = square(img, size);
  const src = ctx.getImageData(0, 0, size, size);
  const p = src.data;
  const lum = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) lum[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
  const out = ctx.createImageData(size, size);
  const o = out.data;
  const LEVELS = 6, step = 255 / (LEVELS - 1);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      let r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
      // Saturate and brighten a little, like anime food art.
      const m = (r + g + b) / 3;
      r = Math.min(255, (m + (r - m) * 1.5) * 1.08); g = Math.min(255, (m + (g - m) * 1.5) * 1.08); b = Math.min(255, (m + (b - m) * 1.5) * 1.08);
      r = Math.round(Math.max(0, r) / step) * step; g = Math.round(Math.max(0, g) / step) * step; b = Math.round(Math.max(0, b) / step) * step;
      // Sobel edge strength on brightness.
      let edge = 0;
      if (x > 0 && y > 0 && x < size - 1 && y < size - 1) {
        const L = (dx: number, dy: number) => lum[(y + dy) * size + x + dx];
        const gx = -L(-1, -1) - 2 * L(-1, 0) - L(-1, 1) + L(1, -1) + 2 * L(1, 0) + L(1, 1);
        const gy = -L(-1, -1) - 2 * L(0, -1) - L(1, -1) + L(-1, 1) + 2 * L(0, 1) + L(1, 1);
        edge = Math.hypot(gx, gy);
      }
      const ink = edge > 150 ? 0.25 : edge > 90 ? 0.6 : 1;
      o[i * 4] = r * ink; o[i * 4 + 1] = g * ink; o[i * 4 + 2] = b * ink; o[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL("image/jpeg", 0.72);
}

export const smallPhoto = (img: HTMLImageElement, size = 192) => square(img, size).c.toDataURL("image/jpeg", 0.72);

// ImageNet labels the model knows, mapped to foods in the app.
const LABELS: [RegExp, string][] = [
  [/granny smith|apple/i, "Apple"], [/banana/i, "Banana"], [/orange|lemon/i, "Orange"], [/strawberry|pineapple|pomegranate|fig|jackfruit|custard apple/i, "Fruit"],
  [/pizza/i, "Pizza"], [/cheeseburger|burger/i, "Burger"], [/hotdog|hot dog/i, "Sandwich"], [/bagel|french loaf|pretzel|dough|toast/i, "Bread"],
  [/ice cream|ice lolly/i, "Ice cream"], [/chocolate/i, "Chocolate"], [/espresso|coffee/i, "Coffee"], [/cup|teapot/i, "Tea"],
  [/carbonara|noodle|ramen/i, "Noodles / Maggi"], [/mashed potato|french fries/i, "Potato"], [/consomme|soup|hot pot/i, "Dal"],
  [/broccoli|cauliflower|cabbage|cucumber|bell pepper|zucchini|mushroom|artichoke|guacamole/i, "Sabzi (veg curry)"], [/egg/i, "Egg (boiled)"],
  [/burrito|meat loaf|potpie/i, "Sandwich"], [/trifle|eggnog|custard/i, "Sweet (mithai)"], [/milk|eggnog/i, "Milk"], [/corn|ear/i, "Fruit"],
];

type Classifier = {
  classify: (img: HTMLImageElement | HTMLCanvasElement, k?: number) => Promise<{ className: string; probability: number }[]>;
  infer: (img: HTMLImageElement | HTMLCanvasElement, embedding: boolean) => { data: () => Promise<Float32Array>; dispose: () => void };
};
declare global { interface Window { mobilenet?: { load: (o?: object) => Promise<Classifier> } } }
let model: Promise<Classifier> | null = null;

const script = (src: string) => new Promise<void>((ok, bad) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok();
  const s = document.createElement("script");
  s.src = src; s.async = true; s.onload = () => ok(); s.onerror = () => bad(new Error("load failed"));
  document.head.appendChild(s);
});

// Loads TensorFlow.js and MobileNet (about 5 MB, once) and guesses the food.
// Needs internet the first time. Returns food names from the app's list.
const loadModel = () => {
  model ??= (async () => {
    await script("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
    await script("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
    return window.mobilenet!.load({ version: 2, alpha: 1 });
  })();
  return Promise.race([model, new Promise<never>((_, bad) => setTimeout(() => bad(new Error("timeout")), 25_000))]);
};

/** The photo's look as 1,280 numbers (no AI service: runs on the phone). Same thing photographed again gives close numbers. */
export async function fingerprint(img: HTMLImageElement): Promise<number[]> {
  try {
    const t = (await loadModel()).infer(square(img, 224).c, true);
    const v = Array.from(await t.data());
    t.dispose();
    return v;
  } catch (e) { model = null; throw e; }
}

export async function recognise(img: HTMLImageElement): Promise<{ foods: string[]; seen: string[] }> {
  try {
    const m = await loadModel();
    const preds = await m.classify(square(img, 224).c, 5);
    const seen = preds.map((p) => p.className.split(",")[0]);
    const foods = [...new Set(preds.flatMap((p) => LABELS.find(([re]) => re.test(p.className))?.[1] ?? []))];
    return { foods, seen };
  } catch (e) {
    model = null;
    throw e;
  }
}
