"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import {
  MEASURES, METRICS, measureSeries, moveFor, muscleWeek, nextSession, records, REGIONS, SHIELD_EVERY, SHIELD_MAX, shieldItem, trend, workoutStreak,
  type Metric, type Next, type Pt, type Region,
} from "@/lib/fitness";
import { today, useApp, useCustomItems } from "@/lib/store";
import { deletePhoto, getPhoto, putPhoto } from "@/lib/vault";

const fmtDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString([], { day: "numeric", month: "short" });

// ---------- A small line chart (one series, tap or drag to read a point) ----------
export function LineChart({ pts, unit, h = 90 }: { pts: Pt[]; unit: string; h?: number }) {
  const [sel, setSel] = useState<number | null>(null);
  if (pts.length < 2) return <p className="text-xs text-muted py-3">{pts.length ? `One record so far: ${pts[0].v} ${unit}. Add another to see a line.` : "No records in this range yet."}</p>;
  const W = 300, pad = 6;
  const vs = pts.map((p) => p.v), min = Math.min(...vs), max = Math.max(...vs), span = Math.max(0.1, max - min);
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const avg = vs.reduce((a, b) => a + b, 0) / vs.length;
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSel(Math.max(0, Math.min(pts.length - 1, Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1)))));
  };
  const s = sel != null ? pts[sel] : null;
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted h-4">
        {s ? <span className="text-[var(--text,#fff)]"><b>{s.v} {unit}</b> · {fmtDay(s.day)}</span> : <span>Avg {+avg.toFixed(1)} {unit}</span>}
        <span>{min} to {max} {unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full touch-none" style={{ height: h }} onPointerDown={pick} onPointerMove={(e) => e.buttons && pick(e)} role="img" aria-label={`Line chart, ${pts.length} points from ${min} to ${max} ${unit}`}>
        <line x1={pad} x2={W - pad} y1={y(avg)} y2={y(avg)} stroke="rgba(255,255,255,.18)" strokeDasharray="3 4" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--accent2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.length <= 40 && pts.map((p, i) => <circle key={p.day} cx={x(i)} cy={y(p.v)} r="2.5" fill="var(--accent2)" />)}
        {s && <><line x1={x(sel!)} x2={x(sel!)} y1={0} y2={h} stroke="rgba(255,255,255,.35)" strokeWidth="1" /><circle cx={x(sel!)} cy={y(s.v)} r="4.5" fill="var(--accent2)" stroke="#140c24" strokeWidth="2" /></>}
      </svg>
      <div className="flex justify-between text-[10px] text-muted"><span>{fmtDay(pts[0].day)}</span><span>{fmtDay(pts.at(-1)!.day)}</span></div>
    </div>
  );
}

const change = (pts: Pt[]) => (pts.length > 1 ? +(pts.at(-1)!.v - pts[0].v).toFixed(1) : null);

// ---------- 11. Trends ----------
export function TrendsSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [m, setM] = useState<Metric>("weight");
  const [days, setDays] = useState(30);
  const pts = useMemo(() => trend(data, m, days), [data, m, days]);
  const unit = METRICS.find((x) => x[0] === m)![2];
  const ch = change(pts);
  const avg = pts.length ? Math.round((pts.reduce((n, p) => n + p.v, 0) / pts.length) * 10) / 10 : 0;
  return (
    <Sheet title="📈 Trends" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">{METRICS.map(([k, l]) => <button key={k} onClick={() => setM(k)} className={`chip text-xs ${m === k ? "chip-on" : ""}`}>{l}</button>)}</div>
      <div className="flex gap-1.5">{[30, 90, 365].map((n) => <button key={n} onClick={() => setDays(n)} className={`chip text-xs ${days === n ? "chip-on" : ""}`}>{n === 365 ? "1 year" : `${n} days`}</button>)}</div>
      <div className="card p-3"><LineChart pts={pts} unit={unit} h={120} /></div>
      {pts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{pts.at(-1)!.v}</div><div className="text-[10px] text-muted">LATEST</div></div>
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{avg}</div><div className="text-[10px] text-muted">AVERAGE</div></div>
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{ch == null ? "-" : `${ch > 0 ? "+" : ""}${ch}`}</div><div className="text-[10px] text-muted">CHANGE</div></div>
        </div>
      )}
      <p className="text-[11px] text-muted">{days === 365 ? "A year is shown as weekly averages. " : ""}Only days with a record count. The dashed line is your average.</p>
    </Sheet>
  );
}

