// Focus Area: the body areas you want to improve, the equipment you own and
// your training settings (settings.fit). The plan maker is lib/focusplan.ts,
// the exercises are lib/focusmoves.ts.

export type Group = "neck" | "shoulders" | "chest" | "back" | "arms" | "forearms" | "core" | "glutes" | "legs" | "none";
export type Area = { id: string; label: string; icon: string; part: string; group: Group };

// Every part of the body, head to toe, then whole-body goals.
export const AREAS: Area[] = [
  // Head and neck
  { id: "face", label: "Face & jaw", icon: "🙂", part: "Head & neck", group: "none" },
  { id: "eyes", label: "Eyes", icon: "👀", part: "Head & neck", group: "none" },
  { id: "neck", label: "Neck", icon: "🦒", part: "Head & neck", group: "neck" },
  // Shoulders and arms
  { id: "traps", label: "Traps (top of shoulders)", icon: "🔺", part: "Shoulders & arms", group: "shoulders" },
  { id: "shoulders", label: "Shoulders (front & side)", icon: "🏔️", part: "Shoulders & arms", group: "shoulders" },
  { id: "reardelts", label: "Rear shoulders & rotator cuff", icon: "🔄", part: "Shoulders & arms", group: "shoulders" },
  { id: "biceps", label: "Biceps", icon: "💪", part: "Shoulders & arms", group: "arms" },
  { id: "triceps", label: "Triceps", icon: "🦾", part: "Shoulders & arms", group: "arms" },
  { id: "forearms", label: "Forearms", icon: "🫱", part: "Shoulders & arms", group: "forearms" },
  { id: "wrists", label: "Wrists", icon: "⌚", part: "Shoulders & arms", group: "forearms" },
  { id: "grip", label: "Grip", icon: "✊", part: "Shoulders & arms", group: "forearms" },
  { id: "hands", label: "Hands & fingers", icon: "🖐️", part: "Shoulders & arms", group: "none" },
  // Chest and back
  { id: "chest", label: "Chest", icon: "🛡️", part: "Chest & back", group: "chest" },
  { id: "upperchest", label: "Upper chest", icon: "⬆️", part: "Chest & back", group: "chest" },
  { id: "lats", label: "Upper back & lats (V-shape)", icon: "🦇", part: "Chest & back", group: "back" },
  { id: "midback", label: "Middle back", icon: "🧱", part: "Chest & back", group: "back" },
  { id: "lowerback", label: "Lower back", icon: "🔻", part: "Chest & back", group: "back" },
  { id: "spine", label: "Spine health", icon: "🦴", part: "Chest & back", group: "none" },
  // Core
  { id: "abs", label: "Abs (six-pack)", icon: "🍫", part: "Core", group: "core" },
  { id: "lowerabs", label: "Lower abs", icon: "⬇️", part: "Core", group: "core" },
  { id: "obliques", label: "Obliques / love handles", icon: "↔️", part: "Core", group: "core" },
  { id: "bellyfat", label: "Belly fat", icon: "🔥", part: "Core", group: "core" },
  { id: "deepcore", label: "Deep core (stability)", icon: "🎯", part: "Core", group: "core" },
  // Hips and pelvis
  { id: "hipflex", label: "Hip flexors", icon: "🦵", part: "Hips & pelvis", group: "legs" },
  { id: "hips", label: "Outer hips", icon: "🍐", part: "Hips & pelvis", group: "glutes" },
  { id: "glutes", label: "Glutes", icon: "🍑", part: "Hips & pelvis", group: "glutes" },
  { id: "pelvic", label: "Pelvic floor", icon: "🌸", part: "Hips & pelvis", group: "none" },
  // Legs and feet
  { id: "quads", label: "Front thighs (quads)", icon: "🦿", part: "Legs & feet", group: "legs" },
  { id: "hamstrings", label: "Back thighs (hamstrings)", icon: "🦵", part: "Legs & feet", group: "legs" },
  { id: "innerthigh", label: "Inner thighs", icon: "↘️", part: "Legs & feet", group: "legs" },
  { id: "knees", label: "Knees", icon: "🦵", part: "Legs & feet", group: "legs" },
  { id: "calves", label: "Calves", icon: "🥖", part: "Legs & feet", group: "legs" },
  { id: "shins", label: "Shins", icon: "📏", part: "Legs & feet", group: "legs" },
  { id: "ankles", label: "Ankles", icon: "🦶", part: "Legs & feet", group: "none" },
  { id: "feet", label: "Feet & toes", icon: "👣", part: "Legs & feet", group: "none" },
  // Whole body
  { id: "fullbody", label: "Full body", icon: "🧍", part: "Whole body", group: "none" },
  { id: "cardio", label: "Cardio & heart", icon: "❤️", part: "Whole body", group: "none" },
  { id: "stamina", label: "Stamina & endurance", icon: "🔋", part: "Whole body", group: "none" },
  { id: "strength", label: "Overall strength", icon: "🏋️", part: "Whole body", group: "none" },
  { id: "power", label: "Power & explosiveness", icon: "⚡", part: "Whole body", group: "none" },
  { id: "fatloss", label: "Fat loss", icon: "📉", part: "Whole body", group: "none" },
  { id: "flex", label: "Flexibility", icon: "🤸", part: "Whole body", group: "none" },
  { id: "mobility", label: "Joint mobility", icon: "🔁", part: "Whole body", group: "none" },
  { id: "posture", label: "Posture", icon: "🧍‍♂️", part: "Whole body", group: "none" },
  { id: "balance", label: "Balance", icon: "⚖️", part: "Whole body", group: "none" },
  { id: "coordination", label: "Coordination & agility", icon: "🤹", part: "Whole body", group: "none" },
  { id: "breath", label: "Breathing & lungs", icon: "🌬️", part: "Whole body", group: "none" },
  { id: "relax", label: "Stress relief & recovery", icon: "😌", part: "Whole body", group: "none" },
];
export const areaOf = (id: string) => AREAS.find((a) => a.id === id);
export const PARTS = [...new Set(AREAS.map((a) => a.part))];

