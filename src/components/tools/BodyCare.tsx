"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { fireAlarm } from "@/lib/alarm";
import { bodyOf } from "@/lib/body";
import { PACES, stepDetector, strideM, walkEstimate } from "@/lib/fitness";
import { today, useApp, useLogs } from "@/lib/store";

// Body care tools: step counter, after-study stretch, 20-20-20 eye rest,
// nap timer, walk timer and posture checks. Timers keep their state in
// localStorage, so they survive closing the sheet; BodyCareWatcher (in the
// app layout) rings when a nap ends or a break is due.

const K = { nap: "lifeos-nap", eyes: "lifeos-eyes", posture: "lifeos-posture", acc: "lifeos-care-acc", walk: "lifeos-walk", focus: "lifeos-focus-end" };
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
const json = <T,>(k: string): T | null => { try { return JSON.parse(get(k) ?? "null"); } catch { return null; } };
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

// A soft chime between steps (not the loud alarm).
function chime(freq = 660) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new AC(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq; o.connect(g).connect(c.destination);
    g.gain.setValueAtTime(0.25, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1);
    o.start(); o.stop(c.currentTime + 1);
    setTimeout(() => c.close().catch(() => {}), 1200);
  } catch {}
  try { navigator.vibrate?.(80); } catch {}
}

// Keeps the screen on while a timer or the step counter runs.
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    let lock: { release: () => Promise<void> } | undefined;
    (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof lock> } }).wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, [on]);
}
function useTick(on: boolean, ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => { if (!on) return; const t = setInterval(() => setN((n) => n + 1), ms); return () => clearInterval(t); }, [on, ms]);
}

