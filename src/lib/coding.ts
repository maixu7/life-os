import type { Log } from "@/lib/store";

export type CodeKind = "practice" | "tutorial" | "docs" | "problems" | "project" | "typing";

export const CODE_KINDS: Record<CodeKind, { label: string; icon: string; topic: string }> = {
  practice: { label: "Practice", icon: "⌨️", topic: "What did you practise? (loops, functions…)" },
  tutorial: { label: "Tutorial video", icon: "🎥", topic: "What was it about?" },
  docs: { label: "Reading docs", icon: "📖", topic: "Which topic / chapter?" },
  problems: { label: "Problem solving", icon: "🧩", topic: "Which problems or topic?" },
  project: { label: "Project", icon: "🚀", topic: "What did you build or fix today?" },
  typing: { label: "Typing practice", icon: "⚡", topic: "Site or note (e.g. Monkeytype)" },
};

export const CODE_LANGS = ["Python", "JavaScript", "TypeScript", "HTML/CSS", "C", "C++", "Java", "SQL", "React", "Go", "Kotlin", "Dart", "PHP", "Rust"];
export const LEVELS = ["Beginner", "Intermediate", "Expert"];

// Total time and latest level per language, plus best typing speed.
export function codingStats(logs: Log[]) {
  const by = new Map<string, { lang: string; minutes: number; level: string; last: string; sessions: number }>();
  let bestWpm = 0;
  for (const l of [...logs].filter((x) => x.kind === "coding").sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    bestWpm = Math.max(bestWpm, Number(l.data.wpm) || 0);
    const lang = String(l.data.lang ?? "");
    if (!lang || lang === "undefined") continue;
    const row = by.get(lang) ?? { lang, minutes: 0, level: "Beginner", last: "", sessions: 0 };
    row.minutes += Number(l.data.minutes) || 0;
    row.level = String(l.data.level ?? row.level);
    row.last = l.created_at;
    row.sessions++;
    by.set(lang, row);
  }
  return { langs: [...by.values()].sort((a, b) => b.minutes - a.minutes), bestWpm };
}

export function describeCoding(d: Record<string, unknown>) {
  const k = CODE_KINDS[(d.sub as CodeKind) ?? "practice"] ?? CODE_KINDS.practice;
  const parts = [
    d.lang ? `${d.lang}${d.level ? ` (${d.level})` : ""}` : "",
    d.video ? String(d.video) : "", d.part ? `part ${d.part}` : "", d.video_len ? `${d.video_len} min video` : "",
    d.solved ? `${d.solved} ${d.difficulty ?? ""} problems` : "", d.wpm ? `${d.wpm} WPM` : "", d.accuracy ? `${d.accuracy}% accuracy` : "",
    d.project ? `${d.project}${d.progress != null ? ` ${d.progress}%` : ""}` : "", d.topic ? String(d.topic) : "", d.minutes ? `${d.minutes} min` : "",
  ];
  return { emoji: "💻", title: `Coding: ${k.label}`, detail: parts.filter(Boolean).join(" · ") };
}
