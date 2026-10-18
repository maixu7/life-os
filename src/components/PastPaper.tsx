"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { fireAlarm } from "@/lib/alarm";
import { useApp } from "@/lib/store";

// Past-paper mode: a real exam-length countdown (it survives leaving the
// page), then you type your score. Every paper is logged, so you can see
// your scores climb per subject.

const KEY = "lifeos-paper";
type Run = { end: number; start: number; mins: number; subject: string; paper: string };
const load = (): Run | null => { try { const r = JSON.parse(localStorage.getItem(KEY) ?? "null"); return r?.end ? r : null; } catch { return null; } };
const store = (r: Run | null) => { try { if (r) localStorage.setItem(KEY, JSON.stringify(r)); else localStorage.removeItem(KEY); } catch {} };
const clock = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600); return `${h ? `${h}:` : ""}${String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`; };

export function PastPapers() {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setRun(load()); }, [open]);
  // Tick only while a paper is running, so the page stays light.
  useEffect(() => { if (!run) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [run]);
  const papers = useMemo(() => data.logs.filter((l) => l.kind === "paper").sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.logs]);
  const bySubject = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const p of [...papers].reverse()) { const s = String(p.data.subject ?? "Other"); m.set(s, [...(m.get(s) ?? []), Number(p.data.pct) || 0]); }
    return [...m.entries()];
  }, [papers]);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">📝 Past papers</h2>
        <button onClick={() => setOpen(true)} className="chip chip-on">{run ? `⏳ ${clock(run.end - now)}` : "▶ Start"}</button>
      </div>
      <p className="text-xs text-muted mb-2">Sit a past paper on a real exam clock, then log your score. Exam day will feel like practice.</p>
      {bySubject.map(([s, pcts]) => {
        const last = pcts.slice(-8), best = Math.max(...pcts), avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        return (
          <div key={s} className="rounded-xl bg-white/5 p-2 mb-2">
            <div className="flex justify-between text-xs"><b>{s}</b><span className="text-muted">{pcts.length} papers · avg {avg}% · best {best}%</span></div>
            <div className="mt-1 flex items-end gap-1 h-10">
              {last.map((p, i) => <div key={i} className={`flex-1 rounded-t ${p >= 80 ? "bg-emerald-400/70" : p >= 60 ? "bg-[var(--accent2)]/70" : "bg-rose-400/60"}`} style={{ height: `${Math.max(6, p)}%` }} title={`${p}%`} />)}
            </div>
          </div>
        );
      })}
      {papers.length > 0 && (
        <ul className="text-[11px] text-muted space-y-0.5">
          {papers.slice(0, 4).map((p) => <li key={p.id}>{p.day.slice(5)} · {String(p.data.subject)}{p.data.paper ? ` (${p.data.paper})` : ""} · <b className="text-white/90">{String(p.data.score)}/{String(p.data.max)}</b> = {String(p.data.pct)}% · {String(p.data.minutes ?? "?")} min</li>)}
        </ul>
      )}
      {open && <PaperSheet onClose={() => { setOpen(false); setRun(load()); }} />}
    </section>
  );
}

