"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const KEY = "lifeos-last-route";

// Reopening the app continues on the screen you were last using.
export function ResumeRoute() {
  const path = usePathname();
  const router = useRouter();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      try {
        const last = localStorage.getItem(KEY);
        if (last && last !== path && path === "/" && !location.search) {
          router.replace(last);
          return;
        }
      } catch {}
    }
    try {
      localStorage.setItem(KEY, path + location.search);
    } catch {}
  }, [path, router]);

  return null;
}
