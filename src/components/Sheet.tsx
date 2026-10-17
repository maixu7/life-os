"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A clean popup: slides up from the bottom on phones, centered on wider screens.
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
          <button aria-label="Close" onClick={onClose} className="h-8 w-8 rounded-full bg-white/10 text-muted">✕</button>
        </div>
        {children}
      </div>
    </div>,
    host,
  );
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
