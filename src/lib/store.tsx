"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { saveVault, type Session } from "@/lib/vault";
import { XP } from "@/lib/xp";

export type Settings = {
  water_goal_ml: number;
  milk_goal_ml: number;
  sleep_goal_h: number;
  budget_monthly: number;
  exam_date: string | null;
  theme: string;
};
export type Profile = { display_name: string; xp: number; settings: Settings };
export type Log = { id: string; day: string; kind: string; data: Record<string, unknown>; xp: number; created_at: string };
export type CustomItem = { id: string; category: string; name: string; config: Record<string, unknown>; sort: number };
export type ShopItem = {
  id: string; name: string; quantity: string; price: number | null; category: string; note: string;
  photo_id: string | null; status: "to_buy" | "purchased"; purchased_at: string | null; created_at: string;
};
export type Data = { profile: Profile; logs: Log[]; items: CustomItem[]; shopping: ShopItem[] };
export type Celebration = { title: string; subtitle?: string; xp?: number; big?: boolean };

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
      settings: { water_goal_ml: 2500, milk_goal_ml: 500, sleep_goal_h: 8, budget_monthly: 300, exam_date: null, theme: "neon" },
    },
    logs: [],
    items: items.map(([category, n, config], i) => ({ id: id(), category, name: n, config, sort: i })),
    shopping: [],
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
  logActivity: (kind: string, data?: Record<string, unknown>, day?: string) => Log;
  deleteLog: (id: string) => void;
  lock: () => void;
};

const AppContext = createContext<Ctx | null>(null);

export const toDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => toDay(new Date());

export function AppProvider({ session, initial, onLock, children }: {
  session: Session; initial: Data; onLock: () => void; children: React.ReactNode;
}) {
  const [data, setData] = useState<Data>(initial);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const latest = useRef(data);

  // Persist every change, encrypted. Writes are chained so they land in order.
  const queue = useRef(Promise.resolve());
  const update = useCallback((fn: (d: Data) => Data) => {
    const next = fn(latest.current);
    latest.current = next;
    setData(next);
    queue.current = queue.current.then(() => saveVault(session, next)).catch(() => {});
  }, [session]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.profile.settings.theme;
  }, [data.profile.settings.theme]);

  const celebrate = useCallback((c: Celebration) => setCelebration(c), []);

  const logActivity = useCallback((kind: string, payload: Record<string, unknown> = {}, day = today()) => {
    const xp = XP[kind] ?? 5;
    const log: Log = { id: id(), day, kind, data: payload, xp, created_at: now() };
    const before = latest.current.profile.xp;
    update((d) => ({ ...d, logs: [...d.logs, log], profile: { ...d.profile, xp: d.profile.xp + xp } }));
    if (Math.floor((before + xp) / 100) > Math.floor(before / 100)) {
      setTimeout(() => setCelebration({ title: "LEVEL UP!", subtitle: `Level ${Math.floor((before + xp) / 100) + 1}`, xp, big: true }), 900);
    }
    return log;
  }, [update]);

  const value: Ctx = {
    session,
    data,
    profile: data.profile,
    update,
    saveSettings: (patch) => update((d) => ({ ...d, profile: { ...d.profile, settings: { ...d.profile.settings, ...patch } } })),
    celebrate,
    celebration,
    clearCelebration: () => setCelebration(null),
    logActivity,
    deleteLog: (logId) => update((d) => {
      const l = d.logs.find((x) => x.id === logId);
      return { ...d, logs: d.logs.filter((x) => x.id !== logId), profile: { ...d.profile, xp: Math.max(0, d.profile.xp - (l?.xp ?? 0)) } };
    }),
    lock: onLock,
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
  const logs = useMemo(() => data.logs.filter((l) => l.day >= from && l.day <= to), [data.logs, from, to]);
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
    remove: (itemId: string) => update((d) => ({ ...d, items: d.items.filter((i) => i.id !== itemId) })),
  };
}
