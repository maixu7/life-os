"use client";

import { useMemo, useState } from "react";
import { AvatarArt, CLASSES } from "@/components/AvatarArt";
import { AboutMe, AvatarEditor, BodyStats } from "@/components/HeroSheet";
import { CharacterPanel } from "@/components/Character";
import { RealMe } from "@/components/RealMe";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { CHAPTERS, gold, TITLES } from "@/lib/economy";
import { dailyGoals } from "@/lib/goals";
import { karma } from "@/lib/karma";
import { Deeds } from "@/components/Deeds";
import { initialData, useApp, type Log } from "@/lib/store";
import { LOCK_KEY, lockMinutes } from "@/components/Gate";
import { addDecoy, exportBackup } from "@/lib/vault";
import { ATTRIBUTES, progress, RANKS, UNLOCKS } from "@/lib/xp";

const THEMES = [
  { id: "neon", label: "Neon", unlock: null },
  { id: "sakura", label: "Sakura", unlock: "theme-sakura" },
  { id: "ocean", label: "Ocean", unlock: "theme-ocean" },
  { id: "inferno", label: "Inferno", unlock: "theme-inferno" },
];

function Radar({ values }: { values: { label: string; v: number }[] }) {
  const c = 110, r = 80;
  const pt = (i: number, f: number) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [c + Math.cos(a) * r * f, c + Math.sin(a) * r * f];
  };
  const poly = (f: (i: number) => number) => values.map((_, i) => pt(i, f(i)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-xs mx-auto">
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(() => f)} fill="none" stroke="rgba(255,255,255,.12)" />)}
      <polygon points={poly((i) => Math.max(0.05, values[i].v))} fill="color-mix(in srgb, var(--accent) 35%, transparent)" stroke="var(--accent)" strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 8px var(--accent))" }} />
      {values.map((x, i) => {
        const [lx, ly] = pt(i, 1.22);
        return <text key={x.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--muted)">{x.label}</text>;
      })}
    </svg>
  );
}

