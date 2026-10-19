"use client";

import { openSlotSheet } from "@/components/Blocks";
import { alarmPrefs, ring } from "@/lib/alarm";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nextTasks, snooze, type Action, type Task } from "@/lib/coach";
import { useApp, useCustomItems } from "@/lib/store";
import { ScheduleSheet } from "@/components/ScheduleSheet";
import { MyTaskSheet } from "@/components/MyTasks";
import { SpeakButton } from "@/components/Safety";
import { speak } from "@/lib/safety";
import { gaps, handledToday } from "@/lib/gaps";
import { wokeRecently } from "@/lib/schedule";
import { DAY_LABEL, fmt12, isQuiet, PHASE_LINES, phaseNow, sched, sleepTimes, type Now } from "@/lib/schedule";
import { pick, SLEEP_WHY, WISDOM, type Wisdom } from "@/lib/wisdom";
import { pushInbox } from "@/lib/inbox";
import { allFacts } from "@/lib/review";
import { toDay } from "@/lib/store";

// Runs what the Sensei asked for. Simple things are logged right away;
// things that need details open the right sheet on Base Camp.
export function useRunAction() {
  const router = useRouter();
  const path = usePathname();
  return useCallback((a: Action) => {
    switch (a.type) {
      // Never log on a bare tap: these open the sheet that asks for the details.
      case "water": openSlotSheet({ kind: "drink", cat: "water" }); return;
      case "milk": openSlotSheet({ kind: "drink", cat: "milk" }); return;
      case "sleep": openSlotSheet({ kind: "sleep" }); return;
      case "wake": openSlotSheet({ kind: "wake" }); return;
      case "href": router.push(a.href); return;
      default: {
        const detail = a.type === "activity" ? `activity:${a.name}` : "library";
        if (path === "/") window.dispatchEvent(new CustomEvent("lifeos-do", { detail }));
        else router.push(`/?do=${encodeURIComponent(detail)}`);
      }
    }
  }, [router, path]);
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
        <div className="font-game font-bold flex-1">{t.title}</div>
        <SpeakButton text={`${t.title}. ${t.why}`} />
      </div>
      <div className="mt-2 text-sm"><span className="text-[var(--accent2)] font-semibold">Why do it: </span>{t.why}</div>
      <div className="mt-1 text-xs text-muted"><span className="font-semibold">Why I picked this: </span>{t.because}</div>
    </>
  );
}

// Base Camp card: the one thing to do right now.
export function CoachCard() {
  const tasks = useTasks();
  const { data } = useApp();
  const [plan, setPlan] = useState(false);
  const sc = sched(data.profile.settings.schedule);
  const n0 = phaseNow(sc);
  const n = n0.phase === "sleep" && wokeRecently(data.logs) ? { ...n0, phase: "morning" as const, label: "Morning (you're up)" } : n0;
  const run = useRunAction();
  const [i, setI] = useState(0);
  const [, force] = useState(0);
  const t = tasks[i % Math.max(1, tasks.length)];
  const now = (
    <button onClick={() => setPlan(true)} className="mb-2 w-full rounded-xl bg-white/5 px-3 py-2 text-left text-xs flex items-center gap-2">
      <span className="text-lg">{PHASE_ICON[n.phase]}</span>
      <span className="flex-1"><b>{n.label}</b>{n.minsLeft != null && n.minsLeft < 600 ? ` · ${Math.floor(n.minsLeft / 60) ? `${Math.floor(n.minsLeft / 60)}h ` : ""}${n.minsLeft % 60}m left` : ""} · {DAY_LABEL[n.day]}</span>
      <span className="text-muted">Schedule ›</span>
    </button>
  );
  const [mine, setMine] = useState(false);
  const sheet = <>{plan && <ScheduleSheet onClose={() => setPlan(false)} />}{mine && <MyTaskSheet onClose={() => setMine(false)} />}</>;
  // What the Sensei read before choosing: today's numbers from every part of the app.
  const read = useMemo(() => {
    const day = toDay(new Date());
    const f = allFacts(data).days.get(day);
    const logs = data.logs.filter((l) => l.day === day);
    const drinks = logs.filter((l) => l.kind === "drink" || l.kind === "milk").length;
    const buy = data.shopping.filter((i) => i.status === "to_buy").length;
    return [`📖 ${f?.studyMin ?? 0} min`, `🏋️ ${f?.sets ?? 0} sets`, `🍱 ${f?.kcal ?? 0} kcal`, `💧 ${f?.water ?? 0} ml`, `🥤 ${drinks}`, `🛒 ${buy} to buy`].join(" · ");
  }, [data]);
  const readLine = <p className="mt-2 text-[10px] text-muted">Sensei read today: {read}</p>;
  if (!t) return <><section className="card p-3 mb-4">{now}{readLine}</section>{sheet}</>;
  return (
    <>{sheet}
    <section className="card frame p-4 mb-4 border-[var(--accent2)]/40 animate-pulse-glow">
      {now}
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">🎯 Sensei&apos;s order</h2>
        <span className="flex items-center gap-2">
          {tasks.length > 1 && <span className="text-[10px] text-muted">{(i % tasks.length) + 1} of {tasks.length}</span>}
          <button onClick={() => setMine(true)} className="chip !py-0.5 text-[11px]">＋ My task</button>
        </span>
      </div>
      <TaskBody t={t} />
      <div className="mt-3 flex gap-2">
        <button onClick={() => run(t.action)} className="btn-primary flex-1">Do it now</button>
        <button onClick={() => { snooze(t.id); force((n) => n + 1); }} className="btn-ghost text-sm">Later</button>
        {tasks.length > 1 && <button onClick={() => setI(i + 1)} className="btn-ghost text-sm">Next</button>}
      </div>
      {readLine}
    </section>
    </>
  );
}

