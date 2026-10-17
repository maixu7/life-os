"use client";

import { useState } from "react";

// A glass that fills with animated sloshing liquid. Tap to add one serving.
export function LiquidGlass({
  label, ml, goal, color, onAdd, step = 250,
}: { label: string; ml: number; goal: number; color: string; onAdd: (ml: number) => void; step?: number }) {
  const pct = Math.min(100, (ml / goal) * 100);
  const [splash, setSplash] = useState(0);
  const id = label.replace(/\W/g, "");

  return (
    <button
      onClick={() => {
        setSplash((s) => s + 1);
        navigator.vibrate?.(15);
        onAdd(step);
      }}
      className="card p-3 flex flex-col items-center gap-2 active:scale-95 transition"
    >
      <svg viewBox="0 0 100 130" className="w-24 h-32">
        <defs>
          <clipPath id={`glass-${id}`}>
            <path d="M15 8 L85 8 L76 122 Q75 126 70 126 L30 126 Q25 126 24 122 Z" />
          </clipPath>
          <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.95" />
            <stop offset="1" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#glass-${id})`}>
          <g style={{ transform: `translateY(${126 - (118 * pct) / 100}px)`, transition: "transform .9s cubic-bezier(.3,1.6,.5,1)" }}>
            <path
              key={splash}
              d="M-60 6 Q-45 -2 -30 6 T0 6 T30 6 T60 6 T90 6 T120 6 T150 6 V200 H-60 Z"
              fill={`url(#liq-${id})`}
              style={{ animation: `slosh ${splash ? 1.2 : 3}s ease-in-out infinite` }}
            />
            <path d="M-60 10 Q-45 4 -30 10 T0 10 T30 10 T60 10 T90 10 T120 10 T150 10" stroke="white" strokeOpacity=".35" fill="none" style={{ animation: "slosh 2.4s ease-in-out infinite reverse" }} />
          </g>
        </g>
        <path d="M15 8 L85 8 L76 122 Q75 126 70 126 L30 126 Q25 126 24 122 Z" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="3" />
        <path d="M24 16 L30 110" stroke="white" strokeOpacity=".25" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="text-sm font-bold">{label}</div>
      <div className="text-xs text-muted">{ml} / {goal} ml</div>
    </button>
  );
}
