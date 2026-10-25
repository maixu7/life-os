"use client";

import { useEffect } from "react";
import { applyLite, measureOnce } from "@/lib/perf";
import { applyDisplay } from "@/lib/safety";

export function RegisterSW() {
  useEffect(() => {
    applyLite();
    applyDisplay(); // light mode, text size, bigger buttons (this device only)
    measureOnce();
    // 📱 Auto look: follow the phone when it switches between dark and light.
    const mq = matchMedia("(prefers-color-scheme: light)");
    const flip = () => applyDisplay();
    mq.addEventListener?.("change", flip);
    // ⌨️ When the keyboard opens, keep the box you are typing in visible (above the keyboard).
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),textarea,select,[contenteditable=true]")) return;
      setTimeout(() => {
        const vv = window.visualViewport, r = el.getBoundingClientRect();
        const h = vv ? vv.height : innerHeight;
        if (r.bottom > h - 8 || r.top < 0) el.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 350);
    };
    addEventListener("focusin", onFocus);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => { mq.removeEventListener?.("change", flip); removeEventListener("focusin", onFocus); };
  }, []);
  return null;
}
