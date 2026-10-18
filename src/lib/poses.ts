// Keyframes for the moving exercise guide. Each pose is a list of frames;
// the figure moves through them in a loop. Coordinates are in a 100 × 80 box,
// the floor is at y = 73, and the figure faces right (head towards larger x).
// h head, s shoulder, p hip, e1/a1 near elbow/hand, e2/a2 far elbow/hand,
// k1/f1 near knee/foot, k2/f2 far knee/foot (far limbs are drawn faded and
// copy the near ones when left out).

import type { Pattern } from "@/lib/exercises";

export type Prop = "dumbbell" | "barbell" | "kettlebell" | "none";
export type Scene = "bench" | "box" | "bar" | "dipbars" | "wall" | "none";
export type P = [number, number];
export type Pose = { h: P; s: P; p: P; e1: P; a1: P; e2?: P; a2?: P; k1: P; f1: P; k2?: P; f2?: P };
export type PoseKey = Pattern | "kneepush" | "inclinepush" | "declinepush" | "pikepush" | "plyopush" | "seatcurl" | "jumpsquat" | "pistol"
  | "swing" | "clean" | "snatch" | "getup" | "halo" | "goblet" | "deadlift" | "benchpress" | "armraise" | "shrug" | "burpee" | "climber"
  | "highknee" | "wallsit" | "situp" | "chinup" | "widepull" | "stepup" | "boxjump" | "calf" | "hipthrust" | "flutter" | "superman" | "ohpress" | "frontsquat"
  | NewPose;

// Added later: one picture per real movement, so each exercise shows itself.
export type NewPose = "birddog" | "deadbug" | "sideplank" | "jacks" | "lateral" | "crab" | "crabtoe" | "bear" | "donkey" | "hydrant" | "cobra" | "child"
  | "downdog" | "catcow" | "hollow" | "lsit" | "handstand" | "hspu" | "skater" | "buttkick" | "toetouch" | "seatfold" | "quadstretch" | "sidelunge"
  | "bicycle" | "hangraise" | "toesbar" | "revcrunch" | "clamshell" | "sideleg" | "revfly" | "facepull" | "pulldown" | "seatrow" | "legpress"
  | "legext" | "legcurl" | "punch" | "kick" | "swim" | "rowmachine" | "cycle" | "jumprope" | "sumo" | "inchworm" | "windmill" | "warrior" | "tree"
  | "pigeon" | "butterfly" | "sit" | "lie" | "neck" | "crossarm" | "ohstretch" | "walk" | "hang" | "kneelunge" | "tuckjump" | "invrow" | "fly"
  | "pullover" | "ropes" | "lungeknee" | "plankdog" | "sunsal" | "glutekick" | "uprow" | "frontraise" | "kbswing2" | "medball" | "boxstep" | "flutterkick" | "vup" | "plankjack" | "shouldertap"
  | "kneeup" | "squathold" | "calfseat" | "hipext" | "nordic" | "sissy" | "pistolbox" | "dragonflag" | "lever" | "muscleup" | "archer" | "situp2";

const STAND: Pose = { h: [50, 14], s: [50, 24], p: [50, 44], e1: [48, 35], a1: [47, 46], e2: [52, 35], a2: [53, 46], k1: [49, 58], f1: [49, 72], k2: [51, 58], f2: [51, 72] };
const st = (o: Partial<Pose>): Pose => ({ ...STAND, ...o });
const one = { e2: undefined, a2: undefined } as Partial<Pose>;
const LIE: Partial<Pose> = { s: [70, 66], h: [78, 64], p: [45, 68], e1: [60, 68], a1: [50, 68], e2: undefined, a2: undefined, k2: undefined, f2: undefined };
const BENT: Partial<Pose> = { p: [40, 44], s: [62, 34], h: [70, 30], k1: [46, 58], f1: [48, 72], k2: undefined, f2: undefined, e2: undefined, a2: undefined };
const PUSH_UP: Pose = { h: [78, 42], s: [70, 46], p: [45, 55], e1: [70, 58], a1: [70, 70], k1: [30, 60], f1: [15, 66] };
const PUSH_DOWN: Pose = { h: [80, 58], s: [70, 60], p: [45, 63], e1: [60, 62], a1: [70, 70], k1: [30, 65], f1: [15, 68] };
const SQUAT_LOW: Partial<Pose> = { h: [50, 28], s: [48, 38], p: [38, 54], k1: [56, 56], f1: [50, 72], k2: [58, 57], f2: [52, 72] };
const HANG = (y: number): Pose => ({ h: [50, 22 - y], s: [50, 30 - y], p: [50, 50 - y], e1: [44, 16 - y / 2], a1: [42, 4], e2: [56, 16 - y / 2], a2: [58, 4], k1: [50, 62 - y], f1: [50, 74 - y] });
const SEAT: Partial<Pose> = { p: [42, 54], s: [48, 34], h: [52, 24], k1: [62, 54], f1: [64, 72], k2: undefined, f2: undefined };

