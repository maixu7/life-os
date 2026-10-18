"use client";

import type { Pattern } from "@/lib/exercises";

// A moving stick-figure guide, like a gym poster: each pose is a set of
// keyframes the figure moves through, and the weight it holds (dumbbell,
// barbell, kettlebell) moves with its hands. Benches, boxes and bars are drawn
// where the exercise uses them.

import { POSES, type Pose, type PoseKey, type Prop, type Scene } from "@/lib/poses";
export type { PoseKey, Prop, Scene } from "@/lib/poses";

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
  hangraise: "bar", toesbar: "bar", hang: "bar", lever: "bar", muscleup: "bar", handstand: "wall", hspu: "wall", fly: "bench", pullover: "bench",
  boxstep: "box", dragonflag: "bench", hipext: "bench", pistolbox: "bench", invrow: "bar",
};
const SCENE_AT: Partial<Record<PoseKey, string>> = { inclinepush: "translate(36 0)", seatcurl: "translate(-4 -4) scale(1 1)", stepup: "translate(52 2)", boxjump: "translate(52 2)", hipthrust: "translate(38 -4)",
  boxstep: "translate(52 2)", handstand: "translate(30 0)", hspu: "translate(30 0)", invrow: "translate(30 24)", hipext: "translate(10 6)", pistolbox: "translate(-12 0)", dragonflag: "translate(10 6)" };

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
