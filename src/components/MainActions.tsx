"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EquipmentSheet } from "@/components/LazySheets";
import { CollectionSheet } from "@/components/Collection";
import { LearnUpload } from "@/components/LearnUpload";
import { IntakeStrip } from "@/components/IntakeStrip";
import { openSlotSheet } from "@/components/Blocks";
import { openFab } from "@/components/hub/Hub";
import { openReport } from "@/components/Summary";
import { useRunAction, useTasks } from "@/components/Coach";
import { atWork, fmt12, hm, hoursIn, phaseNow, sched, studyFrom } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";
import { CollectionHost, openCollection } from "@/components/Collections";
import { openUpload } from "@/lib/openUpload";

// The page's main purpose as big buttons at the very top (Eat / Drink on
// Food, Start workout on Train…). Everything else sits below them.

type Big = { icon: string; label: string; sub: string; href?: string; go?: () => void; tall?: boolean };

// Scroll to a block on this page; if it's tucked in "More", open it first.
export function toBlock(id: string) {
  const find = () => { const w = document.querySelector(`[data-block="${id}"]`); return (w?.classList.contains("contents") ? w.firstElementChild : w) as HTMLElement | null; };
  // Open a folded block (like Today's workout) and scroll it under the header.
  const show = (el: HTMLElement) => {
    const d = el.tagName === "DETAILS" ? el : el.querySelector("details");
    if (d) (d as HTMLDetailsElement).open = true;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };
  const el = find();
  if (el) return show(el);
  window.dispatchEvent(new CustomEvent("lifeos-showblock", { detail: id }));
  setTimeout(() => { const e = find(); if (e) show(e); }, 150);
}

const MAIN: Record<string, Big[]> = {
  "/": [
    { icon: "⏱️", label: "Focus now", sub: "Start a study session", href: "/focus" },
    { icon: "➕", label: "Log", sub: "Anything you did", go: openFab },
    { icon: "📊", label: "Report", sub: "How you're doing", go: () => openReport("day") },
  ],
  "/today": [
    { icon: "➕", label: "Log something", sub: "Food, water, study, sleep…", go: openFab },
    { icon: "✅", label: "Today's list", sub: "What's done, what's left", go: () => toBlock("basics") },
  ],
  "/food": [
    { icon: "🍽️", label: "Eat", sub: "Photo, say it or search", go: () => openSlotSheet({ kind: "meal" }) },
    { icon: "🥤", label: "Drink", sub: "Photo, say it or search", go: () => openSlotSheet({ kind: "drink" }) },
    { icon: "📷", label: "Upload", sub: "Food, drink, gear or shopping", go: () => openUpload() },
    { icon: "🛒", label: "Shopping", sub: "List, snap, receipt", href: "/shop" },
  ],
  "/train": [
    { icon: "▶️", label: "Start workout", sub: "Today's plan with timers", go: () => toBlock("plan") },
    { icon: "🏋️", label: "Log exercise", sub: "Any move, sets and reps", go: () => toBlock("move") },
    { icon: "📷", label: "My equipment", sub: "Snap your gear", go: () => window.dispatchEvent(new Event("lifeos-equipment")) },
  ],
  "/learn": [
    { icon: "▶️", label: "Study now", sub: "Focus timer on your goal", href: "/focus" },
    { icon: "📷", label: "Upload", sub: "Book, page, course or video", go: () => window.dispatchEvent(new Event("lifeos-learnupload")) },
    { icon: "🗂️", label: "My collection", sub: "Books, apps, videos", go: () => window.dispatchEvent(new Event("lifeos-collection")) },
    { icon: "📖", label: "Log learning", sub: "Pages, minutes, kanji…", go: () => toBlock("today") },
  ],
};

// A second row of big buttons: your collections.
const MORE: Record<string, Big[]> = {
  "/food": [
    { icon: "🍱", label: "My food collection", sub: "What I have · what I've eaten", go: () => openCollection("food") },
    { icon: "🥤", label: "My drink collection", sub: "What I have · what I've drunk", go: () => openCollection("drink") },
  ],
  "/train": [
    { icon: "🏋️", label: "My gym collection", sub: "Photo, description, how many, kg each", go: () => openCollection("gym") },
  ],
};

// Base: the two big buttons at the very top.
export function SleepWakeTiles() {
  const { data } = useApp();
  const asleep = [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
  const woke = data.logs.find((l) => l.kind === "wake" && l.day === toDay(new Date()));
  const t = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <button onClick={() => openSlotSheet({ kind: "sleep" })} className={`${BIG_TILE} ${asleep ? "ring-2 ring-indigo-300" : ""}`}>
        <span className="text-5xl leading-none">😴</span><span className="font-black text-base">Go to sleep</span>
        <span className="text-[10px] text-muted">{asleep ? `Sleeping since ${t(String(asleep.data.start))}` : "Start your sleep"}</span>
      </button>
      <button onClick={() => openSlotSheet({ kind: "wake" })} className={`${BIG_TILE} ${asleep ? "ring-2 ring-amber-300 animate-pulse" : ""}`}>
        <span className="text-5xl leading-none">🌅</span><span className="font-black text-base">Wake up</span>
        <span className="text-[10px] text-muted">{woke ? `Woke at ${String(woke.data.time ?? t(woke.created_at))}` : "Log your wake-up"}</span>
      </button>
    </div>
  );
}

