"use client";

import { useEffect, useState } from "react";
import { LiquidGlass } from "@/components/LiquidGlass";
import { XpHeader } from "@/components/XpHeader";
import { dailyGoals, sumMl } from "@/lib/goals";
import { today, useApp, useCustomItems, useLogs, type Log } from "@/lib/store";

const KIND_ICON: Record<string, string> = {
  water: "💧", milk: "🥛", meal: "🍱", wake: "🌅", sleep: "🌙", reading: "📚", listening: "🎧", workout: "🏋️", focus: "📖",
};

function describe(l: Log) {
  const d = l.data as Record<string, string | number | string[]>;
  switch (l.kind) {
    case "water":
    case "milk": return `${d.ml} ml ${l.kind}`;
    case "meal": return `${d.name}${(d.tags as string[])?.length ? ` · ${(d.tags as string[]).join(", ")}` : ""}${d.kcal ? ` · ${d.kcal} kcal` : ""}`;
    case "wake": return `Woke at ${d.time}`;
    case "sleep": return `Slept ${d.hours} h${(d.tags as string[])?.length ? ` · ${(d.tags as string[]).join(", ")}` : ""}`;
    case "reading":
    case "listening": return `${d.minutes} min ${l.kind}${d.title ? ` · ${d.title}` : ""}`;
    case "workout": return `${d.exercise}: ${d.sets ?? 1}×${d.reps}${d.weight ? ` @ ${d.weight} kg` : ""}`;
    case "focus": return `${d.minutes} min focus${d.subject ? ` · ${d.subject}` : ""}`;
    default: return l.kind;
  }
}

