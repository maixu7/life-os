import { sumMl } from "@/lib/goals";
import { byDay } from "@/lib/missions";
import type { Data, Log } from "@/lib/store";

// Skill tree: six branches of three nodes each. A node opens when its count
// reaches the goal and the node before it is open. Some nodes give a title.

export type SkillNode = { id: string; icon: string; name: string; need: string; goal: number; title?: string };
export type Branch = { id: string; icon: string; name: string; count: (d: Data) => number; unit: string; nodes: SkillNode[] };

const STUDY_RE = /study|homework|revis|kanji|lesson|class|course|chapter|lecture/i;
const studyMin = (logs: Log[]) => logs.filter((l) => l.kind === "focus" || (l.kind === "activity" && STUDY_RE.test(String(l.data.name ?? "")))).reduce((n, l) => n + (Number(l.data.minutes) || 25), 0);
const goodSleep = (l: Log) => {
  if (l.kind !== "sleep" || !l.data.end) return false;
  const h = (new Date(String(l.data.end)).getTime() - new Date(String(l.data.start)).getTime()) / 3_600_000;
  return h >= 7 && h <= 9.5;
};

export const BRANCHES: Branch[] = [
  { id: "mind", icon: "📖", name: "Scholar", unit: "min studied", count: (d) => studyMin(d.logs), nodes: [
    { id: "mind1", icon: "✏️", name: "Student", need: "Study 5 hours", goal: 300 },
    { id: "mind2", icon: "📚", name: "Bookworm", need: "Study 25 hours", goal: 1500, title: "Bookworm" },
    { id: "mind3", icon: "🈴", name: "Kanji Master", need: "Study 100 hours", goal: 6000, title: "Kanji Master" } ] },
  { id: "body", icon: "💪", name: "Warrior", unit: "sets trained", count: (d) => d.logs.filter((l) => l.kind === "workout").reduce((n, l) => n + (Number(l.data.sets) || 1), 0), nodes: [
    { id: "body1", icon: "🥊", name: "Trainee", need: "30 sets", goal: 30 },
    { id: "body2", icon: "🦾", name: "Iron Body", need: "200 sets", goal: 200, title: "Iron Body" },
    { id: "body3", icon: "🗿", name: "Titan", need: "800 sets", goal: 800, title: "Titan" } ] },
  { id: "rest", icon: "😴", name: "Dreamer", unit: "good nights (7–9.5 h)", count: (d) => d.logs.filter(goodSleep).length, nodes: [
    { id: "rest1", icon: "🛏️", name: "Rested", need: "7 good nights", goal: 7 },
    { id: "rest2", icon: "🌙", name: "Sleep Sage", need: "30 good nights", goal: 30, title: "Sleep Sage" },
    { id: "rest3", icon: "🌌", name: "Moon Monk", need: "100 good nights", goal: 100, title: "Moon Monk" } ] },
  { id: "water", icon: "💧", name: "Water", unit: "days at water goal", count: (d) => Object.values(byDay(d.logs)).filter((ls) => sumMl(ls, "water") >= d.profile.settings.water_goal_ml).length, nodes: [
    { id: "water1", icon: "🥤", name: "Sipper", need: "7 days at goal", goal: 7 },
    { id: "water2", icon: "🌊", name: "Hydro Hero", need: "30 days at goal", goal: 30, title: "Hydro Hero" },
    { id: "water3", icon: "🐋", name: "Ocean Soul", need: "100 days at goal", goal: 100 } ] },
  { id: "spirit", icon: "🧘", name: "Spirit", unit: "calm moments", count: (d) => d.logs.filter((l) => ["breath", "meditate", "gratitude", "journal", "reflection", "resist"].includes(l.kind)).length, nodes: [
    { id: "spirit1", icon: "🌬️", name: "Breather", need: "10 calm moments", goal: 10 },
    { id: "spirit2", icon: "🪷", name: "Zen Monk", need: "50 calm moments", goal: 50, title: "Zen Monk" },
    { id: "spirit3", icon: "☯️", name: "Unshakable", need: "150 calm moments", goal: 150, title: "Unshakable" } ] },
  { id: "dawn", icon: "🌅", name: "Dawn", unit: "wake-ups before 7", count: (d) => d.logs.filter((l) => l.kind === "wake" && String(l.data.time ?? "99") < "07:00").length, nodes: [
    { id: "dawn1", icon: "🐓", name: "Early Bird", need: "5 early wake-ups", goal: 5 },
    { id: "dawn2", icon: "🌄", name: "Early Dragon", need: "30 early wake-ups", goal: 30, title: "Early Dragon" },
    { id: "dawn3", icon: "☀️", name: "Sun Chaser", need: "100 early wake-ups", goal: 100, title: "Sun Chaser" } ] },
];

export function skillTree(d: Data) {
  return BRANCHES.map((b) => {
    const n = b.count(d);
    let prevOpen = true;
    const nodes = b.nodes.map((x) => {
      const open = prevOpen && n >= x.goal;
      const next = prevOpen && !open;
      prevOpen = open;
      return { ...x, open, next, pct: Math.min(100, Math.round((n / x.goal) * 100)) };
    });
    return { ...b, n, nodes };
  });
}
export const skillPoints = (d: Data) => skillTree(d).reduce((s, b) => s + b.nodes.filter((x) => x.open).length, 0);

// Titles from the tree, in the same shape as the Hero page's title list.
export const SKILL_TITLES = BRANCHES.flatMap((b) => b.nodes.filter((x) => x.title).map((x) => ({
  title: x.title!, need: `Skill tree: ${x.need}`,
  test: (d: Data) => skillTree(d).find((y) => y.id === b.id)!.nodes.find((y) => y.id === x.id)!.open,
})));
