"use client";

import { AlarmSettings } from "@/components/AlarmSettings";
import { alarmPrefs, fireAlarm } from "@/lib/alarm";

import { Fragment, useEffect, useMemo, useState } from "react";
import { fmtTime, Sheet } from "@/components/Sheet";
import { describe } from "@/lib/describe";
import { logKarma } from "@/lib/karma";
import { MEDIA, type MediaType } from "@/lib/media";
import { sleepHours } from "@/lib/missions";
import { sched } from "@/lib/schedule";
import { toDay, useApp, useCustomItems, type Data, type Log } from "@/lib/store";

type Range = "week" | "month" | "year";

function bounds(r: Range, offset: number) {
  const now = new Date();
  let from: Date, to: Date, label: string;
  if (r === "week") {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
    from = mon; to = new Date(mon); to.setDate(mon.getDate() + 6);
    label = `${from.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${to.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  } else if (r === "month") {
    from = new Date(now.getFullYear(), now.getMonth() + offset, 1); to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    label = from.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } else {
    from = new Date(now.getFullYear() + offset, 0, 1); to = new Date(now.getFullYear() + offset, 11, 31);
    label = String(from.getFullYear());
  }
  return { from: toDay(from), to: toDay(to), label };
}

function stats(d: Data, from: string, to: string) {
  const logs = d.logs.filter((l) => l.day >= from && l.day <= to);
  const days = new Set(logs.map((l) => l.day)).size || 1;
  const k = logs.map(logKarma);
  const acts: Record<string, number> = {};
  for (const l of logs) if (l.kind === "activity") acts[String(l.data.name)] = (acts[String(l.data.name)] ?? 0) + 1;
  const moods = logs.filter((l) => l.kind === "mood").map((l) => Number(l.data.mood));
  const missions = logs.filter((l) => l.kind === "bonus" && !String(l.data.mission).startsWith("habit:")).length;
  return {
    days, xp: logs.reduce((s, l) => s + l.xp, 0),
    good: k.filter((x) => x > 0).reduce((a, b) => a + b, 0), bad: Math.abs(k.filter((x) => x < 0).reduce((a, b) => a + b, 0)),
    missions, perDay: missions / days,
    sleep: sleepHours(logs) / days,
    water: logs.filter((l) => l.kind === "water").reduce((s, l) => s + Number(l.data.ml ?? 0), 0) / 1000,
    focus: logs.filter((l) => l.kind === "focus").reduce((s, l) => s + Number(l.data.minutes ?? 0), 0),
    reading: logs.filter((l) => l.kind === "media" && MEDIA[l.data.type as MediaType]?.good).reduce((s, l) => s + Number(l.data.minutes ?? 0), 0),
    timepass: logs.filter((l) => logKarma(l) < 0 && (l.kind === "media" || l.kind === "activity")).reduce((s, l) => s + (Number(l.data.minutes) || 30), 0),
    spent: logs.filter((l) => l.kind === "shopping").reduce((s, l) => s + Number(l.data.price ?? 0), 0),
    workouts: logs.filter((l) => l.kind === "workout").length,
    mood: moods.length ? moods.reduce((a, b) => a + b) / moods.length : null,
    top: Object.entries(acts).sort((a, b) => b[1] - a[1]).slice(0, 5),
    count: logs.length,
  };
}

const grade = (perDay: number) => (perDay >= 5.5 ? "S" : perDay >= 4.5 ? "A" : perDay >= 3.5 ? "B" : perDay >= 2.5 ? "C" : perDay >= 1.5 ? "D" : "E");

export function ReportSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  const [r, setR] = useState<Range>("week");
  const [off, setOff] = useState(0);
  const b = bounds(r, off), pb = bounds(r, off - 1);
  const s = useMemo(() => stats(data, b.from, b.to), [data, b.from, b.to]);
  const p = useMemo(() => stats(data, pb.from, pb.to), [data, pb.from, pb.to]);
  const cur = profile.settings.currency;
  const row = (label: string, v: number, pv: number, unit = "", lowerBetter = false) => {
    const diff = v - pv;
    const good = lowerBetter ? diff < 0 : diff > 0;
    return (
      <div className="flex items-center justify-between py-1.5 text-sm border-b border-white/5">
        <span className="text-muted">{label}</span>
        <span><b>{Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)}</b>{unit}
          {pv || v ? <span className={`ml-2 text-[11px] ${diff === 0 ? "text-muted" : good ? "text-emerald-400" : "text-rose-400"}`}>{diff === 0 ? "=" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(Number.isInteger(diff) ? 0 : 1)}`}</span> : null}
        </span>
      </div>
    );
  };
  return (
    <Sheet title="📊 Report card" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {(["week", "month", "year"] as Range[]).map((x) => <button key={x} onClick={() => { setR(x); setOff(0); }} className={`chip justify-center ${r === x ? "chip-on" : ""}`}>{x === "week" ? "Weekly" : x === "month" ? "Monthly" : "Yearly"}</button>)}
      </div>
      <div className="flex items-center justify-between">
        <button className="btn-ghost !px-3" onClick={() => setOff(off - 1)}>‹</button>
        <span className="font-semibold">{b.label}</span>
        <button className="btn-ghost !px-3" disabled={off >= 0} onClick={() => setOff(off + 1)}>›</button>
      </div>
      <div className="text-center">
        <div className="font-game text-6xl font-black" style={{ color: { S: "#ffd166", A: "#3ee08f", B: "#46e6ff", C: "#c0b6ff", D: "#ff9f6b", E: "#ff4d6d" }[grade(s.perDay)] }}>{grade(s.perDay)}</div>
        <div className="text-xs text-muted">Grade from {s.perDay.toFixed(1)} missions per active day · {s.count} records</div>
      </div>
      <div>
        {row("XP earned", s.xp, p.xp)}
        {row("😇 Good deed points", s.good, p.good)}
        {row("😈 Bad deed points", s.bad, p.bad, "", true)}
        {row("Missions cleared", s.missions, p.missions)}
        {row("Avg sleep", s.sleep, p.sleep, " h")}
        {row("Water", s.water, p.water, " L")}
        {row("Focus", s.focus, p.focus, " min")}
        {row("Good reading", s.reading, p.reading, " min")}
        {row("Time-pass", s.timepass, p.timepass, " min", true)}
        {row("Workouts", s.workouts, p.workouts)}
        {row(`Spent (${cur})`, s.spent, p.spent, "", true)}
        {s.mood != null && row("Average mood (1–5)", s.mood, p.mood ?? 0)}
      </div>
      {s.top.length > 0 && (
        <div>
          <div className="text-xs text-muted mb-1">Most done</div>
          <div className="flex flex-wrap gap-2">{s.top.map(([n, c]) => <span key={n} className="chip">{n} × {c}</span>)}</div>
        </div>
      )}
      <p className="text-xs text-muted">▲▼ compare with the previous {r}.</p>
    </Sheet>
  );
}

