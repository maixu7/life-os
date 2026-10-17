"use client";

import { WhenPicker } from "@/components/When";
import { useMemo, useState } from "react";
import { dtLocal, fmtTime, Sheet } from "@/components/Sheet";
import { WherePicker } from "@/components/Where";
import type { Checkin } from "@/lib/tools";
import { useApp } from "@/lib/store";

export function MiniChart({ values, color = "var(--accent2)" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(0, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 300},${70 - ((v - min) / Math.max(1, max - min)) * 60}`);
  return (
    <svg viewBox="0 0 300 80" className="w-full h-20">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {pts.map((p, i) => { const [x, y] = p.split(","); return <circle key={i} cx={x} cy={y} r="3" fill={color} />; })}
    </svg>
  );
}

// One form for every check-in, plus its history.
export function CheckinSheet({ c, onClose }: { c: Checkin; onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const [v, setV] = useState<Record<string, unknown>>({});
  const [when, setWhen] = useState(dtLocal(new Date()));
  const [where, setWhere] = useState("");
  const [tab, setTab] = useState<"new" | "history">("new");
  const history = useMemo(() => data.logs.filter((l) => l.kind === c.kind).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.logs, c.kind]);
  const set = (k: string, x: unknown) => setV({ ...v, [k]: x });
  const ready = c.fields.some((f) => v[f.key] != null && v[f.key] !== "" && !(Array.isArray(v[f.key]) && !(v[f.key] as unknown[]).length));

  const save = () => {
    const at = new Date(when);
    const row = logActivity(c.kind, { ...v, ...(where ? { where } : {}) }, at, c.xp);
    const k = c.karma(v, at);
    celebrate({ title: k < 0 ? "😈 NOTED, HERO" : `${c.icon} ${c.name.toUpperCase()}`, subtitle: k > 0 ? `😇 +${k} angel points` : k < 0 ? `😈 ${k} devil points. Tomorrow is a new chance.` : undefined, xp: row.xp });
    onClose();
  };

  return (
    <Sheet title={`${c.icon} ${c.name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setTab("new")} className={`chip justify-center ${tab === "new" ? "chip-on" : ""}`}>New</button>
        <button onClick={() => setTab("history")} className={`chip justify-center ${tab === "history" ? "chip-on" : ""}`}>History ({history.length})</button>
      </div>
      {tab === "new" ? (
        <>
          <p className="text-sm text-muted">{c.desc}</p>
          {c.fields.map((f) => (
            <div key={f.key}>
              <div className="text-xs text-muted mb-1">{f.label}</div>
              {f.type === "choice" && (
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => <button key={o.v} onClick={() => set(f.key, o.v)} className={`chip ${v[f.key] === o.v ? "chip-on" : ""}`}>{o.emoji} {o.label}</button>)}
                </div>
              )}
              {f.type === "multi" && (
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => {
                    const cur = (v[f.key] as string[] | undefined) ?? [];
                    const on = cur.includes(o);
                    return <button key={o} onClick={() => set(f.key, on ? cur.filter((x) => x !== o) : [...cur, o])} className={`chip ${on ? "chip-on" : ""}`}>{o}</button>;
                  })}
                </div>
              )}
              {f.type === "rating" && (
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: f.max }, (_, i) => i + 1).map((i) => (
                    <button key={i} onClick={() => set(f.key, i)} className={`h-9 min-w-9 rounded-lg text-sm ${Number(v[f.key]) >= i ? "bg-[var(--accent2)] text-[#0b0420] font-bold" : "bg-white/5"}`}>{f.max <= 5 ? f.emoji : i}</button>
                  ))}
                </div>
              )}
              {f.type === "number" && (
                <>
                  <input className="input" inputMode="decimal" value={String(v[f.key] ?? "")} placeholder={f.placeholder ?? f.unit} onChange={(e) => set(f.key, e.target.value === "" ? undefined : Number(e.target.value))} />
                  {f.quick && <div className="mt-1 flex flex-wrap gap-2">{f.quick.map((q) => <button key={q} onClick={() => set(f.key, q)} className="chip">{q.toLocaleString()}{f.unit ? ` ${f.unit}` : ""}</button>)}</div>}
                </>
              )}
              {f.type === "text" && <input className="input" value={String(v[f.key] ?? "")} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "long" && <textarea className="input min-h-32" value={String(v[f.key] ?? "")} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />}
            </div>
          ))}
          <WherePicker value={where} onChange={setWhere} />
          <WhenPicker label="When" value={when} onChange={setWhen} />
          <button onClick={save} disabled={!ready} className="btn-primary w-full">Save</button>
        </>
      ) : (
        <>
          {c.chart && <MiniChart values={[...history].reverse().slice(-30).map((l) => Number(l.data[c.chart!]) || 0)} />}
          {history.length === 0 ? <p className="text-sm text-muted text-center py-4">Nothing yet.</p> : (
            <ul className="divide-y divide-white/5">
              {history.slice(0, 60).map((l) => (
                <li key={l.id} className="py-2 text-sm">
                  <div className="text-xs text-muted">{new Date(l.created_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {fmtTime(l.created_at)}</div>
                  <div className="whitespace-pre-wrap">{c.line(l.data)}</div>
                  {typeof l.data.text === "string" && c.kind === "journal" && <div className="text-xs text-muted whitespace-pre-wrap mt-1">{l.data.text}</div>}
                  {typeof l.data.dream === "string" && l.data.dream && <div className="text-xs text-muted whitespace-pre-wrap mt-1">💭 {l.data.dream}</div>}
                  {typeof l.data.note === "string" && l.data.note && <div className="text-xs text-muted">{l.data.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Sheet>
  );
}
