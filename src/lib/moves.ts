// What each exercise or practice really does to the body and mind,
// including how much harder each variant is than the standard version.

export type Variant = { name: string; factor: number; note: string };
export type Move = {
  name: string; re: RegExp; kind: "body" | "mind"; type?: "reps" | "time" | "weight";
  variants?: Variant[]; muscles?: string[]; body: string[]; mind: string[]; science: string;
};

const v = (name: string, factor: number, note: string): Variant => ({ name, factor, note });
const MOOD = ["Mood up (endorphins)", "Stress down"];

export const MOVES: Move[] = [
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

export const moveOf = (name: string) => MOVES.find((m) => m.re.test(name));
export const variantOf = (m: Move | undefined, name?: unknown) => m?.variants?.find((x) => x.name === name);
