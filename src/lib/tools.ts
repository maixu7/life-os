import type { Log } from "@/lib/store";

// Quick check-ins: each one is a small form that saves a record into the day,
// counts as a good or bad deed, and has its own history.

export type Field =
  | { key: string; label: string; type: "choice"; options: { v: string; label: string; emoji?: string }[] }
  | { key: string; label: string; type: "multi"; options: string[] }
  | { key: string; label: string; type: "number"; unit?: string; placeholder?: string; quick?: number[] }
  | { key: string; label: string; type: "text" | "long"; placeholder?: string }
  | { key: string; label: string; type: "rating"; max: number; emoji?: string };

export type Checkin = {
  kind: string; name: string; icon: string; section: string; desc: string; fields: Field[]; xp: number;
  karma: (d: Record<string, unknown>, at: Date) => number;
  line: (d: Record<string, unknown>) => string;
  // Numeric field drawn as a history chart.
  chart?: string;
};

const n = (v: unknown) => Number(v) || 0;
const s = (v: unknown) => (v == null ? "" : String(v));
const MOODS = [
  { v: "5", label: "Great", emoji: "😄" }, { v: "4", label: "Good", emoji: "🙂" }, { v: "3", label: "Okay", emoji: "😐" },
  { v: "2", label: "Low", emoji: "😕" }, { v: "1", label: "Bad", emoji: "😢" },
];

