"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { openHub } from "@/components/hub/registry";
import { bedtimes, DETOX, DETOX_XP, hhmm, wakeTimes } from "@/lib/hub";
import { logKarma } from "@/lib/karma";
import { describe } from "@/lib/describe";
import { fmt12, sched, sleepTimes, toMin } from "@/lib/schedule";
import { today, useApp, useCustomItems, type Log } from "@/lib/store";

// ---------- 70 SOS calm: breathe first, then one small thing to do ----------
const FEELINGS: { id: string; icon: string; label: string; steps: string[]; urge?: boolean }[] = [
  { id: "stress", icon: "😣", label: "Stressed", steps: ["Breathe with the circle for 1 minute.", "Write the one thing worrying you most.", "Do the smallest next step for 5 minutes.", "Drink a glass of water."] },
  { id: "tempted", icon: "📱", label: "Tempted to scroll / binge", urge: true, steps: ["Start the 2-minute urge timer.", "Put the phone in another room or face down.", "Stand up and stretch for 30 seconds.", "Open one 25-min focus session."] },
  { id: "angry", icon: "😠", label: "Angry", steps: ["Don't reply or decide anything for 10 minutes.", "Breathe out longer than you breathe in.", "Walk around the block or splash cold water on your face.", "Write what happened, then close the note."] },
  { id: "sad", icon: "😢", label: "Sad or lonely", steps: ["Breathe slowly, you're safe right now.", "Message or call someone you like.", "Step outside into daylight for 10 minutes.", "Eat something and drink water."] },
  { id: "panic", icon: "😰", label: "Panicky", steps: ["Name 5 things you see, 4 you hear, 3 you can touch.", "Breathe in 4, out 6, five times.", "Feel your feet on the floor.", "It passes in minutes. You've survived every one so far."] },
];
export function SosSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [f, setF] = useState<(typeof FEELINGS)[number] | null>(null);
  const [phase, setPhase] = useState(0);
  useEffect(() => { const t = setInterval(() => setPhase((p) => (p + 1) % 3), 4000); return () => clearInterval(t); }, []);
  return (
    <Sheet title="🆘 SOS calm" onClose={onClose}>
      <div className="grid place-items-center py-2">
        <div className="h-32 w-32 rounded-full grid place-items-center text-sm font-bold bg-sky-400/20 border border-sky-300/40"
          style={{ transform: `scale(${phase === 0 ? 1.15 : phase === 1 ? 1.15 : 0.75})`, transition: "transform 4s ease-in-out" }}>
          {["Breathe in…", "Hold…", "Breathe out…"][phase]}
        </div>
      </div>
      <p className="text-sm text-center text-muted">Follow the circle. You don&apos;t have to fix everything. Just the next minute.</p>
      {!f ? (
        <div className="grid grid-cols-2 gap-2">
          {FEELINGS.map((x) => <button key={x.id} onClick={() => setF(x)} className="rounded-xl bg-white/5 p-3 text-left text-sm"><span className="text-xl">{x.icon}</span> {x.label}</button>)}
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 p-3">
          <div className="font-semibold mb-1">{f.icon} {f.label}: what to do now</div>
          <ol className="list-decimal ml-5 text-sm space-y-1">{f.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="mt-3 grid gap-2">
            {f.urge && <button onClick={() => { onClose(); openHub("urge"); }} className="btn-primary">🌊 Start the 2-minute urge timer</button>}
            <button onClick={() => {
              const r = logActivity("mood", { mood: "2", tags: [f.label.split(" ")[0]], note: "SOS calm" }, new Date());
              celebrate({ title: "YOU PAUSED", subtitle: "Noticing the feeling is the first win.", xp: r.xp, icon: "🫶", kind: "small" });
              onClose();
            }} className="btn-ghost">I feel a bit better (log it)</button>
            <button onClick={() => setF(null)} className="text-xs text-muted">Pick another feeling</button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted">If you ever feel unsafe or think about hurting yourself, call 119 (emergency) or the Yorisoi hotline 0120-279-338 (24 h, English available).</p>
    </Sheet>
  );
}

// ---------- 41 Urge surfing: wait 2 minutes before giving in ----------
const URGES = ["Scrolling", "Anime", "Gaming", "Junk food", "YouTube"];
export function UrgeSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const [what, setWhat] = useState("Scrolling");
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!end) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [end]);
  const left = end ? Math.max(0, Math.ceil((end - now) / 1000)) : 120;
  const done = !!end && left === 0;
  const surfed = () => {
    const r = logActivity("resist", { what: what === "Scrolling" || what === "YouTube" ? "Phone" : what === "Anime" ? "Anime binge" : what === "Gaming" ? "Gaming" : "Junk food", note: `Urge surfing: waited 2 minutes (${what})`, urge: true }, new Date(), 20);
    celebrate({ title: "URGE SURFED!", subtitle: `The wave passed. You beat ${what.toLowerCase()}.`, xp: r.xp, icon: "🌊", big: true });
    onClose();
  };
  return (
    <Sheet title="🌊 Urge surfing" onClose={onClose}>
      <p className="text-sm text-muted">Urges rise like a wave and fall in a few minutes. Don&apos;t fight it, don&apos;t obey it: just watch it for 2 minutes.</p>
      <div className="flex flex-wrap gap-1.5">{URGES.map((u) => <button key={u} onClick={() => setWhat(u)} className={`chip ${what === u ? "chip-on" : ""}`}>{u}</button>)}</div>
      <div className="text-center py-3">
        <div className="text-6xl font-black tabular-nums glow-text">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-sky-400 transition-all" style={{ width: `${((120 - left) / 120) * 100}%` }} /></div>
        {end && !done && <p className="mt-2 text-sm">{left > 80 ? "Notice where you feel the urge in your body." : left > 40 ? "Breathe slowly. The wave is at its top now." : "It's getting smaller. Almost there."}</p>}
      </div>
      {!end && <button onClick={() => { setEnd(Date.now() + 120_000); setNow(Date.now()); }} className="btn-primary w-full">Start 2 minutes</button>}
      {done && (
        <div className="grid gap-2">
          <button onClick={surfed} className="btn-gold">✓ The urge passed (+20 XP, 😇)</button>
          <button onClick={onClose} className="btn-ghost text-sm">I still want it. I&apos;ll earn it first (Reward shop)</button>
        </div>
      )}
    </Sheet>
  );
}