export default function TodayPage() {
  const day = today();
  const { profile, logActivity, celebrate, deleteLog } = useApp();
  const { logs } = useLogs(day);
  const [sheet, setSheet] = useState<null | "meal" | "sleep" | "reading" | "listening">(null);
  const settings = profile.settings;
  const goals = dailyGoals(logs, settings);
  const doneCount = goals.filter((g) => g.done).length;

  // Fire the big celebration the first time every goal is done today.
  useEffect(() => {
    if (doneCount !== goals.length) return;
    const key = `lifeos-perfect-${day}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    celebrate({ title: "PERFECT DAY!", subtitle: "Every goal complete. Legendary.", big: true });
  }, [doneCount, goals.length, day, celebrate]);

  const quick = async (kind: string, data: Record<string, unknown>, title: string) => {
    const row = logActivity(kind, data);
    celebrate({ title, xp: row.xp });
  };


  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <XpHeader title={greet} />

      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">Daily quest</h2>
          <span className="text-sm text-muted">{doneCount}/{goals.length}</span>
        </div>
        <div className="bar mb-3"><div style={{ width: `${(doneCount / goals.length) * 100}%` }} /></div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {goals.map((g) => (
            <li key={g.id} className={`flex items-center gap-2 ${g.done ? "text-[var(--accent2)]" : "text-muted"}`}>
              <span>{g.done ? "✦" : "◇"}</span>{g.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-4">
        <LiquidGlass label="Water" color="#46c8ff" ml={sumMl(logs, "water")} goal={settings.water_goal_ml}
          onAdd={(ml) => quick("water", { ml }, "GULP!")} />
        <LiquidGlass label="Milk" color="#fff6e8" ml={sumMl(logs, "milk")} goal={settings.milk_goal_ml}
          onAdd={(ml) => quick("milk", { ml }, "STRONG BONES!")} />
      </section>

      <section className="grid grid-cols-5 gap-2 mb-5">
        {[
          { k: "wake", icon: "🌅", label: "Woke up" },
          { k: "meal", icon: "🍱", label: "Meal" },
          { k: "sleep", icon: "🌙", label: "Sleep" },
          { k: "reading", icon: "📚", label: "Read" },
          { k: "listening", icon: "🎧", label: "Listen" },
        ].map((b) => (
          <button key={b.k}
            onClick={() => {
              if (b.k === "wake") {
                const d = new Date();
                quick("wake", { time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }, "OHAYO!");
              } else setSheet(b.k as typeof sheet);
            }}
            className="card py-3 flex flex-col items-center gap-1 text-xs active:scale-95">
            <span className="text-2xl">{b.icon}</span>{b.label}
          </button>
        ))}
      </section>

      <section>
        <h2 className="font-bold mb-2">Today&apos;s log</h2>
        {logs.length === 0 && <p className="text-sm text-muted">Nothing yet. Tap a glass or say &quot;drank 2 glasses of milk&quot;.</p>}
        <ul className="space-y-2">
          {[...logs].reverse().map((l) => (
            <li key={l.id} className="card px-3 py-2 flex items-center gap-3 text-sm">
              <span className="text-xl">{KIND_ICON[l.kind] ?? "✨"}</span>
              <span className="flex-1">{describe(l)}</span>
              <span className="text-xs text-muted">{new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <button aria-label="Delete" onClick={() => deleteLog(l.id)} className="text-muted hover:text-rose-400">✕</button>
            </li>
          ))}
        </ul>
      </section>

      {sheet && <LogSheet kind={sheet} onClose={() => setSheet(null)} onSave={async (data, title) => { await quick(sheet, data, title); setSheet(null); }} />}
    </>
  );
}

function LogSheet({ kind, onClose, onSave }: {
  kind: "meal" | "sleep" | "reading" | "listening";
  onClose: () => void;
  onSave: (data: Record<string, unknown>, title: string) => Promise<void>;
}) {
  const tagCat = kind === "meal" ? "meal_tag" : kind === "sleep" ? "sleep_tag" : "none";
  const { items: tags, add } = useCustomItems(tagCat);
  const [picked, setPicked] = useState<string[]>([]);
  const [f, setF] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const n = (k: string) => (f[k] ? Number(f[k]) : undefined);
  const caffeineLate = kind === "sleep" && picked.some((t) => /caffeine|coffee/i.test(t));

  const save = () => {
    if (kind === "meal") return onSave({ name: f.name || picked[0] || "Meal", tags: picked, kcal: n("kcal"), protein: n("protein"), carbs: n("carbs"), fat: n("fat") }, "ITADAKIMASU!");
    if (kind === "sleep") return onSave({ hours: n("hours") ?? 8, tags: picked }, "REST RESTORED!");
    return onSave({ minutes: n("minutes") ?? 15, title: f.title }, kind === "reading" ? "WISDOM +1!" : "VIBES!");
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-w-2xl mx-auto card rounded-b-none p-5 space-y-3 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold capitalize">Log {kind}</h3>
        {kind === "meal" && (
          <>
            <input className="input" placeholder="What did you eat?" onChange={set("name")} />
            <div className="grid grid-cols-4 gap-2">
              {["kcal", "protein", "carbs", "fat"].map((m) => (
                <input key={m} className="input" inputMode="numeric" placeholder={m === "kcal" ? "kcal" : `${m} g`} onChange={set(m)} />
              ))}
            </div>
          </>
        )}
        {kind === "sleep" && <input className="input" inputMode="decimal" placeholder="Hours slept" onChange={set("hours")} />}
        {(kind === "reading" || kind === "listening") && (
          <>
            <input className="input" inputMode="numeric" placeholder="Minutes" onChange={set("minutes")} />
            <input className="input" placeholder={kind === "reading" ? "Book or chapter" : "Podcast, album…"} onChange={set("title")} />
          </>
        )}
        {tagCat !== "none" && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button key={t.id} onClick={() => setPicked(picked.includes(t.name) ? picked.filter((p) => p !== t.name) : [...picked, t.name])}
                className={`chip ${picked.includes(t.name) ? "chip-on" : ""}`}>{t.name}</button>
            ))}
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="+ tag"
              onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) { add(newTag.trim()); setNewTag(""); } }}
              className="chip bg-transparent w-20 outline-none" />
          </div>
        )}
        {caffeineLate && <p className="text-sm text-amber-300">☕ Heads up: caffeine within 6 hours of bed can cut deep sleep. Try stopping by early afternoon.</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">Save</button>
        </div>
      </div>
    </div>
  );
}
