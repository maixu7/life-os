"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nextTasks, snooze, type Action, type Task } from "@/lib/coach";
import { isNapTime } from "@/lib/slots";
import { useApp, useCustomItems } from "@/lib/store";
import { pick, SLEEP_WHY, WISDOM, type Wisdom } from "@/lib/wisdom";

// Runs what the Sensei asked for. Simple things are logged right away;
// things that need details open the right sheet on Base Camp.
export function useRunAction() {
  const { data, logActivity, updateLog, celebrate } = useApp();
  const router = useRouter();
  const path = usePathname();
  return useCallback((a: Action) => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    switch (a.type) {
      case "water": logActivity("water", { ml: 250 }); celebrate({ title: "GULP!", subtitle: "+250 ml water" }); return;
      case "milk": logActivity("milk", { ml: 250 }); celebrate({ title: "STRONG BONES!", subtitle: "+250 ml milk" }); return;
      case "sleep": {
        const nap = isNapTime(now);
        logActivity("sleep", { start: now.toISOString(), end: null, type: nap ? "nap" : "night" });
        celebrate({ title: nap ? "POWER NAP!" : "OYASUMI!", subtitle: nap ? "Day nap started" : "Night sleep started. Sleep well, hero." });
        return;
      }
      case "wake": {
        const open = [...data.logs].reverse().find((l) => l.kind === "sleep" && !l.data.end);
        if (open) updateLog(open.id, { data: { end: now.toISOString() } });
        logActivity("wake", { time: hhmm, slept_from: open?.data.start ?? null });
        celebrate({ title: "OHAYO!", subtitle: `Woke up at ${hhmm}` });
        return;
      }
      case "href": router.push(a.href); return;
      default: {
        const detail = a.type === "activity" ? `activity:${a.name}` : "library";
        if (path === "/") window.dispatchEvent(new CustomEvent("lifeos-do", { detail }));
        else router.push(`/?do=${encodeURIComponent(detail)}`);
      }
    }
  }, [data.logs, logActivity, updateLog, celebrate, router, path]);
}

export function useTasks() {
  const { data } = useApp();
  const { items: habits } = useCustomItems("habit");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => nextTasks(data, habits), [data, habits, tick]);
}

function TaskBody({ t }: { t: Task }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-2xl">{t.icon}</span>
        <div className="font-game font-bold">{t.title}</div>
      </div>
      <div className="mt-2 text-sm"><span className="text-[var(--accent2)] font-semibold">Why do it: </span>{t.why}</div>
      <div className="mt-1 text-xs text-muted"><span className="font-semibold">Why I picked this: </span>{t.because}</div>
    </>
  );
}

// Base Camp card: the one thing to do right now.
export function CoachCard() {
  const tasks = useTasks();
  const run = useRunAction();
  const [i, setI] = useState(0);
  const [, force] = useState(0);
  const t = tasks[i % Math.max(1, tasks.length)];
  if (!t) return null;
  return (
    <section className="card frame p-4 mb-4 border-[var(--accent2)]/40 animate-pulse-glow">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">🎯 Sensei&apos;s order</h2>
        {tasks.length > 1 && <span className="text-[10px] text-muted">{(i % tasks.length) + 1} of {tasks.length}</span>}
      </div>
      <TaskBody t={t} />
      <div className="mt-3 flex gap-2">
        <button onClick={() => run(t.action)} className="btn-primary flex-1">Do it now</button>
        <button onClick={() => { snooze(t.id); force((n) => n + 1); }} className="btn-ghost text-sm">Later</button>
        {tasks.length > 1 && <button onClick={() => setI(i + 1)} className="btn-ghost text-sm">Next</button>}
      </div>
    </section>
  );
}

type Pop = { kind: "wisdom"; w: Wisdom; top: boolean } | { kind: "task"; t: Task; top: boolean };

const NIGHT_REASONS: [string, string][] = [
  ["📚 Studying", "Respect for studying late, but memory is saved during sleep. Close the book now and revise 10 minutes in the morning: you'll remember more."],
  ["📱 Scrolling / watching", "The feed never ends; your night does. Put the phone across the room and give your brain the rest it is begging for."],
  ["😟 Can't sleep", "Try 4-7-8 breathing: breathe in 4 seconds, hold 7, out 8. Repeat four times. Keep the lights and the screen off."],
  ["💼 Work to finish", "Write the last step on paper so your mind can let go. Tomorrow's fresh brain finishes in 20 minutes what a tired one does in an hour."],
  ["😐 Not tired", "Lie down with the lights off anyway, or read a paper book. Tomorrow wake at the same time and you'll be sleepy on time."],
];

