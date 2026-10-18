"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { openSlotSheet, useRunSlot } from "@/components/Blocks";
import { Sheet } from "@/components/Sheet";
import { CheckinSheet } from "@/components/tools/Checkin";
import { NightLayer } from "@/components/hub/Calm";
import { InboxWatcher } from "@/components/hub/Talk";
import { DEFAULT_PINS, HUB, hubOf, openHub, type HubId } from "@/components/hub/registry";
import { CHECKIN_BY_KIND } from "@/lib/tools";
import { useApp } from "@/lib/store";

// Sheets load only when opened, so every page stays light on the tablet.
const DetoxSheet = dynamic(() => import("@/components/hub/Calm").then((x) => x.DetoxSheet));
const NightSheet = dynamic(() => import("@/components/hub/Calm").then((x) => x.NightSheet));
const SleepPlanSheet = dynamic(() => import("@/components/hub/Calm").then((x) => x.SleepPlanSheet));
const SosSheet = dynamic(() => import("@/components/hub/Calm").then((x) => x.SosSheet));
const UrgeSheet = dynamic(() => import("@/components/hub/Calm").then((x) => x.UrgeSheet));
const BrainDumpSheet = dynamic(() => import("@/components/hub/Plan").then((x) => x.BrainDumpSheet));
const MorningSheet = dynamic(() => import("@/components/hub/Plan").then((x) => x.MorningSheet));
const PlannerSheet = dynamic(() => import("@/components/hub/Plan").then((x) => x.PlannerSheet));
const SurpriseSheet = dynamic(() => import("@/components/hub/Plan").then((x) => x.SurpriseSheet));
const ChainSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.ChainSheet));
const EventsSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.EventsSheet));
const FreezeSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.FreezeSheet));
const LootSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.LootSheet));
const RivalSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.RivalSheet));
const SkillTreeSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.SkillTreeSheet));
const WorldMapSheet = dynamic(() => import("@/components/hub/Play").then((x) => x.WorldMapSheet));
const BuddySheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.BuddySheet));
const CameraSheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.CameraSheet));
const ChatSheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.ChatSheet));
const InboxSheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.InboxSheet));
const LangSheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.LangSheet));
const ShareSheet = dynamic(() => import("@/components/hub/Talk").then((x) => x.ShareSheet));

// Shows whichever hub tool was asked for, on any page. Mounted once in the app layout.
export function HubHost() {
  const [id, setId] = useState<HubId | "mood" | null>(null);
  useEffect(() => {
    const go = (e: Event) => setId((e as CustomEvent<HubId>).detail);
    window.addEventListener("lifeos-hub", go);
    return () => window.removeEventListener("lifeos-hub", go);
  }, []);
  const close = () => setId(null);
  const S: Record<string, React.ComponentType<{ onClose: () => void }>> = {
    camera: CameraSheet, sleepplan: SleepPlanSheet, urge: UrgeSheet, detox: DetoxSheet, sos: SosSheet, night: NightSheet, morning: MorningSheet,
    dump: BrainDumpSheet, planner: PlannerSheet, surprise: SurpriseSheet, chain: ChainSheet, skills: SkillTreeSheet, map: WorldMapSheet,
    freeze: FreezeSheet, rival: RivalSheet, loot: LootSheet, events: EventsSheet, buddy: BuddySheet, chat: ChatSheet, inbox: InboxSheet,
    share: ShareSheet, lang: LangSheet,
  };
  const C = id && id !== "mood" ? S[id] : null;
  return (
    <>
      <NightLayer />
      <InboxWatcher />
      {id === "mood" && <CheckinSheet c={CHECKIN_BY_KIND.mood} onClose={close} />}
      {C && <C onClose={close} />}
    </>
  );
}
export const openMood = () => window.dispatchEvent(new CustomEvent("lifeos-hub", { detail: "mood" }));

// The five everyday logs: one tap each.
export function useQuickLogs() {
  const run = useRunSlot();
  const router = useRouter();
  return [
    { id: "meal", icon: "🍱", label: "Meal", go: () => openSlotSheet({ kind: "meal" }) },
    { id: "water", icon: "💧", label: "Water", go: () => run({ type: "water", ml: 250 }) },
    { id: "study", icon: "📖", label: "Study", go: () => router.push("/focus?start=1") },
    { id: "train", icon: "⚔️", label: "Workout", go: () => router.push("/train") },
    { id: "mood", icon: "😊", label: "Mood", go: openMood },
  ];
}

