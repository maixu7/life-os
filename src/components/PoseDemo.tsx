"use client";

import type { Pattern } from "@/lib/exercises";

// A moving stick-figure guide, like a gym poster: each pose is a set of
// keyframes the figure moves through, and the weight it holds (dumbbell,
// barbell, kettlebell) moves with its hands. Benches, boxes and bars are drawn
// where the exercise uses them.

type P = [number, number];
type Pose = { h: P; s: P; p: P; e1: P; a1: P; e2?: P; a2?: P; k1: P; f1: P; k2?: P; f2?: P };
export type Prop = "dumbbell" | "barbell" | "kettlebell" | "none";
export type Scene = "bench" | "box" | "bar" | "dipbars" | "wall" | "none";
export type PoseKey = Pattern | "kneepush" | "inclinepush" | "declinepush" | "pikepush" | "plyopush" | "seatcurl" | "jumpsquat" | "pistol"
  | "swing" | "clean" | "snatch" | "getup" | "halo" | "goblet" | "deadlift" | "benchpress" | "armraise" | "shrug" | "burpee" | "climber"
  | "highknee" | "wallsit" | "situp" | "chinup" | "widepull" | "stepup" | "boxjump" | "calf" | "hipthrust" | "flutter" | "superman" | "ohpress" | "frontsquat";

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

const POSES: Record<PoseKey, Pose[]> = {
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
    st({ h: [58, 64], s: [56, 56], p: [50, 44], e1: [58, 64], a1: [58, 72], ...one, k2: undefined, f2: undefined })],
};

const SCENE: Record<Scene, React.ReactNode> = {
  none: null,
  bench: <rect x="30" y="58" width="56" height="5" rx="1.5" fill="#64748b" />,
  box: <rect x="6" y="56" width="22" height="17" rx="2" fill="#64748b" />,
  bar: <path d="M24 4H76" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />,
  dipbars: <path d="M40 40H60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />,
  wall: <path d="M26 6V73" stroke="#64748b" strokeWidth="3" />,
};
// Where each pose needs equipment around the figure.
const AUTO_SCENE: Partial<Record<PoseKey, Scene>> = {
  pull: "bar", chinup: "bar", widepull: "bar", dip: "dipbars", inclinepush: "bench", declinepush: "box", seatcurl: "bench",
  benchpress: "bench", hipthrust: "bench", stepup: "box", boxjump: "box", wallsit: "wall",
};
const SCENE_AT: Partial<Record<PoseKey, string>> = { inclinepush: "translate(36 0)", seatcurl: "translate(-4 -4) scale(1 1)", stepup: "translate(52 2)", boxjump: "translate(52 2)", hipthrust: "translate(38 -4)" };

const TWIN: Partial<Record<keyof Pose, keyof Pose>> = { e2: "e1", a2: "a1", k2: "k1", f2: "f1" };
const at = (q: Pose, k: keyof Pose) => (q[k] ?? q[TWIN[k] ?? k])!;

function PropShape({ prop }: { prop: Prop }) {
  switch (prop) {
    case "dumbbell": return <g><rect x="-5" y="-1.2" width="10" height="2.4" fill="#cbd5e1" /><rect x="-6.5" y="-3" width="3" height="6" rx="1" fill="#475569" /><rect x="3.5" y="-3" width="3" height="6" rx="1" fill="#475569" /></g>;
    case "barbell": return <g><rect x="-22" y="-1" width="44" height="2" fill="#cbd5e1" /><rect x="-20" y="-5" width="4" height="10" rx="1" fill="#e11d48" /><rect x="16" y="-5" width="4" height="10" rx="1" fill="#e11d48" /></g>;
    case "kettlebell": return <g><path d="M-3 0 Q0 -5 3 0" stroke="#475569" strokeWidth="1.6" fill="none" /><circle cx="0" cy="4.5" r="4.6" fill="#334155" stroke="#64748b" strokeWidth=".8" /></g>;
    default: return null;
  }
}

export function PoseDemo({ pattern, pose, prop = "none", scene, speed = 1, className = "" }: {
  pattern?: Pattern; pose?: PoseKey; prop?: Prop; scene?: Scene; speed?: number; className?: string;
}) {
  const key = pose ?? pattern;
  if (!key || !POSES[key]) return null;
  const frames = POSES[key];
  const loop = [...frames, frames[0]];
  const n = loop.length - 1;
  const dur = `${((1.2 * frames.length) / speed).toFixed(2)}s`;
  const timing = { dur, repeatCount: "indefinite", calcMode: "spline", keyTimes: loop.map((_, i) => (i / n).toFixed(3)).join(";"), keySplines: Array(n).fill(".45 0 .55 1").join(";") } as const;
  const vals = (k: keyof Pose, i: 0 | 1) => loop.map((f) => at(f, k)[i]).join(";");
  const seg = (k1: keyof Pose, k2: keyof Pose, op = 1) => {
    const A = frames[0];
    return (
      <line key={`${k1}${k2}`} x1={at(A, k1)[0]} y1={at(A, k1)[1]} x2={at(A, k2)[0]} y2={at(A, k2)[1]} strokeOpacity={op}>
        <animate attributeName="x1" values={vals(k1, 0)} {...timing} /><animate attributeName="y1" values={vals(k1, 1)} {...timing} />
        <animate attributeName="x2" values={vals(k2, 0)} {...timing} /><animate attributeName="y2" values={vals(k2, 1)} {...timing} />
      </line>
    );
  };
  const held = (k: "a1" | "a2") => (
    <g key={k}>
      <animateTransform attributeName="transform" type="translate" values={loop.map((f) => at(f, k).join(" ")).join(";")} {...timing} />
      <PropShape prop={prop} />
    </g>
  );
  const sc = scene ?? AUTO_SCENE[key] ?? "none";
  const twoHands = prop === "dumbbell" && frames.some((f) => f.a2);
  return (
    <svg viewBox="0 0 100 80" className={`w-full max-w-[220px] ${className}`} role="img" aria-label={`How to move: ${key}`}>
      <path d="M4 73H96" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.5" />
      <g transform={SCENE_AT[key]}>{SCENE[sc]}</g>
      {twoHands && <g opacity=".5">{held("a2")}</g>}
      <g stroke="#7dd3fc" strokeWidth="3.2" strokeLinecap="round">
        {seg("s", "e2", 0.45)}{seg("e2", "a2", 0.45)}{seg("p", "k2", 0.45)}{seg("k2", "f2", 0.45)}
        {seg("s", "p")}{seg("p", "k1")}{seg("k1", "f1")}{seg("s", "e1")}{seg("e1", "a1")}
      </g>
      <circle r="5.5" fill="#7dd3fc" cx={frames[0].h[0]} cy={frames[0].h[1]}>
        <animate attributeName="cx" values={vals("h", 0)} {...timing} />
        <animate attributeName="cy" values={vals("h", 1)} {...timing} />
      </circle>
      {prop !== "none" && held("a1")}
    </svg>
  );
}

export const tutorialUrl = (name: string, variant?: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${variant && variant !== "Standard" ? `${variant} ` : ""}${name} proper form`)}`;
