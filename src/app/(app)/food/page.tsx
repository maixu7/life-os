"use client";

import { XpHeader } from "@/components/XpHeader";
import { MealsCard } from "@/components/Meals";
import { LabelScan } from "@/components/LabelScan";
import { MyFoodForm, MyFoodsList } from "@/components/FoodPicker";
import { energy } from "@/lib/body";
import { toDay, useApp } from "@/lib/store";

// Everything about food: today's meals, reading packets, your foods and the
// last 7 days of calories and protein.
export default function FoodPage() {
  const { data } = useApp();
  const days = Array.from({ length: 7 }, (_, i) => toDay(new Date(Date.now() - i * 86_400_000)));
  return (
    <>
      <XpHeader title="Food" icon="🍱" subtitle="What you eat, with real calories" />
      <MealsCard />
      <section className="card p-4 mb-4 space-y-3">
        <h2 className="section-title">🏷️ New packet food</h2>
        <LabelScan />
        <MyFoodForm />
      </section>
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">📅 Last 7 days</h2>
        <table className="w-full text-xs">
          <thead><tr className="text-muted text-left"><th className="py-1">Day</th><th>Eaten</th><th>Burned</th><th>Protein</th><th>Meals</th></tr></thead>
          <tbody>
            {days.map((d) => {
              const e = energy(data, d);
              const meals = data.logs.filter((l) => l.day === d && l.kind === "activity" && /breakfast|lunch|dinner|snack/i.test(String(l.data.name))).length;
              return (
                <tr key={d} className="border-t border-white/5">
                  <td className="py-1.5">{new Date(`${d}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</td>
                  <td>{e.intake} kcal</td><td>{e.out} kcal</td><td>{e.protein} g</td><td>{meals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">🍽️ My foods</h2>
        <MyFoodsList />
      </section>
    </>
  );
}
