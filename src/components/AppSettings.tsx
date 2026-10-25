"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assistantSay } from "@/components/Assistant";
import { AlarmSettings } from "@/components/AlarmSettings";
import { PushCard } from "@/components/Push";
import { BackupCard } from "@/components/Safety";
import { LOCK_KEY } from "@/components/Gate";
import { assistantOf, PHRASE_KINDS, PHRASES, type AssistantSettings } from "@/lib/assistant";
import { displayPrefs, saveDisplay } from "@/lib/safety";
import { sched } from "@/lib/schedule";
import { useApp } from "@/lib/store";

// One settings menu: permissions, the assistant (name, voice, alerts), the
// look, your data and security.

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="card p-4 mb-3 space-y-2"><h2 className="font-bold">{title}</h2>{children}</section>
);

export function AppSettings() {
  const { data, saveSettings, hasPin, lock } = useApp();
  const a = assistantOf(data.profile.settings);
  const set = (patch: Partial<AssistantSettings>) => saveSettings({ assistant: { ...a, ...patch } });
  const s = sched(data.profile.settings.schedule);
  const setSched = (patch: Partial<typeof s>) => saveSettings({ schedule: { ...data.profile.settings.schedule, ...patch } });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [light, setLight] = useState(false);
  const [perm, setPerm] = useState("");
  const [lockMin, setLockMin] = useState(5);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    setLight(displayPrefs().light);
    try { setLockMin(Number(localStorage.getItem(LOCK_KEY)) || 5); } catch {}
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    if (typeof speechSynthesis === "undefined") return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load(); speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);
  const sw = (on: boolean, label: string, f: (v: boolean) => void, note?: string) => (
    <label className="flex items-center justify-between gap-3 text-sm py-1"><span>{label}{note && <span className="block text-[11px] text-muted">{note}</span>}</span><input type="checkbox" checked={on} onChange={(e) => f(e.target.checked)} /></label>
  );
  const android = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const paused = !!a.pauseUntil && new Date(a.pauseUntil) > new Date();
  const clearCache = async () => {
    try {
      for (const k of await caches.keys()) await caches.delete(k);
      for (const k of Object.keys(localStorage)) if (/^lifeos-(alerted|catchup|battery|push-plan|fit-tab)/.test(k)) localStorage.removeItem(k);
      setMsg("Cache cleared. Your records are not touched.");
    } catch { setMsg("Couldn't clear the cache on this browser."); }
  };
  return (
    <div>
      <Section title="🔐 Permissions">
        <div className="flex items-center justify-between text-sm"><span>Notifications</span><span className={perm === "granted" ? "text-emerald-400" : "text-amber-300"}>{perm === "granted" ? "Allowed" : perm === "denied" ? "Blocked" : "Not asked yet"}</span></div>
        {perm !== "granted" && typeof Notification !== "undefined" && <button className="btn-primary w-full" onClick={async () => setPerm(await Notification.requestPermission())}>Allow notifications</button>}
        <PushCard />
        <details className="text-sm">
          <summary className="cursor-pointer">⏰ Exact alarms and battery optimisation</summary>
          <div className="text-xs text-muted space-y-1 mt-1">
            <p>Reminders arrive as notifications from the server, so they come even when the app is closed.</p>
            {android ? <>
              <p>So Android doesn&apos;t delay them: Settings › Apps › Life OS (or Chrome) › Battery › <b>Unrestricted</b>, and Notifications › allow all.</p>
              <p>On Samsung also: Settings › Battery › Background usage limits › remove Life OS / Chrome from &quot;Sleeping apps&quot;.</p>
              <p>Exact alarms that ring through a locked phone need the Google Play app; this version uses notifications.</p>
            </> : <p>On iPhone: add Life OS to the Home Screen, open it from there and allow notifications. Focus modes can hide them: Settings › Focus › allow Life OS.</p>}
          </div>
        </details>
        <details className="text-sm">
          <summary className="cursor-pointer">🖼️ Storage and gallery</summary>
          <p className="text-xs text-muted mt-1">Photos are picked from your gallery only when you tap Upload; the browser asks each time, so there&apos;s nothing to turn on. Everything is saved encrypted on this device and synced.</p>
        </details>
        <div className="text-sm">🔕 Do not disturb (no sound, alerts stay silent)</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">From<input type="time" className="input mt-1" value={s.quietStart} onChange={(e) => setSched({ quietStart: e.target.value })} /></label>
          <label className="text-xs text-muted">To<input type="time" className="input mt-1" value={s.quietEnd} onChange={(e) => setSched({ quietEnd: e.target.value })} /></label>
        </div>
      </Section>

      <Section title="🗣️ Assistant">
        <label className="text-sm block">Name<input className="input mt-1" defaultValue={a.name} onBlur={(e) => set({ name: e.target.value.trim() || "Assistant" })} /></label>
        <label className="text-sm block">Voice
          <select className="input mt-1" value={a.voice} onChange={(e) => set({ voice: e.target.value })}>
            <option value="">Phone default</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </label>
        <label className="text-sm block">Speed {a.rate.toFixed(1)}×<input type="range" min={0.5} max={1.8} step={0.1} className="w-full" value={a.rate} onChange={(e) => set({ rate: Number(e.target.value) })} /></label>
        <label className="text-sm block">Pitch {a.pitch.toFixed(1)}<input type="range" min={0.5} max={1.8} step={0.1} className="w-full" value={a.pitch} onChange={(e) => set({ pitch: Number(e.target.value) })} /></label>
        <button className="btn-ghost w-full" onClick={() => assistantSay(`Hi, I'm ${a.name}. You haven't eaten yet; you should eat.`, { ...a, audio: true, output: "both" })}>▶ Test the voice</button>
        {sw(a.audio, "🔊 Master audio", (v) => set({ audio: v }))}
        {sw(a.chime, "🔔 Chime before speaking", (v) => set({ chime: v }))}
        <div className="text-sm">How it tells you</div>
        <div className="grid grid-cols-3 gap-1.5">{(["both", "sound", "text"] as const).map((o) => <button key={o} onClick={() => set({ output: o })} className={`chip justify-center ${a.output === o ? "chip-on" : ""}`}>{o === "both" ? "Voice + text" : o === "sound" ? "Voice only" : "Text only"}</button>)}</div>
        {sw(a.fullscreen, "Full-screen alerts", (v) => set({ fullscreen: v }), "Off = a card at the bottom of the screen")}
      </Section>

      <Section title="⏱️ Alerts and catch-up">
        <label className="text-sm block">Speak up when a task is late by (minutes)<input className="input mt-1" inputMode="numeric" value={a.grace} onChange={(e) => set({ grace: Math.max(1, Math.min(120, Number(e.target.value) || 5)) })} /></label>
        <label className="text-sm block">&quot;Later&quot; asks again after
          <select className="input mt-1" value={a.snooze} onChange={(e) => set({ snooze: Number(e.target.value) })}>
            {[5, 10, 15, 30, 60, 0].map((m) => <option key={m} value={m}>{m ? `${m} min` : "Not again today"}</option>)}
          </select>
        </label>
        <label className="text-sm block">Wake-up target<input type="time" className="input mt-1" value={s.wake} onChange={(e) => setSched({ wake: e.target.value })} /></label>
        {sw(a.catchup, "Catch-up list when I open the app", (v) => set({ catchup: v }))}
        <div className="grid grid-cols-2 gap-1.5">{(["time", "kind"] as const).map((o) => <button key={o} onClick={() => set({ sort: o })} className={`chip justify-center ${a.sort === o ? "chip-on" : ""}`}>{o === "time" ? "Sort by time" : "Sort by type"}</button>)}</div>
        {sw(a.battery, "Low-battery warning", (v) => set({ battery: v }))}
        <div className="flex items-center justify-between text-sm pt-1"><span>⏸️ Pause all alerts{paused && <span className="block text-[11px] text-amber-300">Paused until {new Date(a.pauseUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</span>
          {paused ? <button className="chip" onClick={() => set({ pauseUntil: "" })}>Resume</button>
            : <span className="flex gap-1">{[1, 3, 24].map((h) => <button key={h} className="chip !px-2" onClick={() => set({ pauseUntil: new Date(Date.now() + h * 3_600_000).toISOString() })}>{h}h</button>)}</span>}
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer">✏️ What it says</summary>
          <p className="text-[11px] text-muted my-1">{"{task}"} is replaced by the task&apos;s name. Leave empty for the default.</p>
          {PHRASE_KINDS.map(([k, l]) => <label key={k} className="block text-xs text-muted mt-1">{l}<input className="input mt-0.5" placeholder={PHRASES[k]} defaultValue={a.phrases[k] ?? ""} onBlur={(e) => set({ phrases: { ...a.phrases, [k]: e.target.value } })} /></label>)}
        </details>
      </Section>

      <Section title="🎨 Look">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { saveDisplay({ light: false }); setLight(false); }} className={`chip py-2 justify-center ${!light ? "chip-on" : ""}`}>🌙 Dark</button>
          <button onClick={() => { saveDisplay({ light: true }); setLight(true); }} className={`chip py-2 justify-center ${light ? "chip-on" : ""}`}>☀️ Light</button>
        </div>
        {sw(a.mode === "game", "Game look (XP, levels, monsters, scenes)", (v) => set({ mode: v ? "game" : "assistant" }), "Off = plain assistant. Every feature works the same either way.")}
      </Section>

      <Section title="⏰ Alarms"><AlarmSettings /></Section>

      <Section title="🔒 Security">
        {hasPin ? <>
          <button className="btn-primary w-full" onClick={lock}>🔒 Lock now</button>
          <label className="flex items-center justify-between text-sm">Ask for PIN after closed for
            <select className="input !w-28" value={lockMin} onChange={(e) => { setLockMin(Number(e.target.value)); try { localStorage.setItem(LOCK_KEY, e.target.value); } catch {} }}>
              {[1, 5, 15, 60, 240].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
            </select>
          </label>
        </> : <p className="text-xs text-muted">No PIN on this device. To add one, sign out (Hero page › Security) and sign in again: it offers a 4-digit PIN.</p>}
      </Section>

      <Section title="💾 Data">
        <BackupCard />
        <button className="btn-ghost w-full" onClick={clearCache}>🧹 Clear cache and alert history</button>
        <p className="text-[11px] text-muted">To delete single records, open them from Days (calendar). Records are never deleted from here.</p>
        {msg && <p className="text-xs text-[var(--accent2)]">{msg}</p>}
      </Section>
      <p className="text-center text-xs text-muted mb-4"><Link href="/control" className="underline">Control Centre</Link> changes buttons, pages and the menu.</p>
    </div>
  );
}
