"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";
import { dueReports, report, type ReportPeriod } from "@/lib/summary";

// 📊 The short report for a day, week or month. Opens from the header icon,
// from the 8 PM / Saturday notifications, and once by itself when one is due.

export const openReport = (p: ReportPeriod = "day") => window.dispatchEvent(new CustomEvent("lifeos-report", { detail: p }));
const SEEN = "lifeos-report-seen";
const TABS: [ReportPeriod, string][] = [["day", "Today"], ["week", "This week"], ["month", "This month"]];

export function ReportButton() {
  return <button onClick={() => openReport("day")} aria-label="Report" title="Report" className="shrink-0 h-10 w-10 rounded-xl border border-white/15 bg-white/5 grid place-items-center text-lg active:scale-90">📊</button>;
}

export function SummaryHost() {
  const [open, setOpen] = useState<ReportPeriod | null>(null);
  useEffect(() => {
    const go = (e: Event) => setOpen((e as CustomEvent<ReportPeriod>).detail);
    window.addEventListener("lifeos-report", go);
    // A tap on a report notification: /?report=week (fresh start) or a message (app already open).
    const fromUrl = (u: string) => { const p = new URL(u, location.origin).searchParams.get("report"); if (p === "day" || p === "week" || p === "month") setOpen(p); };
    fromUrl(location.href);
    if (location.search.includes("report=")) history.replaceState(null, "", location.pathname);
    const msg = (e: MessageEvent) => typeof e.data?.open === "string" && fromUrl(e.data.open);
    navigator.serviceWorker?.addEventListener("message", msg);
    // Due and not seen yet: show it once.
    const t = setTimeout(() => {
      try {
        const seen: string[] = JSON.parse(localStorage.getItem(SEEN) ?? "[]");
        const due = dueReports().find((r) => !seen.includes(r.key));
        if (due) { localStorage.setItem(SEEN, JSON.stringify([...seen, due.key].slice(-40))); setOpen((o) => o ?? due.period); }
      } catch {}
    }, 4000);
    return () => { window.removeEventListener("lifeos-report", go); navigator.serviceWorker?.removeEventListener("message", msg); clearTimeout(t); };
  }, []);
  return open ? <SummarySheet start={open} onClose={() => setOpen(null)} /> : null;
}

function SummarySheet({ start, onClose }: { start: ReportPeriod; onClose: () => void }) {
  const { data } = useApp();
  const [period, setPeriod] = useState(start);
  const r = useMemo(() => report(data, period), [data, period]);
  const arrow = (t: number) => (t > 0 ? <span className="text-emerald-300">▲</span> : t < 0 ? <span className="text-rose-300">▼</span> : null);
  return (
    <Sheet title="📊 Report" onClose={onClose}>
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.map(([p, l]) => <button key={p} onClick={() => setPeriod(p)} className={`chip justify-center text-xs ${period === p ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <div className="rounded-2xl bg-white/[.04] p-3 text-center">
        <div className="text-3xl font-black">{r.met}/{r.of}</div>
        <div className="text-xs text-muted">goals met · {r.span > 1 ? `${r.logged} of ${r.span} days logged · ` : ""}▲▼ vs the {period === "day" ? "day" : period} before</div>
      </div>
      <ul className="divide-y divide-white/5 text-sm">
        {r.lines.map((l) => (
          <li key={l.label} className="flex items-center gap-2 py-1.5">
            <span className="w-6 text-center">{l.icon}</span>
            <span className="flex-1">{l.label}</span>
            <span className={l.ok === false ? "text-rose-300" : l.ok ? "text-emerald-300" : ""}>{l.value}</span>
            {l.goal && <span className="text-[10px] text-muted w-14 text-right">goal {l.goal}</span>}
            <span className="w-3">{arrow(l.trend)}</span>
          </li>
        ))}
      </ul>
      <div>
        <h3 className="section-title mb-1">⚠️ What you lack</h3>
        {r.lack.length ? (
          <ul className="space-y-1.5 text-sm">
            {r.lack.map((g) => (
              <li key={g.id} className="rounded-xl bg-rose-500/10 px-3 py-2">
                <div>{g.icon} <b>{g.label}</b>: {g.have} <span className="text-muted">(need {g.need})</span></div>
                <div className="text-xs text-muted">→ {g.task.title}</div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{r.logged ? "Nothing missing. Keep it up!" : "No records yet for this time, so nothing to check."}</p>}
      </div>
      {r.wins.length > 0 && <p className="text-sm"><span className="text-muted">Well done: </span>{r.wins.join(" · ")}</p>}
    </Sheet>
  );
}
