"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/lib/store";
import { ALL_TABS, DEFAULT_TABS, MAX_TABS, SECTIONS, tabOf, type Folder, type Ui } from "@/lib/ui";

// Edit the bottom menu (order, names, icons, add, remove, folder tabs with
// mini tabs inside) and hide Base Camp sections.
export function CustomizeSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const ui0 = profile.settings.ui ?? {};
  const [ui, setUi] = useState<Ui>({ ...ui0, tabs: ui0.tabs?.length ? ui0.tabs : DEFAULT_TABS, hide: ui0.hide ?? [], names: ui0.names ?? {}, folders: ui0.folders ?? [] });
  const tabs = ui.tabs!;
  const [editing, setEditing] = useState<string | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const set = (p: Partial<Ui>) => setUi({ ...ui, ...p });
  const move = (i: number, d: number) => { const t = [...tabs]; const j = i + d; if (j < 0 || j >= t.length) return; [t[i], t[j]] = [t[j], t[i]]; set({ tabs: t }); };
  const rename = (h: string, k: "icon" | "label", v: string) => set({ names: { ...ui.names, [h]: { ...ui.names?.[h], [k]: v } } });
  const inFolders = new Set(ui.folders!.flatMap((f) => (tabs.includes(`folder:${f.id}`) ? f.items : [])));
  const saveFolder = () => {
    if (!folder || !folder.label.trim()) return;
    const exists = ui.folders!.some((f) => f.id === folder.id);
    const folders = exists ? ui.folders!.map((f) => (f.id === folder.id ? folder : f)) : [...ui.folders!, folder];
    const h = `folder:${folder.id}`;
    set({ folders, tabs: tabs.includes(h) ? tabs : [...tabs, h].slice(0, MAX_TABS) });
    setFolder(null);
  };

  return (
    <Sheet title="🎛️ Edit menu & screens" onClose={onClose}>
      <div className="text-xs text-muted">Bottom menu: up to {MAX_TABS} tabs. Use ▲▼ to move, ✏️ to rename or change the icon, ✕ to remove. Tip: long-press the menu to open this anytime.</div>
      <div className="space-y-1.5">
        {tabs.map((h, i) => {
          const t = tabOf(h, ui);
          if (!t) return null;
          return (
            <div key={h} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">{t.icon}</span>
                <span className="flex-1 min-w-0 truncate">{t.label}{t.items ? <span className="text-xs text-muted"> · folder ({t.items.length})</span> : null}</span>
                <button aria-label={`Move ${t.label} up`} onClick={() => move(i, -1)} className="chip !px-2 !py-0.5">▲</button>
                <button aria-label={`Move ${t.label} down`} onClick={() => move(i, 1)} className="chip !px-2 !py-0.5">▼</button>
                <button aria-label={`Edit ${t.label}`} onClick={() => (t.items ? setFolder(ui.folders!.find((f) => `folder:${f.id}` === h) ?? null) : setEditing(editing === h ? null : h))} className="chip !px-2 !py-0.5">✏️</button>
                <button aria-label={`Remove ${t.label}`} disabled={tabs.length <= 2} onClick={() => set({ tabs: tabs.filter((x) => x !== h) })} className="chip !px-2 !py-0.5">✕</button>
              </div>
              {editing === h && (
                <div className="mt-2 grid grid-cols-[4rem_1fr] gap-2">
                  <input aria-label="Icon" className="input text-center text-xl" value={ui.names?.[h]?.icon ?? t.icon} onChange={(e) => rename(h, "icon", e.target.value)} />
                  <input aria-label="Name" className="input" value={ui.names?.[h]?.label ?? t.label} onChange={(e) => rename(h, "label", e.target.value)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-muted">Add a tab</div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_TABS.filter((t) => !tabs.includes(t.href)).map((t) => <button key={t.href} disabled={tabs.length >= MAX_TABS} onClick={() => set({ tabs: [...tabs, t.href] })} className="chip !py-1 text-xs">+ {t.icon} {t.label}</button>)}
        <button disabled={tabs.length >= MAX_TABS && !folder} onClick={() => setFolder({ id: String(Date.now()), icon: "📁", label: "", items: [] })} className="chip !py-1 text-xs border-dashed">+ 📁 Folder (main tab with mini tabs)</button>
      </div>
      {inFolders.size > 0 && <div className="text-[10px] text-muted">Pages inside folders: {[...inFolders].map((h) => tabOf(h, ui)?.label).join(", ")}</div>}

      {folder && (
        <div className="rounded-xl border border-[var(--accent2)]/40 p-3 space-y-2">
          <div className="text-xs font-semibold">📁 Folder tab</div>
          <div className="grid grid-cols-[4rem_1fr] gap-2">
            <input aria-label="Folder icon" className="input text-center text-xl" value={folder.icon} onChange={(e) => setFolder({ ...folder, icon: e.target.value })} />
            <input aria-label="Folder name" className="input" placeholder="Folder name (e.g. Body)" value={folder.label} onChange={(e) => setFolder({ ...folder, label: e.target.value })} />
          </div>
          <div className="text-xs text-muted">Mini tabs inside</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TABS.map((t) => (
              <button key={t.href} onClick={() => setFolder({ ...folder, items: folder.items.includes(t.href) ? folder.items.filter((x) => x !== t.href) : [...folder.items, t.href] })}
                className={`chip !py-1 text-xs ${folder.items.includes(t.href) ? "chip-on" : ""}`}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {ui.folders!.some((f) => f.id === folder.id) && <button onClick={() => { set({ folders: ui.folders!.filter((f) => f.id !== folder.id), tabs: tabs.filter((x) => x !== `folder:${folder.id}`) }); setFolder(null); }} className="btn-ghost text-rose-300">Delete folder</button>}
            <button onClick={saveFolder} disabled={!folder.label.trim() || !folder.items.length} className="btn-primary flex-1">Save folder</button>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm rounded-xl bg-white/5 px-3 py-2">
        <input type="checkbox" checked={ui.startLeft !== false} onChange={(e) => set({ startLeft: e.target.checked })} /> Open the app on the leftmost tab
      </label>

      <div className="text-xs text-muted pt-2">Base Camp sections</div>
      <div className="grid gap-1.5">
        {SECTIONS.map(([id, l]) => (
          <label key={id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <input type="checkbox" checked={!ui.hide!.includes(id)} onChange={(e) => set({ hide: e.target.checked ? ui.hide!.filter((x) => x !== id) : [...ui.hide!, id] })} />
            {l}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setUi({ tabs: DEFAULT_TABS, hide: [], names: {}, folders: [] })} className="btn-ghost">Reset</button>
        <button onClick={() => { saveSettings({ ui }); onClose(); }} className="btn-primary flex-1">Save</button>
      </div>
    </Sheet>
  );
}
