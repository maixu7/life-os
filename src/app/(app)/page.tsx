"use client";

import { useEffect, useMemo, useState } from "react";
import { isNapTime } from "@/lib/slots";
import { CoachCard } from "@/components/Coach";
import { HabitQuests } from "@/components/Habits";
import { ActivitySheet } from "@/components/ActivitySheet";
import { Library } from "@/components/Library";
import { Pic } from "@/components/Pic";
import { LiquidGlass } from "@/components/LiquidGlass";
import { MEDIA, type MediaType } from "@/lib/media";
import { dtLocal, fmtDuration, fmtTime, Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { daySummary, describe, MEAL_NAMES } from "@/lib/describe";
import { emojiFor } from "@/lib/emoji";
import { chestOpenedToday, rollChest } from "@/lib/economy";
import { sumMl } from "@/lib/goals";
import { logKarma } from "@/lib/karma";
import { KIND_TOPIC, line } from "@/lib/lore";
import { dailyMissions, streak, weeklyBoss, type Mission } from "@/lib/missions";
import Link from "next/link";
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

// Records about real things get a real picture in the chronicle.
const picName = (l: Log) =>
  l.kind === "media" ? String(l.data.title ?? "") : l.kind === "shopping" ? String(l.data.item ?? "") : l.kind === "use" || l.kind === "meal" ? String(l.data.name ?? "") : null;
const picHint = (l: Log) => MEDIA[l.data.type as MediaType]?.hint ?? "book";

export default function TodayPage() {
  const [day, setDay] = useState(today());
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("day");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setDay(q);
  }, []);

  // Sensei's orders that need details open here: ?do=activity:Name or ?do=library.
  const { items: activityItems } = useCustomItems("activity");
  const [libOpen, setLibOpen] = useState(0);
  useEffect(() => {
    const go = (what: string) => {
      if (what === "library") return setLibOpen((n) => n + 1);
      if (!what.startsWith("activity:")) return;
      const name = what.slice(9);
      setActItem(activityItems.find((i) => i.name.toLowerCase() === name.toLowerCase())
        ?? { id: `tmp-${name}`, category: "activity", name, config: { emoji: emojiFor(name) }, sort: 0 });
    };
    const q = new URLSearchParams(location.search).get("do");
    if (q) { history.replaceState(null, "", "/"); go(q); }
    const on = (e: Event) => go(String((e as CustomEvent).detail));
    window.addEventListener("lifeos-do", on);
    return () => window.removeEventListener("lifeos-do", on);
  }, [activityItems]);

  const { profile, logActivity, celebrate, data } = useApp();
  const { logs } = useLogs(day);
  const settings = profile.settings;
  const missions = dailyMissions(logs, settings);
  const goals = missions;
  const doneCount = missions.filter((g) => g.done).length;
  const [brief, setBrief] = useState<Mission | null>(null);
  const isToday = day === today();
  const [editing, setEditing] = useState<Log | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Log | null>(null);
  const [actItem, setActItem] = useState<CustomItem | null>(null);

  useEffect(() => {
    if (!isToday || doneCount !== goals.length) return;
    const key = `lifeos-perfect-${day}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    celebrate({ kind: "mission", title: "PERFECT STAGE!", subtitle: "Every mission cleared", big: true, icon: "🎆", quote: line("perfect") });
  }, [doneCount, goals.length, day, isToday, celebrate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const log = (kind: string, payload: Record<string, unknown>, title: string) => {
    const row = logActivity(kind, payload, atFor(day));
    const k = logKarma(row);
    celebrate({ title: k < 0 ? `🌒 THE SHADOW STIRS…` : title, xp: row.xp });
    setToast(row);
    return row;
  };

  const hour = new Date().getHours();
  const greet = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const summary = daySummary(logs, settings.currency);
  const dateLabel = new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <XpHeader title={isToday ? "Base Camp" : "Day record"} icon="🏯" subtitle={isToday ? `${greet}, hero. ${doneCount}/6 missions cleared.` : undefined} />

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

      {isToday && <CoachCard />}

      {isToday && <SleepCard onLogged={setToast} />}

      {isToday && <BossAndChest />}

      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">⚔ Daily missions</h2>
          <span className="font-game text-sm text-[var(--accent2)]">{doneCount}/{missions.length}</span>
        </div>
        <div className="space-y-2">
          {missions.map((m) => (
            <button key={m.id} onClick={() => setBrief(m)}
              className={`card frame w-full p-3 flex items-center gap-3 text-left transition active:scale-[.98] ${m.done ? "opacity-80" : ""}`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${m.done ? "bg-[var(--accent2)]/20" : "bg-white/5"}`}>{m.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-game text-sm font-bold truncate">{m.name}</span>
                </span>
                <span className="block text-xs text-muted truncate">{m.goal}</span>
                <span className="mt-1.5 block bar !h-1.5"><span className="block h-full rounded-full bg-[var(--accent2)] shadow-[0_0_8px_var(--accent2)] transition-all duration-700" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} /></span>
              </span>
              {m.done ? (
                <span className="animate-stamp font-game text-[10px] font-black text-[var(--accent2)] border-2 border-[var(--accent2)] rounded px-1.5 py-0.5">CLEAR</span>
              ) : (
                <span className="text-right shrink-0"><span className="block font-game text-xs text-[var(--accent2)]">+{m.reward}</span><span className="block text-[10px] text-muted">XP</span></span>
              )}
            </button>
          ))}
        </div>
      </section>

      <h2 className="section-title mb-2">🧪 Potions</h2>
      <section className="grid grid-cols-2 gap-3 mb-4">
        <LiquidGlass label="Water" color="#46c8ff" ml={sumMl(logs, "water")} goal={settings.water_goal_ml}
          onAdd={(ml) => log("water", { ml }, "GULP!")} />
        <LiquidGlass label="Milk" color="#fff6e8" ml={sumMl(logs, "milk")} goal={settings.milk_goal_ml}
          onAdd={(ml) => log("milk", { ml }, "STRONG BONES!")} />
      </section>

      <Activities onLog={setActItem} />

      {isToday && <HabitQuests />}

      <Library at={() => atFor(day)} onLogged={setToast} openSignal={libOpen} />

      <PantryStrip day={day} onLogged={setToast} />

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">📜 {isToday ? "Today's chronicle" : "Chronicle"}</h2>
          <button onClick={() => setAdding(true)} className="chip chip-on">+ Add</button>
        </div>
        {summary.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {summary.map((s) => <span key={s.icon} className="chip bg-white/5">{s.icon} {s.value}</span>)}
          </div>
        )}
        {logs.length > 0 && (() => {
          const good = logs.reduce((n, l) => n + Math.max(0, logKarma(l)), 0);
          const bad = logs.reduce((n, l) => n - Math.min(0, logKarma(l)), 0);
          return (
            <div className="flex gap-2 mb-3 text-xs">
              <span className="chip" style={{ color: "#ffe066" }}>😇 Good deeds +{good}</span>
              <span className="chip" style={{ color: "#ff6b9b" }}>😈 Bad deeds −{bad}</span>
            </div>
          );
        })()}
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
                    {picName(l) ? (
                      <Pic name={picName(l)!} hint={l.kind === "media" ? picHint(l) : ""} emoji={d.emoji} size={32} className="relative z-10 !rounded-full border border-white/10" />
                    ) : (
                      <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1c1330] border border-white/10 text-base">{d.emoji}</span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{d.title}</span>
                      {d.detail && <span className="block text-xs text-muted truncate">{d.detail}</span>}
                    </span>
                    {(() => { const k = logKarma(l); return k === 0 ? null : (
                      <span className={`text-[11px] font-bold tabular-nums ${k > 0 ? "text-[#ffe066]" : "text-[#ff6b9b]"}`}>{k > 0 ? `😇+${k}` : `😈${k}`}</span>
                    ); })()}
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
      {brief && <MissionBrief m={missions.find((x) => x.id === brief.id) ?? brief} onClose={() => setBrief(null)} log={log} />}
      {adding && <AddEntry day={day} onClose={() => setAdding(false)} />}
      {actItem && <ActivitySheet item={actItem} at={atFor(day)} onClose={() => setActItem(null)} onLogged={setToast} />}
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
        const nap = isNapTime();
        const row = logActivity("sleep", { start: new Date().toISOString(), end: null, type: nap ? "nap" : "night" });
        celebrate({ title: nap ? "POWER NAP!" : "OYASUMI!", subtitle: nap ? "Day nap started. 20–30 min recharges best." : "Night sleep started. Sleep well, hero." });
        onLogged(row);
      }} className="card p-4 flex items-center gap-3 active:scale-95 transition bg-gradient-to-br from-indigo-500/25 to-transparent">
        <span className="text-3xl">🌙</span>
        <span className="text-left"><span className="block font-bold">{isNapTime() ? "Taking a nap" : "Going to sleep"}</span><span className="text-xs text-muted">{isNapTime() ? "☀️ Day nap (auto)" : "🌙 Night sleep (auto)"}</span></span>
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
  const [form, setForm] = useState<{ id?: string; name: string; emoji: string; alignment?: string } | null>(null);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">🗺 Side quests</h2>
        <button onClick={() => setEdit(!edit)} className={`chip ${edit ? "chip-on" : ""}`}>{edit ? "Done" : "Edit"}</button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {items.map((a) => (
          <button key={a.id}
            onClick={() => (edit ? setForm({ id: a.id, name: a.name, emoji: String(a.config.emoji ?? emojiFor(a.name)), alignment: a.config.alignment as string | undefined }) : onLog(a))}
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
          <div className="grid grid-cols-3 gap-2">
            {[["light", "😇 Light"], ["", "⚖️ Auto"], ["shadow", "😈 Shadow"]].map(([v, l]) => (
              <button key={v} onClick={() => setForm({ ...form, alignment: v || undefined })}
                className={`chip py-2 ${(form.alignment ?? "") === v ? "chip-on" : ""}`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {form.id && (
              <button onClick={() => { remove(form.id!); setForm(null); }} className="btn-ghost text-rose-400">Delete</button>
            )}
            <button className="btn-primary flex-1" disabled={!form.name.trim()} onClick={() => {
              const config = { emoji: form.emoji || emojiFor(form.name), ...(form.alignment ? { alignment: form.alignment } : {}) };
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
      <h2 className="section-title mb-1">🎒 Inventory</h2>
      <p className="text-xs text-muted mb-3">Tap when you eat or use one.</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {stock.map((p) => (
          <button key={p.id} onClick={() => use(p.id)}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 flex items-center gap-2 active:scale-95">
            <Pic name={p.name} emoji={p.emoji} size={36} />
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
    if (["reading", "listening", "activity", "focus", "media"].includes(log.kind)) patch.minutes = num("minutes");
    if (["reading", "listening", "media"].includes(log.kind)) patch.title = f.title;
    if (log.kind === "media") Object.assign(patch, { type: f.type, emoji: MEDIA[f.type as MediaType]?.emoji, good: MEDIA[f.type as MediaType]?.good });
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
        {["reading", "listening", "activity", "focus", "media"].includes(log.kind) && field("minutes", "Minutes")}
        {["reading", "listening", "media"].includes(log.kind) && field("title", "Title", "text")}
        {log.kind === "workout" && <>{field("sets", "Sets")}{field("reps", "Reps")}{field("weight", "Weight (kg)", "decimal")}</>}
        {log.kind === "shopping" && field("price", "Price", "decimal")}
        {isMeal && <>{field("kcal", "kcal")}{field("protein", "Protein g")}{field("carbs", "Carbs g")}{field("fat", "Fat g")}</>}
      </div>
      {log.kind === "media" && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEDIA) as MediaType[]).map((t) => (
            <button key={t} onClick={() => setF({ ...f, type: t })} className={`chip ${f.type === t ? "chip-on" : ""}`}>{MEDIA[t].emoji} {MEDIA[t].label} {MEDIA[t].good ? "😇" : "😈"}</button>
          ))}
        </div>
      )}
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

function BossAndChest() {
  const { data, logActivity, celebrate } = useApp();
  const boss = weeklyBoss(data);
  const opened = chestOpenedToday(data);
  const openChest = () => {
    const r = rollChest(streak(data));
    logActivity("chest", { gold: r.gold, rare: r.rare }, new Date(), 0);
    celebrate({ kind: "achievement", big: true, icon: r.rare ? "💎" : "🎁", title: r.rare ? "RARE CHEST!" : "DAILY CHEST", subtitle: `+${r.gold} gold`, quote: line("morning") });
  };
  const pct = (boss.left / boss.hp) * 100;
  return (
    <section className="grid grid-cols-[1fr_auto] gap-3 mb-4">
      <div className="card frame p-3 overflow-hidden">
        <div className="flex items-center gap-3">
          <span className={`text-4xl ${boss.defeated ? "grayscale opacity-50" : "animate-float"}`}>{boss.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-game tracking-widest text-rose-300">WEEKLY BOSS</div>
            <div className="font-game text-sm font-bold truncate">{boss.name}</div>
            <div className="text-[11px] text-muted italic truncate">{boss.defeated ? "Defeated! Glory to the hero." : `"${boss.taunt}"`}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_#ff4d6d] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-game text-[10px] text-rose-300">{boss.left} HP</span>
        </div>
        <div className="mt-1 text-[10px] text-muted">Every XP you earn this week is damage.</div>
      </div>
      <button disabled={opened} onClick={openChest}
        className={`card w-24 flex flex-col items-center justify-center gap-1 ${opened ? "opacity-40" : "animate-pulse-glow"}`}>
        <span className={`text-4xl ${opened ? "" : "animate-shake"}`}>{opened ? "📭" : "🎁"}</span>
        <span className="font-game text-[10px]">{opened ? "OPENED" : "OPEN"}</span>
      </button>
    </section>
  );
}

function MissionBrief({ m, onClose, log }: { m: Mission; onClose: () => void; log: (k: string, p: Record<string, unknown>, t: string) => unknown }) {
  const [advice] = useState(() => line(KIND_TOPIC[m.topic] ?? m.topic));
  const pct = Math.min(100, (m.progress / m.target) * 100);
  return (
    <Sheet title={`${m.icon} ${m.name}`} onClose={onClose}>
      <div className="text-sm text-muted">{m.goal}</div>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      <div className="flex justify-between text-xs">
        <span>{m.unit ? `${m.progress} / ${m.target} ${m.unit}` : m.done ? "Cleared" : "Not yet"}</span>
        <span className="text-[var(--accent2)] font-game">Reward +{m.reward} XP</span>
      </div>
      <div className="card p-3 flex gap-3">
        <span className="text-3xl">🥷</span>
        <div><div className="font-game text-[10px] tracking-widest text-[var(--accent2)]">SENSEI KAITO</div><p className="text-sm">{advice}</p></div>
      </div>
      {m.done ? (
        <p className="text-center font-game text-[var(--accent2)]">✦ MISSION CLEARED ✦</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {m.id === "water" && <>
            <button className="btn-primary" onClick={() => log("water", { ml: 250 }, "GULP!")}>+250 ml</button>
            <button className="btn-primary" onClick={() => log("water", { ml: 500 }, "GULP GULP!")}>+500 ml</button>
          </>}
          {m.id === "milk" && <>
            <button className="btn-primary" onClick={() => log("milk", { ml: 250 }, "STRONG BONES!")}>+250 ml</button>
            <button className="btn-primary" onClick={() => log("milk", { ml: 500 }, "STRONG BONES!")}>+500 ml</button>
          </>}
          {m.id === "wake" && <button className="btn-primary col-span-2" onClick={() => {
            const d = new Date();
            log("wake", { time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }, "OHAYO!");
            onClose();
          }}>☀️ I&apos;m awake</button>}
          {m.id === "meal" && ["Breakfast", "Lunch", "Dinner", "Snack"].map((n) => (
            <button key={n} className="btn-primary" onClick={() => log("activity", { name: n, emoji: emojiFor(n) }, "ITADAKIMASU!")}>{emojiFor(n)} {n}</button>
          ))}
          {m.href && <Link href={m.href} className="btn-primary btn-hot col-span-2 text-center">Accept mission ➜</Link>}
        </div>
      )}
    </Sheet>
  );
}
