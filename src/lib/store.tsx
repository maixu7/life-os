"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Schedule } from "@/lib/schedule";
import type { Ui } from "@/lib/ui";
import type { Slot } from "@/lib/gear";
import { emojiFor } from "@/lib/emoji";
import { realityCheck } from "@/lib/reality";
import { markSynced, noteDeleted } from "@/lib/safety";
import { pull, save, type Session } from "@/lib/vault";
import { XP } from "@/lib/xp";

export type Settings = {
  water_goal_ml: number;
  milk_goal_ml: number;
  sleep_goal_h: number;
  budget_monthly: number;
  exam_date: string | null;
  theme: string;
  currency: string;
  allowances: Record<string, number>; // "2026-10" -> allowance for that month
  schedule?: Partial<Schedule>; // wake/sleep, work hours, breaks, holidays
  ui?: Ui; // bottom menu tabs and hidden Base Camp sections
  study_plan?: StudyItem[]; // what to study each day and how much
  study_lock?: boolean; // fun (anime, manga, games…) waits until today's study is done
  study_wall?: boolean; // full-screen "study first" wall after study time (on unless turned off)
  jlpt?: { level?: string; goal?: string; daily?: number }; // JLPT: level passed, level aiming for, new kanji a day
  // Food and money extras (lib/money.ts, components/FoodPlus.tsx, components/Money.tsx)
  protein_goal_g?: number; // daily protein target; unset = 0.8 g per kg
  bottle_ml?: number; bottle_remind?: boolean; // the water bottle you refill, and refill nudges
  caffeine_cutoff?: number; // hour after which caffeine gets a sleep warning (15 = 3 PM)
  cat_budgets?: Record<string, number>; // monthly budget per spending category
  payday?: Payday; // allowance day and "pay yourself first"
  grocery_skip?: string[]; // names the auto grocery list should stop suggesting
};
export type Payday = { day: number; pct: number; amount?: number; jar?: string; auto: boolean };
export type StudyItem = { id: string; subject: string; what: string; mins: number; pages?: number };
export type Avatar = {
  skin: string; hair: string; hairStyle: number; eyes: string; outfit: string; accessory: number; heroClass: string;
  pants?: string; shoes?: string; expression?: number; gender?: "boy" | "girl";
  gear?: Partial<Record<Slot, string>>; // equipped pixel gear per slot
};
export type Profile = {
  display_name: string; xp: number; settings: Settings; updated_at: string;
  avatar: Avatar; title: string; height_cm: number | null; birth_year: number | null;
  achievements: Record<string, string>; // id -> unlocked at
  achievements_off?: Record<string, string>; // id -> taken back at (a record was fixed or deleted)
  about?: string; // "About me", written by the hero; shapes habit quests
};
export const DEFAULT_AVATAR: Avatar = {
  skin: "#f6d2b8", hair: "#2b2d42", hairStyle: 0, eyes: "#3b2417", outfit: "#7b2cbf", accessory: 1, heroClass: "Ninja",
};
export type Log = { id: string; day: string; kind: string; data: Record<string, unknown>; xp: number; created_at: string };
export type CustomItem = { id: string; category: string; name: string; config: Record<string, unknown>; sort: number };
export type ShopItem = {
  id: string; name: string; emoji: string; qty: number; unit: string; price: number | null; category: string; note: string;
  photo_id: string | null; status: "to_buy" | "purchased"; purchased_at: string | null; created_at: string;
};
// Things you own: bought items land here and go down as you use them.
export type PantryItem = {
  id: string; name: string; emoji: string; qty: number; unit: string; last_price: number | null; updated_at: string;
  kind?: string; photo?: string; kg?: number; note?: string; // "What I have": type, picture, weight of each piece
  ja?: string; brand?: string; expiry?: string; per?: string; kcal?: number; protein?: number; // read from the packet or the shop list
};
export type Data = {
  profile: Profile; logs: Log[]; items: CustomItem[]; shopping: ShopItem[]; pantry: PantryItem[]; deleted: string[];
};

export const UNITS = ["pcs", "kg", "g", "L", "ml", "bottle", "pack", "dozen", "box", "bag", "can", "jar"];

