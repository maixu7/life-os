"use client";

import { useMemo, useState } from "react";
import { useRunAction } from "@/components/Coach";
import { Sheet, fmtTime } from "@/components/Sheet";
import { describe } from "@/lib/describe";
import { HABITS, habitStats, suggestHabits, type Suggestion } from "@/lib/habits";
import { useApp, useCustomItems, type CustomItem } from "@/lib/store";
import { HABIT_ACTION } from "@/lib/coach";
import { ChainCalendar } from "@/components/hub/Play";
import { openHub } from "@/components/hub/registry";

const STAGE_ICON: Record<string, string> = { Seed: "🌱", Growing: "🌿", Formed: "🌳", Mastered: "🏆" };

// Habit quests on Base Camp: progress today, streak, and Sensei's new suggestions.
export function HabitQuests() {
  const { data } = useApp();
  const { items: habits, add } = useCustomItems("habit");
  const [open, setOpen] = useState<CustomItem | null>(null);
  const [browse, setBrowse] = useState(false);
  const stats = useMemo(() => habits.map((h) => ({ h, s: habitStats(h, data) })).filter((x) => x.s.t), [habits, data]);
  const sugg = useMemo(() => suggestHabits(data, habits).slice(0, 2), [data, habits]);
  const accept = (sg: Suggestion, source = "suggested") =>
    add(sg.tpl.name, { tpl: sg.tpl.id, started: new Date().toISOString(), reason: sg.reason, source });

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">🌱 Habit quests</h2>
        <span className="flex gap-1.5"><button onClick={() => openHub("chain")} className="chip">🔗 Chain</button><button onClick={() => setBrowse(true)} className="chip chip-on">+ Habit</button></span>
      </div>
      <p className="text-xs text-muted mb-3">Sensei builds new habits for you and checks them automatically from what you log. 21 days forms a habit, 66 makes it automatic.</p>
      {stats.length === 0 && <p className="py-3 text-center text-sm text-muted">No habit quests yet. Accept one below.</p>}
      <div className="space-y-2">
        {stats.map(({ h, s }) => (
          <button key={h.id} onClick={() => setOpen(h)} className="w-full text-left rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-2xl">{s.t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{s.t.name}</span>
                  {s.today.done && <span className="text-[10px] font-black text-[var(--accent2)] border border-[var(--accent2)] rounded px-1">DONE</span>}
                </div>
                <div className="text-[11px] text-muted">
                  {STAGE_ICON[s.stage]} {s.stage} · {s.doneDays.length}/21 days · 🔥 {s.streak} streak
                  {s.t.limit ? ` · ${s.today.progress}/${s.today.target} min today` : s.today.target > 1 ? ` · today ${s.today.progress}/${s.today.target} ${s.today.unit}` : ""}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent2)] transition-all" style={{ width: `${s.pct21}%` }} /></div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {sugg.length > 0 && (
        <div className="mt-3 space-y-2">
          {sugg.map((sg) => (
            <div key={sg.tpl.id} className="rounded-xl border border-dashed border-[var(--gold)]/50 p-3">
              <div className="text-[10px] font-game tracking-widest gold-text">🥷 NEW QUEST OFFERED</div>
              <div className="mt-1 font-semibold">{sg.tpl.icon} {sg.tpl.name}</div>
              <p className="text-xs text-muted mt-0.5">{sg.reason}</p>
              <p className="text-xs mt-1">{sg.tpl.why}</p>
              <button onClick={() => accept(sg)} className="btn-gold w-full mt-2 !py-2">Accept quest</button>
            </div>
          ))}
        </div>
      )}
      {open && <HabitSheet h={open} onClose={() => setOpen(null)} />}
      {browse && <HabitPicker active={habits} onPick={(id) => { const t = HABITS.find((x) => x.id === id)!; accept({ tpl: t, score: 0, reason: "You chose this quest yourself." }, "user"); setBrowse(false); }} onClose={() => setBrowse(false)} />}
    </section>
  );
}

