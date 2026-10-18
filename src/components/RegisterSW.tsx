"use client";

import { useEffect } from "react";
import { applyLite, measureOnce } from "@/lib/perf";
import { applyDisplay } from "@/lib/safety";

export function RegisterSW() {
  useEffect(() => {
    applyLite();
    applyDisplay(); // light mode, text size, bigger buttons (this device only)
    measureOnce();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
