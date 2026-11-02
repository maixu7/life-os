"use client";

import { ReportButton } from "@/components/Summary";
import Link from "next/link";
import { Bell } from "@/components/hub/Talk";
import { useT } from "@/lib/i18n";

// The page name at the top of every screen, with its buttons.
export function XpHeader({ title, icon, subtitle }: { title: string; icon?: string; subtitle?: string }) {
  const t = useT();
  return (
    <header className="mb-5 flex items-end gap-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-black">{t(title)}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <ReportButton />
      <Bell />
      <Link href="/settings" aria-label="Settings" title="Settings" className="shrink-0 h-10 w-10 rounded-xl border border-white/15 bg-white/5 grid place-items-center text-lg active:scale-90">⚙️</Link>
      <Link href="/control" aria-label="Control Centre" title="Control Centre" className="shrink-0 h-10 w-10 rounded-xl border border-white/15 bg-white/5 grid place-items-center text-lg active:scale-90">🎛️</Link>
    </header>
  );
}