// ---------- 44 Digital detox challenge days ----------
export function DetoxSheet({ onClose }: { onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const { items, add, update } = useCustomItems("detox");
  const day = today();
  const cur = items.find((i) => i.config.day === day);
  const won = items.filter((i) => i.config.status === "won").length;
  const ch = (id: unknown) => DETOX.find((x) => x.id === id) ?? DETOX[0];
  return (
    <Sheet title="📵 Digital detox day" onClose={onClose}>
      <p className="text-sm text-muted">Pick one challenge for today. Tonight, be honest: did you keep it? Each win is +{DETOX_XP} XP.</p>
      <div className="flex gap-2 text-center">
        <div className="flex-1 rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{won}</div><div className="text-[10px] text-muted">DETOX DAYS WON</div></div>
        <div className="flex-1 rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{items.filter((i) => i.config.status === "failed").length}</div><div className="text-[10px] text-muted">TRIES</div></div>
      </div>
      {cur ? (
        <div className="rounded-xl border border-[var(--accent2)]/50 p-3">
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">TODAY&apos;S CHALLENGE</div>
          <div className="font-semibold">{ch(cur.config.challenge).icon} {ch(cur.config.challenge).name}</div>
          <p className="text-xs text-muted">{ch(cur.config.challenge).rule}</p>
          {cur.config.status === "on" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="btn-gold !py-2" onClick={() => {
                update(cur.id, { config: { ...cur.config, status: "won" } });
                const r = logActivity("detox", { name: ch(cur.config.challenge).name, challenge: cur.config.challenge, ok: true }, new Date(), DETOX_XP);
                celebrate({ title: "DETOX DAY WON!", subtitle: ch(cur.config.challenge).name, xp: r.xp, big: true, icon: "📵" });
              }}>✓ I kept it</button>
              <button className="btn-ghost !py-2" onClick={() => update(cur.id, { config: { ...cur.config, status: "failed" } })}>I slipped</button>
            </div>
          ) : <p className="mt-2 text-sm">{cur.config.status === "won" ? "🏆 Won today. Proud of you." : "Slipped today. Tomorrow is a new try. Honesty is a win too."}</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          {DETOX.map((x) => (
            <button key={x.id} onClick={() => add(x.name, { day, challenge: x.id, status: "on" })} className="rounded-xl bg-white/5 p-3 text-left">
              <div className="font-semibold text-sm">{x.icon} {x.name}</div><div className="text-xs text-muted">{x.rule}</div>
            </button>
          ))}
        </div>
      )}
      {items.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {items.slice(-28).map((i) => <span key={i.id} title={`${i.config.day} ${i.name}`} className={`h-5 w-5 rounded-md text-[10px] grid place-items-center ${i.config.status === "won" ? "bg-emerald-500/70" : i.config.status === "failed" ? "bg-rose-500/40" : "bg-white/15"}`}>{i.config.status === "won" ? "✓" : ""}</span>)}
        </div>
      )}
    </Sheet>
  );
}

