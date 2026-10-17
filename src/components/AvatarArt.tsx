import { useId } from "react";
import type { Avatar } from "@/lib/store";

export const HAIR_STYLES = ["Spiky", "Long", "Bob", "Ponytail", "Short"];
export const ACCESSORIES = ["None", "Headband", "Glasses", "Cat ears", "Crown", "Horns", "Halo"];
export const EXPRESSIONS = ["Smile", "Grin", "Calm", "Determined", "Wink"];
export const CLASSES = [
  { name: "Ninja", icon: "🥷" }, { name: "Warrior", icon: "⚔️" }, { name: "Mage", icon: "🔮" },
  { name: "Scholar", icon: "📜" }, { name: "Archer", icon: "🏹" }, { name: "Samurai", icon: "🗡️" },
];
export const SKINS = ["#ffe0cc", "#f6d2b8", "#e8b896", "#c98e66", "#a46b47", "#6e4630"];
export const HAIRS = ["#2b2d42", "#5c3d2e", "#f4d35e", "#e63946", "#4cc9f0", "#f1f1f1", "#b5179e", "#2a9d8f"];
export const EYES = ["#4cc9f0", "#7b2cbf", "#e63946", "#2a9d8f", "#5c3d2e", "#f4a261"];
export const OUTFITS = ["#7b2cbf", "#e63946", "#1d3557", "#2a9d8f", "#f4a261", "#111111", "#ff4fd8"];
export const PANTS = ["#22223b", "#1d3557", "#3a3a3a", "#5c3d2e", "#e9ecef", "#2a9d8f"];
export const SHOES = ["#f1f1f1", "#111111", "#e63946", "#5c3d2e", "#4cc9f0"];

