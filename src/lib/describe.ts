import { setsText } from "@/lib/have";
import { MEDIA, type MediaType } from "@/lib/media";
import { ordinal } from "@/lib/slots";
import { CHECKIN_BY_KIND } from "@/lib/tools";
import { describeCoding } from "@/lib/coding";
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
  const r = describeInner(l, currency);
  const extra = [
    l.kind === "media" && l.data.pages ? `p. ${l.data.pages_from}–${l.data.pages_to}${l.data.total_pages ? ` of ${l.data.total_pages}` : ""}` : "",
    l.kind === "media" && l.data.episode ? String(l.data.episode) : "",
    l.data.where ? `📍 ${String(l.data.where).replace(/^\S+\s/, "")}` : "",
  ].filter(Boolean).join(" · ");
  return extra ? { ...r, detail: r.detail ? `${r.detail} · ${extra}` : extra } : r;
}

function describeInner(l: Log, currency: string): { emoji: string; title: string; detail: string } {
  const d = l.data as Record<string, unknown>;
  const note = d.note ? `“${d.note}”` : "";
  switch (l.kind) {
    case "water":
      return { emoji: "💧", title: "Water", detail: join(`${d.ml} ml`, note) };
    case "counter":
      return { emoji: String(d.emoji ?? "🔢"), title: String(d.name ?? "Counter"), detail: join(`+${d.n ?? 1}${d.unit ? ` ${d.unit}` : ""}`, note) };
    case "milk":
      return { emoji: "🥛", title: "Milk", detail: join(`${d.ml} ml`, note) };
    case "drink":
      return { emoji: String(d.emoji ?? "🥤"), title: String(d.name ?? "Drink"), detail: join(`${d.ml} ml`, d.kcal ? `${d.kcal} kcal` : "", d.sugar ? `${d.sugar} g sugar` : "", d.caffeine ? `${d.caffeine} mg caffeine` : "", note) };
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
    case "media": {
      const m = MEDIA[(d.type as MediaType) ?? "book"] ?? MEDIA.book;
      const verb = d.mode === "watch" ? "Watched" : d.mode === "listen" ? "Listened" : "Read";
      return { emoji: m.emoji, title: `${verb}: ${d.title ?? m.label}`, detail: join(m.label, d.minutes ? `${d.minutes} min` : "", m.good ? "😇 good deed" : "😈 time waste", note) };
    }
    case "reading":
      return { emoji: "📚", title: "Reading", detail: join(d.minutes ? `${d.minutes} min` : "", d.title, note) };
    case "listening":
      return { emoji: "🎧", title: "Listening", detail: join(d.minutes ? `${d.minutes} min` : "", d.title, note) };
    case "workout":
      return {
        emoji: "🏋️", title: String(d.exercise ?? "Workout"),
        detail: join(setsText(Number(d.sets ?? 1), d.seconds ? `${d.seconds} s` : String(d.reps ?? "")), d.weight ? `${d.weight} kg` : "", note),
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
        detail: join(
          d.count && Number(d.count) > 1 ? `${ordinal(Number(d.count))} time` : "", (d.options as string[] | undefined)?.join(", "),
          d.amount ? `${d.amount} ${d.unit ?? ""}` : "",
          (d.foods as { name: string; qty: number }[] | undefined)?.map((x) => `${x.qty} × ${x.name}`).join(", "),
          d.minutes ? `${d.minutes} min` : "", d.kcal ? `${d.kcal} kcal` : "", note,
        ),
      };
    case "chest":
      return { emoji: d.rare ? "💎" : "🎁", title: d.rare ? "Rare chest opened" : "Daily chest opened", detail: `+${d.gold} gold` };
    case "redeem":
      return { emoji: String(d.emoji ?? "🎁"), title: `Reward: ${d.name}`, detail: `-${d.cost} gold` };
    case "battle":
      return { emoji: d.won ? "🏆" : "💀", title: `Night battle vs ${d.demon}: ${d.won ? "won" : "lost"}`, detail: `power ${d.hero} vs ${d.foe}${d.won ? ` · +${d.gold} gold` : ""}` };
    case "bonus":
      return { emoji: "🏅", title: `Mission complete: ${d.name}`, detail: `+${l.xp} XP` };
    case "body":
      return { emoji: "📏", title: "Body check", detail: join(d.weight ? `${d.weight} kg` : "", d.height ? `${d.height} cm` : "", d.waist ? `waist ${d.waist} cm` : "", note) };
    case "coding": return describeCoding(d);
    case "breath": return { emoji: "🌬️", title: "Breathing exercise", detail: join(String(d.pattern ?? ""), d.rounds ? `${d.rounds} rounds` : "") };
    case "meditate": return { emoji: "🧘", title: "Meditation", detail: `${d.minutes} min` };
    case "task": return { emoji: "✅", title: `Task done: ${d.name}`, detail: join(String(d.list ?? ""), note) };
    case "routine": return { emoji: d.list === "night" ? "🌙" : "🌅", title: `${d.list === "night" ? "Night" : "Morning"} routine: ${d.name}`, detail: "" };
    case "challenge": return { emoji: "🔥", title: "Daily challenge beaten", detail: String(d.name ?? "") };
    case "spin": return { emoji: "🎡", title: "Lucky spin", detail: `+${d.gold} gold` };
    case "login": return { emoji: "📅", title: `Login reward day ${d.n}`, detail: `+${d.gold} gold` };
    case "goalstep": return { emoji: "🏔️", title: `Goal progress: ${d.name}`, detail: `${d.progress}%` };
    case "sick": return { emoji: d.recovered ? "💪" : "🤒", title: d.recovered ? "Feeling better" : `Doctor consult: ${d.top ?? "symptoms"}`, detail: join(Array.isArray(d.symptoms) ? (d.symptoms as string[]).join(", ") : "", d.temp ? `${d.temp} °C` : "", String(d.advice ?? "")) };
    case "loot": return { emoji: String(d.icon ?? "🎁"), title: d.item ? `Loot: ${d.item}` : `Event reward: ${d.quest ?? ""}`, detail: join(d.rarity ? String(d.rarity) : "", `+${d.gold} gold`) };
    case "rival": return { emoji: "⚔️", title: "Beat rival Ryuji", detail: `+${d.gold} gold` };
    case "freeze": return { emoji: "🛡️", title: "Streak freeze used", detail: `saved ${d.for}` };
    case "detox": return { emoji: "📵", title: `Detox day: ${d.name}`, detail: "challenge won" };
    case "pages": return { emoji: "📖", title: `Read ${d.pages} pages`, detail: String(d.name ?? "") };
    default: {
      const c = CHECKIN_BY_KIND[l.kind];
      if (c) return { emoji: c.icon, title: c.name, detail: join(c.line(d), note) };
      return { emoji: "✨", title: l.kind, detail: note };
    }
  }
}

// Totals for the summary row above a day's table.
export function daySummary(logs: Log[], currency = "Rs") {
  const sum = (k: string, f: string) => logs.filter((l) => l.kind === k).reduce((s, l) => s + Number(l.data[f] ?? 0), 0);
  const sleepH = logs.filter((l) => l.kind === "sleep" && l.data.end).reduce((s, l) => s + hoursBetween(l.data.start, l.data.end), 0);
  const minutes = logs.reduce((s, l) => s + (["reading", "focus", "listening", "activity", "media"].includes(l.kind) ? Number(l.data.minutes ?? 0) : 0), 0);
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
