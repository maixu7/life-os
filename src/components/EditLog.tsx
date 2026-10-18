"use client";

import { useState } from "react";
import { WhenPicker } from "@/components/When";
import { dtLocal, fmtDuration, Sheet } from "@/components/Sheet";
import { describe, MEAL_NAMES } from "@/lib/describe";
import { MEDIA, type MediaType } from "@/lib/media";
import { useApp, type Log } from "@/lib/store";
import { allTags, parseTags } from "@/lib/review";

// Fix or delete a record. Rewards it no longer earns (mission bonus, habit
// quest, achievements, level) are taken back automatically.
export function EditLog({ log, onClose }: { log: Log; onClose: () => void }) {
  const { updateLog, deleteLog, update } = useApp();
  const d = log.data;
  const [when, setWhen] = useState(dtLocal(new Date(log.created_at)));
  const [f, setF] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(d).filter(([, v]) => typeof v === "string" || typeof v === "number").map(([k, v]) => [k, String(v)])),
  );
  const [sleepEnd, setSleepEnd] = useState(d.end ? dtLocal(new Date(String(d.end))) : "");
  const [sleepStart, setSleepStart] = useState(d.start ? dtLocal(new Date(String(d.start))) : "");
  const desc = describe(log);
  // Tags like #exam #gym, for filtering in Search.
  const [tags, setTags] = useState(() => (Array.isArray(d.hashtags) ? (d.hashtags as string[]) : []).map((t) => `#${t}`).join(" "));
  const { data } = useApp();
  const known = allTags(data.logs).map(([t]) => t).slice(0, 12);
  const tagList = parseTags(tags.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" "));
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const isMeal = log.kind === "meal" || (log.kind === "activity" && (!!d.meal || MEAL_NAMES.includes(String(d.name).toLowerCase())));
  const num = (k: string) => (f[k] === undefined || f[k] === "" ? undefined : Number(f[k]));

  const save = () => {
    const patch: Record<string, unknown> = { note: f.note || undefined, hashtags: tagList.length ? [...new Set(tagList)] : undefined };
    if (log.kind === "water" || log.kind === "milk") patch.ml = num("ml") ?? d.ml;
    if (["reading", "listening", "activity", "focus", "media", "coding"].includes(log.kind)) patch.minutes = num("minutes");
    if (d.pages != null) patch.pages = num("pages");
    if (["reading", "listening", "media"].includes(log.kind)) patch.title = f.title;
    if (log.kind === "media") Object.assign(patch, { type: f.type, emoji: MEDIA[f.type as MediaType]?.emoji, good: MEDIA[f.type as MediaType]?.good });
    if (log.kind === "workout") Object.assign(patch, { sets: num("sets"), reps: num("reps"), weight: num("weight") });
    if (log.kind === "shopping") patch.price = num("price");
    if (isMeal) Object.assign(patch, { kcal: num("kcal"), protein: num("protein"), carbs: num("carbs"), fat: num("fat") });
    if (log.kind === "sleep") {
      patch.start = sleepStart ? new Date(sleepStart).toISOString() : d.start;
      patch.end = sleepEnd ? new Date(sleepEnd).toISOString() : null;
    }
    const at = log.kind === "sleep" && sleepStart ? new Date(sleepStart) : new Date(when);
    updateLog(log.id, { data: patch, at });
    onClose();
  };

  const del = () => {
    // Using something from storage and then deleting the record puts it back.
    if (log.kind === "use" && d.pantry_id) {
      update((x) => ({ ...x, pantry: x.pantry.map((p) => (p.id === d.pantry_id ? { ...p, qty: p.qty + Number(d.qty ?? 1) } : p)) }));
    }
    deleteLog(log.id);
    onClose();
  };

  const field = (k: string, label: string, mode: "numeric" | "decimal" | "text" = "numeric") => (
    <label className="text-xs text-muted">{label}
      <input className="input mt-1" inputMode={mode === "text" ? undefined : mode} value={f[k] ?? ""} onChange={set(k)} />
    </label>
  );

  return (
    <Sheet title={`${desc.emoji} ${desc.title}`} onClose={onClose}>
      {log.kind === "sleep" ? (
        <div className="grid grid-cols-1 gap-2">
          <WhenPicker label="Fell asleep" value={sleepStart} onChange={setSleepStart} />
          <WhenPicker label="Woke up" value={sleepEnd} onChange={setSleepEnd} />
          {sleepStart && sleepEnd && <p className="text-sm text-[var(--accent2)]">Slept {fmtDuration(new Date(sleepEnd).getTime() - new Date(sleepStart).getTime())}</p>}
        </div>
      ) : (
        <WhenPicker label="Date and time" value={when} onChange={setWhen} />
      )}
      <div className="grid grid-cols-2 gap-2">
        {(log.kind === "water" || log.kind === "milk") && field("ml", "Amount (ml)")}
        {["reading", "listening", "activity", "focus", "media", "coding"].includes(log.kind) && field("minutes", "Minutes")}
        {d.pages != null && field("pages", "Pages")}
        {["reading", "listening", "media"].includes(log.kind) && field("title", "Title", "text")}
        {log.kind === "workout" && <>{field("sets", "Sets")}{field("reps", "Reps")}{field("weight", "Weight (kg)", "decimal")}</>}
        {log.kind === "shopping" && field("price", "Price", "decimal")}
        {isMeal && <>{field("kcal", "kcal")}{field("protein", "Protein g")}{field("carbs", "Carbs g")}{field("fat", "Fat g")}</>}
      </div>
      {log.kind === "media" && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEDIA) as MediaType[]).map((t) => (
            <button key={t} onClick={() => setF({ ...f, type: t })} className={`chip ${f.type === t ? "chip-on" : ""}`}>{MEDIA[t].emoji} {MEDIA[t].label} {MEDIA[t].good ? "😇" : "😈"}</button>
          ))}
        </div>
      )}
      <label className="text-xs text-muted">Note<input className="input mt-1" value={f.note ?? ""} onChange={set("note")} placeholder="Anything to remember" /></label>
      <label className="text-xs text-muted">🏷️ Tags<input className="input mt-1" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#exam #gym #friends" autoCapitalize="none" /></label>
      {known.filter((t) => !tagList.includes(t)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">{known.filter((t) => !tagList.includes(t)).map((t) => <button key={t} type="button" onClick={() => setTags(`${tags} #${t}`.trim())} className="chip !py-0.5 text-xs">+#{t}</button>)}</div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => confirm("Delete this record? Its XP, gold and any mission reward or achievement it earned are taken back.") && del()} className="btn-ghost text-rose-400">Delete</button>
        <button onClick={save} className="btn-primary flex-1">Save</button>
      </div>
    </Sheet>
  );
}
