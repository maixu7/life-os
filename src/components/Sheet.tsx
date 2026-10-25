"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// A clean popup: slides up from the bottom on phones, centered on wider screens.
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useBackCloses(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Rendered at the top of the page so no card (with blur or transforms) can trap it.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  if (!host) return null;
  return createPortal(
    <div data-overlay className="fixed inset-0 z-[45] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#140c24] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button aria-label="Close" title="Close" onClick={onClose} className="h-10 w-10 shrink-0 rounded-full bg-white/10 text-muted hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>,
    host,
  );
}

/** The phone's Back button (or the browser's) closes the top pop-up instead of leaving the page. */
const openDepths = new Set<number>();
const depthOf = () => Number((history.state as { loDepth?: number } | null)?.loDepth) || 0;
let skipper = false;
export function useBackCloses(onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    // Back steps left by pop-ups that were closed with ✕ or Save are skipped, so Back never "does nothing".
    // (Closing never calls history.back() itself: that could undo a page change the pop-up just started.)
    if (!skipper) {
      skipper = true;
      addEventListener("popstate", () => { const d = depthOf(); if (d > 0 && !openDepths.has(d)) history.back(); });
    }
    const depth = depthOf() + 1;
    try { history.pushState({ ...(history.state ?? {}), loDepth: depth }, "", location.href); } catch { return; }
    openDepths.add(depth);
    const onPop = () => { if (depthOf() < depth) close.current(); };
    addEventListener("popstate", onPop);
    return () => { removeEventListener("popstate", onPop); openDepths.delete(depth); };
  }, []);
}

export const dtLocal = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const fmtDuration = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
};
