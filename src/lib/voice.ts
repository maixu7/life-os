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
  const t = raw.toLowerCase().replace(/[.,!]/g, "").trim();

  if (/^(study|focus|start (studying|focus))/.test(t)) return { kind: "focus-start", label: "Focus mode" };

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