function PaperSheet({ onClose }: { onClose: () => void }) {
  const { profile, data, logActivity, celebrate } = useApp();
  const [run, setRun] = useState<Run | null>(() => load());
  const [now, setNow] = useState(Date.now());
  const subjects = useMemo(() => [...new Set([...(profile.settings.study_plan ?? []).map((p) => p.subject), ...data.logs.filter((l) => l.kind === "paper").map((l) => String(l.data.subject ?? ""))].filter(Boolean))], [profile.settings.study_plan, data.logs]);
  const [subject, setSubject] = useState(run?.subject ?? subjects[0] ?? "");
  const [paper, setPaper] = useState(run?.paper ?? "");
  const [mins, setMins] = useState(run?.mins ?? 60);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState("");
  const [max, setMax] = useState("100");
  const [note, setNote] = useState("");
  const left = run ? run.end - now : mins * 60_000;
  useEffect(() => { if (!run) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [run]);
  useEffect(() => {
    if (run && left <= 0 && !scoring) { setScoring(true); fireAlarm({ title: "📝 PENS DOWN!", body: `${run.subject}: time is up. Mark it and log your score.`, icon: "⏰" }); }
  }, [run, left, scoring]);

  const start = () => { const r = { start: Date.now(), end: Date.now() + mins * 60_000, mins, subject: subject.trim(), paper: paper.trim() }; store(r); setRun(r); };
  const quit = () => { store(null); setRun(null); setScoring(false); };
  const save = () => {
    const s = Number(score), m = Number(max) || 100;
    const used = run ? Math.max(1, Math.round((Math.min(Date.now(), run.end) - run.start) / 60_000)) : mins;
    const pct = Math.round((s / m) * 100);
    const prev = data.logs.filter((l) => l.kind === "paper" && l.data.subject === (run?.subject ?? subject)).map((l) => Number(l.data.pct) || 0);
    const pb = prev.length > 0 && pct > Math.max(...prev);
    const row = logActivity("paper", { subject: run?.subject ?? subject.trim(), paper: (run?.paper ?? paper.trim()) || undefined, score: s, max: m, pct, minutes: used, limit: run?.mins ?? mins, note: note.trim() || undefined }, new Date(), pct >= 80 ? 50 : 40);
    celebrate({ kind: pb ? "achievement" : "mission", big: pb, title: pb ? "🏅 NEW PERSONAL BEST!" : "📝 PAPER CONQUERED!", subtitle: `${run?.subject ?? subject} · ${s}/${m} = ${pct}% · ${used} min`, xp: row.xp, icon: "📝", quote: pct >= 80 ? "Exam-ready. Keep the blade sharp." : "Every paper shows you exactly where to train next. Put the misses in your mistake notebook." });
    store(null);
    onClose();
  };

  return (
    <Sheet title="📝 Past paper" onClose={onClose}>
      {!run && !scoring ? (
        <>
          {subjects.length > 0 && <div className="flex flex-wrap gap-1">{subjects.map((s) => <button key={s} onClick={() => setSubject(s)} className={`chip !py-0.5 text-xs ${subject === s ? "chip-on" : ""}`}>{s}</button>)}</div>}
          <input className="input" placeholder="Subject (Math, Physics…)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <input className="input" placeholder="Which paper (2023 Paper 2, mock 3…)" value={paper} onChange={(e) => setPaper(e.target.value)} />
          <div className="text-xs text-muted">Exam time</div>
          <div className="flex flex-wrap gap-1.5">{[30, 45, 60, 90, 120, 150, 180].map((m) => <button key={m} onClick={() => setMins(m)} className={`chip !py-1 text-xs ${mins === m ? "chip-on" : ""}`}>{m < 60 ? `${m} min` : `${m / 60} h`}</button>)}</div>
          <input className="input" inputMode="numeric" value={mins || ""} onChange={(e) => setMins(Number(e.target.value) || 0)} />
          <button onClick={start} disabled={!subject.trim() || !mins} className="btn-primary w-full text-lg disabled:opacity-40">▶ Start the clock</button>
          <button onClick={() => setScoring(true)} disabled={!subject.trim()} className="btn-ghost w-full text-sm disabled:opacity-40">Already done it? Just log the score</button>
        </>
      ) : !scoring && run ? (
        <div className="text-center space-y-3">
          <div className="text-xs text-muted">{run.subject}{run.paper ? ` · ${run.paper}` : ""}</div>
          <div className={`font-game text-5xl font-black tabular-nums ${left < 5 * 60_000 ? "text-rose-300" : ""}`}>{clock(left)}</div>
          <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (1 - left / (run.mins * 60_000)) * 100)}%` }} /></div>
          <p className="text-xs text-muted">Exam rules: no notes, no phone. You can close this; the clock keeps running.</p>
          <button onClick={() => setScoring(true)} className="btn-primary w-full">✋ Finished early: mark it</button>
          <button onClick={quit} className="btn-ghost w-full text-sm">Give up this paper</button>
        </div>
      ) : (
        <>
          <div className="text-sm">Mark your paper honestly, hero. {run ? `Time used: ${Math.max(1, Math.round((Math.min(now, run.end) - run.start) / 60_000))} min.` : ""}</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">Score<input autoFocus className="input mt-1 text-lg" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} /></label>
            <label className="text-xs text-muted">Out of<input className="input mt-1 text-lg" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} /></label>
          </div>
          {score && Number(max) > 0 && <div className="text-center font-game text-2xl">{Math.round((Number(score) / Number(max)) * 100)}%</div>}
          <input className="input" placeholder="Note: weak topics, what to fix" value={note} onChange={(e) => setNote(e.target.value)} />
          <button onClick={save} disabled={score === ""} className="btn-primary w-full disabled:opacity-40">Log score</button>
          {run && <button onClick={quit} className="btn-ghost w-full text-sm">Discard</button>}
        </>
      )}
    </Sheet>
  );
}
