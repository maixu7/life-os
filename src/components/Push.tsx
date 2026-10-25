"use client";

import { useEffect, useMemo, useState } from "react";
import { hm, sched, studyFrom, type Schedule } from "@/lib/schedule";
import { studyGate } from "@/lib/worst";
import { AREAS, taskOf } from "@/lib/mytasks";
import { toDay, type Data } from "@/lib/store";
import { steps } from "@/lib/mission";
import { fitOf } from "@/lib/focus";
import { useApp, useCustomItems, type CustomItem } from "@/lib/store";

// Phone notifications while the app is closed: Sensei's reminders are sent
// from the server at the right time (your reminders, wake, meals, study, bed).

type Plan = { at: string; body: string; days?: number[]; until?: "study"; first?: boolean; url?: string };
const ON = "lifeos-push-on";
const add = (t: string, mins: number) => { const [h, m] = t.split(":").map(Number); const x = (h * 60 + m + mins + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const weekdays = [1, 2, 3, 4, 5], weekend = [0, 6];

// Focus Area: each workout of the next 7 days with water before and after, posture
// nudges while sitting at work, and the weekly fitness report on Sunday evening.
export function fitPlan(d: Data, now = new Date()): Plan[] {
  const fit = fitOf(d.profile.settings.fit);
  if (!fit.on || !fit.remind) return [];
  const s = sched(d.profile.settings.schedule);
  const out: Plan[] = [{ at: "20:00", body: "📈 Your weekly fitness report is ready: what improved and what to do next.", days: [0], url: "/fit" }];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * 86_400_000), day = toDay(date), dow = date.getDay();
    for (const x of steps(d, day, i ? new Date(`${day}T00:00:00`) : now).filter((st) => /^a-fit-\d+$/.test(st.id) || st.id === "a-kegel")) {
      if (x.id === "a-kegel") { out.push({ at: x.time, body: `🌸 ${x.label}. 3 minutes, sit or lie down.`, days: [dow], url: "/fit" }); continue; }
      out.push({ at: add(x.time, -15), body: "💧 Drink 250 ml of water: training in 15 minutes.", days: [dow], url: "/fit" });
      out.push({ at: x.time, body: `💪 ${x.label}. Tap to start.`, days: [dow], url: "/fit" });
      if (x.end) out.push({ at: add(x.end, 5), body: "💧 Great work. Drink 300 ml of water now.", days: [dow] });
    }
  }
  if (fit.posture && s.workType !== "none" && s.workStart && s.workEnd) {
    const [a, b] = [s.workStart, s.workEnd].map((t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; });
    for (let m = a + 90; m < b - 30; m += 90) out.push({ at: hm(m), body: "🧍 Sitting long? Stand up, roll your shoulders back and do 10 chin tucks.", days: s.workDays });
  }
  return out;
}

export function buildPlan(s: Schedule, reminders: CustomItem[], studying: boolean, tasks: CustomItem[] = [], fit: Plan[] = []): Plan[] {
  // Reports: every day at 8 PM, every Saturday at 8 AM, and the month's on its first Saturday.
  const p: Plan[] = [
    { at: "20:00", body: "📊 Your day report is ready: what went well and what you lacked.", url: "/?report=day" },
    { at: "08:00", body: "📊 Your week report is ready. 2 minutes to see how the week went.", days: [6], url: "/?report=week" },
    { at: "08:00", body: "📊 Your month report is ready. See the month and what to fix next.", days: [6], first: true, url: "/?report=month" },
  ];
  p.push(...fit);
  p.push(...reminders.filter((r) => /^\d\d:\d\d$/.test(String(r.config.time))).map((r) => ({ at: String(r.config.time), body: `⏰ ${r.name}` })));
  const t = (at: string, body: string, days?: number[]) => { if (/^\d\d:\d\d$/.test(at)) p.push({ at, body, days }); };
  // Your own weekly tasks ring like Sensei's (one-date tasks show in the app).
  for (const k of tasks) { const m = taskOf(k); if (!m.date && m.days.length) t(m.time, `${AREAS[m.area].icon} ${k.name}`, m.days); }
  t(s.wake, "☀️ Good morning, hero! Drink a glass of water and open today's missions.", weekdays);
  t(s.weekendWake, "☀️ Good morning! Water first, then today's missions.", weekend);
  t(s.breakfast, "🍳 Breakfast time. Log it with a photo for the real calories.");
  t(s.lunch, "🍱 Lunch time. Protein + veg, and snap it.");
  t(s.dinner, "🍛 Dinner time. Snap your meal so Sensei can count it.");
  if (studying) {
    // Study nags every 20 minutes until bedtime, stopped for the day once study is done.
    // On work days they start only after work (and the commute) is over.
    const NAGS = ["📚 Still no study today. Open Life OS and start a focus session.", "😈 Manga and anime can wait. Your exam can't. Study now.", "⏳ Every minute you wait makes tonight harder. 25 minutes, start now.", "⚔️ Sensei is watching. Study before anything else."];
    const end = (() => { const [h, m] = add(s.sleep, -(s.windDown || 30)).split(":").map(Number); return h * 60 + m; })();
    const work = s.workType === "none" ? [] : s.workDays;
    const off = [0, 1, 2, 3, 4, 5, 6].filter((x) => !work.includes(x));
    const monday = new Date(2026, 0, 5); // a Monday, to ask when study starts on a work day
    for (const [days, a] of [[work, studyFrom(s, monday)], [off, studyFrom({ ...s, workType: "none" })]] as [number[], number][]) {
      if (!days.length || Number.isNaN(a)) continue;
      p.push({ at: hm(a), body: "📚 Study first, fun later. Start your focus session now.", days });
      for (let m = a + 20, i = 0; m < (end > a ? end : a + 300); m += 20, i++) p.push({ at: add("00:00", m), body: NAGS[i % NAGS.length], until: "study", days });
    }
  }
  if (!fit.length) t(s.exercise, "💪 Training time. Even 15 minutes counts.");
  t(add(s.sleep, -(s.windDown || 30)), "🌙 Wind down: screens away, plan tomorrow.", weekdays);
  t(s.sleep, "😴 Bedtime. Phone away, Sensei says goodnight.", weekdays);
  t(s.weekendSleep, "😴 Bedtime. Phone away.", weekend);
  const seen = new Set<string>();
  return p.filter((x) => (seen.has(x.at + x.body + (x.url ?? "")) ? false : (seen.add(x.at + x.body + (x.url ?? "")), true))).slice(0, 90);
}