// ---------- 10. Records board ----------
export function RecordsBoard() {
  const { data } = useApp();
  const list = useMemo(() => records(data), [data]);
  if (!list.length) return <p className="text-sm text-muted">No records yet. Log a workout, a wake-up or a study session and your first records appear here.</p>;
  return (
    <div className="space-y-3">
      {(["Strength", "Streaks", "Days"] as const).map((g) => {
        const rows = list.filter((r) => r.group === g);
        return rows.length > 0 && (
          <div key={g}>
            <div className="text-[10px] font-game tracking-widest text-[var(--gold)] mb-1">{g.toUpperCase()}</div>
            <ul className="space-y-1">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-xl bg-white/[.04] px-2.5 py-1.5 text-sm">
                  <span>{r.icon}</span><span className="flex-1 min-w-0 truncate">{r.label}</span>
                  <span className="font-semibold text-right">{r.value}{r.when && <span className="block text-[10px] text-muted font-normal">{fmtDay(r.when)}</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
export function RecordsSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="🏆 Personal records" onClose={onClose}><p className="text-xs text-muted">Your best ever. Beat any of them and a new record goes up.</p><RecordsBoard /></Sheet>;
}

// ---------- 14. Measurements ----------
export function MeasureCharts() {
  const { data } = useApp();
  const have = MEASURES.filter(([k]) => data.logs.some((l) => l.kind === "body" && Number(l.data[k]) > 0));
  const [k, setK] = useState<string>("");
  const key = have.find(([x]) => x === k)?.[0] ?? have[0]?.[0];
  const pts = useMemo(() => (key ? measureSeries(data.logs, key) : []), [data.logs, key]);
  if (!have.length) return <p className="mt-3 text-xs text-muted">Tip: add waist, chest, arms or thigh in a body check to see how your shape changes (muscle shows here before the scale moves).</p>;
  const ch = change(pts);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-muted mb-1"><span>📏 Measurements</span>{ch != null && <span>{ch > 0 ? "+" : ""}{ch} cm since first</span>}</div>
      <div className="flex flex-wrap gap-1 mb-1">{have.map(([x, l]) => <button key={x} onClick={() => setK(x)} className={`chip !px-2 !py-0.5 text-[11px] ${key === x ? "chip-on" : ""}`}>{l} {measureSeries(data.logs, x).at(-1)?.v}</button>)}</div>
      <LineChart pts={pts} unit="cm" h={70} />
    </div>
  );
}

// ---------- 13. Body photo timeline (encrypted like every other photo) ----------
function Thumb({ photoId, className = "" }: { photoId: string; className?: string }) {
  const { session } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null, live = true;
    getPhoto(session, photoId).then((b) => { if (b && live) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [session, photoId]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="Body photo" className={`object-cover ${className}`} /> : <div className={`grid place-items-center bg-white/5 text-muted text-xs ${className}`}>🔒</div>;
}

export function BodyPhotos() {
  const { session, data } = useApp();
  const { items, add, remove } = useCustomItems("body_photo");
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const sorted = [...items].sort((a, b) => String(a.config.day).localeCompare(String(b.config.day)));
  const pair = pick.length === 2 ? pick.map((id) => sorted.find((i) => i.id === id)!).filter(Boolean) : sorted.length >= 2 ? [sorted[0], sorted.at(-1)!] : [];
  const lastW = Number([...data.logs].reverse().find((l) => l.kind === "body" && l.data.weight)?.data.weight) || undefined;
  const upload = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const photo_id = `body-${crypto.randomUUID()}`;
      await putPhoto(session, photo_id, f);
      add(`Body ${today()}`, { photo_id, day: today(), weight: lastW, note: note.trim() || undefined });
      setNote("");
    } finally { setBusy(false); if (file.current) file.current.value = ""; }
  };
  const toggle = (id: string) => setPick(pick.includes(id) ? pick.filter((x) => x !== id) : [...pick.slice(-1), id]);
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">📸 Body photos</h2>
        <button disabled={busy} onClick={() => file.current?.click()} className="chip chip-on">{busy ? "Saving…" : "+ Photo"}</button>
      </div>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <p className="text-[11px] text-muted mb-2">🔒 Locked with your password, like all your photos. Same light, same pose, once every 2 to 4 weeks shows the real change.</p>
      <input className="input mb-2 !py-1.5 text-sm" placeholder="Note for the next photo (optional, e.g. after 4 weeks of push-ups)" value={note} onChange={(e) => setNote(e.target.value)} />
      {pair.length === 2 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {pair.map((p, i) => (
            <div key={p.id} className="text-center">
              <Thumb photoId={String(p.config.photo_id)} className="w-full aspect-[3/4] rounded-xl" />
              <div className="text-[11px] mt-1"><b>{i ? "After" : "Before"}</b> · {fmtDay(String(p.config.day))}{p.config.weight ? ` · ${p.config.weight} kg` : ""}</div>
            </div>
          ))}
        </div>
      )}
      {sorted.length > 0 ? (
        <>
          <div className="text-[11px] text-muted mb-1">{sorted.length > 2 ? "Tap two photos to compare them." : "Timeline"}</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((p) => (
              <div key={p.id} className="shrink-0 w-20 text-center">
                <button onClick={() => toggle(p.id)} className={`block rounded-lg overflow-hidden ring-2 ${pick.includes(p.id) ? "ring-[var(--accent2)]" : "ring-transparent"}`}>
                  <Thumb photoId={String(p.config.photo_id)} className="w-20 h-28" />
                </button>
                <div className="text-[10px] text-muted mt-0.5">{fmtDay(String(p.config.day))}</div>
                {!!p.config.note && <div className="text-[10px] truncate">{String(p.config.note)}</div>}
                <button className="text-[10px] text-rose-300" onClick={() => { if (confirm("Delete this photo?")) { deletePhoto(session, String(p.config.photo_id)).catch(() => {}); remove(p.id); setPick(pick.filter((x) => x !== p.id)); } }}>Delete</button>
              </div>
            ))}
          </div>
        </>
      ) : <p className="text-sm text-muted">No photos yet. Take your first one today: future you will thank you.</p>}
    </section>
  );
}

// ---------- 32. Progressive overload coach ----------
const TAG: Record<Next["tag"], string> = { first: "🆕", reps: "➕ More reps", weight: "⬆️ Add weight", hold: "🎯 Same weight", deload: "↘️ Step back", harder: "🔥 Harder type" };
export function OverloadHint({ exercise, type, variant, onUse }: { exercise: string; type: string; variant?: string; onUse: (n: Next) => void }) {
  const { data } = useApp();
  const n = useMemo(() => nextSession(data.logs.filter((l) => l.day < today()), exercise, type, variant), [data.logs, exercise, type, variant]);
  if (!n) return <p className="text-[11px] text-muted">🧠 Coach: log this move once and next time I&apos;ll tell you exactly what to lift.</p>;
  return (
    <div className="rounded-xl border border-[var(--accent2)]/40 bg-[var(--accent2)]/10 p-2.5 text-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">🧠 COACH · {TAG[n.tag].toUpperCase()}</div>
          <div className="font-semibold">Today: {n.sets} × {n.reps}{type === "time" ? " s" : ""}{n.weight ? ` @ ${n.weight} kg` : ""}</div>
        </div>
        <button onClick={() => onUse(n)} className="chip chip-on text-xs">Use</button>
      </div>
      <div className="text-xs text-muted mt-1">{n.why}</div>
    </div>
  );
}

// ---------- 36. Workout streak with shields ----------
export function WorkoutStreakCard() {
  const { data, update, celebrate } = useApp();
  const s = useMemo(() => workoutStreak(data), [data]);
  const use = (day: string, why: string) => {
    update((d) => (d.items.some((i) => i.id === `shield-${day}`) ? d : { ...d, items: [...d.items, shieldItem(day)] }));
    celebrate({ title: "🛡️ SHIELD UP", subtitle: why, kind: "small" });
  };
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="text-4xl">{s.n ? "🔥" : "🪵"}</div>
        <div className="flex-1">
          <div className="font-game text-2xl">{s.n} day{s.n === 1 ? "" : "s"}</div>
          <div className="text-xs text-muted">Workout streak · best {s.best}</div>
        </div>
        <div className="text-right">
          <div className="text-xl tracking-wider">{"🛡️".repeat(s.held) || "·"}</div>
          <div className="text-[10px] text-muted">{s.held}/{SHIELD_MAX} shields</div>
        </div>
      </div>
      {s.atRisk && s.held > 0 && (
        <div className="mt-3 rounded-xl bg-amber-400/15 border border-amber-300/40 p-2.5 text-sm flex items-center gap-2">
          <span className="flex-1">⚠️ No workout yesterday. Use a shield to keep your streak?</span>
          <button onClick={() => use(s.yest, "Yesterday is covered. Your streak lives on!")} className="chip chip-on text-xs">Use 🛡️</button>
        </div>
      )}
      {s.atRisk && s.held === 0 && <p className="mt-2 text-xs text-amber-300">No workout yesterday and no shield left. Train today to start a new streak!</p>}
      {!s.atRisk && !s.trainedToday && !s.shieldedToday && s.held > 0 && s.n > 0 && (
        <button onClick={() => use(s.today, "Rest day planned. Your streak is safe today.")} className="btn-ghost w-full mt-3 text-sm">😴 Rest day: use a shield for today</button>
      )}
      {s.shieldedToday && !s.trainedToday && <p className="mt-2 text-xs text-[var(--accent2)]">🛡️ Today is a shielded rest day.</p>}
      <p className="mt-2 text-[11px] text-muted">Every {SHIELD_EVERY} workout days earn a shield (hold up to {SHIELD_MAX}). {s.toNext} more workout day{s.toNext === 1 ? "" : "s"} to the next one.</p>
    </section>
  );
}

// ---------- 37. Weekly muscle map ----------
type Shape = { r: Region; el: "e" | "r"; a: number[] };
const FRONT: Shape[] = [
  { r: "shoulders", el: "e", a: [30, 44, 8, 6] }, { r: "shoulders", el: "e", a: [70, 44, 8, 6] },
  { r: "chest", el: "e", a: [42, 52, 8, 7] }, { r: "chest", el: "e", a: [58, 52, 8, 7] },
  { r: "biceps", el: "e", a: [24, 64, 5, 10] }, { r: "biceps", el: "e", a: [76, 64, 5, 10] },
  { r: "forearms", el: "e", a: [20, 88, 4, 11] }, { r: "forearms", el: "e", a: [80, 88, 4, 11] },
  { r: "abs", el: "r", a: [43, 61, 14, 32] }, { r: "obliques", el: "r", a: [35, 63, 6, 26] }, { r: "obliques", el: "r", a: [59, 63, 6, 26] },
  { r: "quads", el: "e", a: [42, 124, 7, 21] }, { r: "quads", el: "e", a: [58, 124, 7, 21] },
  { r: "calves", el: "e", a: [42, 166, 5, 14] }, { r: "calves", el: "e", a: [58, 166, 5, 14] },
];
const BACK: Shape[] = [
  { r: "traps", el: "r", a: [38, 34, 24, 10] }, { r: "shoulders", el: "e", a: [30, 44, 8, 6] }, { r: "shoulders", el: "e", a: [70, 44, 8, 6] },
  { r: "lats", el: "e", a: [41, 60, 8, 13] }, { r: "lats", el: "e", a: [59, 60, 8, 13] },
  { r: "triceps", el: "e", a: [24, 64, 5, 10] }, { r: "triceps", el: "e", a: [76, 64, 5, 10] },
  { r: "forearms", el: "e", a: [20, 88, 4, 11] }, { r: "forearms", el: "e", a: [80, 88, 4, 11] },
  { r: "lowerback", el: "r", a: [43, 75, 14, 15] }, { r: "glutes", el: "e", a: [43, 100, 8, 8] }, { r: "glutes", el: "e", a: [57, 100, 8, 8] },
  { r: "hamstrings", el: "e", a: [42, 128, 7, 17] }, { r: "hamstrings", el: "e", a: [58, 128, 7, 17] },
  { r: "calves", el: "e", a: [42, 164, 6, 13] }, { r: "calves", el: "e", a: [58, 164, 6, 13] },
];
// One hue, light to dark: more sets this week, stronger colour.
const level = (sets: number) => (sets <= 0 ? 0 : sets < 4 ? 1 : sets < 10 ? 2 : 3);
const FILL = ["rgba(255,255,255,.07)", "color-mix(in srgb, var(--accent2) 35%, transparent)", "color-mix(in srgb, var(--accent2) 65%, transparent)", "var(--accent2)"];

function Figure({ shapes, sets, label, onPick, sel }: { shapes: Shape[]; sets: Record<Region, number>; label: string; onPick: (r: Region) => void; sel: Region | null }) {
  return (
    <svg viewBox="0 0 100 185" className="w-full" role="img" aria-label={`${label} muscle map`}>
      <circle cx="50" cy="17" r="10" fill="rgba(255,255,255,.1)" />
      <rect x="45" y="27" width="10" height="7" fill="rgba(255,255,255,.1)" />
      {shapes.map((s, i) => {
        const p = { fill: FILL[level(sets[s.r])], stroke: sel === s.r ? "#fff" : "#140c24", strokeWidth: sel === s.r ? 1.2 : 1.5, onClick: () => onPick(s.r), className: "cursor-pointer" };
        return s.el === "e" ? <ellipse key={i} {...p} cx={s.a[0]} cy={s.a[1]} rx={s.a[2]} ry={s.a[3]} /> : <rect key={i} {...p} x={s.a[0]} y={s.a[1]} width={s.a[2]} height={s.a[3]} rx="3" />;
      })}
      <text x="50" y="183" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.55)">{label}</text>
    </svg>
  );
}

