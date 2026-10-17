"use client";

import { useMemo, useState } from "react";
import { dailyGoals } from "@/lib/goals";
import { initialData, useApp, type Log } from "@/lib/store";
import { createVault, exportBackup, unlock } from "@/lib/vault";
import { ATTRIBUTES, BADGES, progress, RANKS, UNLOCKS } from "@/lib/xp";

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
  const { data, profile, saveSettings, lock, session } = useApp();
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
    const blob = new Blob([await exportBackup(session)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-os-${new Date().toISOString().slice(0, 10)}.lifeos`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const makeDecoy = async () => {
    if (decoyPw.length < 8) return setMsg("Use at least 8 characters.");
    if (await unlock(decoyPw)) return setMsg("That password is already in use.");
    await createVault(decoyPw, initialData(profile.display_name));
    setDecoyPw("");
    setMsg("Decoy password set. Signing in with it opens a separate empty profile.");
  };

  const set = (k: "water_goal_ml" | "milk_goal_ml" | "sleep_goal_h" | "budget_monthly") =>
    (e: React.ChangeEvent<HTMLInputElement>) => saveSettings({ [k]: Number(e.target.value) || 0 });

  return (
    <>
      <section className={`card p-6 mb-4 text-center relative overflow-hidden ${unlocked.has("aura-gold") ? "shadow-[0_0_50px_var(--gold)]" : ""}`}>
        <div className="text-sm text-muted">{profile.display_name}</div>
        <div className="my-2 text-7xl font-black glow-text animate-pop">{p.rank.name}</div>
        <div className="font-bold tracking-widest text-[var(--gold)]">{p.rank.title.toUpperCase()}</div>
        <div className="mt-1 text-sm text-muted">Level {p.level} · {profile.xp.toLocaleString()} XP</div>
        <div className="mt-4 text-left text-xs text-muted">Level {p.level + 1}</div>
        <div className="bar"><div style={{ width: `${p.levelPct}%` }} /></div>
        {p.next && (
          <>
            <div className="mt-2 text-left text-xs text-muted">Rank {p.next.name} at {p.next.min.toLocaleString()} XP</div>
            <div className="bar"><div style={{ width: `${p.rankPct}%` }} /></div>
          </>
        )}
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-bold mb-2">Attributes</h2>
        <Radar values={attrs} />
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-bold mb-3">Badges</h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((b) => {
            const got = b.test(stats);
            return (
              <div key={b.id} className={`text-center rounded-xl p-2 ${got ? "bg-white/5" : "opacity-30 grayscale"}`}>
                <div className={`text-3xl ${got ? "drop-shadow-[0_0_10px_var(--gold)]" : ""}`}>{b.icon}</div>
                <div className="text-[11px] mt-1">{b.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-bold mb-3">Themes</h2>
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
        <h2 className="font-bold">Daily targets</h2>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted">
          <label>Water ml<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.water_goal_ml} onBlur={set("water_goal_ml")} /></label>
          <label>Milk ml<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.milk_goal_ml} onBlur={set("milk_goal_ml")} /></label>
          <label>Sleep hours<input className="input mt-1" inputMode="decimal" defaultValue={profile.settings.sleep_goal_h} onBlur={set("sleep_goal_h")} /></label>
          <label>Monthly budget<input className="input mt-1" inputMode="numeric" defaultValue={profile.settings.budget_monthly} onBlur={set("budget_monthly")} /></label>
        </div>
      </section>

      <section className="card p-4 mb-4 space-y-3">
        <h2 className="font-bold">Security</h2>
        <button onClick={lock} className="btn-primary w-full">🔒 Lock now</button>
        <button onClick={backup} className="btn-ghost w-full">📦 Download encrypted backup</button>
        <p className="text-xs text-muted">Your data lives only on this device. Back up regularly; the file stays locked by your password. Photos are not included.</p>
        <div className="flex gap-2">
          <input type="password" className="input" placeholder="Decoy password" value={decoyPw} onChange={(e) => setDecoyPw(e.target.value)} />
          <button onClick={makeDecoy} className="btn-ghost shrink-0">Set</button>
        </div>
        {msg && <p className="text-xs text-[var(--accent2)]">{msg}</p>}
      </section>
    </>
  );
}
