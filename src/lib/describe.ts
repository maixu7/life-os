import type { Log } from "@/lib/store";

const fmt = (iso?: unknown) =>
  typeof iso === "string" && iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "…";
export const hoursBetween = (a?: unknown, b?: unknown) =>
  typeof a === "string" && typeof b === "string" ? (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000 : 0;
const hm = (h: number) => `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}m`;
const join = (...parts: unknown[]) => parts.filter((p) => p !== undefined && p !== null && p !== "").join(" · ");

export const MEAL_NAMES = ["breakfast", "lunch", "dinner", "snack"];

// One line for any record in the day table: picture, what, details.
export function describe(l: Log, currency = "Rs"): { emoji: string; title: string; detail: string } {
  const d = l.data as Record<string, unknown>;
  const note = d.note ? `“${d.note}”` : "";
  switch (l.kind) {
    case "water":
      return { emoji: "💧", title: "Water", detail: join(`${d.ml} ml`, note) };
    case "milk":
      return { emoji: "🥛", title: "Milk", detail: join(`${d.ml} ml`, note) };
    case "wake":
      return { emoji: "🌅", title: "Woke up", detail: join(d.time ? `at ${d.time}` : "", note) };
    case "sleep": {
      if (!d.end) return { emoji: "😴", title: "Sleeping", detail: `since ${fmt(d.start)}` };
      const h = hoursBetween(d.start, d.end);
      const startH = new Date(String(d.start)).getHours();
      const nap = startH >= 8 && startH < 19;
      return {
        emoji: nap ? "💤" : "😴",
        title: nap ? "Nap" : "Sleep",
        detail: join(`${fmt(d.start)} → ${fmt(d.end)}`, hm(h), (d.tags as string[] | undefined)?.join(", "), note),
      };
    }
    case "meal":
      return {
        emoji: "🍱", title: String(d.name ?? "Meal"),
        detail: join((d.tags as string[] | undefined)?.join(", "), d.kcal ? `${d.kcal} kcal` : "", d.protein ? `${d.protein} g protein` : "", note),
      };
    case "reading":
      return { emoji: "📚", title: "Reading", detail: join(d.minutes ? `${d.minutes} min` : "", d.title, note) };
    case "listening":
      return { emoji: "🎧", title: "Listening", detail: join(d.minutes ? `${d.minutes} min` : "", d.title, note) };
    case "workout":
      return {
        emoji: "🏋️", title: String(d.exercise ?? "Workout"),
        detail: join(`${d.sets ?? 1} × ${d.reps}`, d.weight ? `${d.weight} kg` : "", note),
      };
    case "focus":
      return { emoji: "📖", title: "Focus session", detail: join(`${d.minutes} min`, d.subject, note) };
    case "shopping":
      return {
        emoji: String(d.emoji ?? "🛒"), title: `Bought ${d.item}`,
        detail: join(d.qty ? `${d.qty} ${d.unit ?? ""}`.trim() : "", d.price != null ? `${currency} ${Number(d.price).toLocaleString()}` : "", note),
      };
    case "use":
      return { emoji: String(d.emoji ?? "🍽️"), title: `Used ${d.name}`, detail: join(`${d.qty} ${d.unit ?? ""}`.trim(), note) };
    case "activity":
      return {
        emoji: String(d.emoji ?? "✨"), title: String(d.name ?? "Activity"),
        detail: join(d.minutes ? `${d.minutes} min` : "", d.kcal ? `${d.kcal} kcal` : "", note),
      };
    default:
      return { emoji: "✨", title: l.kind, detail: note };
  }
}

// Totals for the summary row above a day's table.
export function daySummary(logs: Log[], currency = "Rs") {
  const sum = (k: string, f: string) => logs.filter((l) => l.kind === k).reduce((s, l) => s + Number(l.data[f] ?? 0), 0);
  const sleepH = logs.filter((l) => l.kind === "sleep" && l.data.end).reduce((s, l) => s + hoursBetween(l.data.start, l.data.end), 0);
  const minutes = logs.reduce((s, l) => s + (["reading", "focus", "listening", "activity"].includes(l.kind) ? Number(l.data.minutes ?? 0) : 0), 0);
  const spent = sum("shopping", "price");
  const sets = logs.filter((l) => l.kind === "workout").reduce((s, l) => s + Number(l.data.sets ?? 1), 0);
  return [
    { icon: "💧", value: sum("water", "ml") ? `${sum("water", "ml")} ml` : "" },
    { icon: "🥛", value: sum("milk", "ml") ? `${sum("milk", "ml")} ml` : "" },
    { icon: "😴", value: sleepH ? hm(sleepH) : "" },
    { icon: "🏋️", value: sets ? `${sets} sets` : "" },
    { icon: "⏱️", value: minutes ? `${minutes} min active` : "" },
    { icon: "🛒", value: spent ? `${currency} ${spent.toLocaleString()}` : "" },
  ].filter((x) => x.value);
}
