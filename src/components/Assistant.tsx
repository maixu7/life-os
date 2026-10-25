"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRunAction } from "@/components/Coach";
import { assistantOf, lateBy, needsDoing, sayFor, type AssistantSettings } from "@/lib/assistant";
import { steps, type Step } from "@/lib/mission";
import { fmt12, isQuiet, sched } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";
export { GameOnly, PlainWords } from "@/components/Plain";

// The assistant (replaces the game's characters): when a task on the Daily
// mission is late by a few minutes it says so on screen and out loud, with
// OK (go and do it) or Later (stay here). On opening the app it lists what
// was missed so far today, in time order, each with "Go to".

const ALERTED = "lifeos-alerted";
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function beep() {
  try {
    const ctx = new AudioContext();
    [880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = "sine";
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.32);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

/** Speak with the assistant's voice, rate and pitch (respects master audio, text-only and quiet hours). */
let pending: ReturnType<typeof setTimeout> | undefined;
/** Stop speaking now (also a sentence that is about to start after the chime). */
export function stopSpeaking() {
  clearTimeout(pending);
  try { speechSynthesis.cancel(); } catch {}
}
export function assistantSay(text: string, a: AssistantSettings, quiet = false) {
  if (!a.audio || a.output === "text" || quiet || typeof speechSynthesis === "undefined") return;
  stopSpeaking();
  if (a.chime) beep();
  pending = setTimeout(() => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim());
      const v = a.voice ? speechSynthesis.getVoices().find((x) => x.name === a.voice) : undefined;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
      u.rate = a.rate; u.pitch = a.pitch;
      speechSynthesis.speak(u);
    } catch {}
  }, a.chime ? 450 : 0);
}

