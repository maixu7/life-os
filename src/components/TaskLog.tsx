"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { judge, searchTasks, TASKS } from "@/lib/tasks";
import { useApp, useCustomItems } from "@/lib/store";
import { taskGoodness } from "@/lib/goodness";
import { GoodBadge } from "@/components/GoodBadge";
import { StudyLock } from "@/components/FixCard";

const DEED = { good: ["😇", "Good deed", "text-emerald-300"], bad: ["😈", "Bad deed (time waste)", "text-rose-300"], neutral: ["⚖️", "Neutral", "text-muted"] } as const;

// Log anything you did. The app decides if it was a good or bad deed (you can
// overrule it) and counts the time.
export function TaskLog({ onClose, at }: { onClose: () => void; at?: Date }) {
  const { logActivity, celebrate } = useApp();
  const { items, add } = useCustomItems("activity");
  const [q, setQ] = useState("");
  const [minutes, setMinutes] = useState("");
  const [deed, setDeed] = useState<"good" | "bad" | "neutral" | null>(null);
  const list = q.trim() ? searchTasks(q, 40) : TASKS.slice(0, 0);
  const j = q.trim() ? judge(q) : null;
  const d = deed ?? j?.deed ?? "neutral";
  const save = (name = q.trim()) => {
    if (!name) return;
    const t = judge(name);
    const dd = deed ?? t.deed;
    const mins = Number(minutes) || TASKS.find((x) => x.name === name)?.minutes || undefined;
    const row = logActivity("activity", { name, emoji: t.emoji, minutes: mins, cat: t.cat, alignment: dd === "bad" ? "shadow" : dd === "good" ? "light" : undefined }, at);
    celebrate({ title: dd === "bad" ? "LOGGED (DEVIL +1)" : dd === "good" ? "GOOD DEED!" : "LOGGED", subtitle: `${t.emoji} ${name}${mins ? ` · ${mins} min` : ""}`, xp: row.xp });
    onClose();
  };
  return (
    <Sheet title="📝 Log anything you did" onClose={onClose}>
      <input autoFocus className="input" placeholder={`Search ${TASKS.length} tasks (wash dishes, scrolling, study kanji…)`} value={q} onChange={(e) => { setQ(e.target.value); setDeed(null); }} />
      {j && (
        <div className="rounded-xl bg-white/5 p-3 text-xs space-y-2">
          <div className={DEED[d][2]}>{DEED[d][0]} <b>{DEED[d][1]}</b>: {j.why}</div>
          <GoodBadge compact g={taskGoodness(q)} />
          {(d === "bad" || /anime|manga|game|scroll|youtube|tiktok|instagram|netflix|movie|series|reels?\b/i.test(q)) && <StudyLock />}
          <div className="flex gap-1">
            {(["good", "neutral", "bad"] as const).map((x) => <button key={x} onClick={() => setDeed(x)} className={`chip !py-0.5 text-[11px] ${d === x ? "chip-on" : ""}`}>{DEED[x][0]} {x}</button>)}
          </div>
          <div className="flex gap-2 items-center">
            <input className="input !py-1 !w-24 text-xs" inputMode="numeric" placeholder="minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <button onClick={() => save()} className="btn-primary flex-1 !py-1.5 text-sm">Log “{q.trim()}”</button>
          </div>
          {!items.some((i) => i.name.toLowerCase() === q.trim().toLowerCase()) && <button onClick={() => add(q.trim(), { emoji: j.emoji })} className="text-[11px] text-[var(--accent2)]">＋ Also add it to my side quests</button>}
        </div>
      )}
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
        {list.map((t) => (
          <button key={t.name} onClick={() => save(t.name)} className="w-full flex items-center gap-2 py-1.5 text-left text-xs">
            <span className="text-lg">{t.emoji}</span>
            <span className="flex-1 min-w-0"><span className="block truncate">{t.name}</span><span className="block text-[10px] text-muted truncate">{t.why}</span></span>
            <span className={DEED[t.deed][2]}>{DEED[t.deed][0]}</span>
          </button>
        ))}
      </div>
      {!q && <p className="text-xs text-muted">Type what you did. Chores, study, exercise and helping family are good deeds; scrolling, binge watching and long gaming are bad deeds.</p>}
    </Sheet>
  );
}
