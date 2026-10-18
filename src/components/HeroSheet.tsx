"use client";

import { WhenPicker } from "@/components/When";
import { useMemo, useState } from "react";
import { ACCESSORIES, AvatarArt, CLASSES, EXPRESSIONS, EYES, HAIR_STYLES, HAIRS, OUTFITS, PANTS, SHOES, SKINS } from "@/components/AvatarArt";
import { dtLocal, Sheet } from "@/components/Sheet";
import { ABOUT_HINTS, HABITS, suggestHabits } from "@/lib/habits";
import { MeasureCharts } from "@/components/Fitness";
import { MEASURES } from "@/lib/fitness";
import { useApp, useCustomItems, type Avatar } from "@/lib/store";

function Swatches({ list, value, onPick }: { list: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((c) => (
        <button key={c} aria-label={c} onClick={() => onPick(c)}
          className={`h-8 w-8 rounded-full border-2 ${value === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
      ))}
      <label className="relative h-8 w-8 rounded-full border-2 border-dashed border-white/30 grid place-items-center text-xs text-muted cursor-pointer">
        +
        <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
  );
}

export function AvatarEditor({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile } = useApp();
  const [a, setA] = useState<Avatar>(profile.avatar);
  const [name, setName] = useState(profile.display_name);
  const set = (patch: Partial<Avatar>) => setA({ ...a, ...patch });
  return (
    <Sheet title="Edit hero" onClose={onClose}>
      <div className="flex justify-center"><AvatarArt a={a} size={200} full /></div>
      <input className="input text-center font-game" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hero name" />
      <div className="text-xs text-muted">Class</div>
      <div className="grid grid-cols-3 gap-2">
        {CLASSES.map((c) => (
          <button key={c.name} onClick={() => set({ heroClass: c.name })} className={`chip py-2 ${a.heroClass === c.name ? "chip-on" : ""}`}>{c.icon} {c.name}</button>
        ))}
      </div>
      <div className="text-xs text-muted">Hair style</div>
      <div className="flex flex-wrap gap-2">
        {HAIR_STYLES.map((h, i) => <button key={h} onClick={() => set({ hairStyle: i })} className={`chip ${a.hairStyle === i ? "chip-on" : ""}`}>{h}</button>)}
      </div>
      <div className="text-xs text-muted">Expression</div>
      <div className="flex flex-wrap gap-2">
        {EXPRESSIONS.map((x, i) => <button key={x} onClick={() => set({ expression: i })} className={`chip ${(a.expression ?? 0) === i ? "chip-on" : ""}`}>{x}</button>)}
      </div>
      <div className="text-xs text-muted">Hair color</div>
      <Swatches list={HAIRS} value={a.hair} onPick={(hair) => set({ hair })} />
      <div className="text-xs text-muted">Eyes</div>
      <Swatches list={EYES} value={a.eyes} onPick={(eyes) => set({ eyes })} />
      <div className="text-xs text-muted">Skin</div>
      <Swatches list={SKINS} value={a.skin} onPick={(skin) => set({ skin })} />
      <div className="text-xs text-muted">Outfit</div>
      <Swatches list={OUTFITS} value={a.outfit} onPick={(outfit) => set({ outfit })} />
      <div className="text-xs text-muted">Pants</div>
      <Swatches list={PANTS} value={a.pants ?? PANTS[0]} onPick={(pants) => set({ pants })} />
      <div className="text-xs text-muted">Shoes</div>
      <Swatches list={SHOES} value={a.shoes ?? SHOES[0]} onPick={(shoes) => set({ shoes })} />
      <div className="text-xs text-muted">Accessory</div>
      <div className="flex flex-wrap gap-2">
        {ACCESSORIES.map((x, i) => <button key={x} onClick={() => set({ accessory: i })} className={`chip ${a.accessory === i ? "chip-on" : ""}`}>{x}</button>)}
      </div>
      <button className="btn-primary w-full" onClick={() => { saveProfile({ avatar: a, display_name: name.trim() || profile.display_name }); onClose(); }}>Save hero</button>
    </Sheet>
  );
}

function bmiLabel(b: number) {
  if (b < 18.5) return { label: "Light build", color: "#7cf2ff", tip: "Sensei: more protein and strength training will build power." };
  if (b < 25) return { label: "Balanced", color: "#3ee08f", tip: "Sensei: perfect balance. Keep training to stay in this zone." };
  if (b < 30) return { label: "Heavy build", color: "#ffcf4a", tip: "Sensei: daily walks and water will sharpen your form." };
  return { label: "Tank class", color: "#ff7b54", tip: "Sensei: every step and every glass of water is progress. Small wins add up." };
}

// Real body stats tracked like a game character sheet.
export function BodyStats() {
  const { data, profile, saveProfile, logActivity } = useApp();
  const [open, setOpen] = useState(false);
  const checks = useMemo(
    () => data.logs.filter((l) => l.kind === "body" && l.data.weight).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data.logs],
  );
  const last = checks.at(-1);
  const weight = last ? Number(last.data.weight) : null;
  const h = profile.height_cm;
  const bmi = weight && h ? weight / (h / 100) ** 2 : null;
  const b = bmi ? bmiLabel(bmi) : null;
  const first = checks[0] ? Number(checks[0].data.weight) : null;
  const change = weight != null && first != null ? +(weight - first).toFixed(1) : null;
  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null;

  // weight trend line
  const pts = checks.slice(-30).map((l) => Number(l.data.weight));
  const min = Math.min(...pts), max = Math.max(...pts);
  const path = pts.map((w, i) => `${i === 0 ? "M" : "L"}${(i / Math.max(1, pts.length - 1)) * 300},${70 - ((w - min) / Math.max(0.1, max - min)) * 60}`).join(" ");

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">🧍 Body stats</h2>
        <button onClick={() => setOpen(true)} className="chip chip-on">+ Body check</button>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{h ?? "-"}</div><div className="text-[10px] text-muted">HEIGHT cm</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{weight ?? "-"}</div><div className="text-[10px] text-muted">WEIGHT kg</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg" style={{ color: b?.color }}>{bmi ? bmi.toFixed(1) : "-"}</div><div className="text-[10px] text-muted">BMI</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{age ?? "-"}</div><div className="text-[10px] text-muted">AGE</div></div>
      </div>
      {b && <p className="mt-2 text-sm"><span className="font-bold" style={{ color: b.color }}>{b.label}</span> <span className="text-muted">{b.tip}</span></p>}
      {pts.length > 1 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted"><span>Weight trend</span>{change != null && <span>{change > 0 ? "+" : ""}{change} kg since start</span>}</div>
          <svg viewBox="0 0 300 80" className="w-full h-20 mt-1">
            <path d={path} fill="none" stroke="var(--accent2)" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 6px var(--accent2))" }} />
          </svg>
        </div>
      )}
      <MeasureCharts />
      {open && (
        <BodySheet
          height={h}
          birthYear={profile.birth_year}
          onClose={() => setOpen(false)}
          onSave={(v) => {
            if (v.height && v.height !== h) saveProfile({ height_cm: v.height });
            if (v.birthYear && v.birthYear !== profile.birth_year) saveProfile({ birth_year: v.birthYear });
            // Weight and measurements are one body check; any of them is enough to save.
            const sizes = Object.fromEntries(Object.entries(v.sizes).filter(([, x]) => x > 0));
            if (v.weight || Object.keys(sizes).length) logActivity("body", { weight: v.weight ?? undefined, height: v.height ?? undefined, ...sizes }, v.at);
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}

function BodySheet({ height, birthYear, onClose, onSave }: {
  height: number | null; birthYear: number | null; onClose: () => void;
  onSave: (v: { weight: number | null; height: number | null; sizes: Record<string, number>; birthYear: number | null; at: Date }) => void;
}) {
  const [w, setW] = useState("");
  const [hh, setH] = useState(height ? String(height) : "");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [by, setBy] = useState(birthYear ? String(birthYear) : "");
  const [when, setWhen] = useState(dtLocal(new Date()));
  const n = (x: string) => (x ? Number(x) : null);
  return (
    <Sheet title="📏 Body check" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Weight (kg)<input autoFocus className="input mt-1" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} /></label>
        <label className="text-xs text-muted">Height (cm)<input className="input mt-1" inputMode="decimal" value={hh} onChange={(e) => setH(e.target.value)} /></label>
        <label className="text-xs text-muted">Birth year<input className="input mt-1" inputMode="numeric" value={by} onChange={(e) => setBy(e.target.value)} /></label>
      </div>
      <div className="text-xs text-muted">📏 Measurements in cm (optional, tape around the widest part; arms flexed)</div>
      <div className="grid grid-cols-4 gap-2">
        {MEASURES.map(([k, l]) => <label key={k} className="text-[11px] text-muted">{l}<input className="input mt-1 !px-2" inputMode="decimal" value={sizes[k] ?? ""} onChange={(e) => setSizes({ ...sizes, [k]: e.target.value })} /></label>)}
      </div>
      <WhenPicker label="When" value={when} onChange={setWhen} />
      <button className="btn-primary w-full" onClick={() => onSave({ weight: n(w), height: n(hh), sizes: Object.fromEntries(Object.entries(sizes).map(([k, x]) => [k, Number(x) || 0])), birthYear: n(by), at: new Date(when) })}>Save</button>
    </Sheet>
  );
}

// "About me": the hero writes about their habits and day; Sensei reads it and
// offers habit quests that would make them stronger.
export function AboutMe() {
  const { data, profile, saveProfile } = useApp();
  const { items: habits, add } = useCustomItems("habit");
  const [text, setText] = useState(profile.about ?? "");
  const [editing, setEditing] = useState(!profile.about);
  const taken = new Set(habits.map((h) => String(h.config.tpl)));
  const found = ABOUT_HINTS.filter(([re]) => re.test(profile.about ?? ""));
  const offers = suggestHabits(data, habits).filter((s) => found.some(([, id]) => id === s.tpl.id));
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">📝 About me</h2>
        {!editing && <button onClick={() => setEditing(true)} className="chip">Edit</button>}
      </div>
      {editing ? (
        <>
          <textarea className="input min-h-36" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"Write about yourself: your daily routine, habits, what you want to change.\ne.g. I'm a student, I wake up at 9, I watch anime till 2 am, I want to get stronger and stop skipping breakfast."} />
          <button className="btn-primary w-full mt-2" onClick={() => { saveProfile({ about: text.trim() }); setEditing(false); }}>Save</button>
        </>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{profile.about}</p>
      )}
      {!editing && profile.about && (
        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <div className="text-[10px] font-game tracking-widest text-[var(--accent2)]">🥷 SENSEI READ YOUR STORY</div>
          {found.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Tell me more about your day (sleep, screen time, study, food, exercise) and I&apos;ll design habit quests for you.</p>
          ) : (
            <ul className="mt-1 text-sm space-y-1">
              {found.map(([, id, why]) => {
                const t = HABITS.find((x) => x.id === id)!;
                const offer = offers.find((o) => o.tpl.id === id);
                return (
                  <li key={id} className="flex items-center gap-2">
                    <span className="flex-1">{t.icon} {why[0].toUpperCase() + why.slice(1)} → <b>{t.name}</b></span>
                    {taken.has(id) ? <span className="text-xs text-[var(--accent2)]">Active</span>
                      : <button className="chip chip-on" onClick={() => add(t.name, { tpl: t.id, started: new Date().toISOString(), reason: offer?.reason ?? `Because ${why}.`, source: "about" })}>Accept</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
