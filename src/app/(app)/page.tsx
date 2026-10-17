"use client";

import { useEffect, useMemo, useState } from "react";
import { LiquidGlass } from "@/components/LiquidGlass";
import { dtLocal, fmtDuration, fmtTime, Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { daySummary, describe, MEAL_NAMES } from "@/lib/describe";
import { emojiFor } from "@/lib/emoji";
import { dailyGoals, sumMl } from "@/lib/goals";
import { today, toDay, useApp, useCustomItems, useLogs, type CustomItem, type Log } from "@/lib/store";

const shiftDay = (day: string, n: number) => {
  const d = new Date(`${day}T12:00`);
  d.setDate(d.getDate() + n);
  return toDay(d);
};
// When logging on a past/future day, use that date with the current clock time.
const atFor = (day: string) => {
  const now = new Date();
  if (day === toDay(now)) return now;
  const d = new Date(`${day}T12:00`);
  d.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return d;
};

export default function TodayPage() {
  const [day, setDay] = useState(today());
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("day");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setDay(q);
  }, []);

  const { profile, logActivity, celebrate, data } = useApp();
  const { logs } = useLogs(day);
  const settings = profile.settings;
  const goals = dailyGoals(logs, settings);
  const doneCount = goals.filter((g) => g.done).length;
  const isToday = day === today();
  const [editing, setEditing] = useState<Log | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Log | null>(null);

  useEffect(() => {
    if (!isToday || doneCount !== goals.length) return;
    const key = `lifeos-perfect-${day}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    celebrate({ title: "PERFECT DAY!", subtitle: "Every goal complete. Legendary.", big: true });
  }, [doneCount, goals.length, day, isToday, celebrate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const log = (kind: string, payload: Record<string, unknown>, title: string) => {
    const row = logActivity(kind, payload, atFor(day));
    celebrate({ title, xp: row.xp });
    setToast(row);
    return row;
  };

  const hour = new Date().getHours();
  const greet = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const summary = daySummary(logs, settings.currency);
  const dateLabel = new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <XpHeader title={isToday ? greet : "Day record"} />

      <div className="card flex items-center gap-2 p-2 mb-4">
        <button aria-label="Previous day" onClick={() => setDay(shiftDay(day, -1))} className="btn-ghost h-10 w-10 !p-0">‹</button>
        <label className="relative flex-1 text-center cursor-pointer">
          <div className="font-bold">{isToday ? "Today" : dateLabel.split(",")[0]}</div>
          <div className="text-xs text-muted">{dateLabel}</div>
          <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Pick a date" />
        </label>
        <button aria-label="Next day" onClick={() => setDay(shiftDay(day, 1))} className="btn-ghost h-10 w-10 !p-0">›</button>
        {!isToday && <button onClick={() => setDay(today())} className="chip chip-on">Today</button>}
      </div>

      {isToday && <SleepCard onLogged={setToast} />}

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">Daily quest</h2>
          <span className="text-sm text-muted">{doneCount}/{goals.length}</span>
        </div>
        <div className="bar mb-3"><div style={{ width: `${(doneCount / goals.length) * 100}%` }} /></div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {goals.map((g) => (
            <li key={g.id} className={`flex items-center gap-2 ${g.done ? "text-[var(--accent2)]" : "text-muted"}`}>
              <span>{g.done ? "✦" : "◇"}</span>{g.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-4">
        <LiquidGlass label="Water" color="#46c8ff" ml={sumMl(logs, "water")} goal={settings.water_goal_ml}
          onAdd={(ml) => log("water", { ml }, "GULP!")} />
        <LiquidGlass label="Milk" color="#fff6e8" ml={sumMl(logs, "milk")} goal={settings.milk_goal_ml}
          onAdd={(ml) => log("milk", { ml }, "STRONG BONES!")} />
      </section>

      <Activities onLog={(a) => log("activity", { name: a.name, emoji: a.config.emoji ?? emojiFor(a.name) }, `${a.name.toUpperCase()}!`)} />

      <PantryStrip day={day} onLogged={setToast} />

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">What I did</h2>
          <button onClick={() => setAdding(true)} className="chip chip-on">+ Add</button>
        </div>
        {summary.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {summary.map((s) => <span key={s.icon} className="chip bg-white/5">{s.icon} {s.value}</span>)}
          </div>
        )}
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nothing recorded for this day yet.</p>
        ) : (
          <ol className="relative">
            <span className="absolute left-[3.35rem] top-2 bottom-2 w-px bg-white/10" />
            {logs.map((l) => {
              const d = describe(l, settings.currency);
              return (
                <li key={l.id}>
                  <button onClick={() => setEditing(l)} className="w-full flex items-center gap-3 py-2 text-left rounded-xl hover:bg-white/5 active:bg-white/10">
                    <span className="w-11 text-right text-xs tabular-nums text-muted">{fmtTime(l.created_at)}</span>
                    <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1c1330] border border-white/10 text-base">{d.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{d.title}</span>
                      {d.detail && <span className="block text-xs text-muted truncate">{d.detail}</span>}
                    </span>
                    <span className="text-muted text-sm px-1">✎</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-24 left-4 right-20 z-30 card bg-[#1c1330] px-4 py-3 text-sm flex items-center gap-3 animate-sheet">
          <span className="flex-1 truncate">✓ {describe(toast).title} at {fmtTime(toast.created_at)}</span>
          <button onClick={() => { setEditing(data.logs.find((l) => l.id === toast.id) ?? toast); setToast(null); }} className="font-bold text-[var(--accent2)]">Details</button>
        </div>
      )}
      {editing && <EditLog log={editing} onClose={() => setEditing(null)} />}
      {adding && <AddEntry day={day} onClose={() => setAdding(false)} />}
    </>
  );
}

function SleepCard({ onLogged }: { onLogged: (l: Log) => void }) {
  const { data, logActivity, updateLog, celebrate } = useApp();
  const open = useMemo(() => [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end), [data.logs]);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const wake = () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (open) updateLog(open.id, { data: { end: now.toISOString() } });
    const row = logActivity("wake", { time, slept_from: open?.data.start ?? null });
    celebrate({ title: "OHAYO!", subtitle: open ? `You slept ${fmtDuration(now.getTime() - new Date(String(open.data.start)).getTime())}` : undefined, xp: row.xp });
    onLogged(row);
  };

  if (open) {
    const since = new Date(String(open.data.start));
    return (
      <section className="card mb-4 p-5 text-center bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="text-4xl">😴</div>
        <div className="mt-1 font-bold">Sleeping since {fmtTime(open.data.start as string)}</div>
        <div className="text-3xl font-black tabular-nums glow-text">{fmtDuration(Date.now() - since.getTime())}</div>
        <button onClick={wake} className="btn-primary mt-3 w-full text-lg">☀️ I woke up</button>
      </section>
    );
  }
  return (
    <section className="grid grid-cols-2 gap-3 mb-4">
      <button onClick={() => {
        const row = logActivity("sleep", { start: new Date().toISOString(), end: null });
        celebrate({ title: "OYASUMI!", subtitle: "Sleep well" });
        onLogged(row);
      }} className="card p-4 flex items-center gap-3 active:scale-95 transition bg-gradient-to-br from-indigo-500/25 to-transparent">
        <span className="text-3xl">🌙</span>
        <span className="text-left"><span className="block font-bold">Going to sleep</span><span className="text-xs text-muted">Night or nap</span></span>
      </button>
      <button onClick={wake} className="card p-4 flex items-center gap-3 active:scale-95 transition bg-gradient-to-br from-amber-400/25 to-transparent">
        <span className="text-3xl">☀️</span>
        <span className="text-left"><span className="block font-bold">Woke up</span><span className="text-xs text-muted">Log wake time</span></span>
      </button>
    </section>
  );
}

function Activities({ onLog }: { onLog: (a: CustomItem) => void }) {
  const { items, add, update, remove } = useCustomItems("activity");
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; emoji: string } | null>(null);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">What are you doing?</h2>
        <button onClick={() => setEdit(!edit)} className={`chip ${edit ? "chip-on" : ""}`}>{edit ? "Done" : "Edit"}</button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {items.map((a) => (
          <button key={a.id}
            onClick={() => (edit ? setForm({ id: a.id, name: a.name, emoji: String(a.config.emoji ?? emojiFor(a.name)) }) : onLog(a))}
            className={`relative rounded-2xl border border-white/10 bg-white/[.04] py-3 px-1 flex flex-col items-center gap-1 active:scale-95 transition ${edit ? "ring-1 ring-[var(--accent)]/60" : "hover:bg-white/10"}`}>
            <span className="text-2xl">{String(a.config.emoji ?? emojiFor(a.name))}</span>
            <span className="text-[11px] leading-tight text-center line-clamp-2">{a.name}</span>
            {edit && <span className="absolute top-1 right-1.5 text-[10px] text-[var(--accent)]">✎</span>}
          </button>
        ))}
        <button onClick={() => setForm({ name: "", emoji: "" })}
          className="rounded-2xl border border-dashed border-white/20 py-3 flex flex-col items-center gap-1 text-muted active:scale-95">
          <span className="text-2xl">＋</span><span className="text-[11px]">Add</span>
        </button>
      </div>

      {form && (
        <Sheet title={form.id ? "Edit activity" : "New activity"} onClose={() => setForm(null)}>
          <div className="flex items-center gap-3">
            <input aria-label="Picture" value={form.emoji || emojiFor(form.name)} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="input !w-16 text-center text-2xl" />
            <input autoFocus className="input" placeholder="e.g. Football, Guitar, Homework" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <p className="text-xs text-muted">The picture is picked automatically from the name. Tap it to change.</p>
          <div className="flex gap-2">
            {form.id && (
              <button onClick={() => { remove(form.id!); setForm(null); }} className="btn-ghost text-rose-400">Delete</button>
            )}
            <button className="btn-primary flex-1" disabled={!form.name.trim()} onClick={() => {
              const config = { emoji: form.emoji || emojiFor(form.name) };
              if (form.id) update(form.id, { name: form.name.trim(), config });
              else add(form.name.trim(), config);
              setForm(null);
            }}>Save</button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function PantryStrip({ day, onLogged }: { day: string; onLogged: (l: Log) => void }) {
  const { data, update, logActivity, celebrate } = useApp();
  const stock = data.pantry.filter((p) => p.qty > 0);
  if (!stock.length) return null;
  const use = (id: string) => {
    const p = data.pantry.find((x) => x.id === id)!;
    update((d) => ({ ...d, pantry: d.pantry.map((x) => (x.id === id ? { ...x, qty: Math.max(0, +(x.qty - 1).toFixed(2)), updated_at: new Date().toISOString() } : x)) }));
    const row = logActivity("use", { pantry_id: id, name: p.name, emoji: p.emoji, qty: 1, unit: p.unit }, atFor(day));
    celebrate({ title: `${p.emoji} ${p.qty - 1} LEFT` });
    onLogged(row);
  };
  return (
    <section className="card p-4 mb-4">
      <h2 className="font-bold mb-1">From my storage</h2>
      <p className="text-xs text-muted mb-3">Tap when you eat or use one.</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {stock.map((p) => (
          <button key={p.id} onClick={() => use(p.id)}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 flex items-center gap-2 active:scale-95">
            <span className="text-2xl">{p.emoji}</span>
            <span className="text-left leading-tight"><span className="block text-sm font-semibold">{p.name}</span>
              <span className="text-xs text-muted">{p.qty} {p.unit} left</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function EditLog({ log, onClose }: { log: Log; onClose: () => void }) {
  const { updateLog, deleteLog, update } = useApp();
  const d = log.data;
  const [when, setWhen] = useState(dtLocal(new Date(log.created_at)));
  const [f, setF] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(d).filter(([, v]) => typeof v === "string" || typeof v === "number").map(([k, v]) => [k, String(v)])),
  );
  const [sleepEnd, setSleepEnd] = useState(d.end ? dtLocal(new Date(String(d.end))) : "");
  const [sleepStart, setSleepStart] = useState(d.start ? dtLocal(new Date(String(d.start))) : "");
  const desc = describe(log);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const isMeal = log.kind === "meal" || (log.kind === "activity" && MEAL_NAMES.includes(String(d.name).toLowerCase()));
  const num = (k: string) => (f[k] === undefined || f[k] === "" ? undefined : Number(f[k]));

  const save = () => {
    const patch: Record<string, unknown> = { note: f.note || undefined };
    if (log.kind === "water" || log.kind === "milk") patch.ml = num("ml") ?? d.ml;
    if (["reading", "listening", "activity", "focus"].includes(log.kind)) patch.minutes = num("minutes");
    if (["reading", "listening"].includes(log.kind)) patch.title = f.title;
    if (log.kind === "workout") Object.assign(patch, { sets: num("sets"), reps: num("reps"), weight: num("weight") });
    if (log.kind === "shopping") patch.price = num("price");
    if (isMeal) Object.assign(patch, { kcal: num("kcal"), protein: num("protein"), carbs: num("carbs"), fat: num("fat") });
    if (log.kind === "sleep") {
      patch.start = sleepStart ? new Date(sleepStart).toISOString() : d.start;
      patch.end = sleepEnd ? new Date(sleepEnd).toISOString() : null;
    }
    const at = log.kind === "sleep" && sleepStart ? new Date(sleepStart) : new Date(when);
    updateLog(log.id, { data: patch, at });
    onClose();
  };

  const del = () => {
    // Using something from storage and then deleting the record puts it back.
    if (log.kind === "use" && d.pantry_id) {
      update((x) => ({ ...x, pantry: x.pantry.map((p) => (p.id === d.pantry_id ? { ...p, qty: p.qty + Number(d.qty ?? 1) } : p)) }));
    }
    deleteLog(log.id);
    onClose();
  };

  const field = (k: string, label: string, mode: "numeric" | "decimal" | "text" = "numeric") => (
    <label className="text-xs text-muted">{label}
      <input className="input mt-1" inputMode={mode === "text" ? undefined : mode} value={f[k] ?? ""} onChange={set(k)} />
    </label>
  );

  return (
    <Sheet title={`${desc.emoji} ${desc.title}`} onClose={onClose}>
      {log.kind === "sleep" ? (
        <div className="grid grid-cols-1 gap-2">
          <label className="text-xs text-muted">Fell asleep<input type="datetime-local" className="input mt-1" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} /></label>
          <label className="text-xs text-muted">Woke up<input type="datetime-local" className="input mt-1" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} /></label>
          {sleepStart && sleepEnd && <p className="text-sm text-[var(--accent2)]">Slept {fmtDuration(new Date(sleepEnd).getTime() - new Date(sleepStart).getTime())}</p>}
        </div>
      ) : (
        <label className="text-xs text-muted">Date and time<input type="datetime-local" className="input mt-1" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(log.kind === "water" || log.kind === "milk") && field("ml", "Amount (ml)")}
        {["reading", "listening", "activity", "focus"].includes(log.kind) && field("minutes", "Minutes")}
        {["reading", "listening"].includes(log.kind) && field("title", "Title", "text")}
        {log.kind === "workout" && <>{field("sets", "Sets")}{field("reps", "Reps")}{field("weight", "Weight (kg)", "decimal")}</>}
        {log.kind === "shopping" && field("price", "Price", "decimal")}
        {isMeal && <>{field("kcal", "kcal")}{field("protein", "Protein g")}{field("carbs", "Carbs g")}{field("fat", "Fat g")}</>}
      </div>
      <label className="text-xs text-muted">Note<input className="input mt-1" value={f.note ?? ""} onChange={set("note")} placeholder="Anything to remember" /></label>
      <div className="flex gap-2 pt-1">
        <button onClick={del} className="btn-ghost text-rose-400">Delete</button>
        <button onClick={save} className="btn-primary flex-1">Save</button>
      </div>
    </Sheet>
  );
}

function AddEntry({ day, onClose }: { day: string; onClose: () => void }) {
  const { logActivity } = useApp();
  const { items } = useCustomItems("activity");
  const [when, setWhen] = useState(dtLocal(atFor(day)));
  const [pick, setPick] = useState<string>("");
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");

  const isSleep = pick === "__sleep";
  const label = pick && !isSleep ? items.find((i) => i.id === pick)?.name ?? "" : name;

  const save = () => {
    if (isSleep) {
      logActivity("sleep", { start: new Date(when).toISOString(), end: sleepEnd ? new Date(sleepEnd).toISOString() : null, note: note || undefined }, new Date(when));
    } else {
      const it = items.find((i) => i.id === pick);
      const n = (it?.name ?? name).trim();
      if (!n) return;
      logActivity("activity", { name: n, emoji: it?.config.emoji ?? emojiFor(n), minutes: minutes ? Number(minutes) : undefined, note: note || undefined }, new Date(when));
    }
    onClose();
  };

  return (
    <Sheet title="Add to this day" onClose={onClose}>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        <button onClick={() => setPick("__sleep")} className={`chip ${isSleep ? "chip-on" : ""}`}>😴 Sleep / nap</button>
        {items.map((i) => (
          <button key={i.id} onClick={() => setPick(i.id)} className={`chip ${pick === i.id ? "chip-on" : ""}`}>
            {String(i.config.emoji ?? emojiFor(i.name))} {i.name}
          </button>
        ))}
      </div>
      {!pick && (
        <input className="input" placeholder="Or type anything (e.g. Football)" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      {label && !isSleep && <p className="text-sm">{emojiFor(label)} {label}</p>}
      <label className="text-xs text-muted">{isSleep ? "Fell asleep" : "When"}
        <input type="datetime-local" className="input mt-1" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      {isSleep ? (
        <label className="text-xs text-muted">Woke up
          <input type="datetime-local" className="input mt-1" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} /></label>
      ) : (
        <label className="text-xs text-muted">How long (minutes, optional)
          <input className="input mt-1" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
      )}
      <label className="text-xs text-muted">Note<input className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button onClick={save} disabled={!pick && !name.trim()} className="btn-primary w-full">Add</button>
    </Sheet>
  );
}