type LogFn = (kind: string, data?: Record<string, unknown>, at?: Date) => unknown;
type UpdateFn = (id: string, patch: { data?: Record<string, unknown>; at?: Date }) => void;
/** Mark a Daily mission step done straight away, at its planned time (or now if that's still ahead). */
export function quickTick(s: Step, log: LogFn, logs: { id: string; kind: string; data: Record<string, unknown> }[], update: UpdateFn, live = false) {
  const today = toDay(new Date());
  const planned = new Date(`${today}T${s.time}:00`);
  // From the Daily mission (live) or for getting up: now, when it's within 1.5–2 hours of the
  // plan (so a late wake-up moves the morning); otherwise the planned time.
  const late = lateBy(s, new Date());
  const now = live ? late <= 120 : s.kind === "wake" && late <= 90;
  const at = now || planned > new Date() ? new Date() : planned;
  const end = s.end ? new Date(`${today}T${s.end}:00`) : undefined;
  const span = end && end > at && end <= new Date() ? { start: at.toISOString(), end: end.toISOString(), minutes: Math.round((end.getTime() - at.getTime()) / 60_000) } : {};
  const name = s.label.replace(/^(Start|Finish) /, "");
  if (s.kind === "wake") {
    const open = [...logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
    if (open) update(open.id, { data: { ...open.data, end: at.toISOString() } });
    log("wake", { time: s.time, slept_from: open?.data.start ?? null, routine: s.id }, at);
  } else if (s.kind === "sleep") log("sleep", { start: at.toISOString(), end: null, type: "night", routine: s.id }, at);
  else if (s.kind === "water") log("water", { ml: s.ml ?? 250, name: "Water", routine: s.id }, at);
  else if (s.id === "b-work-end") log("activity", { name, routine: "b-work", start: new Date(`${today}T${s.whole?.time ?? s.time}:00`).toISOString(), end: at.toISOString() }, at);
  else log(s.kind === "code" ? "coding" : "activity", { name, routine: s.id, ticked: true, ...span }, at);
}

function useGo() {
  const router = useRouter();
  const run = useRunAction();
  return useCallback((s: Step) => { if (s.href) router.push(s.href); else run(s.action); }, [router, run]);
}

export function AssistantLayer() {
  const { data, logActivity, updateLog, saveSettings } = useApp();
  const a = assistantOf(data.profile.settings);
  const go = useGo();
  const [now, setNow] = useState(() => new Date());
  const [alert, setAlert] = useState<Step | null>(null);
  // Every time the app opens, reloads or comes back to the screen: the catch-up list.
  const [catchup, setCatchup] = useState(() => a.catchup);
  const [battery, setBattery] = useState<number | null>(null);
  const day = toDay(now);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const list = useMemo(() => steps(data, day, now), [data, day, now]);
  const paused = !!a.pauseUntil && new Date(a.pauseUntil) > now;
  const quiet = isQuiet(sched(data.profile.settings.schedule), now);
  const missed = useMemo(() => {
    const xs = list.filter((s) => needsDoing(s) && lateBy(s, now) >= a.grace);
    return a.sort === "kind" ? [...xs].sort((p, q) => p.kind.localeCompare(q.kind) || p.time.localeCompare(q.time)) : xs;
  }, [list, now, a.grace, a.sort]);

  // Nothing missed when it opened: no list (single alerts take over).
  useEffect(() => { if (catchup && !missed.length) setCatchup(false); }, [catchup, missed.length]);
  useEffect(() => {
    if (!a.catchup || paused) return;
    let hiddenAt = 0;
    const vis = () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 3000) setCatchup(true); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [a.catchup, paused]);

  // A task late by the grace minutes (and not more than 2 hours): speak up once.
  useEffect(() => {
    if (paused || alert || (catchup && missed.length) || document.hidden) return;
    const done = read<Record<string, string>>(`${ALERTED}-${day}`, {});
    const s = missed.find((x) => lateBy(x, now) <= a.grace + 120 && !(done[x.id] && (done[x.id] === "x" || new Date(done[x.id]) > now)));
    if (!s) return;
    setAlert(s);
    assistantSay(sayFor(s, a), a, quiet);
  }, [missed, now, paused, alert, catchup, day, a, quiet]);

  // Low battery: once a day.
  useEffect(() => {
    if (!a.battery) return;
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    nav.getBattery?.().then((b) => {
      const k = `lifeos-battery-${day}`;
      if (b.level <= 0.15 && !b.charging && !read(k, false)) { write(k, true); setBattery(Math.round(b.level * 100)); }
    }).catch(() => {});
  }, [a.battery, day, now]);

  // ✓: record it as done at its planned time, right away (no sheet to fill in).
  const tick = (s: Step) => quickTick(s, logActivity, data.logs, updateLog);
  const mark = (s: Step, later: boolean) => {
    const k = `${ALERTED}-${day}`;
    const done = read<Record<string, string>>(k, {});
    done[s.id] = later && a.snooze > 0 ? new Date(Date.now() + a.snooze * 60_000).toISOString() : "x";
    write(k, done);
    setAlert(null);
    stopSpeaking();
  };

  if (battery != null) return (
    <Overlay a={a} full={a.fullscreen}>
      <p className="text-lg">Battery is low ({battery}%). Charge your phone so alarms and reminders keep working.</p>
      <button className="btn-primary w-full mt-4" onClick={() => setBattery(null)}>OK</button>
    </Overlay>
  );
  // Closing the catch-up counts as being told about each of them (no alert for them one by one after).
  const seen = () => { const k = `${ALERTED}-${day}`; const done = read<Record<string, string>>(k, {}); missed.forEach((s) => { done[s.id] = "x"; }); write(k, done); setCatchup(false); stopSpeaking(); };
  // 😮‍💨 Rest: no alerts and no list for 15 minutes.
  const rest = () => { saveSettings({ assistant: { ...a, pauseUntil: new Date(Date.now() + 15 * 60_000).toISOString() } }); setAlert(null); seen(); };
  const wake = list.find((x) => x.id === "b-wake");
  const woke = wake?.state === "done" && wake.diff != null && wake.diff >= 10 ? `You got up ${wake.diff} min late, so the morning moved to after you got up.` : "";
  if (catchup && missed.length) return <CatchUp a={a} list={missed} now={now} note={woke} onRest={rest} onClose={seen} onGo={(s) => { seen(); go(s); }} onTick={tick} />;
  if (alert) return (
    <Overlay a={a} full={a.fullscreen}>
      {a.output !== "sound" && <p className="text-xl font-semibold leading-snug">{sayFor(alert, a)}</p>}
      <p className="text-sm text-muted mt-2">Planned for {fmt12(alert.time)} · {lateBy(alert, now)} min ago</p>
      <div className="grid grid-cols-2 gap-2 mt-5">
        <button className="btn-ghost !py-3" onClick={() => mark(alert, true)}>Later</button>
        <button className="btn-primary !py-3" onClick={() => { mark(alert, false); go(alert); }}>OK</button>
      </div>
      <button className="btn-ghost w-full mt-2 !py-2.5" onClick={() => { tick(alert); mark(alert, false); }}>✓ Already done</button>
      <button className="w-full mt-1 text-xs text-muted py-1.5" onClick={() => { mark(alert, true); rest(); }}>😮‍💨 I&apos;m resting: quiet for 15 min</button>
    </Overlay>
  );
  return null;
}

function Overlay({ a, full, children }: { a: AssistantSettings; full: boolean; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-label={a.name} data-noedit className={`fixed z-[60] ${full ? "inset-0 bg-[var(--bg,#070512)]/95 grid place-items-center p-6" : "inset-x-3 bottom-24"}`}>
      <div className={`card w-full max-w-md p-5 ${full ? "" : "shadow-2xl"}`}>
        <div className="text-xs font-semibold tracking-widest uppercase text-[var(--accent2)] mb-2">{a.name}</div>
        {children}
      </div>
    </div>
  );
}

function CatchUp({ a, list, now, note, onRest, onClose, onGo, onTick }: { a: AssistantSettings; list: Step[]; now: Date; note?: string; onRest: () => void; onClose: () => void; onGo: (s: Step) => void; onTick: (s: Step) => void }) {
  const { data, saveSettings } = useApp();
  const [focus, setFocus] = useState(a.focus);
  useEffect(() => { assistantSay(`You missed ${list.length} ${list.length === 1 ? "task" : "tasks"} so far today.`, a); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="dialog" aria-label="Catch-up" data-noedit className="fixed inset-0 z-[60] bg-[var(--bg,#070512)] overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-md">
        <div className="text-xs font-semibold tracking-widest uppercase text-[var(--accent2)]">{a.name}</div>
        <h2 className="text-xl font-bold mt-1">Missed so far today ({list.length})</h2>
        <p className="text-xs text-muted">Up to {fmt12(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)}, {a.sort === "kind" ? "by type" : "in time order"}.</p>
        {note && <p className="card p-2.5 mt-2 text-sm">🌅 {note}</p>}
        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li key={s.id} className="card p-3 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{s.label}</span><span className="text-xs text-muted">{fmt12(s.time)} · {lateBy(s, now)} min late</span></span>
              <button aria-label={`Done: ${s.label}`} className="h-10 w-10 shrink-0 rounded-full border-2 border-emerald-400 text-emerald-300 text-lg font-black active:scale-90" onClick={() => onTick(s)}>✓</button>
              <button className="btn-primary !px-3 !py-2 text-sm shrink-0" onClick={() => onGo(s)}>Go to</button>
            </li>
          ))}
        </ul>
        <label className="block text-sm mt-4">Today&apos;s focus
          <input className="input mt-1" placeholder="One thing that matters most today" value={focus} onChange={(e) => setFocus(e.target.value)} onBlur={() => saveSettings({ assistant: { ...assistantOf(data.profile.settings), focus } })} />
        </label>
        <button className="btn-ghost w-full mt-4 !py-3" onClick={onClose}>OK, close</button>
        <button className="w-full mt-1 text-xs text-muted py-2" onClick={onRest}>😮‍💨 I&apos;m resting: quiet for 15 min</button>
        <p className="text-[11px] text-muted text-center mt-2">✓ = I did it (saved at its planned time; change the time on the Daily mission if needed).</p>
      </div>
    </div>
  );
}

// While anything is being read aloud: a Stop button, and leaving the page stops it too.
export function SpeechStop() {
  const path = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => { stopSpeaking(); }, [path]);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const t = setInterval(() => setOn(speechSynthesis.speaking), 300);
    return () => clearInterval(t);
  }, []);
  if (!on) return null;
  return <button data-noedit onClick={() => { stopSpeaking(); setOn(false); }} className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] rounded-full bg-rose-500 px-5 py-2.5 font-bold text-white shadow-xl active:scale-95">■ Stop voice</button>;
}