// Lightens (amt > 0) or darkens (amt < 0) a #rrggbb colour, for 3D shading.
function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Defs({ a, id }: { a: Avatar; id: string }) {
  return (
    <>
      <linearGradient id={`${id}skin`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={shade(a.skin, 0.25)} /><stop offset="0.6" stopColor={a.skin} /><stop offset="1" stopColor={shade(a.skin, -0.18)} />
      </linearGradient>
      <linearGradient id={`${id}hair`} x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={shade(a.hair, 0.35)} /><stop offset="0.45" stopColor={a.hair} /><stop offset="1" stopColor={shade(a.hair, -0.4)} />
      </linearGradient>
      <radialGradient id={`${id}iris`} cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stopColor={shade(a.eyes, 0.55)} /><stop offset="0.55" stopColor={a.eyes} /><stop offset="1" stopColor={shade(a.eyes, -0.55)} />
      </radialGradient>
      <linearGradient id={`${id}cloth`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={shade(a.outfit, 0.3)} /><stop offset="0.5" stopColor={a.outfit} /><stop offset="1" stopColor={shade(a.outfit, -0.45)} />
      </linearGradient>
      <linearGradient id={`${id}pants`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={shade(a.pants ?? PANTS[0], 0.25)} /><stop offset="1" stopColor={shade(a.pants ?? PANTS[0], -0.4)} />
      </linearGradient>
      <radialGradient id={`${id}blush`}><stop offset="0" stopColor="#ff6b8b" stopOpacity=".55" /><stop offset="1" stopColor="#ff6b8b" stopOpacity="0" /></radialGradient>
    </>
  );
}

// The head, drawn in a 200x200 box (face centre about 100,100).
function Head({ a, id }: { a: Avatar; id: string }) {
  const hair = `url(#${id}hair)`;
  const skin = `url(#${id}skin)`;
  const ex = a.expression ?? 0;
  const back: Record<number, React.ReactNode> = {
    1: <path d="M44 70 Q36 150 54 182 Q72 170 76 140 L124 140 Q128 170 146 182 Q164 150 156 70 Z" fill={hair} />,
    2: <path d="M46 70 Q40 126 58 140 L142 140 Q160 126 154 70 Z" fill={hair} />,
    3: <path d="M140 62 Q192 66 178 150 Q172 128 150 108 Z" fill={hair} />,
  };
  const front: Record<number, React.ReactNode> = {
    0: <path d="M50 84 L42 52 L66 64 L60 30 L84 54 L94 20 L106 52 L126 26 L126 58 L152 40 L144 72 L160 70 L148 94 Q140 64 100 60 Q60 64 52 94 Z" fill={hair} />,
    1: <path d="M50 94 Q46 44 100 40 Q154 44 150 94 Q138 64 112 66 Q104 80 82 70 Q64 72 50 94 Z" fill={hair} />,
    2: <path d="M50 98 Q44 42 100 38 Q156 42 150 98 Q148 70 130 68 L70 68 Q52 70 50 98 Z" fill={hair} />,
    3: <path d="M52 90 Q48 42 100 40 Q152 42 148 90 Q132 62 104 64 Q76 62 52 90 Z" fill={hair} />,
    4: <path d="M54 86 Q50 46 100 44 Q150 46 146 86 Q140 66 120 62 L80 62 Q60 66 54 86 Z" fill={hair} />,
  };
  const eye = (x: number, wink: boolean) => wink ? (
    <path key={x} d={`M${x - 11} 102 Q${x} 94 ${x + 11} 102`} stroke="#2b2d42" strokeWidth="3.5" fill="none" strokeLinecap="round" />
  ) : (
    <g key={x}>
      <ellipse cx={x} cy="101" rx="11.5" ry={ex === 2 ? 10 : 13.5} fill="#fff" />
      <ellipse cx={x} cy="103" rx="8.5" ry={ex === 2 ? 8 : 11} fill={`url(#${id}iris)`} />
      <ellipse cx={x} cy="105" rx="4" ry="5.5" fill="#0b0716" />
      <circle cx={x - 3.5} cy="97" r="3.4" fill="#fff" />
      <circle cx={x + 3.5} cy="108" r="1.6" fill="#fff" opacity=".85" />
      {/* upper lid with lashes */}
      <path d={`M${x - 13} 92 Q${x} ${ex === 3 ? 90 : 84} ${x + 13} 92`} stroke="#1d1b2c" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d={x < 100 ? `M${x - 13} 92 L${x - 17} 88` : `M${x + 13} 92 L${x + 17} 88`} stroke="#1d1b2c" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${x - 7} 115 Q${x} 117 ${x + 7} 115`} stroke="#1d1b2c" strokeOpacity=".35" strokeWidth="1.4" fill="none" />
    </g>
  );
  const mouth = [
    <path key="0" d="M90 128 Q100 136 110 128" stroke="#8a3a46" strokeWidth="2.8" fill="none" strokeLinecap="round" />,
    <g key="1"><path d="M88 126 Q100 142 112 126 Z" fill="#7a2a3a" /><path d="M93 133 Q100 138 107 133 Q100 136 93 133 Z" fill="#ff8fa3" /><path d="M89 126.5 L111 126.5" stroke="#fff" strokeWidth="2.4" /></g>,
    <path key="2" d="M93 130 Q100 132 107 130" stroke="#8a3a46" strokeWidth="2.4" fill="none" strokeLinecap="round" />,
    <path key="3" d="M91 131 Q100 127 109 131" stroke="#8a3a46" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
    <path key="4" d="M90 127 Q101 137 111 126" stroke="#8a3a46" strokeWidth="2.8" fill="none" strokeLinecap="round" />,
  ][ex] ?? null;
  const brow = (x: number) => ex === 3
    ? <path key={x} d={x < 100 ? `M${x - 12} 82 L${x + 10} 87` : `M${x - 10} 87 L${x + 12} 82`} stroke={shade(a.hair, -0.3)} strokeWidth="3.4" strokeLinecap="round" />
    : <path key={x} d={`M${x - 11} 83 Q${x} 78 ${x + 11} 82`} stroke={shade(a.hair, -0.3)} strokeWidth="3" fill="none" strokeLinecap="round" />;
  return (
    <g>
      {back[a.hairStyle]}
      <rect x="88" y="128" width="24" height="30" rx="8" fill={shade(a.skin, -0.15)} />
      {/* face with soft 3D shading */}
      <path d="M56 88 Q55 138 100 148 Q145 138 144 88 Q144 52 100 52 Q56 52 56 88 Z" fill={skin} />
      <path d="M60 80 Q100 70 140 80 L140 92 Q100 82 60 92 Z" fill={shade(a.skin, -0.25)} opacity=".25" />
      <ellipse cx="55" cy="100" rx="6.5" ry="10" fill={shade(a.skin, -0.08)} />
      <ellipse cx="145" cy="100" rx="6.5" ry="10" fill={shade(a.skin, -0.12)} />
      {[78, 122].map(brow)}
      {eye(78, false)}
      {eye(122, ex === 4)}
      <ellipse cx="68" cy="121" rx="10" ry="5" fill={`url(#${id}blush)`} />
      <ellipse cx="132" cy="121" rx="10" ry="5" fill={`url(#${id}blush)`} />
      <path d="M101 112 Q103 118 99 119" stroke={shade(a.skin, -0.35)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {mouth}
      {front[a.hairStyle] ?? front[0]}
      {/* hair shine */}
      <path d="M70 58 Q90 48 112 50" stroke="#fff" strokeOpacity=".35" strokeWidth="4" fill="none" strokeLinecap="round" />
      {a.accessory === 1 && (
        <g>
          <rect x="52" y="72" width="96" height="11" rx="3" fill="#2b2d42" />
          <rect x="88" y="70" width="24" height="15" rx="3" fill="#ced4da" stroke="#495057" />
          <path d="M148 76 L174 68 L164 86 Z" fill="#2b2d42" />
        </g>
      )}
      {a.accessory === 2 && (
        <g fill="#ffffff22" stroke="#212529" strokeWidth="3"><circle cx="78" cy="102" r="15" /><circle cx="122" cy="102" r="15" /><path d="M93 102 L107 102" /></g>
      )}
      {a.accessory === 3 && (
        <g fill={hair}>
          <path d="M56 60 L60 20 L86 48 Z" /><path d="M144 60 L140 20 L114 48 Z" />
          <path d="M62 52 L64 32 L78 47 Z" fill="#ff9fb8" /><path d="M138 52 L136 32 L122 47 Z" fill="#ff9fb8" />
        </g>
      )}
      {a.accessory === 4 && <path d="M70 46 L76 20 L88 38 L100 14 L112 38 L124 20 L130 46 Z" fill="#ffd166" stroke="#e09f3e" strokeWidth="2" />}
      {a.accessory === 5 && <g fill="#e63946"><path d="M66 56 Q56 28 72 16 Q70 38 80 52 Z" /><path d="M134 56 Q144 28 128 16 Q130 38 120 52 Z" /></g>}
      {a.accessory === 6 && <ellipse cx="100" cy="24" rx="34" ry="8" fill="none" stroke="#ffe066" strokeWidth="5" style={{ filter: "drop-shadow(0 0 6px #ffe066)" }} />}
    </g>
  );
}

function Weapon({ cls }: { cls: string }) {
  switch (cls) {
    case "Warrior": return <g><rect x="160" y="150" width="6" height="110" rx="2" fill="#ced4da" stroke="#868e96" /><rect x="150" y="250" width="26" height="6" rx="2" fill="#e09f3e" /><rect x="159" y="256" width="8" height="20" rx="2" fill="#5c3d2e" /></g>;
    case "Mage": return <g><rect x="160" y="140" width="6" height="200" rx="3" fill="#5c3d2e" /><circle cx="163" cy="134" r="12" fill="#b388ff" style={{ filter: "drop-shadow(0 0 8px #b388ff)" }} /></g>;
    case "Scholar": return <g><rect x="150" y="226" width="30" height="36" rx="3" fill="#8d5524" /><rect x="153" y="229" width="24" height="30" fill="#f8f1e5" /><path d="M165 229 L165 259" stroke="#8d5524" /></g>;
    case "Archer": return <g fill="none" stroke="#8d5524" strokeWidth="4"><path d="M168 150 Q196 230 168 310" /><path d="M168 150 L168 310" stroke="#f1f1f1" strokeWidth="1" /></g>;
    case "Samurai": return <g><rect x="161" y="130" width="5" height="140" rx="2" fill="#e9ecef" stroke="#868e96" transform="rotate(12 163 240)" /><rect x="152" y="262" width="22" height="5" rx="2" fill="#111" transform="rotate(12 163 240)" /></g>;
    default: return <g><path d="M158 238 L172 220 L176 226 L162 242 Z" fill="#adb5bd" stroke="#495057" /><circle cx="157" cy="242" r="4" fill="none" stroke="#495057" strokeWidth="2" /></g>;
  }
}

// Anime hero. `full` draws the whole body with shading; otherwise a portrait.
export function AvatarArt({ a, size = 160, glow = true, full = false, aura }: { a: Avatar; size?: number; glow?: boolean; full?: boolean; aura?: string }) {
  const id = useId().replace(/:/g, "");
  if (full) {
    const cloth = `url(#${id}cloth)`;
    const pants = `url(#${id}pants)`;
    const shoes = a.shoes ?? SHOES[0];
    const skin = `url(#${id}skin)`;
    return (
      <svg viewBox="0 0 200 380" width={size * (200 / 380)} height={size} role="img" aria-label="Hero full body">
        <defs>
          <Defs a={a} id={id} />
          <radialGradient id={`${id}aura`} cx=".5" cy=".45" r=".55"><stop offset="0" stopColor={aura ?? a.outfit} stopOpacity=".55" /><stop offset="1" stopColor={aura ?? a.outfit} stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="100" cy="190" rx="100" ry="190" fill={`url(#${id}aura)`} />
        <ellipse cx="100" cy="366" rx="52" ry="8" fill="#000" opacity=".35" />
        {/* legs */}
        <path d="M70 240 L66 350 L94 350 L98 262 L102 262 L106 350 L134 350 L130 240 Z" fill={pants} />
        <path d="M100 262 L100 340" stroke="#000" strokeOpacity=".25" strokeWidth="2" />
        <path d="M60 348 Q60 340 70 340 L96 340 Q100 350 96 360 L62 360 Q58 356 60 348 Z" fill={shoes} stroke={shade(shoes, -0.4)} />
        <path d="M140 348 Q140 340 130 340 L104 340 Q100 350 104 360 L138 360 Q142 356 140 348 Z" fill={shoes} stroke={shade(shoes, -0.4)} />
        {/* arms */}
        <path d="M58 140 Q40 160 40 230 L54 232 Q56 180 70 158 Z" fill={cloth} />
        <path d="M142 140 Q160 160 160 230 L146 232 Q144 180 130 158 Z" fill={cloth} />
        <circle cx="47" cy="238" r="9" fill={skin} />
        <circle cx="153" cy="238" r="9" fill={skin} />
        <rect x="90" y="100" width="20" height="42" rx="6" fill={shade(a.skin, -0.15)} />
        {/* torso */}
        <path d="M58 140 Q100 122 142 140 L136 246 Q100 256 64 246 Z" fill={cloth} />
        <path d="M84 132 L100 166 L116 132" fill={shade(a.skin, -0.05)} />
        <path d="M84 132 L100 166 L116 132" fill="none" stroke="#ffffff66" strokeWidth="3" />
        <path d="M100 166 L100 236" stroke="#00000033" strokeWidth="2" />
        <rect x="64" y="226" width="72" height="10" rx="3" fill={shade(a.outfit, -0.6)} />
        <rect x="94" y="224" width="12" height="14" rx="2" fill="#ffd166" />
        <text x="122" y="186" fontSize="16" textAnchor="middle">{CLASSES.find((c) => c.name === a.heroClass)?.icon}</text>
        <Weapon cls={a.heroClass} />
        <g transform="translate(22 -6) scale(0.78)"><Head a={a} id={id} /></g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Hero avatar">
      <defs>
        <Defs a={a} id={id} />
        <radialGradient id={`${id}bg`} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor={a.outfit} stopOpacity=".55" />
          <stop offset="1" stopColor="#0b0716" stopOpacity="1" />
        </radialGradient>
        <clipPath id={`${id}clip`}><circle cx="100" cy="100" r="96" /></clipPath>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${id}bg)`} />
      <g clipPath={`url(#${id}clip)`}>
        <path d="M30 200 Q36 152 100 146 Q164 152 170 200 Z" fill={`url(#${id}cloth)`} />
        <path d="M78 148 L100 176 L122 148" fill="none" stroke="#ffffff66" strokeWidth="4" />
        <Head a={a} id={id} />
      </g>
      {glow && <circle cx="100" cy="100" r="96" fill="none" stroke={a.outfit} strokeWidth="4" style={{ filter: `drop-shadow(0 0 8px ${a.outfit})` }} />}
    </svg>
  );
}
