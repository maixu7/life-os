"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";
import { allFacts, shift, type Facts } from "@/lib/review";
import { toDay, type Data } from "@/lib/store";
import { dueReports, lastMonth, rangeOf, report, step, type ReportPeriod } from "@/lib/summary";

// 📊 The short report for any day, week, month or year, picked on a calendar.
// Opens from the header icon, from the 8 PM / Saturday notifications, and
// once by itself when one is due.

type Open = { period: ReportPeriod; anchor: string };
export const openReport = (period: ReportPeriod = "day", anchor = toDay(new Date())) => window.dispatchEvent(new CustomEvent<Open>("lifeos-report", { detail: { period, anchor } }));
const SEEN = "lifeos-report-seen";
const TABS: [ReportPeriod, string][] = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"]];

export function ReportButton() {
  return <button onClick={() => openReport("day")} aria-label="Report" title="Report" className="shrink-0 h-10 w-10 rounded-xl border border-white/15 bg-white/5 grid place-items-center text-lg active:scale-90">📊</button>;
}

export function SummaryHost() {
  const [open, setOpen] = useState<Open | null>(null);
  useEffect(() => {
    const go = (e: Event) => setOpen((e as CustomEvent<Open>).detail);
    window.addEventListener("lifeos-report", go);
    // A tap on a report notification: /?report=week (fresh start) or a message (app already open).
    const fromUrl = (u: string) => { const p = new URL(u, location.origin).searchParams.get("report"); const day = toDay(new Date()); if (p === "day" || p === "week" || p === "year") setOpen({ period: p, anchor: day }); else if (p === "month") setOpen({ period: p, anchor: lastMonth(day) }); };
    fromUrl(location.href);
    if (location.search.includes("report=")) history.replaceState(null, "", location.pathname);
    const msg = (e: MessageEvent) => typeof e.data?.open === "string" && fromUrl(e.data.open);
    navigator.serviceWorker?.addEventListener("message", msg);
    // Due and not seen yet: show it once.
    const t = setTimeout(() => {
      try {
        const seen: string[] = JSON.parse(localStorage.getItem(SEEN) ?? "[]");
        const due = dueReports().find((r) => !seen.includes(r.key));
        if (due) { localStorage.setItem(SEEN, JSON.stringify([...seen, due.key].slice(-40))); setOpen((o) => o ?? { period: due.period, anchor: due.anchor }); }
      } catch {}
    }, 4000);
    return () => { window.removeEventListener("lifeos-report", go); navigator.serviceWorker?.removeEventListener("message", msg); clearTimeout(t); };
  }, []);
  return open ? <SummarySheet start={open.period} anchor={open.anchor} onClose={() => setOpen(null)} /> : null;
}

