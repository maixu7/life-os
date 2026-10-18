"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { tabOf, tabsOf } from "@/lib/ui";

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { profile } = useApp();
  const ui = profile.settings.ui;
  const TABS = tabsOf(ui);
  const [folder, setFolder] = useState<string | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const long = useRef(false);

  // The app opens on the leftmost tab (once per launch).
  useEffect(() => {
    try {
      if (sessionStorage.getItem("lifeos-started")) return;
      sessionStorage.setItem("lifeos-started", "1");
    } catch { return; }
    const first = TABS[0];
    if (ui?.startLeft === false || !first || first.href === "/" || first.items) return;
    if (path === "/" && !location.search) router.replace(first.href);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Long-press any tab to edit the menu.
  const hold = {
    onPointerDown: () => { long.current = false; press.current = setTimeout(() => { long.current = true; navigator.vibrate?.(30); router.push("/control?tab=menu"); }, 550); },
    onPointerUp: () => press.current && clearTimeout(press.current),
    onPointerLeave: () => press.current && clearTimeout(press.current),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const open = folder ? tabOf(folder, ui) : null;
  const many = TABS.length > 7;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setFolder(null)}>
          <div className="absolute bottom-20 left-3 right-3 mx-auto max-w-md card p-3 grid grid-cols-4 gap-2 pb-[calc(env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="col-span-4 text-xs text-muted">{open.icon} {open.label}</div>
            {(open.items ?? []).map((h) => tabOf(h, ui)).filter(Boolean).map((t) => (
              <Link key={t!.href} href={t!.href} onClick={() => setFolder(null)} className={`rounded-xl bg-white/5 py-2 flex flex-col items-center text-[10px] ${on(t!.href) ? "text-[var(--accent2)]" : ""}`}>
                <span className="text-2xl">{t!.icon}</span>{t!.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[#08051a]/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
          {TABS.map((t) => {
            const active = t.items ? t.items.some(on) : on(t.href);
            const cls = `relative py-2 flex flex-col items-center gap-0.5 ${many ? "text-[8px]" : "text-[9px]"} font-game uppercase tracking-wide select-none ${active ? "text-[var(--accent2)]" : "text-muted"}`;
            const body = (
              <>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--accent2)] shadow-[0_0_10px_var(--accent2)]" />}
                <span className={`${many ? "text-lg" : "text-xl"} transition ${active ? "scale-125 drop-shadow-[0_0_8px_var(--accent2)]" : "grayscale-[40%]"}`}>{t.icon}</span>
                <span className="truncate max-w-full px-0.5">{t.label}</span>
              </>
            );
            return t.items ? (
              <button key={t.href} {...hold} onClick={() => !long.current && setFolder(folder ? null : t.href)} className={cls}>{body}</button>
            ) : (
              <Link key={t.href} href={t.href} {...hold} onClick={(e) => { if (long.current) e.preventDefault(); }} className={cls}>{body}</Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
