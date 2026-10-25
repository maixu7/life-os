import type { Step } from "@/lib/mission";
import type { Settings } from "@/lib/store";

// The assistant that replaces the game layer: its name and voice, when it
// speaks up about a missed task, the catch-up list on opening the app, and the
// "Fundamental" (your fixed routine) vs "App-assigned" split of the Daily mission.

export type AssistantSettings = {
  mode: "assistant" | "game"; // assistant = no XP, levels, monsters or game scenes on screen
  name: string;
  voice: string; // speechSynthesis voice name ("" = default)
  rate: number; pitch: number;
  audio: boolean; // master audio
  chime: boolean; // a short chime before it speaks
  output: "both" | "sound" | "text"; // speak and show, speak only, show only
  fullscreen: boolean; // missed-task alerts cover the screen (off = a card at the bottom)
  grace: number; // minutes late before it speaks up (5)
  snooze: number; // "Later" asks again after this many minutes (0 = not again today)
  catchup: boolean; // list of missed tasks when you open the app
  sort: "time" | "kind";
  pauseUntil: string; // ISO time: no alerts until then
  phrases: Record<string, string>; // your own words per kind of task
  focus: string; // today's focus statement, shown on the catch-up
  battery: boolean; // warn when the battery is low
};
export const DEFAULT_ASSISTANT: AssistantSettings = {
  mode: "assistant", name: "Assistant", voice: "", rate: 1, pitch: 1, audio: true, chime: true, output: "both", fullscreen: true,
  grace: 5, snooze: 15, catchup: true, sort: "time", pauseUntil: "", phrases: {}, focus: "", battery: true,
};
export const assistantOf = (s: Settings): AssistantSettings => ({ ...DEFAULT_ASSISTANT, ...(s.assistant ?? {}) });
export const isGame = (s: Settings) => assistantOf(s).mode === "game";

/** What the assistant says when a task is late. "{task}" = its name. */
export const PHRASES: Record<string, string> = {
  meal: "You haven't eaten yet. You should eat: {task}.",
  water: "You haven't had your water yet. Drink it now.",
  workout: "Your workout hasn't started yet. {task}.",
  study: "Study time started and you haven't begun. Start now.",
  code: "Coding practice is waiting: {task}.",
  read: "You haven't read yet today: {task}.",
  wake: "You were supposed to be up by now. Time to get up.",
  sleep: "It's bedtime. Put the phone away and go to sleep.",
  work: "{task}.",
  step: "You haven't done this yet: {task}.",
};
export const PHRASE_KINDS: [string, string][] = [["meal", "Meals"], ["water", "Water"], ["workout", "Exercise"], ["study", "Study"], ["code", "Coding"], ["read", "Reading"], ["wake", "Wake up"], ["sleep", "Bedtime"], ["step", "Everything else"]];
export function sayFor(s: Step, a: AssistantSettings) {
  const tpl = a.phrases[s.kind]?.trim() || PHRASES[s.kind] || PHRASES.step;
  return tpl.replace("{task}", s.label.replace(/^(Start|Finish) /, ""));
}

// Your fixed routine: getting up, bathroom, getting ready, the walk to and from work, cooking, work and bed.
const FUND = /wake|brush|bath|shower|sitz|toilet|wash|get ready|dress|walk(ing)? to|walk home|go home|return|commute|cook|work|job|sleep|bed/i;
export function isFundamental(s: Pick<Step, "id" | "label" | "kind" | "own" | "auto">) {
  if (s.own || s.id.startsWith("b-") && !["b-study", "b-exercise"].includes(s.id)) return true;
  if (s.id.startsWith("a-fit") || s.id === "a-kegel" || ["water", "study", "code", "read", "workout", "meal"].includes(s.kind)) return false;
  return FUND.test(s.label);
}

/** Minutes since the task's planned time (negative = still ahead). */
export function lateBy(s: Step, now: Date) {
  const [h, m] = s.time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
}
/** Not done yet and its time has come (tonight's bedtime isn't "late" in the morning). */
export const needsDoing = (s: Step) => (s.state === "missed" || s.state === "due") && !s.id.endsWith("-end");
