"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { TITLES } from "@/lib/economy";
import { milestones } from "@/lib/review";
import { useApp } from "@/lib/store";

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// Every trophy with the day it was earned: achievements, titles, ranks and levels.
export default function TrophyRoom() {
  const { data, profile } = useApp();
  const [tab, setTab] = useState<"earned" | "locked" | "road">("earned");
  const got = ACHIEVEMENTS.filter((a) => profile.achievements[a.id]).sort((a, b) => profile.achievements[b.id].localeCompare(profile.achievements[a.id]));
  const locked = ACHIEVEMENTS.filter((a) => !profile.achievements[a.id]);
  const road = useMemo(() => milestones(data), [data]);
  const newest = got[0];
  return (
    <>
      <XpHeader title="Trophy room" icon="🏆" subtitle={`${got.length} of ${ACHIEVEMENTS.length} trophies earned`} />
      {newest && (
        <section className="card frame p-4 mb-4 text-center">
          <div className="text-[10px] font-game tracking-widest text-muted">LATEST TROPHY</div>
          <div className="text-6xl drop-shadow-[0_0_14px_var(--gold)] mt-1">{newest.icon}</div>
          <div className="font-game font-black mt-1">{newest.name}</div>
          <div className="text-xs text-muted">{newest.desc} · {when(profile.achievements[newest.id])}</div>
        </section>
      )}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {([["earned", `🏆 Earned ${got.length}`], ["locked", `🔒 To win ${locked.length}`], ["road", "🛤️ Journey"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip py-2 justify-center ${tab === k ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>
      {tab === "earned" && (
        <section className="card p-4 mb-4">
          {got.length === 0 ? <p className="text-sm text-muted">No trophies yet. Log your first action to earn one!</p> : (
            <ul className="space-y-2">
              {got.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-2.5">
                  <span className="text-3xl">{a.icon}</span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold">{a.name}</span><span className="block text-xs text-muted">{a.desc}</span></span>
                  <span className="text-[11px] text-right gold-text shrink-0">{when(profile.achievements[a.id])}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 section-title mb-2">🎖 Titles</div>
          <div className="flex flex-wrap gap-1.5">{TITLES.filter((t) => t.test(data)).map((t) => <span key={t.title} className="chip">{t.title}</span>)}</div>
        </section>
      )}
      {tab === "locked" && (
        <section className="card p-4 mb-4 grid grid-cols-2 gap-2">
          {locked.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 p-2.5 text-center">
              <div className="text-3xl grayscale opacity-50">{a.icon}</div>
              <div className="text-xs font-semibold mt-1">{a.name}</div>
              <div className="text-[11px] text-muted">{a.desc}</div>
              {profile.achievements_off?.[a.id] && <div className="text-[10px] text-rose-300 mt-1">Lost {when(profile.achievements_off[a.id])}, win it back!</div>}
            </div>
          ))}
          {!locked.length && <p className="col-span-2 text-sm">Every trophy won. Legendary! 👑</p>}
        </section>
      )}
      {tab === "road" && (
        <section className="card p-4 mb-4">
          {road.length === 0 ? <p className="text-sm text-muted">Reach level 5 or rank D to start your journey line.</p> : (
            <ol className="relative border-l border-[var(--accent2)]/40 ml-2 space-y-3">
              {road.map((m) => (
                <li key={`${m.name}${m.at}`} className="pl-4">
                  <span className="absolute -left-2.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--panel)] text-xs">{m.icon}</span>
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="text-[11px] text-muted">{when(m.at)}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <Link href="/rank" className="btn-ghost w-full block text-center mb-4">← Back to Hero</Link>
    </>
  );
}
