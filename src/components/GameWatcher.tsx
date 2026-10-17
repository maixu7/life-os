"use client";

import { useEffect, useRef } from "react";
import { checkAchievements } from "@/lib/achievements";
import { line } from "@/lib/lore";
import { dailyMissions } from "@/lib/missions";
import { today, useApp } from "@/lib/store";

// Watches your records and fires the big moments: mission rewards and achievements.
export function GameWatcher() {
  const { data, logActivity, celebrate, update } = useApp();
  const busy = useRef(false);

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
