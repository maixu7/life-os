"use client";

import { useEffect, useState } from "react";

// Android's new photo picker only shows Photos and Albums, with no camera.
// Every photo button in the app opens a hidden <input type=file accept=image/*>;
// on Android we stop that first tap and ask: take a photo (opens the camera
// through capture=) or pick from the gallery. One place, so every upload gets it.

const OK = "loCamOk";

export function CameraChoice() {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!/Android/i.test(navigator.userAgent)) return;
    const on = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement) || el.type !== "file" || !/image/.test(el.accept)) return;
      if (el.dataset[OK]) { delete el.dataset[OK]; return; }
      if (el.hasAttribute("capture")) return; // already asks for the camera
      e.preventDefault(); e.stopPropagation();
      setInput(el);
    };
    document.addEventListener("click", on, true);
    return () => document.removeEventListener("click", on, true);
  }, []);
  if (!input) return null;
  const open = (camera: boolean) => {
    const el = input;
    setInput(null);
    if (camera) el.setAttribute("capture", "environment"); else el.removeAttribute("capture");
    el.dataset[OK] = "1";
    el.click();
    if (camera) setTimeout(() => el.removeAttribute("capture"), 1500);
  };
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-end justify-center" onClick={() => setInput(null)} data-noedit="">
      <div className="card w-full max-w-md m-3 p-3 space-y-2" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add a photo">
        <div className="text-sm font-bold text-center">Add a photo</div>
        <button className="btn-primary w-full py-3" onClick={() => open(true)}>📷 Take a photo</button>
        <button className="btn-ghost w-full py-3" onClick={() => open(false)}>🖼️ Choose from gallery</button>
        <button className="w-full text-xs text-muted py-1" onClick={() => setInput(null)}>Cancel</button>
      </div>
    </div>
  );
}
