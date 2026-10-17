"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { tabsOf } from "@/lib/ui";

export function Nav() {
  const path = usePathname();
  const { profile } = useApp();
  const TABS = tabsOf(profile.settings.ui);
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[#08051a]/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href}
              className={`relative py-2 flex flex-col items-center gap-0.5 text-[9px] font-game uppercase tracking-wide ${on ? "text-[var(--accent2)]" : "text-muted"}`}>
              {on && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-[var(--accent2)] shadow-[0_0_10px_var(--accent2)]" />}
              <span className={`text-xl transition ${on ? "scale-125 drop-shadow-[0_0_8px_var(--accent2)]" : "grayscale-[40%]"}`}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
