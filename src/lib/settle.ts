import { passing } from "@/lib/achievements";
import { judged, tplOf } from "@/lib/habits";
import { dailyMissions } from "@/lib/missions";
import type { Data } from "@/lib/store";

// After a record is fixed or deleted: take back the mission bonuses, habit
// quest rewards and achievements it no longer earns. XP (and gold, which
// follows XP) is the sum of the remaining records.
export function settle(before: Data, after: Data, days: string[]): Data {
  const drop = new Set<string>();
  for (const day of new Set(days)) {
    const logs = after.logs.filter((l) => l.day === day);
    const missions = dailyMissions(logs.filter((l) => l.kind !== "bonus"), after.profile.settings);
    for (const b of logs.filter((l) => l.kind === "bonus")) {
      const id = String(b.data.mission ?? "");
      if (id.startsWith("habit:")) {
        const h = after.items.find((i) => i.category === "habit" && i.config.tpl === id.slice(6));
        const t = h && tplOf(h);
        if (t && !judged(t, logs, after.profile.settings, day).done) drop.add(b.id);
      } else {
        const m = missions.find((x) => x.id === id);
        if (m && !m.done) drop.add(b.id);
      }
    }
  }
  const logs = after.logs.filter((l) => !drop.has(l.id));
  let next: Data = { ...after, logs, deleted: [...after.deleted, ...drop], profile: { ...after.profile, xp: logs.reduce((n, l) => n + l.xp, 0) } };
  // Achievements that were earned before the change and are not any more.
  const was = passing(before), now = passing(next);
  const lost = Object.keys(next.profile.achievements).filter((id) => was.has(id) && !now.has(id));
  if (lost.length) {
    const stamp = new Date().toISOString();
    next = { ...next, profile: {
      ...next.profile,
      achievements: Object.fromEntries(Object.entries(next.profile.achievements).filter(([id]) => !lost.includes(id))),
      achievements_off: { ...(next.profile.achievements_off ?? {}), ...Object.fromEntries(lost.map((id) => [id, stamp])) },
      updated_at: stamp,
    } };
  }
  return next;
}
