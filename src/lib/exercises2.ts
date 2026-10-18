import type { Move } from "@/lib/moves";
import type { Pattern } from "@/lib/exercises";
import type { PoseKey, Prop } from "@/lib/poses";
import { EX_A } from "@/lib/exercises2a";
import { EX_B } from "@/lib/exercises2b";
import { EX_C } from "@/lib/exercises2c";

// 300+ more exercises. Each line: name | picture | holding | counted by |
// muscles | step 1 / step 2 / step 3 | what it does for you.
// holding: - nothing, db dumbbell, bb barbell, kb kettlebell.
// counted by: r reps, t time, w weight.

const PROP: Record<string, Prop> = { "-": "none", db: "dumbbell", bb: "barbell", kb: "kettlebell" };
const TYPE: Record<string, "reps" | "time" | "weight"> = { r: "reps", t: "time", w: "weight" };
// Which family (for the library filter) each picture belongs to.
const FAMILY: Partial<Record<PoseKey, Pattern>> = {
  benchpress: "push", inclinepush: "push", declinepush: "push", kneepush: "push", plyopush: "push", archer: "push", fly: "press", pullover: "press",
  ohpress: "press", pikepush: "press", handstand: "press", hspu: "press", lateral: "raise", frontraise: "raise", armraise: "raise", uprow: "curl", shrug: "curl",
  chinup: "pull", widepull: "pull", hang: "pull", hangraise: "raise", toesbar: "raise", lever: "pull", muscleup: "pull", pulldown: "pull", invrow: "row",
  seatrow: "row", revfly: "row", facepull: "row", rowmachine: "row", goblet: "squat", frontsquat: "squat", jumpsquat: "jump", pistol: "squat", sumo: "squat",
  sissy: "squat", squathold: "squat", pistolbox: "squat", legpress: "squat", wallsit: "squat", legext: "squat", deadlift: "hinge", swing: "hinge", kbswing2: "hinge",
  clean: "hinge", snatch: "hinge", nordic: "hinge", legcurl: "hinge", hipext: "hinge", toetouch: "stretch", stepup: "lunge", boxstep: "lunge", sidelunge: "lunge",
  kneelunge: "lunge", lungeknee: "lunge", boxjump: "jump", tuckjump: "jump", jacks: "jump", skater: "jump", jumprope: "jump", burpee: "jump", medball: "jump",
  calf: "squat", calfseat: "squat", highknee: "run", buttkick: "run", kneeup: "run", walk: "run", cycle: "run", swim: "run", punch: "press", kick: "lunge",
  ropes: "press", climber: "plank", sideplank: "plank", plankjack: "plank", shouldertap: "plank", bear: "plank", birddog: "plank", plankdog: "plank",
  situp: "crunch", situp2: "crunch", bicycle: "crunch", revcrunch: "crunch", vup: "crunch", hollow: "raise", flutter: "raise", flutterkick: "raise",
  deadbug: "raise", dragonflag: "raise", lsit: "raise", hipthrust: "bridge", donkey: "bridge", hydrant: "bridge", glutekick: "bridge", clamshell: "bridge",
  sideleg: "raise", crab: "bridge", crabtoe: "bridge", superman: "raise", cobra: "stretch", child: "stretch", downdog: "stretch", catcow: "stretch",
  seatfold: "stretch", quadstretch: "stretch", pigeon: "stretch", butterfly: "stretch", sit: "stretch", lie: "stretch", neck: "stretch", crossarm: "stretch",
  ohstretch: "stretch", inchworm: "stretch", windmill: "twist", warrior: "stretch", tree: "stretch", sunsal: "stretch", getup: "hinge", halo: "twist",
  seatcurl: "curl", dip: "dip",
};

export type NewMove = Move & { pattern: Pattern; steps: string[] };
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parse(text: string): NewMove[] {
  const out: NewMove[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const [name, pose, prop, type, muscles, steps, body] = line.split("|").map((x) => x.trim());
    const p = pose as PoseKey;
    out.push({
      name, re: new RegExp(`^${esc(name)}$|\\b${esc(name)}\\b`, "i"), kind: "body", type: TYPE[type] ?? "reps",
      muscles: muscles.split(",").map((m) => m.trim()), body: body ? body.split(",").map((b) => b.trim()) : ["Strength", "Fitness"],
      mind: ["Mood up (endorphins)", "Stress down"], science: "", pattern: FAMILY[p] ?? (p as Pattern), steps: steps.split(" / ").map((x) => x.trim()),
      pose: p, prop: PROP[prop] ?? "none", ownPose: true, ownProp: true,
    });
  }
  return out;
}

export const NEW_MOVES: NewMove[] = [EX_A, EX_B, EX_C].flatMap(parse);