type Pop = { kind: "wisdom"; w: Wisdom; top: boolean } | { kind: "task"; t: Task; top: boolean; level: number } | { kind: "phase"; n: Now; line: string; top: boolean };

const PHASE_ICON: Record<string, string> = { winddown: "🛏️", morning: "🌅", commute: "🚌", work: "💼", break: "☕", nap: "😴", study: "📖", free: "🌴", sleep: "🌙" };
const GAP: Record<string, number> = { off: Infinity, low: 2.5, normal: 1, high: 0.5 };

const NIGHT_REASONS: [string, string][] = [
  ["📚 Studying", "Respect for studying late, but memory is saved during sleep. Close the book now and revise 10 minutes in the morning: you'll remember more."],
  ["📱 Scrolling / watching", "The feed never ends; your night does. Put the phone across the room and give your brain the rest it is begging for."],
  ["😟 Can't sleep", "Try 4-7-8 breathing: breathe in 4 seconds, hold 7, out 8. Repeat four times. Keep the lights and the screen off."],
  ["💼 Work to finish", "Write the last step on paper so your mind can let go. Tomorrow's fresh brain finishes in 20 minutes what a tired one does in an hour."],
  ["😐 Not tired", "Lie down with the lights off anyway, or read a paper book. Tomorrow wake at the same time and you'll be sleepy on time."],
];
const WOKE_REASONS: [string, string][] = [
  ["🚽 Bathroom / water", "Fine. Keep the lights low, don't check the feed, and go straight back to bed."],
  ["😟 Woke up and can't sleep", "Don't fight it with the phone. Breathe 4-7-8 with your eyes closed. If 20 minutes pass, read a paper book in dim light."],
  ["😰 Bad dream", "You're safe. Write one line about it in your journal tomorrow, take three slow breaths, and lie back down."],
  ["🔔 Notification woke me", "Turn on Do Not Disturb for the night. Your sleep is worth more than any message."],
];

