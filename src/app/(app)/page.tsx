"use client";

import { MainActions, SleepWakeTiles } from "@/components/MainActions";
import { DailyMission } from "@/components/DailyMission";
import { DoingCard } from "@/components/Doing";
import { EditLog } from "@/components/EditLog";
import { WhenPicker } from "@/components/When";
import { useEffect, useState } from "react";
import { Pic } from "@/components/Pic";
import { MEDIA, type MediaType } from "@/lib/media";
import { dtLocal, fmtTime, Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { daySummary, describe } from "@/lib/describe";
import { emojiFor } from "@/lib/emoji";
import Link from "next/link";
import { Blocks } from "@/components/Blocks";
import { today, toDay, useApp, useCustomItems, useLogs, type Log } from "@/lib/store";

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

  const { profile, data } = useApp();
  const { logs } = useLogs(day);
  const settings = profile.settings;
  const isToday = day === today();
  const [editing, setEditing] = useState<Log | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Log | null>(null);

  const hour = new Date().getHours();
  const greet = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const summary = daySummary(logs, settings.currency);
  const dateLabel = new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <XpHeader title={isToday ? "Home" : "Day record"} icon="🏠" subtitle={isToday ? `${greet}, ${profile.display_name}.` : undefined} />
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
      <Blocks page="/" parts={{
        mission: isToday ? <DailyMission /> : null,
        actions: isToday ? <MainActions page="/" /> : null,
      }} />

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">📜 {isToday ? "Today's records" : "Records"}</h2>
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
      {adding && <AddEntry day={day} onClose={() => setAdding(false)} />}
    </>
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

