"use client";

import { CloseX } from "@/components/CloseX";
import { useEffect, useMemo, useState } from "react";
import { battleFor, bodyOf, health, skills, strength, weightForecast, type Battle, type Lift } from "@/lib/body";
import { howTo } from "@/lib/howto";
import { moveGoodness } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { PoseDemo, tutorialUrl } from "@/components/PoseDemo";
import { moveOf, variantOf, type Move } from "@/lib/moves";
import { toDay, useApp } from "@/lib/store";

const Bar = ({ pct, color = "var(--accent2)" }: { pct: number; color?: string }) => (
  <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} /></div>
);
const when = (days: number | null) => days == null ? "start practising to see when" : days <= 1 ? "tomorrow" : days < 60 ? `in about ${days} days` : days < 730 ? `in about ${Math.round(days / 30)} months` : `in about ${(days / 365).toFixed(1)} years`;

function Spark({ v }: { v: number[] }) {
  if (v.length < 2) return null;
  const max = Math.max(...v), min = Math.min(...v);
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 100},${28 - ((x - min) / Math.max(1, max - min)) * 24}`).join(" ");
  return <svg viewBox="0 0 100 30" className="w-24 h-7"><polyline points={pts} fill="none" stroke="var(--accent2)" strokeWidth="2" /></svg>;
}

function LiftRow({ l }: { l: Lift }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{l.name}</div>
          <div className="text-xs text-muted">Best {l.best} {l.unit}{l.level ? ` · ${l.level}` : ""}{l.next ? ` · next level at ${l.next}` : ""}</div>
        </div>
        <Spark v={l.weekly} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-black/20 p-1.5"><div className="font-game text-base">{l.best}</div>now</div>
        <div className="rounded-lg bg-black/20 p-1.5"><div className="font-game text-base text-[var(--accent2)]">{l.week}</div>in 1 week</div>
        <div className="rounded-lg bg-black/20 p-1.5"><div className="font-game text-base gold-text">{l.month}</div>in 1 month</div>
      </div>
      <div className="mt-1 text-[11px] text-muted">{l.why}</div>
    </div>
  );
}

// Every skill from Noob to Master, with real hours and when you reach the next level.
export function SkillsList() {
  const { data } = useApp();
  const sk = useMemo(() => skills(data), [data]);
  return (
    <>
      {sk.length ? (
        <div className="grid gap-2">
          {sk.map((s) => (
            <div key={s.name} className="rounded-xl bg-white/5 p-3">
              <div className="flex justify-between text-sm"><span>{s.icon} <b>{s.name}</b> · {s.level}</span><span className="text-xs text-muted">{s.hours} h</span></div>
              <Bar pct={s.pct} />
              <div className="mt-1 text-[11px] text-muted">
                {s.levelDesc}. {s.next ? <>Next: <b>{s.next[0]}</b> at {s.next[1]} h, {when(s.daysToNext)}{s.pace > 0 ? ` at your pace of ${Math.round(s.pace * 60)} min a day` : ""}.</> : "Top level reached."} {s.hint}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted">Log coding, reading, study or practice with minutes to see how many hours until you level up.</p>}
      <p className="mt-1 text-[10px] text-muted">Levels: Noob 0 h · Beginner 20 h · Intermediate 100 h · Advanced 500 h · Expert 2,000 h · Master 10,000 h of real practice.</p>
    </>
  );
}

// Real strength numbers for one exercise (Training Grounds).
export function LiftCard({ name }: { name: string }) {
  const { data } = useApp();
  const l = useMemo(() => strength(data).find((x) => x.name === name), [data, name]);
  if (!l) return <p className="text-xs text-muted mb-4 px-1">Log a set to see your real strength level and a 1-week and 1-month forecast.</p>;
  return <section className="card p-4 mb-4"><h2 className="section-title mb-2">📈 Real strength</h2><LiftRow l={l} /></section>;
}

// The real-life dashboard: energy, health, body, strength and skills.
export function RealMe() {
  const { data } = useApp();
  const day = toDay(new Date());
  const h = useMemo(() => health(data, day), [data, day]);
  const b = useMemo(() => bodyOf(data), [data]);
  const wf = useMemo(() => weightForecast(data), [data]);
  const lifts = useMemo(() => strength(data), [data]);
  const e = h.energy;
  const battles = data.logs.filter((l) => l.kind === "battle").slice(-7).reverse();
  const color = h.score >= 75 ? "#22c55e" : h.score >= 50 ? "#ffd166" : "#ff5d73";

  return (
    <section className="card p-4 mb-4 space-y-4">
      <div>
        <h2 className="section-title">🧬 Real me</h2>
        <p className="text-xs text-muted">Real-world estimates from what you log: food values, calories burned (MET tables), sleep science and your own training records.</p>
      </div>

      <div>
        <div className="flex items-end justify-between">
          <div className="font-semibold">❤️ Health today</div>
          <div className="font-game text-2xl" style={{ color }}>{h.score}<span className="text-sm text-muted">/100</span></div>
        </div>
        <Bar pct={h.score} color={color} />
        <div className="mt-2 grid gap-1.5">
          {h.parts.map((p) => (
            <div key={p.label} className="text-xs">
              <div className="flex justify-between"><span>{p.label}</span><span>{p.got}/{p.max}</span></div>
              <div className="text-muted">{p.tip}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">🔥 Energy today</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{e.intake}</div>kcal eaten</div>
          <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{e.out}</div>kcal burned</div>
          <div className="rounded-xl bg-white/5 p-2"><div className={`font-game text-lg ${e.balance > 0 ? "text-amber-300" : "text-emerald-300"}`}>{e.balance > 0 ? "+" : ""}{e.balance}</div>balance</div>
        </div>
        <div className="mt-1 text-[11px] text-muted">
          Your body burns about {b.bmr} kcal a day at rest ({b.kg} kg, {b.height ?? 170} cm, age {b.age ?? 20}{b.known ? "" : ", fill Body stats for exact numbers"}), {e.base} with daily life, plus {e.active} from exercise today.
          {e.foods.length > 0 && <> Eaten: {e.foods.map((x) => `${x.qty} ${x.name} (${x.kcal})`).join(", ")}.</>}
          {e.burns.length > 0 && <> Burned: {e.burns.map((x) => `${x.name} ${x.minutes} min (${x.kcal})`).join(", ")}.</>}
        </div>
        {wf && (
          <div className="mt-2 rounded-xl bg-white/5 p-2 text-xs">
            📉 Last {wf.days} logged days averaged {wf.avg > 0 ? "+" : ""}{wf.avg} kcal a day. At this pace you would {wf.month === 0 ? "keep the same weight" : wf.month > 0 ? `gain about ${wf.month} kg` : `lose about ${Math.abs(wf.month)} kg`} in a month (7,700 kcal ≈ 1 kg).
          </div>
        )}
      </div>

      <div>
        <div className="font-semibold mb-1">💪 Strength</div>
        {lifts.length ? <div className="grid gap-2">{lifts.slice(0, 5).map((l) => <LiftRow key={l.name} l={l} />)}</div>
          : <p className="text-xs text-muted">Log sets in Training Grounds (e.g. 20 pull-ups) to see your level and what a week or a month of training will do.</p>}
      </div>

      <div>
        <div className="font-semibold mb-1">🧠 Skills: noob to expert</div>
        <SkillsList />
      </div>

      {battles.length > 0 && (
        <div>
          <div className="font-semibold mb-1">⚔️ Night battles</div>
          <div className="grid gap-1 text-xs">
            {battles.map((l) => (
              <div key={l.id} className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span>{l.data.won ? "🏆" : "💀"} {String(l.data.for)} vs {String(l.data.demonIcon)} {String(l.data.demon)}</span>
                <span className="text-muted">{String(l.data.hero)} vs {String(l.data.foe)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// After a night's sleep, plays out the battle fought with yesterday's work.
export function BattleWatcher() {
  const { data, logActivity } = useApp();
  const [show, setShow] = useState<Battle | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const asleep = data.logs.some((l) => l.kind === "sleep" && !l.data.end);
      if (asleep || now.getHours() < 4) return;
      const y = toDay(new Date(now.getTime() - 86_400_000));
      if (data.logs.some((l) => l.kind === "battle" && l.data.for === y)) return;
      if (!data.logs.some((l) => l.day === y && l.kind !== "login")) return;
      const b = battleFor(data, y);
      logActivity("battle", { for: y, demon: b.demon, demonIcon: b.demonIcon, why: b.why, hero: b.hero, foe: b.foe, won: b.won, gold: b.gold }, new Date(), 0);
      setStep(0);
      setShow(b);
    };
    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, [data, logActivity]);
  useEffect(() => {
    if (!show || step >= show.rounds.length) return;
    const t = setTimeout(() => setStep(step + 1), 700);
    return () => clearTimeout(t);
  }, [show, step]);
  if (!show) return null;
  const done = step >= show.rounds.length;
  return (
    <div data-overlay role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#05020d]/92 p-5 animate-fade">
      <div className="relative card frame w-full max-w-md p-5">
        <CloseX onClose={() => setShow(null)} />
        <div className="text-center">
          <div className="text-xs font-game tracking-widest text-[var(--accent2)]">🌙 WHILE YOU SLEPT…</div>
          <h2 className="mt-1 font-game text-xl font-black">{show.demonIcon} {show.demon} attacked!</h2>
          <p className="text-xs text-muted">It grew strong because {show.why}.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-white/5 p-2">🦸 You<div className="font-game text-xl">{show.hero}</div><div className="text-[10px] text-muted">yesterday&apos;s XP + health + good deeds</div></div>
            <div className="rounded-xl bg-white/5 p-2">{show.demonIcon} Demon<div className="font-game text-xl">{show.foe}</div><div className="text-[10px] text-muted">your level + time-pass + no movement</div></div>
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-sm min-h-24">
          {show.rounds.slice(0, step).map((r, i) => <li key={i} className="animate-fade">{r}</li>)}
        </ul>
        {done && (
          <div className="mt-3 text-center">
            <div className={`font-game text-2xl font-black ${show.won ? "gold-text" : "text-rose-400"}`}>{show.won ? `VICTORY! +${show.gold} gold` : "DEFEAT"}</div>
            <p className="text-xs text-muted mt-1">{show.won ? "Your real work yesterday won this fight. Keep it up today." : "Do more good tasks today and move your body: tonight's demon will be weaker and you stronger."}</p>
          </div>
        )}
        <button onClick={() => setShow(null)} className="btn-primary w-full mt-4">{done ? "Continue" : "Skip"}</button>
      </div>
    </div>
  );
}

// What an exercise or practice does for the body and mind.
export function ImpactCard({ name, variant, move }: { name: string; variant?: string; move?: Move }) {
  const m = move ?? moveOf(name);
  if (!m) return null;
  const vr = variantOf(m, variant);
  const how = howTo(m, vr?.name, name);
  return (
    <div className="rounded-xl bg-white/5 p-3 text-xs space-y-1">
      <div className="font-semibold text-sm">{m.kind === "body" ? "💪" : "🧠"} What {m.name.toLowerCase()} does for you</div>
      <GoodBadge g={moveGoodness(m)} />
      {m.muscles && <div><span className="text-muted">Works: </span>{m.muscles.join(", ")}</div>}
      {m.body.length > 0 && <div><span className="text-muted">Body: </span>{m.body.join(", ")}</div>}
      {m.mind.length > 0 && <div><span className="text-muted">Mind: </span>{m.mind.join(", ")}</div>}
      {vr && <div><span className="text-muted">{vr.name}: </span>{vr.note}{vr.factor !== 1 ? ` (${vr.factor > 1 ? `${vr.factor}× harder` : `${Math.round(vr.factor * 100)}% of the effort`} than standard)` : ""}</div>}
      {m.science && <div className="text-muted">🔬 {m.science}</div>}
      {m.kind === "body" && (how.pose || how.steps?.length) ? (
        <div className="flex gap-3 items-center pt-2">
          {how.pose && <PoseDemo key={`${how.pose}${how.prop}`} pose={how.pose} prop={how.prop} scene={how.scene} speed={vr && vr.factor > 1.3 ? 0.8 : 1} className="!w-32 shrink-0" />}
          <div className="flex-1 min-w-0">
            {vr && vr.name !== "Standard" && <div className="font-semibold mb-0.5">How to do {vr.name.toLowerCase()}{how.prop && how.prop !== "none" && !vr.name.toLowerCase().includes(how.prop) ? ` (with a ${how.prop})` : ""}</div>}
            <ol className="list-decimal pl-4 space-y-0.5">{(how.steps ?? []).map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </div>
      ) : null}
      {m.kind === "body" && <a href={tutorialUrl(m.name, vr?.name)} target="_blank" rel="noreferrer" className="inline-block text-[var(--accent2)] underline">▶ Watch a video of {vr ? `${vr.name.toLowerCase()} ` : ""}{m.name.toLowerCase()}</a>}
    </div>
  );
}
