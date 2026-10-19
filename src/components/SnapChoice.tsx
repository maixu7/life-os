"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { recognise } from "@/lib/foodphoto";
import { readLabel } from "@/lib/label";

// After a photo, the app first looks for it in its own list, on the phone
// (it reads the label text and looks at the shape; no AI). If it isn't
// there, you tap "Ask AI". AI never runs by itself.

export type Pick = { name: string; emoji: string; sub?: string; ja?: string; mine?: boolean };

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s\-・·.,'’()&＆]/g, "");

/** Names from the list that the photo's printed text or shape points to. */
export function listHits(list: Pick[], text: string, seen: string[], extra: string[] = []): Pick[] {
  const t = norm(text);
  const score = new Map<Pick, number>();
  const bump = (p: Pick, s: number) => score.set(p, Math.max(score.get(p) ?? 0, s));
  for (const name of extra) { const p = list.find((x) => x.name === name); if (p) bump(p, 1000); }
  if (t.length >= 3) for (const p of list) {
    for (const n of [norm(p.name), p.ja ? norm(p.ja) : ""]) if (n.length >= 3 && t.includes(n)) bump(p, n.length * 10 + (p.mine ? 5 : 0));
  }
  for (const s of seen) { const n = norm(s); for (const p of list) if (n.length >= 3 && norm(p.name).includes(n)) bump(p, 20 + (p.mine ? 5 : 0) - p.name.length / 100); }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, 8);
}

export function SnapChoice({ photo, img, list, what, more, guess, onAI, onPick, onClose }: {
  photo: string; img?: HTMLImageElement | null; list: Pick[]; what: string; more?: string;
  /** Extra matching for this kind of thing (e.g. drink or equipment names from the label text). */
  guess?: (text: string, seen: string[]) => string[];
  onAI: () => void; onPick: (p: Pick) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Pick[] | null>(img ? null : []);
  const [read, setRead] = useState("");
  useEffect(() => {
    if (!img) return;
    let live = true;
    (async () => {
      // Both readers run on the phone; either can fail offline the first time.
      const [label, shape] = await Promise.all([readLabel(img).catch(() => null), recognise(img).catch(() => null)]);
      if (!live) return;
      const text = label?.text ?? "", seen = [...(shape?.seen ?? []), ...(shape?.foods ?? [])];
      setRead([...(label?.names ?? []).slice(0, 2), ...seen.slice(0, 2)].join(", "));
      setFound(listHits(list, text, seen, guess?.(text, seen) ?? []));
    })();
    return () => { live = false; };
  }, [img, list, guess]);
  const hits = useMemo(() => {
    const n = norm(q);
    if (!n) return list.filter((p) => p.mine).slice(0, 30);
    return list.filter((p) => norm(p.name).includes(n) || (p.ja && norm(p.ja).includes(n)))
      .sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || a.name.length - b.name.length).slice(0, 60);
  }, [list, q]);
  const row = (p: Pick, i: number) => (
    <button key={`${p.name}-${i}`} onClick={() => { onClose(); onPick(p); }} className="w-full text-left rounded-xl bg-white/5 px-2.5 py-1.5 flex items-center gap-2">
      <span className="text-xl">{p.emoji}</span>
      <span className="flex-1 min-w-0"><span className="block text-sm truncate">{p.name}{p.mine ? " ⭐" : ""}</span>{(p.ja || p.sub) && <span className="block text-[10px] text-muted truncate">{[p.ja, p.sub].filter(Boolean).join(" · ")}</span>}</span>
    </button>
  );
  return (
    <Sheet title={`📷 What is this ${what}?${more ? ` (${more})` : ""}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" className="h-20 w-20 rounded-xl object-cover" />
        <p className="text-xs text-muted flex-1">
          {found == null ? <span className="animate-pulse text-[var(--accent2)]">🔍 Looking for it in the app&apos;s list ({list.length.toLocaleString()} items)… no AI.</span>
            : found.length ? <>📋 Found in the list{read ? ` (read: ${read})` : ""}. Tap the right one.</>
            : <>📋 Not found in the list{read ? ` (read: ${read})` : ""}. Search below, or tap Ask AI.</>}
        </p>
      </div>
      {found && found.length > 0 && <div className="space-y-1">{found.map(row)}</div>}
      <input className="input" placeholder={`Search the ${what} list (English or 日本語)…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {hits.map(row)}
        {q && !hits.length && <p className="text-xs text-muted">Nothing with that name in the list.</p>}
      </div>
      <button onClick={() => { onClose(); onAI(); }} className="btn-ghost w-full !py-2.5 ring-1 ring-[var(--accent)]">🤖 Not in the list? Ask AI</button>
    </Sheet>
  );
}
