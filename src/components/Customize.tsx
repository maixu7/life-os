"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";
import { ALL_TABS, DEFAULT_TABS, SECTIONS } from "@/lib/ui";

// Choose and order the bottom menu tabs, and hide Base Camp sections.
export function CustomizeSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const ui = profile.settings.ui ?? {};
  const [tabs, setTabs] = useState<string[]>(ui.tabs?.length ? ui.tabs : DEFAULT_TABS);
  const [hide, setHide] = useState<string[]>(ui.hide ?? []);
  const move = (i: number, d: number) => { const t = [...tabs]; const j = i + d; if (j < 0 || j >= t.length) return; [t[i], t[j]] = [t[j], t[i]]; setTabs(t); };
  const toggleTab = (h: string) => setTabs(tabs.includes(h) ? (tabs.length > 3 && h !== "/" ? tabs.filter((x) => x !== h) : tabs) : tabs.length < 7 ? [...tabs, h] : tabs);
  return (
    <Sheet title="🎛️ Customize" onClose={onClose}>
      <div className="text-xs text-muted">Bottom menu: pick 3 to 7 tabs and their order. Base always stays.</div>
      <div className="space-y-1.5">
        {tabs.map((h, i) => {
          const t = ALL_TABS.find((x) => x.href === h)!;
          return (
            <div key={h} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
              <span className="text-xl">{t.icon}</span><span className="flex-1">{t.label}</span>
              <button aria-label={`Move ${t.label} up`} onClick={() => move(i, -1)} className="chip !px-2 !py-0.5">▲</button>
              <button aria-label={`Move ${t.label} down`} onClick={() => move(i, 1)} className="chip !px-2 !py-0.5">▼</button>
              {h !== "/" && <button aria-label={`Remove ${t.label}`} onClick={() => toggleTab(h)} className="chip !px-2 !py-0.5">✕</button>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_TABS.filter((t) => !tabs.includes(t.href)).map((t) => <button key={t.href} disabled={tabs.length >= 7} onClick={() => toggleTab(t.href)} className="chip !py-1 text-xs">+ {t.icon} {t.label}</button>)}
      </div>
      <div className="text-xs text-muted pt-2">Base Camp sections</div>
      <div className="grid gap-1.5">
        {SECTIONS.map(([id, l]) => (
          <label key={id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <input type="checkbox" checked={!hide.includes(id)} onChange={(e) => setHide(e.target.checked ? hide.filter((x) => x !== id) : [...hide, id])} />
            {l}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setTabs(DEFAULT_TABS); setHide([]); }} className="btn-ghost">Reset</button>
        <button onClick={() => { saveSettings({ ui: { tabs, hide } }); onClose(); }} className="btn-primary flex-1">Save</button>
      </div>
    </Sheet>
  );
}