export const BIG_TILE = "rounded-2xl border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/25 to-[var(--accent2)]/10 p-3 flex flex-col items-center justify-center gap-1 text-center active:scale-95 min-h-28";

export function MainActions({ page }: { page: string }) {
  const [equip, setEquip] = useState(false);
  const [kit, setKit] = useState(false);
  const [learnUp, setLearnUp] = useState(false);
  useEffect(() => {
    const go = () => setEquip(true);
    const col = () => setKit(true);
    const up = () => setLearnUp(true);
    window.addEventListener("lifeos-equipment", go);
    window.addEventListener("lifeos-collection", col);
    window.addEventListener("lifeos-learnupload", up);
    return () => { window.removeEventListener("lifeos-equipment", go); window.removeEventListener("lifeos-collection", col); window.removeEventListener("lifeos-learnupload", up); };
  }, []);
  const { data, saveSettings } = useApp();
  const tasks = useTasks();
  const run = useRunAction();
  const sc = sched(data.profile.settings.schedule);
  const n = phaseNow(sc);
  const work = atWork(n);
  const study = fmt12(hm(studyFrom(sc)));
  // The tiles follow your day: at work, Base shows work things and Learn says when study starts.
  let list = MAIN[page];
  if (!list) return null;
  const top = tasks[0];
  if (page === "/") list = [
    work ? { icon: "💼", label: "At work", sub: `${n.label} · ${fmt12(sc.workEnd)} end`, go: top ? () => run(top.action) : openFab }
      : n.phase === "study" ? list[0]
      : top ? { icon: top.icon, label: "Do next", sub: top.title, go: () => run(top.action) } : list[0],
    ...list.slice(1),
  ];
  if (page === "/learn" && work) list = [{ ...list[0], sub: `After work, from ${study}` }, ...list.slice(1)];
  // You wrote your hours in About me but the schedule says something else: one tap fixes it.
  const said = hoursIn(data.profile.about);
  const fix = page === "/" && said && (said.start !== sc.workStart || said.end !== sc.workEnd) ? said : null;
  const cls = BIG_TILE;
  const inner = (b: Big) => <><span className="text-4xl leading-none">{b.icon}</span><span className={`font-black leading-tight ${list.length === 3 ? "text-sm" : "text-base"}`}>{b.label}</span><span className="text-[10px] text-muted leading-tight">{b.sub}</span></>;
  return (
    <>
    {equip && <EquipmentSheet onClose={() => setEquip(false)} />}
    <CollectionHost />
    {kit && <CollectionSheet onClose={() => setKit(false)} />}
    {learnUp && <LearnUpload onClose={() => setLearnUp(false)} />}
    {fix && (
      <div className="card p-3 mb-3 text-sm border border-amber-400/50">
        ⏰ In About me you wrote you work <b>{fmt12(fix.start)}–{fmt12(fix.end)}</b>, but your schedule says <b>{fmt12(sc.workStart)}–{fmt12(sc.workEnd)}</b>. Tasks follow the schedule.
        <button onClick={() => saveSettings({ schedule: { ...sc, workStart: fix.start, workEnd: fix.end, workType: sc.workType === "none" || sc.workType === "school" ? "job" : sc.workType, workPlace: sc.workType === "school" ? "Work" : sc.workPlace } })} className="btn-primary w-full mt-2 !py-1.5 text-sm">Use {fmt12(fix.start)}–{fmt12(fix.end)}</button>
      </div>
    )}
    {work && (page === "/learn" || page === "/train") && <p className="card p-2.5 mb-3 text-xs">💼 Work hours until {fmt12(sc.workEnd)}. Study and training tasks start after work ({page === "/learn" ? study : fmt12(sc.exercise || sc.workEnd)}).</p>}
    <div className={`grid ${list.length === 4 || page === "/learn" ? "grid-cols-2" : list.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-2 mb-4`}>
      {list.map((b) => b.href
        ? <Link key={b.label} href={b.href} className={`${cls} ${b.tall ? "row-span-2" : ""}`}>{inner(b)}</Link>
        : <button key={b.label} onClick={b.go} className={`${cls} ${b.tall ? "row-span-2" : ""}`}>{inner(b)}</button>)}
    </div>
    {page === "/food" && <IntakeStrip />}
    {MORE[page] && <div className={`grid ${MORE[page].length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-2 mb-4 -mt-2`}>{MORE[page].map((b) => <button key={b.label} onClick={b.go} className={cls}>{inner(b)}</button>)}</div>}
    </>
  );
}
