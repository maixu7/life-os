"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { openSlotSheet } from "@/components/Blocks";
import { useRunAction, useTasks } from "@/components/Coach";
import { sumMl } from "@/lib/goals";
import { autoList, toShopItem } from "@/lib/grocery";
import { haveFoods, itemKind, whenToEat } from "@/lib/have";
import { atWork, phaseNow, sched } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";
import { eatNext } from "@/lib/worst";

// Today's guide: reads everything (What I have, today's food and drinks,
// the shopping list, your schedule and gaps) and says what to eat, drink,
// buy and do next. Every line opens the place where you do it.

const meal = (h: number) => (h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 22 ? "Dinner" : "Snack");
// What to buy when nothing at home covers a lack.
const BUY: Record<string, [string, string]> = { "🍗": ["Eggs", "🥚"], "🥦": ["Vegetables", "🥦"], "🍎": ["Fruit", "🍎"], "🥛": ["Milk", "🥛"], "🫘": ["Tofu", "🫘"], "🌾": ["Oats", "🌾"] };
const DONE = new Set(["sugar", "caffeine", "expiry", "restock", "shop"]); // shown in Drink / Buy instead

function Row({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-2.5">
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          {sub && <div className="text-xs text-muted">{sub}</div>}
        </div>
      </div>
      {children && <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}

export function GuideCard() {
  const { data, update, celebrate } = useApp();
  const tasks = useTasks();
  const run = useRunAction();
  const [tab, setTab] = useState<"eat" | "drink" | "buy" | "health">("eat");
  const now = new Date();
  const h = now.getHours();
  const work = atWork(phaseNow(sched(data.profile.settings.schedule), now));
  const day = toDay(now);
  const logs = useMemo(() => data.logs.filter((l) => l.day === day), [data.logs, day]);

  // ---- Eat: what you lack today, matched to what you have at home ----
  const eat = useMemo(() => eatNext(data, now), [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const food = haveFoods(data.pantry).filter((p) => itemKind(p) !== "drink");
  const soon = food.filter((p) => p.expiry && (new Date(`${p.expiry}T23:59`).getTime() - now.getTime()) / 86_400_000 < 3)
    .sort((a, b) => a.expiry!.localeCompare(b.expiry!));

  // ---- Drink: water against the goal, sugar and caffeine so far ----
  const goal = data.profile.settings.water_goal_ml;
  const water = sumMl(logs, "water");
  const drinks = logs.filter((l) => l.kind === "drink");
  const sugar = drinks.reduce((n, l) => n + (Number(l.data.sugar) || 0), 0);
  const caffeine = drinks.reduce((n, l) => n + (Number(l.data.caffeine) || 0), 0);
  const want = Math.round(goal * Math.min(1, Math.max(0.15, (h - 7) / 14)));
  const mine = data.items.filter((i) => i.category === "drink").map((i) => i.name);
  const home = haveFoods(data.pantry).filter((p) => itemKind(p) === "drink").map((p) => p.name);
  const okDrink = (n: string) => !(sugar > 25 && /cola|soda|juice|calpis|sweet|energy|shake|frappe|latte|bubble|boba/i.test(n))
    && !((caffeine > 300 || (caffeine > 100 && h >= 15)) && /coffee|espresso|latte|energy|red ?bull|monster|matcha|black tea|green tea/i.test(n));
  const pickDrinks = [...new Set([...home, ...mine])].filter(okDrink).slice(0, 6);

  // ---- Buy: ran out, almost gone, expired, and regulars due ----
  const needs = autoList(data, now);
  const toBuy = data.shopping.filter((s) => s.status === "to_buy");
  const add = (ns: typeof needs) => {
    update((d) => ({ ...d, shopping: [...d.shopping, ...ns.map(toShopItem)] }));
    celebrate({ title: "🛒 ADDED", subtitle: `${ns.map((n) => n.name).slice(0, 3).join(", ")} on your shopping list.`, xp: 0, icon: "🛒" });
  };

  // ---- Health: the coach's next steps, minus what the tabs above cover ----
  const health = tasks.filter((t) => !DONE.has(t.id)).slice(0, 4);

  const tabs = [
    ["eat", "🍱", "Eat", eat.filter((e) => !e.avoid).length + soon.length],
    ["drink", "🥤", "Drink", water < want ? 1 : 0],
    ["buy", "🛒", "Buy", needs.length],
    ["health", "❤️", "Health", health.length],
  ] as const;

  return (
    <section className="card frame p-3 mb-4" data-guide>
      <h2 className="section-title">🧭 Today&apos;s guide</h2>
      <p className="text-[11px] text-muted mb-2">Read from what you have, ate, drank and did today{work ? ". You're at work, so study and training wait." : "."}</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {tabs.map(([id, icon, label, n]) => (
          <button key={id} onClick={() => setTab(id)} className={`relative rounded-xl py-2 text-center text-xs font-semibold ${tab === id ? "bg-[var(--accent)]/25 ring-1 ring-[var(--accent)]" : "bg-white/5"}`}>
            <span className="block text-xl">{icon}</span>{label}
            {n > 0 && <span className="absolute top-1 right-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] leading-4 text-white">{n}</span>}
          </button>
        ))}
      </div>

      {tab === "eat" && (
        <div className="space-y-2">
          {soon.length > 0 && (
            <Row icon="⏳" title={`Eat first: ${soon.slice(0, 3).map((p) => p.name).join(", ")}`} sub={`Best before ${soon[0].expiry}. Use it before it goes bad.`}>
              <button className="chip chip-on" onClick={() => openSlotSheet({ kind: "meal", name: meal(h) })}>🍽️ Log {meal(h).toLowerCase()}</button>
            </Row>
          )}
          {eat.map((e) => (
            <Row key={e.what} icon={e.icon} title={e.what} sub={e.have.length ? `You have: ${e.have.join(", ")}` : `Try ${e.why}${e.avoid ? "" : ". Nothing for this at home yet."}`}>
              {e.have.slice(0, 3).map((n) => <span key={n} className="chip" title={whenToEat(n)}>{n}</span>)}
              {!e.avoid && <button className="chip chip-on" onClick={() => openSlotSheet({ kind: "meal", name: meal(h) })}>🍽️ I ate it</button>}
              {!e.avoid && !e.have.length && BUY[e.icon] && !toBuy.some((s) => s.name === BUY[e.icon][0]) && (
                <button className="chip" onClick={() => add([{ name: BUY[e.icon][0], emoji: BUY[e.icon][1], qty: 1, unit: "pack", price: null, category: "", why: "", rank: 0 }])}>＋ {BUY[e.icon][0]} to list</button>
              )}
            </Row>
          ))}
          {!eat.length && !soon.length && <Row icon="✅" title="Food is on track today" sub={food.length ? `At home: ${food.slice(0, 5).map((p) => p.name).join(", ")}` : "Add what's in your kitchen so Sensei can pick meals from it."} />}
          {!food.length && <Link href="/have" className="btn-ghost block text-center text-xs !py-2">📦 Add what&apos;s in your kitchen</Link>}
        </div>
      )}

      {tab === "drink" && (
        <div className="space-y-2">
          <Row icon="💧" title={water >= goal ? "Water goal reached" : `Water: ${water} of ${goal} ml`} sub={water >= goal ? "Sip when thirsty." : water < want ? `You should be near ${want} ml by now. Drink a glass now.` : "On track. Keep a glass every 1 to 2 hours."}>
            <button className="chip chip-on" onClick={() => openSlotSheet({ kind: "drink", cat: "water" })}>💧 Drink water</button>
          </Row>
          {sugar > 25 && <Row icon="🚫" title="No more sweet drinks today" sub={`${Math.round(sugar)} g sugar from drinks already (ideal under 25 g a day).`} />}
          {(caffeine > 300 || (caffeine > 100 && h >= 15)) && <Row icon="☕" title="No more caffeine today" sub={`About ${caffeine} mg so far${h >= 15 ? " and it's afternoon, so it will hurt your sleep" : ""}.`} />}
          <Row icon="🥤" title={pickDrinks.length ? "Good picks from what you have" : "Other drinks"} sub={pickDrinks.length ? "Filtered by today's sugar and caffeine." : "Save drinks you like and Sensei will suggest them here."}>
            {pickDrinks.map((n) => <span key={n} className="chip">{n}</span>)}
            <button className="chip chip-on" onClick={() => openSlotSheet({ kind: "drink" })}>🥤 Log a drink</button>
          </Row>
          {h >= 6 && h < 12 && data.profile.settings.milk_goal_ml > 0 && sumMl(logs, "milk") === 0 && (
            <Row icon="🥛" title="A glass of milk this morning" sub="Calcium and protein for the day.">
              <button className="chip chip-on" onClick={() => openSlotSheet({ kind: "drink", cat: "milk" })}>🥛 Log milk</button>
            </Row>
          )}
        </div>
      )}

      {tab === "buy" && (
        <div className="space-y-2">
          {needs.length ? (
            <>
              {needs.slice(0, 8).map((n) => (
                <div key={n.name} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
                  <span className="text-xl">{n.emoji}</span>
                  <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{n.name}</span><span className="block text-xs text-muted">{n.why}{n.price != null ? ` · ¥${n.price}` : ""}</span></span>
                  <button className="chip chip-on" onClick={() => add([n])}>＋ List</button>
                </div>
              ))}
              {needs.length > 1 && <button className="btn-primary w-full !py-2 text-sm" onClick={() => add(needs)}>＋ Add all {needs.length} to the shopping list</button>}
            </>
          ) : <Row icon="✅" title="Nothing running low" sub="When something in What I have runs out or gets low, it shows here." />}
          <Link href="/shop" className="btn-ghost block text-center text-xs !py-2">🛒 Shopping list ({toBuy.length} to buy)</Link>
        </div>
      )}

      {tab === "health" && (
        <div className="space-y-2">
          {health.map((t) => (
            <button key={t.id} onClick={() => run(t.action)} className="w-full text-left rounded-xl bg-white/5 p-2.5 active:scale-[.98] transition">
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none mt-0.5">{t.icon}</span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{t.title}</span><span className="block text-xs text-muted">{t.because}</span></span>
                <span className="text-muted">›</span>
              </div>
            </button>
          ))}
          {!health.length && !work && <Row icon="🌟" title="All healthy steps done for now" sub="Read a few pages or rest." />}
        </div>
      )}
    </section>
  );
}
