import { toDay, type Data } from "@/lib/store";

// Caffeine from drinks and the Tea & coffee check-in. Caffeine halves in the
// body about every 5 hours, so a 4 PM coffee is still a third there at 11 PM.

const CUP: Record<string, number> = { Coffee: 95, Tea: 30, "Energy drink": 80, Cola: 35 };
export const HALF_LIFE_H = 5;
export const DAY_LIMIT = 400; // mg, safe daily limit for adults

export type Dose = { at: Date; mg: number; name: string };
export function doses(d: Data, day = toDay(new Date())): Dose[] {
  const out: Dose[] = [];
  for (const l of d.logs) {
    if (l.day !== day) continue;
    const at = new Date(l.created_at);
    if (l.kind === "drink" && Number(l.data.caffeine) > 0) out.push({ at, mg: Number(l.data.caffeine), name: String(l.data.name) });
    if (l.kind === "caffeine") out.push({ at, mg: (CUP[String(l.data.drink)] ?? 60) * (Number(l.data.cups) || 1), name: String(l.data.drink) });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
// mg still in the body at a time.
export const left = (ds: Dose[], at: Date) => Math.round(ds.reduce((n, x) => n + (x.at <= at ? x.mg * 0.5 ** ((at.getTime() - x.at.getTime()) / 3_600_000 / HALF_LIFE_H) : 0), 0));
export const cutoffOf = (d: Data) => d.profile.settings.caffeine_cutoff ?? 15;
export const lateNow = (d: Data, now = new Date()) => now.getHours() >= cutoffOf(d);
// Bedtime tonight from "23:00"-style sleep time (after midnight counts as tomorrow).
export function bedAt(sleep: string, now = new Date()) {
  const [h, m] = sleep.split(":").map(Number);
  const b = new Date(now); b.setHours(Number.isNaN(h) ? 23 : h, m || 0, 0, 0);
  if (h < 12 && now.getHours() >= 12) b.setDate(b.getDate() + 1);
  return b;
}
export const hourText = (h: number) => (h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);