function HabitPicker({ active, onPick, onClose }: { active: CustomItem[]; onPick: (id: string) => void; onClose: () => void }) {
  const taken = new Set(active.map((h) => String(h.config.tpl)));
  return (
    <Sheet title="Choose a habit quest" onClose={onClose}>
      <div className="space-y-2">
        {HABITS.filter((t) => !taken.has(t.id)).map((t) => (
          <button key={t.id} onClick={() => onPick(t.id)} className="w-full text-left rounded-xl bg-white/5 p-3">
            <div className="font-semibold">{t.icon} {t.name}</div>
            <div className="text-xs text-muted">{t.why}</div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function HabitSheet({ h, onClose }: { h: CustomItem; onClose: () => void }) {
  const { data } = useApp();
  const { remove } = useCustomItems("habit");
  const run = useRunAction();
  const s = habitStats(h, data);
  const last = s.days.slice(-28);
  const history = [...s.days].reverse().filter((d) => d.done || d.evidence.length).slice(0, 30);
  return (
    <Sheet title={`${s.t.icon} ${s.t.name}`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{s.doneDays.length}</div><div className="text-[10px] text-muted">DAYS DONE</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">🔥 {s.streak}</div><div className="text-[10px] text-muted">STREAK</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">{Math.round(s.rate * 100)}%</div><div className="text-[10px] text-muted">SUCCESS</div></div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted"><span>{STAGE_ICON[s.stage]} {s.stage}</span><span>Formed at 21 days · Automatic at 66</span></div>
        <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent2)]" style={{ width: `${s.pct21}%` }} /></div>
        <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${s.pct66}%` }} /></div>
      </div>
      <div>
        <div className="text-xs text-muted mb-1">Last {last.length} days</div>
        <div className="flex flex-wrap gap-1">
          {last.map((d) => (
            <span key={d.day} title={d.day} className={`h-5 w-5 rounded-md ${d.done ? "bg-[var(--accent2)] shadow-[0_0_6px_var(--accent2)]" : d.pending ? "bg-[var(--gold)]/50" : "bg-white/10"}`} />
          ))}
        </div>
      </div>
      <ChainCalendar h={h} />
      <div className="rounded-xl bg-white/5 p-3 text-sm space-y-1">
        <p><b className="text-[var(--accent2)]">Why: </b>{s.t.why}</p>
        <p><b className="text-[var(--accent2)]">Tiny step: </b>{s.t.tiny}</p>
        {h.config.reason ? <p className="text-xs text-muted">Sensei picked this: {String(h.config.reason)}</p> : null}
        <p className="text-xs text-muted">Started {new Date(String(h.config.started)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}. Checked automatically from your records.</p>
      </div>
      {!s.today.done && HABIT_ACTION[s.t.id] && (
        <button onClick={() => { run(HABIT_ACTION[s.t.id]); onClose(); }} className="btn-primary w-full">Do it now</button>
      )}
      <div>
        <div className="text-xs text-muted mb-1">What you did and when</div>
        {history.length === 0 ? <p className="text-sm text-muted">Nothing yet. Today is day one.</p> : (
          <ul className="space-y-1.5">
            {history.map((d) => (
              <li key={d.day} className="text-xs">
                <div className="font-semibold">{d.done ? "✅" : "⬜"} {new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  {d.target > 1 || s.t.limit ? <span className="text-muted font-normal"> · {d.progress}/{d.target} {d.unit}</span> : null}</div>
                {d.evidence.slice(0, 4).map((l) => <div key={l.id} className="ml-6 text-muted">{fmtTime(l.created_at)} · {describe(l).title}</div>)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={() => { remove(h.id); onClose(); }} className="btn-ghost w-full text-rose-400 text-sm">Drop this quest</button>
    </Sheet>
  );
}
