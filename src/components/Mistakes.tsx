"use client";
/* eslint-disable @next/next/no-img-element -- tiny data: URL photos, nothing for next/image to optimise */

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { loadImage } from "@/lib/foodphoto";
import { addDays } from "@/lib/srs";
import { today, useApp, useCustomItems, type CustomItem } from "@/lib/store";

// Mistake notebook: snap or type a question you got wrong, the right answer
// and why. It comes back after 1, 3, 7, 14 and 30 days; get it right each
// time and it's mastered. Category "mistake" in the item store.

const GAPS = [1, 3, 7, 14, 30];
const BASIC = ["Math", "Physics", "Chemistry", "Biology", "English", "Japanese"];

// Small enough to sync (long side 720 px, ~40 KB), big enough to read a question.
async function notePhoto(file: File): Promise<string> {
  const img = await loadImage(file);
  const k = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.6);
}

export function MistakeNotebook() {
  const { profile } = useApp();
  const m = useCustomItems("mistake");
  const [edit, setEdit] = useState<CustomItem | "new" | null>(null);
  const [review, setReview] = useState(false);
  const [sub, setSub] = useState("");
  const day = today();
  const open = m.items.filter((x) => !x.config.fixed);
  const due = open.filter((x) => String(x.config.due ?? "") <= day);
  const subjects = useMemo(() => [...new Set([...(profile.settings.study_plan ?? []).map((p) => p.subject), ...m.items.map((x) => String(x.config.subject ?? "")), ...BASIC].filter(Boolean))], [profile.settings.study_plan, m.items]);
  const used = [...new Set(m.items.map((x) => String(x.config.subject ?? "")).filter(Boolean))];
  const shown = (sub ? m.items.filter((x) => x.config.subject === sub) : open).sort((a, b) => b.sort - a.sort).slice(0, sub ? 40 : 6);

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">📕 Mistake notebook</h2>
        <button onClick={() => setEdit("new")} className="chip chip-on">＋ Add</button>
      </div>
      <p className="text-xs text-muted mb-2">Got one wrong? Snap it. It comes back until you can do it in your sleep. {m.items.length ? `${open.length} open · ${m.items.length - open.length} mastered.` : ""}</p>
      {due.length > 0 && <button onClick={() => setReview(true)} className="btn-primary w-full mb-2">▶ Review {due.length} mistake{due.length === 1 ? "" : "s"}</button>}
      {used.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-2">
          <button onClick={() => setSub("")} className={`chip !py-0.5 text-xs ${!sub ? "chip-on" : ""}`}>Open</button>
          {used.map((s) => <button key={s} onClick={() => setSub(s)} className={`chip !py-0.5 text-xs ${sub === s ? "chip-on" : ""}`}>{s} {m.items.filter((x) => x.config.subject === s && !x.config.fixed).length}</button>)}
        </div>
      )}
      <ul className="space-y-1.5">
        {shown.map((x) => (
          <li key={x.id}>
            <button onClick={() => setEdit(x)} className="w-full flex items-center gap-2 rounded-lg bg-white/5 p-2 text-left">
              {x.config.photo ? <img src={String(x.config.photo)} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" /> : <span className="h-10 w-10 grid place-items-center text-xl shrink-0">📝</span>}
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate">{x.name}</span>
                <span className="block text-[11px] text-muted">{String(x.config.subject ?? "")} · {x.config.fixed ? "✓ mastered" : String(x.config.due ?? "") <= day ? "review today" : `next ${String(x.config.due).slice(5)}`}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {edit && <MistakeSheet x={edit === "new" ? null : edit} subjects={subjects} onClose={() => setEdit(null)} />}
      {review && <ReviewMistakes ids={due.map((x) => x.id)} onClose={() => setReview(false)} />}
    </section>
  );
}

function MistakeSheet({ x, subjects, onClose }: { x: CustomItem | null; subjects: string[]; onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const m = useCustomItems("mistake");
  const c = x?.config ?? {};
  const [subject, setSubject] = useState(String(c.subject ?? subjects[0] ?? ""));
  const [q, setQ] = useState(x?.name ?? "");
  const [wrong, setWrong] = useState(String(c.wrong ?? ""));
  const [right, setRight] = useState(String(c.right ?? ""));
  const [why, setWhy] = useState(String(c.why ?? ""));
  const [photo, setPhoto] = useState(c.photo ? String(c.photo) : "");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const ok = (q.trim() || photo) && subject.trim();

  const save = () => {
    if (!ok) return;
    const name = q.trim() || "Photo question";
    const config = { ...c, subject: subject.trim(), wrong: wrong.trim(), right: right.trim(), why: why.trim(), photo: photo || undefined };
    if (x) m.update(x.id, { name, config });
    else {
      m.add(name, { ...config, box: 0, due: addDays(today(), 1), added: new Date().toISOString() });
      const row = logActivity("mistake", { added: true, subject: subject.trim(), name });
      celebrate({ kind: "small", title: "📕 MISTAKE CAPTURED", subtitle: "Owning a mistake is how heroes level up. It comes back tomorrow.", xp: row.xp, icon: "📕" });
    }
    onClose();
  };

  return (
    <Sheet title={x ? "📕 Edit mistake" : "📕 New mistake"} onClose={onClose}>
      <div className="flex flex-wrap gap-1">{subjects.map((s) => <button key={s} onClick={() => setSubject(s)} className={`chip !py-0.5 text-xs ${subject === s ? "chip-on" : ""}`}>{s}</button>)}</div>
      <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <input ref={file} type="file" accept="image/*" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { setPhoto(await notePhoto(f)); } catch {} setBusy(false); e.target.value = ""; }} />
      {photo ? (
        <div className="relative"><img src={photo} alt="Question" className="w-full rounded-xl" /><button onClick={() => setPhoto("")} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70">✕</button></div>
      ) : <button onClick={() => file.current?.click()} className="btn-ghost w-full">{busy ? "…" : "📷 Snap the question"}</button>}
      <textarea className="input" rows={2} placeholder="The question (or a short name for the photo)" value={q} onChange={(e) => setQ(e.target.value)} />
      <textarea className="input" rows={2} placeholder="❌ What I answered" value={wrong} onChange={(e) => setWrong(e.target.value)} />
      <textarea className="input" rows={2} placeholder="✅ The right answer" value={right} onChange={(e) => setRight(e.target.value)} />
      <textarea className="input" rows={2} placeholder="💡 Why I got it wrong / the trick to remember" value={why} onChange={(e) => setWhy(e.target.value)} />
      <button onClick={save} disabled={!ok} className="btn-primary w-full disabled:opacity-40">{x ? "Save" : "Save mistake"}</button>
      {x && (
        <div className="flex gap-2">
          <button onClick={() => { m.update(x.id, { config: { ...x.config, fixed: !x.config.fixed, box: 0, due: today() } }); onClose(); }} className="btn-ghost flex-1 text-sm">{x.config.fixed ? "↺ Review it again" : "✓ Mark mastered"}</button>
          <button onClick={() => { m.remove(x.id); onClose(); }} className="text-rose-300 px-3 text-sm">Delete</button>
        </div>
      )}
    </Sheet>
  );
}

function ReviewMistakes({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const { logActivity, celebrate } = useApp();
  const m = useCustomItems("mistake");
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [tally, setTally] = useState({ n: 0, fixed: 0 });
  const logged = useRef(false);
  const x = m.items.find((it) => it.id === ids[i]);

  const finish = () => {
    if (logged.current || !tally.n) return;
    logged.current = true;
    const row = logActivity("mistake", { reviewed: tally.n, fixed: tally.fixed }, new Date(), 5 + tally.n * 2);
    celebrate({ kind: "mission", title: "📕 MISTAKES FACED!", subtitle: `${tally.n} reviewed${tally.fixed ? ` · ${tally.fixed} mastered for good` : ""}`, xp: row.xp, icon: "💡", quote: "An expert is someone who has made every mistake possible in a narrow field. (Niels Bohr)" });
  };
  const answer = (got: boolean) => {
    if (!x) return;
    const box = got ? (Number(x.config.box) || 0) + 1 : 0;
    const fixed = got && box >= GAPS.length;
    m.update(x.id, { config: { ...x.config, box, fixed, due: addDays(today(), got ? GAPS[Math.min(box, GAPS.length - 1)] : 1) } });
    setTally({ n: tally.n + 1, fixed: tally.fixed + (fixed ? 1 : 0) });
    setI(i + 1); setShow(false);
  };

  return (
    <Sheet title="📕 Mistake review" onClose={() => { finish(); onClose(); }}>
      {x ? (
        <>
          <div className="flex justify-between text-xs text-muted"><span>{String(x.config.subject ?? "")}</span><span>{i + 1} / {ids.length}</span></div>
          {x.config.photo ? <img src={String(x.config.photo)} alt="Question" className="w-full rounded-xl" /> : null}
          <div className="font-semibold whitespace-pre-wrap">{x.name}</div>
          {show ? (
            <div className="space-y-2 text-sm">
              {x.config.wrong ? <div className="rounded-lg bg-rose-500/10 p-2"><span className="text-rose-300">❌ You said:</span> <span className="line-through opacity-80">{String(x.config.wrong)}</span></div> : null}
              {x.config.right ? <div className="rounded-lg bg-emerald-500/10 p-2"><span className="text-emerald-300">✅ Right:</span> {String(x.config.right)}</div> : null}
              {x.config.why ? <div className="rounded-lg bg-white/5 p-2">💡 {String(x.config.why)}</div> : null}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => answer(false)} className="rounded-xl border border-rose-400/50 bg-rose-500/20 py-2 font-semibold">❌ Still tricky</button>
                <button onClick={() => answer(true)} className="rounded-xl border border-emerald-400/50 bg-emerald-500/20 py-2 font-semibold">✅ Got it now</button>
              </div>
            </div>
          ) : <button onClick={() => setShow(true)} className="btn-primary w-full">Solve it in your head, then show answer</button>}
        </>
      ) : (
        <div className="text-center py-6 space-y-2">
          <div className="text-5xl">💡</div>
          <div className="font-bold">All reviewed! {tally.n} mistakes faced.</div>
          <button onClick={() => { finish(); onClose(); }} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Sheet>
  );
}
