"use client";

import { useEffect, useRef, useState } from "react";

// Android's new photo picker only shows Photos and Albums, with no camera.
// Every photo button in the app opens a hidden <input type=file accept=image/*>;
// on Android we stop that first tap and ask: take a photo (opens the camera
// through capture=) or pick from the gallery. One place, so every upload gets it.

const OK = "loCamOk";

// Android phones say "Android". Android tablets (and the Play Store app on them) open sites
// in desktop mode, so they say "Linux" instead: a touch screen on Linux is a tablet too.
// iPhone and iPad already offer the camera in their own sheet.
export function needsChooser() {
  const ua = navigator.userAgent;
  const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua) && navigator.maxTouchPoints > 0) return false; // Apple's own sheet has the camera
  if (/Android/i.test(ua) || uad?.platform === "Android") return true;
  // Tablets in desktop mode (and touch laptops): any touch screen.
  return navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
}

/** Put a taken picture into the page's own photo box, as if it was picked. */
function deliver(el: HTMLInputElement, f: File) {
  const dt = new DataTransfer();
  dt.items.add(f);
  el.files = dt.files;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function CameraChoice() {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [live, setLive] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!needsChooser()) return;
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
  if (live) return <LiveCamera onShot={(f) => { deliver(live, f); setLive(null); }} onClose={() => setLive(null)}
    onFallback={() => { const el = live; setLive(null); el.setAttribute("capture", "environment"); el.dataset[OK] = "1"; el.click(); setTimeout(() => el.removeAttribute("capture"), 1500); }} />;
  if (!input) return null;
  const gallery = () => {
    const el = input;
    setInput(null);
    el.removeAttribute("capture");
    el.dataset[OK] = "1";
    el.click();
  };
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-end justify-center" onClick={() => setInput(null)} data-noedit="">
      <div className="card w-full max-w-md m-3 p-3 space-y-2" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add a photo">
        <div className="text-sm font-bold text-center">Add a photo</div>
        <button className="btn-primary w-full py-3" onClick={() => { setLive(input); setInput(null); }}>📷 Take a photo</button>
        <button className="btn-ghost w-full py-3" onClick={gallery}>🖼️ Choose from gallery</button>
        <button className="w-full text-sm text-muted py-2.5" onClick={() => setInput(null)}>Cancel</button>
      </div>
    </div>
  );
}

// The camera inside the app (works even where the phone's picker has no camera button).
function LiveCamera({ onShot, onClose, onFallback }: { onShot: (f: File) => void; onClose: () => void; onFallback: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [err, setErr] = useState("");
  const [front, setFront] = useState(false);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("none");
        stream.current?.getTracks().forEach((t) => t.stop());
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: front ? "user" : { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (off) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        setErr("");
      } catch (e) {
        setErr((e as Error).name === "NotAllowedError" ? "denied" : "none");
      }
    })();
    return () => { off = true; };
  }, [front]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);
  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    navigator.vibrate?.(20);
    c.toBlob((b) => { if (b) onShot(new File([b], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })); }, "image/jpeg", 0.9);
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Camera" data-noedit="" className="fixed inset-0 z-[95] bg-black flex flex-col">
      <button aria-label="Close camera" onClick={onClose} className="absolute right-3 top-[max(.75rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-xl text-white">✕</button>
      {err ? (
        <div className="m-auto max-w-sm p-6 text-center text-white space-y-3">
          <div className="text-5xl">📷</div>
          {err === "denied" ? (
            <>
              <p className="font-bold">The camera is blocked for this app.</p>
              <p className="text-sm text-white/70">Tap the 🔒 or ⓘ next to the web address → Permissions → Camera → Allow. On Android also check: Settings → Apps → Chrome → Permissions → Camera → Allow.</p>
            </>
          ) : <p className="text-sm text-white/70">This device didn&apos;t open its camera here.</p>}
          <button className="btn-primary w-full !py-3" onClick={onFallback}>Try the phone&apos;s camera app</button>
          <button className="btn-ghost w-full !py-3" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <>
          <video ref={video} playsInline muted className="flex-1 min-h-0 w-full object-contain" />
          <div className="flex items-center justify-around p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <button onClick={onClose} className="btn-ghost !px-4 !py-2.5 text-sm">Cancel</button>
            <button aria-label="Take photo" onClick={shoot} className="h-20 w-20 rounded-full border-4 border-white bg-white/30 active:scale-90" />
            <button aria-label="Switch camera" onClick={() => setFront((f) => !f)} className="btn-ghost !px-4 !py-2.5 text-xl">🔄</button>
          </div>
        </>
      )}
    </div>
  );
}
