// Flashcards with spaced repetition (SM-2, the Anki way). Cards live in the
// generic item store: decks are category "deck", cards are category "card"
// with name = front and config = { deck, back, ease, ivl, due, reps, lapses }.
// Each grade pushes the card further out, so you only see what you're about
// to forget.

export type Grade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy
export const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 0, label: "Again", cls: "bg-rose-500/25 border-rose-400/50" },
  { g: 1, label: "Hard", cls: "bg-amber-500/20 border-amber-400/50" },
  { g: 2, label: "Good", cls: "bg-emerald-500/20 border-emerald-400/50" },
  { g: 3, label: "Easy", cls: "bg-sky-500/20 border-sky-400/50" },
];
export type Srs = { ease: number; ivl: number; due: string; reps: number; lapses: number; first?: string };
export const NEW_PER_DAY = 20; // new cards per deck per day, so a big import doesn't bury you

const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (day: string, n: number) => { const d = new Date(`${day}T12:00`); d.setDate(d.getDate() + n); return dayOf(d); };

export const srsOf = (c: Record<string, unknown>): Srs => ({
  ease: Number(c.ease) || 2.5, ivl: Number(c.ivl) || 0, due: String(c.due ?? ""), reps: Number(c.reps) || 0, lapses: Number(c.lapses) || 0,
  first: c.first ? String(c.first) : undefined,
});
export const isNew = (c: Record<string, unknown>) => !Number(c.reps) && !Number(c.lapses) && !c.first;

// The next schedule after a grade. Again resets the card (it comes back in
// this session); Hard/Good/Easy grow the gap by the card's ease.
export function grade(s: Srs, g: Grade, today: string): Srs {
  let { ease, ivl, reps, lapses } = s;
  if (g === 0) { lapses += 1; reps = 0; ivl = 0; ease = Math.max(1.3, ease - 0.2); }
  else if (g === 1) { ivl = reps === 0 ? 1 : Math.max(ivl + 1, Math.round(ivl * 1.2)); ease = Math.max(1.3, ease - 0.15); reps += 1; }
  else if (g === 2) { ivl = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(ivl + 1, Math.round(ivl * ease)); reps += 1; }
  else { ivl = reps === 0 ? 4 : Math.max(ivl + 2, Math.round(ivl * ease * 1.3)); ease += 0.15; reps += 1; }
  ivl = Math.min(ivl, 3650);
  return { ease: Math.round(ease * 100) / 100, ivl, reps, lapses, due: addDays(today, ivl), first: s.first ?? today };
}

// "1d", "3d", "2mo": the gap a grade would give, shown on its button.
export function preview(s: Srs, g: Grade, today: string): string {
  const n = grade(s, g, today).ivl;
  return n === 0 ? "now" : n < 30 ? `${n}d` : n < 365 ? `${Math.round(n / 30)}mo` : `${(n / 365).toFixed(1)}y`;
}

type CardLike = { id: string; config: Record<string, unknown> };
// What's waiting in a deck today: cards due (oldest first), then new cards up
// to today's allowance (minus new cards already started today).
export function queueOf<T extends CardLike>(cards: T[], today: string): { due: T[]; fresh: T[] } {
  const due = cards.filter((c) => !isNew(c.config) && String(c.config.due ?? "") <= today).sort((a, b) => String(a.config.due).localeCompare(String(b.config.due)));
  const startedToday = cards.filter((c) => c.config.first === today).length;
  const fresh = cards.filter((c) => isNew(c.config)).slice(0, Math.max(0, NEW_PER_DAY - startedToday));
  return { due, fresh };
}

// "Front - back" lines (also tab, " = ", " : ") for quick bulk adding.
export function parseBulk(text: string): { front: string; back: string }[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = /\t| - | – | = | : /.exec(l);
    return m ? { front: l.slice(0, m.index).trim(), back: l.slice(m.index + m[0].length).trim() } : { front: l, back: "" };
  }).filter((c) => c.front);
}

// How well a deck is known: share of cards with a gap of 3 weeks or more.
export const mature = (cards: CardLike[]) => cards.filter((c) => Number(c.config.ivl) >= 21).length;