export const OLD_POSES = {
  push: [PUSH_UP, PUSH_DOWN],
  kneepush: [
    { h: [78, 44], s: [70, 48], p: [48, 59], e1: [70, 59], a1: [70, 70], k1: [36, 70], f1: [24, 62] },
    { h: [80, 60], s: [70, 61], p: [48, 65], e1: [62, 63], a1: [70, 70], k1: [36, 70], f1: [24, 62] }],
  inclinepush: [
    { h: [80, 30], s: [72, 34], p: [46, 48], e1: [73, 46], a1: [74, 57], k1: [30, 60], f1: [16, 72] },
    { h: [82, 44], s: [73, 47], p: [46, 57], e1: [64, 50], a1: [74, 57], k1: [30, 65], f1: [16, 72] }],
  declinepush: [
    { h: [80, 50], s: [72, 52], p: [48, 52], e1: [72, 62], a1: [72, 72], k1: [32, 54], f1: [18, 55] },
    { h: [82, 63], s: [72, 63], p: [48, 59], e1: [63, 65], a1: [72, 72], k1: [32, 57], f1: [18, 55] }],
  pikepush: [
    { h: [66, 52], s: [62, 46], p: [46, 30], e1: [66, 58], a1: [68, 70], k1: [38, 50], f1: [30, 72] },
    { h: [69, 66], s: [62, 57], p: [46, 32], e1: [58, 63], a1: [68, 70], k1: [38, 51], f1: [30, 72] }],
  plyopush: [PUSH_DOWN, { h: [78, 34], s: [70, 38], p: [45, 50], e1: [72, 48], a1: [74, 57], k1: [30, 58], f1: [15, 66] }],
  pull: [HANG(0), HANG(20)],
  chinup: [HANG(0), { ...HANG(20), e1: [46, 16], e2: [54, 16] }],
  widepull: [{ ...HANG(0), a1: [34, 4], a2: [66, 4], e1: [38, 16], e2: [62, 16] }, { ...HANG(18), a1: [34, 4], a2: [66, 4], e1: [32, 16], e2: [68, 16] }],
  squat: [st({ e1: [58, 26], a1: [66, 26], ...one }), st({ ...SQUAT_LOW, e1: [58, 38], a1: [66, 38], ...one })],
  goblet: [st({ e1: [55, 34], a1: [57, 27], ...one }), st({ ...SQUAT_LOW, e1: [54, 46], a1: [56, 39], ...one })],
  frontsquat: [st({ e1: [58, 28], a1: [53, 24], ...one }), st({ ...SQUAT_LOW, e1: [56, 40], a1: [51, 37], ...one })],
  jumpsquat: [st({ ...one }), st({ ...SQUAT_LOW, e1: [56, 44], a1: [60, 52], ...one }), st({ h: [50, 6], s: [50, 16], p: [50, 36], e1: [46, 8], a1: [44, 0], ...one, k1: [50, 50], f1: [50, 64], k2: [52, 50], f2: [52, 64] })],
  pistol: [
    st({ ...one, k2: [58, 52], f2: [70, 50] }),
    st({ ...SQUAT_LOW, h: [52, 30], s: [48, 40], e1: [60, 38], a1: [70, 38], ...one, k1: [54, 58], f1: [50, 72], k2: [64, 56], f2: [80, 55] })],
  hinge: [st({ e1: [50, 34], a1: [50, 45], ...one, k2: undefined, f2: undefined }), st({ ...BENT, e1: [62, 46], a1: [62, 58] })],
  deadlift: [st({ ...BENT, p: [38, 50], s: [60, 38], h: [68, 34], e1: [60, 50], a1: [59, 61], k1: [50, 58] }), st({ e1: [51, 35], a1: [52, 45], ...one, k2: undefined, f2: undefined })],
  swing: [st({ ...BENT, e1: [55, 45], a1: [47, 56] }), st({ e1: [58, 28], a1: [68, 25], ...one, k2: undefined, f2: undefined })],
  clean: [st({ ...BENT, e1: [60, 47], a1: [58, 58] }), st({ e1: [56, 33], a1: [56, 25], ...one, k2: undefined, f2: undefined })],
  snatch: [st({ ...BENT, e1: [60, 47], a1: [58, 58] }), st({ e1: [53, 12], a1: [55, 0], ...one, k2: undefined, f2: undefined })],
  halo: [st({ e1: [42, 20], a1: [48, 8], ...one }), st({ e1: [58, 20], a1: [52, 8], ...one })],
  getup: [
    { ...STAND, ...LIE, e1: [70, 56], a1: [70, 46], k1: [36, 56], f1: [28, 70] } as Pose,
    { ...STAND, p: [42, 68], s: [52, 48], h: [56, 38], e1: [54, 36], a1: [56, 26], ...one, k1: [58, 58], f1: [68, 70], k2: [30, 68], f2: [20, 70] } as Pose,
    st({ e1: [52, 14], a1: [54, 2], ...one })],
  curl: [st({ e1: [50, 36], a1: [53, 48] }), st({ e1: [50, 36], a1: [60, 29] })],
  seatcurl: [{ ...STAND, ...SEAT, e1: [58, 46], a1: [60, 60], ...one } as Pose, { ...STAND, ...SEAT, e1: [58, 46], a1: [56, 34], ...one } as Pose],
  press: [st({ e1: [42, 30], a1: [42, 20], e2: [58, 30], a2: [58, 20] }), st({ e1: [44, 12], a1: [44, 2], e2: [56, 12], a2: [56, 2] })],
  ohpress: [st({ e1: [56, 32], a1: [54, 24], ...one }), st({ e1: [53, 12], a1: [52, 2], ...one })],
  armraise: [st({ e1: [52, 35], a1: [54, 46], ...one }), st({ e1: [60, 25], a1: [70, 24], ...one })],
  shrug: [st({ e1: [50, 35], a1: [51, 46], ...one }), st({ s: [50, 20], h: [50, 12], e1: [50, 31], a1: [51, 42], ...one })],
  benchpress: [
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [58, 52], a1: [66, 46], k1: [30, 57], f1: [28, 72] },
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [66, 44], a1: [66, 34], k1: [30, 57], f1: [28, 72] }],
  row: [st({ ...BENT, e1: [62, 46], a1: [62, 58] }), st({ ...BENT, e1: [54, 28], a1: [60, 40] })],
  lunge: [st({}), st({ h: [50, 24], s: [50, 34], p: [50, 52], k1: [62, 56], f1: [62, 72], k2: [40, 70], f2: [28, 72] })],
  stepup: [st({ ...one, k1: [58, 50], f1: [62, 58] }), st({ h: [58, 4], s: [58, 14], p: [58, 34], ...one, e1: [56, 25], a1: [55, 36], k1: [60, 46], f1: [62, 58], k2: [56, 46], f2: [60, 56] })],
  boxjump: [st({ ...SQUAT_LOW, e1: [44, 44], a1: [38, 50], ...one }), st({ h: [60, 2], s: [60, 12], p: [60, 32], e1: [66, 16], a1: [72, 10], ...one, k1: [66, 44], f1: [64, 58], k2: [66, 44], f2: [64, 58] })],
  calf: [st({}), st({ h: [50, 10], s: [50, 20], p: [50, 40], e1: [48, 31], a1: [47, 42], k1: [49, 54], f1: [50, 68], k2: [51, 54], f2: [52, 68] })],
  plank: [
    { h: [78, 48], s: [70, 52], p: [45, 56], e1: [70, 70], a1: [80, 70], k1: [30, 61], f1: [15, 66] },
    { h: [78, 47], s: [70, 51], p: [45, 51], e1: [70, 70], a1: [80, 70], k1: [30, 59], f1: [15, 66] }],
  climber: [{ ...PUSH_UP, k1: [56, 58], f1: [50, 66], k2: [30, 60], f2: [15, 66] }, { ...PUSH_UP, k1: [30, 60], f1: [15, 66], k2: [56, 58], f2: [50, 66] }],
  burpee: [
    st({ ...one }),
    st({ ...SQUAT_LOW, e1: [60, 60], a1: [62, 72], ...one }),
    PUSH_UP,
    st({ ...SQUAT_LOW, e1: [60, 60], a1: [62, 72], ...one }),
    st({ h: [50, 6], s: [50, 16], p: [50, 36], e1: [46, 8], a1: [44, 0], e2: [54, 8], a2: [56, 0], k1: [50, 50], f1: [50, 64], k2: [52, 50], f2: [52, 64] })],
  crunch: [
    { h: [32, 64], s: [40, 66], p: [60, 68], e1: [38, 58], a1: [33, 60], k1: [70, 54], f1: [80, 70] },
    { h: [40, 50], s: [46, 56], p: [60, 68], e1: [44, 48], a1: [40, 52], k1: [70, 54], f1: [80, 70] }],
  situp: [
    { h: [30, 66], s: [38, 67], p: [60, 68], e1: [36, 60], a1: [32, 62], k1: [70, 54], f1: [80, 70] },
    { h: [56, 36], s: [56, 46], p: [60, 68], e1: [60, 44], a1: [56, 40], k1: [70, 54], f1: [80, 70] }],
  jump: [st({}), st({ h: [50, 8], s: [50, 18], p: [50, 38], e1: [42, 10], a1: [38, 2], e2: [58, 10], a2: [62, 2], k1: [44, 52], f1: [40, 66], k2: [56, 52], f2: [60, 66] })],
  run: [
    st({ e1: [44, 32], a1: [48, 40], e2: [56, 32], a2: [62, 26], k1: [58, 54], f1: [54, 68], k2: [44, 58], f2: [36, 64] }),
    st({ e1: [56, 32], a1: [62, 26], e2: [44, 32], a2: [48, 40], k1: [44, 58], f1: [36, 64], k2: [58, 54], f2: [54, 68] })],
  highknee: [
    st({ e1: [44, 32], a1: [48, 40], e2: [56, 32], a2: [62, 26], k1: [62, 42], f1: [60, 58], k2: [50, 58], f2: [50, 72] }),
    st({ e1: [56, 32], a1: [62, 26], e2: [44, 32], a2: [48, 40], k1: [50, 58], f1: [50, 72], k2: [62, 42], f2: [60, 58] })],
  raise: [{ ...STAND, ...LIE, k1: [30, 68], f1: [15, 68] } as Pose, { ...STAND, ...LIE, k1: [45, 52], f1: [45, 36] } as Pose],
  flutter: [{ ...STAND, ...LIE, k1: [30, 62], f1: [15, 58], k2: [30, 66], f2: [15, 66] } as Pose, { ...STAND, ...LIE, k1: [30, 66], f1: [15, 66], k2: [30, 62], f2: [15, 58] } as Pose],
  bridge: [{ ...STAND, ...LIE, p: [48, 68], k1: [36, 54], f1: [28, 70] } as Pose, { ...STAND, ...LIE, p: [50, 56], k1: [36, 52], f1: [28, 70] } as Pose],
  hipthrust: [
    { h: [80, 50], s: [72, 54], p: [52, 66], e1: [66, 62], a1: [60, 64], k1: [38, 54], f1: [32, 72] },
    { h: [80, 50], s: [72, 54], p: [52, 54], e1: [64, 54], a1: [56, 54], k1: [38, 52], f1: [32, 72] }],
  superman: [{ ...STAND, h: [76, 66], s: [68, 68], p: [45, 68], e1: [78, 68], a1: [88, 68], k1: [30, 68], f1: [15, 68], ...one, k2: undefined, f2: undefined } as Pose,
    { ...STAND, h: [76, 60], s: [68, 64], p: [45, 68], e1: [78, 60], a1: [88, 56], k1: [30, 66], f1: [15, 60], ...one, k2: undefined, f2: undefined } as Pose],
  dip: [
    { h: [50, 14], s: [50, 24], p: [50, 44], e1: [50, 32], a1: [50, 40], k1: [46, 58], f1: [54, 64] },
    { h: [50, 24], s: [50, 34], p: [50, 54], e1: [42, 38], a1: [50, 40], k1: [46, 66], f1: [54, 72] }],
  twist: [
    { h: [42, 36], s: [44, 46], p: [50, 66], e1: [54, 52], a1: [60, 56], k1: [62, 56], f1: [72, 62] },
    { h: [42, 36], s: [44, 46], p: [50, 66], e1: [36, 52], a1: [30, 58], k1: [62, 56], f1: [72, 62] }],
  wallsit: [st({ ...SQUAT_LOW, h: [30, 30], s: [30, 40], p: [30, 56], e1: [36, 48], a1: [42, 52], ...one, k1: [46, 56], f1: [46, 72], k2: undefined, f2: undefined }),
    st({ ...SQUAT_LOW, h: [30, 30], s: [30, 40], p: [30, 56], e1: [36, 48], a1: [42, 53], ...one, k1: [46, 56], f1: [46, 72], k2: undefined, f2: undefined })],
  stretch: [
    st({ e1: [46, 12], a1: [44, 2], e2: [54, 12], a2: [56, 2] }),
    st({ h: [70, 58], s: [64, 50], p: [46, 44], e1: [64, 60], a1: [62, 71], ...one, k1: [47, 58], f1: [48, 72], k2: undefined, f2: undefined })],
};