// ---------- 62 Floating ＋ on every page ----------
export function Fab() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const quick = useQuickLogs();
  if (path === "/control" || path === "/quick") return null;
  const pick = (f: () => void) => { setOpen(false); f(); };
  return (
    <>
      <button aria-label="Quick add" onClick={() => setOpen(true)} className="fixed right-4 bottom-[10.5rem] z-[35] h-12 w-12 rounded-full text-2xl grid place-items-center btn-gold !p-0 shadow-lg">＋</button>
      {open && (
        <Sheet title="＋ Quick add" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-5 gap-2">
            {quick.map((q) => <button key={q.id} onClick={() => pick(q.go)} className="rounded-2xl bg-white/5 border border-white/10 p-2 flex flex-col items-center gap-1 active:scale-95"><span className="text-2xl">{q.icon}</span><span className="text-[10px] leading-tight text-center">{q.label}</span></button>)}
          </div>
          <HubTiles onPick={() => setOpen(false)} />
        </Sheet>
      )}
    </>
  );
}

// All hub tools as tiles, grouped. Used by the ＋ menu and the Tools tab.
export function HubTiles({ onPick }: { onPick?: () => void }) {
  return (
    <div className="space-y-2">
      {(["Do", "Calm", "Play", "Talk"] as const).map((g) => (
        <div key={g}>
          <div className="text-[10px] font-game tracking-widest text-muted mb-1">{{ Do: "PLAN & DO", Calm: "CALM & CONTROL", Play: "GAME", Talk: "FRIENDS & SENSEI" }[g]}</div>
          <div className="grid grid-cols-4 gap-2">
            {HUB.filter((h) => h.group === g).map((h) => (
              <button key={h.id} onClick={() => { onPick?.(); openHub(h.id); }} className="rounded-2xl border border-white/10 bg-white/[.04] py-2.5 px-1 flex flex-col items-center gap-1 active:scale-95">
                <span className="text-2xl">{h.icon}</span><span className="text-[10px] leading-tight text-center">{h.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 77 Pinned actions (+ 63 the camera button) on Base Camp ----------
export function PinsCard() {
  const { profile, saveSettings } = useApp();
  const [edit, setEdit] = useState(false);
  const pins = (profile.settings.hub?.pins ?? DEFAULT_PINS).filter((p) => hubOf(p));
  const toggle = (id: HubId) => saveSettings({ hub: { ...profile.settings.hub, pins: pins.includes(id) ? pins.filter((x) => x !== id) : [...pins, id] } });
  return (
    <section className="card p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">📌 Pinned</h2>
        <button onClick={() => setEdit(!edit)} className="text-[11px] text-muted">{edit ? "Done" : "✏️ Edit"}</button>
      </div>
      {!edit ? (
        <div className="grid grid-cols-5 gap-2">
          {pins.map((p) => { const h = hubOf(p)!; return (
            <button key={p} onClick={() => openHub(h.id)} className={`rounded-2xl border p-1.5 flex flex-col items-center gap-1 active:scale-95 ${p === "camera" ? "border-[var(--accent2)]/60 bg-[var(--accent2)]/10" : "border-white/10 bg-white/[.04]"}`}>
              <span className="text-2xl leading-none">{h.icon}</span><span className="text-[10px] leading-tight text-center line-clamp-2">{h.label}</span>
            </button>
          ); })}
          {!pins.length && <p className="col-span-5 text-xs text-muted">Nothing pinned. Tap ✏️ Edit.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {HUB.map((h) => (
            <button key={h.id} onClick={() => toggle(h.id)} className={`relative rounded-xl p-1.5 flex flex-col items-center text-[10px] ${pins.includes(h.id) ? "bg-[var(--accent2)]/20 border border-[var(--accent2)]" : "bg-white/5 border border-white/10"}`}>
              <span className="text-xl">{h.icon}</span>{h.label}{pins.includes(h.id) && <span className="absolute -top-1 -right-1">📌</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
