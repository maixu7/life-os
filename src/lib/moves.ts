// What each exercise or practice really does to the body and mind,
// including how much harder each variant is than the standard version.

export type Variant = { name: string; factor: number; note: string };
export type Move = {
  name: string; re: RegExp; kind: "body" | "mind"; type?: "reps" | "time" | "weight";
  variants?: Variant[]; muscles?: string[]; body: string[]; mind: string[]; science: string;
  pattern?: Pattern; steps?: string[];
  pose?: PoseKey; prop?: Prop; scene?: Scene; ownSteps?: boolean; ownPose?: boolean; ownProp?: boolean;
};

import { EXTRA_MOVES, type Pattern } from "@/lib/exercises";
import type { PoseKey, Prop, Scene } from "@/components/PoseDemo";

const v = (name: string, factor: number, note: string): Variant => ({ name, factor, note });
const MOOD = ["Mood up (endorphins)", "Stress down"];

const CORE: Move[] = [
  { name: "Push-ups", re: /push.?up/i, kind: "body", type: "reps", muscles: ["Chest", "Triceps", "Shoulders", "Core"],
    variants: [v("Knee", 0.5, "easiest, great to start"), v("Incline", 0.65, "hands on a bench"), v("Standard", 1, "the classic"), v("Wide", 1, "more chest"),
      v("Diamond", 1.3, "hands together, hits triceps hard"), v("Decline", 1.2, "feet up, more upper chest and shoulders"), v("Pike", 1.3, "hips up, shoulders"),
      v("Clap", 1.5, "explosive power"), v("Archer", 1.6, "one side at a time"), v("One-arm", 2.5, "elite strength")],
    body: ["Upper-body strength", "Core stability", "Bone density"], mind: MOOD, science: "You lift about 64% of your body weight in a standard push-up." },
  { name: "Pull-ups", re: /pull.?up|chin.?up/i, kind: "body", type: "reps", muscles: ["Back (lats)", "Biceps", "Grip", "Core"],
    variants: [v("Negative", 0.5, "lower slowly, builds the first rep"), v("Band-assisted", 0.6, "band takes some weight"), v("Chin-up", 0.9, "palms facing you, more biceps"),
      v("Standard", 1, "palms away"), v("Wide", 1.15, "wider back"), v("Commando", 1.1, "side grip"), v("L-sit", 1.4, "legs straight out, core"),
      v("Weighted", 1.5, "extra load"), v("Archer", 1.8, "one side at a time"), v("One-arm", 3, "elite")],
    body: ["Back and arm strength", "Grip strength", "Better posture"], mind: [...MOOD, "Confidence"], science: "You lift 100% of your body weight each rep, one of the hardest bodyweight moves." },
  { name: "Squats", re: /squat/i, kind: "body", type: "reps", muscles: ["Quads", "Glutes", "Hamstrings", "Core"],
    variants: [v("Half", 0.7, "partial depth"), v("Bodyweight", 1, "full depth"), v("Sumo", 1, "wide stance, inner thighs"), v("Jump", 1.3, "explosive"),
      v("Bulgarian split", 1.6, "one leg on a bench"), v("Pistol", 2.5, "one leg, elite balance")],
    body: ["Leg strength", "Knee and hip health", "Burns more calories (biggest muscles)"], mind: MOOD, science: "Legs hold about half of your muscle, so squats raise your daily calorie burn the most." },
  { name: "Dips", re: /\bdips?\b/i, kind: "body", type: "reps", muscles: ["Triceps", "Chest", "Shoulders"],
    variants: [v("Bench", 0.5, "feet on floor"), v("Parallel bar", 1, "full body weight"), v("Ring", 1.4, "unstable rings")],
    body: ["Pushing strength", "Arm size"], mind: MOOD, science: "Parallel-bar dips move almost your whole body weight." },
  { name: "Plank", re: /plank/i, kind: "body", type: "time", muscles: ["Abs", "Lower back", "Shoulders"],
    variants: [v("Knee", 0.6, "easier"), v("Standard", 1, "forearms"), v("Side", 1, "obliques"), v("Weighted", 1.4, "plate on back")],
    body: ["Core strength", "Less back pain", "Posture"], mind: ["Mental toughness"], science: "Strong core muscles protect the spine during every other move." },
  { name: "Lunges", re: /lunge/i, kind: "body", type: "reps", muscles: ["Quads", "Glutes", "Balance"],
    variants: [v("Static", 0.9, "stay in place"), v("Walking", 1, "step forward"), v("Reverse", 1, "step back, easy on knees"), v("Jump", 1.4, "explosive")],
    body: ["Leg strength", "Balance"], mind: MOOD, science: "One-leg work fixes left-right strength differences." },
  { name: "Burpees", re: /burpee/i, kind: "body", type: "reps", muscles: ["Full body"], variants: [v("No push-up", 0.7, "easier"), v("Standard", 1, "with push-up"), v("Tuck jump", 1.3, "knees up")],
    body: ["Cardio fitness", "Fat burn", "Full-body endurance"], mind: [...MOOD, "Willpower"], science: "About 10 kcal a minute: one of the highest-burning bodyweight moves." },
  { name: "Sit-ups / crunches", re: /sit.?up|crunch/i, kind: "body", type: "reps", muscles: ["Abs"], variants: [v("Crunch", 0.7, "short range"), v("Sit-up", 1, "full range"), v("V-up", 1.6, "hands meet feet")],
    body: ["Ab strength"], mind: ["Discipline"], science: "Abs show when body fat is low: food matters more than crunches for a six-pack." },
  { name: "Leg raises", re: /leg raise/i, kind: "body", type: "reps", muscles: ["Lower abs", "Hip flexors"], variants: [v("Lying", 1, "on the floor"), v("Hanging knee", 1.2, "from a bar"), v("Hanging straight", 1.8, "toes to bar style")],
    body: ["Core strength"], mind: ["Discipline"], science: "Hanging versions also build grip strength." },
  { name: "Jumping jacks", re: /jumping jack/i, kind: "body", type: "reps", muscles: ["Full body"], body: ["Heart health", "Warm-up"], mind: MOOD, science: "A classic warm-up that raises heart rate fast." },
  { name: "Skipping", re: /skip|jump rope/i, kind: "body", type: "time", muscles: ["Calves", "Shoulders"], body: ["Cardio fitness", "Coordination", "Fat burn"], mind: [...MOOD, "Coordination"], science: "10 minutes of skipping burns about as much as 30 minutes of walking." },
  { name: "Running", re: /\brun|jog/i, kind: "body", type: "time", muscles: ["Legs", "Heart", "Lungs"], variants: [v("Easy jog", 0.8, "can talk"), v("Run", 1, "steady"), v("Intervals", 1.3, "fast and slow"), v("Sprint", 1.6, "all out")],
    body: ["Heart and lung fitness", "Fat burn", "Longer life"], mind: [...MOOD, "Better sleep", "Sharper focus (BDNF)"], science: "Running about 6 min/km burns roughly 1 kcal per kg of body weight per km." },
  { name: "Walking", re: /walk/i, kind: "body", type: "time", muscles: ["Legs", "Heart"], variants: [v("Slow", 0.8, "relaxed"), v("Normal", 1, "everyday"), v("Brisk", 1.25, "slightly out of breath"), v("Uphill", 1.6, "stairs or hills")],
    body: ["Heart health", "Blood sugar control", "Joints"], mind: ["Stress down", "Creative thinking up"], science: "A 10-minute walk after eating lowers blood sugar spikes." },
  { name: "Cycling", re: /cycl|bicycle/i, kind: "body", type: "time", muscles: ["Legs", "Heart"], body: ["Cardio fitness", "Knee-friendly"], mind: MOOD, science: "Low-impact cardio that is easy on the joints." },
  { name: "Swimming", re: /swim/i, kind: "body", type: "time", muscles: ["Full body"], body: ["Full-body fitness", "Lung capacity"], mind: [...MOOD, "Calm"], science: "Water carries your weight, so it trains everything with almost no joint stress." },
  { name: "Yoga / stretching", re: /yoga|stretch/i, kind: "body", type: "time", muscles: ["Full body"], body: ["Flexibility", "Less stiffness", "Balance"], mind: ["Calm", "Stress down", "Body awareness"], science: "Regular stretching improves range of motion within a few weeks." },
  { name: "Weights", re: /curl|bench|deadlift|press|row|lift/i, kind: "body", type: "weight", muscles: ["Depends on the lift"], body: ["Muscle size and strength", "Bone density", "Metabolism"], mind: [...MOOD, "Confidence"], science: "Progressive overload (a little more weight or reps over time) is what builds muscle." },
  { name: "Sports", re: /football|soccer|basketball|cricket|badminton|tennis|volleyball/i, kind: "body", type: "time", muscles: ["Full body"], body: ["Fitness", "Agility", "Reaction time"], mind: [...MOOD, "Teamwork", "Quick decisions"], science: "Games train speed, coordination and decisions together." },

  { name: "Typing practice", re: /typing|monkeytype|keybr/i, kind: "mind", muscles: ["Fingers"], body: ["Finger coordination"], mind: ["Typing speed (WPM)", "Faster coding and writing", "Less looking at the keyboard"], science: "Touch-typists average 60 to 80 WPM; most people type 35 to 40." },
  { name: "Writing practice", re: /writ|essay|journal|handwrit/i, kind: "mind", body: ["Hand control"], mind: ["Clear thinking", "Vocabulary", "Memory (handwriting helps you remember)"], science: "Writing things down by hand improves recall compared to typing." },
  { name: "Listening practice", re: /listen|podcast|audiobook/i, kind: "mind", body: [], mind: ["Comprehension", "Attention span", "Language skills"], science: "Active listening (summarising what you heard) roughly doubles what you remember." },
  { name: "Speaking practice", re: /speak|speech|talk|pronunc/i, kind: "mind", body: ["Voice control"], mind: ["Confidence", "Fluency", "Social skills"], science: "Speaking out loud is the fastest way to turn a language you understand into one you can use." },
  { name: "Coding", re: /cod(e|ing)|program/i, kind: "mind", body: [], mind: ["Logic", "Problem solving", "Patience"], science: "Building small projects teaches faster than only watching tutorials." },
  { name: "Reading", re: /read|book|study/i, kind: "mind", body: [], mind: ["Knowledge", "Vocabulary", "Focus", "Empathy"], science: "20 minutes a day is about 1.8 million words a year." },
  { name: "Meditation", re: /meditat|pray|breath/i, kind: "mind", body: ["Lower heart rate", "Lower blood pressure"], mind: ["Calm", "Attention", "Emotional control"], science: "8 weeks of daily meditation measurably improves attention." },
  { name: "Drawing", re: /draw|sketch|paint/i, kind: "mind", body: ["Hand control"], mind: ["Creativity", "Visual memory", "Patience"], science: "Drawing from life trains you to really look." },
  { name: "Music practice", re: /guitar|piano|music practice|sing|instrument/i, kind: "mind", body: ["Finger coordination"], mind: ["Memory", "Rhythm", "Focus"], science: "Playing an instrument trains both sides of the brain at once." },
  { name: "Math practice", re: /math|maths|calculus|algebra/i, kind: "mind", body: [], mind: ["Logic", "Problem solving"], science: "Doing problems yourself beats rereading solutions." },
  { name: "Chess", re: /chess/i, kind: "mind", body: [], mind: ["Planning", "Pattern recognition", "Patience"], science: "Puzzles train pattern recognition faster than full games." },
  { name: "Language learning", re: /language|english|hindi|japanese|spanish|french|duolingo|vocab/i, kind: "mind", body: [], mind: ["Memory", "Communication"], science: "Spaced repetition (reviewing just before you forget) is the most efficient way to learn words." },
];

