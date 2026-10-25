"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/Sheet";
import { PoseDemo } from "@/components/PoseDemo";
import { WorkoutRunner } from "@/components/WorkoutRunner";
import { BodyPhotos, LineChart, MeasureCharts, RecordsBoard, WorkoutStreakCard } from "@/components/Fitness";
import { AREAS, GEAR, GOALS, PARTS, areaOf, fitOf, type Busy, type FitSettings } from "@/lib/focus";
import { FMOVES, canDoF, fmoveOf, videoOf, type FMove } from "@/lib/focusmoves";
import { badges, checkOf, fitDay, kegelToday, lastDays, prs, report, series, targets, testDue, tests, totals, type Totals } from "@/lib/focusplan";
import { setsText, type PlanRow } from "@/lib/have";
import { steps } from "@/lib/mission";
import { fmt12 } from "@/lib/schedule";
import { toDay, today, useApp } from "@/lib/store";

// Focus Area: today's workout (planned in your free time), body areas, equipment,
// times and rules, progress, body, food targets, the exercise guide and connections.

const TABS: [string, string][] = [["today", "🏋️ Today"], ["areas", "🎯 Areas"], ["gear", "🧰 Equipment"], ["plan", "⏰ Times & rules"], ["progress", "📈 Progress"], ["body", "📏 Body & tests"], ["food", "🥩 Food"], ["guide", "📚 Exercises"], ["connect", "🔗 Connect"]];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function FitPage() {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("lifeos-fit-tab") || "today"; } catch { return "today"; } });
  const go = (t: string) => { setTab(t); try { localStorage.setItem("lifeos-fit-tab", t); } catch {} };
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(([id, l]) => <button key={id} onClick={() => go(id)} className={`chip shrink-0 ${tab === id ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      {tab === "today" && <Today />}
      {tab === "areas" && <Areas />}
      {tab === "gear" && <Gear />}
      {tab === "plan" && <Rules />}
      {tab === "progress" && <Progress />}
      {tab === "body" && <BodyTab />}
      {tab === "food" && <FoodTab />}
      {tab === "guide" && <Guide />}
      {tab === "connect" && <Connect />}
    </div>
  );
}

function useFit() {
  const { data, saveSettings } = useApp();
  const fit = fitOf(data.profile.settings.fit);
  const set = (patch: Partial<FitSettings>) => saveSettings({ fit: { ...fit, ...patch } });
  return { fit, set, data };
}

// ---------- Today ----------
function Today() {
  const { data, logActivity } = useApp();
  const { fit, set } = useFit();
  const now = new Date();
  const day = today();
  const list = useMemo(() => steps(data, day, now).filter((s) => /^a-fit-\d+$/.test(s.id) || s.id === "a-kegel"), [data, day]); // eslint-disable-line react-hooks/exhaustive-deps
  const fd = useMemo(() => fitDay(data, new Date(`${day}T12:00:00`)), [data, day]);
  const t = useMemo(() => totals(data, [day]), [data, day]);
  const [run, setRun] = useState<PlanRow | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [check, setCheck] = useState(false);
  const c = checkOf(data, day);
  if (!fit.on) return (
    <div className="card p-4 space-y-2">
      <p className="text-sm">Focus Area planning is off, so your Daily mission uses the old two-part workout.</p>
      <button className="btn-primary w-full" onClick={() => set({ on: true })}>Turn Focus Area on</button>
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { const r = list.find((s) => s.moves?.some((m) => m.done < m.sets))?.moves?.find((m) => m.done < m.sets); if (r) setRun({ ...r, sets: Math.max(1, r.sets - r.done) }); }} className="card p-4 text-left active:scale-95">
          <div className="text-2xl">▶️</div><div className="font-bold">Start workout</div><div className="text-xs text-muted">Next move, with voice timer</div>
        </button>
        <button onClick={() => setCheck(true)} className="card p-4 text-left active:scale-95">
          <div className="text-2xl">{c ? ["", "😫", "😕", "🙂", "😃", "🤩"][Number(c.data.energy) || 3] : "⚡"}</div><div className="font-bold">Energy check</div><div className="text-xs text-muted">{c ? "Done today · tap to change" : "Changes today's intensity"}</div>
        </button>
      </div>
      {(fd.why.length > 0 || fd.moved || fd.none) && (
        <div className="card p-3 text-xs space-y-1">
          {fd.moved && <p>⏩ {fd.moved}</p>}
          {fd.none && !fd.moved && <p>🛌 {fd.none}</p>}
          {fd.why.map((w) => <p key={w}>• {w}</p>)}
        </div>
      )}
      {list.map((s) => (
        <div key={s.id} className="card p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-bold">{s.label}</h2>
            <span className="text-xs text-muted shrink-0">{fmt12(s.time)}{s.end ? `–${fmt12(s.end)}` : ""}</span>
          </div>
          {s.note && <p className="text-[11px] text-muted mt-1">{s.note}</p>}
          {s.id !== "a-kegel" && <p className="text-[11px] text-muted mt-1">💧 Drink 250 ml 15 min before and 300 ml after.</p>}
          <ul className="mt-2 space-y-1.5">
            {(s.moves ?? []).map((r) => {
              const full = r.done >= r.sets;
              return (
                <li key={r.name} className={`rounded-xl px-2.5 py-2 flex items-center gap-2 ${full ? "bg-emerald-500/15" : "bg-white/[.04]"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted">{r.part}</div>
                    <button onClick={() => setInfo(r.name)} className={`text-base font-semibold text-left ${full ? "line-through" : ""}`}>{r.name}</button>
                    <div className="text-xs text-muted">{setsText(r.sets, r.reps)}{r.rest ? ` · rest ${r.rest}s` : ""}{r.done > 0 && !full ? ` · ${r.done} of ${r.sets} done` : ""}</div>
                  </div>
                  {full ? <span className="h-9 w-9 rounded-full bg-emerald-500 grid place-items-center">✓</span>
                    : <button aria-label={`Start ${r.name}`} onClick={() => setRun({ ...r, sets: Math.max(1, r.sets - r.done) })} className="rounded-full bg-[var(--accent2)] text-[#0b0420] px-4 h-9 text-sm font-bold active:scale-90">▶ Start</button>}
                </li>
              );
            })}
          </ul>
          {s.progress && <div className="text-xs text-muted mt-2">{s.progress.done} of {s.progress.total} moves done</div>}
        </div>
      ))}
      <TotalsCard title="Today" t={t} steps={fit.steps} />
      {run && <WorkoutRunner row={run} onClose={() => setRun(null)} />}
      {info && <MoveSheet name={info} onClose={() => setInfo(null)} />}
      {check && <CheckSheet onClose={() => setCheck(false)} onSave={(v) => { logActivity("fitcheck", v); setCheck(false); }} prev={c?.data} />}
    </>
  );
}

