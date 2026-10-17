"use client";

import { useMemo, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import Link from "next/link";
import { describe } from "@/lib/describe";
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
  const dayLogs = byDay[view === "day" ? toDay(cursor) : selected] ?? [];
  const title =
    view === "month" ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : view === "week" ? `Week of ${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const pick = (d: Date) => {
    setSelected(toDay(d));
    if (view === "day") setCursor(d);
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

      <section>
        <h3 className="font-bold mb-2">
          {view === "day" ? "Timeline" : new Date(selected + "T12:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        {dayLogs.length === 0 && <p className="text-sm text-muted">Nothing logged.</p>}
        <ol className="card divide-y divide-white/5">
          {[...dayLogs].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((l) => {
            const d = describe(l, profile.settings.currency);
            return (
              <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-11 text-xs tabular-nums text-muted">{new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-lg">{d.emoji}</span>
                <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{d.title}</span>
                  {d.detail && <span className="block text-xs text-muted truncate">{d.detail}</span>}</span>
                <span className="text-xs text-[var(--accent2)]">+{l.xp}</span>
              </li>
            );
          })}
        </ol>
        <Link href={`/?day=${view === "day" ? toDay(cursor) : selected}`} className="btn-primary mt-3 block text-center">Open this day to add or edit</Link>
      </section>
    </>
  );
}