// Pops up quotes, advice and Sensei's orders at random moments, and asks
// why you're not asleep late at night.
export function Popper() {
  const { data } = useApp();
  const tasks = useTasks();
  const run = useRunAction();
  const [pop, setPop] = useState<Pop | null>(null);
  const latest = useRef(tasks);
  useEffect(() => { latest.current = tasks; }, [tasks]);
  const [night, setNight] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const asleep = data.logs.some((l) => l.kind === "sleep" && !l.data.end);

  // Random popups every 3 to 8 minutes while the app is open.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (first = false) => {
      const wait = (first ? 60 + Math.random() * 60 : 180 + Math.random() * 300) * 1000;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible" && !document.querySelector("[data-overlay]")) {
          const top = Math.random() < 0.5;
          const ts = latest.current;
          setPop((p) => p ?? (Math.random() < 0.6 || !ts.length ? { kind: "wisdom", w: pick(WISDOM), top } : { kind: "task", t: ts[0], top }));
        }
        schedule();
      }, wait);
    };
    schedule(true);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!pop) return;
    const t = setTimeout(() => setPop(null), 12_000);
    return () => clearTimeout(t);
  }, [pop]);

  // Late at night: ask why you're still up (on open and every 20 minutes).
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      if (asleep || !(h >= 23 || h < 4) || document.visibilityState !== "visible") return;
      try {
        const last = Number(sessionStorage.getItem("lifeos-night") ?? 0);
        if (Date.now() - last < 20 * 60_000) return;
        sessionStorage.setItem("lifeos-night", String(Date.now()));
      } catch {}
      setAnswer(null);
      setNight(true);
    };
    const first = setTimeout(check, 8000);
    const t = setInterval(check, 60_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [asleep]);

  return (
    <>
      {pop && (
        <div className={`fixed left-3 right-3 z-40 mx-auto max-w-md animate-sheet ${pop.top ? "top-3" : "bottom-24"}`}>
          <div className="card frame p-4 bg-[#1c1330]/95 backdrop-blur" onClick={() => setPop(null)}>
            {pop.kind === "wisdom" ? (
              <>
                <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">
                  {pop.w.kind === "quote" ? "💬 WORDS OF THE GREATS" : pop.w.kind === "fact" ? "🧠 DID YOU KNOW" : "🥷 SENSEI'S ADVICE"}
                </div>
                <p className="mt-1 text-sm">{pop.w.kind === "quote" ? `“${pop.w.text}”` : pop.w.text}</p>
                {pop.w.by && <p className="mt-1 text-xs text-muted text-right">— {pop.w.by}</p>}
              </>
            ) : (
              <>
                <div className="text-[10px] font-game tracking-widest text-[var(--accent2)] mb-2">🎯 SENSEI&apos;S ORDER</div>
                <TaskBody t={pop.t} />
                <div className="mt-3 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); run(pop.t.action); setPop(null); }} className="btn-primary flex-1 !py-2">Do it now</button>
                  <button onClick={(e) => { e.stopPropagation(); snooze(pop.t.id); setPop(null); }} className="btn-ghost !py-2 text-sm">Later</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {night && !asleep && (
        <div data-overlay className="fixed inset-0 z-50 grid place-items-center bg-[#05020d]/90 p-5 animate-fade">
          <div className="card frame w-full max-w-md p-5 text-center">
            <div className="text-5xl animate-float">🌙</div>
            <h2 className="mt-2 font-game text-xl font-black">Why are you not sleeping, hero?</h2>
            <p className="mt-1 text-sm text-muted">It is {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. {pick(SLEEP_WHY)}</p>
            {!answer ? (
              <div className="mt-4 grid gap-2">
                {NIGHT_REASONS.map(([r, adv]) => <button key={r} onClick={() => setAnswer(adv)} className="btn-ghost text-left">{r}</button>)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-white/5 p-3 text-left text-sm flex gap-2"><span className="text-2xl">🥷</span><span>{answer}</span></div>
            )}
            <button onClick={() => { run({ type: "sleep" }); setNight(false); }} className="btn-primary w-full mt-4">I&apos;m going to sleep now</button>
            <button onClick={() => setNight(false)} className="mt-2 text-xs text-muted">Not yet (I&apos;ll be reminded in 20 min)</button>
          </div>
        </div>
      )}
    </>
  );
}