function CheckSheet({ onClose, onSave, prev }: { onClose: () => void; onSave: (v: Record<string, unknown>) => void; prev?: Record<string, unknown> }) {
  const [energy, setEnergy] = useState(Number(prev?.energy) || 0);
  const [mood, setMood] = useState(Number(prev?.mood) || 0);
  const [sore, setSore] = useState<string[]>(Array.isArray(prev?.sore) ? (prev!.sore as string[]) : []);
  const row = (v: number, setV: (n: number) => void, icons: string[]) => (
    <div className="flex gap-1.5">{icons.map((ic, i) => <button key={ic} onClick={() => setV(i + 1)} className={`chip flex-1 text-xl justify-center ${v === i + 1 ? "chip-on" : ""}`}>{ic}</button>)}</div>
  );
  return (
    <Sheet title="⚡ How do you feel?" onClose={onClose}>
      <p className="text-sm">Energy</p>{row(energy, setEnergy, ["😫", "😕", "🙂", "😃", "🤩"])}
      <p className="text-sm">Mood</p>{row(mood, setMood, ["😢", "😞", "😐", "😊", "😁"])}
      <p className="text-sm">Sore or hurting today (rested)</p>
      <div className="flex flex-wrap gap-1">{AREAS.filter((a) => a.group !== "none" || ["knees", "ankles", "spine"].includes(a.id)).map((a) => <button key={a.id} onClick={() => setSore(sore.includes(a.id) ? sore.filter((x) => x !== a.id) : [...sore, a.id])} className={`chip !px-2 !py-0.5 text-[11px] ${sore.includes(a.id) ? "chip-on" : ""}`}>{a.label}</button>)}</div>
      <button className="btn-primary w-full" disabled={!energy} onClick={() => onSave({ energy, mood: mood || 3, sore })}>Save</button>
      <p className="text-[11px] text-muted">Very low energy → an easy recovery session. Low → lighter and shorter. High → a bit more.</p>
    </Sheet>
  );
}