export type GearDef = { id: string; label: string; icon: string; mine?: boolean };
// The equipment Manish owns comes first and is on from the start.
export const GEAR: GearDef[] = [
  { id: "bar", label: "Pull-up bar", icon: "🪜", mine: true },
  { id: "pushbars", label: "Push-up bars", icon: "🤲", mine: true },
  { id: "dip", label: "Dip station", icon: "🛗", mine: true },
  { id: "dumbbell", label: "Dumbbells", icon: "🏋️", mine: true },
  { id: "kettlebell", label: "Kettlebell", icon: "🔔", mine: true },
  { id: "abcoaster", label: "Ab coaster (kneeling knee-to-belly)", icon: "🎢", mine: true },
  { id: "abwheel", label: "Ab wheel", icon: "🛞", mine: true },
  { id: "wrist", label: "Wrist / forearm rotator", icon: "🌀", mine: true },
  { id: "legmachine", label: "Leg exercise machine", icon: "🦿", mine: true },
  { id: "vibration", label: "Vibration plate", icon: "📳", mine: true },
  { id: "bench", label: "Bench", icon: "🪑" },
  { id: "band", label: "Resistance band", icon: "➰" },
  { id: "rope", label: "Skipping rope", icon: "🪢" },
  { id: "mat", label: "Yoga mat", icon: "🧘" },
  { id: "roller", label: "Foam roller", icon: "🧻" },
];
export const DEFAULT_GEAR = GEAR.filter((g) => g.mine).map((g) => g.id);

export type Goal = "fatloss" | "muscle" | "strength" | "stamina" | "flex" | "health";
export const GOALS: [Goal, string, string][] = [
  ["fatloss", "📉 Fat loss", "More cardio and circuits, short rests"],
  ["muscle", "💪 Muscle gain", "8–12 reps, 60–90 s rest, more sets"],
  ["strength", "🏋️ Strength", "Heavier, 5–8 reps, longer rests"],
  ["stamina", "🔋 Stamina", "15–20 reps, 30–45 s rest, intervals"],
  ["flex", "🤸 Flexibility", "Extra stretching and mobility every day"],
  ["health", "❤️ General health", "A bit of everything"],
];

export type Busy = { start: string; end: string; label: string; days?: number[]; date?: string };
export type FitSettings = {
  on: boolean; // Focus Area plans the workouts on the Daily mission (off = the old two-part plan)
  areas: string[]; gear: string[]; myGear: string[]; // your own extra equipment names
  minutes: number; // about how long each day (60)
  weekendBoost: number; // % more on Saturday, Sunday and holidays (30)
  manual: number; // your own volume change, −50…+50 %
  auto: boolean; // the app changes volume from your progress
  goal: Goal; goalDate: string;
  pain: string[]; // painful areas: avoided
  dnd: Busy[]; // fixed "do not disturb" times, always respected
  steps: number; // daily step goal
  prefer: "auto" | "morning" | "evening";
  kegel: boolean; posture: boolean; breathe: boolean; mobility: boolean;
  remind: boolean; // phone reminders for workouts and water around them
};
export const DEFAULT_FIT: FitSettings = {
  on: true, areas: ["abs", "bellyfat", "chest", "lats", "biceps", "glutes", "cardio"], gear: DEFAULT_GEAR, myGear: [],
  minutes: 60, weekendBoost: 30, manual: 0, auto: true, goal: "health", goalDate: "", pain: [], dnd: [], steps: 8000,
  prefer: "auto", kegel: true, posture: true, breathe: true, mobility: true, remind: true,
};
export const fitOf = (f?: Partial<FitSettings> | null): FitSettings => ({ ...DEFAULT_FIT, ...(f ?? {}) });
