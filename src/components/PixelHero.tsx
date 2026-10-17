"use client";

import { useId } from "react";
import { DEFAULT_GEAR, type Slot } from "@/lib/gear";
import type { Avatar } from "@/lib/store";

// A 32x48 pixel-art hero built from layered rectangles, wearing the gear
// equipped in each slot and standing on a little platform.

type R = [number, number, number, number, string];

const hex = (c: string) => { const h = c.replace("#", ""); const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0); };
const mix = (c: string, k: number) => { // k<0 darker, k>0 lighter
  const [r, g, b] = hex(c);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

// A block with a lit left edge and a shaded right edge.
const block = (x: number, y: number, w: number, h: number, c: string): R[] => [
  [x, y, w, h, c], [x + w - 1, y, 1, h, mix(c, -0.3)], [x, y, 1, h, mix(c, 0.15)],
];

const BASES: Record<string, [string, string, string]> = { // top, side, accent
  grass: ["#57cc99", "#7f5539", "#38a3a5"], stone: ["#adb5bd", "#6c757d", "#dee2e6"], snow: ["#f1faee", "#a8dadc", "#ffffff"],
  sakura: ["#ffafcc", "#7f5539", "#ff70a6"], lava: ["#ff6d00", "#3d1f1f", "#ffd166"], cloud: ["#ffffff", "#e0e7ff", "#ffd166"],
};

function base(id: string): R[] {
  const [top, side, acc] = BASES[id] ?? BASES.grass;
  const out: R[] = [[4, 42, 24, 2, top], [3, 43, 26, 1, top], [5, 44, 22, 1, side], [6, 45, 20, 1, mix(side, -0.2)], [8, 46, 16, 1, mix(side, -0.35)], [11, 47, 10, 1, mix(side, -0.5)]];
  // little details on top
  for (const x of [5, 9, 22, 26]) out.push([x, 41, 1, 1, acc]);
  if (id === "grass" || id === "sakura") out.push([7, 41, 1, 1, acc], [24, 41, 1, 1, acc]);
  if (id === "lava") out.push([9, 45, 2, 1, "#ffd166"], [19, 46, 2, 1, "#ff6d00"]);
  if (id === "cloud") out.push([2, 43, 1, 1, "#ffffff"], [29, 43, 1, 1, "#ffffff"]);
  return out;
}

function cape(id: string, outfit: string): R[] {
  if (id === "scarf") return [[11, 13, 10, 2, "#e63946"], [20, 14, 2, 1, "#e63946"], [21, 15, 2, 4, "#c1121f"], [23, 18, 1, 3, "#c1121f"]];
  if (id === "cloak") return [[9, 14, 14, 22, "#3c2f5c"], [9, 14, 1, 22, "#2a2040"], [22, 14, 1, 22, "#2a2040"], [10, 36, 12, 1, "#2a2040"]];
  if (id === "royalcape") return [[9, 14, 14, 24, "#c1121f"], [9, 14, 1, 24, "#780000"], [22, 14, 1, 24, "#780000"], [9, 37, 14, 1, "#ffd166"], [11, 13, 10, 1, "#ffd166"]];
  void outfit;
  return [];
}

function chest(id: string, outfit: string): { rects: R[]; sleeve: string } {
  const body = (c: string) => block(10, 14, 12, 13, c);
  switch (id) {
    case "ninja": return { rects: [...body("#1d1f2e"), [13, 14, 6, 2, "#2e3148"], [10, 24, 12, 2, "#c1121f"], [20, 25, 2, 3, "#c1121f"]], sleeve: "#1d1f2e" };
    case "leather": return { rects: [...body("#8b5a2b"), [11, 15, 1, 1, "#5c3b1e"], [12, 16, 1, 1, "#5c3b1e"], [13, 17, 1, 1, "#5c3b1e"], [14, 18, 1, 1, "#5c3b1e"], [15, 19, 1, 1, "#5c3b1e"], [16, 20, 1, 1, "#5c3b1e"], [17, 21, 1, 1, "#5c3b1e"], [10, 24, 12, 2, "#5c3b1e"], [15, 24, 2, 2, "#ffd166"], [12, 21, 2, 3, "#6b4226"]], sleeve: "#a06a3a" };
    case "robe": return { rects: [...block(10, 14, 12, 23, outfit), [15, 14, 2, 23, "#ffd166"], [10, 36, 12, 1, "#ffd166"], [10, 24, 12, 1, mix(outfit, -0.4)]], sleeve: outfit };
    case "plate": return { rects: [...body("#9aa4b1"), [12, 16, 8, 3, "#ced4da"], [15, 16, 2, 9, "#6c757d"], [10, 25, 12, 2, "#495057"], [9, 14, 3, 3, "#ced4da"], [20, 14, 3, 3, "#ced4da"]], sleeve: "#adb5bd" };
    case "dragon": {
      const r: R[] = [...body("#2d6a4f")];
      for (let y = 15; y < 25; y += 2) for (let x = 11 + (y % 4 === 1 ? 0 : 1); x < 21; x += 2) r.push([x, y, 1, 1, "#52b788"]);
      r.push([10, 25, 12, 2, "#ffd166"], [15, 18, 2, 2, "#e63946"], [9, 14, 3, 2, "#ffd166"], [20, 14, 3, 2, "#ffd166"]);
      return { rects: r, sleeve: "#2d6a4f" };
    }
    default: return { rects: [...body(outfit), [14, 14, 4, 2, mix(outfit, -0.35)], [10, 25, 12, 2, "#5c3b1e"], [15, 25, 2, 2, "#ffd166"]], sleeve: outfit };
  }
}

function legs(id: string, pants: string, skin: string): R[] {
  if (id === "shorts") return [...block(11, 27, 5, 6, pants), ...block(16, 27, 5, 6, pants), [11, 33, 4, 6, skin], [17, 33, 4, 6, skin], [14, 33, 1, 6, mix(skin, -0.2)], [20, 33, 1, 6, mix(skin, -0.2)]];
  if (id === "armorlegs") return [...block(11, 27, 5, 12, "#868e96"), ...block(16, 27, 5, 12, "#868e96"), [11, 32, 5, 2, "#ced4da"], [16, 32, 5, 2, "#ced4da"]];
  return [...block(11, 27, 5, 12, pants), ...block(16, 27, 5, 12, pants), [15, 27, 2, 3, mix(pants, -0.3)]];
}

function boots(id: string, shoes: string, skin: string): R[] {
  if (id === "boots") return [[10, 35, 6, 4, "#5c3b1e"], [16, 35, 6, 4, "#5c3b1e"], [10, 39, 6, 2, "#3e2716"], [16, 39, 6, 2, "#3e2716"], [10, 35, 6, 1, "#8b5a2b"], [16, 35, 6, 1, "#8b5a2b"]];
  if (id === "steelboots") return [[10, 36, 6, 3, "#adb5bd"], [16, 36, 6, 3, "#adb5bd"], [10, 39, 6, 2, "#6c757d"], [16, 39, 6, 2, "#6c757d"], [11, 37, 2, 1, "#f8f9fa"], [17, 37, 2, 1, "#f8f9fa"]];
  if (id === "sandals") return [[10, 39, 6, 2, skin], [16, 39, 6, 2, skin], [10, 40, 6, 1, "#8b5a2b"], [16, 40, 6, 1, "#8b5a2b"], [12, 39, 1, 1, "#8b5a2b"], [18, 39, 1, 1, "#8b5a2b"]];
  return [[10, 39, 6, 2, shoes], [16, 39, 6, 2, shoes], [10, 40, 6, 1, "#f8f9fa"], [16, 40, 6, 1, "#f8f9fa"]];
}

function head(a: Avatar): R[] {
  const s = a.skin, hair = a.hair, dk = mix(hair, -0.35);
  const r: R[] = [[14, 12, 4, 2, mix(s, -0.15)], ...block(11, 3, 10, 10, s), [11, 12, 10, 1, mix(s, -0.12)]];
  // eyes
  r.push([13, 7, 2, 2, "#ffffff"], [17, 7, 2, 2, "#ffffff"], [14, 7, 1, 2, a.eyes], [17, 7, 1, 2, a.eyes], [14, 7, 1, 1, "#0b0420"], [17, 7, 1, 1, "#0b0420"]);
  r.push([13, 6, 2, 1, dk], [17, 6, 2, 1, dk]); // brows
  r.push([12, 9, 1, 1, "#ff8fab"], [19, 9, 1, 1, "#ff8fab"]); // blush
  const ex = a.expression ?? 0;
  if (ex === 1) r.push([15, 10, 2, 1, "#7a2e2e"], [14, 9, 1, 1, "#7a2e2e"], [17, 9, 1, 1, "#7a2e2e"]); // big smile
  else if (ex === 2) r.push([14, 10, 4, 1, "#7a2e2e"]); // determined
  else if (ex === 3) r.push([15, 10, 2, 2, "#7a2e2e"]); // surprised
  else r.push([15, 10, 2, 1, "#7a2e2e"], [14, 9, 1, 1, mix(s, -0.3)], [17, 9, 1, 1, mix(s, -0.3)]);
  // hair
  const style = a.hairStyle % 4;
  r.push([10, 1, 12, 3, hair], [11, 0, 10, 1, hair], [10, 4, 2, 3, hair], [20, 4, 2, 3, hair], [12, 4, 3, 1, hair], [17, 4, 2, 1, hair], [21, 1, 1, 3, dk]);
  if (style === 1) r.push([10, 7, 2, 7, hair], [20, 7, 2, 7, hair], [21, 7, 1, 7, dk]); // long
  if (style === 2) r.push([10, -1, 2, 2, hair], [14, -2, 2, 3, hair], [18, -1, 2, 2, hair], [21, 0, 2, 2, hair], [9, 2, 1, 2, hair]); // spiky
  if (style === 3) r.push([18, -1, 3, 2, hair], [19, -2, 2, 1, hair], [21, 4, 2, 6, hair]); // ponytail
  r.push([12, 1, 3, 1, mix(hair, 0.25)]); // shine
  return r;
}

function headgear(id: string, hair: string): R[] {
  switch (id) {
    case "headband": return [[10, 4, 12, 1, "#1d3557"], [14, 3, 4, 2, "#ced4da"], [15, 3, 2, 1, "#f8f9fa"], [22, 4, 2, 1, "#1d3557"], [23, 5, 2, 1, "#1d3557"]];
    case "goggles": return [[10, 4, 12, 1, "#5c3b1e"], [12, 3, 3, 3, "#ffb703"], [17, 3, 3, 3, "#ffb703"], [13, 4, 1, 1, "#fff3b0"], [18, 4, 1, 1, "#fff3b0"]];
    case "hood": return [[9, 0, 14, 4, "#3c2f5c"], [9, 4, 2, 10, "#3c2f5c"], [21, 4, 2, 10, "#2a2040"], [11, 3, 10, 1, "#2a2040"]];
    case "helmet": return [[10, 0, 12, 5, "#9aa4b1"], [10, 5, 2, 5, "#9aa4b1"], [20, 5, 2, 5, "#6c757d"], [15, -2, 2, 2, "#e63946"], [11, 1, 4, 1, "#ced4da"], [21, 0, 1, 5, "#6c757d"]];
    case "catears": return [[10, -2, 2, 3, hair], [11, -1, 1, 1, "#ff8fab"], [20, -2, 2, 3, hair], [20, -1, 1, 1, "#ff8fab"]];
    case "horns": return [[9, -1, 2, 3, "#c1121f"], [8, -3, 2, 2, "#e63946"], [21, -1, 2, 3, "#c1121f"], [22, -3, 2, 2, "#e63946"]];
    case "halo": return [[11, -4, 10, 1, "#ffd166"], [10, -3, 1, 1, "#ffd166"], [21, -3, 1, 1, "#ffd166"], [11, -2, 10, 1, "#ffe8a3"]];
    case "crown": return [[11, -1, 10, 2, "#ffd166"], [11, -3, 2, 2, "#ffd166"], [15, -4, 2, 3, "#ffd166"], [19, -3, 2, 2, "#ffd166"], [15, -3, 2, 1, "#e63946"], [12, 0, 1, 1, "#4cc9f0"], [19, 0, 1, 1, "#4cc9f0"]];
    default: return [];
  }
}

function hands(id: string, skin: string): string { return id === "wraps" ? "#f1faee" : id === "leathergloves" ? "#6b4226" : id === "gauntlets" ? "#adb5bd" : skin; }

function weapon(id: string): R[] {
  switch (id) {
    case "kunai": return [[25, 20, 1, 6, "#ced4da"], [24, 26, 3, 1, "#495057"], [25, 27, 1, 2, "#1d1f2e"], [25, 29, 1, 1, "#ced4da"]];
    case "sword": return [[25, 10, 1, 16, "#dee2e6"], [26, 11, 1, 14, "#adb5bd"], [25, 9, 1, 1, "#f8f9fa"], [23, 26, 5, 1, "#ffd166"], [25, 27, 1, 3, "#5c3b1e"], [25, 30, 1, 1, "#ffd166"]];
    case "torch": return [[25, 20, 1, 11, "#8b5a2b"], [24, 19, 3, 1, "#5c3b1e"]];
    case "bow": return [[26, 13, 1, 2, "#8b5a2b"], [27, 15, 1, 20, "#8b5a2b"], [26, 35, 1, 2, "#8b5a2b"], [25, 14, 1, 22, "#f1faee"]];
    case "staff": return [[25, 8, 1, 31, "#7f5539"], [24, 5, 3, 3, "#b388ff"], [25, 6, 1, 1, "#f1faee"], [24, 8, 3, 1, "#ffd166"]];
    case "katana": return [[25, 6, 1, 20, "#f8f9fa"], [26, 7, 1, 18, "#ced4da"], [24, 26, 3, 1, "#ffd166"], [25, 27, 1, 4, "#c1121f"]];
    default: return [];
  }
}

function offhand(id: string): R[] {
  switch (id) {
    case "book": return [[3, 23, 6, 6, "#c1121f"], [3, 23, 1, 6, "#780000"], [4, 24, 4, 1, "#ffd166"], [8, 24, 1, 4, "#f8f9fa"]];
    case "shield": return [[2, 19, 6, 11, "#8b5a2b"], [1, 21, 8, 7, "#8b5a2b"], [3, 20, 4, 9, "#a06a3a"], [4, 23, 2, 3, "#ffd166"], [1, 21, 1, 7, "#5c3b1e"]];
    case "lantern": return [[5, 27, 1, 2, "#495057"], [4, 29, 3, 4, "#ffd166"], [5, 30, 1, 2, "#fff3b0"], [4, 33, 3, 1, "#495057"]];
    case "orb": return [[3, 21, 4, 4, "#4cc9f0"], [4, 20, 2, 6, "#4cc9f0"], [4, 22, 1, 1, "#f1faee"]];
    default: return [];
  }
}

export function PixelHero({ a, size = 160, portrait = false, gear: override, className = "", animate = true }: {
  a: Avatar; size?: number; portrait?: boolean; gear?: Partial<Record<Slot, string>>; className?: string; animate?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const g = { ...DEFAULT_GEAR, ...(a.gear ?? {}), ...(override ?? {}) };
  const pants = a.pants ?? "#2b2d42", shoes = a.shoes ?? "#212529";
  const ch = chest(g.chest, a.outfit);
  const hand = hands(g.gloves, a.skin);
  const body: R[] = [
    ...(g.cape === "scarf" ? [] : cape(g.cape, a.outfit)),
    ...legs(g.legs, pants, a.skin),
    ...boots(g.boots, shoes, a.skin),
    ...block(7, 15, 3, 11, ch.sleeve), ...block(22, 15, 3, 11, ch.sleeve),
    ...ch.rects,
    [7, 26, 3, 2, hand], [22, 26, 3, 2, hand],
    ...(g.gloves === "gauntlets" ? [[7, 24, 3, 2, "#868e96"], [22, 24, 3, 2, "#868e96"]] as R[] : []),
    ...(g.cape === "scarf" ? cape("scarf", a.outfit) : []),
    ...head(a),
    ...headgear(g.head, a.hair),
    ...weapon(g.weapon),
    ...offhand(g.offhand),
  ];
  const draw = (rs: R[]) => rs.map(([x, y, w, h, c], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={c} />);
  const vb = portrait ? "7 -4 18 18" : "0 -5 32 53";
  const ratio = portrait ? 1 : 53 / 32;
  return (
    <svg viewBox={vb} width={size} height={size * ratio} shapeRendering="crispEdges" className={className} style={{ imageRendering: "pixelated" }}>
      <defs>
        <filter id={`o${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d" />
          <feFlood floodColor="#120a1e" />
          <feComposite in2="d" operator="in" result="line" />
          <feMerge><feMergeNode in="line" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {!portrait && draw(base(g.base))}
      {!portrait && <rect x={9} y={41} width={14} height={1} fill="#000" opacity={0.25} />}
      <g filter={`url(#o${uid})`}>
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -0.6;0 0" keyTimes="0;0.5;1" dur="1.2s" calcMode="discrete" repeatCount="indefinite" />}
        {draw(body)}
        {g.weapon === "torch" && (
          <g>
            <rect x={24} y={16} width={3} height={3} fill="#ff6d00" />
            <rect x={25} y={14} width={1} height={3} fill="#ffd166">
              {animate && <animate attributeName="height" values="3;2;3;4;3" dur="0.6s" calcMode="discrete" repeatCount="indefinite" />}
            </rect>
          </g>
        )}
      </g>
      {g.weapon === "staff" && <circle cx={25.5} cy={6.5} r={3} fill="#b388ff" opacity={0.25} />}
      {g.offhand === "orb" && <circle cx={5} cy={23} r={4} fill="#4cc9f0" opacity={0.2} />}
      {g.offhand === "lantern" && <circle cx={5.5} cy={31} r={4} fill="#ffd166" opacity={0.18} />}
    </svg>
  );
}
