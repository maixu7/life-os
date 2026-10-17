import type { Log } from "@/lib/store";

// Real-world common sense: you can't brush while asleep, read while driving,
// or use the toilet in the middle of a run. When a new record clashes with
// something you were busy doing, the app fixes it automatically.

type Cat = "sleep" | "drive" | "sport" | "bath" | "eat" | "read" | "screen" | "code" | "toilet" | "brush" | "listen" | "drink" | "write" | "other";

const NAME_CATS: [RegExp, Cat][] = [
  [/drive|driving|ride|riding|bike|scooter|motor/i, "drive"],
  [/run|jog|exercise|gym|workout|football|cricket|basketball|swim|sport|yoga|cycling|cycle/i, "sport"],
  [/bath|shower/i, "bath"],
  [/toilet|pee|poop|washroom/i, "toilet"],
  [/brush/i, "brush"],
  [/breakfast|lunch|dinner|snack|meal|eat/i, "eat"],
  [/read|study|homework|manga/i, "read"],
  [/anime|movie|series|youtube|game|gaming|phone|scroll/i, "screen"],
  [/listen|music|podcast/i, "listen"],
  [/journal|write|writing/i, "write"],
];

export function categoryOf(kind: string, data: Record<string, unknown>): Cat {
  switch (kind) {
    case "sleep": return "sleep";
    case "workout": return "sport";
    case "meal": case "use": return "eat";
    case "water": case "milk": case "caffeine": return "drink";
    case "coding": return "code";
    case "focus": return "read";
    case "journal": case "gratitude": case "reflection": return "write";
    case "media": return data.mode === "listen" ? "listen" : data.mode === "watch" ? "screen" : "read";
    case "activity": {
      const name = String(data.name ?? "");
      // A passenger can read or eat; only the driver is busy.
      if ((data.options as string[] | undefined)?.some((o) => /passenger/i.test(o))) return "other";
      return NAME_CATS.find(([re]) => re.test(name))?.[1] ?? "other";
    }
    default: return "other";
  }
}

// What you can't do while busy with something else.
const BLOCKS: Partial<Record<Cat, { verb: string; cant: Cat[]; mins: number }>> = {
  sleep: { verb: "sleeping", cant: ["drive", "sport", "bath", "eat", "read", "screen", "code", "toilet", "brush", "listen", "drink", "write", "other"], mins: 0 },
  drive: { verb: "driving", cant: ["read", "screen", "code", "eat", "brush", "bath", "sport", "write", "toilet", "sleep"], mins: 30 },
  sport: { verb: "training", cant: ["toilet", "eat", "read", "screen", "code", "brush", "bath", "write", "sleep"], mins: 30 },
  bath: { verb: "in the bath", cant: ["eat", "read", "screen", "code", "drive", "sport", "write"], mins: 15 },
};

const WORD: Record<Cat, string> = {
  sleep: "sleep", drive: "drive", sport: "train", bath: "bathe", eat: "eat", read: "read", screen: "watch a screen", code: "code",
  toilet: "use the toilet", brush: "brush", listen: "listen", drink: "drink", write: "write", other: "do that",
};

export type Fix = { at: Date; endSleep?: Log; message: string };

// Checks a new record against everything you were busy doing at that time.
export function realityCheck(kind: string, data: Record<string, unknown>, at: Date, logs: Log[]): Fix | null {
  if (kind === "wake" || kind === "bonus" || kind === "chest" || kind === "spin" || kind === "login" || kind === "redeem" || kind === "body") return null;
  const cat = categoryOf(kind, data);
  const t = at.getTime();
  const hm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  for (const l of logs) {
    const busy = categoryOf(l.kind, l.data);
    const rule = BLOCKS[busy];
    if (!rule || !rule.cant.includes(cat)) continue;
    const start = new Date(String(l.kind === "sleep" ? l.data.start : l.created_at)).getTime();
    if (l.kind === "sleep") {
      if (!l.data.end) {
        // Still marked asleep: logging something now means you woke up.
        if (t >= start) return { at, endSleep: l, message: `You can't ${WORD[cat]} while sleeping, so Sensei marked you awake at ${hm(at)}.` };
        continue;
      }
      const end = new Date(String(l.data.end)).getTime();
      if (t > start && t < end) {
        const fixed = new Date(end + 60_000);
        return { at: fixed, message: `You were asleep from ${hm(new Date(start))} to ${hm(new Date(end))}. You can't ${WORD[cat]} while sleeping, so it was moved to ${hm(fixed)}.` };
      }
      continue;
    }
    const mins = Number(l.data.minutes) || rule.mins;
    const end = start + mins * 60_000;
    if (t > start && t < end && l.created_at !== at.toISOString()) {
      const fixed = new Date(end + 60_000);
      return { at: fixed, message: `You were ${rule.verb} (${String(l.data.name ?? l.kind)}) from ${hm(new Date(start))} to ${hm(new Date(end))}. You can't ${WORD[cat]} while ${rule.verb}, so it was moved to ${hm(fixed)}.` };
    }
  }
  // Starting to sleep, drive or train while a clashing session is still running is fine:
  // the new record simply starts after it, which the checks above already handle.
  return null;
}