export const CHECKINS: Checkin[] = [
  // Mind
  { kind: "mood", name: "Mood check-in", icon: "😊", section: "Mind", desc: "How do you feel right now?", xp: 5, chart: "mood",
    fields: [{ key: "mood", label: "Mood", type: "choice", options: MOODS }, { key: "tags", label: "Feelings", type: "multi", options: ["Calm", "Happy", "Motivated", "Grateful", "Stressed", "Anxious", "Tired", "Lonely", "Angry", "Bored"] }, { key: "note", label: "Why?", type: "text", placeholder: "What made you feel this way?" }],
    karma: () => 1, line: (d) => `${MOODS.find((m) => m.v === s(d.mood))?.emoji ?? ""} ${MOODS.find((m) => m.v === s(d.mood))?.label ?? ""} ${(d.tags as string[] | undefined)?.join(", ") ?? ""}` },
  { kind: "energy", name: "Energy level", icon: "⚡", section: "Mind", desc: "Rate your energy from 1 to 5.", xp: 3, chart: "level",
    fields: [{ key: "level", label: "Energy", type: "rating", max: 5, emoji: "⚡" }],
    karma: () => 1, line: (d) => `${"⚡".repeat(n(d.level))} ${n(d.level)}/5` },
  { kind: "gratitude", name: "Gratitude", icon: "🙏", section: "Mind", desc: "Three things you are thankful for today.", xp: 15,
    fields: [{ key: "g1", label: "1.", type: "text" }, { key: "g2", label: "2.", type: "text" }, { key: "g3", label: "3.", type: "text" }],
    karma: () => 3, line: (d) => [d.g1, d.g2, d.g3].filter(Boolean).join(" · ") },
  { kind: "journal", name: "Journal", icon: "📔", section: "Mind", desc: "Write anything on your mind. Only you can read it.", xp: 15,
    fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Entry", type: "long", placeholder: "Dear diary…" }],
    karma: () => 3, line: (d) => s(d.title) || s(d.text).slice(0, 60) },
  { kind: "intention", name: "Today's intention", icon: "🎯", section: "Mind", desc: "One sentence: what will make today a win?", xp: 10,
    fields: [{ key: "text", label: "Today I will…", type: "text", placeholder: "finish chapter 3 and sleep by 11" }],
    karma: () => 2, line: (d) => s(d.text) },
  { kind: "reflection", name: "Night reflection", icon: "🌙", section: "Mind", desc: "Review your day like a true hero.", xp: 15, chart: "score",
    fields: [{ key: "good", label: "What went well?", type: "text" }, { key: "improve", label: "What will I do better tomorrow?", type: "text" }, { key: "score", label: "Rate today", type: "rating", max: 10, emoji: "⭐" }],
    karma: () => 3, line: (d) => `Day ${n(d.score)}/10 · ${s(d.good)}` },
  { kind: "kindness", name: "Kind deed", icon: "💝", section: "Mind", desc: "Something good you did for someone else.", xp: 20,
    fields: [{ key: "text", label: "What did you do?", type: "text", placeholder: "Helped mom cook, taught a friend…" }],
    karma: () => 6, line: (d) => s(d.text) },
  { kind: "resist", name: "Temptation resisted", icon: "🛡️", section: "Mind", desc: "You beat a temptation. That's a real boss fight.", xp: 20,
    fields: [{ key: "what", label: "What did you resist?", type: "choice", options: ["Phone", "Junk food", "Anime binge", "Gaming", "Sleeping in", "Skipping study", "Other"].map((v) => ({ v, label: v })) }, { key: "note", label: "How?", type: "text" }],
    karma: () => 5, line: (d) => `Resisted ${s(d.what)}` },
  { kind: "gaveIn", name: "Honest confession", icon: "😈", section: "Mind", desc: "Gave in to something? Owning it is the first step back.", xp: 2,
    fields: [{ key: "what", label: "What did you give in to?", type: "choice", options: ["Phone", "Junk food", "Anime binge", "Gaming", "Sleeping in", "Skipping study", "Other"].map((v) => ({ v, label: v })) }, { key: "note", label: "What will you do next time?", type: "text" }],
    karma: () => -3, line: (d) => `Gave in to ${s(d.what)}` },
  // Body
  { kind: "steps", name: "Steps", icon: "👣", section: "Body", desc: "Steps walked today (from your phone or watch).", xp: 10, chart: "steps",
    fields: [{ key: "steps", label: "Steps", type: "number", quick: [2000, 5000, 8000, 10000] }],
    karma: (d) => (n(d.steps) >= 8000 ? 4 : n(d.steps) >= 5000 ? 2 : 0), line: (d) => `${n(d.steps).toLocaleString()} steps` },
  { kind: "screen", name: "Screen time", icon: "📱", section: "Body", desc: "Total phone screen time today (check Digital Wellbeing / Screen Time).", xp: 5, chart: "minutes",
    fields: [{ key: "minutes", label: "Minutes", type: "number", unit: "min", quick: [60, 120, 180, 240, 360] }],
    karma: (d) => (n(d.minutes) > 240 ? -6 : n(d.minutes) > 180 ? -4 : n(d.minutes) > 120 ? -2 : n(d.minutes) <= 60 ? 3 : 0),
    line: (d) => `${Math.floor(n(d.minutes) / 60)} h ${n(d.minutes) % 60} min on screen` },
  { kind: "outside", name: "Sunlight & outdoors", icon: "🌤️", section: "Body", desc: "Time spent outside in daylight.", xp: 8,
    fields: [{ key: "minutes", label: "Minutes", type: "number", unit: "min", quick: [10, 20, 30, 60] }],
    karma: (d) => (n(d.minutes) >= 15 ? 2 : 1), line: (d) => `${n(d.minutes)} min outside` },
  { kind: "caffeine", name: "Tea & coffee", icon: "☕", section: "Body", desc: "Track caffeine. Late caffeine steals sleep.", xp: 2,
    fields: [{ key: "drink", label: "Drink", type: "choice", options: [{ v: "Tea", label: "Tea", emoji: "🍵" }, { v: "Coffee", label: "Coffee", emoji: "☕" }, { v: "Energy drink", label: "Energy drink", emoji: "🥤" }, { v: "Cola", label: "Cola", emoji: "🥤" }] }, { key: "cups", label: "Cups", type: "number", quick: [1, 2, 3] }],
    karma: (d, at) => (s(d.drink) === "Energy drink" ? -3 : at.getHours() >= 18 ? -2 : 0), line: (d) => `${n(d.cups) || 1} × ${s(d.drink)}` },
  { kind: "medicine", name: "Medicine & vitamins", icon: "💊", section: "Body", desc: "Never forget a dose.", xp: 3,
    fields: [{ key: "name", label: "Name", type: "text", placeholder: "Vitamin D, iron…" }, { key: "dose", label: "Dose", type: "text", placeholder: "1 tablet" }],
    karma: () => 1, line: (d) => `${s(d.name)} ${s(d.dose)}` },
  { kind: "sleepq", name: "Sleep quality & dreams", icon: "💤", section: "Body", desc: "How well did you sleep? Any dreams?", xp: 5, chart: "quality",
    fields: [{ key: "quality", label: "Quality", type: "rating", max: 5, emoji: "⭐" }, { key: "dream", label: "Dream journal", type: "long", placeholder: "I dreamt that…" }],
    karma: () => 1, line: (d) => `Sleep ${n(d.quality)}/5${d.dream ? " · dream noted" : ""}` },
  { kind: "stretch", name: "Stretch & eye break", icon: "🤸", section: "Body", desc: "Every 30 min of screen: 20-20-20 for eyes (20 s at 20 ft).", xp: 5,
    fields: [{ key: "type", label: "Break", type: "multi", options: ["Neck", "Back", "Eyes 20-20-20", "Full stretch", "Posture fix"] }],
    karma: () => 1, line: (d) => (d.type as string[] | undefined)?.join(", ") ?? "Break" },
  { kind: "sick", name: "Health log", icon: "🤒", section: "Body", desc: "Track symptoms so you notice patterns.", xp: 2,
    fields: [{ key: "symptoms", label: "Symptoms", type: "multi", options: ["Headache", "Cold", "Fever", "Cough", "Stomach", "Tired", "Back pain", "Allergy"] }, { key: "note", label: "Note", type: "text" }],
    karma: () => 0, line: (d) => (d.symptoms as string[] | undefined)?.join(", ") ?? "" },
  // Growth
  { kind: "skill", name: "Skill practice", icon: "🎸", section: "Growth", desc: "Guitar, coding, drawing, a sport… level up a real skill.", xp: 20,
    fields: [{ key: "skill", label: "Skill", type: "text", placeholder: "Guitar" }, { key: "minutes", label: "Minutes", type: "number", unit: "min", quick: [15, 30, 45, 60] }],
    karma: (d) => Math.max(2, Math.round(n(d.minutes) / 10)), line: (d) => `${s(d.skill)} · ${n(d.minutes)} min` },
  { kind: "language", name: "Language learning", icon: "🗣️", section: "Growth", desc: "Duolingo, vocabulary, speaking practice.", xp: 15,
    fields: [{ key: "lang", label: "Language", type: "text", placeholder: "English, Japanese…" }, { key: "minutes", label: "Minutes", type: "number", unit: "min", quick: [10, 15, 30] }, { key: "words", label: "New words", type: "text" }],
    karma: () => 3, line: (d) => `${s(d.lang)} · ${n(d.minutes)} min` },
  { kind: "social", name: "Family & friends", icon: "👨‍👩‍👦", section: "Growth", desc: "Called, visited or helped someone you love.", xp: 10,
    fields: [{ key: "who", label: "Who?", type: "text" }, { key: "how", label: "How?", type: "choice", options: ["Call", "Visit", "Helped", "Ate together", "Chat"].map((v) => ({ v, label: v })) }],
    karma: () => 2, line: (d) => `${s(d.how)} with ${s(d.who)}` },
  // Money
  { kind: "income", name: "Money received", icon: "💵", section: "Money", desc: "Allowance, gift or earnings.", xp: 3,
    fields: [{ key: "amount", label: "Amount", type: "number" }, { key: "source", label: "From", type: "text", placeholder: "Pocket money, gift…" }],
    karma: () => 0, line: (d) => `+${n(d.amount)} from ${s(d.source)}` },
  { kind: "save", name: "Savings deposit", icon: "🐷", section: "Money", desc: "Money put aside in your piggy bank.", xp: 10, chart: "amount",
    fields: [{ key: "amount", label: "Amount", type: "number" }, { key: "note", label: "Note", type: "text" }],
    karma: () => 2, line: (d) => `Saved ${n(d.amount)}` },
];