const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
const call = (body: object) => fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }));

function usePlan() {
  const { profile, data } = useApp();
  const { items } = useCustomItems("reminder");
  const { items: tasks } = useCustomItems("task");
  const s = sched(profile.settings.schedule);
  const studying = !!profile.settings.study_plan?.length;
  // The workouts move with your day, so they're worked out again when the day or your data changes.
  // Only worked out when notifications are on (it plans 7 days).
  const fit = useMemo(() => { let on = false; try { on = localStorage.getItem(ON) === "1"; } catch {} return on ? fitPlan(data) : []; }, [data]);
  return useMemo(() => buildPlan(s, items, studying, tasks, fit), [s, items, studying, tasks, fit]);
}

export function PushCard() {
  const { session } = useApp();
  const plan = usePlan();
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(() => { try { return localStorage.getItem(ON) === "1"; } catch { return false; } });
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
  const ios = typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent) && !(window.matchMedia?.("(display-mode: standalone)").matches);

  const turnOn = async () => {
    setMsg("Asking your phone…");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setMsg("Notifications are blocked. Allow them for this site in your phone's settings.");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const { j } = await call({ action: "key" });
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(j.key) }));
      const r = await call({ action: "save", user: session.user, auth: session.auth, sub: sub.toJSON(), plan, tz: new Date().getTimezoneOffset() });
      if (!r.ok) return setMsg(r.j.error ?? "Couldn't turn on.");
      try { localStorage.setItem(ON, "1"); } catch {}
      setOn(true);
      await call({ action: "test", user: session.user, auth: session.auth });
      setMsg(`On ✓ ${plan.length} reminders a day on ${r.j.devices} device${r.j.devices > 1 ? "s" : ""}. A test notification is on its way.`);
    } catch (e) { setMsg(`Couldn't turn on: ${e instanceof Error ? e.message : "unknown"}`); }
  };
  const turnOff = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await call({ action: "off", user: session.user, auth: session.auth, endpoint: sub.endpoint }); await sub.unsubscribe(); }
    try { localStorage.removeItem(ON); } catch {}
    setOn(false); setMsg("Off on this device.");
  };

  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3 space-y-2 text-sm">
      <div className="font-semibold">🔔 Phone notifications (even when the app is closed)</div>
      {!supported ? <p className="text-xs text-muted">This browser can&apos;t get notifications.{ios ? " On iPhone: tap Share → Add to Home Screen, open Life OS from the home screen, then turn this on." : ""}</p> : (
        <>
          {ios && <p className="text-xs text-amber-300">On iPhone this only works from the home-screen app: Share → Add to Home Screen, then open it from there.</p>}
          <p className="text-xs text-muted">Sensei sends {plan.length} reminders a day: your reminders below, wake-up, meals, study, training and bedtime (from your schedule). Change the times in Schedule and Reminders.</p>
          {on ? <div className="flex gap-2"><button onClick={turnOn} className="btn-ghost flex-1 !py-1.5">🔁 Update / test</button><button onClick={turnOff} className="btn-ghost !py-1.5">Turn off</button></div>
            : <button onClick={turnOn} className="btn-primary w-full !py-1.5">Turn on notifications</button>}
        </>
      )}
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}

// Keeps the server's reminder list in step with the app when times change,
// and stops today's study nags once study is done.
export function PushSync() {
  const { session, data } = useApp();
  const done = !studyGate(data).locked;
  useEffect(() => {
    const day = toDay(new Date());
    let go = false;
    try { go = done && localStorage.getItem(ON) === "1" && localStorage.getItem("lifeos-push-done") !== day; } catch {}
    if (!go) return;
    call({ action: "done", user: session.user, auth: session.auth, day }).then((r) => { if (r.ok) try { localStorage.setItem("lifeos-push-done", day); } catch {} }).catch(() => {});
  }, [done, session]);
  const plan = usePlan();
  const key = JSON.stringify(plan);
  useEffect(() => {
    let on = false;
    try { on = localStorage.getItem(ON) === "1" && localStorage.getItem("lifeos-push-plan") !== key; } catch {}
    if (!on || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const t = setTimeout(() => {
      call({ action: "save", user: session.user, auth: session.auth, plan: JSON.parse(key), tz: new Date().getTimezoneOffset() })
        .then((r) => { if (r.ok) try { localStorage.setItem("lifeos-push-plan", key); } catch {} }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [key, session]);
  return null;
}
