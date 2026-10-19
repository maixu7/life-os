"use client";

import { forwardRef, useState } from "react";
import { EditLog } from "@/components/EditLog";
import { FoodThumbs } from "@/components/Meals";
import { Pic } from "@/components/Pic";
import type { Eaten } from "@/lib/body";
import { describe, hoursBetween } from "@/lib/describe";
import { logKarma } from "@/lib/karma";
import { toDay, useApp, type Log } from "@/lib/store";

const time = (iso: unknown) => new Date(String(iso)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const n = (v: unknown) => Number(v) || 0;
const STUDY = ["focus", "reading", "cards", "paper", "coding", "kanji", "mistake"];

// Calories in one record: its foods, else its own kcal for meals and drinks.
function kcalOf(l: Log) {
  const foods = l.data.foods as Eaten[] | undefined;
  if (foods?.length) return foods.reduce((s, f) => s + n(f.kcal), 0);
  return ["meal", "drink", "activity", "milk"].includes(l.kind) ? n(l.data.kcal) : 0;
}

// The main numbers of a record as small chips.
function facts(l: Log): string[] {
  const d = l.data;
  const out: (string | false)[] = [];
  const kcal = Math.round(kcalOf(l));
  if (kcal) out.push(`🔥 ${kcal} kcal`);
  const foods = d.foods as Eaten[] | undefined;
  const protein = foods?.length ? foods.reduce((s, f) => s + n(f.protein), 0) : n(d.protein);
  if (protein) out.push(`💪 ${Math.round(protein)} g protein`);
  if (d.ml) out.push(`💧 ${d.ml} ml`);
  if (d.caffeine) out.push(`☕ ${d.caffeine} mg caffeine`);
  if (l.kind === "workout") out.push(`${n(d.sets) || 1} sets`, !!d.reps && `${d.reps} reps`, !!d.seconds && `${d.seconds} s`, !!d.weight && `${d.weight} kg`);
  if (d.pages) out.push(`📖 ${d.pages} pages`);
  if (d.minutes) out.push(`⏱️ ${d.minutes} min`);
  if (l.kind === "sleep" && d.end) out.push(`😴 ${hoursBetween(d.start, d.end).toFixed(1)} h`);
  return out.filter((x): x is string => !!x);
}

// Everything recorded on one day (midnight to midnight), sorted by time,
// with the day's totals on top. Tap a row to edit or delete it.
export const DayRecords = forwardRef<HTMLElement, { day: string }>(function DayRecords({ day }, ref) {
  const { data, profile } = useApp();
  const [editing, setEditing] = useState<Log | null>(null);
  const logs = data.logs.filter((l) => l.day === day).sort((a, b) => a.created_at.localeCompare(b.created_at));
  // Last night's sleep is filed under the day it started; show it here too.
  const night = data.logs.find((l) => l.kind === "sleep" && l.day !== day && l.data.end && toDay(new Date(String(l.data.end))) === day);

  const kcal = Math.round(logs.reduce((s, l) => s + kcalOf(l), 0));
  const ml = logs.filter((l) => ["water", "milk", "drink"].includes(l.kind)).reduce((s, l) => s + n(l.data.ml), 0);
  const study = logs.filter((l) => STUDY.includes(l.kind) || (l.kind === "media" && l.data.mode === "read")).reduce((s, l) => s + n(l.data.minutes), 0);
  const sets = logs.filter((l) => l.kind === "workout").reduce((s, l) => s + (n(l.data.sets) || 1), 0);
  const good = logs.reduce((s, l) => s + Math.max(0, logKarma(l)), 0);
  const bad = logs.reduce((s, l) => s - Math.min(0, logKarma(l)), 0);
  const label = new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <section ref={ref} className="scroll-mt-4" aria-label="Day records">
      <h3 className="section-title mb-1">📜 {label}</h3>
      <p className="text-xs text-muted mb-2">Everything from 12 am to the next 12 am</p>
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className="chip">📝 {logs.length} records</span>
        <span className="chip">🔥 {kcal} kcal eaten</span>
        <span className="chip">💧 {ml} ml drunk</span>
        <span className="chip">📚 {study} min study</span>
        <span className="chip">🏋️ {sets} sets</span>
        <span className="chip" style={{ color: "#ffe066" }}>😇 +{good}</span>
        <span className="chip" style={{ color: "#ff6b9b" }}>😈 −{bad}</span>
      </div>
      {night && (
        <button onClick={() => setEditing(night)} className="card w-full mb-2 px-3 py-2 text-sm text-left flex items-center gap-3">
          <span className="text-lg">🌙</span>
          <span className="flex-1">Slept from {time(night.data.start)} until {time(night.data.end)} <span className="text-muted">({hoursBetween(night.data.start, night.data.end).toFixed(1)} h)</span></span>
          <span className="text-muted">✎</span>
        </button>
      )}
      {logs.length === 0 ? (
        <p className="card py-6 text-center text-sm text-muted">Nothing recorded on this day.</p>
      ) : (
        <ol className="card divide-y divide-white/5">
          {logs.map((l) => {
            const d = describe(l, profile.settings.currency);
            const k = logKarma(l);
            const foods = l.data.foods as Eaten[] | undefined;
            return (
              <li key={l.id}>
                <button onClick={() => setEditing(l)} className="w-full flex items-start gap-3 px-3 py-2 text-left text-sm hover:bg-white/5 active:bg-white/10">
                  <span className="w-12 pt-1 text-xs tabular-nums text-muted">{time(l.created_at)}</span>
                  {l.data.photo ? (
                    <Pic name="" src={String(l.data.photo)} emoji={d.emoji} size={48} />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 text-xl">{d.emoji}</span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{d.title}</span>
                    {d.detail && <span className="block text-xs text-muted">{d.detail}</span>}
                    {!!foods?.length && (
                      <span className="flex items-center gap-2 mt-1 text-xs">
                        <FoodThumbs foods={foods} size={28} />
                        <span className="truncate text-muted">{foods.map((f) => f.name).join(", ")}</span>
                      </span>
                    )}
                    {facts(l).length > 0 && (
                      <span className="flex flex-wrap gap-1 mt-1">{facts(l).map((f) => <span key={f} className="chip !py-0 !px-2 text-[11px]">{f}</span>)}</span>
                    )}
                  </span>
                  <span className="flex flex-col items-end gap-1 text-[11px]">
                    {l.xp > 0 && <span className="text-[var(--accent2)]">+{l.xp}</span>}
                    {k !== 0 && <span className={`font-bold ${k > 0 ? "text-[#ffe066]" : "text-[#ff6b9b]"}`}>{k > 0 ? `😇+${k}` : `😈${k}`}</span>}
                    <span className="text-muted">✎</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {editing && <EditLog log={data.logs.find((l) => l.id === editing.id) ?? editing} onClose={() => setEditing(null)} />}
    </section>
  );
});
