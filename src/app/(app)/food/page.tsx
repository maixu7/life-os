"use client";

import Link from "next/link";
import { useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { Blocks, QuickBar } from "@/components/Blocks";
import { CareCard } from "@/components/CareCard";
import { EatNextList } from "@/components/FixCard";
import { DrinkSheet } from "@/components/Drinks";
import { FoodThumbs, MealSheet, MealsCard } from "@/components/Meals";
import { Pic } from "@/components/Pic";
import { haveFoods, whenToEat } from "@/lib/have";
import type { Eaten } from "@/lib/body";
import { LabelScan } from "@/components/LabelScan";
import { MyFoodForm, MyFoodsList } from "@/components/FoodPicker";
import { BottleCard, CaffeineCard, FoodCostCard, FoodIdeas, ProteinCard, UsualMeals } from "@/components/FoodPlus";
import { energy } from "@/lib/body";
import { toDay, useApp } from "@/lib/store";

// Everything about food: today's meals, reading packets, your foods and the
// last 7 days of calories and protein.
export default function FoodPage() {
  const { data } = useApp();
  const [eat, setEat] = useState<string | null>(null);
  const [drink, setDrink] = useState(false);
  const mine = haveFoods(data.pantry);
  const days = Array.from({ length: 7 }, (_, i) => toDay(new Date(Date.now() - i * 86_400_000)));
  return (
    <>
      <XpHeader title="Food" icon="🍱" subtitle="What you eat, with real calories" />
      <Blocks page="/food" parts={{
        quick: <QuickBar />,
        usual: <UsualMeals />, protein: <ProteinCard />, coffee: <CaffeineCard />, bottle: <BottleCard />, ideas: <FoodIdeas />, cost: <FoodCostCard />,
        meals: (
        <>
      <MealsCard />
        </>
        ),
        drink: (
        <>
      <button onClick={() => setDrink(true)} className="btn-ghost w-full mb-4 border border-dashed border-white/25 text-sm">🥤 Log a drink (tea, coffee, sports drink, cola, soy milk…)</button>
      {drink && <DrinkSheet onClose={() => setDrink(false)} />}
        </>
        ),
        next: (
        <>
      <div className="mb-4"><EatNextList /></div>
        </>
        ),
        care: (
        <>
      <CareCard open />
        </>
        ),
        have: (
        <>
      <section className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">🎒 Food you have</h2>
          <Link href="/have" className="text-xs text-[var(--accent2)]">Edit list ›</Link>
        </div>
        {mine.length === 0 ? <p className="text-xs text-muted">Add the food, fruit and drinks you have at home in What I have, and they show up here with the best time to eat them.</p> : (
          <ul className="space-y-1.5">
            {mine.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-xs">
                <Pic name={p.name} emoji={p.emoji} size={34} src={p.photo} />
                <span className="flex-1 min-w-0"><b>{p.name}</b> <span className="text-muted">× {p.qty}</span><br /><span className="text-muted">{whenToEat(p.name)}</span></span>
                <button onClick={() => setEat(p.name)} className="chip !py-0.5 text-[11px]">🍽️ Eat</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {eat && <MealSheet start={[eat]} onClose={() => setEat(null)} />}
        </>
        ),
        packet: (
        <>
      <section className="card p-4 mb-4 space-y-3">
        <h2 className="section-title">🏷️ New packet food</h2>
        <LabelScan />
        <MyFoodForm />
      </section>
        </>
        ),
        week: (
        <>
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">📅 Last 7 days</h2>
        <table className="w-full text-xs">
          <thead><tr className="text-muted text-left"><th className="py-1">Day</th><th>Eaten</th><th>Burned</th><th>Protein</th><th>Ate</th></tr></thead>
          <tbody>
            {days.map((d) => {
              const e = energy(data, d);
              const meals = data.logs.filter((l) => l.day === d && l.kind === "activity" && (!!l.data.meal || /breakfast|lunch|dinner|snack/i.test(String(l.data.name)))).length;
              return (
                <tr key={d} className="border-t border-white/5">
                  <td className="py-1.5">{new Date(`${d}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</td>
                  <td>{e.intake} kcal</td><td>{e.out} kcal</td><td>{e.protein} g</td><td>{meals ? <FoodThumbs size={18} foods={data.logs.filter((l) => l.day === d).flatMap((l) => (l.data.foods as Eaten[] | undefined) ?? [])} /> : null}{meals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
        </>
        ),
        mine: (
        <>
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">🍽️ My foods</h2>
        <MyFoodsList />
      </section>
        </>
        ),
      }} />
    </>
  );
}
