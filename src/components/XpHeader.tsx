"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AvatarArt } from "@/components/AvatarArt";
import { gold, vitals } from "@/lib/economy";
import { karma, logKarma } from "@/lib/karma";
import { describe } from "@/lib/describe";
import { streak } from "@/lib/missions";
import { today, useApp } from "@/lib/store";
import { progress } from "@/lib/xp";

function Vital({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-game text-[10px] w-6" style={{ color }}>{label}</span>
      <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

// The hero HUD at the top of every screen, plus the zone name.
export function XpHeader({ title, icon, subtitle }: { title: string; icon?: string; subtitle?: string }) {
  const { profile, data } = useApp();
  const p = progress(profile.xp);
  const day = today();
  const todays = useMemo(() => data.logs.filter((l) => l.day === day), [data.logs, day]);
  const v = vitals(data, todays);
  const g = gold(data);
  const s = useMemo(() => streak(data), [data]);
  const k = useMemo(() => karma(data), [data]);
  // The most recent deed and which side it pushes you toward.
  const lastDeed = useMemo(() => {
    const l = [...data.logs].sort((a, b) => b.created_at.localeCompare(a.created_at)).find((x) => logKarma(x) !== 0);
    return l ? { l, k: logKarma(l) } : null;
  }, [data.logs]);

  return (
    <header className="mb-5">
      <div className="card frame p-3 flex items-center gap-3">
        <Link href="/rank" className="relative shrink-0 rounded-full" style={{ boxShadow: `0 0 18px ${k.color}` }}>
          <AvatarArt a={profile.avatar} size={60} />
          <span className="absolute -bottom-1 -right-1 rounded-md bg-[var(--gold)] px-1.5 text-[10px] font-black text-black font-game">{p.level}</span>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-game text-sm font-bold truncate">{profile.display_name}</div>
              <div className="text-[11px] text-[var(--accent2)] truncate">{profile.title} · Rank {p.rank.name}</div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold shrink-0">
              <span className="gold-text">🪙 {g.toLocaleString()}</span>
              <span className={s ? "text-orange-400" : "text-muted"}>🔥{s}</span>
            </div>
          </div>
          <div className="mt-1.5 bar !h-2"><div style={{ width: `${p.levelPct}%` }} /></div>
          <div className="mt-1.5 flex items-center gap-1.5" title={`${k.name} (${k.score})`}>
            <span className="text-[10px]">😈</span>
            <div className="relative h-1.5 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #ff3b6b, #8a5cff 40%, #c0b6ff 50%, #7cf2ff 60%, #ffe066)" }}>
              <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all duration-700"
                style={{ left: `${(k.score + 100) / 2}%`, background: k.color, boxShadow: `0 0 8px ${k.color}` }} />
            </div>
            <span className="text-[10px]">😇</span>
            <span className="text-[10px] font-bold w-24 truncate" style={{ color: k.color }}>{k.name}</span>
          </div>
          {lastDeed && (
            <div className="mt-0.5 text-[10px] truncate" style={{ color: lastDeed.k > 0 ? "#ffe066" : "#ff6b9b" }}>
              {lastDeed.k > 0 ? "😇 walking toward Angel" : "😈 walking toward Devil"} · {describe(lastDeed.l).title} {lastDeed.k > 0 ? `+${lastDeed.k}` : lastDeed.k}
            </div>
          )}
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <Vital label="HP" value={v.hp} color="var(--hp)" />
            <Vital label="MP" value={v.mp} color="var(--mp)" />
            <Vital label="STA" value={v.sta} color="var(--sta)" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-2">
        {icon && <span className="text-2xl animate-float">{icon}</span>}
        <div>
          <h1 className="text-xl font-black glow-text uppercase">{title}</h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
