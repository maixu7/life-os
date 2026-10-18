"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp, type StudyItem } from "@/lib/store";
import { daysToExam, studyDay } from "@/lib/worst";

// Your exam study plan: what you study each day and how much. Fun is locked
// until it's done (you can turn the lock off).
export function StudyPlan() {
  const { data, profile, saveSettings } = useApp();
  const plan = profile.settings.study_plan ?? [];
  const day = useMemo(() => studyDay(data), [data]);
  const exam = daysToExam(data);
  const [edit, setEdit] = useState<StudyItem | null>(null);
  const save = (next: StudyItem[]) => saveSettings({ study_plan: next });
  const put = (x: StudyItem) => { save(plan.some((p) => p.id === x.id) ? plan.map((p) => (p.id === x.id ? x : p)) : [...plan, x]); setEdit(null); };
  const pct = day.goal ? Math.min(100, Math.round((day.mins / day.goal) * 100)) : 0;
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">🎯 Exam study plan</h2>
        <span className="text-xs text-muted">{exam != null ? `🎌 ${exam} days left` : "no exam date"}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <label className="text-muted">Exam date<input type="date" className="input mt-0.5 !py-1 text-xs" value={profile.settings.exam_date ?? ""} onChange={(e) => saveSettings({ exam_date: e.target.value || null })} /></label>
        <label className="flex items-center gap-2 mt-4"><input type="checkbox" checked={profile.settings.study_lock !== false} onChange={(e) => saveSettings({ study_lock: e.target.checked })} />🔒 Fun waits until study is done</label>
        <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={profile.settings.study_wall !== false} onChange={(e) => saveSettings({ study_wall: e.target.checked })} />🧱 Strict mode: full-screen study wall after study time, fines for fun before study</label>
      </div>
      {day.goal > 0 && (
        <div className="mt-3 text-xs">
          <div className="flex justify-between"><span>Today: <b>{day.mins}</b> / {day.goal} min</span><span className={day.done ? "text-emerald-300" : "text-amber-300"}>{day.done ? "✓ Done, fun unlocked" : `${day.left} min left`}</span></div>
          <div className="h-2 rounded-full bg-white/10 mt-1"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div>
          {day.fun > 0 && !day.done && <p className="text-rose-300 mt-1">😈 {day.fun} min of time-pass already today, before study was done.</p>}
        </div>
      )}
      <div className="mt-3 space-y-1.5">
        {day.items.map(({ item, mins, pages, done }) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-xs">
            <span className={done ? "text-emerald-300" : "text-amber-300"}>{done ? "✓" : "○"}</span>
            <button onClick={() => setEdit(item)} className="flex-1 min-w-0 text-left">
              <div className="font-semibold truncate">{item.subject}{item.what ? <span className="font-normal text-muted"> · {item.what}</span> : null}</div>
              <div className="text-muted">{mins}/{item.mins} min{item.pages ? ` · ${pages}/${item.pages} pages` : ""}</div>
            </button>
            {!done && <Link href={`/focus?start=1&subject=${encodeURIComponent(item.subject)}`} className="chip !py-0.5 text-[11px]">▶ Study</Link>}
          </div>
        ))}
        {!plan.length && <p className="text-xs text-muted">Add each subject you need to study, what part, and how many minutes a day. Focus sessions with that subject name count toward it.</p>}
      </div>
      {edit ? <ItemEditor x={edit} onSave={put} onCancel={() => setEdit(null)} onDelete={() => { save(plan.filter((p) => p.id !== edit.id)); setEdit(null); }} />
        : <button onClick={() => setEdit({ id: Math.random().toString(36).slice(2), subject: "", what: "", mins: 50 })} className="btn-ghost w-full mt-2 text-sm">＋ Add a subject</button>}
    </section>
  );
}

function ItemEditor({ x, onSave, onCancel, onDelete }: { x: StudyItem; onSave: (x: StudyItem) => void; onCancel: () => void; onDelete: () => void }) {
  const [s, setS] = useState(x);
  return (
    <div className="mt-2 rounded-xl border border-white/10 p-3 space-y-2 text-xs">
      <input className="input !py-1.5 text-sm" placeholder="Subject (Math, Physics, Japanese N3…)" value={s.subject} onChange={(e) => setS({ ...s, subject: e.target.value })} />
      <input className="input !py-1.5 text-sm" placeholder="What (chapter 4, past papers, 20 kanji…)" value={s.what} onChange={(e) => setS({ ...s, what: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-muted">Minutes a day<input className="input mt-0.5 !py-1" inputMode="numeric" value={s.mins || ""} onChange={(e) => setS({ ...s, mins: Number(e.target.value) || 0 })} /></label>
        <label className="text-muted">Pages a day (optional)<input className="input mt-0.5 !py-1" inputMode="numeric" value={s.pages ?? ""} onChange={(e) => setS({ ...s, pages: Number(e.target.value) || undefined })} /></label>
      </div>
      <div className="flex flex-wrap gap-1">{[25, 50, 75, 100, 150].map((m) => <button key={m} onClick={() => setS({ ...s, mins: m })} className={`chip !py-0 text-[11px] ${s.mins === m ? "chip-on" : ""}`}>{m} min</button>)}</div>
      <div className="flex gap-2">
        <button disabled={!s.subject.trim() || !s.mins} onClick={() => onSave({ ...s, subject: s.subject.trim(), what: s.what.trim() })} className="btn-primary flex-1 !py-1.5 text-sm disabled:opacity-40">Save</button>
        <button onClick={onCancel} className="btn-ghost !py-1.5 text-sm">Cancel</button>
        <button onClick={onDelete} className="text-rose-300 px-2">Delete</button>
      </div>
    </div>
  );
}
