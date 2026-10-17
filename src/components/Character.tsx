"use client";

import { useMemo, useState } from "react";
import { PixelHero } from "@/components/PixelHero";
import { AvatarArt } from "@/components/AvatarArt";
import { Sheet } from "@/components/Sheet";
import { gold } from "@/lib/economy";
import { DEFAULT_GEAR, GEAR, gearById, ownedGear, RARITY, SLOTS, type Slot } from "@/lib/gear";
import { useApp } from "@/lib/store";
import { progress } from "@/lib/xp";

function SlotBox({ slot, onClick }: { slot: Slot; onClick: () => void }) {
  const { profile } = useApp();
  const id = profile.avatar.gear?.[slot] ?? DEFAULT_GEAR[slot];
  const it = gearById(id);
  const meta = SLOTS.find((s) => s.id === slot)!;
  const empty = !it || it.icon === "∅";
  return (
    <button onClick={onClick} aria-label={`${meta.label}: ${it?.name ?? "empty"}`}
      className="relative grid h-14 w-14 place-items-center rounded-lg border-2 bg-[#2a1d12] shadow-[inset_0_0_0_2px_#00000055] active:scale-95 transition"
      style={{ borderColor: empty ? "#5c4630" : RARITY[it!.rarity], boxShadow: empty ? undefined : `0 0 10px ${RARITY[it!.rarity]}55, inset 0 0 0 2px #00000055` }}>
      <span className={`text-2xl ${empty ? "opacity-25 grayscale" : ""}`}>{empty ? meta.ghost : it!.icon}</span>
      <span className="absolute -bottom-4 text-[9px] text-muted whitespace-nowrap">{meta.label}</span>
    </button>
  );
}

// The RPG character screen: hero on a platform with an equipment slot for every body part.
export function CharacterPanel() {
  const { profile } = useApp();
  const [slot, setSlot] = useState<Slot | null>(null);
  const col = (ids: Slot[]) => <div className="flex flex-col gap-6">{ids.map((s) => <SlotBox key={s} slot={s} onClick={() => setSlot(s)} />)}</div>;
  return (
    <>
    <section className="card p-4 mb-4 overflow-hidden" style={{ background: "linear-gradient(#3a2a1a, #2a1d12)", borderColor: "#7f5539" }}>
      <h2 className="section-title mb-3 text-center !text-[#ffd166]">⚔️ Character</h2>
      <div className="flex items-center justify-between gap-1">
        {col(["head", "cape", "chest"])}
        <div className="rounded-xl bg-[#1b130c] p-1 shadow-[inset_0_0_0_3px_#5c4630]">
          <AvatarArt a={profile.avatar} size={170} full glow={false} />
        </div>
        {col(["gloves", "legs", "boots"])}
      </div>
      <div className="mt-4 mb-4 flex justify-center gap-4">
        {(["base", "weapon", "offhand"] as Slot[]).map((s) => <SlotBox key={s} slot={s} onClick={() => setSlot(s)} />)}
      </div>
    </section>
    {slot && <GearPicker slot={slot} onClose={() => setSlot(null)} />}
    </>
  );
}

function GearPicker({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const { data, profile, saveProfile, logActivity, celebrate } = useApp();
  const level = progress(profile.xp).level;
  const owned = useMemo(() => ownedGear(data, level), [data, level]);
  const coins = gold(data);
  const cur = profile.avatar.gear?.[slot] ?? DEFAULT_GEAR[slot];
  const meta = SLOTS.find((s) => s.id === slot)!;
  const equip = (id: string) => saveProfile({ avatar: { ...profile.avatar, gear: { ...(profile.avatar.gear ?? {}), [slot]: id } } });

  return (
    <Sheet title={`${meta.ghost} ${meta.label}`} onClose={onClose}>
      <div className="text-xs text-muted">🪙 {coins.toLocaleString()} gold · Level {level}. Free gear unlocks with levels; the rest is bought with gold.</div>
      <div className="grid gap-2">
        {GEAR.filter((x) => x.slot === slot).map((x) => {
          const has = owned.has(x.id);
          const on = cur === x.id;
          const locked = level < x.level;
          return (
            <div key={x.id} className={`flex items-center gap-3 rounded-xl border p-2 ${on ? "bg-white/10" : "bg-white/[.03]"}`} style={{ borderColor: on ? RARITY[x.rarity] : "rgba(255,255,255,.08)" }}>
              <div className="shrink-0 rounded-lg bg-[#1b130c] p-0.5">
                <PixelHero a={profile.avatar} gear={{ [slot]: x.id }} size={slot === "head" ? 56 : 40} portrait={slot === "head"} animate={false} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{x.icon !== "∅" && x.icon} {x.name}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: RARITY[x.rarity] }}>{x.rarity}</div>
                <div className="text-xs text-muted">{x.desc}</div>
              </div>
              {on ? <span className="chip chip-on text-xs">Equipped</span>
                : has ? <button onClick={() => equip(x.id)} className="btn-primary !px-3 !py-1.5 text-xs">Equip</button>
                : locked ? <span className="chip text-xs">🔒 Lv {x.level}</span>
                : <button disabled={coins < x.price} onClick={() => {
                    logActivity("redeem", { name: `Gear: ${x.name}`, cost: x.price, gear: x.id, emoji: x.icon }, new Date(), 0);
                    equip(x.id);
                    celebrate({ title: "⚔️ NEW GEAR!", subtitle: `${x.name} equipped`, icon: x.icon });
                  }} className="btn-gold !px-3 !py-1.5 text-xs">🪙 {x.price}</button>}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
