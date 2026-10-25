// Edit mode: the hero's own changes to anything on screen (names, icons,
// pictures, colours, size, order, hidden items, what a button opens, and new
// buttons or notes), saved in settings.look and laid over the app by
// components/EditLayer.tsx. The app's own code and records are never changed,
// so every change can be undone.

export type Added = {
  id: string; at: string; after: string; // page ("*" = every page) and the item it sits after
  kind: "button" | "note"; icon: string; name: string; href?: string; cls?: string;
};
export type LookStyle = { color?: string; bg?: string; zoom?: number };
export type Look = {
  text?: Record<string, Record<string, string>>; // page or "*" -> original words -> your words
  hide?: Record<string, true>; // item key -> removed
  order?: Record<string, string[]>; // container key -> its items in your order
  img?: Record<string, string>; // item key -> your picture
  style?: Record<string, LookStyle>; // item key -> colour, background, size
  go?: Record<string, string>; // item key -> page or web link it opens instead
  add?: Added[];
  auto?: Record<string, "off">; // automatic features turned off
  pencil?: "off"; // old floating ✏️ button setting (the button is gone; kept so old saves load)
  etext?: Record<string, Record<string, string>>; // one exact item -> its original words -> your words (only that box changes)
  pens?: "off"; // hides the small ✎ on every box
};

// Automatic things the app does by itself; each can be switched off.
export const AUTOS: [string, string, string][] = [
  ["popper", "💬 Pop-up quotes, advice and Sensei's orders", "Random pop-ups, and the late-night “why are you awake?”"],
  ["stage", "🎬 Stage intro and night report", "The full-screen screen when you open the app, and the stage report at night"],
  ["battle", "⚔️ Morning battle replay", "After sleep, plays out yesterday's battle"],
  ["game", "🏆 Rewards and achievement pop-ups", "Mission rewards and achievements firing by themselves"],
  ["celebrate", "🎉 Celebrations", "Confetti and level-up screens"],
  ["reminders", "⏰ Reminders in the app", "Timed reminders shown while the app is open"],
  ["bodycare", "🧍 Nap alarm, posture and eye breaks", "Body-care alarms while you sit"],
  ["push", "📲 Phone notifications sync", "Keeps phone notifications in step with your times"],
  ["studywall", "📚 “Study first” wall", "Full-screen wall after study time until study is done"],
  ["bottle", "🧴 Bottle refill nudges", "Short reminder to refill your water bottle"],
  ["payday", "💴 Payday auto-save", "Pays yourself first by itself on payday"],
  ["alarm", "🚨 Full-screen alarms", "Alarms that ring until you tap Stop"],
  ["resume", "↩️ Reopen on the last screen", "Opening the app continues where you left off"],
  ["doing", "⏳ “In progress” pill", "The pill on every screen while something runs"],
  ["fab", "＋ Round quick-add button", "The floating ＋ button"],
];

export const isOff = (look: Look | undefined, id: string) => look?.auto?.[id] === "off";

// ---------- Naming things on screen ----------
// An item is known by its tag, its own words (numbers ignored, so "500 ml"
// and "750 ml" are the same item) and which one it is among items like it.
export const SKIP = "[data-noedit]";
const orig = new WeakMap<Text, { orig: string; out: string }>();
export const textMem = orig;
export const origOf = (t: Text) => { const r = orig.get(t); return r && t.data === r.out ? r.orig : t.data; };

export function wordsOf(el: Element): string {
  if (el instanceof HTMLElement && el.dataset.loAdd) return `add:${el.dataset.loAdd}`;
  let s = "";
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const p = n.parentElement;
    if ((p?.closest(SKIP) && !el.closest(SKIP)) || p?.closest("[data-lo-add]")) continue;
    s += origOf(n as Text) + " ";
    if (s.length > 240) break;
  }
  s = s.replace(/\d+([.,:]\d+)*/g, "#").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!s) {
    const img = el instanceof HTMLImageElement ? el : el.querySelector("img");
    if (img) s = "img:" + (img.dataset.loSrc ?? img.getAttribute("src") ?? "").slice(-40);
    else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) s = "field:" + (el.dataset.loPh ?? el.placeholder ?? el.name);
  }
  return s;
}

// Everything on screen grouped by tag+words, in page order, so "the 2nd Edit button" stays the 2nd.
export function sigOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const words = wordsOf(el);
  let n = 0;
  for (const o of Array.from(document.getElementsByTagName(tag))) {
    if (o === el) break;
    if (o.closest(SKIP)) continue;
    if (wordsOf(o) === words) n++;
  }
  return `${tag}|${words}|${n}`;
}

export const keyOf = (scope: string, sig: string) => `${scope}§${sig}`;
export const sigPart = (key: string) => key.slice(key.indexOf("§") + 1);
export const scopePart = (key: string) => key.slice(0, key.indexOf("§"));

// A small square picture for a replaced icon or image.
export function readPicture(file: File, size = 256): Promise<string> {
  return new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(size, Math.max(img.width, img.height));
      const r = s / Math.max(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      ok(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = bad;
    img.src = URL.createObjectURL(file);
  });
}

// How many changes there are, for the summary.
export function countLook(l: Look) {
  const t = [...Object.values(l.text ?? {}), ...Object.values(l.etext ?? {})].reduce((a, m) => a + Object.keys(m).length, 0);
  return t + Object.keys(l.hide ?? {}).length + Object.keys(l.order ?? {}).length + Object.keys(l.img ?? {}).length
    + Object.keys(l.style ?? {}).length + Object.keys(l.go ?? {}).length + (l.add?.length ?? 0) + Object.keys(l.auto ?? {}).length;
}