export function MoveSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const m = fmoveOf(name);
  return (
    <Sheet title={name} onClose={onClose}>
      {m ? <MoveInfo m={m} /> : <p className="text-sm text-muted">No guide for this one yet.</p>}
    </Sheet>
  );
}
function MoveInfo({ m }: { m: FMove }) {
  return (
    <div className="space-y-2 text-sm">
      <PoseDemo pose={m.pose} prop={m.prop} scene={m.scene} className="!w-40 mx-auto" />
      <p><b>Works:</b> {m.a.map((a) => areaOf(a)?.label ?? a).join(", ")}</p>
      <p><b>Plan:</b> {setsText(m.s, m.r)}{m.rest ? `, rest ${m.rest} s` : ""}</p>
      <p><b>Why it works:</b> {m.why}</p>
      <div><b>How to do it</b><ol className="list-decimal pl-5 text-muted">{m.how.map((x) => <li key={x}>{x}</li>)}</ol></div>
      <div><b>Common mistakes</b><ul className="list-disc pl-5 text-muted">{m.bad.map((x) => <li key={x}>{x}</li>)}</ul></div>
      <p className="text-xs text-muted">Needs: {m.g.length ? m.g.map((g) => g.split("|").filter(Boolean).map((x) => GEAR.find((y) => y.id === x)?.label ?? x).join(" or ") + (g.endsWith("|") ? " (optional)" : "")).join(", ") : "nothing (bodyweight)"}</p>
      <a href={videoOf(m.n)} target="_blank" rel="noreferrer" className="text-[var(--accent2)] underline text-xs">▶ Watch a form video (internet)</a>
    </div>
  );
}

function TotalsCard({ title, t, steps: goal }: { title: string; t: Totals; steps?: number }) {
  const cells: [string, string | number][] = [["Exercises", t.exercises], ["Sets", t.sets], ["Reps", t.reps], ["Minutes", t.minutes], ["kcal", t.kcal], ["Steps", t.steps.toLocaleString()]];
  return (
    <div className="card p-3">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        {cells.map(([l, v]) => <div key={l} className="rounded-xl bg-white/[.04] py-2"><div className="text-lg font-bold">{v}</div><div className="text-[10px] text-muted">{l}</div></div>)}
      </div>
      {goal ? <p className="text-[11px] text-muted mt-2">Step goal {goal.toLocaleString()} a day{title === "Today" ? ` · ${Math.min(100, Math.round((t.steps / goal) * 100))}% today` : ""}</p> : null}
    </div>
  );
}

