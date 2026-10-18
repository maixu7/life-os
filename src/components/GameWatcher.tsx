"use client";

import { useEffect, useRef } from "react";
import { checkAchievements } from "@/lib/achievements";
import { judged, suggestHabits, tplOf } from "@/lib/habits";
import { line } from "@/lib/lore";
import { dailyMissions } from "@/lib/missions";
import { registerSettle, toDay, today, useApp } from "@/lib/store";
import { settle } from "@/lib/settle";

registerSettle(settle);

// Watches your records and fires the big moments: mission rewards and achievements.
export function GameWatcher() {
  const { data, logActivity, celebrate, update } = useApp();
  const busy = useRef(false);
  const autoAdded = useRef(new Set<string>());

  useEffect(() => {
    if (busy.current) return;
    busy.current = true;
    const day = today();
    const todays = data.logs.filter((l) => l.day === day);
    const rewarded = new Set(todays.filter((l) => l.kind === "bonus").map((l) => String(l.data.mission)));
    for (const m of dailyMissions(todays, data.profile.settings)) {
      if (!m.done || rewarded.has(m.id)) continue;
      logActivity("bonus", { mission: m.id, name: m.name, icon: m.icon }, new Date(), m.reward);
      celebrate({ kind: "mission", title: "MISSION COMPLETE", subtitle: `${m.icon} ${m.name}`, xp: m.reward, big: true, quote: line(m.topic === "water" ? "mission" : m.topic) });
    }
    // Habit quests: reward each one once a day, and let Sensei assign a new one
    // (at most one a day) while fewer than three are active.
    const habits = data.items.filter((i) => i.category === "habit");
    for (const h of habits) {
      const t = tplOf(h);
      if (!t || rewarded.has(`habit:${t.id}`)) continue;
      if (!judged(t, todays, data.profile.settings, day).done) continue;
      logActivity("bonus", { mission: `habit:${t.id}`, name: t.name, icon: t.icon }, new Date(), 20);
      celebrate({ kind: "mission", title: "HABIT QUEST DONE", subtitle: `${t.icon} ${t.name}`, xp: 20, quote: "Every action is a vote for the person you want to become." });
    }
    // Judged from the data itself, so it also works across devices.
    const addedToday = habits.some((h) => h.config.source === "auto" && h.config.started && toDay(new Date(String(h.config.started))) === day);
    if (habits.length < 3 && !addedToday && !autoAdded.current.has(day)) {
      const sg = suggestHabits(data, habits)[0];
      if (sg) {
        autoAdded.current.add(day);
        update((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), category: "habit", name: sg.tpl.name, sort: Date.now(),
          config: { tpl: sg.tpl.id, started: new Date().toISOString(), reason: sg.reason, source: "auto" } }] }));
        celebrate({ kind: "achievement", big: true, icon: sg.tpl.icon, title: "NEW HABIT QUEST", subtitle: `${sg.tpl.icon} ${sg.tpl.name}`, quote: `${sg.reason} ${sg.tpl.why}` });
      }
    }
    const fresh = checkAchievements(data);
    if (fresh.length) {
      const stamp = new Date().toISOString();
      update((d) => ({ ...d, profile: { ...d.profile, achievements: { ...d.profile.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, stamp])) } } }));
      fresh.slice(0, 3).forEach((a) => celebrate({ kind: "achievement", title: "ACHIEVEMENT UNLOCKED", subtitle: `${a.icon} ${a.name}`, quote: a.desc, big: true, icon: a.icon }));
    }
    busy.current = false;
  }, [data, logActivity, celebrate, update]);

  return null;
}