export function MuscleMap() {
  const { data } = useApp();
  const sets = useMemo(() => muscleWeek(data), [data]);
  const [sel, setSel] = useState<Region | null>(null);
  const forgot = REGIONS.filter(([r]) => sets[r] <= 0);
  const name = (r: Region) => REGIONS.find((x) => x[0] === r)![1];
  return (
    <section className="card p-4 mb-4">
      <h2 className="section-title mb-1">🗺️ Muscle map this week</h2>
      <p className="text-[11px] text-muted mb-2">From the muscles of every move you logged since Monday. Tap a muscle.</p>
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        <Figure shapes={FRONT} sets={sets} label="Front" onPick={setSel} sel={sel} />
        <Figure shapes={BACK} sets={sets} label="Back" onPick={setSel} sel={sel} />
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted mt-1">
        {["None", "1-3 sets", "4-9", "10+"].map((t, i) => <span key={t} className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: FILL[i] }} />{t}</span>)}
      </div>
      {sel && <p className="mt-2 text-sm text-center"><b>{name(sel)}</b>: {Math.round(sets[sel] * 10) / 10} sets this week{sets[sel] <= 0 && moveFor(sel) ? ` · try ${moveFor(sel)}` : ""}</p>}
      {forgot.length > 0 && forgot.length < REGIONS.length && (
        <div className="mt-2 text-xs"><span className="text-amber-300">Forgot this week:</span> {forgot.map(([r, l]) => `${l}${moveFor(r) ? ` (${moveFor(r)})` : ""}`).join(", ")}</div>
      )}
      {forgot.length === REGIONS.length && <p className="mt-2 text-xs text-muted">Nothing trained yet this week. One workout lights up the map!</p>}
      {forgot.length === 0 && <p className="mt-2 text-xs text-emerald-300">Every muscle trained this week. Balanced warrior! ⚔️</p>}
    </section>
  );
}
