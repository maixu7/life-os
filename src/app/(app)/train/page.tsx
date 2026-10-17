"use client";

import { useEffect, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { today, useApp, useCustomItems, useLogs } from "@/lib/store";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLOR: Record<number, string> = { 25: "#ff3b5c", 20: "#3b82ff", 15: "#ffd166", 10: "#22c55e", 5: "#f4f0ff", 2.5: "#888", 1.25: "#555" };

function platesPerSide(total: number, bar: number) {
  let rest = Math.max(0, (total - bar) / 2);
  const out: number[] = [];
  for (const p of PLATES) while (rest >= p - 1e-9) { out.push(p); rest -= p; }
  return { out, leftover: Math.round(rest * 2 * 100) / 100 };
}

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
}

export default function TrainPage() {
  const { items, add, remove } = useCustomItems("exercise");
  const { logActivity, celebrate } = useApp();
  const { logs } = useLogs(today());
  const [sel, setSel] = useState<string | null>(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [bar, setBar] = useState(20);
  const [newEx, setNewEx] = useState("");
  const [newType, setNewType] = useState("reps");
  const [editing, setEditing] = useState(false);
  const [rest, setRest] = useState(0);

  const ex = items.find((i) => i.id === sel) ?? items[0];
  const type = (ex?.config.type as string) ?? "reps";

  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => {
      if (rest === 1) {
        navigator.vibrate?.([200, 100, 200, 100, 400]);
        beep();
      } else if (rest <= 4) navigator.vibrate?.(30);
      setRest(rest - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const log = async () => {
    if (!ex) return;
    const row = logActivity("workout", {
      exercise: ex.name, sets: Number(sets) || 1, reps: Number(reps) || 0, weight: weight ? Number(weight) : undefined,
    });
    celebrate({ title: "POWER UP!", subtitle: ex.name, xp: row.xp });
  };

  const todays = logs.filter((l) => l.kind === "workout");
  const volume = todays.reduce((s, l) => s + Number(l.data.sets ?? 1) * Number(l.data.reps ?? 0) * Number(l.data.weight ?? 0), 0);
  const plates = type === "barbell" && weight ? platesPerSide(Number(weight), bar) : null;

  return (
    <>
      <XpHeader title="Training Grounds" icon="⚔️" subtitle="Every rep is XP for your body" />

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold">Exercises</h2>
        <button onClick={() => setEditing(!editing)} className="text-sm text-muted">{editing ? "Done" : "Edit"}</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((i) => (
          <span key={i.id} className="relative">
            <button onClick={() => setSel(i.id)} className={`chip ${ex?.id === i.id ? "chip-on" : ""}`}>{i.name}</button>
            {editing && (
              <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-xs">✕</button>
            )}
          </span>
        ))}
      </div>
      {editing && (
        <div className="card p-3 mb-4 flex gap-2">
          <input className="input" placeholder="New exercise" value={newEx} onChange={(e) => setNewEx(e.target.value)} />
          <select className="input !w-32" value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="reps">Reps</option>
            <option value="weight">Weight</option>
            <option value="barbell">Barbell</option>
          </select>
          <button className="btn-primary" onClick={() => { if (newEx.trim()) { add(newEx.trim(), { type: newType }); setNewEx(""); } }}>Add</button>
        </div>
      )}

      {ex && (
        <section className="card p-4 mb-4 space-y-3">
          <h3 className="text-xl font-black">{ex.name}</h3>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted">Sets<input className="input mt-1" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} /></label>
            <label className="text-xs text-muted">Reps<input className="input mt-1" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} /></label>
            {type !== "reps" && (
              <label className="text-xs text-muted">kg<input className="input mt-1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
            )}
          </div>

          {plates && (
            <div className="rounded-xl bg-black/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Plates per side</span>
                <span>Bar <button onClick={() => setBar(bar === 20 ? 15 : bar === 15 ? 10 : 20)} className="chip">{bar} kg</button></span>
              </div>
              <div className="flex items-center h-16">
                <div className="h-2 w-10 bg-zinc-400 rounded-l" />
                {plates.out.map((p, i) => (
                  <div key={i} className="mx-px rounded-sm grid place-items-center text-[9px] font-bold text-black"
                    style={{ background: PLATE_COLOR[p], width: 12 + p / 2, height: 24 + p * 1.6 }}>{p}</div>
                ))}
                <div className="h-2 flex-1 bg-zinc-400 rounded-r" />
              </div>
              {plates.leftover > 0 && <p className="text-xs text-amber-300 mt-1">{plates.leftover} kg can&apos;t be made with standard plates.</p>}
            </div>
          )}

          <button onClick={log} className="btn-primary w-full">Log set</button>
        </section>
      )}

      <section className="card p-4 mb-4 text-center">
        <h2 className="font-bold mb-2">Rest timer</h2>
        <div className={`text-5xl font-black tabular-nums ${rest > 0 && rest <= 5 ? "text-[var(--gold)] animate-pulse" : ""}`}>
          {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {[60, 90, 120, 180].map((s) => <button key={s} onClick={() => setRest(s)} className="btn-ghost">{s}s</button>)}
          {rest > 0 && <button onClick={() => setRest(0)} className="btn-ghost text-rose-400">Stop</button>}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2">Today {volume > 0 && <span className="text-sm text-muted font-normal">· {volume.toLocaleString()} kg volume</span>}</h2>
        {todays.length === 0 && <p className="text-sm text-muted">No sets yet. You&apos;ve got this!</p>}
        <ul className="space-y-1 text-sm">
          {todays.map((l) => (
            <li key={l.id} className="card px-3 py-2">
              {String(l.data.exercise)}: {String(l.data.sets ?? 1)}×{String(l.data.reps)}{l.data.weight ? ` @ ${l.data.weight} kg` : ""}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
