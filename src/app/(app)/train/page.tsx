"use client";

import { EditLog } from "@/components/EditLog";
import { StartButton } from "@/components/Doing";
import { useEffect, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { ImpactCard, LiftCard } from "@/components/RealMe";
import { Sheet } from "@/components/Sheet";
import { PoseDemo, type Prop } from "@/components/PoseDemo";
import { howTo, variantFromName } from "@/lib/howto";
import { canDo, dayPlan, kitOf, kitText } from "@/lib/have";
import Link from "next/link";
import { type Pattern } from "@/lib/exercises";
import { moveOf, MOVES, myMove, variantOf } from "@/lib/moves";
import type { CustomItem, Log } from "@/lib/store";
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

const PATTERNS: [Pattern, string][] = [["push", "Push"], ["pull", "Pull"], ["squat", "Squat"], ["hinge", "Hinge"], ["lunge", "Lunge"], ["plank", "Plank"], ["crunch", "Crunch"], ["jump", "Jump"], ["curl", "Curl"], ["press", "Press up"], ["row", "Row"], ["run", "Run"], ["raise", "Leg raise"], ["bridge", "Bridge"], ["dip", "Dip"], ["twist", "Twist"], ["stretch", "Stretch"]];

// Change anything about an exercise: name, how it is counted, what it does,
// the moving guide, the how-to steps, and its types (mini exercises).
function ExerciseEditor({ item, onClose }: { item: CustomItem; onClose: () => void }) {
  const { update, remove } = useCustomItems("exercise");
  const c = item.config;
  const base = moveOf(item.name);
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(String(c.type ?? "reps"));
  const [about, setAbout] = useState(String(c.about ?? ""));
  const [muscles, setMuscles] = useState(String(c.muscles ?? ""));
  const [steps, setSteps] = useState(String(c.steps ?? ""));
  const [pattern, setPattern] = useState<Pattern | "">((c.pattern as Pattern) ?? "");
  const [prop, setProp] = useState<Prop | "">((c.prop as Prop) ?? "");
  const builtIn = !!base;
  const how = howTo(myMove(name, { ...c, pattern, prop }), undefined, name);
  const [mine, setMine] = useState<string[]>(Array.isArray(c.variants) ? (c.variants as string[]) : []);
  const [hidden, setHidden] = useState<string[]>(Array.isArray(c.hideVariants) ? (c.hideVariants as string[]) : []);
  const [nv, setNv] = useState("");
  const save = () => {
    update(item.id, { name: name.trim() || item.name, config: { ...c, type, about, muscles, steps, pattern, prop, variants: mine, hideVariants: hidden } });
    onClose();
  };
  return (
    <Sheet title={`✏️ ${item.name}`} onClose={onClose}>
      <label className="text-xs text-muted block">Name<input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="flex flex-wrap gap-1.5">
        {[["reps", "Reps"], ["weight", "Weight"], ["barbell", "Barbell"], ["time", "Time"]].map(([v, l]) => <button key={v} onClick={() => setType(v)} className={`chip text-xs ${type === v ? "chip-on" : ""}`}>{l}</button>)}
      </div>
      <div>
        <div className="text-xs text-muted mb-1">Types (mini exercises)</div>
        <div className="flex flex-wrap gap-1.5">
          {(base?.variants ?? []).map((v) => (
            <button key={v.name} onClick={() => setHidden(hidden.includes(v.name) ? hidden.filter((x) => x !== v.name) : [...hidden, v.name])} className={`chip !py-1 text-xs ${hidden.includes(v.name) ? "opacity-40 line-through" : "chip-on"}`}>{v.name}</button>
          ))}
          {mine.map((v) => <button key={v} onClick={() => setMine(mine.filter((x) => x !== v))} className="chip chip-on !py-1 text-xs">{v} ✕</button>)}
        </div>
        <div className="flex gap-2 mt-2">
          <input className="input" placeholder="Add a type (e.g. Archer, Wide grip)" value={nv} onChange={(e) => setNv(e.target.value)} />
          <button onClick={() => { if (nv.trim() && !mine.includes(nv.trim())) { setMine([...mine, nv.trim()]); setNv(""); } }} className="btn-primary !px-3 text-sm">Add</button>
        </div>
        {base?.variants && <div className="text-[10px] text-muted mt-1">Tap a built-in type to hide or show it.</div>}
      </div>
      <label className="text-xs text-muted block">What it does for you<textarea className="input mt-1 min-h-14" placeholder={base?.science || "e.g. Builds hip power and grip"} value={about} onChange={(e) => setAbout(e.target.value)} /></label>
      <label className="text-xs text-muted block">Muscles (comma separated)<input className="input mt-1" placeholder={base?.muscles?.join(", ") || "Glutes, Back, Grip"} value={muscles} onChange={(e) => setMuscles(e.target.value)} /></label>
      <div>
        <div className="text-xs text-muted mb-1">Moving guide</div>
        <div className="flex gap-3 items-center">
          {how.pose && <PoseDemo key={`${how.pose}${how.prop}`} pose={how.pose} prop={how.prop} scene={how.scene} className="!w-24 shrink-0" />}
          <div className="flex flex-wrap gap-1">
            {PATTERNS.map(([v, l]) => <button key={v} onClick={() => setPattern(pattern === v ? "" : v)} className={`chip !px-2 !py-0.5 text-[11px] ${(pattern || base?.pattern) === v ? "chip-on" : ""}`}>{l}</button>)}
          </div>
        </div>
        <div className="text-xs text-muted mt-2 mb-1">Holding</div>
        <div className="flex flex-wrap gap-1">
          {([["", "Auto"], ["none", "Nothing"], ["dumbbell", "Dumbbell"], ["barbell", "Barbell"], ["kettlebell", "Kettlebell"]] as [Prop | "", string][]).map(([v, l]) => (
            <button key={l} onClick={() => setProp(v)} className={`chip !px-2 !py-0.5 text-[11px] ${prop === v ? "chip-on" : ""}`}>{l}</button>
          ))}
        </div>
      </div>
      <label className="text-xs text-muted block">How to do it (one step per line)<textarea className="input mt-1 min-h-20" placeholder={base?.steps?.join("\n") || "Step 1\nStep 2\nStep 3"} value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
      <button onClick={save} className="btn-primary w-full">Save</button>
      {builtIn
        ? <button onClick={() => { remove(item.id); onClose(); }} className="btn-ghost w-full text-muted">Take off my list (it stays in the library)</button>
        : <button onClick={() => { if (confirm(`Delete ${item.name}? Your logged sets stay.`)) { remove(item.id); onClose(); } }} className="btn-ghost w-full text-rose-300">Delete exercise</button>}
    </Sheet>
  );
}

export default function TrainPage() {
  const { items, add, remove } = useCustomItems("exercise");
  const { data, logActivity, celebrate } = useApp();
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

  const [pending, setPending] = useState<string | null>(null);
  const ex = items.find((i) => i.id === sel) ?? (pending ? items.find((i) => i.name === pending) : undefined) ?? items[0];
  const type = (ex?.config.type as string) ?? "reps";
  const move = ex ? myMove(ex.name, ex.config) : undefined;
  const [editEx, setEditEx] = useState<CustomItem | null>(null);
  const [q, setQ] = useState("");
  const [variant, setVariant] = useState<string | null>(null);
  const [family, setFamily] = useState<string>("");
  const [mine, setMine] = useState(false);
  const kit = kitOf(data.pantry);
  const plan = dayPlan(kit);
  const vr = variantOf(move, variant ?? (ex ? variantFromName(move, ex.name) : undefined));
  const pick = (name: string, t?: string) => {
    const have = items.find((i) => i.name === name);
    if (have) setSel(have.id); else { add(name, { type: t ?? "reps" }); setSel(null); setPending(name); }
    setVariant(null);
  };
  const library = MOVES.filter((m) => m.kind === "body" && (!family || m.pattern === family) && (!mine || canDo(m, kit)) && (!q || `${m.name} ${m.muscles?.join(" ")} ${m.pattern}`.toLowerCase().includes(q.toLowerCase())));

  // Opened from "What I have" with an exercise to show.
  useEffect(() => {
    const ex = new URLSearchParams(location.search).get("ex");
    if (ex) pick(ex, MOVES.find((m) => m.name === ex)?.type);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      ...(vr ? { variant: vr.name, factor: vr.factor } : {}),
    });
    const prev = Math.max(0, ...data.logs.filter((l) => l.kind === "workout" && l.data.exercise === ex.name && (l.data.variant ?? "Standard") === (vr?.name ?? "Standard")).map((l) => Number(l.data.reps) || 0));
    const r = Number(reps) || 0;
    celebrate({ title: r > prev && prev > 0 ? "🔥 NEW PERSONAL BEST!" : "POWER UP!", subtitle: r > prev && prev > 0 ? `${ex.name}: ${r} reps (was ${prev}). Real strength gained.` : ex.name, xp: row.xp });
  };

  const [fixing, setFixing] = useState<Log | null>(null);
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
            <button onClick={() => { setSel(i.id); setVariant(null); }} className={`chip ${ex?.id === i.id ? "chip-on" : ""}`}>{i.name}</button>
            {editing && !moveOf(i.name) && (
              <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-xs">✕</button>
            )}
          </span>
        ))}
      </div>
      <details className="card p-3 mb-3" open={Object.keys(kit).length > 0 || !items.length}>
        <summary className="text-sm font-semibold cursor-pointer">📅 Today&apos;s full workout (made from what you have)</summary>
        <p className="text-xs text-muted mt-2">{Object.keys(kit).length ? <>You have {kitText(kit)}.</> : <>No equipment yet, so this is bodyweight only. <Link href="/have" className="text-[var(--accent2)] underline">Add your dumbbells, kettlebell or pull-up bar</Link> and it changes.</>} A new plan each day.</p>
        <table className="w-full text-xs mt-2">
          <tbody>
            {plan.map((r) => (
              <tr key={r.part} className="border-t border-white/5">
                <td className="py-1.5 pr-2 text-muted whitespace-nowrap">{r.part}</td>
                <td className="py-1.5"><button onClick={() => pick(r.name, MOVES.find((m) => m.name === r.name)?.type)} className="underline decoration-white/20 text-left">{r.name}</button></td>
                <td className="py-1.5 text-right whitespace-nowrap">{r.sets} × {r.reps}{r.kg ? ` @ ${r.kg} kg` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <details className="card p-3 mb-3">
        <summary className="text-sm font-semibold cursor-pointer">📚 All exercises ({MOVES.filter((m) => m.kind === "body").length}) · tap one to train it</summary>
        <div className="space-y-2 mt-2">
          <input className="input" placeholder="Search (kettlebell, abs, back, dumbbell…)" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setMine(!mine)} className={`chip !px-2 !py-0.5 text-[11px] ${mine ? "chip-on" : ""}`}>🎒 I can do</button>
            <button onClick={() => setFamily("")} className={`chip !px-2 !py-0.5 text-[11px] ${!family ? "chip-on" : ""}`}>All</button>
            {PATTERNS.map(([v, l]) => <button key={v} onClick={() => setFamily(family === v ? "" : v)} className={`chip !px-2 !py-0.5 text-[11px] ${family === v ? "chip-on" : ""}`}>{l}</button>)}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
            {library.map((m) => {
              const mine = items.some((i) => moveOf(i.name) === m);
              return <button key={m.name} onClick={() => pick(m.name, m.type)} className={`chip !py-1 text-xs ${mine ? "chip-on" : ""}`}>{mine ? "✓ " : "+ "}{m.name}</button>;
            })}
            {!library.length && <div className="text-xs text-muted">Nothing found. Add it as your own below (tap Edit).</div>}
          </div>
        </div>
      </details>
      {editing && (
        <div className="card p-3 mb-4 flex gap-2">
          <input className="input" placeholder="New exercise" value={newEx} onChange={(e) => setNewEx(e.target.value)} />
          <select className="input !w-32" value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="reps">Reps</option>
            <option value="weight">Weight</option>
            <option value="barbell">Barbell</option>
            <option value="time">Time</option>
          </select>
          <button className="btn-primary" onClick={() => { if (newEx.trim()) { add(newEx.trim(), { type: newType }); setNewEx(""); } }}>Add</button>
        </div>
      )}

      {ex && (
        <section className="card p-4 mb-4 space-y-3">
          <div className="flex items-start gap-2">
            <h3 className="text-xl font-black flex-1">{ex.name}{vr && vr.name !== "Standard" ? ` · ${vr.name}` : ""}</h3>
            <button onClick={() => setEditEx(ex)} className="btn-ghost !px-3 !py-1 text-xs">✏️ Edit</button>
          </div>
          {move?.variants && (
            <div>
              <div className="text-xs text-muted mb-1">Type</div>
              <div className="flex flex-wrap gap-1.5">
                {move.variants.map((x) => <button key={x.name} onClick={() => setVariant(x.name)} className={`chip !py-1 text-xs ${vr?.name === x.name ? "chip-on" : ""}`}>{x.name}</button>)}
              </div>
            </div>
          )}
          {move ? <ImpactCard name={ex.name} variant={vr?.name} move={move} /> : (
            <button onClick={() => setEditEx(ex)} className="w-full rounded-xl border border-dashed border-white/20 p-3 text-xs text-muted text-left">I don&apos;t know “{ex.name}” yet. Tap to add what it works, its types, a moving guide and how to do it.</button>
          )}
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted">Sets<input className="input mt-1" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} /></label>
            <label className="text-xs text-muted">{type === "time" ? "Seconds" : "Reps"}<input className="input mt-1" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} /></label>
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

          <button onClick={log} className="btn-primary w-full">Log set (done)</button>
          <StartButton onClick={log} label="▶ Start this set, tick Complete after" />
        </section>
      )}
      {editEx && <ExerciseEditor item={editEx} onClose={() => setEditEx(null)} />}
      {ex && <LiftCard name={`${ex.name}${vr && vr.name !== "Standard" ? ` (${vr.name})` : ""}`} />}

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
            <li key={l.id}>
              <button onClick={() => setFixing(l)} className="card px-3 py-2 w-full flex justify-between text-left">
                <span>{String(l.data.exercise)}: {String(l.data.sets ?? 1)}×{String(l.data.reps)}{l.data.weight ? ` @ ${l.data.weight} kg` : ""}</span>
                <span className="text-muted">✏️ fix</span>
              </button>
            </li>
          ))}
        </ul>
        {fixing && <EditLog log={fixing} onClose={() => setFixing(null)} />}
      </section>
    </>
  );
}