export default function RankPage() {
  const { data, profile, saveSettings, saveProfile, lock, signOut, hasPin, session } = useApp();
  const [editAvatar, setEditAvatar] = useState(false);
  const k = useMemo(() => karma(data), [data]);
  const [lockMin, setLockMin] = useState(() => lockMinutes());
  const p = progress(profile.xp);
  const [decoyPw, setDecoyPw] = useState("");
  const [msg, setMsg] = useState("");

  const stats = useMemo(() => {
    const kinds: Record<string, number> = {};
    const byDay: Record<string, Log[]> = {};
    for (const l of data.logs) {
      kinds[l.kind] = (kinds[l.kind] ?? 0) + 1;
      (byDay[l.day] ??= []).push(l);
    }
    const perfectDays = Object.values(byDay).filter((ls) => dailyGoals(ls, profile.settings).every((g) => g.done)).length;
    return { total: data.logs.length, kinds, perfectDays };
  }, [data.logs, profile.settings]);

  const attrs = ATTRIBUTES.map((a) => {
    const n = a.kinds.reduce((s, k) => s + (stats.kinds[k] ?? 0), 0);
    return { label: a.label, v: Math.min(1, n / 60), n };
  });
  const unlocked = new Set(UNLOCKS.filter((u) => p.level >= u.level).map((u) => u.id));

  const backup = async () => {
    const blob = new Blob([await exportBackup(session, data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-os-${new Date().toISOString().slice(0, 10)}.lifeos`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const makeDecoy = async () => {
    if (decoyPw.length < 8) return setMsg("Use at least 8 characters.");
    try {
      await addDecoy(session, decoyPw, initialData(profile.display_name));
      setDecoyPw("");
      setMsg("Decoy password set. Signing in with it on any device opens a separate empty profile.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const set = (k: "water_goal_ml" | "milk_goal_ml" | "sleep_goal_h" | "budget_monthly") =>
    (e: React.ChangeEvent<HTMLInputElement>) => saveSettings({ [k]: Number(e.target.value) || 0 });

  return (
    <>
      <section className="card frame p-5 mb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 30%, ${k.color}55, transparent 60%)` }} />
        <div className="relative">
          <div className="mx-auto w-fit animate-float">
            <AvatarArt a={profile.avatar} size={300} full aura={k.color} />
          </div>
          <div className="mt-3 font-game text-xl font-black">{profile.display_name}</div>
          <div className="text-sm text-[var(--accent2)]">{CLASSES.find((c) => c.name === profile.avatar.heroClass)?.icon} {profile.avatar.heroClass} · {profile.title}</div>
          <div className="mt-2 flex justify-center gap-2 text-sm">
            <span className="chip">Lv {p.level}</span>
            <span className="chip font-game">Rank {p.rank.name}</span>
            <span className="chip gold-text">🪙 {gold(data).toLocaleString()}</span>
            <span className="chip" style={{ color: k.color }}>{k.icon} {k.name}</span>
          </div>
          <button onClick={() => setEditAvatar(true)} className="btn-primary mt-4">Edit hero</button>
        </div>
        <div className="relative mt-4 text-left text-xs text-muted">Level {p.level + 1} · {profile.xp.toLocaleString()} XP</div>
        <div className="relative bar"><div style={{ width: `${p.levelPct}%` }} /></div>
        {p.next && (
          <>
            <div className="relative mt-2 text-left text-xs text-muted">Rank {p.next.name} ({p.next.title}) at {p.next.min.toLocaleString()} XP</div>
            <div className="relative bar"><div style={{ width: `${p.rankPct}%` }} /></div>
          </>
        )}
      </section>

      <CharacterPanel />

      <RealMe />

      <AboutMe />

      <Deeds />

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">📊 Attributes</h2>
        <Radar values={attrs} />
      </section>

      <BodyStats />

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">🏆 Achievements</h2>
          <span className="text-xs text-muted">{Object.keys(profile.achievements).length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = profile.achievements[a.id];
            return (
              <div key={a.id} title={a.desc} className={`text-center rounded-xl p-2 border ${got ? "border-[var(--gold)]/50 bg-[var(--gold)]/10" : "border-white/5 opacity-35 grayscale"}`}>
                <div className={`text-3xl ${got ? "drop-shadow-[0_0_10px_var(--gold)]" : ""}`}>{got ? a.icon : "🔒"}</div>
                <div className="text-[11px] mt-1 font-semibold leading-tight">{a.name}</div>
                <div className="text-[9px] text-muted leading-tight">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-3">🎖 Titles</h2>
        <div className="flex flex-wrap gap-2">
          {TITLES.map((t) => {
            const ok = t.test(data);
            return (
              <button key={t.title} disabled={!ok} onClick={() => saveProfile({ title: t.title })} title={t.need}
                className={`chip ${profile.title === t.title ? "chip-on" : ""} disabled:opacity-35`}>{ok ? t.title : `🔒 ${t.title}`}</button>
            );
          })}
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-3">📖 Story</h2>
        <div className="space-y-3">
          {CHAPTERS.map((c) => (
            <div key={c.title} className={p.level >= c.level ? "" : "opacity-40"}>
              <div className="font-game text-sm font-bold">{p.level >= c.level ? c.title : `🔒 ${c.title} · unlocks at level ${c.level}`}</div>
              {p.level >= c.level && <p className="text-sm text-muted leading-relaxed">{c.text}</p>}
            </div>
          ))}
        </div>
      </section>

      {editAvatar && <AvatarEditor onClose={() => setEditAvatar(false)} />}

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-3">🎨 Themes</h2>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const ok = !t.unlock || unlocked.has(t.unlock);
            const need = UNLOCKS.find((u) => u.id === t.unlock)?.level;
            return (
              <button key={t.id} disabled={!ok} onClick={() => saveSettings({ theme: t.id })}
                className={`chip py-2 ${profile.settings.theme === t.id ? "chip-on" : ""} disabled:opacity-40`}>
                {ok ? t.label : `🔒 Lv ${need}`}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">Ranks: {RANKS.map((r) => r.name).join(" → ")}</p>
      </section>

      <section className="card p-4 mb-4 space-y-2">
        <h2 className="section-title">🎯 Daily targets</h2>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted">
          <label>Water ml<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.water_goal_ml} onBlur={set("water_goal_ml")} /></label>
          <label>Milk ml<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.milk_goal_ml} onBlur={set("milk_goal_ml")} /></label>
          <label>Sleep hours<input className="input mt-1" inputMode="decimal" defaultValue={profile.settings.sleep_goal_h} onBlur={set("sleep_goal_h")} /></label>
          <label>Monthly allowance<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.budget_monthly} onBlur={set("budget_monthly")} /></label>
          <label>Currency<input className="input mt-1" defaultValue={profile.settings.currency} onBlur={(e) => saveSettings({ currency: e.target.value.trim() || "Rs" })} /></label>
        </div>
      </section>

      <section className="card p-4 mb-4 space-y-3">
        <h2 className="section-title">🔐 Security</h2>
        {hasPin ? (
          <>
            <button onClick={lock} className="btn-primary w-full">🔒 Lock now</button>
            <label className="flex items-center justify-between text-sm">Ask for PIN after the app is closed for
              <select className="input !w-28" value={lockMin} onChange={(e) => {
                setLockMin(Number(e.target.value));
                try { localStorage.setItem(LOCK_KEY, e.target.value); } catch {}
              }}>
                {[1, 5, 15, 60, 240].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
              </select>
            </label>
          </>
        ) : (
          <p className="text-sm text-muted">This device remembers you, so the app opens without a password.</p>
        )}
        <button onClick={signOut} className="btn-ghost w-full">Sign out of this device</button>
        <button onClick={backup} className="btn-ghost w-full">📦 Download encrypted backup</button>
        <p className="text-xs text-muted">Your data syncs to all your devices, end-to-end encrypted. The backup file is an extra safety copy, still locked by your password (photos not included).</p>
        <div className="flex gap-2">
          <input type="password" className="input" placeholder="Decoy password" value={decoyPw} onChange={(e) => setDecoyPw(e.target.value)} />
          <button onClick={makeDecoy} className="btn-ghost shrink-0">Set</button>
        </div>
        {msg && <p className="text-xs text-[var(--accent2)]">{msg}</p>}
      </section>
    </>
  );
}
