"use client";

import { CareCard } from "@/components/CareCard";
import { useMemo, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { AREAS, BUY, CONDITIONS, diagnose, MEDS, PHONES, SYMPTOMS, symptom, triage, type Answers, type Area, type Condition, type Match } from "@/lib/doctor";
import { useApp } from "@/lib/store";

const FEEL: [number, string, string][] = [[1, "😵", "Terrible"], [2, "🤒", "Bad"], [3, "😕", "Not great"], [4, "🙂", "A bit off"], [5, "😀", "Fine"]];
const DAYS: [number, string][] = [[0, "Today"], [1, "1-2 days"], [3, "3-6 days"], [7, "1-2 weeks"], [14, "2+ weeks"]];
const SEV: Record<Condition["severity"], [string, string]> = { mild: ["Mild", "text-emerald-300"], moderate: ["Moderate", "text-amber-300"], serious: ["Serious", "text-orange-400"], emergency: ["Emergency", "text-rose-400"] };
const LEVEL: Record<string, string> = { emergency: "border-rose-500 bg-rose-500/15", "doctor-today": "border-orange-400 bg-orange-400/10", "doctor-soon": "border-amber-300 bg-amber-300/10", home: "border-emerald-400 bg-emerald-400/10" };

function Doc({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start mb-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-400/15 text-2xl">👩‍⚕️</span>
      <div className="rounded-2xl rounded-tl-sm bg-white/[.06] px-3 py-2 text-sm">{children}</div>
    </div>
  );
}

function ConditionCard({ c, m, open, onToggle, onConsult }: { c: Condition; m?: Match; open: boolean; onToggle: () => void; onConsult?: () => void }) {
  const [sev, color] = SEV[c.severity];
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-baseline gap-2">
          <b className="flex-1">{c.name}</b>
          {m && <span className="font-game text-sm text-[var(--accent2)]">{Math.round(m.pct * 100)}%</span>}
        </div>
        <div className="text-xs text-muted">{c.ja} · <span className={color}>{sev}</span>{c.contagious ? " · 🦠 contagious" : ""}</div>
        {m && <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[var(--accent2)]" style={{ width: `${m.pct * 100}%` }} /></div>}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-xs">
          {m && <div><span className="text-muted">Matches your: </span>{m.hits.map((h) => symptom(h)?.label).join(", ")}</div>}
          <div><span className="text-muted">Signs: </span>{c.syms.filter(([, w]) => w > 0).map(([id]) => symptom(id)?.label).filter(Boolean).join(", ")}</div>
          <div><span className="text-muted">Cause: </span>{c.cause}</div>
          {c.home.length > 0 && <div><div className="text-muted">🏠 Home care</div><ul className="list-disc pl-4">{c.home.map((h) => <li key={h}>{h}</li>)}</ul></div>}
          {c.meds.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-muted">💊 Medicine you can buy (OTC)</div>
              {c.meds.map((k) => MEDS[k]).filter(Boolean).map((md) => (
                <div key={md.name} className="rounded-lg bg-black/25 p-2">
                  <div className="font-semibold">{md.name} {md.cls && <span className="ml-1 rounded bg-white/10 px-1 text-[10px] font-normal">{md.cls}</span>}</div>
                  <div className="text-muted">{md.generic}</div>
                  <div>{md.use}</div>
                  <div className="text-amber-200/90">⚠️ {md.caution}</div>
                </div>
              ))}
            </div>
          )}
          <div><span className="text-muted">🩺 See a doctor: </span>{c.doctor}</div>
          {c.dept && <div><span className="text-muted">Which clinic: </span>{c.dept}</div>}
          {c.days !== undefined && c.days > 0 && <div><span className="text-muted">Usually better in: </span>about {c.days} day{c.days > 1 ? "s" : ""}</div>}
          {c.info && <div className="text-sky-200">ℹ️ {c.info}</div>}
          {onConsult && <button onClick={onConsult} className="btn-primary w-full !py-2 text-sm mt-1">I think I have this: check with the doctor</button>}
        </div>
      )}
    </div>
  );
}

