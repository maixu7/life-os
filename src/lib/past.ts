import type { Eaten } from "@/lib/body";
import type { Log } from "@/lib/store";

// Everything you ate or drank before, for one-tap "again" picks everywhere.

export type Had = { name: string; photo?: string; times: number; last: string; food?: Eaten; drink?: Log };

/** Every food or drink you logged before: newest first, with its last photo and numbers. */
export function pastOf(logs: Log[], c: "food" | "drink"): Had[] {
  const by = new Map<string, Had>();
  for (const l of logs) {
    if (c === "food") {
      for (const f of (l.data.foods as Eaten[] | undefined) ?? []) {
        if (!f.name || f.name === "Food") continue;
        const k = f.name.toLowerCase(), had = by.get(k);
        by.set(k, { name: f.name, photo: f.photo ?? had?.photo, times: (had?.times ?? 0) + 1, last: l.created_at, food: f });
      }
    } else if (["drink", "water", "milk"].includes(l.kind) && l.data.name) {
      const name = String(l.data.name), k = name.toLowerCase(), had = by.get(k);
      by.set(k, { name, photo: l.data.photo ? String(l.data.photo) : had?.photo, times: (had?.times ?? 0) + 1, last: l.created_at, drink: l });
    }
  }
  return [...by.values()].sort((a, b) => b.last.localeCompare(a.last));
}
