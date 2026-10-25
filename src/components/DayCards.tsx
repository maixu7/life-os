"use client";

import { useEffect, useMemo, useState } from "react";
import { assistantSay, stopSpeaking } from "@/components/Assistant";
import { CloseX } from "@/components/CloseX";
import { useBackCloses } from "@/components/Sheet";
import { assistantOf } from "@/lib/assistant";
import { steps, type Step } from "@/lib/mission";
import { fmt12, sched, sleepTimes, toMin } from "@/lib/schedule";
import { toDay, useApp, type Data } from "@/lib/store";

// ☀️ Morning briefing: the first time the app opens in the morning, today at a
// glance (how you woke, the next things to do, workout, study, water, exam
// countdown and the top 3 you planned last night), read aloud if you like.
// 🌙 Night review: an hour before bed, how today went, 3 good things, your mood
// and the top 3 for tomorrow (saved as a "review" record, shown tomorrow morning).

const seen = (k: string) => { try { return localStorage.getItem(k) === "1"; } catch { return true; } };
const mark = (k: string) => { try { localStorage.setItem(k, "1"); } catch {} };
const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Last night's plan for today (from the night review). */
export function plannedToday(d: Data, day: string): string[] {
  const y = toDay(new Date(new Date(`${day}T12:00:00`).getTime() - 86_400_000));
  const r = [...d.logs].reverse().find((l) => l.kind === "review" && (l.day === y || l.day === day) && Array.isArray(l.data.tomorrow));
  return r ? (r.data.tomorrow as string[]).filter(Boolean) : [];
}

export function DayCards() {
  const { data } = useApp();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const day = toDay(now);
  const s = sched(data.profile.settings.schedule);
  const bed = toMin(sleepTimes(s, new Date(`${day}T20:00:00`)).sleep);
  const m = nowMin(now);
  const a = assistantOf(data.profile.settings);
  const morning = a.briefing && m >= 4 * 60 && m < 12 * 60 && !seen(`lifeos-brief-${day}`);
  // From an hour before bed (a bedtime after midnight counts too), once a day.
  const evening = a.review && !seen(`lifeos-review-${day}`) && (bed >= 5 * 60 ? m >= Math.max(bed - 60, 12 * 60) : m >= bed + 1380 || m < bed);
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  if (morning) return <Briefing now={now} onClose={() => { mark(`lifeos-brief-${day}`); stopSpeaking(); setClosed(true); }} />;
  if (evening) return <Review now={now} onClose={() => { mark(`lifeos-review-${day}`); setClosed(true); }} />;
  return null;
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useBackCloses(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} data-noedit className="fixed inset-0 z-[65] bg-[var(--bg,#070512)] overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="relative mx-auto max-w-md space-y-3"><CloseX onClose={onClose} />{children}</div>
    </div>
  );
}

