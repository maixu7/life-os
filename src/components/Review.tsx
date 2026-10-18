"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "@/components/Sheet";
import {
  allFacts, levelPreview, METRICS, mondayOf, moodLinks, series, shift, weeklyReview, whyDay, YEAR_CATS, yearValues,
  type Link as HabitLink, type Week, type YearCat,
} from "@/lib/review";
import { today, useApp } from "@/lib/store";

const fmtDay = (day: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(`${day}T12:00`).toLocaleDateString(undefined, o);
const r1 = (v: number | null | undefined) => (v == null ? "–" : Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1));

// ---------- 30-day chart for any card ----------
export function StatsButton({ metric, title, className = "" }: { metric: string; title?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button aria-label="30-day chart" title="30-day chart" onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`h-6 w-6 rounded-full border border-white/15 bg-[var(--panel)] text-[11px] grid place-items-center ${className}`}>📊</button>
      {open && <StatsSheet metric={metric} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

export function StatsSheet({ metric, title, onClose }: { metric: string; title?: string; onClose: () => void }) {
  const { data } = useApp();
  const m = METRICS[metric];
  const pts = useMemo(() => series(data, metric, 30), [data, metric]);
  const vals = pts.map((p) => p.v).filter((v): v is number => v != null && v > 0);
  const max = Math.max(1, ...vals);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const last7 = pts.slice(-7).map((p) => p.v ?? 0), prev7 = pts.slice(-14, -7).map((p) => p.v ?? 0);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const trend = sum(last7) - sum(prev7);
  const W = 300, H = 120, bw = W / pts.length;
  return (
    <Sheet title={`📊 ${title ?? `${m?.icon ?? ""} ${m?.label ?? "Count"}`} · 30 days`} onClose={onClose}>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full">
        <line x1="0" x2={W} y1={H - (avg / max) * H} y2={H - (avg / max) * H} stroke="var(--muted)" strokeDasharray="3 3" strokeWidth="1" />
        {pts.map((p, i) => {
          const h = p.v ? Math.max(2, (p.v / max) * H) : 0;
          return <rect key={p.day} x={i * bw + 1} y={H - h} width={bw - 2} height={h} rx="2" fill={p.day === today() ? "var(--accent)" : "var(--accent2)"} opacity={p.v ? 0.9 : 0}><title>{`${fmtDay(p.day)}: ${r1(p.v)} ${m?.unit ?? ""}`}</title></rect>;
        })}
        {pts.map((p, i) => (i % 7 === 0 ? <text key={p.day} x={i * bw} y={H + 12} fontSize="8" fill="var(--muted)">{fmtDay(p.day)}</text> : null))}
      </svg>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="text-[10px] text-muted">Average</div><div className="font-bold">{r1(Math.round(avg * 10) / 10)}</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="text-[10px] text-muted">Best</div><div className="font-bold">{r1(vals.length ? max : 0)}</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="text-[10px] text-muted">Last 7 vs before</div><div className={`font-bold ${trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : ""}`}>{trend > 0 ? "▲" : trend < 0 ? "▼" : "="} {r1(Math.abs(Math.round(trend * 10) / 10))}</div></div>
      </div>
      <p className="text-xs text-muted">{m?.unit ? `In ${m.unit}. ` : ""}Days with nothing logged show no bar. The dashed line is your average.</p>
    </Sheet>
  );
}

// ---------- Sunday weekly review (and printable report) ----------
const ROWS: { k: keyof Week; label: string; unit?: string; lower?: boolean }[] = [
  { k: "kcal", label: "🍱 Calories / day", unit: " kcal" }, { k: "protein", label: "🥩 Protein / day", unit: " g" },
  { k: "study", label: "📖 Study", unit: " min" }, { k: "sleep", label: "😴 Sleep / night", unit: " h" },
  { k: "workoutDays", label: "🏋️ Workout days" }, { k: "sets", label: "💪 Sets" },
  { k: "good", label: "😇 Angel points" }, { k: "bad", label: "😈 Devil points", lower: true },
  { k: "junk", label: "🍟 Junk foods", lower: true }, { k: "xp", label: "⭐ XP" }, { k: "mood", label: "😊 Mood (1–5)" },
];

function WeekTable({ w, p }: { w: Week; p: Week }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-[11px] text-muted"><th className="text-left font-normal">This week vs last</th><th className="text-right font-normal">This</th><th className="text-right font-normal">Last</th><th /></tr></thead>
      <tbody>
        {ROWS.map(({ k, label, unit = "", lower }) => {
          const a = w[k] as number | null, b = p[k] as number | null;
          const diff = a != null && b != null ? a - b : 0;
          const good = lower ? diff < 0 : diff > 0;
          return (
            <tr key={k} className="border-t border-white/5">
              <td className="py-1.5">{label}</td>
              <td className="text-right font-bold">{a == null ? "–" : `${r1(Math.round(a * 10) / 10)}${unit}`}</td>
              <td className="text-right text-muted">{b == null ? "–" : r1(Math.round(b * 10) / 10)}</td>
              <td className={`w-6 text-right text-xs ${!diff ? "text-muted" : good ? "text-emerald-400" : "text-rose-400"}`}>{!diff ? "=" : diff > 0 ? "▲" : "▼"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function WeeklyReviewSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  // On Sunday the current week is the one to review; Monday to Saturday shows last week.
  const [mon, setMon] = useState(() => (new Date().getDay() === 0 ? mondayOf(today()) : shift(mondayOf(today()), -7)));
  const f = useMemo(() => allFacts(data), [data]);
  const r = useMemo(() => weeklyReview(data, mon, f), [data, mon, f]);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => { window.print(); setPrinting(false); }, 200);
    return () => clearTimeout(t);
  }, [printing]);
  const label = `${fmtDay(r.week.from)} – ${fmtDay(r.week.to, { day: "numeric", month: "short", year: "numeric" })}`;
  const fixes = r.fixes.length ? r.fixes : [{ icon: "🌟", title: "Nothing big to fix", why: "A strong week. Keep the same rhythm.", weight: 0 }];
  return (
    <Sheet title="📅 Weekly review" onClose={onClose}>
      <div className="flex items-center justify-between">
        <button className="btn-ghost !px-3" onClick={() => setMon(shift(mon, -7))}>‹</button>
        <span className="font-semibold text-sm">{label}</span>
        <button className="btn-ghost !px-3" disabled={mon >= mondayOf(today())} onClick={() => setMon(shift(mon, 7))}>›</button>
      </div>
      <WeekTable w={r.week} p={r.prev} />
      <div>
        <div className="section-title mb-2">🛠 3 things to fix next week</div>
        <ol className="space-y-2">
          {fixes.map((x, i) => (
            <li key={x.title} className="rounded-xl bg-white/5 p-2.5 text-sm">
              <div className="font-semibold">{i + 1}. {x.icon} {x.title}</div>
              <div className="text-xs text-muted">{x.why}</div>
            </li>
          ))}
        </ol>
      </div>
      <button onClick={() => setPrinting(true)} className="btn-ghost w-full">🖨️ Print or save as PDF</button>
      <p className="text-[11px] text-muted">On iPhone: Print, then pinch out on the preview and Share › Save to Files for a PDF.</p>
      {printing && createPortal(
        <div className="print-only">
          <h1>Life OS weekly report · {profile.display_name}</h1>
          <p>{label}</p>
          <WeekTable w={r.week} p={r.prev} />
          <h2>3 things to fix next week</h2>
          <ol>{fixes.map((x) => <li key={x.title}><b>{x.title}</b>: {x.why}</li>)}</ol>
          <p>Printed {new Date().toLocaleString()}</p>
        </div>, document.body)}
    </Sheet>
  );
}

// ---------- Why was today bad? ----------
function Links({ links, unit, digits = 0 }: { links: HabitLink[]; unit: string; digits?: number }) {
  if (!links.length) return <p className="text-xs text-muted">Not enough days yet. Keep logging and links appear here.</p>;
  return (
    <ul className="space-y-1.5">
      {links.slice(0, 5).map((l) => (
        <li key={l.label} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
          <div>{l.icon} <b>{l.label}</b>: {l.diff >= 0 ? "better" : "worse"} by <b>{Math.abs(l.diff).toFixed(digits)}{unit}</b></div>
          <div className="text-[11px] text-muted">{l.good}: {l.a.toFixed(digits)} ({l.na} days) · {l.bad}: {l.b.toFixed(digits)} ({l.nb} days)</div>
        </li>
      ))}
    </ul>
  );
}

export function WhyDaySheet({ onClose, day0 }: { onClose: () => void; day0?: string }) {
  const { data } = useApp();
  const [day, setDay] = useState(day0 ?? today());
  const f = useMemo(() => allFacts(data), [data]);
  const w = useMemo(() => whyDay(data, day, f), [data, day, f]);
  const color = w.score >= 70 ? "#3ee08f" : w.score >= 50 ? "#ffd166" : "#ff4d6d";
  return (
    <Sheet title="🤔 Why was this day bad?" onClose={onClose}>
      <div className="flex items-center justify-between">
        <button className="btn-ghost !px-3" onClick={() => setDay(shift(day, -1))}>‹</button>
        <span className="font-semibold text-sm">{day === today() ? "Today" : fmtDay(day, { weekday: "short", day: "numeric", month: "short" })}</span>
        <button className="btn-ghost !px-3" disabled={day >= today()} onClick={() => setDay(shift(day, 1))}>›</button>
      </div>
      <div className="text-center">
        <div className="font-game text-5xl font-black" style={{ color }}>{w.score}</div>
        <div className="text-xs text-muted">Day score out of 100{w.avg != null ? ` · your 2-week average ${Math.round(w.avg)}` : ""}</div>
      </div>
      <div>
        <div className="section-title mb-2">⬇ What pulled it down</div>
        {w.reasons.length === 0 ? <p className="text-sm">Nothing! A clean day. 🌟</p> : (
          <ul className="space-y-1.5">
            {w.reasons.slice(0, 6).map((x) => (
              <li key={x.text} className="flex gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span className="text-lg">{x.icon}</span>
                <span className="flex-1"><b>{x.text}</b><span className="block text-xs text-muted">{x.tip}</span></span>
                <span className="text-rose-400 font-bold">-{x.lost}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {w.good.length > 0 && <div className="text-sm">⬆ Went well: {w.good.join(" · ")}</div>}
      <div>
        <div className="section-title mb-2">🔗 How these habits change your days</div>
        <Links links={w.links} unit=" pts" />
      </div>
    </Sheet>
  );
}

// ---------- Mood & energy: 3 taps, and what moves them ----------
export function MoodSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const links = useMemo(() => moodLinks(data), [data]);
  const save = () => {
    const a = mood ? logActivity("mood", { mood: String(mood) }) : null;
    const b = energy ? logActivity("energy", { level: energy }) : null;
    celebrate({ title: "✓ CHECKED IN", subtitle: "Mood and energy saved", xp: (a?.xp ?? 0) + (b?.xp ?? 0), kind: "small" });
    setMood(0); setEnergy(0);
  };
  const faces = ["😢", "😕", "😐", "🙂", "😄"];
  return (
    <Sheet title="😊 Mood & energy" onClose={onClose}>
      <div className="text-xs text-muted">Mood</div>
      <div className="grid grid-cols-5 gap-2">{faces.map((e, i) => <button key={e} onClick={() => setMood(i + 1)} className={`chip text-2xl py-2 justify-center ${mood === i + 1 ? "chip-on" : ""}`}>{e}</button>)}</div>
      <div className="text-xs text-muted">Energy</div>
      <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setEnergy(n)} className={`chip py-2 justify-center ${energy === n ? "chip-on" : ""}`}>{"⚡".repeat(n > 3 ? 3 : n)}{n}</button>)}</div>
      <button disabled={!mood && !energy} onClick={save} className="btn-primary w-full">Save</button>
      <div className="section-title">🔗 What lifts your mood</div>
      <Links links={links.mood} unit="" digits={1} />
      <div className="section-title">⚡ What lifts your energy</div>
      <Links links={links.energy} unit="" digits={1} />
      <p className="text-[11px] text-muted">From {links.days} days with a check-in. Sleep counts for the morning you wake up.</p>
    </Sheet>
  );
}

// ---------- Year heatmap ----------
export function YearSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [cat, setCat] = useState<YearCat>("study");
  const [year, setYear] = useState(new Date().getFullYear());
  const f = useMemo(() => allFacts(data), [data]);
  const vals = useMemo(() => yearValues(f, year, cat), [f, year, cat]);
  const max = Math.max(1, ...vals.map((v) => v.v));
  const lead = (new Date(`${year}-01-01T12:00`).getDay() + 6) % 7; // Monday-first rows
  const cells = [...Array(lead).fill(null), ...vals] as ({ day: string; v: number } | null)[];
  const c = YEAR_CATS.find((x) => x.id === cat)!;
  const active = vals.filter((v) => v.v > 0).length, devil = vals.filter((v) => v.v < 0).length;
  const total = vals.reduce((n, v) => n + Math.max(0, v.v), 0);
  const bg = (v: number) => (cat === "angel" ? (v > 0 ? "rgba(255,209,102,.9)" : v < 0 ? "rgba(255,59,107,.75)" : "rgba(255,255,255,.06)")
    : v > 0 ? `rgba(70,230,255,${0.2 + (v / max) * 0.8})` : "rgba(255,255,255,.06)");
  return (
    <Sheet title="🗓️ Year heatmap" onClose={onClose}>
      <div className="grid grid-cols-4 gap-1.5">{YEAR_CATS.map((x) => <button key={x.id} onClick={() => setCat(x.id)} className={`chip !px-1 justify-center text-xs ${cat === x.id ? "chip-on" : ""}`}>{x.icon} {x.label}</button>)}</div>
      <div className="flex items-center justify-between">
        <button className="btn-ghost !px-3" onClick={() => setYear(year - 1)}>‹</button>
        <span className="font-game font-bold">{year}</span>
        <button className="btn-ghost !px-3" disabled={year >= new Date().getFullYear()} onClick={() => setYear(year + 1)}>›</button>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-[2px] w-max">
          {cells.map((x, i) => x ? <span key={x.day} title={`${fmtDay(x.day)}: ${x.v}${c.unit ? ` ${c.unit}` : ""}`} className="h-[9px] w-[9px] rounded-[2px]" style={{ background: bg(x.v) }} />
            : <span key={`e${i}`} className="h-[9px] w-[9px]" />)}
        </div>
      </div>
      <p className="text-sm">{cat === "angel" ? `😇 ${active} Angel days · 😈 ${devil} Devil days` : `${active} active days · ${total.toLocaleString()} ${c.unit} in total`}</p>
      <p className="text-[11px] text-muted">Each square is one day, Monday at the top. Brighter means more.</p>
    </Sheet>
  );
}

// ---------- Level-up preview (Hero page) ----------
export function LevelUpCard() {
  const { data } = useApp();
  const lp = useMemo(() => levelPreview(data), [data]);
  return (
    <section className="card p-4 mb-4 space-y-2">
      <h2 className="section-title">📈 Level-up preview</h2>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="text-[10px] text-muted">To level {lp.p.level + 1}</div><div className="font-game text-xl font-black text-[var(--accent2)]">{lp.toLevel} XP</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="text-[10px] text-muted">{lp.p.next ? `To rank ${lp.p.next.name}` : "Top rank"}</div><div className="font-game text-xl font-black gold-text">{lp.toRank != null ? `${lp.toRank.toLocaleString()} XP` : "👑"}</div></div>
      </div>
      {lp.daysToRank != null && <p className="text-xs text-muted">At your pace ({lp.pace} XP a day for 2 weeks) the next rank comes in about <b>{lp.daysToRank} days</b>.</p>}
      {lp.missions.length > 0 && <div className="text-xs text-muted">Fastest today: missions still open</div>}
      <ul className="space-y-1">
        {lp.missions.slice(0, 3).map((w) => (
          <li key={w.what} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm">
            <span>{w.icon}</span><span className="flex-1 min-w-0 truncate">{w.what}</span><span className="text-[var(--accent2)] font-bold">+{w.xp}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted">Or any time</div>
      <div className="grid grid-cols-2 gap-1.5">
        {lp.basics.map((w) => {
          const body = <><span>{w.icon} {w.what}</span><span className="block text-[10px] text-muted">+{w.xp} XP · {w.times}× = next level</span></>;
          return w.href ? <Link key={w.what} href={w.href} className="rounded-lg bg-white/5 px-2 py-1.5 text-xs">{body}</Link> : <div key={w.what} className="rounded-lg bg-white/5 px-2 py-1.5 text-xs">{body}</div>;
        })}
      </div>
    </section>
  );
}

// ---------- Day score chip (Base Camp) ----------
export function DayScoreChip({ day }: { day: string }) {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const f = useMemo(() => allFacts(data), [data]);
  const w = useMemo(() => whyDay(data, day, f, false), [data, day, f]);
  if (!w.facts?.records) return null;
  const color = w.score >= 70 ? "#3ee08f" : w.score >= 50 ? "#ffd166" : "#ff4d6d";
  return (
    <>
      <button onClick={() => setOpen(true)} className="card w-full mb-4 px-3 py-2 flex items-center gap-3 text-left text-sm">
        <span className="font-game text-2xl font-black" style={{ color }}>{w.score}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold">Day score{w.avg != null ? ` · avg ${Math.round(w.avg)}` : ""}</span>
          <span className="block text-xs text-muted truncate">{w.reasons[0] ? `Biggest drag: ${w.reasons[0].icon} ${w.reasons[0].text}` : "Nothing pulling it down"}</span>
        </span>
        <span className="chip shrink-0">🤔 Why?</span>
      </button>
      {open && <WhyDaySheet day0={day} onClose={() => setOpen(false)} />}
    </>
  );
}
