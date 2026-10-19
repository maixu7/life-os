"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomizeSheet } from "@/components/Customize";
import { XpHeader } from "@/components/XpHeader";
import { ScheduleSheet } from "@/components/ScheduleSheet";
import { MyFoodsSheet } from "@/components/FoodPicker";
import { CheckinSheet } from "@/components/tools/Checkin";
import { DailyChallenge, LoginCalendar, Pet, QuoteOfDay, SpinSheet } from "@/components/tools/Game";
import { ExamCountdown, exportCsv, HeatmapSheet, RemindersSheet, ReportSheet, SettingsSheet } from "@/components/tools/Insights";
import { BudgetsSheet, JarsSheet, PaydaySheet, ReceiptSheet, SubsSheet } from "@/components/Money";
import { EatOutSheet, KonbiniSheet, RecipesSheet } from "@/components/FoodPlus";
import { SearchAllSheet } from "@/components/tools/Search";
import { MoodSheet, WeeklyReviewSheet, WhyDaySheet, YearSheet } from "@/components/Review";
import { BackupCard, DisplaySheet } from "@/components/Safety";
import { Sheet } from "@/components/Sheet";
import { LISTS, ListSheet, type ListKind } from "@/components/tools/Lists";
import { BreathingSheet, MeditationSheet, StopwatchSheet } from "@/components/tools/Mind";
import { CHECKINS, type Checkin } from "@/lib/tools";
import { useApp } from "@/lib/store";
import { RecordsSheet, TrendsSheet } from "@/components/Fitness";
import { EyeRestSheet, NapSheet, StepCounterSheet, StretchSheet, WalkSheet } from "@/components/tools/BodyCare";
import { HUB, openHub } from "@/components/hub/registry";

type Open = { t: "checkin"; c: Checkin } | { t: "list"; k: ListKind } | { t: "tool"; id: string } | null;

const TOOLS = [
  { id: "schedule", name: "My schedule", icon: "🗓️" }, { id: "foods", name: "My foods", icon: "🍽️" }, { id: "doctor", name: "App doctor", icon: "🩺" }, { id: "customize", name: "Control Centre", icon: "🎛️" },
  { id: "breath", name: "Breathing", icon: "🌬️" }, { id: "meditate", name: "Meditation", icon: "🧘" }, { id: "stopwatch", name: "Stopwatch", icon: "⏱️" },
  { id: "spin", name: "Lucky spin", icon: "🎡" }, { id: "report", name: "Report card", icon: "📊" }, { id: "heatmap", name: "Heatmap", icon: "🔥" },
  { id: "search", name: "Search", icon: "🔎" }, { id: "savings", name: "Savings jars", icon: "🫙" }, { id: "reminders", name: "Reminders", icon: "⏰" },
  { id: "export", name: "Export CSV", icon: "📤" }, { id: "settings", name: "Settings", icon: "⚙️" },
  { id: "records", name: "Records", icon: "🏆" }, { id: "trends", name: "Trends", icon: "📈" }, { id: "stepcount", name: "Step counter", icon: "👣" },
  { id: "stretchrun", name: "After-study stretch", icon: "🤸" }, { id: "eyes", name: "Eye rest 20-20-20", icon: "👀" }, { id: "nap", name: "Nap timer", icon: "💤" }, { id: "walk", name: "Walk timer", icon: "🚶" },
  { id: "receipt", name: "Scan receipt", icon: "🧾" }, { id: "budgets", name: "Budgets", icon: "🎯" }, { id: "subs", name: "Subscriptions", icon: "📺" }, { id: "payday", name: "Payday", icon: "💴" },
  { id: "recipes", name: "Recipes", icon: "🧑‍🍳" }, { id: "konbini", name: "Konbini combo", icon: "🏪" }, { id: "eatout", name: "Eating out", icon: "🍜" },
  { id: "review", name: "Weekly review", icon: "📅" }, { id: "why", name: "Why was today bad?", icon: "🤔" }, { id: "moodlinks", name: "Mood & energy", icon: "😊" },
  { id: "year", name: "Year heatmap", icon: "🗓️" }, { id: "trophies", name: "Trophy room", icon: "🏆" }, { id: "safety", name: "Backup & safety", icon: "🛟" },
  { id: "display", name: "Display & reading", icon: "🖥️" },
];

