import type { Log } from "@/lib/store";

// The focus forest: every finished focus session plants a tree. Longer
// sessions grow bigger trees; the forest's name grows with all your trees.

export const treeFor = (mins: number) => (mins >= 50 ? "🌲" : mins >= 25 ? "🌳" : mins >= 15 ? "🌿" : "🌱");
// The sapling while a session runs: seed → sprout → bush → tree.
export const growing = (pct: number) => (pct >= 1 ? "🌳" : pct >= 0.75 ? "🪴" : pct >= 0.5 ? "🌿" : pct >= 0.2 ? "🌱" : "🌰");

const STAGES: [number, string, string][] = [
  [0, "Bare land", "🟫"], [1, "First sprout", "🌱"], [5, "Little grove", "🌿"], [20, "Young wood", "🌳"],
  [50, "Deep forest", "🌲"], [120, "Ancient forest", "🏞️"], [300, "Spirit forest", "⛩️"],
];
export function forestStage(trees: number) {
  const i = STAGES.findLastIndex(([min]) => trees >= min);
  const next = STAGES[i + 1];
  return { name: STAGES[i][1], icon: STAGES[i][2], next: next ? { name: next[1], need: next[0] - trees } : null };
}

export type Forest = { trees: number; minutes: number; week: { day: string; trees: string[] }[] };
export function forestOf(logs: Log[], days: string[]): Forest {
  const focus = logs.filter((l) => l.kind === "focus");
  return {
    trees: focus.length,
    minutes: focus.reduce((n, l) => n + (Number(l.data.minutes) || 25), 0),
    week: days.map((day) => ({ day, trees: focus.filter((l) => l.day === day).map((l) => treeFor(Number(l.data.minutes) || 25)) })),
  };
}