// ---------- 38 Sleep planner: 90-minute cycles ----------
export function SleepPlanSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveSettings, celebrate } = useApp();
  const sc = sched(profile.settings.schedule);
  const [wake, setWake] = useState(sleepTimes(sc).wake);
  const beds = bedtimes(wake);
  const now = wakeTimes();
  return (
    <Sheet title="🛌 Sleep planner" onClose={onClose}>
      <p className="text-sm text-muted">Sleep comes in 90-minute cycles. Waking at the end of a cycle feels easy; waking in the middle feels awful. Times include 15 minutes to fall asleep.</p>
      <label className="text-xs text-muted">I want to wake up at<input type="time" className="input mt-1" value={wake} onChange={(e) => e.target.value && setWake(e.target.value)} /></label>
      <div className="grid gap-2">
        {beds.map((b) => (
          <div key={b.cycles} className={`rounded-xl p-3 flex items-center gap-3 ${b.best ? "bg-indigo-500/20 border border-indigo-300/40" : "bg-white/5"}`}>
            <span className="text-2xl">{b.cycles === 6 ? "🌟" : b.cycles === 5 ? "😊" : "😐"}</span>
            <span className="flex-1"><b className="text-lg">{fmt12(b.bed)}</b><span className="block text-xs text-muted">{b.cycles} cycles · {b.hours} h of sleep{b.cycles === 6 ? " · best" : b.cycles === 4 ? " · only if you must" : ""}</span></span>
            <button className="chip" onClick={() => {
              saveSettings({ schedule: { ...(profile.settings.schedule ?? {}), sleep: b.bed, wake } });
              celebrate({ title: "BEDTIME SET", subtitle: `Bed ${fmt12(b.bed)} · wake ${fmt12(wake)}. Sensei will remind you.`, kind: "small", icon: "🛌" });
            }}>Use</button>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/5 p-3 text-sm">
        <div className="text-xs text-muted mb-1">Going to sleep right now ({hhmm(new Date())})? Wake up at:</div>
        <div className="flex flex-wrap gap-2">{now.map((w) => <span key={w.cycles} className="chip">{fmt12(w.wake)} <span className="text-muted">· {w.hours} h</span></span>)}</div>
      </div>
      <p className="text-xs text-muted">Your saved bedtime now: {fmt12(sc.sleep)}, wake {fmt12(sc.wake)}.</p>
    </Sheet>
  );
}

// ---------- 71 Night mode: dim screen, sleep countdown, fun locked ----------
const NIGHT_KEY = "lifeos-night";
export const nightOn = () => { try { return Number(localStorage.getItem(NIGHT_KEY) ?? 0) > Date.now(); } catch { return false; } };
export function setNight(on: boolean) {
  // Night mode switches itself off at 10 am the next morning.
  const until = new Date(); if (until.getHours() >= 10) until.setDate(until.getDate() + 1); until.setHours(10, 0, 0, 0);
  try { if (on) localStorage.setItem(NIGHT_KEY, String(until.getTime())); else localStorage.removeItem(NIGHT_KEY); } catch {}
  window.dispatchEvent(new Event(NIGHT_KEY));
}
export function NightSheet({ onClose }: { onClose: () => void }) {
  const [on, setOn] = useState(nightOn);
  const { profile } = useApp();
  const bed = sleepTimes(sched(profile.settings.schedule)).sleep;
  return (
    <Sheet title="🌙 Night mode" onClose={onClose}>
      <p className="text-sm text-muted">Dims the whole app with a warm filter, shows a countdown to your bedtime ({fmt12(bed)}) and locks fun: anime, games and scrolling logged now get stopped. It turns itself off at 10 am.</p>
      <button onClick={() => { setNight(!on); setOn(!on); if (!on) onClose(); }} className={on ? "btn-ghost w-full" : "btn-primary w-full"}>{on ? "☀️ Turn night mode off" : "🌙 Turn night mode on"}</button>
    </Sheet>
  );
}
// Mounted once in the app layout.
export function NightLayer() {
  const { data, profile, logActivity, deleteLog, celebrate } = useApp();
  const [on, setOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [caught, setCaught] = useState<Log | null>(null);
  const path = usePathname();
  useEffect(() => {
    const sync = () => setOn(nightOn());
    sync();
    window.addEventListener(NIGHT_KEY, sync);
    const t = setInterval(() => { sync(); setNow(Date.now()); }, 30_000);
    return () => { window.removeEventListener(NIGHT_KEY, sync); clearInterval(t); };
  }, []);
  // Fun logged while night mode is on gets caught.
  const seen = useRef<string | null>(null);
  const last = data.logs[data.logs.length - 1];
  useEffect(() => {
    if (!last || seen.current === last.id) return;
    const first = seen.current === null;
    seen.current = last.id;
    if (!first && on && logKarma(last) < 0 && Date.now() - new Date(last.created_at).getTime() < 60_000) setCaught(last);
  }, [last, on]);
  const asleep = data.logs.some((l) => l.kind === "sleep" && !l.data.end);
  const bed = sleepTimes(sched(profile.settings.schedule)).sleep;
  const mins = useMemo(() => { const d = new Date(now); const m = d.getHours() * 60 + d.getMinutes(); return ((toMin(bed) - m) % 1440 + 1440) % 1440; }, [now, bed]);
  if (!on || path === "/control") return null;
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]" style={{ background: "rgba(20,8,0,.42)", mixBlendMode: "multiply" }} />
      {!asleep && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[61] rounded-full bg-[#1a1030]/95 border border-indigo-300/30 px-3 py-1.5 text-xs flex items-center gap-2 shadow-lg">
          <span>🌙 {mins > 720 ? "Past bedtime!" : `Bed in ${Math.floor(mins / 60) ? `${Math.floor(mins / 60)}h ` : ""}${mins % 60}m`} · 🔒 fun</span>
          <button className="chip !py-0.5 !px-2" onClick={() => { logActivity("sleep", { start: new Date().toISOString(), end: null, type: "night" }); celebrate({ title: "OYASUMI!", subtitle: "Sleep well, hero.", icon: "😴" }); }}>😴 Sleep</button>
          <button aria-label="Night mode off" className="text-muted" onClick={() => setNight(false)}>✕</button>
        </div>
      )}
      {caught && (
        <div data-overlay className="fixed inset-0 z-[62] grid place-items-center bg-[#05020d]/95 p-6">
          <div className="card frame max-w-sm w-full p-5 text-center">
            <div className="text-5xl">🌙🔒</div>
            <h2 className="mt-2 font-game text-xl font-black">Fun is locked at night</h2>
            <p className="mt-1 text-sm text-muted">You just logged “{describe(caught).title}”. Night mode is on: tonight belongs to sleep. Tomorrow&apos;s you will thank you.</p>
            <button className="btn-primary w-full mt-4" onClick={() => { deleteLog(caught.id); setCaught(null); }}>Undo it and put the phone down</button>
            <button className="btn-ghost w-full mt-2 text-sm" onClick={() => setCaught(null)}>Keep the record (honest)</button>
          </div>
        </div>
      )}
    </>
  );
}

