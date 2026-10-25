"use client";

/** A clear ✕ close button for any pop-up, banner or sheet (44 px tap area). */
export function CloseX({ onClose, label = "Close", className = "" }: { onClose: () => void; label?: string; className?: string }) {
  return (
    <button type="button" aria-label={label} title={label} data-noedit
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className={`absolute right-1 top-1 z-10 grid h-11 w-11 place-items-center rounded-full text-lg text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent2)] ${className}`}>
      ✕
    </button>
  );
}
