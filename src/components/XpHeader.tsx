"use client";

import { useApp } from "@/lib/store";
import { progress } from "@/lib/xp";

export function XpHeader({ title }: { title: string }) {
  const { profile } = useApp();
  const p = progress(profile.xp);
  return (
    <header className="mb-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black glow-text">{title}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Lv {p.level}</span>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--gold)] text-lg font-black text-[var(--gold)] shadow-[0_0_14px_var(--gold)]">
            {p.rank.name}
          </span>
        </div>
      </div>
      <div className="mt-2 bar"><div style={{ width: `${p.levelPct}%` }} /></div>
    </header>
  );
}
