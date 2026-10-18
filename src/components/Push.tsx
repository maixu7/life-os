"use client";

import { useEffect, useMemo, useState } from "react";
import { sched, type Schedule } from "@/lib/schedule";
import { useApp, useCustomItems, type CustomItem } from "@/lib/store";

// Phone notifications while the app is closed: Sensei's reminders are sent
// from the server at the right time (your reminders, wake, meals, study, bed).

type Plan = { at: string; body: string; days?: number[] };
const ON = "lifeos-push-on";
const add = (t: string, mins: number) => { const [h, m] = t.split(":").map(Number); const x = (h * 60 + m + mins + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const weekdays = [1, 2, 3, 4, 5], weekend = [0, 6];

export function buildPlan(s: Schedule, reminders: CustomItem[], studying: boolean): Plan[] {
  const p: Plan[] = reminders.filter((r) => /^\d\d:\d\d$/.test(String(r.config.time))).map((r) => ({ at: String(r.config.time), body: `⏰ ${r.name}` }));
  const t = (at: string, body: string, days?: number[]) => { if (/^\d\d:\d\d$/.test(at)) p.push({ at, body, days }); };
  t(s.wake, "☀️ Good morning, hero! Drink a glass of water and open today's missions.", weekdays);
  t(s.weekendWake, "☀️ Good morning! Water first, then today's missions.", weekend);
  t(s.breakfast, "🍳 Breakfast time. Log it with a photo for the real calories.");
  t(s.lunch, "🍱 Lunch time. Protein + veg, and snap it.");
  t(s.dinner, "🍛 Dinner time. Snap your meal so Sensei can count it.");
  if (studying) t(s.studyStart, "📚 Study first, fun later. Start your focus session now.");
  t(s.exercise, "💪 Training time. Even 15 minutes counts.");
  t(add(s.sleep, -(s.windDown || 30)), "🌙 Wind down: screens away, plan tomorrow.", weekdays);
  t(s.sleep, "😴 Bedtime. Phone away, Sensei says goodnight.", weekdays);
  t(s.weekendSleep, "😴 Bedtime. Phone away.", weekend);
  const seen = new Set<string>();
  return p.filter((x) => (seen.has(x.at + x.body) ? false : (seen.add(x.at + x.body), true))).slice(0, 60);
}

const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
const call = (body: object) => fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }));

function usePlan() {
  const { profile } = useApp();
  const { items } = useCustomItems("reminder");
  const s = sched(profile.settings.schedule);
  const studying = !!profile.settings.study_plan?.length;
  return useMemo(() => buildPlan(s, items, studying), [s, items, studying]);
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

// Keeps the server's reminder list in step with the app when times change.
export function PushSync() {
  const { session } = useApp();
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
