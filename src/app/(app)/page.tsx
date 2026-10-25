"use client";

import { isGame } from "@/lib/assistant";
import { MainActions, SleepWakeTiles } from "@/components/MainActions";
import { DailyMission } from "@/components/DailyMission";
import { GuideCard } from "@/components/Guide";
import { DoingCard } from "@/components/Doing";
import { EditLog } from "@/components/EditLog";
import { WhenPicker } from "@/components/When";
import { useEffect, useMemo, useState } from "react";
import { isNapTime, optionsFor } from "@/lib/slots";
import { CoachCard } from "@/components/Coach";
import { ExamTarget, FocusButton } from "@/components/ExamHome";
import { GapsCard } from "@/components/Gaps";
import { MealSheet, MealsCard, MEALS } from "@/components/Meals";
import { GaugesCard } from "@/components/Gauges";
import { LearnToday } from "@/components/Learn";
import { HabitQuests } from "@/components/Habits";
import { ActivitySheet } from "@/components/ActivitySheet";
import { Library } from "@/components/Library";
import { Pic } from "@/components/Pic";
import { LiquidGlass } from "@/components/LiquidGlass";
import { MEDIA, type MediaType } from "@/lib/media";
import { dtLocal, fmtDuration, fmtTime, Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { daySummary, describe } from "@/lib/describe";
import { emojiFor } from "@/lib/emoji";
import { chestOpenedToday, rollChest } from "@/lib/economy";
import { sumMl } from "@/lib/goals";
import { logKarma } from "@/lib/karma";
import { KIND_TOPIC, line } from "@/lib/lore";
import { dailyMissions, streak, weeklyBoss, type Mission } from "@/lib/missions";
import Link from "next/link";
import { Blocks, openSlotSheet } from "@/components/Blocks";
import { askDetails } from "@/components/Details";
import { arrange } from "@/lib/layout";
import { CareCard } from "@/components/CareCard";
import { FixCard } from "@/components/FixCard";
import { DrinkSheet } from "@/components/Drinks";
import { TaskLog } from "@/components/TaskLog";
import { Nudges } from "@/components/Safety";
import { DayScoreChip } from "@/components/Review";
import { PinsCard } from "@/components/hub/Hub";
import { MorningCard } from "@/components/hub/Plan";
import { EventCard, RivalCard } from "@/components/hub/Play";
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
  const [codeOpen, setCodeOpen] = useState(0);
  useEffect(() => {
    const go = (what: string) => {
      if (what === "library") return setLibOpen((n) => n + 1);
      if (!what.startsWith("activity:")) return;
      const name = what.slice(9);
      if (/^coding$/i.test(name)) return setCodeOpen((n) => n + 1);
      setActItem(activityItems.find((i) => i.name.toLowerCase() === name.toLowerCase())
        ?? { id: `tmp-${name}`, category: "activity", name, config: { emoji: emojiFor(name) }, sort: 0 });
    };
    const q = new URLSearchParams(location.search).get("do");
    if (q) { history.replaceState(null, "", "/"); go(q); }
    const on = (e: Event) => go(String((e as CustomEvent).detail));
    window.addEventListener("lifeos-do", on);
    return () => window.removeEventListener("lifeos-do", on);
  }, [activityItems]);

  const { profile, celebrate, data } = useApp();
  const { logs } = useLogs(day);
  const settings = profile.settings;
  const show = (id: string) => arrange(settings.ui, "/").some((x) => x.id === id);
  const missions = dailyMissions(logs, settings);
  const goals = missions;
  const doneCount = missions.filter((g) => g.done).length;
  const [brief, setBrief] = useState<Mission | null>(null);
  const isToday = day === today();
  const [editing, setEditing] = useState<Log | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Log | null>(null);
  const [drinkOpen, setDrinkOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
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


  const hour = new Date().getHours();
  const greet = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const summary = daySummary(logs, settings.currency);
  const game = isGame(settings);
  const dateLabel = new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <XpHeader title={isToday ? (game ? "Base Camp" : "Home") : "Day record"} icon="🏯" subtitle={isToday ? (game ? `${greet}, hero. ${doneCount}/6 missions cleared.` : `${greet}, ${profile.display_name}. ${doneCount}/6 daily goals done.`) : undefined} />

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
        <Link href="/today" aria-label="Today's table" title="Today's table" className="btn-ghost h-10 w-10 !p-0 grid place-items-center text-lg">📋</Link>
      </div>

      {isToday && <SleepWakeTiles />}
      {isToday && <DoingCard />}
      {isToday && <Nudges />}
      <Blocks page="/" parts={{
        mission: isToday ? <DailyMission /> : null,
        actions: isToday ? <MainActions page="/" /> : null,
        guide: isToday ? <GuideCard /> : null,
        score: <DayScoreChip day={day} />,
        focus: isToday ? <FocusButton /> : null,
        exam: isToday ? <ExamTarget /> : null,
        pins: isToday ? <PinsCard /> : null,
        routine: isToday ? <MorningCard /> : null,
        event: isToday && game ? <EventCard /> : null,
        rival: isToday && game ? <RivalCard /> : null,
        coach: isToday ? <CoachCard /> : null,
        learn: isToday ? <LearnToday compact /> : null,
        gaps: isToday ? <GapsCard /> : null,
        fix: isToday ? <FixCard open={false} /> : null,
        care: isToday ? <CareCard /> : null,
        sleep: isToday ? <SleepCard onLogged={setToast} /> : null,
        meals: isToday ? <MealsCard /> : null,
        gauges: isToday ? <GaugesCard /> : null,
        boss: isToday && game ? <BossAndChest /> : null,
        missions: (
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">{game ? "⚔ Daily missions" : "🎯 Daily goals"}</h2>
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
        ),
        potions: (
      <>
      <h2 className="section-title mb-2">🧪 Potions</h2>
      <section className="grid grid-cols-2 gap-3 mb-4">
        <LiquidGlass label="Water" color="#46c8ff" ml={sumMl(logs, "water")} goal={settings.water_goal_ml}
          onAdd={() => openSlotSheet({ kind: "drink", cat: "water" })} />
        <LiquidGlass label="Milk" color="#fff6e8" ml={sumMl(logs, "milk")} goal={settings.milk_goal_ml}
          onAdd={() => openSlotSheet({ kind: "drink", cat: "milk" })} />
      </section>
      <button onClick={() => setDrinkOpen(true)} className="btn-ghost w-full mb-4 border border-dashed border-white/25 text-sm">🥤 Other drinks: tea, coffee, sports drink, cola, soy milk, juice…</button>
      {drinkOpen && <DrinkSheet at={atFor(day)} onClose={() => setDrinkOpen(false)} />}
      </>
        ),
        quests: (
          <>
      <button onClick={() => setTaskOpen(true)} className="btn-ghost w-full mb-3 border border-dashed border-white/25 text-sm">📝 Log anything you did (2,000+ tasks, good or bad decided for you)</button>
      {taskOpen && <TaskLog at={atFor(day)} onClose={() => setTaskOpen(false)} />}
      <Activities onLog={(a) => (/^coding$/i.test(a.name) ? setCodeOpen((n) => n + 1) : setActItem(a))} />
          </>
        ),
        habits: isToday ? <HabitQuests /> : null,
        library: <Library at={() => atFor(day)} onLogged={setToast} openSignal={libOpen} codeSignal={codeOpen} />,
        pantry: <PantryStrip day={day} onLogged={setToast} />,
      }} />
      {/* The library keeps working (voice, Sensei's orders) even when hidden. */}
      {!show("library") && <div className="hidden"><Library at={() => atFor(day)} onLogged={setToast} openSignal={libOpen} codeSignal={codeOpen} /></div>}


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
                    {l.data.photo ? (
                      <Pic name="" src={String(l.data.photo)} emoji={d.emoji} size={32} className="relative z-10 !rounded-full border border-white/10" />
                    ) : picName(l) ? (
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
          <button aria-label="Close" onClick={() => setToast(null)} className="grid h-10 w-10 -my-2 -mr-2 place-items-center rounded-full text-muted hover:bg-white/10">✕</button>
        </div>
      )}
      {editing && <EditLog log={editing} onClose={() => setEditing(null)} />}
      {brief && <MissionBrief m={missions.find((x) => x.id === brief.id) ?? brief} onClose={() => setBrief(null)} />}
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

  const wake = (at = new Date()) => {
    const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
    if (open) updateLog(open.id, { data: { end: at.toISOString() } });
    const row = logActivity("wake", { time, slept_from: open?.data.start ?? null }, at);
    celebrate({ title: "OHAYO!", subtitle: open ? `You slept ${fmtDuration(at.getTime() - new Date(String(open.data.start)).getTime())}` : `Woke up at ${fmtTime(at.toISOString())}`, xp: row.xp });
    onLogged(row);
  };
  const sleep = (at = new Date()) => {
    const nap = isNapTime(at);
    const row = logActivity("sleep", { start: at.toISOString(), end: null, type: nap ? "nap" : "night" }, at);
    celebrate({ title: nap ? "POWER NAP!" : "OYASUMI!", subtitle: nap ? "Day nap started. 20–30 min recharges best." : "Night sleep started. Tonight your day's work fights the demon. Sleep well, hero." });
    onLogged(row);
  };
  const [ask, setAsk] = useState<"sleep" | "wake" | null>(null);
  const sheet = ask && <SleepWakeSheet kind={ask} since={open ? new Date(String(open.data.start)) : null} onClose={() => setAsk(null)} onSave={(at) => { (ask === "wake" ? wake : sleep)(at); setAsk(null); }} />;

  if (open) {
    const since = new Date(String(open.data.start));
    return (
      <section className="card mb-4 p-5 text-center bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="text-4xl">😴</div>
        <div className="mt-1 font-bold">Sleeping since {fmtTime(open.data.start as string)}</div>
        <div className="text-3xl font-black tabular-nums glow-text">{fmtDuration(Date.now() - since.getTime())}</div>
        <div className="mt-3">
          <button onClick={() => setAsk("wake")} className="btn-primary text-lg w-full">☀️ I woke up…</button>
        </div>
        {sheet}
      </section>
    );
  }
  const tile = (kind: "sleep" | "wake", icon: string, title: string, sub: string, cls: string) => (
    <div className={`card relative p-3 flex flex-col gap-2 ${cls}`}>
      <button onClick={() => setAsk(kind)} className="flex items-center gap-2 text-left active:scale-95 transition">
        <span className="text-3xl">{icon}</span>
        <span className="min-w-0"><span className="block font-bold leading-tight">{title}</span><span className="text-[11px] text-muted">{sub}</span></span>
      </button>
    </div>
  );
  return (
    <section className="grid grid-cols-2 gap-3 mb-4">
      {tile("sleep", "🌙", isNapTime() ? "Taking a nap" : "Going to sleep", "Tap to pick the time", "bg-gradient-to-br from-indigo-500/25 to-transparent")}
      {tile("wake", "☀️", "Woke up", "Tap to pick the time", "bg-gradient-to-br from-amber-400/25 to-transparent")}
      {sheet}
    </section>
  );
}

// "When did you really wake up / fall asleep?" e.g. bathroom first, log 40 min later.
function SleepWakeSheet({ kind, since, onClose, onSave }: { kind: "sleep" | "wake"; since: Date | null; onClose: () => void; onSave: (at: Date) => void }) {
  const [when, setWhen] = useState(dtLocal(new Date()));
  const at = new Date(when);
  const bad = since && at.getTime() <= since.getTime();
  return (
    <Sheet title={kind === "wake" ? "☀️ When did you wake up?" : "🌙 When did you fall asleep?"} onClose={onClose}>
      <p className="text-xs text-muted">{kind === "wake" ? "Went to the bathroom first? Pick how long ago you really woke up." : "Pick when you actually fell asleep."}</p>
      <WhenPicker label={kind === "wake" ? "Woke up at" : "Fell asleep at"} value={when} onChange={setWhen} />
      {since && !bad && <p className="text-sm text-[var(--accent2)]">You slept {fmtDuration(at.getTime() - since.getTime())}</p>}
      {bad && <p className="text-sm text-rose-300">That is before you went to sleep ({fmtTime(since.toISOString())}).</p>}
      <button disabled={!!bad} onClick={() => onSave(at)} className="btn-primary w-full">Save</button>
    </Sheet>
  );
}

type ActForm = { id?: string; name: string; emoji: string; alignment?: string; options: string[]; goal: string; minutes: string };

function Activities({ onLog }: { onLog: (a: CustomItem) => void }) {
  const { data } = useApp();
  const { items, add, update, remove } = useCustomItems("activity");
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<ActForm | null>(null);
  const [mini, setMini] = useState("");
  const day = toDay(new Date());
  const doneToday = (name: string) => data.logs.filter((l) => l.day === day && l.kind === "activity" && String(l.data.name).toLowerCase() === name.toLowerCase()).length;
  const open = (a?: CustomItem) => {
    setMini("");
    setForm(a ? {
      id: a.id, name: a.name, emoji: String(a.config.emoji ?? emojiFor(a.name)), alignment: a.config.alignment as string | undefined,
      options: Array.isArray(a.config.options) ? (a.config.options as string[]) : optionsFor(a.name),
      goal: a.config.goal ? String(a.config.goal) : "", minutes: a.config.minutes ? String(a.config.minutes) : "",
    } : { name: "", emoji: "", options: [], goal: "", minutes: "" });
  };
  const move = (a: CustomItem, dir: -1 | 1) => {
    const i = items.indexOf(a), b = items[i + dir];
    if (!b) return;
    update(a.id, { sort: b.sort }); update(b.id, { sort: a.sort === b.sort ? a.sort + dir : a.sort });
  };

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">🗺 Side quests</h2>
        <button onClick={() => setEdit(!edit)} className={`chip ${edit ? "chip-on" : ""}`}>{edit ? "Done" : "Edit"}</button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {items.map((a) => {
          const goal = Number(a.config.goal) || 0, n = doneToday(a.name);
          return (
            <div key={a.id} className="relative">
              <button onClick={() => (edit ? open(a) : onLog(a))}
                className={`w-full rounded-2xl border border-white/10 bg-white/[.04] py-3 px-1 flex flex-col items-center gap-1 active:scale-95 transition ${edit ? "ring-1 ring-[var(--accent)]/60" : "hover:bg-white/10"} ${goal && n >= goal ? "!border-emerald-400/60" : ""}`}>
                <span className="text-2xl">{String(a.config.emoji ?? emojiFor(a.name))}</span>
                <span className="text-[11px] leading-tight text-center line-clamp-2">{a.name}</span>
                {goal > 0 && !edit && <span className={`text-[9px] ${n >= goal ? "text-emerald-300" : "text-muted"}`}>{n >= goal ? "✓ " : ""}{Math.min(n, goal)}/{goal}</span>}
                {edit && <span className="absolute top-1 right-1.5 text-[10px] text-[var(--accent)]">✎</span>}
              </button>
              {edit && (
                <div className="flex justify-between mt-0.5">
                  <button aria-label={`Move ${a.name} left`} onClick={() => move(a, -1)} className="text-[10px] text-muted px-1">◀</button>
                  <button aria-label={`Move ${a.name} right`} onClick={() => move(a, 1)} className="text-[10px] text-muted px-1">▶</button>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={() => open()}
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
          <p className="text-xs text-muted">The picture is picked automatically from the name. Tap it to type any emoji.</p>
          <div className="flex flex-wrap gap-1.5">
            {["🛁", "🚿", "🪥", "📚", "💻", "🏃", "🧘", "🍳", "🧹", "🎸", "🎨", "🙏", "💊", "🐕", "🌱", "🛒"].map((e) => <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={`chip !px-2 !py-1 ${form.emoji === e ? "chip-on" : ""}`}>{e}</button>)}
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Mini tasks (e.g. Bath: hair wash, full body wash)</div>
            <div className="flex flex-wrap gap-1.5">
              {form.options.map((o) => <button key={o} onClick={() => setForm({ ...form, options: form.options.filter((x) => x !== o) })} className="chip chip-on !py-1 text-xs">{o} ✕</button>)}
              {!form.options.length && <span className="text-xs text-muted">None yet.</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <input className="input" placeholder="Add a mini task" value={mini} onChange={(e) => setMini(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && mini.trim()) { setForm({ ...form, options: [...form.options, mini.trim()] }); setMini(""); } }} />
              <button onClick={() => { if (mini.trim() && !form.options.includes(mini.trim())) { setForm({ ...form, options: [...form.options, mini.trim()] }); setMini(""); } }} className="btn-primary !px-3 text-sm">Add</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">Goal per day<input className="input mt-1" inputMode="numeric" placeholder="e.g. 1" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></label>
            <label className="text-xs text-muted">Usual minutes<input className="input mt-1" inputMode="numeric" placeholder="e.g. 20" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[["light", "😇 Light"], ["", "⚖️ Auto"], ["shadow", "😈 Shadow"]].map(([v, l]) => (
              <button key={v} onClick={() => setForm({ ...form, alignment: v || undefined })}
                className={`chip py-2 ${(form.alignment ?? "") === v ? "chip-on" : ""}`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {form.id && (
              <button onClick={() => { if (confirm(`Delete ${form.name}? Past logs stay.`)) { remove(form.id!); setForm(null); } }} className="btn-ghost text-rose-400">Delete</button>
            )}
            <button className="btn-primary flex-1" disabled={!form.name.trim()} onClick={() => {
              const prev = items.find((i) => i.id === form.id)?.config ?? {};
              const config = { ...prev, emoji: form.emoji || emojiFor(form.name), alignment: form.alignment, options: form.options,
                goal: Number(form.goal) || undefined, minutes: Number(form.minutes) || undefined };
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

function PantryStrip({ onLogged }: { day: string; onLogged: (l: Log) => void }) {
  const { data, update } = useApp();
  const stock = data.pantry.filter((p) => p.qty > 0);
  if (!stock.length) return null;
  const use = (id: string) => {
    const p = data.pantry.find((x) => x.id === id)!;
    askDetails({
      title: `Used ${p.name}`, icon: p.emoji, kind: "use", data: { pantry_id: id, name: p.name, emoji: p.emoji, unit: p.unit }, ask: "count", unit: p.unit, start: 1,
      after: (row) => {
        const n = Number(row.data.n) || 1;
        update((d) => ({ ...d, pantry: d.pantry.map((x) => (x.id === id ? { ...x, qty: Math.max(0, +(x.qty - n).toFixed(2)), updated_at: new Date().toISOString() } : x)) }));
        onLogged({ ...row, data: { ...row.data, qty: n } });
      },
    });
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
      <WhenPicker label={isSleep ? "Fell asleep" : "When"} value={when} onChange={setWhen} />
      {isSleep ? (
        <WhenPicker label="Woke up" value={sleepEnd} onChange={setSleepEnd} />
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

function MissionBrief({ m, onClose }: { m: Mission; onClose: () => void }) {
  const [advice] = useState(() => line(KIND_TOPIC[m.topic] ?? m.topic));
  const [meal, setMeal] = useState<string | null>(null);
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
            <button className="btn-primary col-span-2" onClick={() => { onClose(); openSlotSheet({ kind: "drink", cat: "water" }); }}>💧 Log water…</button>
          </>}
          {m.id === "milk" && <>
            <button className="btn-primary col-span-2" onClick={() => { onClose(); openSlotSheet({ kind: "drink", cat: "milk" }); }}>🥛 Log milk…</button>
          </>}
          {m.id === "wake" && <button className="btn-primary col-span-2" onClick={() => { onClose(); openSlotSheet({ kind: "wake" }); }}>☀️ I&apos;m awake…</button>}
          {m.id === "meal" && MEALS.map(([n, e]) => (
            <button key={n} className="btn-primary" onClick={() => setMeal(n)}>{e} {n}</button>
          ))}
          {meal && <MealSheet meal={meal} onClose={() => { setMeal(null); onClose(); }} />}
          {m.href && <Link href={m.href} className="btn-primary btn-hot col-span-2 text-center">Accept mission ➜</Link>}
        </div>
      )}
    </Sheet>
  );
}
