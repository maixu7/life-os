"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { DAY_LABEL, dayType, fmt12, phaseNow, sched, type Brk, type Schedule } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WORK_TYPES: [Schedule["workType"], string][] = [["school", "🏫 School"], ["college", "🎓 College"], ["job", "💼 Job"], ["freelance", "💻 Freelance"], ["none", "🌴 No work"]];

function Time({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="text-xs text-muted block">
      {label}
      <div className="flex gap-1 mt-1">
        <input type="time" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
        {value && hint === "clear" && <button onClick={() => onChange("")} className="btn-ghost !px-2 text-xs">Off</button>}
      </div>
    </label>
  );
}
function Num({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="text-xs text-muted block">
      {label}
      <div className="flex items-center gap-1 mt-1"><input className="input" inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} /><span className="text-xs">{unit}</span></div>
    </label>
  );
}
function DayPick({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex gap-1">
      {DAYS.map((d, i) => (
        <button key={d} onClick={() => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort())} className={`chip !px-2 flex-1 justify-center text-xs ${value.includes(i) ? "chip-on" : ""}`}>{d}</button>
      ))}
    </div>
  );
}
const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white/[.04] border border-white/10 p-3 space-y-2">
    <div className="font-game text-sm text-[var(--accent2)]">{title}</div>
    {children}
  </div>
);

