"use client";

import { useEffect } from "react";
import { applyLite, measureOnce } from "@/lib/perf";

export function RegisterSW() {
  useEffect(() => {
    applyLite();
    measureOnce();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