// Movement pattern and a three-step how-to for the original exercises.
const HOW: Record<string, [Pattern, string[]]> = {
  "Push-ups": ["push", ["Hands a little wider than shoulders, body in one straight line.", "Lower your chest to a fist's height above the floor, elbows about 45°.", "Push the floor away until your arms are straight. Keep hips level."]],
  "Pull-ups": ["pull", ["Hang from the bar, hands shoulder-width, shoulders pulled down.", "Pull your chest towards the bar until your chin is over it.", "Lower all the way down slowly. No swinging."]],
  "Squats": ["squat", ["Feet shoulder-width, toes slightly out.", "Sit back and down until thighs are level with the floor, chest up.", "Push through your heels to stand. Knees follow your toes."]],
  "Dips": ["dip", ["Support yourself on parallel bars, arms straight.", "Lower until your upper arms are level with the floor.", "Press back up to straight arms."]],
  "Plank": ["plank", ["Forearms on the floor, elbows under shoulders.", "Body straight from head to heels; squeeze glutes and abs.", "Hold and breathe. Stop when your hips sag."]],
  "Lunges": ["lunge", ["Stand tall, take a big step forward.", "Lower until both knees are at about 90°.", "Push off the front foot back to standing. Switch legs."]],
  "Burpees": ["jump", ["Squat down and put your hands on the floor.", "Jump your feet back to a plank (add a push-up).", "Jump your feet in and leap up with arms overhead."]],
  "Sit-ups / crunches": ["crunch", ["Lie on your back, knees bent, feet flat.", "Curl your shoulders up off the floor using your abs.", "Lower slowly. Don't pull on your neck."]],
  "Leg raises": ["raise", ["Lie flat, hands under your hips.", "Lift straight legs up to 90°.", "Lower slowly without letting your lower back arch."]],
  "Jumping jacks": ["jump", ["Stand with feet together, arms at your sides.", "Jump feet apart while raising arms overhead.", "Jump back to the start. Keep a steady rhythm."]],
  "Skipping": ["jump", ["Hold the rope handles at hip height.", "Turn the rope with your wrists, not your arms.", "Make small jumps on the balls of your feet."]],
  "Running": ["run", ["Stand tall, lean slightly forward.", "Land under your hips with short quick steps.", "Swing your arms forward and back, relaxed shoulders."]],
  "Walking": ["run", ["Stand tall, look ahead.", "Heel lands first, roll through to your toes.", "Swing your arms naturally."]],
  "Cycling": ["run", ["Set the seat so your leg is almost straight at the bottom.", "Push smoothly through the whole circle.", "Keep a steady cadence you could hold for a while."]],
  "Swimming": ["press", ["Float flat with your face in the water.", "Reach forward and pull the water back past your hips.", "Kick from the hips and turn your head to breathe."]],
  "Yoga / stretching": ["stretch", ["Move slowly into the position.", "Stop at a gentle stretch, never pain.", "Hold 20 to 30 seconds while breathing deeply."]],
  "Weights": ["curl", ["Pick a weight you can lift 8 to 12 times with good form.", "Lift with control; exhale on the effort.", "Add a little weight or a rep each week."]],
  "Sports": ["run", ["Warm up for 5 to 10 minutes.", "Play hard, but rest when you need to.", "Stretch and drink water afterwards."]],
};
for (const m of CORE) if (HOW[m.name]) { m.pattern = HOW[m.name][0]; m.steps = HOW[m.name][1]; }

