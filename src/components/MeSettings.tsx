"use client";

import { useState } from "react";
import { AboutMe, BodyStats } from "@/components/HeroSheet";
import { BodyPhotos } from "@/components/Fitness";
import { ScheduleSheet } from "@/components/ScheduleSheet";
import { MyFoodsSheet } from "@/components/FoodPicker";
import { RemindersSheet, SavingsSheet } from "@/components/tools/Insights";
import { BudgetsSheet, PaydaySheet, SubsSheet } from "@/components/Money";
import { SearchAllSheet } from "@/components/tools/Search";
import { useApp } from "@/lib/store";

// The few tools worth keeping from the old Tools page, plus your own details
// (name, daily targets, body) from the old Hero page.
const TOOLS = [
  { id: "schedule", icon: "🗓️", name: "My schedule" }, { id: "reminders", icon: "⏰", name: "Reminders" },
  { id: "search", icon: "🔎", name: "Search records" }, { id: "foods", icon: "🍽️", name: "My foods" },
  { id: "budgets", icon: "🎯", name: "Budgets" }, { id: "subs", icon: "📺", name: "Subscriptions" },
  { id: "payday", icon: "💴", name: "Payday" }, { id: "savings", icon: "🫙", name: "Savings jars" },
] as const;
type ToolId = (typeof TOOLS)[number]["id"];

export function ToolsSection() {
  const [open, setOpen] = useState<ToolId | null>(null);
  const close = () => setOpen(null);
  return (
    <section className="card p-4 mb-3 space-y-2">
      <h2 className="font-bold">🧰 Tools</h2>
      <div className="grid grid-cols-4 gap-2">
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => setOpen(t.id)} className="rounded-2xl border border-white/10 bg-white/[.04] py-3 px-1 flex flex-col items-center gap-1 active:scale-95">
            <span className="text-2xl">{t.icon}</span>
            <span className="text-[11px] leading-tight text-center">{t.name}</span>
          </button>
        ))}
      </div>
      {open === "schedule" && <ScheduleSheet onClose={close} />}
      {open === "reminders" && <RemindersSheet onClose={close} />}
      {open === "search" && <SearchAllSheet onClose={close} />}
      {open === "foods" && <MyFoodsSheet onClose={close} />}
      {open === "budgets" && <BudgetsSheet onClose={close} />}
      {open === "subs" && <SubsSheet onClose={close} />}
      {open === "payday" && <PaydaySheet onClose={close} />}
      {open === "savings" && <SavingsSheet onClose={close} />}
    </section>
  );
}

export function MeSection() {
  const { profile, saveProfile, saveSettings } = useApp();
  const st = profile.settings;
  const num = (k: "water_goal_ml" | "milk_goal_ml" | "sleep_goal_h" | "budget_monthly") => (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= 0) saveSettings({ [k]: v });
  };
  return (
    <section className="card p-4 mb-3 space-y-3">
      <h2 className="font-bold">👤 Me</h2>
      <label className="block text-xs text-muted">Name
        <input className="input mt-1" defaultValue={profile.display_name} onBlur={(e) => e.target.value.trim() && saveProfile({ display_name: e.target.value.trim() })} />
      </label>
      <div className="text-sm font-semibold">🎯 Daily targets</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted">
        <label>Water ml<input className="input mt-1" inputMode="numeric" defaultValue={st.water_goal_ml} onBlur={num("water_goal_ml")} /></label>
        <label>Milk ml<input className="input mt-1" inputMode="numeric" defaultValue={st.milk_goal_ml} onBlur={num("milk_goal_ml")} /></label>
        <label>Sleep hours<input className="input mt-1" inputMode="decimal" defaultValue={st.sleep_goal_h} onBlur={num("sleep_goal_h")} /></label>
        <label>Monthly allowance<input className="input mt-1" inputMode="numeric" defaultValue={st.budget_monthly} onBlur={num("budget_monthly")} /></label>
        <label>Currency<input className="input mt-1" defaultValue={st.currency} onBlur={(e) => saveSettings({ currency: e.target.value.trim() || "Rs" })} /></label>
      </div>
      <BodyStats />
      <AboutMe />
      <BodyPhotos />
    </section>
  );
}
