"use client";

import type { Pattern } from "@/lib/exercises";

// A moving stick-figure guide: each movement pattern has a start and an end
// pose, and the figure moves smoothly between them, like a gym poster.

type P = [number, number];
type Pose = { h: P; s: P; p: P; e1: P; a1: P; e2?: P; a2?: P; k1: P; f1: P; k2?: P; f2?: P };

const STAND: Pose = { h: [50, 14], s: [50, 24], p: [50, 44], e1: [47, 34], a1: [46, 44], e2: [53, 34], a2: [54, 44], k1: [48, 58], f1: [48, 72], k2: [52, 58], f2: [52, 72] };
const st = (o: Partial<Pose>): Pose => ({ ...STAND, ...o });
const LIE: Partial<Pose> = { s: [70, 66], h: [78, 64], p: [45, 68], e1: [60, 68], a1: [50, 68], e2: undefined, a2: undefined, k2: undefined, f2: undefined };
const BENT: Partial<Pose> = { p: [40, 44], s: [62, 34], h: [70, 30], k1: [46, 58], f1: [48, 72], k2: undefined, f2: undefined, e2: undefined, a2: undefined };

const POSES: Record<Pattern, [Pose, Pose]> = {
  push: [
    { h: [78, 42], s: [70, 46], p: [45, 55], e1: [70, 58], a1: [70, 70], k1: [30, 60], f1: [15, 66] },
    { h: [80, 58], s: [70, 60], p: [45, 63], e1: [60, 62], a1: [70, 70], k1: [30, 65], f1: [15, 68] }],
  pull: [
    { h: [50, 22], s: [50, 30], p: [50, 50], e1: [44, 16], a1: [42, 4], e2: [56, 16], a2: [58, 4], k1: [50, 62], f1: [50, 74] },
    { h: [50, 2], s: [50, 12], p: [50, 32], e1: [38, 14], a1: [42, 4], e2: [62, 14], a2: [58, 4], k1: [50, 46], f1: [50, 58] }],
  squat: [
    st({ e1: [58, 26], a1: [66, 26], e2: undefined, a2: undefined }),
    st({ h: [50, 26], s: [48, 36], p: [38, 54], e1: [58, 36], a1: [66, 36], e2: undefined, a2: undefined, k1: [56, 56], f1: [50, 72], k2: [58, 57], f2: [52, 72] })],
  hinge: [
    st({ e1: [50, 34], a1: [50, 44], e2: undefined, a2: undefined, k2: undefined, f2: undefined }),
    st({ ...BENT, e1: [62, 46], a1: [62, 58] })],
  lunge: [
    st({}),
    st({ h: [50, 24], s: [50, 34], p: [50, 52], k1: [62, 56], f1: [62, 72], k2: [40, 70], f2: [28, 72] })],
  plank: [
    { h: [78, 48], s: [70, 52], p: [45, 56], e1: [70, 70], a1: [80, 70], k1: [30, 61], f1: [15, 66] },
    { h: [78, 47], s: [70, 51], p: [45, 51], e1: [70, 70], a1: [80, 70], k1: [30, 59], f1: [15, 66] }],
  crunch: [
    { h: [32, 64], s: [40, 66], p: [60, 68], e1: [38, 58], a1: [33, 60], k1: [70, 54], f1: [80, 70] },
    { h: [40, 50], s: [46, 56], p: [60, 68], e1: [44, 48], a1: [40, 52], k1: [70, 54], f1: [80, 70] }],
  jump: [
    st({}),
    st({ h: [50, 8], s: [50, 18], p: [50, 38], e1: [42, 10], a1: [38, 2], e2: [58, 10], a2: [62, 2], k1: [44, 52], f1: [40, 66], k2: [56, 52], f2: [60, 66] })],
  curl: [
    st({ e1: [50, 34], a1: [54, 44], e2: undefined, a2: undefined }),
    st({ e1: [50, 34], a1: [56, 26], e2: undefined, a2: undefined })],
  press: [
    st({ e1: [42, 30], a1: [42, 20], e2: [58, 30], a2: [58, 20] }),
    st({ e1: [44, 12], a1: [44, 2], e2: [56, 12], a2: [56, 2] })],
  row: [
    st({ ...BENT, e1: [62, 46], a1: [62, 58] }),
    st({ ...BENT, e1: [54, 28], a1: [60, 40] })],
  run: [
    st({ e1: [44, 32], a1: [48, 40], e2: [56, 32], a2: [62, 26], k1: [58, 54], f1: [54, 68], k2: [44, 58], f2: [36, 64] }),
    st({ e1: [56, 32], a1: [62, 26], e2: [44, 32], a2: [48, 40], k1: [44, 58], f1: [36, 64], k2: [58, 54], f2: [54, 68] })],
  raise: [
    { ...STAND, ...LIE, k1: [30, 68], f1: [15, 68] } as Pose,
    { ...STAND, ...LIE, k1: [45, 52], f1: [45, 36] } as Pose],
  bridge: [
    { ...STAND, ...LIE, p: [48, 68], k1: [36, 54], f1: [28, 70] } as Pose,
    { ...STAND, ...LIE, p: [50, 56], k1: [36, 52], f1: [28, 70] } as Pose],
  dip: [
    { h: [50, 14], s: [50, 24], p: [50, 44], e1: [50, 32], a1: [50, 40], k1: [46, 58], f1: [54, 64] },
    { h: [50, 24], s: [50, 34], p: [50, 54], e1: [42, 38], a1: [50, 40], k1: [46, 66], f1: [54, 72] }],
  twist: [
    { h: [42, 36], s: [44, 46], p: [50, 66], e1: [54, 52], a1: [60, 56], k1: [62, 56], f1: [72, 62] },
    { h: [42, 36], s: [44, 46], p: [50, 66], e1: [36, 52], a1: [30, 58], k1: [62, 56], f1: [72, 62] }],
  stretch: [
    st({ e1: [46, 12], a1: [44, 2], e2: [54, 12], a2: [56, 2] }),
    st({ h: [58, 64], s: [56, 56], p: [50, 44], e1: [58, 64], a1: [58, 72], e2: undefined, a2: undefined, k2: undefined, f2: undefined })],
};

