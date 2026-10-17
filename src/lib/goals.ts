import { MEAL_NAMES } from "@/lib/describe";
import type { Log, Profile } from "@/lib/store";

export const sumMl = (logs: Log[], kind: string) =>
  logs.filter((l) => l.kind === kind).reduce((s, l) => s + Number(l.data.ml ?? 0), 0);

// The checklist that makes a "perfect day".
export function dailyGoals(logs: Log[], s: Profile["settings"]) {
  const has = (k: string) => logs.some((l) => l.kind === k);
  return [
    { id: "wake", label: "Log wake time", done: has("wake") || logs.some((l) => l.kind === "activity" && /wake|woke/i.test(String(l.data.name))) },
    { id: "water", label: `Drink ${s.water_goal_ml} ml water`, done: sumMl(logs, "water") >= s.water_goal_ml },
    { id: "milk", label: `Drink ${s.milk_goal_ml} ml milk`, done: sumMl(logs, "milk") >= s.milk_goal_ml },
    {
      id: "meal", label: "Log 3 meals",
      done: logs.filter((l) => l.kind === "meal" || (l.kind === "activity" && MEAL_NAMES.includes(String(l.data.name).toLowerCase()))).length >= 3,
    },
    { id: "workout", label: "Train once", done: has("workout") },
    { id: "focus", label: "One 25-min focus session", done: has("focus") },
  ];
}
