"use client";

import { searchGoods, type Good, type GoodKind } from "@/lib/goods";

// Name suggestions from 5,000+ Japanese shop items while you type
// (English or 日本語). Tap one to fill the name and its numbers.
export function GoodsSuggest({ q, onPick, kinds, max = 6 }: { q: string; onPick: (g: Good) => void; kinds?: GoodKind[]; max?: number }) {
  const t = q.trim();
  if (t.length < 2) return null;
  const hits = searchGoods(t, max + 1, kinds).filter((g) => g.name.toLowerCase() !== t.toLowerCase()).slice(0, max);
  if (!hits.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {hits.map((g) => (
        <button key={g.name} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(g)} className="chip !py-0.5 !px-2 text-[11px] text-left">
          {g.emoji} {g.name}{g.ja ? <span className="text-muted"> · {g.ja}</span> : null}{g.kcal ? <span className="text-muted"> · {g.kcal} kcal</span> : null}
        </button>
      ))}
    </div>
  );
}