// The far arm and leg copy the near one when a pose leaves them out.
const TWIN: Partial<Record<keyof Pose, keyof Pose>> = { e2: "e1", a2: "a1", k2: "k1", f2: "f1" };
const BAR: Partial<Record<Pattern, string>> = { pull: "M30 4H70", dip: "M40 40H60" };

function Line({ a, b, dur, op = 1 }: { a: [P, P]; b: [P, P]; dur: string; op?: number }) {
  const anim = (attr: string, x: number, y: number) => (
    <animate attributeName={attr} values={`${x};${y};${x}`} dur={dur} repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
  );
  return (
    <line x1={a[0][0]} y1={a[0][1]} x2={a[1][0]} y2={a[1][1]} strokeOpacity={op}>
      {anim("x1", a[0][0], b[0][0])}{anim("y1", a[0][1], b[0][1])}{anim("x2", a[1][0], b[1][0])}{anim("y2", a[1][1], b[1][1])}
    </line>
  );
}

export function PoseDemo({ pattern, speed = 1, className = "" }: { pattern?: Pattern; speed?: number; className?: string }) {
  if (!pattern) return null;
  const [A, B] = POSES[pattern];
  const dur = `${(2.4 / speed).toFixed(2)}s`;
  const seg = (k1: keyof Pose, k2: keyof Pose, op = 1) => {
    const at = (q: Pose, k: keyof Pose) => (q[k] ?? q[TWIN[k] ?? k])!;
    return <Line key={`${k1}${k2}`} a={[at(A, k1), at(A, k2)]} b={[at(B, k1), at(B, k2)]} dur={dur} op={op} />;
  };
  return (
    <svg viewBox="0 0 100 80" className={`w-full max-w-[220px] ${className}`} role="img" aria-label={`How to move: ${pattern}`}>
      <path d="M4 73H96" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.5" />
      {BAR[pattern] && <path d={BAR[pattern]} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />}
      <g stroke="#7dd3fc" strokeWidth="3.2" strokeLinecap="round">
        {seg("s", "e2", 0.45)}{seg("e2", "a2", 0.45)}{seg("p", "k2", 0.45)}{seg("k2", "f2", 0.45)}
        {seg("s", "p")}{seg("p", "k1")}{seg("k1", "f1")}{seg("s", "e1")}{seg("e1", "a1")}
      </g>
      <circle r="5.5" fill="#7dd3fc" cx={A.h[0]} cy={A.h[1]}>
        <animate attributeName="cx" values={`${A.h[0]};${B.h[0]};${A.h[0]}`} dur={dur} repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
        <animate attributeName="cy" values={`${A.h[1]};${B.h[1]};${A.h[1]}`} dur={dur} repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
      </circle>
    </svg>
  );
}

export const tutorialUrl = (name: string, variant?: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${variant && variant !== "Standard" ? `${variant} ` : ""}${name} proper form`)}`;
