"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EquipmentSheet } from "@/components/Equipment";
import { openSlotSheet } from "@/components/Blocks";
import { openFab } from "@/components/hub/Hub";
import { openReport } from "@/components/Summary";

// The page's main purpose as big buttons at the very top (Eat / Drink on
// Food, Start workout on Train…). Everything else sits below them.

type Big = { icon: string; label: string; sub: string; href?: string; go?: () => void };

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
    { icon: "🛒", label: "Shopping", sub: "List, snap, receipt", href: "/shop" },
  ],
  "/train": [
    { icon: "▶️", label: "Start workout", sub: "Today's plan with timers", go: () => toBlock("plan") },
    { icon: "🏋️", label: "Log exercise", sub: "Any move, sets and reps", go: () => toBlock("move") },
    { icon: "📷", label: "My equipment", sub: "Snap your gear", go: () => window.dispatchEvent(new Event("lifeos-equipment")) },
  ],
  "/learn": [
    { icon: "▶️", label: "Study now", sub: "Focus timer on your goal", href: "/focus" },
    { icon: "📖", label: "Log learning", sub: "Pages, minutes, kanji…", go: () => toBlock("today") },
  ],
};

export const BIG_TILE = "rounded-2xl border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/25 to-[var(--accent2)]/10 p-3 flex flex-col items-center justify-center gap-1 text-center active:scale-95 min-h-28";

export function MainActions({ page }: { page: string }) {
  const [equip, setEquip] = useState(false);
  useEffect(() => {
    const go = () => setEquip(true);
    window.addEventListener("lifeos-equipment", go);
    return () => window.removeEventListener("lifeos-equipment", go);
  }, []);
  const list = MAIN[page];
  if (!list) return null;
  const cls = BIG_TILE;
  const inner = (b: Big) => <><span className="text-4xl leading-none">{b.icon}</span><span className={`font-black leading-tight ${list.length === 3 ? "text-sm" : "text-base"}`}>{b.label}</span><span className="text-[10px] text-muted leading-tight">{b.sub}</span></>;
  return (
    <>
    {equip && <EquipmentSheet onClose={() => setEquip(false)} />}
    <div className={`grid ${list.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-2 mb-4`}>
      {list.map((b) => b.href
        ? <Link key={b.label} href={b.href} className={cls}>{inner(b)}</Link>
        : <button key={b.label} onClick={b.go} className={cls}>{inner(b)}</button>)}
    </div>
    </>
  );
}