// Combines two copies of the data (e.g. phone and PC). Records are unioned by id,
// deletions win, the newer profile wins, and XP is recomputed from the logs.
// The latest unlock or take-back of each achievement wins on every device.
function mergeAchievements(a: Profile, b: Profile) {
  const latest = (x: Record<string, string> = {}, y: Record<string, string> = {}) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) if (!out[k] || v > out[k]) out[k] = v;
    return out;
  };
  const on = latest(a.achievements, b.achievements), off = latest(a.achievements_off, b.achievements_off);
  return { achievements: Object.fromEntries(Object.entries(on).filter(([k, v]) => !off[k] || v > off[k])), achievements_off: off };
}

// Settles rewards after a record is fixed or deleted (registered by the game layer).
let settleFn: ((before: Data, after: Data, days: string[]) => Data) | null = null;
export const registerSettle = (f: typeof settleFn) => { settleFn = f; };

export function mergeData(server: Data, local: Data): Data {
  const deleted = [...new Set([...(server.deleted ?? []), ...(local.deleted ?? [])])];
  const gone = new Set(deleted);
  const union = <T extends { id: string }>(a: T[] = [], b: T[] = []) => {
    const m = new Map(a.map((x) => [x.id, x]));
    b.forEach((x) => m.set(x.id, x));
    return [...m.values()].filter((x) => !gone.has(x.id));
  };
  const logs = union(server.logs, local.logs);
  const profile = (local.profile.updated_at ?? "") >= (server.profile.updated_at ?? "") ? local.profile : server.profile;
  return {
    profile: {
      ...profile,
      xp: logs.reduce((s, l) => s + l.xp, 0),
      ...mergeAchievements(server.profile, local.profile),
    },
    logs,
    items: union(server.items, local.items),
    shopping: union(server.shopping, local.shopping),
    pantry: union(server.pantry, local.pantry),
    deleted,
  };
}

const DEFAULT_SETTINGS: Settings = {
  water_goal_ml: 2500, milk_goal_ml: 500, sleep_goal_h: 8, budget_monthly: 5000, exam_date: null, theme: "neon",
  currency: "Rs", allowances: {},
};

export const DEFAULT_ACTIVITIES = [
  "Woke up", "Brush teeth", "Bath", "Breakfast", "Lunch", "Dinner", "Snack", "Study", "Exercise", "Walk",
  "Read", "Listen", "Clean room", "Pray", "Anime", "Manga",
];

const NEW_ACTIVITIES: [string, string][] = [
  ["seed-drive", "Drive / ride"], ["seed-toilet", "Toilet"], ["seed-run", "Run"], ["seed-coding", "Coding"],
  ["seed-typing", "Typing practice"], ["seed-writing", "Writing practice"], ["seed-listening", "Listening practice"], ["seed-speaking", "Speaking practice"],
];

const DEFAULT_REWARDS: [string, number, string][] = [
  ["1 anime episode", 60, "📺"], ["1 manga chapter", 40, "📕"], ["30 min gaming", 80, "🎮"],
  ["Favorite snack", 100, "🍫"], ["Movie night", 300, "🎬"], ["Sleep in 1 hour", 150, "🛌"],
];
const rewardItems = () => DEFAULT_REWARDS.map(([n, cost, emoji], i) => ({ id: id(), category: "reward", name: n, config: { cost, emoji }, sort: 200 + i }));

