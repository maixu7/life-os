"use client";

import { useEffect, useState } from "react";
import { cachedPicture, findPicture } from "@/lib/picture";

// A real photo of `name` when one can be found, otherwise its emoji.
export function Pic({ name, emoji, hint = "", size = 44, className = "", src }: {
  name: string; emoji: string; hint?: string; size?: number; className?: string; src?: string;
}) {
  const [url, setUrl] = useState<string | undefined>(() => (src ? src : name.trim().length > 1 ? cachedPicture(name, hint) : ""));
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    if (src) return setUrl(src);
    if (name.trim().length < 2) return setUrl("");
    const hit = cachedPicture(name, hint);
    if (hit !== undefined) return setUrl(hit);
    setUrl(undefined);
    let live = true;
    // Wait for typing to settle before looking anything up.
    const t = setTimeout(() => findPicture(name, hint).then((u) => live && setUrl(u)), 500);
    return () => { live = false; clearTimeout(t); };
  }, [name, hint, src]);

  const box = { width: size, height: size };
  if (url && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={box} onError={() => setBroken(true)} className={`shrink-0 rounded-xl object-cover bg-white/5 ${className}`} />;
  }
  return (
    <span style={{ ...box, fontSize: size * 0.55 }} className={`grid shrink-0 place-items-center rounded-xl bg-white/5 ${url === undefined ? "animate-pulse" : ""} ${className}`}>{emoji}</span>
  );
}