// Broad catch-alls go last so specific exercises win.
const LAST = /^(Weights|Sports|Yoga \/ stretching)$/;
export const MOVES: Move[] = [...CORE.filter((m) => !LAST.test(m.name)), ...EXTRA_MOVES, ...CORE.filter((m) => LAST.test(m.name))];

// The move whose name pattern matches the most text wins, so "nordic curl"
// finds Nordic curl rather than Bicep curl.
export const moveOf = (name: string) => {
  let best: Move | undefined, len = 0;
  for (const m of MOVES) { const hit = name.match(m.re)?.[0].length ?? 0; if (hit > len) { best = m; len = hit; } }
  return best;
};
export const variantOf = (m: Move | undefined, name?: unknown) => m?.variants?.find((x) => x.name === name);

// A move built from the hero's own settings on a custom exercise: their
// description, muscles, how-to and types, on top of any built-in match.
export function myMove(name: string, config: Record<string, unknown>): Move | undefined {
  const base = moveOf(name);
  const extra = Array.isArray(config.variants) ? (config.variants as string[]).map((n) => ({ name: n, factor: 1, note: "your own type" })) : [];
  const hidden = Array.isArray(config.hideVariants) ? (config.hideVariants as string[]) : [];
  const muscles = typeof config.muscles === "string" && config.muscles.trim() ? config.muscles.split(",").map((x) => x.trim()).filter(Boolean) : undefined;
  const steps = typeof config.steps === "string" && config.steps.trim() ? config.steps.split("\n").map((x) => x.trim()).filter(Boolean) : undefined;
  const about = typeof config.about === "string" ? config.about.trim() : "";
  const prop = typeof config.prop === "string" && config.prop ? (config.prop as Prop) : undefined;
  if (!base && !extra.length && !muscles && !steps && !about && !config.pattern && !prop) return undefined;
  const variants = [...(base?.variants ?? []).filter((v) => !hidden.includes(v.name)), ...extra];
  return {
    ...(base ?? { name, re: /$^/, kind: "body", body: ["Strength", "Fitness"], mind: ["Mood up (endorphins)", "Stress down"], science: "" }),
    name: base?.name ?? name,
    variants: variants.length ? variants : undefined,
    muscles: muscles ?? base?.muscles,
    steps: steps ?? base?.steps,
    pattern: (config.pattern as Pattern) || base?.pattern,
    ...(config.pattern ? { pose: config.pattern as Pattern, ownPose: true } : {}),
    ...(prop ? { prop, ownProp: true } : {}),
    ownSteps: !!steps,
    science: about || base?.science || "",
  };
}