function CheckGaps() {
  const { data } = useApp();
  const list = useMemo(() => {
    const seen = new Set<string>();
    return [...gaps(data, "day").gaps, ...gaps(data, "week").gaps].filter((g) => !handledToday(data, g.id) && !seen.has(g.id) && !!seen.add(g.id)).slice(0, 5);
  }, [data]);
  if (!list.length) return <p className="mt-3 text-sm text-center">✨ Nothing is lacking right now. Keep going!</p>;
  return (
    <div className="mt-3 grid gap-1.5">
      {list.map((g) => (
        <div key={g.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm">
          <span className="text-lg">{g.icon}</span>
          <span className="flex-1">{g.label}: <span className="text-rose-300">{g.have}</span></span>
          <span className="text-[11px] text-muted">need {g.need}</span>
        </div>
      ))}
    </div>
  );
}

// How many times today the Sensei has had to repeat an order. Each repeat
// comes back sooner and bigger, until you do it.
const NAG = "lifeos-nag:";
const nagKey = (id: string) => `${NAG}${new Date().toDateString()}:${id}`;
export function nagCount(id: string) {
  try { return Number(localStorage.getItem(nagKey(id)) ?? 0); } catch { return 0; }
}
function nagMore(id: string) {
  try { localStorage.setItem(nagKey(id), String(nagCount(id) + 1)); } catch {}
}
const NAG_WORDS = ["", "I'm saying it again.", "Third time, hero. Do it.", "I won't stop asking.", "Enough excuses. NOW."];

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
  const openSleep = data.logs.find((l) => l.kind === "sleep" && !l.data.end);
  const asleep = !!openSleep;
  const sc = sched(data.profile.settings.schedule);
  const scRef = useRef(sc);
  useEffect(() => { scRef.current = sc; });
  const [woke, setWoke] = useState(false);
  const logsRef = useRef(data.logs);
  useEffect(() => { logsRef.current = data.logs; });

  // The most important order pops up every few minutes while the app is
  // open; every time you put it off it comes back sooner and bigger.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (first = false) => {
      if (scRef.current.popups === "off") { timer = setTimeout(() => schedule(first), 60_000); return; }
      const top0 = latest.current[0];
      const n = top0 ? nagCount(top0.id) : 0;
      const wait = Math.max(45, (first ? 60 + Math.random() * 60 : 180 + Math.random() * 300) / (1 + n)) * 1000;
      timer = setTimeout(() => {
        const c = scRef.current;
        const ph = phaseNow(c).phase;
        // Fewer interruptions in work hours; none in quiet hours or when turned off.
        const skip = isQuiet(c) || ph === "sleep" || (ph === "work" && Math.random() < 0.7);
        if (!skip && document.visibilityState === "visible" && !document.querySelector("[data-overlay]")) {
          const top = Math.random() < 0.5;
          const ts = latest.current;
          if (ts.length) setPop((p) => p ?? { kind: "task", t: ts[0], top, level: nagCount(ts[0].id) });
        }
        schedule();
      }, wait * (GAP[scRef.current.popups] ?? 1));
    };
    schedule(true);
    return () => clearTimeout(timer);
  }, []);

  // Read-aloud mode (Display & reading) speaks each pop-up as it appears.
  useEffect(() => {
    if (!pop) return;
    speak(pop.kind === "task" ? `${pop.t.title}. ${pop.t.why}` : pop.kind === "phase" ? pop.line : pop.w.text);
  }, [pop]);

  // Nothing closes by itself: Sensei's orders and quotes stay until tapped.
  // Every popup is also kept in the bell inbox.
  useEffect(() => {
    if (!pop) return;
    if (pop.kind === "task") pushInbox({ kind: "sensei", icon: pop.t.icon, title: pop.t.title, body: pop.t.why });
    else if (pop.kind === "phase") pushInbox({ kind: "sensei", icon: "🥷", title: pop.n.label, body: pop.line });
    else if (pop.kind === "wisdom") pushInbox({ kind: "wisdom", icon: "💬", title: pop.w.text, body: pop.w.by });
  }, [pop]);

  // Big motivational quotes at random moments, on any screen.
  const [quote, setQuote] = useState<Wisdom | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const RANGE: Record<string, [number, number]> = { high: [15, 60], normal: [30, 180], low: [180, 480] };
    const next = () => {
      const [a, b] = RANGE[scRef.current.popups] ?? [60, 60];
      timer = setTimeout(() => {
        const c = scRef.current;
        const ph = phaseNow(c).phase;
        const ok = c.popups !== "off" && !isQuiet(c) && ph !== "sleep" && !(ph === "work" && Math.random() < 0.7);
        if (ok && document.visibilityState === "visible" && !document.querySelector("[data-overlay]")) setQuote((q) => q ?? pick(WISDOM));
        next();
      }, (a + Math.random() * (b - a)) * 1000);
    };
    next();
    return () => clearTimeout(timer);
  }, [sc.popups]);
  // Quotes stay until the hero taps them.
  useEffect(() => { if (quote) speak(quote.text); }, [quote]);
  useEffect(() => { if (quote) pushInbox({ kind: "wisdom", icon: quote.kind === "quote" ? "💬" : quote.kind === "fact" ? "🧠" : "🥷", title: quote.text, body: quote.by }); }, [quote]);

  // Check-ins at 9 AM, 12 PM, 5 PM and 8 PM: what's lacking and what to do now.
  const [cp, setCp] = useState<{ hour: number; tasks: Task[] } | null>(null);

  useEffect(() => { if (cp) pushInbox({ kind: "sensei", icon: "🕘", title: `${cp.hour > 12 ? cp.hour - 12 : cp.hour} ${cp.hour >= 12 ? "PM" : "AM"} check-in`, body: cp.tasks.map((t) => `${t.icon} ${t.title}`).join(" · ") || "See what you're lacking." }); }, [cp]);

  // Reads the clock against the hero's schedule whenever the app is opened or
  // comes back to the screen, and every minute while it stays open.
  const lastPhase = useRef<string>("");
  useEffect(() => {
    const once = (key: string, mins: number) => {
      try {
        const last = Number(sessionStorage.getItem(key) ?? 0);
        if (Date.now() - last < mins * 60_000) return false;
        sessionStorage.setItem(key, String(Date.now()));
      } catch {}
      return true;
    };
    const check = (opened: boolean) => {
      if (document.visibilityState !== "visible") return;
      const c = scRef.current;
      const n = phaseNow(c);
      const changed = n.phase !== lastPhase.current;
      lastPhase.current = n.phase;
      if (openSleep) {
        // Asleep on record but using the phone: ask why (only on open, a few minutes after lying down).
        const since = (Date.now() - new Date(String(openSleep.data.start)).getTime()) / 60_000;
        if (opened && since >= 3 && once("lifeos-woke", 15)) { setAnswer(null); setWoke(true); }
        return;
      }
      if (n.phase === "sleep" && !wokeRecently(logsRef.current)) {
        // Every time the app is opened at night, and every 20 minutes while it stays open.
        if (opened ? once("lifeos-night-open", 2) : once("lifeos-night", 20)) { setAnswer(null); setNight(true); }
        return;
      }
      const hr = new Date().getHours();
      const point = [20, 17, 12, 9].find((x) => hr >= x && hr < x + 3);
      if (point != null && !document.querySelector("[data-overlay]")) {
        const key = `lifeos-cp:${new Date().toDateString()}:${point}`;
        let seen = false;
        try { seen = !!localStorage.getItem(key); if (!seen) localStorage.setItem(key, "1"); } catch {}
        if (!seen) { setCp({ hour: point, tasks: latest.current.slice(0, 3) }); return; }
      }
      if (c.popups === "off" || isQuiet(c)) return;
      if ((opened && once(`lifeos-phase:${n.phase}`, 45)) || (changed && !opened)) {
        if (document.querySelector("[data-overlay]")) return;
        setPop({ kind: "phase", n, line: pick(PHASE_LINES[n.phase]), top: true });
        if (changed && !opened && alarmPrefs().phase && ["study", "work", "break", "winddown"].includes(n.phase)) ring({ rounds: 3 });
      }
    };
    const first = setTimeout(() => check(true), 2500);
    const t = setInterval(() => check(false), 60_000);
    const vis = () => document.visibilityState === "visible" && check(true);
    document.addEventListener("visibilitychange", vis);
    return () => { clearTimeout(first); clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [openSleep]);

  const bed = sleepTimes(sc).sleep;
  const lateBy = (() => { const now = new Date(); const m = now.getHours() * 60 + now.getMinutes(); const [bh, bm] = bed.split(":").map(Number); return (m - (bh * 60 + bm) + 1440) % 1440; })();
  const sleptAt = openSleep ? new Date(String(openSleep.data.start)) : null;

  return (
    <>
      {pop?.kind === "task" && pop.level > 0 && (
        <NagPop t={pop.t} level={pop.level} onDo={() => { run(pop.t.action); setPop(null); }}
          onLater={() => { nagMore(pop.t.id); snooze(pop.t.id, Math.max(5, 30 - pop.level * 8)); setPop(null); }} />
      )}
      {pop && !(pop.kind === "task" && pop.level > 0) && (
        <div className={`fixed left-3 right-3 z-[38] mx-auto max-w-md animate-sheet ${pop.top ? "top-3" : "bottom-24"}`}>
          <div className="card frame p-4 bg-[#1c1330]/95 backdrop-blur" onClick={() => { if (pop.kind === "task") nagMore(pop.t.id); setPop(null); }}>
            {pop.kind === "phase" ? (
              <>
                <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">
                  {PHASE_ICON[pop.n.phase]} {pop.n.label.toUpperCase()} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {pop.n.minsLeft != null && pop.n.minsLeft < 600 ? ` · ${Math.floor(pop.n.minsLeft / 60) ? `${Math.floor(pop.n.minsLeft / 60)}h ` : ""}${pop.n.minsLeft % 60}m left` : ""}
                </div>
                <p className="mt-1 text-sm">🥷 {pop.line}</p>
              </>
            ) : pop.kind === "wisdom" ? (
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
                  <button onClick={(e) => { e.stopPropagation(); nagMore(pop.t.id); snooze(pop.t.id, 30); setPop(null); }} className="btn-ghost !py-2 text-sm">Later</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {quote && (
        <div data-overlay className="fixed inset-0 z-[45] grid place-items-center bg-[#05020d]/95 backdrop-blur-md p-6 animate-fade" onClick={() => setQuote(null)}>
          <div className="w-full max-w-md text-center">
            <div className="text-5xl animate-float">{quote.kind === "quote" ? "💬" : quote.kind === "fact" ? "🧠" : "🥷"}</div>
            <div className="mt-3 text-xs font-game tracking-[.3em] text-[var(--accent2)]">
              {quote.kind === "quote" ? "WORDS OF THE GREATS" : quote.kind === "fact" ? "DID YOU KNOW" : "SENSEI'S ADVICE"}
            </div>
            <p className="mt-4 font-game text-2xl font-black leading-snug">{quote.kind === "quote" ? `“${quote.text}”` : quote.text}</p>
            {quote.by && <p className="mt-3 text-sm text-muted">— {quote.by}</p>}
            <p className="mt-8 text-[11px] text-muted">Tap to close</p>
          </div>
        </div>
      )}
      {cp && (
        <div data-overlay className="fixed inset-0 z-50 grid place-items-center bg-[#05020d]/90 p-5 animate-fade">
          <div className="card frame w-full max-w-md p-5 max-h-[90dvh] overflow-y-auto">
            <div className="text-center">
              <div className="text-xs font-game tracking-widest text-[var(--accent2)]">{cp.hour === 9 ? "🌅" : cp.hour === 12 ? "☀️" : cp.hour === 17 ? "🌇" : "🌙"} {cp.hour > 12 ? cp.hour - 12 : cp.hour} {cp.hour >= 12 ? "PM" : "AM"} CHECK-IN</div>
              <h2 className="mt-1 font-game text-xl font-black">Here&apos;s what you&apos;re lacking</h2>
            </div>
            <CheckGaps />
            {cp.tasks.length > 0 && (
              <>
                <div className="mt-3 text-xs text-muted">Do these next:</div>
                <div className="mt-1 grid gap-2">
                  {cp.tasks.map((t) => (
                    <button key={t.id} onClick={() => { run(t.action); setCp(null); }} className="rounded-xl bg-white/5 p-2 text-left text-sm flex items-center gap-2">
                      <span className="text-xl">{t.icon}</span>
                      <span className="flex-1"><b>{t.title}</b><span className="block text-[11px] text-muted">{t.because}</span></span>
                      <span className="text-[var(--accent2)]">›</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setCp(null)} className="btn-primary w-full mt-4">Got it, Sensei</button>
          </div>
        </div>
      )}
      {night && !asleep && (
        <div data-overlay className="fixed inset-0 z-50 grid place-items-center bg-[#05020d]/90 p-5 animate-fade">
          <div className="card frame w-full max-w-md p-5 text-center">
            <div className="text-5xl animate-float">🌙</div>
            <h2 className="mt-2 font-game text-xl font-black">Why are you awake, hero?</h2>
            <p className="mt-1 text-sm text-muted">
              It is {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Your bedtime was {fmt12(bed)}
              {lateBy > 0 && lateBy < 600 ? `, ${lateBy >= 60 ? `${Math.floor(lateBy / 60)}h ${lateBy % 60}m` : `${lateBy} min`} ago` : ""}. Why didn&apos;t you sleep? {pick(SLEEP_WHY)}
            </p>
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
      {woke && sleptAt && (
        <div data-overlay className="fixed inset-0 z-50 grid place-items-center bg-[#05020d]/90 p-5 animate-fade">
          <div className="card frame w-full max-w-md p-5 text-center">
            <div className="text-5xl animate-float">👀</div>
            <h2 className="mt-2 font-game text-xl font-black">You went to sleep at {sleptAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Why are you awake?</h2>
            <p className="mt-1 text-sm text-muted">
              It is {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, {Math.round((Date.now() - sleptAt.getTime()) / 60_000) >= 60
                ? `${Math.floor((Date.now() - sleptAt.getTime()) / 3_600_000)}h ${Math.round((Date.now() - sleptAt.getTime()) / 60_000) % 60}m`
                : `${Math.round((Date.now() - sleptAt.getTime()) / 60_000)} min`} after you lay down. Your wake time is {fmt12(sleepTimes(sc, sleptAt).wake)}.
            </p>
            {!answer ? (
              <div className="mt-4 grid gap-2">
                {WOKE_REASONS.map(([r, adv]) => <button key={r} onClick={() => setAnswer(adv)} className="btn-ghost text-left">{r}</button>)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-white/5 p-3 text-left text-sm flex gap-2"><span className="text-2xl">🥷</span><span>{answer}</span></div>
            )}
            <button onClick={() => setWoke(false)} className="btn-primary w-full mt-4">Going back to sleep</button>
            <button onClick={() => { run({ type: "wake" }); setWoke(false); }} className="btn-ghost w-full mt-2">I&apos;m up for the day (log wake-up)</button>
          </div>
        </div>
      )}
    </>
  );
}

// The order, repeated: a centred card, then a big one, then the whole screen.
function NagPop({ t, level, onDo, onLater }: { t: Task; level: number; onDo: () => void; onLater: () => void }) {
  const lv = Math.min(level, 4);
  const full = lv >= 3;
  return (
    <div data-overlay className={`fixed inset-0 z-[50] grid place-items-center p-4 animate-fade ${lv === 1 ? "bg-black/60" : lv === 2 ? "bg-black/85" : "bg-[#120018]"}`}>
      <div className={`w-full text-center animate-sheet ${full ? "max-w-lg" : lv === 2 ? "max-w-md card frame p-6 bg-[#1c1330]" : "max-w-sm card frame p-5 bg-[#1c1330]"}`}>
        <div className={`font-game tracking-widest text-rose-300 ${full ? "text-sm" : "text-[11px]"}`}>🥷 SENSEI&apos;S ORDER · {level + 1}{["st", "nd", "rd"][level] ?? "th"} TIME TODAY</div>
        <div className={`mx-auto mt-3 ${full ? "text-8xl animate-float" : lv === 2 ? "text-6xl" : "text-5xl"}`}>{t.icon}</div>
        <h2 className={`mt-3 font-game font-black leading-tight ${full ? "text-4xl glow-text" : lv === 2 ? "text-2xl" : "text-xl"}`}>{t.title}</h2>
        {NAG_WORDS[lv] && <p className={`mt-2 font-bold text-amber-300 ${full ? "text-xl" : "text-sm"}`}>{NAG_WORDS[lv]}</p>}
        <p className={`mt-3 ${full ? "text-base" : "text-sm"}`}><span className="text-[var(--accent2)] font-semibold">Why: </span>{t.why}</p>
        <p className="mt-1 text-xs text-muted">{t.because}</p>
        <button onClick={onDo} className={`btn-primary w-full mt-5 ${full ? "!py-5 text-2xl" : lv === 2 ? "!py-4 text-xl" : "!py-3 text-lg"}`}>Do it now</button>
        <button onClick={onLater} className={`mt-3 text-muted ${full ? "text-[11px]" : "text-xs"}`}>Not yet ({Math.max(5, 30 - level * 8)} min, then I ask again, bigger)</button>
      </div>
    </div>
  );
}