// ---------- Areas ----------
function Areas() {
  const { fit, set } = useFit();
  const [pain, setPain] = useState(false);
  const list = pain ? fit.pain : fit.areas;
  const flip = (id: string) => { const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]; set(pain ? { pain: next } : { areas: next }); };
  return (
    <div className="space-y-3">
      <div className="card p-3 text-sm">
        <div className="flex gap-2">
          <button onClick={() => setPain(false)} className={`chip flex-1 justify-center ${!pain ? "chip-on" : ""}`}>🎯 Improve ({fit.areas.length})</button>
          <button onClick={() => setPain(true)} className={`chip flex-1 justify-center ${pain ? "chip-on" : ""}`}>🩹 Pain mode ({fit.pain.length})</button>
        </div>
        <p className="text-xs text-muted mt-2">{pain ? "Tick what hurts: moves that load it are left out and safe ones are used instead. See a doctor for pain that lasts." : "Tick the areas you want to improve. Each workout is about 70% these areas and 30% full body and cardio. Change it any time."}</p>
      </div>
      {PARTS.map((p) => (
        <div key={p} className="card p-3">
          <h3 className="text-sm font-semibold mb-2">{p}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {AREAS.filter((a) => a.part === p).map((a) => (
              <label key={a.id} className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm ${list.includes(a.id) ? (pain ? "bg-rose-500/20" : "bg-[var(--accent2)]/20") : "bg-white/[.04]"}`}>
                <input type="checkbox" checked={list.includes(a.id)} onChange={() => flip(a.id)} />
                <span>{a.icon} {a.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Equipment ----------
function Gear() {
  const { fit, set } = useFit();
  const [name, setName] = useState("");
  const flip = (id: string) => set({ gear: fit.gear.includes(id) ? fit.gear.filter((x) => x !== id) : [...fit.gear, id] });
  const usable = FMOVES.filter((m) => canDoF(m, new Set(fit.gear))).length;
  return (
    <div className="space-y-3">
      <div className="card p-3">
        <p className="text-xs text-muted mb-2">Only exercises for the equipment you tick are planned ({usable} of {FMOVES.length} exercises right now).</p>
        <div className="space-y-1.5">
          {GEAR.map((g) => (
            <label key={g.id} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm ${fit.gear.includes(g.id) ? "bg-[var(--accent2)]/20" : "bg-white/[.04]"}`}>
              <input type="checkbox" checked={fit.gear.includes(g.id)} onChange={() => flip(g.id)} />
              <span className="flex-1">{g.icon} {g.label}</span>
              <span className="text-[10px] text-muted">{FMOVES.filter((m) => m.g.some((x) => x.split("|").includes(g.id))).length} moves</span>
            </label>
          ))}
        </div>
      </div>
      <div className="card p-3">
        <h3 className="text-sm font-semibold mb-1">Other equipment you own</h3>
        <p className="text-[11px] text-muted mb-2">Kept on your list. Your gym collection is in <Link href="/have" className="underline">My stuff</Link>.</p>
        <div className="flex gap-2">
          <input className="input" placeholder="e.g. Ankle weights" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary" onClick={() => { if (name.trim()) { set({ myGear: [...fit.myGear, name.trim()] }); setName(""); } }}>Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">{fit.myGear.map((g) => <span key={g} className="chip">{g}<button aria-label={`Remove ${g}`} className="ml-1" onClick={() => set({ myGear: fit.myGear.filter((x) => x !== g) })}>✕</button></span>)}</div>
      </div>
    </div>
  );
}

// ---------- Times and rules ----------
function Rules() {
  const { fit, set } = useFit();
  const [b, setB] = useState<Busy>({ start: "", end: "", label: "", days: [] });
  const num = (k: keyof FitSettings, v: string, lo: number, hi: number) => set({ [k]: Math.max(lo, Math.min(hi, Number(v) || 0)) } as Partial<FitSettings>);
  const sw = (k: keyof FitSettings, label: string) => (
    <label className="flex items-center justify-between text-sm py-1"><span>{label}</span><input type="checkbox" checked={!!fit[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<FitSettings>)} /></label>
  );
  return (
    <div className="space-y-3">
      <div className="card p-3 space-y-2">
        {sw("on", "Focus Area plans my workouts on the Daily mission")}
        <label className="text-sm block">About how long each day (minutes)<input className="input mt-1" inputMode="numeric" value={fit.minutes} onChange={(e) => num("minutes", e.target.value, 10, 180)} /></label>
        <label className="text-sm block">Saturday, Sunday and holidays: % longer<input className="input mt-1" inputMode="numeric" value={fit.weekendBoost} onChange={(e) => num("weekendBoost", e.target.value, 0, 100)} /></label>
        <label className="text-sm block">My own volume change: {fit.manual > 0 ? "+" : ""}{fit.manual}%<input type="range" min={-50} max={50} step={5} className="w-full" value={fit.manual} onChange={(e) => set({ manual: Number(e.target.value) })} /></label>
        {sw("auto", "Change volume automatically from how much I complete")}
        <div className="text-sm">When I like to train</div>
        <div className="flex gap-1.5">{(["auto", "morning", "evening"] as const).map((p) => <button key={p} onClick={() => set({ prefer: p })} className={`chip flex-1 justify-center ${fit.prefer === p ? "chip-on" : ""}`}>{p === "auto" ? "🤖 Best free time" : p === "morning" ? "🌅 Morning" : "🌙 Evening"}</button>)}</div>
        <p className="text-[11px] text-muted">Never during work and the commute, study, meals, sleep, the first hour after waking, bath time, your own steps and tasks, or the times below. No hard training 45 min after breakfast or 90 min after lunch, dinner or a big meal, and it ends 2 hours before bed. If your day changes or you miss it by 15 min, it moves to the next free time today; nothing piles up on tomorrow.</p>
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="text-sm font-semibold">🔕 Do not disturb and busy times</h3>
        {fit.dnd.map((x, i) => (
          <div key={i} className="flex items-center gap-2 text-sm rounded-xl bg-white/[.04] px-2 py-1.5">
            <span className="flex-1">{x.label || "Busy"} · {fmt12(x.start)}–{fmt12(x.end)} · {x.date ?? (x.days?.length ? x.days.map((dd) => DAYS[dd]).join(" ") : "every day")}</span>
            <button aria-label="Remove" onClick={() => set({ dnd: fit.dnd.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">From<input type="time" className="input mt-1" value={b.start} onChange={(e) => setB({ ...b, start: e.target.value })} /></label>
          <label className="text-xs text-muted">To<input type="time" className="input mt-1" value={b.end} onChange={(e) => setB({ ...b, end: e.target.value })} /></label>
        </div>
        <input className="input" placeholder="What (e.g. Family time)" value={b.label} onChange={(e) => setB({ ...b, label: e.target.value })} />
        <div className="flex gap-1">{DAYS.map((dn, i) => <button key={dn} onClick={() => setB({ ...b, days: b.days?.includes(i) ? b.days.filter((x) => x !== i) : [...(b.days ?? []), i] })} className={`chip flex-1 justify-center !px-0 text-[11px] ${b.days?.includes(i) ? "chip-on" : ""}`}>{dn}</button>)}</div>
        <button className="btn-primary w-full" disabled={!b.start || !b.end} onClick={() => { set({ dnd: [...fit.dnd, b] }); setB({ start: "", end: "", label: "", days: [] }); }}>＋ Add time</button>
        <p className="text-[11px] text-muted">No days ticked = every day. Calendar events can be imported in 🔗 Connect.</p>
      </div>
      <div className="card p-3 space-y-1">
        <h3 className="text-sm font-semibold">Daily extras</h3>
        {sw("mobility", "Mobility and stretching in every cool-down")}
        {sw("breathe", "Breathing exercise after each workout")}
        {sw("kegel", "Kegel program (timer, gets harder each week)")}
        {sw("posture", "Posture nudges when sitting long")}
        {sw("remind", "Phone reminders for workouts and water")}
        <label className="text-sm block pt-1">Daily step goal<input className="input mt-1" inputMode="numeric" value={fit.steps} onChange={(e) => num("steps", e.target.value, 1000, 30000)} /></label>
      </div>
    </div>
  );
}

// ---------- Progress ----------
function Progress() {
  const { data } = useApp();
  const { fit } = useFit();
  const [range, setRange] = useState<7 | 30>(7);
  const [key, setKey] = useState<keyof Totals>("minutes");
  const t = useMemo(() => totals(data, lastDays(range)), [data, range]);
  const pts = useMemo(() => series(data, range, key), [data, range, key]);
  const rep = useMemo(() => report(data, range), [data, range]);
  const best = useMemo(() => prs(data).slice(0, 12), [data]);
  const bs = useMemo(() => badges(data), [data]);
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">{([7, 30] as const).map((r) => <button key={r} onClick={() => setRange(r)} className={`chip flex-1 justify-center ${range === r ? "chip-on" : ""}`}>{r === 7 ? "This week" : "This month"}</button>)}</div>
      <TotalsCard title={range === 7 ? "Last 7 days" : "Last 30 days"} t={t} steps={fit.steps} />
      <div className="card p-3">
        <div className="flex flex-wrap gap-1 mb-2">{(["minutes", "sets", "reps", "kcal", "steps", "exercises"] as (keyof Totals)[]).map((k) => <button key={k} onClick={() => setKey(k)} className={`chip !px-2 !py-0.5 text-[11px] ${key === k ? "chip-on" : ""}`}>{k}</button>)}</div>
        <LineChart pts={pts} unit={key} />
      </div>
      <div className="card p-3 text-sm space-y-1">
        <h3 className="font-semibold">{range === 7 ? "Weekly" : "Monthly"} report</h3>
        {rep.better.length > 0 && <p>📈 Better: {rep.better.join(" · ")}</p>}
        {rep.missed.length > 0 && <p>📉 Less or missed: {rep.missed.join(" · ")}</p>}
        {rep.next.map((x) => <p key={x}>👉 {x}</p>)}
      </div>
      <WorkoutStreakCard />
      <div className="card p-3">
        <h3 className="text-sm font-semibold mb-2">🏅 Badges</h3>
        <div className="grid grid-cols-3 gap-2">{bs.map((b) => <div key={b.id} title={b.desc} className={`rounded-xl p-2 text-center ${b.got ? "bg-amber-400/15" : "bg-white/[.03] opacity-50"}`}><div className="text-2xl">{b.icon}</div><div className="text-[10px]">{b.name}</div></div>)}</div>
      </div>
      <div className="card p-3">
        <h3 className="text-sm font-semibold mb-2">🏆 Personal records</h3>
        {best.length ? <ul className="text-sm space-y-1">{best.map((b) => <li key={b.name} className="flex justify-between gap-2"><span>{b.name}</span><span className="text-muted">{[b.reps ? `${b.reps} reps` : "", b.secs ? `${b.secs} s` : "", b.kg ? `${b.kg} kg` : ""].filter(Boolean).join(" · ")}</span></li>)}</ul> : <p className="text-xs text-muted">Finish a workout to see your records (plank included).</p>}
      </div>
      <div className="card p-3"><RecordsBoard /></div>
    </div>
  );
}

// ---------- Body and tests ----------
function BodyTab() {
  const { data, logActivity } = useApp();
  const { fit, set } = useFit();
  const list = tests(data);
  const [tst, setTst] = useState({ pushups: "", pullups: "", plank: "", squats: "" });
  const [m, setM] = useState({ weight: "", bodyfat: "", waist: "", chest: "", arms: "", thigh: "", hips: "" });
  const fat = data.logs.filter((l) => l.kind === "body" && Number(l.data.bodyfat) > 0).map((l) => ({ day: l.day, v: Number(l.data.bodyfat) }));
  return (
    <div className="space-y-3">
      <div className="card p-3 space-y-2">
        <h3 className="text-sm font-semibold">🎯 Goal</h3>
        <div className="grid grid-cols-2 gap-1.5">{GOALS.map(([g, l, about]) => <button key={g} onClick={() => set({ goal: g })} className={`rounded-xl p-2 text-left text-sm ${fit.goal === g ? "bg-[var(--accent2)]/20 ring-1 ring-[var(--accent2)]" : "bg-white/[.04]"}`}><div>{l}</div><div className="text-[10px] text-muted">{about}</div></button>)}</div>
        <label className="text-sm block">Target date<input type="date" className="input mt-1" value={fit.goalDate} onChange={(e) => set({ goalDate: e.target.value })} /></label>
        {fit.goalDate && <p className="text-xs text-muted">{Math.max(0, Math.round((new Date(fit.goalDate).getTime() - Date.now()) / 86_400_000))} days to go.</p>}
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="text-sm font-semibold">📋 Monthly fitness test {testDue(data) && <span className="text-amber-300 text-xs">· due now</span>}</h3>
        <p className="text-[11px] text-muted">Max push-ups, max pull-ups, longest plank (seconds), squats in 1 minute. It sets your exercise level.</p>
        <div className="grid grid-cols-4 gap-2">{(["pushups", "pullups", "plank", "squats"] as const).map((k) => <label key={k} className="text-[11px] text-muted">{k}<input className="input mt-1 !px-2" inputMode="numeric" value={tst[k]} onChange={(e) => setTst({ ...tst, [k]: e.target.value })} /></label>)}</div>
        <button className="btn-primary w-full" disabled={!Object.values(tst).some(Boolean)} onClick={() => { logActivity("fittest", Object.fromEntries(Object.entries(tst).map(([k, v]) => [k, Number(v) || 0]))); setTst({ pushups: "", pullups: "", plank: "", squats: "" }); }}>Save test</button>
        {list.length > 0 && <table className="w-full text-xs"><thead><tr className="text-muted"><td>Date</td><td>Push</td><td>Pull</td><td>Plank</td><td>Squat</td></tr></thead><tbody>{list.slice(-6).reverse().map((x) => <tr key={x.day}><td>{x.day}</td><td>{x.pushups}</td><td>{x.pullups}</td><td>{x.plank}s</td><td>{x.squats}</td></tr>)}</tbody></table>}
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="text-sm font-semibold">📏 Measurements</h3>
        <div className="grid grid-cols-4 gap-2">{(Object.keys(m) as (keyof typeof m)[]).map((k) => <label key={k} className="text-[11px] text-muted">{k === "bodyfat" ? "Body fat %" : k === "weight" ? "Weight kg" : `${k} cm`}<input className="input mt-1 !px-2" inputMode="decimal" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} /></label>)}</div>
        <button className="btn-primary w-full" disabled={!Object.values(m).some(Boolean)} onClick={() => { logActivity("body", Object.fromEntries(Object.entries(m).filter(([, v]) => v).map(([k, v]) => [k, Number(v) || 0]))); setM({ weight: "", bodyfat: "", waist: "", chest: "", arms: "", thigh: "", hips: "" }); }}>Save</button>
        {fat.length > 0 && <><div className="text-xs text-muted">Body fat %</div><LineChart pts={fat} unit="%" h={70} /></>}
        <MeasureCharts />
      </div>
      <div className="card p-3"><h3 className="text-sm font-semibold mb-2">📸 Progress photos</h3><BodyPhotos /></div>
    </div>
  );
}

// ---------- Food ----------
function FoodTab() {
  const { data } = useApp();
  const day = today();
  const training = useMemo(() => fitDay(data, new Date(`${day}T12:00:00`)).sessions.length > 0, [data, day]);
  const t = useMemo(() => targets(data, training), [data, training]);
  return (
    <div className="card p-3 space-y-2 text-sm">
      <h3 className="font-semibold">Today&apos;s targets {training ? "(training day)" : "(rest day)"}</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/[.04] py-2"><div className="text-lg font-bold">{t.protein} g</div><div className="text-[10px] text-muted">Protein ({t.perKg} g/kg)</div></div>
        <div className="rounded-xl bg-white/[.04] py-2"><div className="text-lg font-bold">{t.kcal}</div><div className="text-[10px] text-muted">kcal</div></div>
        <div className="rounded-xl bg-white/[.04] py-2"><div className="text-lg font-bold">{(t.water / 1000).toFixed(1)} L</div><div className="text-[10px] text-muted">Water</div></div>
      </div>
      {!t.known && <p className="text-[11px] text-amber-300">Add your weight, height and birth year (📏 Body & tests, or the Hero page) for exact numbers.</p>}
      <h4 className="font-semibold pt-1">Meal ideas</h4>
      <ul className="list-disc pl-5 text-muted">{t.ideas.map((x) => <li key={x}>{x}</li>)}</ul>
      <Link href="/food" className="btn-primary w-full block text-center">🍱 Open Food</Link>
    </div>
  );
}

// ---------- Exercise guide ----------
function Guide() {
  const { fit } = useFit();
  const [area, setArea] = useState("");
  const [mine, setMine] = useState(true);
  const [open, setOpen] = useState<FMove | null>(null);
  const gear = new Set(fit.gear);
  const list = FMOVES.filter((m) => (!area || m.a.includes(area)) && (!mine || canDoF(m, gear)));
  return (
    <div className="space-y-3">
      <div className="card p-3 space-y-2">
        <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
        </select>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only with my equipment</label>
      </div>
      <ul className="space-y-1.5">
        {list.map((m) => (
          <li key={m.n}><button onClick={() => setOpen(m)} className="card w-full p-3 text-left">
            <div className="font-semibold">{m.n}</div>
            <div className="text-xs text-muted">{setsText(m.s, m.r)} · {m.a.slice(0, 3).map((a) => areaOf(a)?.label ?? a).join(", ")}</div>
          </button></li>
        ))}
      </ul>
      {open && <Sheet title={open.n} onClose={() => setOpen(null)}><MoveInfo m={open} /></Sheet>}
    </div>
  );
}

// ---------- Connections, import and backup ----------
function Connect() {
  const { data, logActivity } = useApp();
  const { fit, set } = useFit();
  const [msg, setMsg] = useState("");
  const ics = async (f: File) => {
    const txt = (await f.text()).replace(/\r?\n[ \t]/g, "");
    const out: Busy[] = [];
    for (const ev of txt.split("BEGIN:VEVENT").slice(1)) {
      const g = (k: string) => new RegExp(`^${k}[^:]*:(.*)$`, "m").exec(ev)?.[1]?.trim();
      const s = g("DTSTART"), e = g("DTEND"), what = g("SUMMARY") ?? "Calendar";
      const p = (x?: string) => { const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/.exec(x ?? ""); if (!m) return null; const dt = m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); return dt; };
      const a = p(s), b = p(e);
      if (!a || !b || b.getTime() < Date.now() - 86_400_000) continue;
      const hhmm = (x: Date) => `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
      out.push({ start: hhmm(a), end: hhmm(b), label: what.slice(0, 40), date: toDay(a) });
    }
    const keep = fit.dnd.filter((x) => !x.date || x.date >= today());
    set({ dnd: [...keep, ...out.filter((x) => !keep.some((k) => k.date === x.date && k.start === x.start && k.label === x.label))] });
    setMsg(`Added ${out.length} upcoming calendar events as busy times.`);
  };
  const csv = async (f: File) => {
    const rows = (await f.text()).split(/\r?\n/).map((r) => r.split(/[,;\t]/).map((x) => x.trim().replace(/^"|"$/g, "")));
    const head = rows[0].map((x) => x.toLowerCase());
    const di = head.findIndex((h) => /date|day/.test(h)), si = head.findIndex((h) => /step/.test(h)), wi = head.findIndex((h) => /weight|kg/.test(h));
    let n = 0;
    for (const r of rows.slice(1)) {
      const at = new Date(`${r[di]?.slice(0, 10)}T20:00:00`);
      if (di < 0 || Number.isNaN(at.getTime())) continue;
      if (si >= 0 && Number(r[si]) > 0 && !data.logs.some((l) => l.kind === "steps" && l.day === toDay(at))) { logActivity("steps", { steps: Number(r[si]), source: "import" }, at); n++; }
      if (wi >= 0 && Number(r[wi]) > 0) { logActivity("body", { weight: Number(r[wi]), source: "import" }, at); n++; }
    }
    setMsg(n ? `Imported ${n} records.` : "Nothing found. The file needs a date column and a steps or weight column.");
  };
  const exportFit = () => {
    const keep = data.logs.filter((l) => ["workout", "steps", "body", "fittest", "fitcheck", "sleep"].includes(l.kind));
    const blob = new Blob([JSON.stringify({ fit, logs: keep }, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `life-os-fitness-${today()}.json`; a.click();
  };
  const exportCsv = () => {
    const rows = [["date", "exercise", "sets", "reps", "seconds", "weight", "minutes"], ...data.logs.filter((l) => l.kind === "workout").map((l) => [l.day, String(l.data.exercise ?? ""), l.data.sets, l.data.reps, l.data.seconds ?? "", l.data.weight ?? "", l.data.minutes ?? ""].map(String))];
    const blob = new Blob([rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `life-os-workouts-${today()}.csv`; a.click();
  };
  const k = kegelToday(data, new Date());
  return (
    <div className="space-y-3 text-sm">
      <div className="card p-3 space-y-1">
        <h3 className="font-semibold">Already connected inside the app</h3>
        <p className="text-muted text-xs">Your schedule, meals, water, sleep, steps and calendar busy times all feed the planner: it reads your logged meals for digestion time, last night&apos;s sleep for intensity, and your work, study and own steps for free time. Kegel program: week {k.weeks + 1}, hold {k.hold} s.</p>
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="font-semibold">📅 Calendar (.ics)</h3>
        <p className="text-xs text-muted">Export your calendar from Google Calendar or iPhone Calendar as an .ics file and pick it here: every upcoming event becomes a busy time the workout avoids.</p>
        <label className="btn-primary w-full block text-center cursor-pointer">Pick .ics file<input type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => e.target.files?.[0] && ics(e.target.files[0])} /></label>
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="font-semibold">❤️ Apple Health · Google Fit · calorie apps</h3>
        <p className="text-xs text-muted">A web app can&apos;t read Apple Health or Google Fit directly; that comes with the native app. Until then, export steps or weight as a CSV (date + steps or weight columns) and import it here.</p>
        <label className="btn-primary w-full block text-center cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => e.target.files?.[0] && csv(e.target.files[0])} /></label>
      </div>
      <div className="card p-3 space-y-2">
        <h3 className="font-semibold">💾 Backup and export</h3>
        <button className="btn-primary w-full" onClick={exportFit}>Download fitness backup (JSON)</button>
        <button className="chip w-full justify-center" onClick={exportCsv}>Download workouts (CSV, opens in Excel)</button>
        <p className="text-[11px] text-muted">Everything is also in the full app backup (Tools › Backup & safety) and syncs encrypted to your account. Works offline; it saves on your phone and syncs when you&apos;re back online.</p>
      </div>
      {msg && <p className="card p-3">{msg}</p>}
    </div>
  );
}