export const CHECKIN_BY_KIND = Object.fromEntries(CHECKINS.map((c) => [c.kind, c]));
export const TOOL_KINDS = new Set(CHECKINS.map((c) => c.kind));

export function checkinKarma(l: Log) {
  const c = CHECKIN_BY_KIND[l.kind];
  return c ? c.karma(l.data, new Date(l.created_at)) : null;
}

// Extra record kinds made by the tools below.
export const EXTRA_KARMA: Record<string, number> = { fine: -6, breath: 2, meditate: 3, task: 2, routine: 1, challenge: 5, spin: 0, login: 0, plan: 1, goalstep: 3, pages: 3 };

export const CHALLENGES = [
  "No sugar or junk food today", "Read 20 pages of a book", "No social media until 6 pm", "Drink 3 litres of water",
  "Do 50 push-ups through the day", "Sleep before 11 pm", "Wake up before 6:30", "Walk 8,000 steps", "Compliment 3 people",
  "Clean and organise your desk", "No anime or videos today", "Learn 10 new words", "Write a one-page journal entry",
  "Call a family member", "Eat 3 fruits", "Meditate for 10 minutes", "Study 2 focus sessions", "Cold shower",
  "No phone during meals", "Help someone without being asked", "Plan tomorrow before bed", "Stretch for 10 minutes",
];

export const PET_STAGES = [
  { min: 0, name: "Mystery Egg", icon: "🥚" }, { min: 50, name: "Baby Spirit", icon: "🐣" }, { min: 200, name: "Young Fox", icon: "🦊" },
  { min: 500, name: "Wolf Guardian", icon: "🐺" }, { min: 1000, name: "Thunder Tiger", icon: "🐯" }, { min: 2000, name: "Sky Dragon", icon: "🐉" },
  { min: 4000, name: "Celestial Phoenix", icon: "🐦‍🔥" },
];