function SummarySheet({ start, anchor: first, onClose }: { start: ReportPeriod; anchor: string; onClose: () => void }) {
  const { data } = useApp();
  const [period, setPeriod] = useState(start);
  const [anchor, setAnchor] = useState(first);
  const f = useMemo(() => allFacts(data), [data]);
  const r = useMemo(() => report(data, period, anchor, new Date(), f), [data, period, anchor, f]);
  const today = toDay(new Date());
  const next = step(period, anchor, 1);
  const arrow = (t: number) => (t > 0 ? <span className="text-emerald-300">▲</span> : t < 0 ? <span className="text-rose-300">▼</span> : null);
  return (
    <Sheet title="📊 Report" onClose={onClose}>
      <div className="grid grid-cols-4 gap-1.5">
        {TABS.map(([p, l]) => <button key={p} onClick={() => setPeriod(p)} className={`chip justify-center text-xs ${period === p ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setAnchor(step(period, anchor, -1))} aria-label="Earlier" className="btn-ghost !px-3">‹</button>
        <div className="flex-1 text-center font-bold">{r.label}</div>
        <button onClick={() => setAnchor(min(next, today))} disabled={rangeOf(period, anchor, today).to >= today} aria-label="Later" className="btn-ghost !px-3 disabled:opacity-30">›</button>
      </div>
      <Picker data={data} f={f} period={period} anchor={anchor} today={today} onPick={setAnchor} />
      {anchor !== today && <button onClick={() => setAnchor(today)} className="chip mx-auto text-xs">↩ Back to now</button>}
      <div className="rounded-2xl bg-white/[.04] p-3 text-center">
        <div className="text-3xl font-black">{r.met}/{r.of}</div>
        <div className="text-xs text-muted">goals met · {r.span > 1 ? `${r.logged} of ${r.span} days logged · ` : ""}▲▼ vs the {period} before</div>
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

const min = (a: string, b: string) => (a < b ? a : b);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Green = most goals met, amber = some, red = few; empty = nothing logged.
const tone = (met: number, of: number, logged: number) => (!logged || !of ? "" : met / of >= 0.7 ? "bg-emerald-500/30" : met / of >= 0.4 ? "bg-amber-500/30" : "bg-rose-500/30");

// The calendar: days of the month (Day / Week), months of the year (Month), or years (Year).
function Picker({ data, f, period, anchor, today, onPick }: { data: Data; f: Facts; period: ReportPeriod; anchor: string; today: string; onPick: (day: string) => void }) {
  const [view, setView] = useState(anchor.slice(0, 7)); // month shown in the day grid
  const [y, setY] = useState(anchor.slice(0, 4));
  useEffect(() => { setView(anchor.slice(0, 7)); setY(anchor.slice(0, 4)); }, [anchor]);
  const now = new Date();
  const first = data.logs.reduce((m, l) => (l.day < m ? l.day : m), today);
  if (period === "day" || period === "week") {
    const start = `${view}-01`, lead = (new Date(`${start}T12:00`).getDay() + 6) % 7;
    const days = Array.from({ length: 42 }, (_, i) => shift(start, i - lead)).filter((d, i) => i < 35 || d.startsWith(view));
    const wk = rangeOf("week", anchor, today);
    const move = (n: number) => { const d = new Date(`${start}T12:00`); d.setMonth(d.getMonth() + n); setView(toDay(d).slice(0, 7)); };
    return (
      <div className="rounded-2xl bg-white/[.04] p-2">
        <div className="flex items-center text-xs mb-1">
          <button onClick={() => move(-1)} className="px-2" aria-label="Previous month">‹</button>
          <span className="flex-1 text-center">{new Date(`${start}T12:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
          <button onClick={() => move(1)} disabled={start > today} className="px-2 disabled:opacity-30" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="text-muted">{d}</div>)}
          {days.map((d) => {
            const r = d <= today ? report(data, "day", d, now, f, false) : null;
            const on = period === "day" ? d === anchor : d >= wk.from && d <= wk.to;
            return (
              <button key={d} disabled={!r} onClick={() => onPick(d)}
                className={`h-8 rounded-lg ${r ? tone(r.met, r.of, r.logged) : ""} ${on ? "ring-2 ring-white/80" : ""} ${d.startsWith(view) ? "" : "opacity-40"} disabled:opacity-20`}>
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (period === "month") return (
    <div className="rounded-2xl bg-white/[.04] p-2">
      <div className="flex items-center text-xs mb-1">
        <button onClick={() => setY(String(+y - 1))} className="px-2" aria-label="Previous year">‹</button>
        <span className="flex-1 text-center">{y}</span>
        <button onClick={() => setY(String(+y + 1))} disabled={+y >= +today.slice(0, 4)} className="px-2 disabled:opacity-30" aria-label="Next year">›</button>
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs">
        {MONTHS.map((m, i) => {
          const d = `${y}-${String(i + 1).padStart(2, "0")}-01`;
          const r = d <= today ? report(data, "month", d, now, f, false) : null;
          return <button key={m} disabled={!r} onClick={() => onPick(d)} className={`h-9 rounded-lg ${r ? tone(r.met, r.of, r.logged) : ""} ${anchor.slice(0, 7) === d.slice(0, 7) ? "ring-2 ring-white/80" : ""} disabled:opacity-20`}>{m}</button>;
        })}
      </div>
    </div>
  );
  const years = Array.from({ length: +today.slice(0, 4) - +first.slice(0, 4) + 1 }, (_, i) => String(+first.slice(0, 4) + i));
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {years.map((yr) => {
        const r = report(data, "year", `${yr}-01-01`, now, f, false);
        return <button key={yr} onClick={() => onPick(`${yr}-01-01`)} className={`chip text-xs ${tone(r.met, r.of, r.logged)} ${anchor.startsWith(yr) ? "ring-2 ring-white/80" : ""}`}>{yr}</button>;
      })}
    </div>
  );
}