export default function DoctorPage() {
  const { data, profile, logActivity, celebrate } = useApp();
  const [tab, setTab] = useState<"consult" | "library" | "history">("consult");
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ syms: [], feel: 3, days: 0, worse: false, age: profile.birth_year ? new Date().getFullYear() - profile.birth_year : undefined });
  const [q, setQ] = useState("");
  const [area, setArea] = useState<Area | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [lq, setLq] = useState("");
  const [larea, setLarea] = useState<Area | "all">("all");
  const [saved, setSaved] = useState(false);
  const top = useMemo(() => diagnose(a), [a]);
  const advice = useMemo(() => triage(a, top), [a, top]);
  const history = data.logs.filter((l) => l.kind === "sick").slice().reverse();

  const toggle = (id: string) => setA((p) => ({ ...p, syms: p.syms.includes(id) ? p.syms.filter((x) => x !== id) : [...p.syms, id] }));
  const reset = () => { setA({ ...a, syms: [], feel: 3, days: 0, worse: false, temp: undefined }); setStep(0); setSaved(false); setOpen(null); };
  const consult = (c: Condition) => { setA((p) => ({ ...p, syms: c.syms.filter(([, w]) => w >= 2).map(([id]) => id) })); setTab("consult"); setStep(1); setSaved(false); scrollTo(0, 0); };
  const save = () => {
    logActivity("sick", { symptoms: a.syms.map((s) => symptom(s)?.label), feel: a.feel, days: a.days, temp: a.temp, top: top[0]?.c.name, advice: advice.title }, new Date(), 0);
    setSaved(true);
    celebrate({ title: "Get well soon 🍀", subtitle: "Saved to your health record", kind: "small" });
  };
  const shown = SYMPTOMS.filter((s) => (area === "all" || s.area === area) && (!q || `${s.label} ${s.ja}`.toLowerCase().includes(q.toLowerCase())));
  const lib = CONDITIONS.filter((c) => (larea === "all" || c.area === larea) && (!lq || `${c.name} ${c.ja} ${c.cause} ${c.syms.map(([id]) => symptom(id)?.label).join(" ")}`.toLowerCase().includes(lq.toLowerCase())));

  return (
    <>
      <XpHeader title="App Doctor" icon="🩺" subtitle="Tell me how you feel; I'll tell you what to do" />
      <CareCard />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([["consult", "🩺 Consult"], ["library", `📚 Illnesses (${CONDITIONS.length})`], ["history", "🗂️ History"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`chip justify-center text-xs ${tab === v ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>

      {tab === "consult" && (
        <section className="card p-4 mb-4">
          {step === 0 && (<>
            <Doc>Hello, I&apos;m Dr. Hana. How are you feeling right now?</Doc>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {FEEL.map(([v, e, l]) => <button key={v} onClick={() => { setA({ ...a, feel: v }); setStep(1); }} className={`rounded-2xl border p-2 flex flex-col items-center ${a.feel === v ? "border-[var(--accent2)] bg-white/10" : "border-white/10"}`}><span className="text-3xl">{e}</span><span className="text-[10px]">{l}</span></button>)}
            </div>
          </>)}

          {step === 1 && (<>
            <Doc>What are you feeling? Pick everything that fits. You can search in English or Japanese.</Doc>
            <input className="input mb-2" placeholder="Search: fever, 頭痛, rash…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
              <button onClick={() => setArea("all")} className={`chip shrink-0 !py-1 text-xs ${area === "all" ? "chip-on" : ""}`}>All</button>
              {AREAS.map(([v, l]) => <button key={v} onClick={() => setArea(v)} className={`chip shrink-0 !py-1 text-xs ${area === v ? "chip-on" : ""}`}>{l}</button>)}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto">
              {shown.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)} className={`chip !py-1 text-xs ${a.syms.includes(s.id) ? "chip-on" : ""} ${s.red ? "!border-rose-400/60" : ""}`}>
                  {a.syms.includes(s.id) ? "✓ " : ""}{s.label} <span className="text-[10px] opacity-60">{s.ja}</span>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-muted mt-2">Red-edged ones are danger signs.</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setStep(0)} className="btn-ghost">Back</button>
              <button disabled={!a.syms.length} onClick={() => setStep(2)} className="btn-primary flex-1">Next ({a.syms.length} picked)</button>
            </div>
          </>)}

          {step === 2 && (<>
            <Doc>A few questions so I can judge how serious it is.</Doc>
            <div className="space-y-3 text-sm">
              <div><div className="text-xs text-muted mb-1">Since when?</div>
                <div className="flex flex-wrap gap-1.5">{DAYS.map(([v, l]) => <button key={v} onClick={() => setA({ ...a, days: v })} className={`chip !py-1 text-xs ${a.days === v ? "chip-on" : ""}`}>{l}</button>)}</div></div>
              <label className="block text-xs text-muted">Temperature if you measured it (°C)
                <input className="input mt-1" inputMode="decimal" placeholder="e.g. 38.2" value={a.temp ?? ""} onChange={(e) => setA({ ...a, temp: Number(e.target.value) || undefined })} /></label>
              <div><div className="text-xs text-muted mb-1">Is it getting worse?</div>
                <div className="flex gap-1.5">{[[false, "No / same"], [true, "Yes, worse"]].map(([v, l]) => <button key={String(v)} onClick={() => setA({ ...a, worse: v as boolean })} className={`chip !py-1 text-xs ${a.worse === v ? "chip-on" : ""}`}>{l as string}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-muted">Age<input className="input mt-1" inputMode="numeric" value={a.age ?? ""} onChange={(e) => setA({ ...a, age: Number(e.target.value) || undefined })} /></label>
                <label className="flex items-end gap-2 text-xs pb-3"><input type="checkbox" checked={!!a.pregnant} onChange={(e) => setA({ ...a, pregnant: e.target.checked })} /> Pregnant</label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">See what I think</button>
            </div>
          </>)}

          {step === 3 && (<>
            <div className={`rounded-2xl border-2 p-3 mb-3 ${LEVEL[advice.level]}`}>
              <div className="font-bold">{advice.title}</div>
              <ul className="text-xs mt-1 list-disc pl-4">{advice.why.map((w) => <li key={w}>{w}</li>)}</ul>
              {advice.level !== "home" && (
                <div className="mt-2 grid gap-1">
                  {PHONES.map(([n, l]) => <a key={n} href={`tel:${n}`} className="flex items-center gap-2 text-xs rounded-lg bg-black/25 px-2 py-1.5"><b className="w-24">{n}</b><span className="text-muted">{l}</span></a>)}
                </div>
              )}
            </div>
            {advice.level !== "emergency" && <Doc>{top.length ? <>From what you told me, these are the most likely. Tap one for care, medicine and when to see a doctor.</> : <>Your symptoms don&apos;t clearly match an illness I know. If you feel unwell for more than a few days, see a 内科 (internal medicine) clinic.</>}</Doc>}
            <div className="space-y-2">
              {top.map((m, i) => <ConditionCard key={m.c.name} c={m.c} m={m} open={open === m.c.name || (open === null && i === 0)} onToggle={() => setOpen(open === m.c.name ? "" : m.c.name)} />)}
            </div>
            <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs space-y-1">
              <div className="font-semibold">🗣️ Show this to the pharmacist or doctor</div>
              <div className="text-base leading-relaxed">症状：{a.syms.map((s) => symptom(s)?.ja).join("、")}。{a.temp ? `体温 ${a.temp}℃。` : ""}{DAYS.find(([v]) => v === a.days)?.[1] === "Today" ? "今日から。" : `${a.days}日前から。`}{a.pregnant ? "妊娠中です。" : ""}</div>
              <div className="text-muted">🛒 {BUY}</div>
            </div>
            <p className="text-[10px] text-muted mt-3">Dr. Hana is a guide built from common medical advice, not a real doctor, and can be wrong. If you&apos;re worried, or something feels very wrong, see a doctor or call #7119 / 119. Always read the medicine leaflet (添付文書).</p>
            <div className="flex gap-2 mt-3">
              <button onClick={reset} className="btn-ghost">New consult</button>
              <button disabled={saved} onClick={save} className="btn-primary flex-1">{saved ? "✓ Saved to health record" : "Save to my health record"}</button>
            </div>
          </>)}
        </section>
      )}

      {tab === "library" && (
        <section className="card p-4 mb-4">
          <input className="input mb-2" placeholder="Search illness, symptom or Japanese name" value={lq} onChange={(e) => setLq(e.target.value)} />
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
            <button onClick={() => setLarea("all")} className={`chip shrink-0 !py-1 text-xs ${larea === "all" ? "chip-on" : ""}`}>All</button>
            {AREAS.filter(([v]) => v !== "context").map(([v, l]) => <button key={v} onClick={() => setLarea(v)} className={`chip shrink-0 !py-1 text-xs ${larea === v ? "chip-on" : ""}`}>{l}</button>)}
          </div>
          <div className="space-y-2">
            {lib.map((c) => <ConditionCard key={c.name} c={c} open={open === c.name} onToggle={() => setOpen(open === c.name ? null : c.name)} onConsult={() => consult(c)} />)}
            {!lib.length && <p className="text-sm text-muted">Nothing found. Try a symptom instead, or start a consult.</p>}
            {lq.trim().length > 2 && (
              <a href={`https://www.msdmanuals.com/home/SearchResults?query=${encodeURIComponent(lq)}`} target="_blank" rel="noreferrer" className="block rounded-xl bg-white/5 p-3 text-xs">
                🔎 Look up “{lq}” in the MSD Manual (a free medical encyclopedia written by doctors) ›
              </a>
            )}
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="card p-4 mb-4">
          {!history.length ? <p className="text-sm text-muted">No consults yet. Stay healthy!</p> : (
            <ul className="space-y-2">
              {history.map((l) => (
                <li key={l.id} className="rounded-xl bg-white/5 p-3 text-xs">
                  <div className="flex justify-between"><b>{l.data.recovered ? "💪 Felt better" : `🤒 ${String(l.data.top ?? "Symptoms")}`}</b><span className="text-muted">{new Date(l.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
                  {Array.isArray(l.data.symptoms) && <div className="text-muted">{(l.data.symptoms as string[]).join(", ")}{l.data.temp ? ` · ${l.data.temp} °C` : ""}</div>}
                  {typeof l.data.advice === "string" && <div>{l.data.advice}</div>}
                </li>
              ))}
            </ul>
          )}
          {history[0] && !history[0].data.recovered && (
            <button onClick={() => { logActivity("sick", { recovered: true, top: history[0].data.top }, new Date(), 0); celebrate({ title: "💪 RECOVERED!", subtitle: "Welcome back, hero", kind: "small" }); }} className="btn-primary w-full mt-3">I feel better now</button>
          )}
        </section>
      )}
    </>
  );
}
