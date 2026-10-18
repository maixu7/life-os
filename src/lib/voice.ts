// Turns a spoken sentence into a log entry. Runs entirely on the device.
export type Parsed = { kind: string; data: Record<string, unknown>; label: string } | { kind: "focus-start"; label: string } | null;

const NUM: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
};
const num = (s?: string) => (s ? (NUM[s] ?? Number(s)) : NaN);
const N = "(\\d+(?:\\.\\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred)";
const GLASS_ML = 250;

export function parseCommand(raw: string, exercises: string[]): Parsed {
  const t = raw.toLowerCase().replace(/[,!]|\.(?!\d)/g, "").trim(); // keep "61.5"

  // "studied 40 min math", "study maths for 1 hour", "did 30 minutes of kanji"
  const st = t.match(new RegExp(`^(?:i\\s+)?(?:studied|study|did|revised|learned|learnt)\\s+(?:(.+?)\\s+(?:for\\s+)?)?${N}\\s*(min|mins|minutes|hours?|hrs?|h)\\b(?:\\s+(?:of\\s+)?(.+))?`));
  if (st && (/^(i )?(studied|study|revised|learn)/.test(t) || st[4])) {
    const n = num(st[2]);
    const minutes = /^h/.test(st[3]) ? Math.round(n * 60) : n;
    const subject = (st[4] || st[1] || "").replace(/^(of|on)\s+/, "").trim();
    return { kind: "activity", data: { name: "Study", emoji: "📖", minutes, subject: subject || undefined }, label: `${minutes} min study${subject ? ` · ${subject}` : ""}` };
  }
  if (/^(study|focus|start (studying|focus))/.test(t)) return { kind: "focus-start", label: "Focus mode" };

  // "walked 20 minutes", "ran for 30 min", "meditated 10 minutes", "coded 45 min"
  const did = t.match(new RegExp(`^(?:i\\s+)?(walked|ran|jogged|cycled|swam|stretched|meditated|prayed|coded|practiced|practised|cleaned)(?:\\s+for)?\\s+${N}\\s*(min|mins|minutes|hours?|h)\\b`));
  if (did) {
    const n = num(did[2]);
    const minutes = /^h/.test(did[3]) ? Math.round(n * 60) : n;
    if (did[1] === "meditated") return { kind: "meditate", data: { minutes }, label: `${minutes} min meditation` };
    if (did[1] === "coded") return { kind: "coding", data: { minutes }, label: `${minutes} min coding` };
    const name = ({ walked: "Walk", ran: "Run", jogged: "Run", cycled: "Cycling", swam: "Swimming", stretched: "Stretch", prayed: "Pray", practiced: "Practice", practised: "Practice", cleaned: "Clean room" } as Record<string, string>)[did[1]];
    return { kind: "activity", data: { name, minutes }, label: `${name} · ${minutes} min` };
  }

  if (/^(i'?m )?(going to (sleep|bed)|good ?night|sleeping now)/.test(t))
    return { kind: "sleep", data: { start: new Date().toISOString(), end: null, type: "night" }, label: "Sleep started" };

  const weigh = t.match(/(?:weigh|weight(?: is)?)\s+(\d+(?:\.\d+)?)\s*(?:kg|kilos?)?/);
  if (weigh) return { kind: "body", data: { weight: Number(weigh[1]) }, label: `Weight ${weigh[1]} kg` };

  const mood = t.match(/(?:feeling|feel|mood(?: is)?|i'?m)\s+(great|amazing|happy|good|fine|okay|ok|meh|tired|low|sad|bad|stressed|angry|anxious)/);
  if (mood) {
    const w = mood[1];
    const v = /great|amazing|happy/.test(w) ? "5" : /good|fine/.test(w) ? "4" : /okay|ok|meh|tired/.test(w) ? "3" : /low|stressed|anxious/.test(w) ? "2" : "1";
    const tag = ({ tired: "Tired", stressed: "Stressed", angry: "Angry", anxious: "Anxious", happy: "Happy" } as Record<string, string>)[w];
    return { kind: "mood", data: { mood: v, tags: tag ? [tag] : [] }, label: `Mood: ${w}` };
  }

  if (/^(i )?(brushed|brush) (my )?teeth/.test(t)) return { kind: "activity", data: { name: "Brush teeth" }, label: "Brush teeth" };
  if (/^(i )?(took a |had a )?(bath|shower)/.test(t)) return { kind: "activity", data: { name: "Bath" }, label: "Bath" };

  const drink = t.match(new RegExp(`(?:drank|drink|had)\\s+${N}\\s*(glass(?:es)?|cups?|ml|liters?|litres?|l)?\\s*(?:of\\s+)?(water|milk)`));
  if (drink) {
    const n = num(drink[1]);
    const unit = drink[2] ?? "glass";
    const ml = unit === "ml" ? n : unit.startsWith("l") ? n * 1000 : n * GLASS_ML;
    return { kind: drink[3], data: { ml }, label: `${ml} ml of ${drink[3]}` };
  }

  const reps = t.match(new RegExp(`(?:completed|did|done|finished)?\\s*${N}\\s+(.+)`));
  if (reps) {
    const name = reps[2].trim();
    const ex = exercises.find((e) => {
      const base = e.toLowerCase().replace(/-/g, "").replace(/s$/, "");
      return name.replace(/-/g, "").startsWith(base) || base.startsWith(name.replace(/-/g, "").replace(/s$/, ""));
    });
    if (ex) return { kind: "workout", data: { exercise: ex, reps: num(reps[1]), sets: 1 }, label: `${num(reps[1])} ${ex}` };
  }

  const mins = t.match(new RegExp(`(read|reading|listened|listening)(?:\\s+(?:to|for))?\\s+${N}\\s*(?:min|minutes)`));
  if (mins) {
    const kind = mins[1].startsWith("read") ? "reading" : "listening";
    return { kind, data: { minutes: num(mins[2]) }, label: `${num(mins[2])} min ${kind}` };
  }

  if (/^(woke up|i woke|wake up)/.test(t)) {
    const d = new Date();
    return { kind: "wake", data: { time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }, label: "Wake time" };
  }

  const meal = t.match(/^(?:ate|had|eat)\s+(.+)/);
  if (meal) return { kind: "meal", data: { name: meal[1], tags: [] }, label: `Meal: ${meal[1]}` };

  return null;
}