const QUAD: Pose = { h: [72, 42], s: [64, 48], p: [40, 48], e1: [64, 60], a1: [64, 72], e2: [65, 60], a2: [65, 72], k1: [40, 72], f1: [26, 72], k2: [41, 72], f2: [27, 72] };
const q = (o: Partial<Pose>): Pose => ({ ...QUAD, ...o });
const BACK: Pose = { h: [80, 66], s: [70, 68], p: [46, 68], e1: [62, 68], a1: [54, 68], e2: [62, 68], a2: [54, 68], k1: [30, 68], f1: [16, 68], k2: [30, 68], f2: [16, 68] };
const b = (o: Partial<Pose>): Pose => ({ ...BACK, ...o });
const PRONE: Pose = { h: [78, 66], s: [70, 69], p: [46, 70], e1: [64, 70], a1: [56, 70], e2: [64, 70], a2: [56, 70], k1: [30, 71], f1: [15, 72], k2: [30, 71], f2: [15, 72] };
const pr = (o: Partial<Pose>): Pose => ({ ...PRONE, ...o });
const SIT: Pose = { h: [44, 34], s: [44, 44], p: [42, 66], e1: [48, 54], a1: [52, 62], e2: [48, 54], a2: [52, 62], k1: [56, 58], f1: [66, 70], k2: [56, 58], f2: [66, 70] };
const si = (o: Partial<Pose>): Pose => ({ ...SIT, ...o });
const CHAIR: Pose = { h: [44, 26], s: [44, 36], p: [42, 56], e1: [50, 44], a1: [56, 48], e2: [50, 44], a2: [56, 48], k1: [58, 56], f1: [58, 72], k2: [58, 56], f2: [58, 72] };
const ch = (o: Partial<Pose>): Pose => ({ ...CHAIR, ...o });
const FRONT: Pose = { ...STAND }; // standing, seen from the front
const fr = (o: Partial<Pose>): Pose => ({ ...FRONT, ...o });