// ---------- 34. Step counter ----------
export function StepCounterSheet({ onClose }: { onClose: () => void }) {
  const { profile, logActivity, celebrate } = useApp();
  const { logs } = useLogs(today());
  const [on, setOn] = useState(false);
  const [steps, setSteps] = useState(0);
  const [sens, setSens] = useState(1);
  const [msg, setMsg] = useState("");
  const started = useRef(0), count = useRef(0), seen = useRef(false);
  useWakeLock(on);
  const already = logs.filter((l) => l.kind === "steps").reduce((n, l) => n + (Number(l.data.steps) || 0), 0);

  useEffect(() => {
    if (!on) return;
    const feed = stepDetector(sens);
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a?.x == null || a.y == null || a.z == null) return;
      seen.current = true;
      if (feed(a.x, a.y, a.z, e.timeStamp || performance.now())) { count.current++; setSteps(count.current); }
    };
    addEventListener("devicemotion", onMotion);
    const check = setTimeout(() => { if (!seen.current) setMsg("No motion sensor is sending data. This works on a phone or tablet, not on a PC."); }, 4000);
    return () => { removeEventListener("devicemotion", onMotion); clearTimeout(check); };
  }, [on, sens]);

  const start = async () => {
    setMsg("");
    const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    if (!DM) return setMsg("This browser has no motion sensor access.");
    // iPhone asks for permission; it must come from a tap.
    if (typeof DM.requestPermission === "function") {
      const r = await DM.requestPermission().catch(() => "denied");
      if (r !== "granted") return setMsg("Motion access was blocked. On iPhone: close the app fully and tap Start again, then Allow.");
    }
    seen.current = false; started.current = Date.now(); setOn(true);
  };
  const save = useCallback(() => {
    setOn(false);
    const n = count.current;
    if (n < 10) return;
    const minutes = Math.max(1, Math.round((Date.now() - started.current) / 60_000));
    const row = logActivity("steps", { steps: n, minutes, source: "sensor" });
    celebrate({ title: "👣 STEPS SAVED", subtitle: `${n.toLocaleString()} steps · about ${((n * strideM(profile.height_cm)) / 1000).toFixed(2)} km`, xp: row.xp, kind: "small" });
    count.current = 0; setSteps(0);
  }, [logActivity, celebrate, profile.height_cm]);
  const close = () => { if (on) save(); onClose(); };

  return (
    <Sheet title="👣 Step counter" onClose={close}>
      <p className="text-xs text-muted">Counts steps with your phone&apos;s motion sensor while this screen is open. Keep the phone in your hand or pocket. The screen stays on.</p>
      <div className="text-center py-4">
        <div className="font-game text-6xl tabular-nums">{steps.toLocaleString()}</div>
        <div className="text-sm text-muted mt-1">≈ {((steps * strideM(profile.height_cm)) / 1000).toFixed(2)} km · today so far {(already + steps).toLocaleString()} steps</div>
      </div>
      <div className="flex items-center gap-1.5 text-xs"><span className="text-muted">Sensitivity</span>
        {[[0.8, "Low"], [1, "Normal"], [1.4, "High"]].map(([v, l]) => <button key={l} onClick={() => setSens(Number(v))} className={`chip !py-0.5 text-xs ${sens === v ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <p className="text-[11px] text-muted">Counting too many? Lower it. Missing steps? Raise it.</p>
      {msg && <p className="text-xs text-amber-300">{msg}</p>}
      {on ? <button onClick={save} className="btn-primary w-full">■ Stop and save</button> : <button onClick={start} className="btn-primary w-full">▶ Start counting</button>}
    </Sheet>
  );
}

// ---------- 35. After-study stretch ----------
const STRETCH: [icon: string, name: string, secs: number, how: string][] = [
  ["🙆", "Neck tilt left", 20, "Ear towards your left shoulder. Shoulders stay down. Breathe slowly."],
  ["🙆", "Neck tilt right", 20, "Ear towards your right shoulder."],
  ["🐢", "Chin tucks", 20, "Pull your chin straight back (double chin), hold 2 s, release. Fixes 'phone neck'."],
  ["🔄", "Shoulder rolls", 20, "Roll your shoulders up, back and down. Big slow circles."],
  ["🦅", "Chest opener", 25, "Hands together behind your back, squeeze shoulder blades, lift your chest."],
  ["🌀", "Seated twist left", 20, "Sit tall, turn your upper body left, hand on the chair back."],
  ["🌀", "Seated twist right", 20, "Now turn right."],
  ["🐈", "Back arch and round", 30, "Hands on knees: arch your back and look up, then round it and look down. Slowly."],
  ["🙌", "Overhead reach", 20, "Stand up, fingers locked, reach to the ceiling, lean a little left and right."],
  ["✋", "Wrist stretch", 20, "Arm straight, gently pull your fingers back, then down. Both hands."],
  ["🤲", "Eye palming", 20, "Rub your palms warm and cup them over closed eyes. Total darkness, relax."],
  ["👀", "Look far away", 20, "Look at the farthest thing you can see (6 m or more). Blink slowly."],
];
export function StretchSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [i, setI] = useState(-1); // -1 = not started
  const [left, setLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const running = i >= 0 && i < STRETCH.length;
  useWakeLock(running);
  const finish = useCallback(() => {
    setI(STRETCH.length);
    const row = logActivity("stretch", { type: ["Neck", "Back", "Eyes 20-20-20", "Full stretch"], minutes: Math.round(STRETCH.reduce((n, s) => n + s[2], 0) / 60), routine: "after study" });
    celebrate({ title: "🤸 BODY RESET", subtitle: "Neck, back and eyes refreshed. Ready for the next round!", xp: row.xp });
  }, [logActivity, celebrate]);
  useEffect(() => {
    if (!running || paused) return;
    const t = setTimeout(() => {
      if (left > 1) return setLeft(left - 1);
      chime(i % 2 ? 660 : 880);
      if (i + 1 >= STRETCH.length) finish(); else { setI(i + 1); setLeft(STRETCH[i + 1][2]); }
    }, 1000);
    return () => clearTimeout(t);
  }, [running, paused, left, i, finish]);
  const total = STRETCH.reduce((n, s) => n + s[2], 0);
  const s = running ? STRETCH[i] : null;
  return (
    <Sheet title="🤸 After-study stretch" onClose={onClose}>
      {i < 0 && (
        <>
          <p className="text-sm text-muted">{STRETCH.length} moves, about {Math.round(total / 60)} minutes: neck, shoulders, back, wrists and eyes. A chime tells you when to switch.</p>
          <ol className="text-xs space-y-0.5">{STRETCH.map((x, n) => <li key={n}>{x[0]} {x[1]} <span className="text-muted">· {x[2]} s</span></li>)}</ol>
          <button onClick={() => { setI(0); setLeft(STRETCH[0][2]); setPaused(false); chime(); }} className="btn-primary w-full">▶ Start</button>
        </>
      )}
      {s && (
        <div className="text-center py-2">
          <div className="text-xs text-muted">Move {i + 1} of {STRETCH.length}</div>
          <div className="text-6xl my-2">{s[0]}</div>
          <div className="font-game text-xl">{s[1]}</div>
          <div className="font-game text-5xl tabular-nums my-2">{left}</div>
          <p className="text-sm text-muted min-h-10">{s[3]}</p>
          <div className="bar mt-2"><div style={{ width: `${((i + (1 - left / s[2])) / STRETCH.length) * 100}%` }} /></div>
          {i + 1 < STRETCH.length && <div className="text-[11px] text-muted mt-2">Next: {STRETCH[i + 1][1]}</div>}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => setPaused(!paused)} className="btn-ghost">{paused ? "▶ Resume" : "⏸ Pause"}</button>
            <button onClick={() => { if (i + 1 >= STRETCH.length) finish(); else { setI(i + 1); setLeft(STRETCH[i + 1][2]); } }} className="btn-ghost">Skip ⏭</button>
          </div>
        </div>
      )}
      {i >= STRETCH.length && (
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">✨</div><p className="font-semibold">All done. Drink some water too!</p>
          <button onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      )}
    </Sheet>
  );
}

// ---------- 80. 20-20-20 eye rest ----------
export type EyeMode = "off" | "study" | "always";
export const EYE_MIN = 20;
export function EyeRestSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [mode, setModeS] = useState<EyeMode>(() => (get(K.eyes) as EyeMode) || "off");
  const [rest, setRest] = useState(0);
  useTick(true);
  const setMode = (m: EyeMode) => { setModeS(m); set(K.eyes, m === "off" ? null : m); };
  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => {
      if (rest === 1) {
        chime(880);
        const row = logActivity("stretch", { type: ["Eyes 20-20-20"] }, new Date(), 2);
        celebrate({ title: "👀 EYES RESTED", subtitle: "20 seconds far away. Your eyes thank you.", xp: row.xp, kind: "small" });
      }
      setRest(rest - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [rest, logActivity, celebrate]);
  const acc = json<{ eyes?: number }>(K.acc)?.eyes ?? 0;
  return (
    <Sheet title="👀 Eye rest 20-20-20" onClose={onClose}>
      <p className="text-sm text-muted">Every <b>20 minutes</b> of screen time, look at something <b>20 feet (6 m)</b> away for <b>20 seconds</b>. It relaxes the focusing muscle and stops dry, tired eyes.</p>
      <div className="text-xs text-muted">Remind me</div>
      <div className="flex flex-wrap gap-1.5">
        {([["off", "Off"], ["study", "📖 While studying"], ["always", "📱 Whenever the app is open"]] as [EyeMode, string][]).map(([m, l]) => <button key={m} onClick={() => setMode(m)} className={`chip text-xs ${mode === m ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      {mode !== "off" && <p className="text-xs text-[var(--accent2)]">Next eye break in about {Math.max(1, Math.ceil(EYE_MIN - acc / 60_000))} min{mode === "study" ? " of study" : ""}.</p>}
      <div className="text-center py-3">
        <div className="text-6xl">{rest > 0 ? "🌄" : "👀"}</div>
        <div className="font-game text-5xl tabular-nums mt-2">{rest > 0 ? rest : 20}</div>
        {rest > 0 && <p className="text-sm text-muted mt-1">Look out of the window or at the far wall. Blink slowly.</p>}
      </div>
      {rest > 0 ? <button onClick={() => setRest(0)} className="btn-ghost w-full">Stop</button> : <button onClick={() => { chime(); setRest(20); }} className="btn-primary w-full">▶ Rest my eyes now (20 s)</button>}
    </Sheet>
  );
}

// ---------- 79. Posture check while studying (and the study care card on the Dojo) ----------
export function StudyCareCard() {
  const [posture, setP] = useState<number>(() => Number(get(K.posture)) || 0);
  const [eyes, setE] = useState<EyeMode>(() => (get(K.eyes) as EyeMode) || "off");
  const [open, setOpen] = useState<"stretch" | "eyes" | null>(null);
  const pickP = (m: number) => { setP(m); set(K.posture, m ? String(m) : null); };
  const pickE = (m: EyeMode) => { setE(m); set(K.eyes, m === "off" ? null : m); };
  return (
    <section className="card p-4 mb-4 space-y-2">
      <h2 className="section-title">🧍 Study body care</h2>
      <div className="text-xs text-muted">🪑 Posture check while studying</div>
      <div className="flex flex-wrap gap-1.5">
        {[[0, "Off"], [30, "Every 30 min"], [45, "45 min"], [60, "Every hour"]].map(([m, l]) => <button key={m} onClick={() => pickP(Number(m))} className={`chip !py-1 text-xs ${posture === m ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <div className="text-xs text-muted">👀 20-20-20 eye break every 20 min</div>
      <div className="flex flex-wrap gap-1.5">
        {([["off", "Off"], ["study", "While studying"], ["always", "Whenever the app is open"]] as [EyeMode, string][]).map(([m, l]) => <button key={m} onClick={() => pickE(m)} className={`chip !py-1 text-xs ${eyes === m ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <p className="text-[11px] text-muted">Counts time while a focus session (or a study task in progress) is running, on this device. Keep the app open.</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setOpen("stretch")} className="btn-ghost text-sm">🤸 After-study stretch</button>
        <button onClick={() => setOpen("eyes")} className="btn-ghost text-sm">👀 Eye rest now</button>
      </div>
      {open === "stretch" && <StretchSheet onClose={() => setOpen(null)} />}
      {open === "eyes" && <EyeRestSheet onClose={() => { setOpen(null); setE((get(K.eyes) as EyeMode) || "off"); }} />}
    </section>
  );
}

// ---------- 81. Nap timer ----------
type Nap = { end: number; id: string; mins: number };
export function NapSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, updateLog, deleteLog, celebrate } = useApp();
  const [mins, setMins] = useState(20);
  const [mine, setNap] = useState<Nap | null>(() => json<Nap>(K.nap));
  // The watcher clears the key when the alarm rings, which ends the nap here too.
  const nap = mine && get(K.nap) ? mine : null;
  useTick(!!nap);
  useWakeLock(!!nap);
  const start = () => {
    const row = logActivity("sleep", { start: new Date().toISOString(), end: null, type: "nap", planned: mins });
    const n = { end: Date.now() + mins * 60_000, id: row.id, mins };
    set(K.nap, JSON.stringify(n)); setNap(n);
  };
  const wake = () => {
    if (!nap) return;
    updateLog(nap.id, { data: { end: new Date().toISOString() } });
    set(K.nap, null); setNap(null);
    celebrate({ title: "💤 NAP DONE", subtitle: "Recharged. Stand up, drink water, get some light.", kind: "small" });
  };
  const cancel = () => { if (nap) deleteLog(nap.id); set(K.nap, null); setNap(null); };
  return (
    <Sheet title="💤 Nap timer" onClose={onClose}>
      {!nap ? (
        <>
          <p className="text-sm text-muted">A short nap boosts focus without the groggy feeling. 20 min is the sweet spot: you wake before deep sleep starts.</p>
          <div className="flex flex-wrap gap-1.5">{[[10, "10 min"], [20, "20 min ⭐"], [26, "26 min (NASA)"], [30, "30 min"]].map(([m, l]) => <button key={m} onClick={() => setMins(Number(m))} className={`chip text-xs ${mins === m ? "chip-on" : ""}`}>{l}</button>)}</div>
          <p className="text-[11px] text-muted">Keep the app open with sound on: a loud alarm rings when time is up. Tip: a coffee right before a nap kicks in as you wake.</p>
          <button onClick={start} className="btn-primary w-full">😴 Start {mins} min nap</button>
        </>
      ) : (
        <div className="text-center py-3 space-y-2">
          <div className="text-6xl animate-float">😴</div>
          <div className="font-game text-5xl tabular-nums">{mmss(nap.end - Date.now())}</div>
          <p className="text-sm text-muted">Sweet dreams. The alarm rings at {new Date(nap.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={wake} className="btn-primary">☀️ I&apos;m up</button>
            <button onClick={cancel} className="btn-ghost">Cancel nap</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ---------- 82. Walk timer ----------
type Walk = { start: number | null; acc: number; pace: string };
export function WalkSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, logActivity, celebrate } = useApp();
  const [w, setW] = useState<Walk>(() => json<Walk>(K.walk) ?? { start: null, acc: 0, pace: "normal" });
  useTick(!!w.start);
  useWakeLock(!!w.start);
  const save = (x: Walk | null) => { set(K.walk, x ? JSON.stringify(x) : null); setW(x ?? { start: null, acc: 0, pace: w.pace }); };
  const ms = w.acc + (w.start ? Date.now() - w.start : 0);
  const p = PACES.find((x) => x[0] === w.pace) ?? PACES[1];
  const est = walkEstimate(ms, p[2], p[3], bodyOf(data).kg, profile.height_cm);
  const finish = () => {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    const row = logActivity("activity", { name: w.pace === "brisk" ? "Brisk walk" : w.pace === "hill" ? "Uphill walk" : "Walk", minutes, amount: est.km, unit: "km", emoji: "🚶", steps_est: est.steps, pace_kmh: p[2] });
    celebrate({ title: "🚶 WALK DONE", subtitle: `${minutes} min · about ${est.km} km · ${est.kcal} kcal`, xp: row.xp });
    save(null);
  };
  return (
    <Sheet title="🚶 Walk timer" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">{PACES.map(([k, l, kmh]) => <button key={k} onClick={() => save({ ...w, pace: k })} className={`chip text-xs ${w.pace === k ? "chip-on" : ""}`}>{l} · {kmh} km/h</button>)}</div>
      <div className="text-center py-3">
        <div className="font-game text-5xl tabular-nums">{Math.floor(ms / 3_600_000) ? `${Math.floor(ms / 3_600_000)}:` : ""}{mmss(ms % 3_600_000)}</div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{est.km}</div><div className="text-[10px] text-muted">KM</div></div>
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{est.steps.toLocaleString()}</div><div className="text-[10px] text-muted">STEPS</div></div>
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{est.kcal}</div><div className="text-[10px] text-muted">KCAL</div></div>
        </div>
      </div>
      <p className="text-[11px] text-muted">Estimated from time and pace (your stride is about {Math.round(strideM(profile.height_cm) * 100)} cm from your height). It keeps running if you close this sheet.</p>
      <div className="grid grid-cols-2 gap-2">
        {w.start ? <button onClick={() => save({ ...w, start: null, acc: ms })} className="btn-ghost">⏸ Pause</button> : <button onClick={() => save({ ...w, start: Date.now() })} className="btn-primary">{ms ? "▶ Resume" : "▶ Start walk"}</button>}
        {ms >= 60_000 ? <button onClick={finish} className="btn-primary">✓ Finish & log</button> : <button onClick={() => save(null)} className="btn-ghost" disabled={!ms}>Reset</button>}
      </div>
    </Sheet>
  );
}

// ---------- Watcher: nap alarm, posture and eye breaks ----------
export function BodyCareWatcher() {
  const { data, doing, updateLog } = useApp();
  const live = useRef({ data, doing, updateLog });
  useEffect(() => { live.current = { data, doing, updateLog }; });
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      const now = Date.now(), dt = Math.min(60_000, now - last);
      last = now;
      const nap = json<Nap>(K.nap);
      if (nap && now >= nap.end) {
        set(K.nap, null);
        if (live.current.data.logs.some((l) => l.id === nap.id)) live.current.updateLog(nap.id, { data: { end: new Date(nap.end).toISOString() } });
        fireAlarm({ title: "💤 NAP OVER", body: `${nap.mins} min power nap done. Stand up, drink water, get some light.`, icon: "⏰" });
        return;
      }
      if (document.visibilityState !== "visible") return;
      const studying = Number(get(K.focus)) > now || live.current.doing.some((d) => /study|homework|focus|revision|read|coding|exam/i.test(d.name));
      const posture = Number(get(K.posture)) || 0, eyes = get(K.eyes) as EyeMode | null;
      const acc = json<{ posture?: number; eyes?: number }>(K.acc) ?? {};
      if (posture && studying) acc.posture = (acc.posture ?? 0) + dt;
      if (eyes === "always" || (eyes === "study" && studying)) acc.eyes = (acc.eyes ?? 0) + dt;
      if (posture && (acc.posture ?? 0) >= posture * 60_000) {
        acc.posture = 0;
        fireAlarm({ title: "🪑 POSTURE CHECK", body: "Feet flat, back tall, shoulders down and back, screen at eye level. Roll your neck once.", icon: "🧍", rounds: 2 });
      } else if (eyes && (acc.eyes ?? 0) >= EYE_MIN * 60_000) {
        acc.eyes = 0;
        fireAlarm({ title: "👀 20-20-20", body: "Look at something 6 m away for 20 seconds. Blink slowly.", icon: "👀", rounds: 2 });
      }
      set(K.acc, JSON.stringify(acc));
    };
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);
  return null;
}
