"use client";

import { useMemo, useRef, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import Link from "next/link";
import { DayRecords } from "@/components/DayRecords";
import { dailyGoals } from "@/lib/goals";
import { toDay, today, useApp, type Log } from "@/lib/store";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
const monday = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

export default function CalendarPage() {
  const { data, profile } = useApp();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(today());
  const listRef = useRef<HTMLElement>(null);

  const byDay = useMemo(() => {
    const m: Record<string, Log[]> = {};
    for (const l of data.logs) (m[l.day] ??= []).push(l);
    return m;
  }, [data.logs]);
  const perfect = (day: string) => {
    const g = dailyGoals(byDay[day] ?? [], profile.settings);
    return g.every((x) => x.done);
  };
  const xpOn = (day: string) => (byDay[day] ?? []).reduce((s, l) => s + l.xp, 0);
  const maxXp = Math.max(50, ...Object.keys(byDay).map(xpOn));

  const step = (n: number) =>
    setCursor(view === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() + n, 1) : addDays(cursor, n * (view === "week" ? 7 : 1)));

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monday(first), i));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday(cursor), i));
  const shown = view === "day" ? toDay(cursor) : selected;
  const title =
    view === "month" ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : view === "week" ? `Week of ${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const pick = (d: Date) => {
    setSelected(toDay(d));
    if (view === "day") setCursor(d);
    // Bring the day's list into view below the calendar.
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  // Jump to any date typed or picked by hand.
  const jump = (v: string) => {
    if (!v) return;
    setSelected(v);
    setCursor(new Date(`${v}T12:00`));
  };

  return (
    <>
      <XpHeader title="Chronicle" icon="📜" subtitle="Every day of your legend, recorded" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(["month", "week", "day"] as const).map((v) => (
          <button key={v} onClick={() => { setView(v); if (v === "day") setCursor(new Date(selected)); }} className={`chip py-2 capitalize ${view === v ? "chip-on" : ""}`}>{v}</button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => step(-1)} className="btn-ghost">‹</button>
        <label className="relative font-bold cursor-pointer">{title} ▾
          <input type="month" aria-label="Jump to month" className="absolute inset-0 opacity-0 cursor-pointer"
            value={`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`}
            onChange={(e) => e.target.value && setCursor(new Date(`${e.target.value}-01T12:00`))} />
        </label>
        <button onClick={() => step(1)} className="btn-ghost">›</button>
      </div>
      <div className="card flex items-center gap-2 p-2 mb-3">
        <label htmlFor="cal-date" className="text-sm font-semibold">📅 Go to date</label>
        <input id="cal-date" type="date" value={shown} onChange={(e) => jump(e.target.value)}
          className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm" />
        {shown !== today() && <button onClick={() => jump(today())} className="chip chip-on">Today</button>}
      </div>

      {view === "month" && (
        <div className="card p-3 mb-4">
          <div className="grid grid-cols-7 text-center text-[10px] text-muted mb-1">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d) => {
              const k = toDay(d);
              const heat = xpOn(k) / maxXp;
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button key={k} onClick={() => pick(d)}
                  className={`relative aspect-square rounded-lg text-xs grid place-items-center ${inMonth ? "" : "opacity-30"} ${selected === k ? "ring-2 ring-[var(--accent)]" : ""} ${k === today() ? "font-black text-[var(--gold)]" : ""}`}
                  style={{ background: heat ? `color-mix(in srgb, var(--accent) ${Math.round(15 + heat * 60)}%, transparent)` : "rgba(255,255,255,.04)" }}>
                  {d.getDate()}
                  {perfect(k) && <span className="absolute top-0 right-0.5 text-[9px]">🎆</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="card p-3 mb-4 grid grid-cols-7 gap-1 items-end h-48">
          {weekDays.map((d) => {
            const k = toDay(d);
            return (
              <button key={k} onClick={() => pick(d)} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] text-muted">{xpOn(k) || ""}</span>
                <div className={`w-full rounded-t-md ${selected === k ? "ring-2 ring-[var(--gold)]" : ""}`}
                  style={{ height: `${(xpOn(k) / maxXp) * 100}%`, minHeight: 4, background: "linear-gradient(var(--accent2), var(--accent))" }} />
                <span className="text-[10px]">{WEEKDAYS[(d.getDay() + 6) % 7]}</span>
                <span className="text-xs font-bold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      )}

      <DayRecords ref={listRef} day={shown} />
      <Link href={`/?day=${shown}`} className="btn-primary mt-3 mb-4 block text-center">Open this day to add or edit</Link>
    </>
  );
}