export const NEW_POSES: Record<NewPose, Pose[]> = {
  // On hands and knees, reach one arm forward and the opposite leg back.
  birddog: [QUAD, q({ e1: [76, 46], a1: [88, 44], k2: [26, 48], f2: [12, 48] }), QUAD, q({ e2: [76, 46], a2: [88, 44], k1: [26, 48], f1: [12, 48] })],
  // On your back, arms up, knees over hips; lower the opposite arm and leg.
  deadbug: [
    b({ e1: [70, 58], a1: [70, 48], e2: [70, 58], a2: [70, 48], k1: [46, 56], f1: [34, 56], k2: [46, 56], f2: [34, 56] }),
    b({ e1: [78, 62], a1: [88, 66], e2: [70, 58], a2: [70, 48], k1: [46, 56], f1: [34, 56], k2: [32, 64], f2: [18, 68] }),
    b({ e1: [70, 58], a1: [70, 48], e2: [70, 58], a2: [70, 48], k1: [46, 56], f1: [34, 56], k2: [46, 56], f2: [34, 56] }),
    b({ e2: [78, 62], a2: [88, 66], e1: [70, 58], a1: [70, 48], k2: [46, 56], f2: [34, 56], k1: [32, 64], f1: [18, 68] })],
  // On one forearm, body in a straight line, top arm up.
  sideplank: [
    { h: [78, 50], s: [70, 55], p: [46, 62], e1: [70, 72], a1: [80, 72], e2: [70, 45], a2: [70, 34], k1: [30, 67], f1: [15, 72] },
    { h: [78, 52], s: [70, 57], p: [46, 67], e1: [70, 72], a1: [80, 72], e2: [70, 47], a2: [70, 36], k1: [30, 69], f1: [15, 72] }],
  // Front view: arms and legs out and back in.
  jacks: [fr({}), fr({ e1: [42, 18], a1: [38, 8], e2: [58, 18], a2: [62, 8], k1: [44, 58], f1: [38, 72], k2: [56, 58], f2: [62, 72] })],
  // Front view: both arms out to the sides to shoulder height.
  lateral: [fr({ e1: [45, 34], a1: [44, 45], e2: [55, 34], a2: [56, 45] }), fr({ e1: [38, 26], a1: [28, 25], e2: [62, 26], a2: [72, 25] })],
  // Sit, hands behind, lift the hips (crab position).
  crab: [
    { h: [68, 42], s: [62, 50], p: [42, 58], e1: [64, 61], a1: [66, 72], k1: [32, 52], f1: [26, 72] },
    { h: [68, 40], s: [62, 48], p: [42, 52], e1: [64, 60], a1: [66, 72], k1: [32, 48], f1: [26, 72] }],
  // Crab position, kick one leg up and touch it with the opposite hand.
  crabtoe: [
    { h: [68, 42], s: [62, 50], p: [42, 56], e1: [64, 61], a1: [66, 72], e2: [64, 61], a2: [66, 72], k1: [32, 50], f1: [26, 72], k2: [32, 50], f2: [26, 72] },
    { h: [66, 42], s: [60, 50], p: [42, 54], e1: [64, 61], a1: [66, 72], e2: [48, 42], a2: [34, 34], k1: [32, 50], f1: [26, 72], k2: [34, 42], f2: [30, 30] }],
  // Hands and feet, knees just off the floor; crawl.
  bear: [
    q({ k1: [42, 64], f1: [30, 72], k2: [43, 64], f2: [31, 72], p: [40, 50] }),
    q({ p: [42, 50], s: [66, 48], h: [74, 42], a1: [70, 72], e1: [68, 60], k1: [46, 64], f1: [36, 72], k2: [40, 64], f2: [28, 72] })],
  // On hands and knees, kick one leg up behind you, knee bent.
  donkey: [QUAD, q({ k2: [30, 46], f2: [30, 32] })],
  // On hands and knees, lift one knee out to the side.
  hydrant: [QUAD, q({ k2: [44, 56], f2: [30, 54] })],
  // Lie face down, press up to lift your chest.
  cobra: [pr({ e1: [66, 64], a1: [66, 72], e2: [66, 64], a2: [66, 72] }), pr({ h: [74, 46], s: [66, 54], e1: [66, 64], a1: [66, 72], e2: [66, 64], a2: [66, 72] })],
  // Kneel, sit back on your heels, arms stretched forward on the floor.
  child: [
    { h: [64, 66], s: [56, 62], p: [36, 62], e1: [68, 68], a1: [80, 71], k1: [48, 72], f1: [30, 72] },
    { h: [66, 65], s: [58, 61], p: [36, 63], e1: [70, 68], a1: [82, 71], k1: [48, 72], f1: [30, 72] }],
  // Hips high, upside-down V.
  downdog: [
    { h: [64, 60], s: [62, 52], p: [44, 32], e1: [66, 62], a1: [70, 72], k1: [36, 52], f1: [28, 72] },
    { h: [64, 60], s: [62, 52], p: [44, 32], e1: [66, 62], a1: [70, 72], k1: [38, 50], f1: [30, 70] }],
  // On hands and knees: head up and back dips (cow), then round the back (cat).
  catcow: [q({ h: [74, 38], s: [64, 50], p: [40, 50] }), q({ h: [70, 54], s: [64, 44], p: [40, 44] })],
  // On your back, lift shoulders and legs, arms overhead, lower back down.
  hollow: [
    b({ s: [68, 62], h: [76, 58], e1: [78, 58], a1: [88, 55], e2: [78, 58], a2: [88, 55], k1: [30, 63], f1: [16, 59], k2: [30, 63], f2: [16, 59] }),
    b({ s: [68, 64], h: [76, 61], e1: [78, 61], a1: [88, 58], e2: [78, 61], a2: [88, 58], k1: [30, 61], f1: [16, 56], k2: [30, 61], f2: [16, 56] })],
  // Hands on the floor by the hips, lift hips and straight legs.
  lsit: [
    { h: [44, 30], s: [44, 40], p: [42, 64], e1: [46, 52], a1: [46, 72], k1: [56, 66], f1: [70, 68] },
    { h: [44, 28], s: [44, 38], p: [42, 60], e1: [46, 50], a1: [46, 72], k1: [56, 60], f1: [70, 60] }],
  // Upside down on your hands (against a wall).
  handstand: [
    { h: [50, 61], s: [50, 52], p: [50, 32], e1: [47, 62], a1: [47, 72], e2: [53, 62], a2: [53, 72], k1: [50, 19], f1: [50, 6] },
    { h: [50, 61], s: [50, 52], p: [50, 32], e1: [47, 62], a1: [47, 72], e2: [53, 62], a2: [53, 72], k1: [51, 19], f1: [51, 6] }],
  hspu: [
    { h: [50, 61], s: [50, 52], p: [50, 32], e1: [47, 62], a1: [47, 72], e2: [53, 62], a2: [53, 72], k1: [50, 19], f1: [50, 6] },
    { h: [50, 68], s: [50, 60], p: [50, 40], e1: [40, 64], a1: [44, 72], e2: [60, 64], a2: [56, 72], k1: [50, 27], f1: [50, 14] }],
  // Front view: leap side to side, landing on one leg.
  skater: [
    fr({ h: [38, 18], s: [40, 28], p: [44, 46], e1: [34, 36], a1: [30, 44], e2: [48, 34], a2: [56, 30], k1: [42, 58], f1: [40, 72], k2: [52, 60], f2: [58, 68] }),
    fr({ h: [62, 18], s: [60, 28], p: [56, 46], e1: [52, 34], a1: [44, 30], e2: [66, 36], a2: [70, 44], k1: [48, 60], f1: [42, 68], k2: [58, 58], f2: [60, 72] })],
  // Jog on the spot, heels kicking up to your bottom.
  buttkick: [st({ e1: [44, 32], a1: [48, 40], e2: [56, 32], a2: [60, 26], k1: [50, 58], f1: [40, 50], k2: [50, 58], f2: [50, 72] }),
    st({ e1: [56, 32], a1: [60, 26], e2: [44, 32], a2: [48, 40], k1: [50, 58], f1: [50, 72], k2: [50, 58], f2: [40, 50] })],
  // Stand, fold forward and reach for your toes.
  toetouch: [st({}), st({ h: [70, 58], s: [64, 50], p: [46, 44], e1: [64, 60], a1: [62, 71], e2: [64, 60], a2: [62, 71], k1: [47, 58], f1: [48, 72], k2: [48, 58], f2: [49, 72] })],
  // Sit with legs straight, reach for your toes.
  seatfold: [
    { h: [46, 36], s: [44, 46], p: [40, 68], e1: [50, 54], a1: [56, 58], k1: [56, 68], f1: [72, 68] },
    { h: [62, 52], s: [56, 56], p: [40, 68], e1: [62, 62], a1: [70, 66], k1: [56, 68], f1: [72, 68] }],
  // Stand on one leg, hold the other foot behind you.
  quadstretch: [st({ e2: [48, 36], a2: [44, 48], k2: [49, 58], f2: [42, 48] }), st({ e2: [48, 36], a2: [43, 47], k2: [50, 58], f2: [41, 47], e1: [54, 30], a1: [60, 24] })],
  // Front view: step wide and sit into one hip, other leg straight.
  sidelunge: [fr({ e1: [50, 34], a1: [52, 30], e2: [50, 34], a2: [52, 30] }),
    fr({ h: [44, 24], s: [44, 34], p: [44, 52], e1: [48, 42], a1: [52, 40], e2: [48, 42], a2: [52, 40], k1: [34, 56], f1: [30, 72], k2: [58, 62], f2: [72, 72] })],
  // On your back, elbow to opposite knee, pedalling.
  bicycle: [
    b({ s: [68, 62], h: [76, 58], e1: [70, 54], a1: [76, 56], e2: [72, 56], a2: [78, 57], k1: [52, 54], f1: [40, 58], k2: [30, 64], f2: [16, 66] }),
    b({ s: [68, 62], h: [76, 58], e1: [70, 54], a1: [76, 56], e2: [72, 56], a2: [78, 57], k2: [52, 54], f2: [40, 58], k1: [30, 64], f1: [16, 66] })],
  // Hang from a bar and lift your knees.
  hangraise: [HANG(0), { ...HANG(0), k1: [60, 46], f1: [58, 60] }],
  toesbar: [HANG(0), { ...HANG(0), p: [48, 46], k1: [56, 30], f1: [54, 10] }],
  // On your back, curl knees to chest and lift hips.
  revcrunch: [b({ k1: [44, 54], f1: [32, 58], k2: [44, 54], f2: [32, 58] }), b({ p: [50, 64], k1: [58, 50], f1: [48, 44], k2: [58, 50], f2: [48, 44] })],
  // Lie on your side, knees bent, open the top knee.
  clamshell: [
    { h: [80, 62], s: [70, 66], p: [46, 68], e1: [74, 70], a1: [82, 66], k1: [56, 70], f1: [42, 72], k2: [56, 68], f2: [42, 70] },
    { h: [80, 62], s: [70, 66], p: [46, 68], e1: [74, 70], a1: [82, 66], k1: [56, 70], f1: [42, 72], k2: [54, 54], f2: [42, 68] }],
  // Lie on your side, lift the top leg straight up.
  sideleg: [
    { h: [80, 62], s: [70, 66], p: [46, 68], e1: [74, 70], a1: [82, 66], k1: [30, 70], f1: [14, 72], k2: [30, 68], f2: [14, 70] },
    { h: [80, 62], s: [70, 66], p: [46, 68], e1: [74, 70], a1: [82, 66], k1: [30, 70], f1: [14, 72], k2: [32, 58], f2: [18, 48] }],
  // Bend forward, raise the arms out to the sides.
  revfly: [st({ ...BENT, e1: [62, 46], a1: [62, 58] }), st({ ...BENT, e1: [58, 36], a1: [54, 30] })],
  // Pull a rope towards your face, elbows high.
  facepull: [st({ e1: [62, 30], a1: [74, 28], ...one }), st({ e1: [58, 22], a1: [56, 16], ...one })],
  // Seated, pull a bar down to your chest.
  pulldown: [ch({ e1: [50, 20], a1: [52, 6], e2: [50, 20], a2: [52, 6] }), ch({ e1: [50, 40], a1: [52, 30], e2: [50, 40], a2: [52, 30] })],
  // Seated, pull handles to your belly.
  seatrow: [si({ e1: [56, 48], a1: [66, 50], e2: [56, 48], a2: [66, 50], k1: [56, 60], f1: [72, 62] }), si({ s: [42, 44], h: [42, 34], e1: [36, 52], a1: [46, 56], e2: [36, 52], a2: [46, 56], k1: [56, 60], f1: [72, 62] })],
  // Lean back and push a platform away with your legs.
  legpress: [
    { h: [30, 44], s: [34, 52], p: [44, 66], e1: [40, 62], a1: [46, 66], k1: [58, 46], f1: [70, 54] },
    { h: [30, 44], s: [34, 52], p: [44, 66], e1: [40, 62], a1: [46, 66], k1: [64, 56], f1: [80, 48] }],
  // Seated, straighten the knee.
  legext: [ch({}), ch({ f1: [74, 56], f2: [74, 56] })],
  // Face down, curl heels to bottom.
  legcurl: [pr({ k1: [30, 70], f1: [15, 70] }), pr({ k1: [30, 70], f1: [32, 52] })],
  // Guard up, punch forward.
  punch: [st({ e1: [56, 34], a1: [60, 26], e2: [54, 34], a2: [58, 24], k1: [54, 58], f1: [56, 72], k2: [44, 58], f2: [42, 72] }),
    st({ e1: [62, 26], a1: [74, 24], e2: [54, 34], a2: [58, 24], k1: [54, 58], f1: [56, 72], k2: [44, 58], f2: [42, 72] })],
  // Front kick.
  kick: [st({ e1: [56, 34], a1: [60, 26], e2: [54, 34], a2: [58, 24] }), st({ e1: [56, 34], a1: [60, 26], e2: [54, 34], a2: [58, 24], p: [48, 44], k1: [60, 40], f1: [76, 36] })],
  // Swimming stroke (front crawl).
  swim: [{ h: [78, 46], s: [70, 48], p: [44, 50], e1: [80, 46], a1: [90, 46], e2: [64, 54], a2: [56, 56], k1: [30, 50], f1: [16, 48], k2: [30, 52], f2: [16, 54] },
    { h: [78, 46], s: [70, 48], p: [44, 50], e2: [80, 46], a2: [90, 46], e1: [64, 54], a1: [56, 56], k2: [30, 50], f2: [16, 48], k1: [30, 52], f1: [16, 54] }],
  // Rowing machine: legs push, then arms pull.
  rowmachine: [
    { h: [58, 40], s: [56, 50], p: [44, 66], e1: [64, 56], a1: [72, 58], k1: [56, 52], f1: [66, 68] },
    { h: [36, 40], s: [38, 50], p: [44, 66], e1: [40, 56], a1: [50, 56], k1: [62, 62], f1: [78, 68] }],
  // Cycling: seated, legs pedal.
  cycle: [
    { h: [58, 22], s: [54, 32], p: [42, 46], e1: [62, 38], a1: [68, 44], k1: [56, 52], f1: [50, 66], k2: [50, 56], f2: [44, 62] },
    { h: [58, 22], s: [54, 32], p: [42, 46], e1: [62, 38], a1: [68, 44], k1: [50, 56], f1: [44, 62], k2: [56, 52], f2: [50, 66] }],
  // Skipping rope: small jumps, hands by the hips.
  jumprope: [st({ e1: [46, 36], a1: [42, 44], e2: [54, 36], a2: [58, 44] }), st({ h: [50, 10], s: [50, 20], p: [50, 40], e1: [46, 32], a1: [42, 40], e2: [54, 32], a2: [58, 40], k1: [49, 54], f1: [49, 67], k2: [51, 54], f2: [51, 67] })],
  // Front view: wide stance, toes out, sit down.
  sumo: [fr({ k1: [42, 58], f1: [36, 72], k2: [58, 58], f2: [64, 72], e1: [48, 36], a1: [50, 42], e2: [52, 36], a2: [50, 42] }),
    fr({ h: [50, 26], s: [50, 36], p: [50, 54], k1: [36, 56], f1: [36, 72], k2: [64, 56], f2: [64, 72], e1: [46, 46], a1: [50, 50], e2: [54, 46], a2: [50, 50] })],
  // Fold, walk hands out to a plank, walk back.
  inchworm: [
    st({ h: [70, 58], s: [64, 50], p: [46, 44], e1: [64, 60], a1: [64, 72], ...one, k1: [47, 58], f1: [48, 72], k2: undefined, f2: undefined }),
    { h: [66, 54], s: [62, 48], p: [46, 36], e1: [66, 60], a1: [70, 72], k1: [48, 54], f1: [50, 72] },
    PUSH_UP],
  // Weight overhead, bend to the side and reach down.
  windmill: [fr({ e2: [56, 14], a2: [58, 4], e1: [46, 36], a1: [45, 46], k1: [44, 58], f1: [40, 72], k2: [56, 58], f2: [60, 72] }),
    fr({ h: [40, 24], s: [42, 32], p: [50, 44], e2: [52, 20], a2: [58, 8], e1: [40, 44], a1: [40, 58], k1: [44, 58], f1: [40, 72], k2: [56, 58], f2: [60, 72] })],
  // Yoga warrior: deep lunge, arms up.
  warrior: [st({ h: [50, 22], s: [50, 32], p: [50, 50], e1: [52, 20], a1: [54, 8], e2: [52, 20], a2: [54, 8], k1: [62, 54], f1: [64, 72], k2: [38, 62], f2: [26, 72] }),
    st({ h: [50, 24], s: [50, 34], p: [50, 52], e1: [62, 32], a1: [74, 32], e2: [38, 32], a2: [26, 32], k1: [62, 56], f1: [64, 72], k2: [38, 62], f2: [26, 72] })],
  // Tree pose: stand on one leg, foot on the other leg, hands together up.
  tree: [st({ e1: [50, 30], a1: [52, 24], e2: [50, 30], a2: [52, 24], k2: [60, 54], f2: [51, 58] }), st({ e1: [48, 14], a1: [50, 4], e2: [52, 14], a2: [50, 4], k2: [60, 54], f2: [51, 58] })],
  // Pigeon: front leg bent across, back leg long.
  pigeon: [
    { h: [62, 30], s: [60, 40], p: [52, 62], e1: [64, 52], a1: [66, 66], k1: [64, 68], f1: [50, 70], k2: [36, 70], f2: [18, 72] },
    { h: [74, 58], s: [68, 58], p: [52, 64], e1: [76, 64], a1: [84, 70], k1: [64, 68], f1: [50, 70], k2: [36, 70], f2: [18, 72] }],
  // Butterfly: sit, soles together, knees out.
  butterfly: [si({ k1: [58, 60], f1: [52, 70], k2: [58, 64], f2: [52, 70], e1: [50, 56], a1: [52, 68] }), si({ k1: [58, 64], f1: [52, 70], k2: [58, 66], f2: [52, 70], h: [50, 38], s: [48, 47], e1: [52, 58], a1: [52, 68] })],
  // Sit cross-legged, calm breathing.
  sit: [si({ k1: [56, 66], f1: [44, 70], k2: [30, 66], f2: [42, 70], e1: [50, 54], a1: [54, 64], e2: [38, 54], a2: [32, 64] }), si({ h: [44, 33], k1: [56, 66], f1: [44, 70], k2: [30, 66], f2: [42, 70], e1: [50, 54], a1: [54, 64], e2: [38, 54], a2: [32, 64] })],
  // Lie still on your back.
  lie: [BACK, b({ h: [80, 65] })],
  // Front view: tilt the head side to side.
  neck: [fr({ h: [44, 16] }), fr({ h: [56, 16] })],
  // Pull one arm across the chest.
  crossarm: [st({ e1: [58, 30], a1: [44, 28], e2: [52, 32], a2: [56, 28] }), st({ e1: [58, 30], a1: [42, 27], e2: [52, 31], a2: [56, 27] })],
  // Hand down the back, elbow up (triceps stretch).
  ohstretch: [st({ e1: [54, 12], a1: [48, 26], e2: [46, 14], a2: [52, 12] }), st({ e1: [54, 10], a1: [47, 24], e2: [46, 13], a2: [53, 10] })],
  // Walking tall (with weights in the hands).
  walk: [st({ e1: [49, 35], a1: [48, 46], e2: [51, 35], a2: [52, 46], k1: [54, 58], f1: [56, 72], k2: [46, 58], f2: [42, 72] }),
    st({ e1: [49, 35], a1: [48, 46], e2: [51, 35], a2: [52, 46], k1: [46, 58], f1: [42, 72], k2: [54, 58], f2: [56, 72] })],
  // Hang still from a bar.
  hang: [HANG(0), { ...HANG(0), k1: [51, 62], f1: [51, 74] }],
  // Kneeling lunge: back knee on the floor, hips forward.
  kneelunge: [st({ h: [50, 26], s: [50, 36], p: [48, 56], e1: [52, 46], a1: [56, 50], e2: [52, 46], a2: [56, 50], k1: [62, 58], f1: [64, 72], k2: [38, 72], f2: [26, 72] }),
    st({ h: [54, 26], s: [52, 36], p: [52, 58], e1: [54, 46], a1: [58, 50], e2: [54, 46], a2: [58, 50], k1: [64, 58], f1: [64, 72], k2: [40, 72], f2: [26, 72] })],
  // Jump and pull the knees to the chest.
  tuckjump: [st({ ...SQUAT_LOW, e1: [44, 44], a1: [40, 50], ...one }), st({ h: [50, 4], s: [50, 14], p: [50, 32], e1: [56, 20], a1: [60, 28], ...one, k1: [60, 30], f1: [54, 42], k2: [60, 30], f2: [54, 42] })],
  // Hang under a low bar, body straight, pull the chest up.
  invrow: [
    { h: [74, 50], s: [66, 52], p: [42, 60], e1: [66, 42], a1: [66, 32], k1: [26, 66], f1: [12, 72] },
    { h: [72, 40], s: [64, 42], p: [42, 54], e1: [56, 38], a1: [64, 32], k1: [26, 63], f1: [12, 72] }],
  // Lie on a bench, open the arms wide and bring them together.
  fly: [
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [66, 46], a1: [66, 36], k1: [30, 57], f1: [28, 72] },
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [60, 54], a1: [56, 58], k1: [30, 57], f1: [28, 72] }],
  // Lie across a bench, weight from over the chest to behind the head.
  pullover: [
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [66, 46], a1: [66, 36], k1: [30, 57], f1: [28, 72] },
    { h: [76, 54], s: [66, 56], p: [42, 58], e1: [76, 50], a1: [86, 52], k1: [30, 57], f1: [28, 72] }],
  // Standing, kick one straight leg back.
  glutekick: [st({ e1: [52, 34], a1: [56, 40], ...one }), st({ e1: [52, 34], a1: [56, 40], ...one, h: [52, 16], s: [52, 26], k2: [42, 56], f2: [34, 66] })],
  // Pull the weight up along the body to the chest.
  uprow: [st({ e1: [50, 36], a1: [52, 46], ...one }), st({ e1: [58, 24], a1: [53, 28], ...one })],
  // Raise straight arms forward to eye level.
  frontraise: [st({ e1: [50, 35], a1: [52, 46], ...one }), st({ e1: [60, 24], a1: [70, 20], ...one })],
  // Two-hand swing to chest height.
  kbswing2: [st({ ...BENT, e1: [55, 45], a1: [47, 56] }), st({ e1: [60, 30], a1: [70, 26], ...one, k2: undefined, f2: undefined })],
  // Throw a heavy ball down to the floor.
  medball: [st({ e1: [52, 14], a1: [54, 4], ...one }), st({ ...SQUAT_LOW, h: [56, 34], s: [54, 42], e1: [62, 54], a1: [66, 66], ...one })],
  // Step up onto a box and down.
  boxstep: [st({ ...one, k1: [58, 50], f1: [62, 58] }), st({ h: [58, 4], s: [58, 14], p: [58, 34], ...one, e1: [56, 25], a1: [55, 36], k1: [60, 46], f1: [62, 58], k2: [56, 46], f2: [60, 56] })],
  // On your back, small fast kicks with straight legs.
  flutterkick: [b({ k1: [30, 62], f1: [16, 58], k2: [30, 66], f2: [16, 66] }), b({ k1: [30, 66], f1: [16, 66], k2: [30, 62], f2: [16, 58] })],
  // On your back, lift arms and legs to meet in a V.
  vup: [b({ e1: [80, 68], a1: [90, 68], e2: [80, 68], a2: [90, 68] }), { h: [60, 42], s: [56, 50], p: [46, 66], e1: [52, 40], a1: [46, 32], k1: [38, 54], f1: [32, 40] }],
  // Plank, jump the feet out and in.
  plankjack: [PUSH_UP, { ...PUSH_UP, k1: [30, 58], f1: [14, 62], k2: [30, 62], f2: [14, 70] }],
  // Plank on hands, tap a shoulder.
  shouldertap: [PUSH_UP, { ...PUSH_UP, e2: [72, 52], a2: [70, 46] }],
  // Standing knee up to chest (marching).
  kneeup: [st({ e1: [52, 34], a1: [56, 40] }), st({ e1: [52, 34], a1: [56, 40], k1: [62, 42], f1: [60, 58] })],
  // Hold the bottom of a squat.
  squathold: [st({ ...SQUAT_LOW, e1: [58, 44], a1: [64, 44], ...one }), st({ ...SQUAT_LOW, h: [50, 27], e1: [58, 43], a1: [64, 43], ...one })],
  // Seated calf raise.
  calfseat: [ch({ f1: [58, 72], k1: [58, 56] }), ch({ k1: [58, 52], f1: [58, 68] })],
  // Lie face down on a bench, lift the legs (reverse hyperextension).
  hipext: [pr({}), pr({ k1: [30, 64], f1: [15, 58] })],
  // Kneel, lower your body forward slowly (Nordic curl).
  nordic: [{ h: [44, 14], s: [44, 24], p: [44, 46], e1: [46, 34], a1: [48, 42], k1: [44, 72], f1: [28, 72] }, { h: [72, 56], s: [64, 58], p: [44, 66], e1: [66, 64], a1: [72, 70], k1: [44, 72], f1: [28, 72] }],
  // Sissy squat: knees forward, lean back.
  sissy: [st({}), st({ h: [42, 32], s: [42, 42], p: [44, 58], k1: [60, 62], f1: [52, 72], k2: [60, 62], f2: [52, 72], e1: [50, 44], a1: [56, 44], ...one })],
  // Single-leg squat to a bench.
  pistolbox: [st({ ...one, k2: [58, 52], f2: [70, 50] }), st({ h: [54, 32], s: [50, 42], p: [40, 56], k1: [56, 58], f1: [50, 72], e1: [60, 40], a1: [70, 40], ...one, k2: [62, 56], f2: [76, 56] })],
  // Lie on a bench, body rigid, lower from the shoulders.
  dragonflag: [b({ e1: [80, 62], a1: [88, 60], p: [52, 46], k1: [56, 28], f1: [58, 10] }), b({ e1: [80, 62], a1: [88, 60], p: [48, 60], k1: [34, 52], f1: [20, 46] })],
  // Front lever: hang, body flat and straight.
  lever: [HANG(0), { h: [62, 14], s: [52, 12], p: [32, 14], e1: [46, 8], a1: [42, 4], e2: [56, 8], a2: [58, 4], k1: [20, 14], f1: [8, 14] }],
  // Pull up and push over the bar.
  muscleup: [HANG(0), HANG(20), { h: [50, 0], s: [50, 8], p: [50, 28], e1: [42, 12], a1: [42, 4], e2: [58, 12], a2: [58, 4], k1: [50, 40], f1: [50, 52] }],
  // Archer push-up: shift to one arm.
  archer: [PUSH_UP, { ...PUSH_DOWN, e2: [80, 66], a2: [88, 70] }],
  // Half squat, arms whipping the ropes up and down in turn.
  ropes: [st({ ...SQUAT_LOW, h: [52, 26], s: [50, 36], p: [42, 52], e1: [58, 40], a1: [68, 34], e2: [58, 46], a2: [68, 52] }), st({ ...SQUAT_LOW, h: [52, 26], s: [50, 36], p: [42, 52], e1: [58, 46], a1: [68, 52], e2: [58, 40], a2: [68, 34] })],
  // Step back into a lunge, then drive that knee up.
  lungeknee: [st({ h: [50, 24], s: [50, 34], p: [50, 52], e1: [54, 42], a1: [58, 46], e2: [46, 42], a2: [42, 46], k1: [62, 56], f1: [62, 72], k2: [40, 70], f2: [28, 72] }),
    st({ e1: [46, 32], a1: [44, 24], e2: [56, 32], a2: [60, 40], k2: [60, 42], f2: [58, 58] })],
  // From a plank, push the hips up into downward dog.
  plankdog: [PUSH_UP, { h: [64, 60], s: [62, 52], p: [44, 32], e1: [66, 62], a1: [70, 72], k1: [36, 52], f1: [28, 72] }],
  // Sun salutation: reach up, fold, plank, cobra, downward dog.
  sunsal: [
    st({ e1: [48, 14], a1: [50, 4], e2: [52, 14], a2: [50, 4] }),
    st({ h: [70, 58], s: [64, 50], p: [46, 44], e1: [64, 60], a1: [62, 71], ...one, k1: [47, 58], f1: [48, 72], k2: undefined, f2: undefined }),
    PUSH_UP,
    { ...PRONE, h: [74, 46], s: [66, 54], e1: [66, 64], a1: [66, 72] },
    { h: [64, 60], s: [62, 52], p: [44, 32], e1: [66, 62], a1: [70, 72], k1: [36, 52], f1: [28, 72] }],
  // Sit-up with feet anchored, all the way up.
  situp2: [b({ k1: [36, 54], f1: [26, 70], k2: [36, 54], f2: [26, 70], e1: [76, 62], a1: [82, 60] }), { h: [40, 38], s: [42, 48], p: [48, 68], e1: [36, 48], a1: [32, 42], k1: [36, 54], f1: [26, 70] }],
};

export const POSES: Record<PoseKey, Pose[]> = { ...(OLD_POSES as Record<Exclude<PoseKey, NewPose>, Pose[]>), ...NEW_POSES };