function Briefing({ now, onClose }: { now: Date; onClose: () => void }) {
  const { data } = useApp();
  const a = assistantOf(data.profile.settings);
  const day = toDay(now);
  const list = useMemo(() => steps(data, day, now), [data, day, now]);
  const wake = list.find((x) => x.id === "b-wake");
  const next = list.filter((x) => x.state !== "done" && !x.id.endsWith("-end") && toMin(x.time) >= nowMin(now) - 30).slice(0, 6);
  const find = (re: RegExp) => list.find((x: Step) => re.test(x.id) && x.state !== "done");
  const work = find(/^a-fit-1$|^b-exercise$|^a-train/), study = find(/^b-study$/);
  const plan = plannedToday(data, day);
  const exam = data.profile.settings.exam_date ? Math.ceil((new Date(data.profile.settings.exam_date).getTime() - now.getTime()) / 86_400_000) : null;
  const name = data.profile.display_name || "there";
  const water = data.profile.settings.water_goal_ml;
  const woke = wake?.state === "done" && wake.diff != null ? (wake.diff > 4 ? `You got up ${wake.diff} min late; the morning has moved to fit.` : wake.diff < -4 ? `You got up ${-wake.diff} min early. Great start.` : "You got up on time.") : "";
  const speech = [`Good morning ${name}.`, woke, next[0] && `First: ${next[0].label} at ${fmt12(next[0].time)}.`, work && `Workout at ${fmt12(work.time)}.`, study && `Study at ${fmt12(study.time)}.`,
    plan.length ? `Your top ${plan.length} for today: ${plan.join(", ")}.` : "", exam != null && exam >= 0 ? `${exam} days until your exam.` : ""].filter(Boolean).join(" ");
  return (
    <Shell title="Morning briefing" onClose={onClose}>
      <div className="text-xs font-semibold tracking-widest uppercase text-[var(--accent2)]">{a.name}</div>
      <h2 className="text-2xl font-bold">☀️ Good morning, {name}</h2>
      <p className="text-sm text-muted">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
      {woke && <p className="card p-3 text-sm">🌅 {woke}</p>}
      {plan.length > 0 && <div className="card p-3"><div className="text-xs text-muted mb-1">Your top {plan.length} (planned last night)</div>{plan.map((p, i) => <div key={i} className="text-sm">{i + 1}. {p}</div>)}</div>}
      <div className="card p-3 space-y-1.5">
        <div className="text-xs text-muted">Next up</div>
        {next.length ? next.map((x) => <div key={x.id} className="flex items-center gap-2 text-sm"><span className="w-16 text-xs text-muted">{fmt12(x.time)}</span><span>{x.icon}</span><span className="flex-1 truncate">{x.label}</span></div>) : <p className="text-sm">Nothing left on the list.</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="card p-2"><div className="text-xl">🏋️</div><div className="text-xs">{work ? fmt12(work.time) : "Rest day"}</div></div>
        <div className="card p-2"><div className="text-xl">📚</div><div className="text-xs">{study ? fmt12(study.time) : "No study block"}</div></div>
        <div className="card p-2"><div className="text-xl">💧</div><div className="text-xs">{water} ml today</div></div>
        <div className="card p-2"><div className="text-xl">🎯</div><div className="text-xs">{exam != null && exam >= 0 ? `${exam} days to exam` : "No exam set"}</div></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost !py-3" onClick={() => assistantSay(speech, { ...a, audio: true, output: "both" })}>▶ Read aloud</button>
        <button className="btn-primary !py-3" onClick={onClose}>Start my day</button>
      </div>
    </Shell>
  );
}

function Review({ now, onClose }: { now: Date; onClose: () => void }) {
  const { data, logActivity } = useApp();
  const day = toDay(now);
  const list = useMemo(() => steps(data, day, now), [data, day, now]);
  const done = list.filter((x) => x.state === "done").length, missed = list.filter((x) => x.state === "missed").length;
  const [mood, setMood] = useState(0);
  const [wins, setWins] = useState("");
  const [top, setTop] = useState(["", "", ""]);
  const save = () => {
    logActivity("review", { mood: mood || undefined, wins: wins.trim() || undefined, tomorrow: top.map((x) => x.trim()).filter(Boolean), done, missed });
    onClose();
  };
  return (
    <Shell title="Night review" onClose={onClose}>
      <h2 className="text-2xl font-bold">🌙 How did today go?</h2>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="card p-3"><div className="text-2xl font-black text-emerald-400">{done}</div><div className="text-xs text-muted">done</div></div>
        <div className="card p-3"><div className="text-2xl font-black text-rose-400">{missed}</div><div className="text-xs text-muted">missed</div></div>
      </div>
      <div className="text-sm">Mood</div>
      <div className="flex gap-1">{["😞", "😕", "😐", "🙂", "😄"].map((e, i) => <button key={e} onClick={() => setMood(i + 1)} className={`chip flex-1 justify-center !py-2 text-xl ${mood === i + 1 ? "chip-on" : ""}`}>{e}</button>)}</div>
      <label className="block text-sm">3 good things today<textarea className="input mt-1 min-h-20 text-sm" value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Small wins count" /></label>
      <div className="text-sm">Top 3 for tomorrow</div>
      {top.map((t, i) => <input key={i} className="input" placeholder={`${i + 1}.`} value={t} onChange={(e) => setTop((x) => x.map((y, j) => (j === i ? e.target.value : y)))} />)}
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost !py-3" onClick={onClose}>Not tonight</button>
        <button className="btn-primary !py-3" onClick={save}>Save</button>
      </div>
    </Shell>
  );
}
