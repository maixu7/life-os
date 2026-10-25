"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRunAction } from "@/components/Coach";
import { assistantOf, lateBy, needsDoing, sayFor, type AssistantSettings } from "@/lib/assistant";
import { steps, type Step } from "@/lib/mission";
import { fmt12, isQuiet, sched } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";

// The assistant (replaces the game's characters): when a task on the Daily
// mission is late by a few minutes it says so on screen and out loud, with
// OK (go and do it) or Later (stay here). On opening the app it lists what
// was missed so far today, in time order, each with "Go to".

const ALERTED = "lifeos-alerted";
const CATCHUP = "lifeos-catchup-at";
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
export function assistantSay(text: string, a: AssistantSettings, quiet = false) {
  if (!a.audio || a.output === "text" || quiet || typeof speechSynthesis === "undefined") return;
  if (a.chime) beep();
  setTimeout(() => {
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

function useGo() {
  const router = useRouter();
  const run = useRunAction();
  return useCallback((s: Step) => { if (s.href) router.push(s.href); else run(s.action); }, [router, run]);
}

export function AssistantLayer() {
  const { data } = useApp();
  const a = assistantOf(data.profile.settings);
  const go = useGo();
  const [now, setNow] = useState(() => new Date());
  const [alert, setAlert] = useState<Step | null>(null);
  // Due when the app opens (or comes back after 30 minutes away), decided before any single alert.
  const due = () => { const last = read<string>(CATCHUP, ""); return !last || Date.now() - new Date(last).getTime() > 30 * 60_000; };
  const [catchup, setCatchup] = useState(() => typeof window !== "undefined" && a.catchup && due());
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

  // Opening the app (or coming back after 30 minutes away): the catch-up list.
  useEffect(() => {
    if (!a.catchup || paused) return;
    const check = () => {
      if (document.hidden) return;
      if (due()) setCatchup(true);
      write(CATCHUP, new Date().toISOString());
    };
    write(CATCHUP, new Date().toISOString());
    const vis = () => { if (document.hidden) write(CATCHUP, new Date().toISOString()); else check(); };
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

  const mark = (s: Step, later: boolean) => {
    const k = `${ALERTED}-${day}`;
    const done = read<Record<string, string>>(k, {});
    done[s.id] = later && a.snooze > 0 ? new Date(Date.now() + a.snooze * 60_000).toISOString() : "x";
    write(k, done);
    setAlert(null);
    try { speechSynthesis.cancel(); } catch {}
  };

  if (battery != null) return (
    <Overlay a={a} full={a.fullscreen}>
      <p className="text-lg">Battery is low ({battery}%). Charge your phone so alarms and reminders keep working.</p>
      <button className="btn-primary w-full mt-4" onClick={() => setBattery(null)}>OK</button>
    </Overlay>
  );
  // Closing the catch-up counts as being told about each of them (no alert for them one by one after).
  const seen = () => { const k = `${ALERTED}-${day}`; const done = read<Record<string, string>>(k, {}); missed.forEach((s) => { done[s.id] = "x"; }); write(k, done); setCatchup(false); };
  if (catchup && missed.length) return <CatchUp a={a} list={missed} now={now} onClose={seen} onGo={(s) => { seen(); go(s); }} />;
  if (alert) return (
    <Overlay a={a} full={a.fullscreen}>
      {a.output !== "sound" && <p className="text-xl font-semibold leading-snug">{sayFor(alert, a)}</p>}
      <p className="text-sm text-muted mt-2">Planned for {fmt12(alert.time)} · {lateBy(alert, now)} min ago</p>
      <div className="grid grid-cols-2 gap-2 mt-5">
        <button className="btn-ghost !py-3" onClick={() => mark(alert, true)}>Later</button>
        <button className="btn-primary !py-3" onClick={() => { mark(alert, false); go(alert); }}>OK</button>
      </div>
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

function CatchUp({ a, list, now, onClose, onGo }: { a: AssistantSettings; list: Step[]; now: Date; onClose: () => void; onGo: (s: Step) => void }) {
  const { data, saveSettings } = useApp();
  const [focus, setFocus] = useState(a.focus);
  useEffect(() => { assistantSay(`You missed ${list.length} ${list.length === 1 ? "task" : "tasks"} so far today.`, a); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="dialog" aria-label="Catch-up" data-noedit className="fixed inset-0 z-[60] bg-[var(--bg,#070512)] overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-md">
        <div className="text-xs font-semibold tracking-widest uppercase text-[var(--accent2)]">{a.name}</div>
        <h2 className="text-xl font-bold mt-1">Missed so far today ({list.length})</h2>
        <p className="text-xs text-muted">Up to {fmt12(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)}, {a.sort === "kind" ? "by type" : "in time order"}.</p>
        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li key={s.id} className="card p-3 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{s.label}</span><span className="text-xs text-muted">{fmt12(s.time)} · {lateBy(s, now)} min late</span></span>
              <button className="btn-primary !px-3 !py-2 text-sm shrink-0" onClick={() => onGo(s)}>Go to</button>
            </li>
          ))}
        </ul>
        <label className="block text-sm mt-4">Today&apos;s focus
          <input className="input mt-1" placeholder="One thing that matters most today" value={focus} onChange={(e) => setFocus(e.target.value)} onBlur={() => saveSettings({ assistant: { ...assistantOf(data.profile.settings), focus } })} />
        </label>
        <button className="btn-ghost w-full mt-4 !py-3" onClick={onClose}>OK, close</button>
      </div>
    </div>
  );
}

// Plain assistant look: game words on screen become the assistant's name, and
// XP / coin rewards are left out (they're still counted in the background,
// so switching back to the game look loses nothing).
const SENSEI = /SENSEI KAITO|Sensei Kaito|SENSEI|Sensei/g;
const REWARD = /\s*(Reward\s*)?\+\d+\s*XP(\s*·\s*\+\d+\s*🪙)?/g;
function plainText(t: string, name: string) {
  return t.replace(SENSEI, (m) => (m === m.toUpperCase() ? name.toUpperCase() : name)).replace(REWARD, "").replace(/🥷\s?/g, "");
}
export function PlainWords() {
  const { data } = useApp();
  const a = assistantOf(data.profile.settings);
  useEffect(() => {
    if (a.mode === "game") return;
    const fix = (n: Node) => {
      if (n.nodeType === 3) {
        const v = n.nodeValue ?? "";
        if (/Sensei|SENSEI|XP|🥷/.test(v)) { const w = plainText(v, a.name); if (w !== v) n.nodeValue = w; }
        return;
      }
      if (n.nodeType !== 1 || (n as Element).closest?.("input,textarea,[contenteditable]")) return;
      const walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      for (let x = walk.nextNode(); x; x = walk.nextNode()) fix(x);
    };
    fix(document.body);
    const ob = new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") fix(m.target); else m.addedNodes.forEach(fix); } });
    ob.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => ob.disconnect();
  }, [a.mode, a.name]);
  return null;
}

/** Shows its children only with the game look on. */
export function GameOnly({ children }: { children: React.ReactNode }) {
  const { data } = useApp();
  return assistantOf(data.profile.settings).mode === "game" ? <>{children}</> : null;
}
