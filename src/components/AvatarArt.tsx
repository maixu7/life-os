import type { Avatar } from "@/lib/store";

export const HAIR_STYLES = ["Spiky", "Long", "Bob", "Ponytail", "Short"];
export const ACCESSORIES = ["None", "Headband", "Glasses", "Cat ears", "Crown", "Horns"];
export const CLASSES = [
  { name: "Ninja", icon: "🥷" }, { name: "Warrior", icon: "⚔️" }, { name: "Mage", icon: "🔮" },
  { name: "Scholar", icon: "📜" }, { name: "Archer", icon: "🏹" }, { name: "Samurai", icon: "🗡️" },
];
export const SKINS = ["#ffe0cc", "#f6d2b8", "#e8b896", "#c98e66", "#a46b47", "#6e4630"];
export const HAIRS = ["#2b2d42", "#5c3d2e", "#f4d35e", "#e63946", "#4cc9f0", "#f1f1f1", "#b5179e", "#2a9d8f"];
export const EYES = ["#4cc9f0", "#7b2cbf", "#e63946", "#2a9d8f", "#5c3d2e", "#f4a261"];
export const OUTFITS = ["#7b2cbf", "#e63946", "#1d3557", "#2a9d8f", "#f4a261", "#111111", "#ff4fd8"];

// Anime-style hero portrait drawn in SVG, so every part can be changed.
export function AvatarArt({ a, size = 160, glow = true }: { a: Avatar; size?: number; glow?: boolean }) {
  const hair = a.hair;
  const back: Record<number, React.ReactNode> = {
    1: <path d="M44 70 Q40 150 56 176 L144 176 Q160 150 156 70 Z" fill={hair} />,
    2: <path d="M46 70 Q42 128 60 136 L140 136 Q158 128 154 70 Z" fill={hair} />,
    3: <path d="M138 64 Q186 70 170 150 Q160 120 146 104 Z" fill={hair} />,
  };
  const front: Record<number, React.ReactNode> = {
    0: <path d="M50 82 L44 52 L66 64 L62 34 L84 56 L94 24 L106 54 L124 30 L124 60 L150 42 L142 72 L158 70 L148 92 Q140 62 100 58 Q60 62 52 92 Z" fill={hair} />,
    1: <path d="M50 92 Q48 46 100 42 Q152 46 150 92 Q136 64 112 66 Q104 78 82 70 Q64 72 50 92 Z" fill={hair} />,
    2: <path d="M50 96 Q46 44 100 40 Q154 44 150 96 Q148 70 130 68 L70 68 Q52 70 50 96 Z" fill={hair} />,
    3: <path d="M52 88 Q50 44 100 42 Q150 44 148 88 Q132 62 104 64 Q76 62 52 88 Z" fill={hair} />,
    4: <path d="M54 84 Q52 48 100 46 Q148 48 146 84 Q140 66 120 62 L80 62 Q60 66 54 84 Z" fill={hair} />,
  };
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Hero avatar">
      <defs>
        <radialGradient id="av-bg" cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor={a.outfit} stopOpacity=".55" />
          <stop offset="1" stopColor="#0b0716" stopOpacity="1" />
        </radialGradient>
        <clipPath id="av-clip"><circle cx="100" cy="100" r="96" /></clipPath>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#av-bg)" />
      <g clipPath="url(#av-clip)">
        {back[a.hairStyle]}
        {/* shoulders and outfit */}
        <path d="M30 200 Q36 154 100 148 Q164 154 170 200 Z" fill={a.outfit} />
        <path d="M76 150 L100 178 L124 150" fill="none" stroke="#ffffff55" strokeWidth="4" />
        <rect x="88" y="128" width="24" height="26" rx="8" fill={a.skin} />
        {/* face */}
        <path d="M56 86 Q56 140 100 146 Q144 140 144 86 Q144 52 100 52 Q56 52 56 86 Z" fill={a.skin} />
        <ellipse cx="56" cy="98" rx="6" ry="10" fill={a.skin} />
        <ellipse cx="144" cy="98" rx="6" ry="10" fill={a.skin} />
        {/* eyes */}
        {[78, 122].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="100" rx="11" ry="13" fill="#fff" />
            <ellipse cx={x} cy="102" rx="8" ry="10.5" fill={a.eyes} />
            <ellipse cx={x} cy="104" rx="4" ry="5.5" fill="#0b0716" />
            <circle cx={x - 3} cy="97" r="3" fill="#fff" />
            <circle cx={x + 3} cy="107" r="1.5" fill="#fff" opacity=".8" />
            <path d={`M${x - 12} 88 Q${x} 82 ${x + 12} 88`} stroke="#2b2d42" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <ellipse cx="70" cy="120" rx="7" ry="3.5" fill="#ff7b9c" opacity=".45" />
        <ellipse cx="130" cy="120" rx="7" ry="3.5" fill="#ff7b9c" opacity=".45" />
        <path d="M100 112 L98 118 L101 118" stroke="#00000033" strokeWidth="1.5" fill="none" />
        <path d="M92 128 Q100 134 108 128" stroke="#7a3a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {front[a.hairStyle] ?? front[0]}
        {/* accessories */}
        {a.accessory === 1 && (
          <g>
            <rect x="52" y="72" width="96" height="11" rx="3" fill="#2b2d42" />
            <rect x="88" y="70" width="24" height="15" rx="3" fill="#adb5bd" stroke="#495057" />
            <path d="M148 76 L172 70 L164 84 Z" fill="#2b2d42" />
          </g>
        )}
        {a.accessory === 2 && (
          <g fill="none" stroke="#212529" strokeWidth="3">
            <circle cx="78" cy="101" r="14" /><circle cx="122" cy="101" r="14" /><path d="M92 101 L108 101" />
          </g>
        )}
        {a.accessory === 3 && (
          <g fill={hair}>
            <path d="M56 60 L60 22 L86 48 Z" /><path d="M144 60 L140 22 L114 48 Z" />
            <path d="M62 52 L64 32 L78 47 Z" fill="#ff9fb8" /><path d="M138 52 L136 32 L122 47 Z" fill="#ff9fb8" />
          </g>
        )}
        {a.accessory === 4 && <path d="M70 46 L76 22 L88 38 L100 16 L112 38 L124 22 L130 46 Z" fill="#ffd166" stroke="#e09f3e" strokeWidth="2" />}
        {a.accessory === 5 && (
          <g fill="#e63946"><path d="M66 56 Q56 30 72 18 Q70 38 80 52 Z" /><path d="M134 56 Q144 30 128 18 Q130 38 120 52 Z" /></g>
        )}
      </g>
      {glow && <circle cx="100" cy="100" r="96" fill="none" stroke={a.outfit} strokeWidth="4" style={{ filter: `drop-shadow(0 0 8px ${a.outfit})` }} />}
    </svg>
  );
}
