"use client";

import { useMemo, useState } from "react";
import { care } from "@/lib/care";
import { LONG_LIFE } from "@/lib/goodness";
import { useApp } from "@/lib/store";

// "Take care of me": what's too much, what's missing and what to take,
// from the last 7 days of meals and habits.
export function CareCard({ open: start = false }: { open?: boolean }) {
  const { data } = useApp();
  const c = useMemo(() => care(data), [data]);
  const [open, setOpen] = useState(start);
  const bad = c.warns.filter((w) => w.level === "bad").length;
  const lowHabits = c.habits.filter((h) => !h.ok);
  return (
    <section className="card p-4 mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <h2 className="section-title">🩺 Take care of me</h2>
        <span className="text-xs text-muted">{c.warns.length + c.needs.length + lowHabits.length ? `${c.warns.length} warnings · ${c.needs.length} missing · ${lowHabits.length} habits ${open ? "▲" : "▼"}` : "All good ✓"}</span>
      </button>
      {c.take.length > 0 && (
        <div className={`mt-3 rounded-xl p-3 text-xs ${bad ? "bg-rose-500/10 border border-rose-400/30" : "bg-amber-400/10 border border-amber-300/30"}`}>
          <div className="font-semibold mb-1">✅ Make sure you take</div>
          <ul className="list-disc pl-4 space-y-0.5">{c.take.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      {!c.days && <p className="text-xs text-muted mt-2">Log your meals (with packet labels when you can) and I&apos;ll check what you eat every day.</p>}
      {open && (
        <div className="mt-3 space-y-3 text-xs">
          {c.days > 0 && <div className="text-muted">Last 7 days, {c.days} days with food logged: about {c.avg.kcal} kcal and {c.avg.protein} g protein a day{c.avg.sugar != null ? `, ${c.avg.sugar} g sugar` : ""}{c.avg.salt != null ? `, ${c.avg.salt} g salt` : ""}.</div>}
          {c.warns.length > 0 && (
            <div className="space-y-1.5">
              <div className="font-semibold">⚠️ Too much</div>
              {c.warns.map((w) => (
                <div key={w.text} className={`rounded-lg p-2 ${w.level === "bad" ? "bg-rose-500/10" : "bg-white/5"}`}>
                  <div>{w.icon} {w.text}</div><div className="text-emerald-300 mt-0.5">→ {w.fix}</div>
                </div>
              ))}
            </div>
          )}
          {c.needs.length > 0 && (
            <div>
              <div className="font-semibold mb-1">🥗 Missing in your food</div>
              <table className="w-full">
                <tbody>
                  {c.needs.map((n) => (
                    <tr key={n.name} className="border-t border-white/5 align-top">
                      <td className="py-1 pr-1">{n.icon}</td>
                      <td className="py-1 pr-2 whitespace-nowrap">{n.name}</td>
                      <td className="py-1 pr-2 text-muted whitespace-nowrap">{n.days}/7 days</td>
                      <td className="py-1">{n.take}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div>
            <div className="font-semibold mb-1">🌱 What you need for a long, healthy life</div>
            <table className="w-full">
              <tbody>
                {LONG_LIFE.map(([i, n, t]) => <tr key={n} className="border-t border-white/5 align-top"><td className="py-1 pr-1">{i}</td><td className="py-1 pr-2 whitespace-nowrap font-semibold">{n}</td><td className="py-1">{t}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div>
            <div className="font-semibold mb-1">📊 Your habits this week</div>
            <table className="w-full">
              <tbody>
                {c.habits.map((h) => (
                  <tr key={h.name} className="border-t border-white/5 align-top">
                    <td className="py-1 pr-1">{h.icon}</td>
                    <td className="py-1 pr-2"><div>{h.name} <span className="text-muted">· {h.have} / {h.goal}</span></div>{!h.ok && <div className="text-amber-300">→ {h.fix}</div>}</td>
                    <td className={`py-1 text-right ${h.ok ? "text-emerald-300" : "text-amber-300"}`}>{h.ok ? "✓" : "○"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
