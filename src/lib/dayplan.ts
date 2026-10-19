import { dayPlan, itemKind, kitOf, setsText } from "@/lib/have";
import { myKit } from "@/lib/learnkit";
import type { RoutineItem } from "@/lib/mission";
import { dayType, goalsOn, hm, isOffDay, sched, sleepTimes, toMin } from "@/lib/schedule";
import { toDay, type Data } from "@/lib/store";

// The whole day, filled in by the app: around your schedule (never inside
// work hours) it adds toilet, sitz bath, brushing, water every couple of
// hours, a drink and a snack from what you have, training with your gear,
// reading, coding, listening, shopping, shower and bedtime steps. What it
// adds follows your records: behind on water → more water, no training for
// days → training comes earlier, and a few extras change every day.

const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 17);

export function autoSteps(d: Data, date: Date): RoutineItem[] {
  const s = sched(d.profile.settings.schedule);
  const day = toDay(date);
  const t = dayType(s, date), off = isOffDay(t);
  const g = goalsOn(s, date);
  const W = toMin(off ? s.weekendWake : s.wake);
  let S = toMin(sleepTimes(s, new Date(`${day}T20:00:00`)).sleep);
  if (S < W) S += 24 * 60; // bedtime after midnight
  const ws = off ? NaN : toMin(s.workStart), we = off ? NaN : toMin(t === "half" ? s.halfEnd : s.workEnd);
  const c = s.commute || 0;
  // Busy: commute + work (a lunch break is still work time here).
  const busy = (m: number, len = 0) => !Number.isNaN(ws) && m + len > ws - c && m < we + c;
  const out: RoutineItem[] = [];
  const add = (id: string, at: number, len: number, label: string, kind: RoutineItem["kind"], extra: Partial<RoutineItem> = {}) => {
    if (at < W || at + len > S) return;
    if (busy(at, len)) return;
    out.push({ id: `a-${id}`, time: hm(Math.round(at)), end: len ? hm(Math.round(at + len)) : undefined, label, kind, auto: true, ...extra });
  };
  const free = Number.isNaN(ws) ? W : we + c; // when the evening starts
  const pick = <T,>(xs: T[], k: string) => xs[seed(day + k) % xs.length];

  // What the records say (the last 3 days).
  const last = [1, 2, 3].map((i) => toDay(new Date(date.getTime() - i * 86_400_000)));
  const logsIn = (days: string[]) => d.logs.filter((l) => days.includes(l.day));
  const goal = d.profile.settings.water_goal_ml || 2000;
  const yWater = logsIn([last[0]]).filter((l) => ["water", "drink", "milk"].includes(l.kind)).reduce((a, l) => a + (Number(l.data.ml) || 0), 0);
  const noTraining = !logsIn(last).some((l) => l.kind === "workout");

  // ---- Morning ----
  add("toilet-am", W + 5, 10, "Toilet", "step");
  add("sitz-am", W + 15, 15, "Sitz bath (after toilet)", "step");
  add("water-wake", W + 32, 0, "Water 250 ml", "water", { ml: 250 });
  add("brush-am", W + 35, 5, "Brush teeth", "step");
  add("wash-am", W + 40, 10, "Wash face, get ready", "step");
  // A few minutes of movement before the day starts.
  add("stretch-am", W + 50, 10, pick(["Morning stretch 10 min", "Sun salutation 5 rounds", "Walk outside 10 min", "Neck and back stretch 10 min"], "st"), "step", { href: "/train" });

  // ---- Learning from your collection ----
  const kit = myKit(d);
  const books = kit.filter((k) => k.cat === "book").map((k) => k.title);
  const coding = kit.filter((k) => k.cat === "code").map((k) => k.title);
  const listen = kit.filter((k) => k.cat === "podcast" || k.cat === "lang").map((k) => k.title);
  const videos = kit.filter((k) => k.cat === "video" || k.cat === "course");
  const bfast = toMin(s.breakfast);
  // Before work (or late morning on a day off): read.
  if (g.readGoal) add("read-am", (Number.isNaN(bfast) ? W + 60 : bfast + 35), 20, `Read ${Math.max(5, Math.round(g.readGoal / 2))} pages${books.length ? ` of ${pick(books, "b")}` : ""}`, "read", { href: "/learn" });
  // Commute: listen.
  if (!Number.isNaN(ws) && c >= 10) {
    const what = listen.length ? pick(listen, "l") : "a podcast or language lesson";
    out.push({ id: "a-listen", time: hm(ws - c), end: hm(ws), label: `Listen to ${what} on the way`, kind: "step", auto: true, href: "/learn" });
  }

  // ---- Water: every couple of hours outside work, more if yesterday was low ----
  const every = Math.max(60, (s.waterEvery || 120) - (yWater && yWater < goal * 0.7 ? 30 : 0));
  const drinks = d.pantry.filter((p) => p.qty > 0 && itemKind(p) === "drink" && !/beer|sake|wine|chuhai|cola|energy|coffee/i.test(p.name));
  const slots: number[] = [];
  for (let m = W + 32 + every; m < S - 60; m += every) if (!busy(m)) slots.push(m);
  const ml = Math.max(150, Math.min(500, Math.round((goal - 250) / Math.max(1, slots.length + 2) / 50) * 50));
  slots.forEach((m, i) => {
    // Now and then one from your drink collection instead of plain water.
    const p = drinks.length && i % 3 === 1 ? drinks[seed(day + i) % drinks.length] : undefined;
    add(`water-${i}`, m, 0, p ? `Drink ${p.name} ${ml} ml` : `Water ${ml} ml`, "water", { ml, href: "/food" });
  });

  // ---- Snack from what you have ----
  const fruit = d.pantry.filter((p) => p.qty > 0 && ["fruit", "veg"].includes(itemKind(p)));
  const tea = toMin(s.tea);
  const snackAt = !Number.isNaN(tea) && !busy(tea) ? tea : free + 15;
  add("snack", snackAt, 10, "Snack", "meal", { note: fruit.length ? `Have ${pick(fruit, "f").name} (you have it at home)` : "Fruit, nuts or yoghurt, not sweets", href: "/food" });

  // ---- Training with your gear ----
  const ex = toMin(s.exercise);
  const plan = dayPlan(kitOf(d.pantry), date, off);
  const exAt = !Number.isNaN(ex) && !busy(ex, 45) ? ex : free + (noTraining ? 20 : 60);
  const note = plan.slice(0, 4).map((r) => `${r.name} ${setsText(r.sets, r.reps)}${r.kg ? ` (${r.kg} kg)` : ""}`).join(" · ");
  // The schedule already has Exercise at its time; if it's set, this is the warm-up and cool-down.
  if (Number.isNaN(ex) || busy(ex, 45)) add("train", exAt, off ? 60 : 45, `Training${noTraining ? " (no training for 3 days)" : ""}`, "workout", { note, href: "/train" });
  add("warmup", exAt - 10, 10, "Warm up before training", "step", { href: "/train" });
  add("cooldown", exAt + (off ? 60 : 45), 10, "Cool down and stretch", "step", { href: "/train" });

  // ---- Evening learning ----
  const st = toMin(s.studyStart), se = toMin(s.studyEnd);
  const after = Number.isNaN(se) ? free + 90 : Math.max(se, free + 30);
  if (g.codeGoal) add("code", after + 10, g.codeGoal, `Coding practice ${g.codeGoal} min${coding.length ? ` in ${pick(coding, "c")}` : ""}`, "code", { href: "/learn" });
  if (videos.length && seed(day + "v") % 2 === 0) { const v = pick(videos, "v"); add("video", (Number.isNaN(st) ? free + 30 : st) - 40, Math.min(v.minutes || 20, 40), `Watch ${v.title} and write 3 notes`, "study", { href: "/learn" }); }
  if (g.readGoal) add("read-pm", S - 75, 20, `Read ${Math.max(5, g.readGoal - Math.round(g.readGoal / 2))} pages${books.length ? ` of ${pick(books, "b")}` : ""}`, "read", { href: "/learn" });

  // ---- Shopping when the list has things on it ----
  const toBuy = d.shopping.filter((x) => x.status === "to_buy").length;
  if (toBuy && (off || toBuy >= 3)) add("shop", off ? W + 4 * 60 : free + 5, 30, `Shopping: ${toBuy} thing${toBuy > 1 ? "s" : ""} on your list`, "step", { href: "/shop" });

  // ---- Small things that change every day ----
  const extras: [string, string, number, string?][] = [
    ["tidy", "Tidy your room 10 min", 10], ["walk", "Walk 15 min after dinner", 15, "/train"], ["breathe", "Breathing 5 min", 5],
    ["plan", "Plan tomorrow: 3 most important things", 5], ["laundry", "Laundry or dishes", 15], ["call", "Message or call family", 10],
    ["posture", "Posture check + 20 squats", 5, "/train"], ["eyes", "Eyes off screens 10 min", 10],
  ];
  const k = 2 + (off ? 2 : 0);
  const din = toMin(s.dinner);
  const spots = [free + 40, Number.isNaN(din) ? free + 120 : din + 40, W + 3 * 60, W + 5 * 60, S - 120];
  for (let i = 0; i < k; i++) {
    const [id, label, len, href] = extras[(seed(day) + i * 3) % extras.length];
    add(id, spots[i % spots.length] + i * 5, len, label, "step", href ? { href } : {});
  }

  // ---- Before bed ----
  add("shower", S - 100, 20, "Shower or bath", "step");
  add("prep", S - 60, 10, off && !isOffDay(dayType(s, new Date(date.getTime() + 86_400_000))) ? "Pack bag and clothes for tomorrow" : "Prepare tomorrow", "step");
  add("phone", S - (s.windDown || 30), 0, "Phone away, wind down", "step");
  add("toilet-pm", S - 40, 10, "Toilet", "step");
  add("sitz-pm", S - 30, 15, "Sitz bath (before bed)", "step");
  add("brush-pm", S - 12, 5, "Brush teeth", "step");
  add("journal", S - 7, 5, "Write 3 lines about today", "step");

  // Keep a little gap between steps that land on the same minute.
  out.sort((a, b) => toMin(a.time) - toMin(b.time));
  for (let i = 1; i < out.length; i++) {
    const p = toMin(out[i - 1].time), m = toMin(out[i].time);
    if (m <= p) out[i] = { ...out[i], time: hm(p + 3) };
  }
  return out.map((x) => ({ ...x, time: hm(toMin(x.time) % 1440), end: x.end ? hm(toMin(x.end) % 1440) : undefined }));
}
