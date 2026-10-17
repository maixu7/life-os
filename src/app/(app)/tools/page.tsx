"use client";

import { useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { ScheduleSheet } from "@/components/ScheduleSheet";
import { CheckinSheet } from "@/components/tools/Checkin";
import { DailyChallenge, LoginCalendar, Pet, QuoteOfDay, SpinSheet } from "@/components/tools/Game";
import { ExamCountdown, exportCsv, HeatmapSheet, RemindersSheet, ReportSheet, SavingsSheet, SearchSheet, SettingsSheet } from "@/components/tools/Insights";
import { LISTS, ListSheet, type ListKind } from "@/components/tools/Lists";
import { BreathingSheet, MeditationSheet, StopwatchSheet } from "@/components/tools/Mind";
import { CHECKINS, type Checkin } from "@/lib/tools";
import { useApp } from "@/lib/store";

type Open = { t: "checkin"; c: Checkin } | { t: "list"; k: ListKind } | { t: "tool"; id: string } | null;

const TOOLS = [
  { id: "schedule", name: "My schedule", icon: "🗓️" },
  { id: "breath", name: "Breathing", icon: "🌬️" }, { id: "meditate", name: "Meditation", icon: "🧘" }, { id: "stopwatch", name: "Stopwatch", icon: "⏱️" },
  { id: "spin", name: "Lucky spin", icon: "🎡" }, { id: "report", name: "Report card", icon: "📊" }, { id: "heatmap", name: "Heatmap", icon: "🔥" },
  { id: "search", name: "Search", icon: "🔎" }, { id: "savings", name: "Savings", icon: "🐷" }, { id: "reminders", name: "Reminders", icon: "⏰" },
  { id: "export", name: "Export CSV", icon: "📤" }, { id: "settings", name: "Settings", icon: "⚙️" },
];

function Tile({ icon, name, onClick }: { icon: string; name: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-white/10 bg-white/[.04] py-3 px-1 flex flex-col items-center gap-1 active:scale-95 transition hover:bg-white/10">
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] leading-tight text-center line-clamp-2">{name}</span>
    </button>
  );
}

export default function ToolsPage() {
  const { data, profile } = useApp();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const sections = [...new Set(CHECKINS.map((c) => c.section))];

  return (
    <>
      <XpHeader title="Tools & Journal" icon="🧰" subtitle="Check-ins, lists, mind tools and reports" />
      <ExamCountdown />
      <Pet />
      <DailyChallenge />
      <LoginCalendar />
      <QuoteOfDay />

      {sections.map((s) => (
        <section key={s} className="card p-4 mb-4">
          <h2 className="section-title mb-3">{{ Mind: "🧠 Mind & heart", Body: "💪 Body", Growth: "🌱 Growth", Money: "💰 Money" }[s] ?? s}</h2>
          <div className="grid grid-cols-4 gap-2">
            {CHECKINS.filter((c) => c.section === s).map((c) => <Tile key={c.kind} icon={c.icon} name={c.name} onClick={() => setOpen({ t: "checkin", c })} />)}
          </div>
        </section>
      ))}

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-3">📋 Lists & plans</h2>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(LISTS) as ListKind[]).map((k) => <Tile key={k} icon={LISTS[k].icon} name={LISTS[k].name} onClick={() => setOpen({ t: "list", k })} />)}
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="section-title mb-3">🛠 Tools & insights</h2>
        <div className="grid grid-cols-4 gap-2">
          {TOOLS.map((t) => <Tile key={t.id} icon={t.icon} name={t.name} onClick={() => (t.id === "export" ? exportCsv(data, profile.settings.currency) : setOpen({ t: "tool", id: t.id }))} />)}
        </div>
      </section>

      {open?.t === "checkin" && <CheckinSheet c={open.c} onClose={close} />}
      {open?.t === "list" && <ListSheet kind={open.k} onClose={close} />}
      {open?.t === "tool" && open.id === "breath" && <BreathingSheet onClose={close} />}
      {open?.t === "tool" && open.id === "meditate" && <MeditationSheet onClose={close} />}
      {open?.t === "tool" && open.id === "stopwatch" && <StopwatchSheet onClose={close} />}
      {open?.t === "tool" && open.id === "spin" && <SpinSheet onClose={close} />}
      {open?.t === "tool" && open.id === "report" && <ReportSheet onClose={close} />}
      {open?.t === "tool" && open.id === "heatmap" && <HeatmapSheet onClose={close} />}
      {open?.t === "tool" && open.id === "search" && <SearchSheet onClose={close} />}
      {open?.t === "tool" && open.id === "savings" && <SavingsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "reminders" && <RemindersSheet onClose={close} />}
      {open?.t === "tool" && open.id === "settings" && <SettingsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "schedule" && <ScheduleSheet onClose={close} />}
    </>
  );
}
