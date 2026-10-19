// Reads the barcode (JAN / EAN / UPC) from a photo on the phone, no AI:
// the phone's own detector when it has one, otherwise ZXing (a free barcode
// reader, about 400 KB, loaded once). One barcode = one exact product.
// QR codes on packs are read too: their text (often the maker's page) helps
// find the name.

type ZX = {
  BrowserMultiFormatReader: new (hints?: Map<unknown, unknown>) => { decodeFromImageUrl: (url: string) => Promise<{ getText: () => string }> };
  DecodeHintType: { POSSIBLE_FORMATS: unknown; TRY_HARDER: unknown };
  BarcodeFormat: Record<string, unknown>;
};
type Detector = { detect: (img: HTMLImageElement) => Promise<{ rawValue: string }[]> };
declare global { interface Window { ZXing?: ZX; BarcodeDetector?: new (o: { formats: string[] }) => Detector } }

// One load shared by every photo scanned at once (a second photo mustn't run before it's ready).
const loading = new Map<string, Promise<void>>();
const script = (src: string) => {
  if (!loading.has(src)) loading.set(src, new Promise<void>((ok, bad) => {
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = () => ok(); s.onerror = () => { loading.delete(src); bad(new Error("load failed")); };
    document.head.appendChild(s);
  }));
  return loading.get(src)!;
};

/** EAN-13 / EAN-8 / UPC-A check digit is right (so a misread is never trusted). */
export function validCode(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  const d = code.split("").map(Number), last = d.pop()!;
  const sum = d.reverse().reduce((s, x, i) => s + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === last;
}

function canvas(img: HTMLImageElement, turn: boolean, max = 1400) {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  const c = document.createElement("canvas");
  c.width = turn ? h : w; c.height = turn ? w : h;
  const ctx = c.getContext("2d")!;
  if (turn) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2); }
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.9);
}

export async function scanBarcode(img: HTMLImageElement): Promise<{ code?: string; qr?: string }> {
  if (window.BarcodeDetector) {
    try {
      const r = await new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code"] }).detect(img);
      const code = r.map((x) => x.rawValue).find(validCode), qr = r.map((x) => x.rawValue).find((x) => !/^\d+$/.test(x));
      if (code) return { code, qr };
    } catch { /* fall back to ZXing */ }
  }
  await script("https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js");
  const Z = window.ZXing!;
  const hints = new Map<unknown, unknown>([
    [Z.DecodeHintType.POSSIBLE_FORMATS, ["EAN_13", "EAN_8", "UPC_A", "UPC_E", "QR_CODE"].map((f) => Z.BarcodeFormat[f])],
    [Z.DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new Z.BrowserMultiFormatReader(hints);
  // Upright first, then turned (barcodes on bottles often run up and down).
  let qr: string | undefined;
  for (const turn of [false, true]) {
    try { const t = (await reader.decodeFromImageUrl(canvas(img, turn))).getText(); if (validCode(t)) return { code: t, qr }; if (!/^\d+$/.test(t)) qr ??= t; } catch { /* not found this way */ }
  }
  return { qr };
}
