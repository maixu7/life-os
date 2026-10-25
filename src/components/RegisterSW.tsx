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
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => mq.removeEventListener?.("change", flip);
  }, []);
  return null;
}