// Fills in anything older saved data is missing, so every version of the app can open it.
export function normalizeData(d: Data): Data {
  const items = d.items ?? [];
  const hasActivities = items.some((i) => i.category === "activity");
  return {
    profile: {
      ...d.profile,
      avatar: { ...DEFAULT_AVATAR, ...(d.profile.avatar ?? {}) },
      title: d.profile.title ?? "Rookie Adventurer",
      height_cm: d.profile.height_cm ?? null,
      birth_year: d.profile.birth_year ?? null,
      achievements: d.profile.achievements ?? {},
      settings: { ...DEFAULT_SETTINGS, ...d.profile.settings, allowances: d.profile.settings.allowances ?? {} },
    },
    logs: d.logs ?? [],
    items: [
      ...items,
      ...(hasActivities ? [] : DEFAULT_ACTIVITIES.map((n, i) => ({ id: id(), category: "activity", name: n, config: { emoji: emojiFor(n) }, sort: 100 + i }))),
      ...(items.some((i) => i.category === "reward") ? [] : rewardItems()),
      // Added later; stable ids so every device adds the same ones, and a deletion sticks.
      ...NEW_ACTIVITIES.filter(([sid]) => !items.some((i) => i.id === sid) && !(d.deleted ?? []).includes(sid))
        .map(([sid, n], i) => ({ id: sid, category: "activity", name: n, config: { emoji: emojiFor(n) }, sort: 200 + i })),
    ],
    shopping: (d.shopping ?? []).map((x) => {
      const legacy = x as ShopItem & { quantity?: string };
      return { ...x, emoji: x.emoji ?? emojiFor(x.name, "🛍️"), qty: x.qty ?? (Number(legacy.quantity) || 1), unit: x.unit ?? "pcs" };
    }),
    pantry: d.pantry ?? [],
    deleted: d.deleted ?? [],
  };
}
export type Celebration = { title: string; subtitle?: string; xp?: number; big?: boolean; quote?: string; icon?: string; kind?: "mission" | "achievement" | "level" | "small" };

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function initialData(name: string): Data {
  const items: [string, string, Record<string, unknown>][] = [
    ["exercise", "Push-ups", { type: "reps" }], ["exercise", "Pull-ups", { type: "reps" }], ["exercise", "Squats", { type: "reps" }],
    ["exercise", "Dumbbell curl", { type: "weight" }], ["exercise", "Barbell bench", { type: "barbell" }],
    ["meal_tag", "Breakfast", {}], ["meal_tag", "Lunch", {}], ["meal_tag", "Dinner", {}], ["meal_tag", "Snack", {}],
    ["sleep_tag", "Deep", {}], ["sleep_tag", "Restless", {}], ["sleep_tag", "Late caffeine", {}],
  ];
  return {
    profile: {
      display_name: name,
      xp: 0,
      settings: DEFAULT_SETTINGS,
      updated_at: now(),
      avatar: DEFAULT_AVATAR,
      title: "Rookie Adventurer",
      height_cm: null,
      birth_year: null,
      achievements: {},
    },
    logs: [],
    items: [
      ...items.map(([category, n, config], i) => ({ id: id(), category, name: n, config, sort: i })),
      ...DEFAULT_ACTIVITIES.map((n, i) => ({ id: id(), category: "activity", name: n, config: { emoji: emojiFor(n) }, sort: 100 + i })),
      ...rewardItems(),
    ],
    shopping: [],
    pantry: [],
    deleted: [],
  };
}

type Ctx = {
  session: Session;
  data: Data;
  profile: Profile;
  update: (fn: (d: Data) => Data) => void;
  saveSettings: (patch: Partial<Settings>) => void;
  celebrate: (c: Celebration) => void;
  celebration: Celebration | null;
  clearCelebration: () => void;
  logActivity: (kind: string, data?: Record<string, unknown>, at?: Date, xp?: number) => Log;
  // "Start now, complete later": the next logActivity call is kept as a task
  // in progress instead of a record, until you tick Complete.
  startNext: () => void;
  doing: CustomItem[];
  completeDoing: (id: string) => void;
  cancelDoing: (id: string) => void;
  saveProfile: (patch: Partial<Profile>) => void;
  updateLog: (id: string, patch: { data?: Record<string, unknown>; at?: Date }) => void;
  deleteLog: (id: string) => void;
  lock: () => void;
  signOut: () => void;
  hasPin: boolean;
};

const AppContext = createContext<Ctx | null>(null);

export const toDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => toDay(new Date());