export function HeatmapSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [mode, setMode] = useState<"all" | "good" | "bad">("all");
  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    for (const l of data.logs) {
      const k = logKarma(l);
      if (mode === "good" && k <= 0) continue;
      if (mode === "bad" && k >= 0) continue;
      const t = new Date(l.created_at);
      g[(t.getDay() + 6) % 7][t.getHours()] += 1;
    }
    return g;
  }, [data.logs, mode]);
  const max = Math.max(1, ...grid.flat());
  const color = mode === "bad" ? "255,59,107" : mode === "good" ? "255,209,102" : "70,230,255";
  return (
    <Sheet title="🔥 Activity heatmap" onClose={onClose}>
      <p className="text-sm text-muted">When in the week you are most active. Find your power hours and your devil hours.</p>
      <div className="grid grid-cols-3 gap-2">{(["all", "good", "bad"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`chip justify-center ${mode === m ? "chip-on" : ""}`}>{m === "all" ? "Everything" : m === "good" ? "😇 Good" : "😈 Bad"}</button>)}</div>
      <div className="overflow-x-auto">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: "28px repeat(24, minmax(10px, 1fr))" }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-[8px] text-muted text-center">{h % 6 === 0 ? h : ""}</span>)}
          {grid.map((row, d) => (
            <Fragment key={d}>
              <span className="text-[10px] text-muted">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]}</span>
              {row.map((v, h) => <span key={`${d}-${h}`} title={`${v}`} className="aspect-square rounded-[3px]" style={{ background: v ? `rgba(${color},${0.15 + (v / max) * 0.85})` : "rgba(255,255,255,.05)" }} />)}
            </Fragment>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function SearchSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  const [q, setQ] = useState("");
  const found = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return data.logs
      .map((l) => ({ l, d: describe(l, profile.settings.currency) }))
      .filter(({ l, d }) => `${d.title} ${d.detail} ${l.day} ${JSON.stringify(l.data)}`.toLowerCase().includes(t))
      .sort((a, b) => b.l.created_at.localeCompare(a.l.created_at)).slice(0, 100);
  }, [q, data.logs, profile.settings.currency]);
  return (
    <Sheet title="🔎 Search everything" onClose={onClose}>
      <input autoFocus className="input" placeholder="apple, anime, 2026-10, gym…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 2 && <p className="text-xs text-muted">{found.length === 100 ? "100+" : found.length} results</p>}
      <ul className="divide-y divide-white/5">
        {found.map(({ l, d }) => (
          <li key={l.id} className="py-2 flex gap-3 text-sm">
            <span className="text-xl">{d.emoji}</span>
            <span className="flex-1 min-w-0">
              <a href={`/?day=${l.day}`} className="block font-semibold truncate">{d.title}</a>
              <span className="block text-xs text-muted truncate">{new Date(l.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} {fmtTime(l.created_at)} · {d.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function exportCsv(data: Data, currency: string) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["date", "time", "type", "title", "detail", "xp", "deed_points"].join(",")];
  for (const l of [...data.logs].sort((a: Log, b: Log) => a.created_at.localeCompare(b.created_at))) {
    const d = describe(l, currency);
    rows.push([l.day, fmtTime(l.created_at), l.kind, d.title, d.detail, l.xp, logKarma(l)].map(esc).join(","));
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + rows.join("\n")], { type: "text/csv" }));
  a.download = `life-os-records-${toDay(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SavingsSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, logActivity, celebrate } = useApp();
  const { items, add, update } = useCustomItems("savings");
  const goal = items[0];
  const cur = profile.settings.currency;
  const saved = data.logs.filter((l) => l.kind === "save").reduce((s, l) => s + Number(l.data.amount ?? 0), 0);
  const [amount, setAmount] = useState("");
  const [gName, setGName] = useState(goal?.name ?? "");
  const [gTarget, setGTarget] = useState(goal ? String(goal.config.target ?? "") : "");
  const target = Number(goal?.config.target ?? 0);
  const month = toDay(new Date()).slice(0, 7);
  const byCat = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const l of data.logs) {
      if (l.kind !== "shopping" || !l.day.startsWith(month)) continue;
      const item = data.shopping.find((x) => x.name.toLowerCase() === String(l.data.item).toLowerCase());
      const c = item?.category || "Other";
      cats[c] = (cats[c] ?? 0) + Number(l.data.price ?? 0);
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [data.logs, data.shopping, month]);
  const maxCat = Math.max(1, ...byCat.map((c) => c[1]));
  return (
    <Sheet title="🐷 Savings & spending" onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3">
        <div className="text-xs text-muted">Saved in total</div>
        <div className="font-game text-3xl gold-text">{cur} {saved.toLocaleString()}</div>
        {target > 0 && (
          <>
            <div className="mt-1 text-xs text-muted">Goal: {goal!.name} · {cur} {target.toLocaleString()} ({Math.min(100, Math.round((saved / target) * 100))}%)</div>
            <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${Math.min(100, (saved / target) * 100)}%` }} /></div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <input className="input" inputMode="decimal" placeholder={`Add to savings (${cur})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="btn-gold" disabled={!Number(amount)} onClick={() => {
          const row = logActivity("save", { amount: Number(amount) }, new Date(), 10);
          celebrate({ title: "🐷 SAVED!", subtitle: `${cur} ${Number(amount).toLocaleString()} into the piggy bank`, xp: row.xp, big: target > 0 && saved < target && saved + Number(amount) >= target });
          setAmount("");
        }}>Save</button>
      </div>
      <div className="text-xs text-muted">Savings goal</div>
      <div className="flex gap-2">
        <input className="input" placeholder="New phone" value={gName} onChange={(e) => setGName(e.target.value)} />
        <input className="input !w-28" inputMode="decimal" placeholder="Target" value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
        <button className="btn-ghost" onClick={() => { if (!gName.trim()) return; if (goal) update(goal.id, { name: gName.trim(), config: { target: Number(gTarget) } }); else add(gName.trim(), { target: Number(gTarget) }); }}>Set</button>
      </div>
      <div>
        <div className="text-xs text-muted mb-1">Spending by category this month</div>
        {byCat.length === 0 ? <p className="text-sm text-muted">No purchases this month.</p> : byCat.map(([c, v]) => (
          <div key={c} className="mb-1.5">
            <div className="flex justify-between text-xs"><span>{c}</span><span>{cur} {v.toLocaleString()}</span></div>
            <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(v / maxCat) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// Reminders at set times. They pop up in the app and, if allowed, as a phone notification.
export function RemindersSheet({ onClose }: { onClose: () => void }) {
  const { items, add, remove } = useCustomItems("reminder");
  const [time, setTime] = useState("21:30");
  const [text, setText] = useState("");
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  return (
    <Sheet title="⏰ Reminders" onClose={onClose}>
      <p className="text-sm text-muted">Daily reminders. They pop up in the app, and as notifications when you allow them. Phones may hold notifications back while the app is fully closed.</p>
      {perm !== "granted" && typeof Notification !== "undefined" && (
        <button className="btn-ghost w-full" onClick={async () => setPerm(await Notification.requestPermission())}>Allow notifications</button>
      )}
      <div className="flex gap-2">
        <input type="time" className="input !w-32" value={time} onChange={(e) => setTime(e.target.value)} />
        <input className="input" placeholder="Brush teeth and sleep" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary" disabled={!text.trim()} onClick={() => { add(text.trim(), { time }); setText(""); }}>Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[["07:00", "Drink water and stretch"], ["13:00", "Lunch and a short walk"], ["17:00", "Study focus session"], ["22:30", "Phone away, time to sleep"]].map(([t, x]) => (
          <button key={t} className="chip" onClick={() => add(x, { time: t })}>+ {t} {x}</button>
        ))}
      </div>
      <AlarmSettings />
      <ul className="divide-y divide-white/5">
        {[...items].sort((a, b) => String(a.config.time).localeCompare(String(b.config.time))).map((r) => (
          <li key={r.id} className="py-2 flex items-center gap-3"><span className="font-game">{String(r.config.time)}</span><span className="flex-1">{r.name}</span><button onClick={() => remove(r.id)} className="text-muted">✕</button></li>
        ))}
      </ul>
    </Sheet>
  );
}

export function ReminderWatcher() {
  const { items } = useCustomItems("reminder");
  const { profile } = useApp();
  const sc = sched(profile.settings.schedule);
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const r of items) {
        if (r.config.time !== hm) continue;
        const key = `lifeos-rem:${r.id}:${toDay(now)}`;
        try { if (localStorage.getItem(key)) continue; localStorage.setItem(key, "1"); } catch {}
        fireAlarm({ title: "⏰ REMINDER", body: r.name, icon: String(r.config.emoji ?? "⏰") });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          navigator.serviceWorker?.getRegistration().then((reg) => { if (reg) return reg.showNotification("Life OS", { body: r.name, icon: "/icons/icon-192.png" }); new Notification("Life OS", { body: r.name }); }).catch(() => {});
        }
      }
    };
    // Wake-up and bedtime alarms from your schedule (turn them on in Alarm settings).
    const daily = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const p = alarmPrefs();
      const fire = (id: string, title: string, body: string, icon: string) => {
        const key = `lifeos-alarm:${id}:${toDay(now)}`;
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
        fireAlarm({ title, body, icon });
      };
      if (p.wake && hm === sc.wake) fire("wake", "🌅 WAKE UP", "Good morning, hero. Water, light, stretch.", "🌅");
      if (p.bed && hm === sc.sleep) fire("bed", "😴 BEDTIME", "Phone away. Brush teeth and sleep.", "😴");
    };
    check(); daily();
    const t = setInterval(() => { check(); daily(); }, 15_000);
    return () => clearInterval(t);
  }, [items, sc.wake, sc.sleep]);
  return null;
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, saveSettings } = useApp();
  const get = (k: string) => { try { return localStorage.getItem(k) !== "off"; } catch { return true; } };
  const [sound, setSound] = useState(() => get("lifeos-sound"));
  const [vib, setVib] = useState(() => get("lifeos-vibrate"));
  const toggle = (k: string, v: boolean, set: (b: boolean) => void) => { try { localStorage.setItem(k, v ? "on" : "off"); } catch {} set(v); };
  const weight = [...data.logs].reverse().find((l) => l.kind === "body" && l.data.weight)?.data.weight;
  const suggested = weight ? Math.round((Number(weight) * 35) / 50) * 50 : null;
  return (
    <Sheet title="⚙️ Game settings" onClose={onClose}>
      <button onClick={() => toggle("lifeos-sound", !sound, setSound)} className="btn-ghost w-full flex justify-between"><span>🔊 Sounds</span><span>{sound ? "On" : "Off"}</span></button>
      <button onClick={() => toggle("lifeos-vibrate", !vib, setVib)} className="btn-ghost w-full flex justify-between"><span>📳 Vibration</span><span>{vib ? "On" : "Off"}</span></button>
      <AlarmSettings />
      <label className="text-xs text-muted">📝 Exam date (shows a countdown)
        <input type="date" className="input mt-1" value={profile.settings.exam_date ?? ""} onChange={(e) => saveSettings({ exam_date: e.target.value || null })} /></label>
      <div className="rounded-xl bg-white/5 p-3 text-sm">
        💧 Water goal: <b>{profile.settings.water_goal_ml} ml</b>
        {suggested ? (
          <div className="mt-1 text-xs text-muted">For your weight ({String(weight)} kg) about {suggested} ml a day is recommended (35 ml per kg).
            {suggested !== profile.settings.water_goal_ml && <button className="chip chip-on ml-2" onClick={() => saveSettings({ water_goal_ml: suggested })}>Use {suggested} ml</button>}
          </div>
        ) : <div className="mt-1 text-xs text-muted">Add your weight in Hero › Body stats for a personal water goal.</div>}
      </div>
    </Sheet>
  );
}

export function ExamCountdown() {
  const { profile } = useApp();
  const exam = profile.settings.exam_date;
  if (!exam) return null;
  const days = Math.ceil((new Date(`${exam}T09:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return null;
  return (
    <section className="card frame p-4 mb-4 flex items-center gap-4">
      <div className="text-4xl">📝</div>
      <div className="flex-1">
        <div className="text-[10px] font-game tracking-widest text-rose-300">FINAL BOSS: EXAM</div>
        <div className="font-game text-2xl font-black">{days === 0 ? "TODAY!" : `${days} days left`}</div>
        <div className="text-xs text-muted">{days > 0 ? `About ${days * 2} focus sessions if you do 2 a day. Every one counts.` : "You trained for this. Go win."}</div>
      </div>
    </section>
  );
}
