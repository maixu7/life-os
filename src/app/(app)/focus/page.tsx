"use client";

import { fireAlarm } from "@/lib/alarm";

import { useEffect, useRef, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { StudyPlan } from "@/components/StudyPlan";
import { useFocusJail } from "@/components/StrictStudy";
import { StudyCareCard } from "@/components/tools/BodyCare";
import { Garden } from "@/components/Garden";
import { startAmbient } from "@/lib/ambient";
import { useApp, useCustomItems } from "@/lib/store";

const FOCUS_MIN = 25;
const KEY = "lifeos-focus-end";

export default function FocusPage() {
  const { profile, logActivity, celebrate } = useApp();
  const formulas = useCustomItems("formula");
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [subject, setSubject] = useState("");
  const [sound, setSound] = useState<"off" | "rain" | "lofi">("off");
  const stopSound = useRef<(() => void) | null>(null);
  const [fName, setFName] = useState("");
  const [fBody, setFBody] = useState("");

  // Resume a running session after navigating away; ?start=1 comes from the "Study" voice command.
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("subject");
      if (q) setSubject(q);
      const saved = Number(localStorage.getItem(KEY));
      if (saved > Date.now()) setEnd(saved);
      else if (new URLSearchParams(location.search).get("start")) begin();
    } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // Keep the screen awake during a session.
  useEffect(() => {
    if (!end) return;
    let lock: { release: () => Promise<void> } | undefined;
    (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof lock> } }).wakeLock
      ?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => { lock?.release(); };
  }, [end]);

  useEffect(() => {
    stopSound.current?.();
    stopSound.current = sound === "off" ? null : startAmbient(sound);
    return () => stopSound.current?.();
  }, [sound]);

  const left = end ? Math.max(0, end - now) : FOCUS_MIN * 60_000;
  useEffect(() => {
    if (!end || left > 0) return;
    setEnd(null);
    try { localStorage.removeItem(KEY); } catch {}
    setSound("off");
    fireAlarm({ title: "🧘 FOCUS COMPLETE", body: "Take a 5 minute break.", icon: "🏆" });
    const row = logActivity("focus", { minutes: FOCUS_MIN, subject: subject || undefined });
    celebrate({ title: "FOCUS COMPLETE!", subtitle: "Every session brings exam victory closer. Take a 5 min break!", xp: row.xp, big: true });
  }, [left, end, subject, logActivity, celebrate]);

  function begin() {
    const e = Date.now() + FOCUS_MIN * 60_000;
    setWilted(false);
    setEnd(e);
    try { localStorage.setItem(KEY, String(e)); } catch {}
  }
  const [wilted, setWilted] = useState(false);
  const giveUp = () => {
    setWilted(true);
    setEnd(null);
    try { localStorage.removeItem(KEY); } catch {}
  };
  const jail = useFocusJail(!!end, giveUp);

  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  const pct = 1 - left / (FOCUS_MIN * 60_000);
  const exam = profile.settings.exam_date;
  const daysToExam = exam ? Math.ceil((new Date(exam).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <>
      <XpHeader title="Mind Dojo" icon="🧘" subtitle="25-minute strikes of pure focus" />

      {daysToExam !== null && daysToExam >= 0 && (
        <section className="card p-4 mb-4 flex items-center justify-between">
          <div><div className="text-xs text-muted">Exam countdown</div><div className="text-3xl font-black glow-text">{daysToExam} days</div></div>
          <div className="text-4xl">🎌</div>
        </section>
      )}

      <section className="card p-6 mb-4 flex flex-col items-center">
        <svg viewBox="0 0 200 200" className="w-56 h-56 -rotate-90">
          <circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,.08)" strokeWidth="12" fill="none" />
          <circle cx="100" cy="100" r="88" stroke="url(#fg)" strokeWidth="12" fill="none" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - pct)} style={{ filter: "drop-shadow(0 0 8px var(--accent))" }} />
          <defs><linearGradient id="fg"><stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent2)" /></linearGradient></defs>
        </svg>
        <div className="-mt-36 mb-20 text-5xl font-black tabular-nums">{mm}:{String(ss).padStart(2, "0")}</div>
        {jail.broken && !end && <button onClick={jail.clear} className="w-full rounded-xl bg-rose-500/15 border border-rose-400/40 p-3 text-sm text-rose-200 mb-3">📵 You left the app for over a minute, so this session failed (−30 XP). Keep Life OS open while you study. Tap to start again.</button>}
        {!end ? (
          <>
            <input className="input mb-3" placeholder="What are you studying?" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <button onClick={begin} className="btn-primary w-full text-lg">Start 25 min</button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted text-center mb-3">Phone down, mind on. Anime and manga will be twice as sweet after the exam. 💪</p>
            <button onClick={giveUp} className="btn-ghost text-sm">End early</button>
          </>
        )}
        <div className="mt-4 flex gap-2">
          {(["off", "rain", "lofi"] as const).map((s) => (
            <button key={s} onClick={() => setSound(s)} className={`chip ${sound === s ? "chip-on" : ""}`}>
              {s === "off" ? "🔇 Silent" : s === "rain" ? "🌧️ Rain" : "🎶 Lofi"}
            </button>
          ))}
        </div>
      </section>

      <Garden pct={end ? pct : 0} running={!!end} wilted={wilted} />

      <StudyCareCard />

      <StudyPlan />

      <section className="card p-4">
        <h2 className="font-bold mb-2">Formula vault</h2>
        <ul className="space-y-2 mb-3">
          {formulas.items.map((f) => (
            <li key={f.id} className="rounded-xl bg-black/30 p-3">
              <div className="flex justify-between"><span className="font-semibold">{f.name}</span>
                <button aria-label="Delete" onClick={() => formulas.remove(f.id)} className="text-muted">✕</button></div>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-[var(--accent2)]">{String(f.config.body ?? "")}</pre>
            </li>
          ))}
        </ul>
        <input className="input mb-2" placeholder="Name (e.g. Quadratic formula)" value={fName} onChange={(e) => setFName(e.target.value)} />
        <textarea className="input mb-2 font-mono" rows={2} placeholder="x = (-b ± √(b² - 4ac)) / 2a" value={fBody} onChange={(e) => setFBody(e.target.value)} />
        <button className="btn-primary w-full" onClick={() => { if (fName.trim()) { formulas.add(fName.trim(), { body: fBody }); setFName(""); setFBody(""); } }}>Save formula</button>
      </section>
    </>
  );
}
