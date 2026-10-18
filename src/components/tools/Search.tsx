"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EditLog } from "@/components/EditLog";
import { fmtTime, Sheet } from "@/components/Sheet";
import { FOODS } from "@/lib/body";
import { describe } from "@/lib/describe";
import { allTags, tagsOf } from "@/lib/review";
import { useApp, type Log } from "@/lib/store";

// One box for everything: records (with #tags), foods, your stuff, lists and notes.
type Kind = "all" | "records" | "foods" | "stuff" | "lists" | "notes";
type Hit = { id: string; kind: Exclude<Kind, "all">; emoji: string; title: string; detail: string; href?: string; log?: Log; when?: string };
const KINDS: [Kind, string][] = [["all", "All"], ["records", "📋 Records"], ["foods", "🍱 Foods"], ["stuff", "🎒 My stuff"], ["lists", "📝 Lists"], ["notes", "🗒️ Notes"]];
const CAT: Record<string, string> = { activity: "Activity", habit: "Habit quest", food: "My food", reminder: "Reminder", exercise: "Exercise", reward: "Reward", savings: "Savings goal", formula: "Formula", pet: "Pet", task: "Task", goal: "Goal" };

export function SearchAllSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [edit, setEdit] = useState<Log | null>(null);
  const cur = profile.settings.currency;
  const tags = useMemo(() => allTags(data.logs).slice(0, 24), [data.logs]);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2 && !tag) return [];
    const has = (s: string) => !t || t.length < 2 || s.toLowerCase().includes(t);
    const out: Hit[] = [];
    for (const l of data.logs) {
      const lt = tagsOf(l);
      if (tag && !lt.includes(tag)) continue;
      const d = describe(l, cur);
      if (!has(`${d.title} ${d.detail} ${l.day} ${JSON.stringify(l.data)} ${lt.map((x) => `#${x}`).join(" ")}`)) continue;
      out.push({ id: l.id, kind: "records", emoji: d.emoji, title: d.title, detail: `${d.detail}${lt.length ? ` · ${lt.map((x) => `#${x}`).join(" ")}` : ""}`, log: l, when: l.created_at });
    }
    if (!tag) {
      const mine = data.items.filter((i) => i.category === "food");
      for (const f of mine) if (has(f.name)) out.push({ id: f.id, kind: "foods", emoji: String(f.config.emoji ?? "🍽️"), title: f.name, detail: `My food · ${f.config.kcal ?? "?"} kcal · ${f.config.protein ?? "?"} g protein` });
      for (const f of FOODS) if (has(f.name)) out.push({ id: `food:${f.name}`, kind: "foods", emoji: f.emoji, title: f.name, detail: `${f.per} · ${f.kcal} kcal · ${f.protein} g protein` });
      for (const p of data.pantry) if (has(`${p.name} ${p.ja ?? ""} ${p.brand ?? ""} ${p.note ?? ""}`)) out.push({ id: p.id, kind: "stuff", emoji: p.emoji, title: p.name, detail: `Have ${p.qty} ${p.unit}${p.expiry ? ` · best before ${p.expiry}` : ""}`, href: "/have" });
      for (const s of data.shopping) if (has(`${s.name} ${s.note}`)) out.push({ id: s.id, kind: "lists", emoji: s.emoji, title: s.name, detail: `Shopping list · ${s.status === "to_buy" ? "to buy" : "bought"}`, href: "/shop" });
      for (const i of data.items) {
        if (["food", "doing"].includes(i.category) || !has(`${i.name} ${typeof i.config.note === "string" ? i.config.note : ""}`)) continue;
        out.push({ id: i.id, kind: "lists", emoji: String(i.config.emoji ?? "📌"), title: i.name, detail: CAT[i.category] ?? i.category });
      }
      for (const s of profile.settings.study_plan ?? []) if (has(`${s.subject} ${s.what}`)) out.push({ id: s.id, kind: "notes", emoji: "🗓️", title: s.subject, detail: `Study plan · ${s.what} · ${s.mins} min`, href: "/learn" });
      for (const [page, p] of Object.entries(profile.settings.ui?.pages ?? {})) for (const b of p.blocks ?? []) {
        const body = `${b.title} ${b.text ?? ""} ${(b.items ?? []).join(" ")}`;
        if (has(body)) out.push({ id: b.id, kind: "notes", emoji: b.icon, title: b.title, detail: (b.text ?? (b.items ?? []).join(", ")).slice(0, 80), href: page });
      }
      if (has(profile.about ?? "")) out.push({ id: "about", kind: "notes", emoji: "🦸", title: "About me", detail: (profile.about ?? "").slice(0, 80), href: "/rank" });
    }
    return out;
  }, [q, tag, data, profile, cur]);

  const shown = hits.filter((h) => kind === "all" || h.kind === kind)
    .sort((a, b) => (b.when ?? "").localeCompare(a.when ?? "")).slice(0, 150);
  const count = (k: Kind) => (k === "all" ? hits.length : hits.filter((h) => h.kind === k).length);

  return (
    <Sheet title="🔎 Search everything" onClose={onClose}>
      <input autoFocus className="input" placeholder="apple, anime, #exam, 2026-10, gym…" value={q} onChange={(e) => setQ(e.target.value)} />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(([t, n]) => <button key={t} onClick={() => setTag(tag === t ? null : t)} className={`chip !py-0.5 text-xs ${tag === t ? "chip-on" : ""}`}>#{t} <span className="opacity-60">{n}</span></button>)}
        </div>
      )}
      {(q.trim().length >= 2 || tag) && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {KINDS.map(([k, label]) => <button key={k} onClick={() => setKind(k)} className={`chip shrink-0 !py-0.5 text-xs ${kind === k ? "chip-on" : ""}`}>{label} {count(k)}</button>)}
        </div>
      )}
      {!q.trim() && !tag && <p className="text-xs text-muted">Tip: add tags like #exam or #gym to any record (open it and type them in Tags, or write them in a note), then tap a tag above to see all of them.</p>}
      <ul className="divide-y divide-white/5">
        {shown.map((h) => {
          const inner = (
            <>
              <span className="text-xl">{h.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{h.title}</span>
                <span className="block text-xs text-muted truncate">{h.when ? `${new Date(h.when).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ${fmtTime(h.when)} · ` : ""}{h.detail}</span>
              </span>
            </>
          );
          return (
            <li key={`${h.kind}:${h.id}`} className="py-2 text-sm">
              {h.log ? <button onClick={() => setEdit(h.log!)} className="w-full flex gap-3 text-left">{inner}</button>
                : h.href ? <Link href={h.href} onClick={onClose} className="flex gap-3">{inner}</Link>
                  : <div className="flex gap-3">{inner}</div>}
            </li>
          );
        })}
      </ul>
      {edit && <EditLog log={edit} onClose={() => setEdit(null)} />}
    </Sheet>
  );
}
