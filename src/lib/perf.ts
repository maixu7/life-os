// Smooth mode: fewer effects on slower phones and tablets. "auto" measures
// the frame rate once on this device; "on"/"off" are the hero's own choice.
export type LiteChoice = "auto" | "on" | "off";
const CHOICE = "lifeos-lite", MEASURED = "lifeos-slow";

export function liteChoice(): LiteChoice {
  try { return (localStorage.getItem(CHOICE) as LiteChoice) || "auto"; } catch { return "auto"; }
}
export function isLite() {
  const c = liteChoice();
  if (c !== "auto") return c === "on";
  try { return localStorage.getItem(MEASURED) === "1"; } catch { return false; }
}
export function applyLite() {
  document.documentElement.classList.toggle("lite", isLite());
}
export function setLite(c: LiteChoice) {
  try { localStorage.setItem(CHOICE, c); } catch {}
  applyLite();
}

// Count frames for 2 seconds; under ~45 fps the device gets smooth mode.
export function measureOnce() {
  try { if (localStorage.getItem(MEASURED) != null) return; } catch { return; }
  let frames = 0;
  const start = performance.now();
  const tick = (t: number) => {
    frames++;
    if (t - start < 2000) return requestAnimationFrame(tick);
    if (document.visibilityState !== "visible") return;
    const fps = (frames * 1000) / (t - start);
    try { localStorage.setItem(MEASURED, fps < 45 ? "1" : "0"); } catch {}
    applyLite();
  };
  setTimeout(() => requestAnimationFrame(tick), 3000);
}

// Pixel ratio for canvases: full detail costs too much on big tablet screens.
export const canvasDpr = () => Math.min(window.devicePixelRatio || 1, isLite() ? 1 : 1.5);
