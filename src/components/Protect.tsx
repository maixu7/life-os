"use client";

import { useEffect } from "react";

// Anti-copy guard for the whole app. Text you type (inputs, text areas) still
// works normally; everything else can't be selected, copied, dragged, printed
// or opened with right-click / long-press. When the app goes to the background
// (app switcher, lock screen) the screen is blurred so its contents don't show.
//
// Honest limit: anything shown on a screen can still be photographed or
// screenshotted. This stops casual copying; your data's real protection is the
// encryption (only ciphertext ever leaves the phone) and your password.

const editable = (t: EventTarget | null) => {
  const el = t instanceof Element ? t : null;
  return !!el?.closest("input, textarea, select, [contenteditable='true'], [data-allow-copy]");
};

export function Protect() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // keep dev tools usable while building
    const stop = (e: Event) => { if (!editable(e.target)) e.preventDefault(); };
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      const devtools = k === "f12" || (mod && e.shiftKey && ["i", "j", "c", "k"].includes(k)) || (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k));
      const grab = mod && ["s", "u", "p"].includes(k);
      const copy = mod && ["c", "x", "a"].includes(k) && !editable(e.target);
      if (devtools || grab || copy) { e.preventDefault(); e.stopPropagation(); }
      // Desktop Print Screen: wipe what it put on the clipboard.
      if (k === "printscreen") navigator.clipboard?.writeText("").catch(() => {});
    };
    const hide = () => document.documentElement.classList.toggle("app-hidden", document.hidden);
    const blur = () => document.documentElement.classList.add("app-hidden");
    const focus = () => document.documentElement.classList.remove("app-hidden");
    const opts = { capture: true } as const;
    for (const ev of ["copy", "cut", "contextmenu", "selectstart", "dragstart"]) document.addEventListener(ev, stop, opts);
    document.addEventListener("keydown", keys, opts);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", blur);
    window.addEventListener("pageshow", focus);
    window.addEventListener("focus", focus);
    return () => {
      for (const ev of ["copy", "cut", "contextmenu", "selectstart", "dragstart"]) document.removeEventListener(ev, stop, opts);
      document.removeEventListener("keydown", keys, opts);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", blur);
      window.removeEventListener("pageshow", focus);
      window.removeEventListener("focus", focus);
    };
  }, []);
  return null;
}
