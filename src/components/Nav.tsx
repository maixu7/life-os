"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "🏠", label: "Today" },
  { href: "/train", icon: "🏋️", label: "Train" },
  { href: "/shop", icon: "🛒", label: "Shop" },
  { href: "/focus", icon: "📖", label: "Focus" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/rank", icon: "⚔️", label: "Rank" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/60 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl grid grid-cols-6">
        {TABS.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] ${on ? "text-[var(--accent)]" : "text-muted"}`}>
              <span className={`text-xl transition ${on ? "scale-125 drop-shadow-[0_0_8px_var(--accent)]" : ""}`}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