// Every part of the hero's timetable in one place.
export function ScheduleSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const [s, setS] = useState<Schedule>(() => sched(profile.settings.schedule));
  const [holiday, setHoliday] = useState(toDay(new Date()));
  const set = <K extends keyof Schedule>(k: K) => (v: Schedule[K]) => setS((p) => ({ ...p, [k]: v }));
  const setBrk = (i: number, patch: Partial<Brk>) => set("breaks")(s.breaks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const now = phaseNow(s);
  const save = () => { saveSettings({ schedule: s }); onClose(); };

  return (
    <Sheet title="🗓️ My schedule" onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3 text-sm">
        Right now: <b>{now.label}</b> · {DAY_LABEL[dayType(s)]}
        <div className="text-xs text-muted mt-1">The Sensei uses this to pick missions: work tasks in work hours, habits and growth in free time.</div>
      </div>

      <Group title="😴 Sleep">
        <div className="grid grid-cols-2 gap-2">
          <Time label="Wake up" value={s.wake} onChange={set("wake")} />
          <Time label="Sleep" value={s.sleep} onChange={set("sleep")} />
          <Time label="Wake (day off)" value={s.weekendWake} onChange={set("weekendWake")} />
          <Time label="Sleep (day off)" value={s.weekendSleep} onChange={set("weekendSleep")} />
          <Num label="Wind-down before bed" value={s.windDown} onChange={set("windDown")} unit="min" />
          <Num label="Phone-free after waking" value={s.phoneFreeMorning} onChange={set("phoneFreeMorning")} unit="min" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.napAllowed} onChange={(e) => set("napAllowed")(e.target.checked)} /> Day nap allowed</label>
        {s.napAllowed && <div className="grid grid-cols-2 gap-2"><Time label="Nap from" value={s.napStart} onChange={set("napStart")} /><Time label="Nap until" value={s.napEnd} onChange={set("napEnd")} /></div>}
      </Group>

      <Group title="💼 Work / school">
        <div className="flex flex-wrap gap-2">{WORK_TYPES.map(([v, l]) => <button key={v} onClick={() => set("workType")(v)} className={`chip ${s.workType === v ? "chip-on" : ""}`}>{l}</button>)}</div>
        {s.workType !== "none" && (
          <>
            <input className="input" placeholder="Place name (e.g. ABC School, Office)" value={s.workPlace} onChange={(e) => set("workPlace")(e.target.value)} />
            <div className="text-xs text-muted">Working days</div>
            <DayPick value={s.workDays} onChange={set("workDays")} />
            <div className="grid grid-cols-2 gap-2">
              <Time label="Starts" value={s.workStart} onChange={set("workStart")} />
              <Time label="Ends" value={s.workEnd} onChange={set("workEnd")} />
            </div>
            <div className="text-xs text-muted">Half days</div>
            <DayPick value={s.halfDays} onChange={set("halfDays")} />
            {s.halfDays.length > 0 && <Time label="Half day ends" value={s.halfEnd} onChange={set("halfEnd")} />}
            <Num label="Travel each way" value={s.commute} onChange={set("commute")} unit="min" />
          </>
        )}
      </Group>

      <Group title="☕ Breaks">
        {s.breaks.map((b, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <input className="input col-span-3" value={b.label} placeholder="Break name" onChange={(e) => setBrk(i, { label: e.target.value })} />
            <Time label="From" value={b.start} onChange={(v) => setBrk(i, { start: v })} />
            <Time label="Until" value={b.end} onChange={(v) => setBrk(i, { end: v })} />
            <button onClick={() => set("breaks")(s.breaks.filter((_, j) => j !== i))} className="btn-ghost !px-3">✕</button>
          </div>
        ))}
        <button onClick={() => set("breaks")([...s.breaks, { start: "11:00", end: "11:15", label: "Short break" }])} className="btn-ghost w-full text-sm">+ Add break</button>
      </Group>

      <Group title="🎉 Holidays & vacation">
        <div className="flex gap-2"><input type="date" className="input" value={holiday} onChange={(e) => setHoliday(e.target.value)} />
          <button onClick={() => holiday && !s.holidays.includes(holiday) && set("holidays")([...s.holidays, holiday].sort())} className="btn-primary !px-3 text-sm">Add</button></div>
        <div className="flex flex-wrap gap-2">
          {s.holidays.map((h) => <button key={h} onClick={() => set("holidays")(s.holidays.filter((x) => x !== h))} className="chip text-xs">{new Date(h + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short", weekday: "short" })} ✕</button>)}
          {!s.holidays.length && <span className="text-xs text-muted">No holidays added. Days off from the work days above are free days automatically.</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Vacation from<input type="date" className="input mt-1" value={s.vacationFrom} onChange={(e) => set("vacationFrom")(e.target.value)} /></label>
          <label className="text-xs text-muted">Vacation to<input type="date" className="input mt-1" value={s.vacationTo} onChange={(e) => set("vacationTo")(e.target.value)} /></label>
        </div>
      </Group>

      <Group title="🍱 Meals">
        <div className="grid grid-cols-2 gap-2">
          <Time label="Breakfast" value={s.breakfast} onChange={set("breakfast")} />
          <Time label="Lunch" value={s.lunch} onChange={set("lunch")} />
          <Time label="Tea / snack" value={s.tea} onChange={set("tea")} hint="clear" />
          <Time label="Dinner" value={s.dinner} onChange={set("dinner")} />
        </div>
      </Group>

      <Group title="🌱 Growth time">
        <div className="grid grid-cols-2 gap-2">
          <Time label="Study from" value={s.studyStart} onChange={set("studyStart")} hint="clear" />
          <Time label="Study until" value={s.studyEnd} onChange={set("studyEnd")} hint="clear" />
          <Time label="Exercise at" value={s.exercise} onChange={set("exercise")} hint="clear" />
          <Time label="Prayer / meditation" value={s.prayer} onChange={set("prayer")} hint="clear" />
          <Num label="Learn each day (all study)" value={s.learnGoal} onChange={set("learnGoal")} unit="min" />
          <Num label="Read each day" value={s.readGoal} onChange={set("readGoal")} unit="pages" />
          <Num label="Code each day" value={s.codeGoal} onChange={set("codeGoal")} unit="min" />
          <Num label="Focus session" value={s.focusLength} onChange={set("focusLength")} unit="min" />
          <Num label="Fun screen limit" value={s.screenLimit} onChange={set("screenLimit")} unit="min/day" />
        </div>
      </Group>

      <Group title="🔔 Sensei's messages">
        <div className="flex flex-wrap gap-2">
          {(["off", "low", "normal", "high"] as const).map((v) => <button key={v} onClick={() => set("popups")(v)} className={`chip capitalize ${s.popups === v ? "chip-on" : ""}`}>{v}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Num label="Water reminder every" value={s.waterEvery} onChange={set("waterEvery")} unit="min" />
          <div />
          <Time label="Quiet from" value={s.quietStart} onChange={set("quietStart")} hint="clear" />
          <Time label="Quiet until" value={s.quietEnd} onChange={set("quietEnd")} hint="clear" />
        </div>
        <div className="text-xs text-muted">Sleep {fmt12(s.sleep)} to {fmt12(s.wake)} is always night. The app asks why you&apos;re awake if you open it then.</div>
      </Group>

      <button onClick={save} className="btn-primary w-full">Save schedule</button>
    </Sheet>
  );
}