export function AppProvider({ session, initial, onLock, onSignOut, hasPin, children }: {
  session: Session; initial: Data; onLock: () => void; onSignOut: () => void; hasPin: boolean; children: React.ReactNode;
}) {
  const [data, setData] = useState<Data>(initial);
  // Celebrations queue up so a mission, a level-up and an achievement each get their moment.
  const [celebrations, setQueue] = useState<Celebration[]>([]);
  const celebration = celebrations[0] ?? null;
  const setCelebration = useCallback((c: Celebration | null) => {
    if (c) setQueue((q) => (q.length > 4 ? q : [...q, c]));
  }, []);
  const latest = useRef(data);

  // Persist every change, encrypted, and sync it. Writes are chained so they land in order.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const apply = useCallback((next: Data) => {
    latest.current = next;
    setData(next);
  }, []);
  const update = useCallback((fn: (d: Data) => Data) => {
    apply(fn(latest.current));
    let rev = 0;
    queue.current = queue.current
      .then(() => { rev = session.rev; return save(session, latest.current, mergeData); })
      .then((merged) => {
        if (session.rev !== rev) markSynced(session.user); // the server took this save
        if (merged) apply(mergeData(merged, latest.current));
      })
      .catch(() => {});
  }, [session, apply]);

  // Pick up changes made on other devices when the app comes back into view, and every minute.
  useEffect(() => {
    const sync = () => {
      queue.current = queue.current
        .then(() => pull<Data>(session))
        .then((server) => {
          if (server || navigator.onLine) markSynced(session.user);
          if (server) apply(mergeData(server, latest.current));
        })
        .catch(() => {});
    };
    const onVis = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(sync, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
    };
  }, [session, apply]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.profile.settings.theme;
  }, [data.profile.settings.theme]);

  const starting = useRef(false);
  const quietUntil = useRef(0);
  const celebrate = useCallback((c: Celebration) => {
    // While starting a task, its "well done" waits for Complete.
    if (Date.now() < quietUntil.current) return;
    setCelebration(c);
  }, [setCelebration]);
  const startNext = useCallback(() => {
    starting.current = true;
    setTimeout(() => { starting.current = false; }, 0);
  }, []);

  const logActivity = useCallback((kind: string, payload: Record<string, unknown> = {}, at = new Date(), xpOverride?: number) => {
    if (starting.current) {
      starting.current = false;
      quietUntil.current = Date.now() + 400;
      const name = String(payload.name ?? payload.exercise ?? payload.title ?? payload.lang ?? kind);
      const item: CustomItem = { id: id(), category: "doing", name, sort: Date.now(), config: { kind, data: payload, xp: xpOverride ?? null, started: new Date().toISOString(), emoji: payload.emoji ?? null } };
      update((d) => ({ ...d, items: [...d.items, item] }));
      setCelebration({ title: "▶ STARTED", subtitle: `${name}. Tick ✓ Complete when you finish.`, kind: "small" });
      return { id: item.id, day: toDay(at), kind, data: payload, xp: 0, created_at: at.toISOString() };
    }
    const xp = xpOverride ?? XP[kind] ?? 5;
    // Real-world common sense: move records that clash with sleep, driving, training…
    const fix = realityCheck(kind, payload, at, latest.current.logs);
    const extra: Log[] = [];
    if (fix) {
      at = fix.at;
      if (fix.endSleep) {
        const hm = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
        extra.push({ id: id(), day: toDay(at), kind: "wake", data: { time: hm, slept_from: fix.endSleep.data.start, auto: true }, xp: XP.wake ?? 15, created_at: new Date(at.getTime() - 1000).toISOString() });
      }
      setCelebration({ title: "🧠 REALITY CHECK", subtitle: fix.message, kind: "small" });
    }
    const log: Log = { id: id(), day: toDay(at), kind, data: payload, xp, created_at: at.toISOString() };
    const before = latest.current.profile.xp;
    const ended = fix?.endSleep?.id;
    update((d) => ({
      ...d,
      logs: [...d.logs.map((l) => (l.id === ended ? { ...l, data: { ...l.data, end: at.toISOString() } } : l)), ...extra, log],
      profile: { ...d.profile, xp: d.profile.xp + xp + extra.reduce((n, l) => n + l.xp, 0) },
    }));
    if (Math.floor((before + xp) / 100) > Math.floor(before / 100)) {
      setCelebration({ title: "LEVEL UP!", subtitle: `Level ${Math.floor((before + xp) / 100) + 1}`, big: true, kind: "level", icon: "⬆️" });
    }
    return log;
  }, [update, setCelebration]);

  const doing = useMemo(() => data.items.filter((i) => i.category === "doing"), [data.items]);
  const cancelDoing = useCallback((itemId: string) => update((d) => ({ ...d, items: d.items.filter((i) => i.id !== itemId), deleted: [...d.deleted, itemId] })), [update]);
  const completeDoing = useCallback((itemId: string) => {
    const it = latest.current.items.find((i) => i.id === itemId);
    if (!it) return;
    const c = it.config as { kind: string; data: Record<string, unknown>; xp: number | null; started: string };
    const mins = Math.max(1, Math.round((Date.now() - new Date(c.started).getTime()) / 60_000));
    cancelDoing(itemId);
    const row = logActivity(c.kind, { ...c.data, minutes: c.data.minutes ?? mins, started_at: c.started }, new Date(), c.xp ?? undefined);
    setCelebration({ title: "✓ COMPLETE!", subtitle: `${it.name} · ${mins} min`, xp: row.xp, icon: String(c.data.emoji ?? "✅") });
  }, [cancelDoing, logActivity, setCelebration]);

  const value: Ctx = {
    session,
    data,
    profile: data.profile,
    update,
    saveSettings: (patch) => update((d) => ({ ...d, profile: { ...d.profile, settings: { ...d.profile.settings, ...patch }, updated_at: now() } })),
    celebrate,
    celebration,
    clearCelebration: () => setQueue((q) => q.slice(1)),
    saveProfile: (patch) => update((d) => ({ ...d, profile: { ...d.profile, ...patch, updated_at: now() } })),
    logActivity,
    startNext,
    doing,
    completeDoing,
    cancelDoing,
    updateLog: (logId, { data: patch, at }) => update((d) => {
      const old = d.logs.find((l) => l.id === logId);
      const next = {
        ...d,
        logs: d.logs.map((l) => l.id !== logId ? l : {
          ...l,
          data: patch ? { ...l.data, ...patch } : l.data,
          ...(at ? { day: toDay(at), created_at: at.toISOString() } : {}),
        }),
      };
      return settleFn && old ? settleFn(d, next, [old.day, ...(at ? [toDay(at)] : [])]) : next;
    }),
    deleteLog: (logId) => {
      const before = latest.current.logs;
      update((d) => {
      const l = d.logs.find((x) => x.id === logId);
      const next = {
        ...d,
        logs: d.logs.filter((x) => x.id !== logId),
        deleted: [...d.deleted, logId],
        profile: { ...d.profile, xp: Math.max(0, d.profile.xp - (l?.xp ?? 0)) },
      };
      return settleFn && l ? settleFn(d, next, [l.day]) : next;
      });
      // Offer an undo for the record and any reward it took with it.
      const kept = new Set(latest.current.logs.map((x) => x.id));
      noteDeleted(before.filter((x) => !kept.has(x.id)));
    },
    lock: onLock,
    signOut: onSignOut,
    hasPin,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

export function useLogs(from: string, to: string = from) {
  const { data } = useApp();
  const logs = useMemo(
    () => data.logs.filter((l) => l.day >= from && l.day <= to).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data.logs, from, to],
  );
  return { logs };
}

export function useCustomItems(category: string) {
  const { data, update } = useApp();
  const items = useMemo(() => data.items.filter((i) => i.category === category).sort((a, b) => a.sort - b.sort), [data.items, category]);
  return {
    items,
    add: (name: string, config: Record<string, unknown> = {}) =>
      update((d) => ({ ...d, items: [...d.items, { id: id(), category, name, config, sort: Date.now() }] })),
    update: (itemId: string, patch: Partial<CustomItem>) =>
      update((d) => ({ ...d, items: d.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) })),
    remove: (itemId: string) => {
      const gone = data.items.find((i) => i.id === itemId);
      update((d) => ({ ...d, items: d.items.filter((i) => i.id !== itemId), deleted: [...d.deleted, itemId] }));
      if (gone) noteDeleted([], [gone]);
    },
  };
}
