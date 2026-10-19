// Reads a shop or restaurant receipt (photo → phone OCR, no AI) into the
// items bought with their prices. Konbini receipts print exact item names,
// so each line can be looked up in the app's food and drink lists.

export type ReceiptLine = { name: string; price?: number; qty: number };

// Lines that are money, tax, payment or shop info, not things you bought.
const SKIP = /合計|小計|総計|税|対象|お?預り|お釣|釣銭|現金|クレジット|カード|電子マネー|ポイント|値引|割引|領収|レシート|登録番号|店|電話|\btel\b|〒|ありがとう|責|no\.|レジ|担当|取引|残高|支払|交通|paypay|suica|pasmo|nanaco|waon|edy|楽天|d払|au pay|\b(?:total|subtotal|tax|change|cash|card|visa|master|amex|balance|thank|receipt|store|phone|date|time|vat|gst|tip|service|discount|qty|price|amount)\b/i;

export function parseReceipt(text: string): ReceiptLine[] {
  const out: ReceiptLine[] = [];
  for (const raw of text.normalize("NFKC").split(/\n/)) {
    // OCR often puts spaces between Japanese letters: join them back.
    const line = raw.replace(/[*※＊軽●◎★☆]/g, " ").replace(/\s+/g, " ").replace(/(?<=[\u3040-\u30ff\u4e00-\u9fff])\s+(?=[\u3040-\u30ff\u4e00-\u9fff])/g, "").trim();
    if (line.length < 3 || SKIP.test(line)) continue;
    if (/\d{2,4}[/年.-]\d{1,2}[/月.-]\d{1,2}|\d{1,2}:\d{2}/.test(line)) continue; // dates and times
    // Name then price at the end: "おにぎり 鮭 ¥150", "Coffee M 120円", "2 x Onigiri 300".
    const m = line.match(/^(.*?)[\s¥￥$€£]*(\d{1,3}(?:,\d{3})+|\d{2,6})(?:\.\d{1,2})?\s*(?:円|yen)?\s*[a-zA-Z]?$/i);
    let name = (m ? m[1] : line).trim();
    const price = m ? Number(m[2].replace(/,/g, "")) : undefined;
    let qty = 1;
    const q = name.match(/^(\d{1,2})\s*(?:x|×|点|個|コ)\s*/i) ?? name.match(/\s*(?:x|×)\s*(\d{1,2})\s*$/i) ?? name.match(/\s(\d{1,2})\s*(?:点|個|コ)$/);
    if (q) { qty = Number(q[1]) || 1; name = name.replace(q[0], " ").trim(); }
    name = name.replace(/[¥￥$€£@]+$/, "").replace(/^[\d\s.\-:]+/, "").trim();
    // A real item name has letters (not just numbers or codes).
    if (!/[a-zA-Z぀-ヿ一-鿿]{2,}/.test(name) || name.length > 40) continue;
    if (price != null && (price < 1 || price > 50000)) continue;
    out.push({ name, price, qty });
  }
  return out.slice(0, 40);
}