type Group = "plan" | "body" | "food" | "mind" | "study" | "game" | "talk" | "settings";
type Item = { key: string; icon: string; name: string; group: Group; go: () => void };
const GROUPS: [Group, string][] = [
  ["plan", "📋 Plan, lists & routines"], ["study", "📖 Study, review & reports"], ["body", "💪 Body & fitness"], ["food", "🍱 Food & money"],
  ["mind", "🧠 Mind & calm"], ["game", "🎮 Game & rewards"], ["talk", "💬 Sensei & friends"], ["settings", "⚙️ Settings & safety"],
];
const SECTION_GROUP: Record<string, Group> = { Mind: "mind", Body: "body", Growth: "study", Money: "food" };
const HUB_GROUP: Record<string, Group> = { Do: "plan", Calm: "mind", Play: "game", Talk: "talk" };
const TOOL_GROUP: Record<string, Group> = {
  schedule: "plan", reminders: "plan", stopwatch: "plan",
  breath: "mind", meditate: "mind", moodlinks: "mind",
  spin: "game", trophies: "game",
  report: "study", heatmap: "study", review: "study", why: "study", year: "study", search: "study",
  records: "body", trends: "body", stepcount: "body", stretchrun: "body", eyes: "body", nap: "body", walk: "body", doctor: "body",
  foods: "food", savings: "food", receipt: "food", budgets: "food", subs: "food", payday: "food", recipes: "food", konbini: "food", eatout: "food",
  customize: "settings", settings: "settings", export: "settings", safety: "settings", display: "settings",
};
const STARTERS = ["t:review", "t:search", "l:todo", "h:planner", "t:reminders", "h:chat", "t:records", "t:settings"];
const USE_KEY = "lifeos-tool-uses", GROUP_KEY = "lifeos-tool-groups";

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
  const router = useRouter();
  const close = () => setOpen(null);
  const [q, setQ] = useState("");
  // Every tool, check-in, list and hub tool as one list, each in one group.
  const items: Item[] = [
    ...CHECKINS.map((c) => ({ key: `c:${c.kind}`, icon: c.icon, name: c.name, group: SECTION_GROUP[c.section] ?? "plan", go: () => setOpen({ t: "checkin", c }) })),
    ...(Object.keys(LISTS) as ListKind[]).map((k) => ({ key: `l:${k}`, icon: LISTS[k].icon, name: LISTS[k].name, group: "plan" as Group, go: () => setOpen({ t: "list", k }) })),
    ...HUB.map((h) => ({ key: `h:${h.id}`, icon: h.icon, name: h.label, group: HUB_GROUP[h.group], go: () => openHub(h.id) })),
    ...TOOLS.map((t) => ({ key: `t:${t.id}`, icon: t.icon, name: t.name, group: TOOL_GROUP[t.id] ?? "settings",
      go: () => (t.id === "export" ? exportCsv(data, profile.settings.currency) : t.id === "doctor" ? router.push("/doctor") : t.id === "trophies" ? router.push("/trophies") : setOpen({ t: "tool", id: t.id })) })),
  ];
  const [uses, setUses] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem(USE_KEY) ?? "{}"); } catch { return {}; } });
  const run = (it: Item) => {
    const next = { ...uses, [it.key]: (uses[it.key] ?? 0) + 1 };
    setUses(next);
    try { localStorage.setItem(USE_KEY, JSON.stringify(next)); } catch {}
    it.go();
  };
  const ranked = items.filter((it) => uses[it.key]).sort((a, b) => uses[b.key] - uses[a.key]);
  const top = ranked.length >= 4 ? { used: true, list: ranked.slice(0, 8) } : { used: false, list: STARTERS.map((k) => items.find((it) => it.key === k)).filter((x): x is Item => !!x) };
  const words = q.trim().toLowerCase();
  const found = words ? items.filter((it) => it.name.toLowerCase().includes(words)) : [];
  const [openGroups, setOpenGroups] = useState<Group[]>(() => { try { return JSON.parse(localStorage.getItem(GROUP_KEY) ?? "[]"); } catch { return []; } });
  const toggleGroup = (g: Group) => {
    const next = openGroups.includes(g) ? openGroups.filter((x) => x !== g) : [...openGroups, g];
    setOpenGroups(next);
    try { localStorage.setItem(GROUP_KEY, JSON.stringify(next)); } catch {}
  };
  // Links from Base Camp nudges: /tools?open=review
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("open");
    if (id && TOOLS.some((t) => t.id === id)) { setOpen({ t: "tool", id }); history.replaceState(null, "", "/tools"); }
  }, []);

  return (
    <>
      <XpHeader title="Tools & Journal" icon="🧰" subtitle="Everything in one place, sorted into groups" />
      <input className="input mb-3" placeholder={`🔎 Find a tool (${items.length})…`} value={q} onChange={(e) => setQ(e.target.value)} />

      {q.trim() ? (
        <section className="card p-4 mb-4">
          <div className="grid grid-cols-4 gap-2">{found.map((it) => <Tile key={it.key} icon={it.icon} name={it.name} onClick={() => run(it)} />)}</div>
          {!found.length && <p className="text-sm text-muted">Nothing called that. Try another word.</p>}
        </section>
      ) : (
        <>
          <section className="card p-4 mb-4">
            <h2 className="section-title mb-3">⭐ {top.used ? "Your most used" : "Start here"}</h2>
            <div className="grid grid-cols-4 gap-2">{top.list.map((it) => <Tile key={it.key} icon={it.icon} name={it.name} onClick={() => run(it)} />)}</div>
          </section>
          {GROUPS.map(([g, title]) => {
            const mine = items.filter((it) => it.group === g);
            const isOpen = openGroups.includes(g);
            return (
              <section key={g} className="card mb-3 overflow-hidden">
                <button onClick={() => toggleGroup(g)} className="w-full flex items-center gap-2 p-4 text-left">
                  <span className="section-title flex-1">{title}</span>
                  {!isOpen && <span className="text-sm tracking-tight opacity-80 truncate max-w-[45%]">{mine.slice(0, 5).map((it) => it.icon).join(" ")}</span>}
                  <span className="text-xs text-muted">{mine.length} {isOpen ? "▴" : "▾"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {g === "game" && <><Pet /><DailyChallenge /><LoginCalendar /><QuoteOfDay /></>}
                    {g === "study" && <ExamCountdown />}
                    <div className="grid grid-cols-4 gap-2">{mine.map((it) => <Tile key={it.key} icon={it.icon} name={it.name} onClick={() => run(it)} />)}</div>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {open?.t === "checkin" && <CheckinSheet c={open.c} onClose={close} />}
      {open?.t === "list" && <ListSheet kind={open.k} onClose={close} />}
      {open?.t === "tool" && open.id === "breath" && <BreathingSheet onClose={close} />}
      {open?.t === "tool" && open.id === "meditate" && <MeditationSheet onClose={close} />}
      {open?.t === "tool" && open.id === "stopwatch" && <StopwatchSheet onClose={close} />}
      {open?.t === "tool" && open.id === "spin" && <SpinSheet onClose={close} />}
      {open?.t === "tool" && open.id === "report" && <ReportSheet onClose={close} />}
      {open?.t === "tool" && open.id === "heatmap" && <HeatmapSheet onClose={close} />}
      {open?.t === "tool" && open.id === "savings" && <JarsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "receipt" && <ReceiptSheet onClose={close} />}
      {open?.t === "tool" && open.id === "budgets" && <BudgetsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "subs" && <SubsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "payday" && <PaydaySheet onClose={close} />}
      {open?.t === "tool" && open.id === "recipes" && <RecipesSheet onClose={close} />}
      {open?.t === "tool" && open.id === "konbini" && <KonbiniSheet onClose={close} />}
      {open?.t === "tool" && open.id === "eatout" && <EatOutSheet onClose={close} />}
      {open?.t === "tool" && open.id === "search" && <SearchAllSheet onClose={close} />}
      {open?.t === "tool" && open.id === "review" && <WeeklyReviewSheet onClose={close} />}
      {open?.t === "tool" && open.id === "why" && <WhyDaySheet onClose={close} />}
      {open?.t === "tool" && open.id === "moodlinks" && <MoodSheet onClose={close} />}
      {open?.t === "tool" && open.id === "year" && <YearSheet onClose={close} />}
      {open?.t === "tool" && open.id === "display" && <DisplaySheet onClose={close} />}
      {open?.t === "tool" && open.id === "safety" && <Sheet title="🛟 Backup & safety" onClose={close}><BackupCard /></Sheet>}
      {open?.t === "tool" && open.id === "reminders" && <RemindersSheet onClose={close} />}
      {open?.t === "tool" && open.id === "settings" && <SettingsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "schedule" && <ScheduleSheet onClose={close} />}
      {open?.t === "tool" && open.id === "foods" && <MyFoodsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "customize" && <CustomizeSheet onClose={close} />}
      {open?.t === "tool" && open.id === "records" && <RecordsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "trends" && <TrendsSheet onClose={close} />}
      {open?.t === "tool" && open.id === "stepcount" && <StepCounterSheet onClose={close} />}
      {open?.t === "tool" && open.id === "stretchrun" && <StretchSheet onClose={close} />}
      {open?.t === "tool" && open.id === "eyes" && <EyeRestSheet onClose={close} />}
      {open?.t === "tool" && open.id === "nap" && <NapSheet onClose={close} />}
      {open?.t === "tool" && open.id === "walk" && <WalkSheet onClose={close} />}
    </>
  );
}
