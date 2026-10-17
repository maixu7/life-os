"use client";

import { useMemo, useState } from "react";
import { describe } from "@/lib/describe";
import { deedPeriods, karma, KARMA_LINES, logKarma, pathFor, pathScore, PATHS } from "@/lib/karma";
import { toDay, useApp } from "@/lib/store";

const GOLD = "#ffe066", RED = "#ff3b6b";

// The hero's Angel vs Devil record: current path, where the habits are heading,
// and every good and bad deed by day, month and year.
export function Deeds() {
  const { data } = useApp();
  const k = useMemo(() => karma(data), [data]);
  const [by, setBy] = useState<"day" | "month" | "year">("day");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const periods = useMemo(() => deedPeriods(k.days, by), [k.days, by]);
  const shown = more ? periods : periods.slice(0, by === "day" ? 14 : 12);
  const max = Math.max(1, ...periods.map((p) => Math.max(p.good, p.bad)));
  const trend = k.weekScore - k.score;

  // Last 14 days as a chart: good grows up, bad grows down.
  const chart = useMemo(() => {
    const out: { day: string; good: number; bad: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = toDay(new Date(Date.now() - i * 86_400_000));
      const r = k.days.get(day);
      out.push({ day, good: r?.good ?? 0, bad: r?.bad ?? 0 });
    }
    return out;
  }, [k.days]);
  const cmax = Math.max(5, ...chart.map((c) => Math.max(c.good, c.bad)));

  return (
    <section className="card frame p-4 mb-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${k.color}66, transparent 60%)` }} />
      <div className="relative">
        <h2 className="section-title mb-3">😇 Angel vs Devil 😈</h2>
        <div className="text-center">
          <div className="text-6xl animate-float">{k.icon}</div>
          <div className="mt-1 font-game text-lg font-black" style={{ color: k.color }}>{k.name}</div>
          <div className="text-xs text-muted">Your path from the last 30 days · score {k.score > 0 ? "+" : ""}{k.score}</div>
        </div>

        <div className="mt-3 relative h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${RED}, #b06cff 35%, #c0b6ff 50%, #7cf2ff 65%, ${GOLD})` }}>
          <span className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all duration-700"
            style={{ left: `${(k.score + 100) / 2}%`, background: k.color, boxShadow: `0 0 12px ${k.color}` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          {[...PATHS].reverse().map((p) => <span key={p.name} title={p.name} style={{ opacity: p.name === k.name ? 1 : 0.45 }}>{p.icon}</span>)}
        </div>

        <div className="mt-3 rounded-xl bg-white/5 p-3 flex gap-3">
          <span className="text-3xl">🥷</span>
          <div className="text-sm">
            <p>{KARMA_LINES[k.name]}</p>
            <p className="mt-1 text-xs" style={{ color: k.becoming.color }}>
              {trend > 3 ? "▲ Rising" : trend < -3 ? "▼ Falling" : "● Steady"}: at this week&apos;s pace you are becoming <b>{k.becoming.icon} {k.becoming.name}</b>.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {([["angel", "😇 Angel", GOLD, k.angel, k.total.good, k.month.good], ["devil", "😈 Devil", RED, k.devil, k.total.bad, k.month.bad]] as const).map(([id, label, color, lv, total, month]) => (
            <div key={id} className="rounded-xl p-3" style={{ background: `${color}14`, border: `1px solid ${color}55` }}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold" style={{ color }}>{label}</span>
                <span className="font-game text-sm">Lv {lv.level}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${lv.pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} /></div>
              <div className="mt-1.5 text-[11px] text-muted">{total} points ever · {month} in 30 days</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-muted">Last 14 days</div>
        <svg viewBox="0 0 280 90" className="w-full h-24">
          <line x1="0" x2="280" y1="45" y2="45" stroke="rgba(255,255,255,.15)" />
          {chart.map((c, i) => {
            const x = i * 20 + 4, gh = (c.good / cmax) * 40, bh = (c.bad / cmax) * 40;
            return (
              <g key={c.day}>
                <rect x={x} y={45 - gh} width="12" height={gh} rx="2" fill={GOLD} />
                <rect x={x} y={45} width="12" height={bh} rx="2" fill={RED} />
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex gap-2">
          {(["day", "month", "year"] as const).map((x) => (
            <button key={x} onClick={() => { setBy(x); setMore(false); setOpenDay(null); }} className={`chip flex-1 justify-center ${by === x ? "chip-on" : ""}`}>
              {x === "day" ? "Daily" : x === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>

        {periods.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No deeds yet. Your story starts with the first one.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {shown.map((p) => {
              const path = pathFor(pathScore(p.good, p.bad));
              const day = by === "day" ? k.days.get(p.key) : undefined;
              return (
                <li key={p.key}>
                  <button onClick={() => by === "day" && setOpenDay(openDay === p.key ? null : p.key)} className="w-full text-left rounded-xl bg-white/5 p-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-xs" style={{ color: path.color }}>{path.icon} {path.name}</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 items-center">
                      <div className="flex justify-end"><div className="h-2 rounded-l-full" style={{ width: `${(p.bad / max) * 100}%`, background: RED }} /></div>
                      <div className="h-2 rounded-r-full" style={{ width: `${(p.good / max) * 100}%`, background: GOLD }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px]">
                      <span style={{ color: "#ff6b9b" }}>😈 −{p.bad}</span>
                      <span className="text-muted">net {p.good - p.bad >= 0 ? "+" : ""}{p.good - p.bad}</span>
                      <span style={{ color: GOLD }}>😇 +{p.good}</span>
                    </div>
                  </button>
                  {day && openDay === p.key && (
                    <ul className="mt-1 ml-2 border-l border-white/10 pl-3 space-y-1">
                      {day.logs.map((l) => {
                        const pts = logKarma(l);
                        const d = describe(l);
                        return (
                          <li key={l.id} className="flex items-center gap-2 text-xs">
                            <span>{d.emoji}</span>
                            <span className="flex-1 truncate">{d.title}</span>
                            <span className="font-bold" style={{ color: pts > 0 ? GOLD : "#ff6b9b" }}>{pts > 0 ? `+${pts}` : pts}</span>
                          </li>
                        );
                      })}
                      {day.missed > 0 && (
                        <li className="flex items-center gap-2 text-xs"><span>💤</span><span className="flex-1">Missed {day.missed} mission{day.missed > 1 ? "s" : ""}</span><span className="font-bold text-[#ff6b9b]">−{day.missed}</span></li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {periods.length > shown.length && <button onClick={() => setMore(true)} className="btn-ghost w-full mt-2 text-sm">Show all {periods.length}</button>}

        <p className="mt-3 text-[11px] text-muted">
          😇 Books, study, documentaries, focus, training, good sleep, early waking and missions. 😈 Manga, anime, movies, series, reels, games, sleeping after 1 am and missed missions. Treats bought with gold in the Reward shop do not count. Your path follows the last 30 days, so it changes as your habits change.
        </p>
      </div>
    </section>
  );
}
