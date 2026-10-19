"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Pic } from "@/components/Pic";
import { emojiFor } from "@/lib/emoji";
import { aiPhoto, readReceipt, type ReceiptLine } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { autoList, toShopItem } from "@/lib/grocery";
import { CATS, catIcon, jarPace, jars, monthKey, nextCharge, paidThisMonth, paydayDue, paydayPlan, perMonth, spendByCat, subOf, subsMonthly, worth, type Jar } from "@/lib/money";
import { toDay, UNITS, useApp, useCustomItems, type Data, type PantryItem, type ShopItem } from "@/lib/store";

// Money tools: category budgets, savings jars, subscriptions, payday with
// "pay yourself first", the receipt scanner and the grocery list that writes itself.

const useMoney = () => { const { profile } = useApp(); const cur = profile.settings.currency; return (n: number) => `${cur} ${Math.round(n).toLocaleString()}`; };

// ---------- Shop page row ----------
export function MoneyTools() {
  const { data } = useApp();
  const [open, setOpen] = useState("");
  const due = paydayDue(data) && !data.profile.settings.payday?.auto;
  return (
    <>
      {due && <button onClick={() => setOpen("payday")} className="card w-full p-3 mb-3 text-left text-sm border border-[var(--gold)]/60">💴 <b>Payday!</b> Pay yourself first: put savings aside before spending. <span className="text-[var(--accent2)]">Tap →</span></button>}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
        {[["receipt", "🧾 Scan receipt"], ["jars", "🫙 Savings jars"], ["subs", "📺 Subscriptions"], ["payday", "💴 Payday"], ["budgets", "🎯 Budgets"]].map(([k, l]) => (
          <button key={k} onClick={() => setOpen(k)} className="chip shrink-0 text-xs">{l}</button>
        ))}
      </div>
      {open === "receipt" && <ReceiptSheet onClose={() => setOpen("")} />}
      {open === "jars" && <JarsSheet onClose={() => setOpen("")} />}
      {open === "subs" && <SubsSheet onClose={() => setOpen("")} />}
      {open === "payday" && <PaydaySheet onClose={() => setOpen("")} />}
      {open === "budgets" && <BudgetsSheet onClose={() => setOpen("")} />}
    </>
  );
}

// ---------- 45. Category budgets ----------
export function CategoryBudgets({ month }: { month: string }) {
  const { data, profile, saveSettings } = useApp();
  const money = useMoney();
  const { items } = useCustomItems("subscription");
  const spent = spendByCat(data, month, items.map(subOf));
  const budgets = profile.settings.cat_budgets ?? {};
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const cats = [...new Set([...Object.keys(budgets), ...Object.keys(spent)])].sort((a, b) => (spent[b] ?? 0) - (spent[a] ?? 0));
  const free = CATS.map(([c]) => c).filter((c) => !cats.includes(c));
  const open = (c: string) => { setVal(String(budgets[c] ?? "")); setEdit(c); };
  return (
    <section className="card p-4 mb-4">
      <h2 className="font-bold mb-2">🎯 Spending and budgets</h2>
      {cats.length === 0 && <p className="text-xs text-muted">No spending yet this month. Set a budget per category below.</p>}
      <div className="space-y-2">
        {cats.map((c) => {
          const s = spent[c] ?? 0, b = budgets[c];
          const pct = b ? (s / b) * 100 : 0;
          return (
            <button key={c} onClick={() => open(c)} className="block w-full text-left text-xs">
              <div className="flex justify-between"><span>{catIcon(c)} {c}</span><span className="tabular-nums">{money(s)}{b ? <span className="text-muted"> / {money(b)}</span> : <span className="text-muted"> · set budget ✎</span>}</span></div>
              <div className="bar !h-2.5 mt-0.5"><div style={{ width: `${b ? Math.min(100, pct) : 100}%`, background: !b ? "rgba(255,255,255,.18)" : pct > 100 ? "#ff3b5c" : pct > 80 ? "#fbbf24" : undefined }} /></div>
              {b > 0 && pct > 100 && <div className="text-[10px] text-rose-300">Over by {money(s - b)}. Pause {c.toLowerCase()} until next month.</div>}
            </button>
          );
        })}
      </div>
      {free.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {free.map((c) => <button key={c} onClick={() => open(c)} className="chip !py-0.5 text-[10px] text-muted">+ {catIcon(c)} {c}</button>)}
        </div>
      )}
      {edit && (
        <Sheet title={`${catIcon(edit)} ${edit} budget a month`} onClose={() => setEdit(null)}>
          <input autoFocus className="input text-2xl font-bold" inputMode="numeric" placeholder="0" value={val} onChange={(e) => setVal(e.target.value)} />
          <div className="flex gap-2">
            {budgets[edit] != null && <button className="btn-ghost text-rose-300" onClick={() => { const { [edit]: _x, ...rest } = budgets; void _x; saveSettings({ cat_budgets: rest }); setEdit(null); }}>Remove</button>}
            <button className="btn-primary flex-1" onClick={() => { saveSettings({ cat_budgets: { ...budgets, [edit]: Number(val) || 0 } }); setEdit(null); }}>Save</button>
          </div>
          <p className="text-xs text-muted">Use the same category name when you add items (Food, Snacks, Fun…). Receipts fill it in for you.</p>
        </Sheet>
      )}
    </section>
  );
}
export function BudgetsSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="🎯 Budgets" onClose={onClose}><CategoryBudgets month={monthKey()} /></Sheet>;
}

// ---------- 46. Savings jars ----------
function JarArt({ pct, emoji }: { pct: number; emoji: string }) {
  const f = Math.max(0, Math.min(1, pct));
  return (
    <svg width="64" height="76" viewBox="0 0 64 76" aria-hidden>
      <defs><clipPath id="jarbody"><path d="M10 18 Q6 22 6 30 L6 64 Q6 72 14 72 L50 72 Q58 72 58 64 L58 30 Q58 22 54 18 Z" /></clipPath></defs>
      <rect x="14" y="4" width="36" height="10" rx="3" fill="currentColor" opacity=".35" />
      <g clipPath="url(#jarbody)">
        <rect x="0" y={18 + 54 * (1 - f)} width="64" height={54 * f + 2} fill="var(--gold, #fbbf24)" opacity=".85" />
        {f > 0.05 && [0, 1, 2].map((i) => <circle key={i} cx={18 + i * 14} cy={Math.min(66, 18 + 54 * (1 - f) + 6)} r="4" fill="#fde68a" opacity=".7" />)}
      </g>
      <path d="M10 18 Q6 22 6 30 L6 64 Q6 72 14 72 L50 72 Q58 72 58 64 L58 30 Q58 22 54 18 Z" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" />
      <text x="32" y="50" textAnchor="middle" fontSize="18">{emoji}</text>
    </svg>
  );
}
export function JarsSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const money = useMoney();
  const { items, add, update, remove } = useCustomItems("savings");
  const { jars: list, loose } = jars(data, items);
  const [form, setForm] = useState<{ id?: string; name: string; emoji: string; target: string } | null>(null);
  const [amt, setAmt] = useState<Record<string, string>>({});
  const total = list.reduce((n, j) => n + j.saved, 0) + loose;
  const put = (j: Jar, sign: 1 | -1) => {
    const a = Number(amt[j.id]);
    if (!a) return;
    if (sign > 0) {
      const row = logActivity("save", { amount: a, jar: j.id, note: j.name }, new Date(), 10);
      const done = j.target > 0 && j.saved < j.target && j.saved + a >= j.target;
      celebrate({ title: done ? "🏆 JAR FULL!" : "🫙 SAVED!", subtitle: done ? `${j.name}: goal reached! ${money(j.target)}` : `${money(a)} into ${j.name}`, xp: row.xp, big: done, icon: j.emoji });
    } else logActivity("withdraw", { amount: Math.min(a, Math.max(0, j.saved)), jar: j.id, note: j.name }, new Date(), 0);
    setAmt({ ...amt, [j.id]: "" });
  };
  return (
    <Sheet title="🫙 Savings jars" onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3 flex justify-between items-center">
        <div><div className="text-xs text-muted">Saved in all jars</div><div className="font-game text-2xl gold-text">{money(total)}</div></div>
        <button onClick={() => setForm({ name: "", emoji: "🫙", target: "" })} className="chip chip-on">＋ New jar</button>
      </div>
      {loose > 0 && <p className="text-xs text-muted">{money(loose)} saved before jars. Make a jar and it goes in there.</p>}
      {list.length === 0 && <p className="text-sm text-muted">Make a jar for each thing you&apos;re saving for: a new PC, a trip, an emergency fund.</p>}
      {list.map((j) => {
        const pct = j.target ? j.saved / j.target : 0;
        const weeks = jarPace(data, j);
        return (
          <div key={j.id} className="rounded-xl border border-white/10 p-3 flex gap-3">
            <button onClick={() => setForm({ id: j.id, name: j.name, emoji: j.emoji, target: String(j.target || "") })} aria-label={`Edit ${j.name}`}><JarArt pct={pct} emoji={j.emoji} /></button>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-semibold truncate">{j.name}</div>
              <div className="text-xs text-muted">{money(j.saved)}{j.target ? ` of ${money(j.target)} · ${Math.min(100, Math.round(pct * 100))}%` : ""}</div>
              {j.target > 0 && <div className="text-[10px] text-muted">{j.saved >= j.target ? "🏆 Done! Buy it, or keep saving." : weeks ? `At your pace: about ${weeks} week${weeks === 1 ? "" : "s"} to go.` : `${money(j.target - j.saved)} to go.`}</div>}
              <div className="flex gap-1">
                <input className="input !py-1 text-sm" inputMode="numeric" placeholder="Amount" value={amt[j.id] ?? ""} onChange={(e) => setAmt({ ...amt, [j.id]: e.target.value })} />
                <button className="btn-gold !px-2 !py-1 text-xs" disabled={!Number(amt[j.id])} onClick={() => put(j, 1)}>＋ Add</button>
                <button className="btn-ghost !px-2 !py-1 text-xs" disabled={!Number(amt[j.id])} onClick={() => put(j, -1)}>Take</button>
              </div>
            </div>
          </div>
        );
      })}
      {form && (
        <Sheet title={form.id ? "Edit jar" : "New savings jar"} onClose={() => setForm(null)}>
          <div className="grid grid-cols-[4rem_1fr] gap-2">
            <input aria-label="Icon" className="input text-center text-2xl" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <input autoFocus className="input" placeholder="New PC, trip, emergency fund…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-1">{["🫙", "💻", "🎮", "✈️", "📱", "🚲", "🎁", "🛟"].map((e) => <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={`h-9 w-9 rounded-lg text-xl ${form.emoji === e ? "bg-[var(--accent2)]/30" : "bg-white/5"}`}>{e}</button>)}</div>
          <label className="text-xs text-muted">Target<input className="input mt-1" inputMode="numeric" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></label>
          <div className="flex gap-2">
            {form.id && <button className="btn-ghost text-rose-300" onClick={() => { remove(form.id!); setForm(null); }}>Delete</button>}
            <button className="btn-primary flex-1" disabled={!form.name.trim()} onClick={() => {
              const config = { emoji: form.emoji || "🫙", target: Number(form.target) || 0 };
              if (form.id) update(form.id, { name: form.name.trim(), config }); else add(form.name.trim(), config);
              setForm(null);
            }}>Save</button>
          </div>
        </Sheet>
      )}
    </Sheet>
  );
}

// ---------- 47. Subscriptions ----------
const USES: [string, number][] = [["Never", 0], ["1-2 times", 2], ["3-5", 4], ["6-10", 8], ["Most days", 20]];
export function SubsSheet({ onClose }: { onClose: () => void }) {
  const money = useMoney();
  const { items, add, update, remove } = useCustomItems("subscription");
  const subs = items.map(subOf).sort((a, b) => nextCharge(a).getTime() - nextCharge(b).getTime());
  const [form, setForm] = useState<{ id?: string; name: string; emoji: string; price: string; cycle: "month" | "year"; day: string } | null>(null);
  const [check, setCheck] = useState<string | null>(null);
  const monthly = subsMonthly(subs, "9999-12");
  const cfg = (id: string) => items.find((i) => i.id === id)!.config;
  return (
    <Sheet title="📺 Subscriptions" onClose={onClose}>
      <div className="rounded-xl bg-white/5 p-3 grid grid-cols-2 text-sm">
        <div><div className="text-xs text-muted">Every month</div><b>{money(monthly)}</b></div>
        <div className="text-right"><div className="text-xs text-muted">Every year</div><b>{money(monthly * 12)}</b></div>
      </div>
      {subs.map((s) => {
        const w = worth(s);
        const next = nextCharge(s);
        const soon = (next.getTime() - Date.now()) / 86_400_000 < 3;
        return (
          <div key={s.id} className="rounded-xl border border-white/10 p-2.5 text-xs space-y-1">
            <button onClick={() => setForm({ id: s.id, name: s.name, emoji: s.emoji, price: String(s.price), cycle: s.cycle, day: String(s.day) })} className="w-full flex justify-between text-left">
              <b className="text-sm">{s.emoji} {s.name}</b><span>{money(s.price)}/{s.cycle === "year" ? "yr" : "mo"}</span>
            </button>
            <div className={soon ? "text-amber-300" : "text-muted"}>Next charge {next.toLocaleDateString(undefined, { day: "numeric", month: "short" })}{soon ? " (soon: cancel before then if you don't need it)" : ""}</div>
            <div className="flex items-center justify-between gap-2">
              <span className={w.tone}>{w.verdict}{w.perUse != null ? ` (${money(w.perUse)} a use)` : ""}</span>
              <button onClick={() => setCheck(check === s.id ? null : s.id)} className="chip !py-0 text-[11px] shrink-0">🤔 Worth it?</button>
            </div>
            {check === s.id && (
              <div className="flex flex-wrap gap-1 items-center"><span className="text-muted">Used last month:</span>
                {USES.map(([l, n]) => <button key={l} onClick={() => { update(s.id, { config: { ...cfg(s.id), uses: n, checked: toDay(new Date()) } }); setCheck(null); }} className={`chip !py-0 text-[11px] ${s.uses === n ? "chip-on" : ""}`}>{l}</button>)}
              </div>
            )}
          </div>
        );
      })}
      {subs.length === 0 && <p className="text-sm text-muted">Add every app or service you pay for regularly. Small monthly costs add up.</p>}
      <div className="flex flex-wrap gap-1">
        {[["Netflix", "🎬", 890], ["Spotify", "🎵", 980], ["YouTube Premium", "▶️", 1280], ["Amazon Prime", "📦", 600], ["Phone plan", "📱", 2970], ["Gym", "🏋️", 3300], ["iCloud", "☁️", 150], ["Game pass", "🎮", 850]].map(([n, e, p]) => (
          <button key={String(n)} onClick={() => setForm({ name: String(n), emoji: String(e), price: String(p), cycle: "month", day: String(new Date().getDate()) })} className="chip !py-0.5 text-[11px]">+ {e} {n}</button>
        ))}
        <button onClick={() => setForm({ name: "", emoji: "📺", price: "", cycle: "month", day: "1" })} className="chip chip-on !py-0.5 text-[11px]">＋ Other</button>
      </div>
      <p className="text-[10px] text-muted">Subscriptions count toward your Subscriptions budget every month.</p>
      {form && (
        <Sheet title={form.id ? "Edit subscription" : "New subscription"} onClose={() => setForm(null)}>
          <div className="grid grid-cols-[4rem_1fr] gap-2">
            <input aria-label="Icon" className="input text-center text-2xl" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <input autoFocus className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted">Price<input className="input mt-1" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label className="text-xs text-muted">Every<select className="input mt-1" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as "month" | "year" })}><option value="month">month</option><option value="year">year</option></select></label>
            <label className="text-xs text-muted">Charge day<input className="input mt-1" inputMode="numeric" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></label>
          </div>
          <div className="flex gap-2">
            {form.id && <button className="btn-ghost text-rose-300" onClick={() => { remove(form.id!); setForm(null); }}>Cancelled it</button>}
            <button className="btn-primary flex-1" disabled={!form.name.trim() || !Number(form.price)} onClick={() => {
              const base = form.id ? cfg(form.id) : { since: monthKey() };
              const config = { ...base, emoji: form.emoji || "📺", price: Number(form.price), cycle: form.cycle, day: Math.min(31, Math.max(1, Number(form.day) || 1)) };
              if (form.id) update(form.id, { name: form.name.trim(), config }); else add(form.name.trim(), config);
              setForm(null);
            }}>Save</button>
          </div>
          {form.id && <p className="text-[10px] text-muted">{money(perMonth(subOf({ id: "", category: "", name: "", sort: 0, config: { price: Number(form.price), cycle: form.cycle } })) * 12)} a year. Is that worth it?</p>}
        </Sheet>
      )}
    </Sheet>
  );
}

// ---------- 48. Payday and "pay yourself first" ----------
type Act = ReturnType<typeof useApp>;
function payNow(a: Act, d: Data, auto: boolean) {
  const month = monthKey();
  if (paidThisMonth(d)) return;
  const p = paydayPlan(d);
  a.logActivity("income", { amount: p.amount, source: "Allowance (payday)", payday: month }, new Date(), 3);
  if (p.save > 0) a.logActivity("save", { amount: p.save, jar: p.jar, note: "Pay yourself first", payday: month }, new Date(), 10);
  // What's left is this month's spending money.
  a.saveSettings({ allowances: { ...d.profile.settings.allowances, [month]: p.spend } });
  a.celebrate({ title: "💴 PAYDAY!", subtitle: `${auto ? "Auto: " : ""}${p.save ? `${d.profile.settings.currency} ${p.save.toLocaleString()} saved first. ` : ""}${d.profile.settings.currency} ${p.spend.toLocaleString()} to spend this month.`, icon: "💴", big: p.save > 0 });
}
export function PaydaySheet({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { data, profile, saveSettings } = app;
  const money = useMoney();
  const { items } = useCustomItems("savings");
  const p = profile.settings.payday ?? { day: 25, pct: 20, auto: false };
  const set = (patch: Partial<typeof p>) => saveSettings({ payday: { ...p, ...patch } });
  const plan = paydayPlan({ ...data, profile: { ...profile, settings: { ...profile.settings, payday: p } } });
  const paid = paidThisMonth(data);
  return (
    <Sheet title="💴 Payday" onClose={onClose}>
      <p className="text-xs text-muted">Pay yourself first: on payday a part goes straight into savings, and you spend only what is left. It&apos;s the habit rich people swear by.</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Payday (day of month)<input className="input mt-1" inputMode="numeric" value={p.day || ""} onChange={(e) => set({ day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })} /></label>
        <label className="text-xs text-muted">Allowance<input className="input mt-1" inputMode="numeric" placeholder={String(profile.settings.budget_monthly)} value={p.amount ?? ""} onChange={(e) => set({ amount: Number(e.target.value) || undefined })} /></label>
      </div>
      <div className="flex flex-wrap gap-1 items-center text-xs"><span className="text-muted">Save first:</span>
        {[0, 10, 20, 30, 50].map((n) => <button key={n} onClick={() => set({ pct: n })} className={`chip !py-0.5 ${p.pct === n ? "chip-on" : ""}`}>{n}%</button>)}
      </div>
      <label className="text-xs text-muted block">Into jar
        <select className="input mt-1" value={p.jar ?? ""} onChange={(e) => set({ jar: e.target.value || undefined })}>
          <option value="">{items.length ? "First jar" : "Savings (make a jar in Savings jars)"}</option>
          {items.map((i) => <option key={i.id} value={i.id}>{String(i.config.emoji ?? "🫙")} {i.name}</option>)}
        </select>
      </label>
      <button onClick={() => set({ auto: !p.auto })} className="btn-ghost w-full flex justify-between border border-white/15"><span>🤖 Do it automatically on payday</span><span>{p.auto ? "On" : "Off"}</span></button>
      <div className="rounded-xl bg-white/5 p-3 text-sm grid grid-cols-3 text-center">
        <div><div className="text-[10px] text-muted">Allowance</div><b>{money(plan.amount)}</b></div>
        <div><div className="text-[10px] text-muted">Save first</div><b className="gold-text">{money(plan.save)}</b></div>
        <div><div className="text-[10px] text-muted">To spend</div><b>{money(plan.spend)}</b></div>
      </div>
      {paid ? <p className="text-xs text-emerald-300">✓ Paid yourself first this month. Next payday: the {p.day}th.</p>
        : <button className="btn-gold w-full" onClick={() => { if (!profile.settings.payday) set({}); payNow(app, { ...data, profile: { ...profile, settings: { ...profile.settings, payday: p } } }, false); onClose(); }}>💴 It&apos;s payday: pay myself first now</button>}
    </Sheet>
  );
}
// Pays yourself first by itself on payday, when turned on (once a month, on any device).
export function PaydayWatcher() {
  const app = useApp();
  const ref = useRef(app);
  ref.current = app;
  const due = paydayDue(app.data) && !!app.profile.settings.payday?.auto;
  useEffect(() => {
    if (!due) return;
    // A short wait lets other devices' records arrive first, so it never pays twice.
    const t = setTimeout(() => { const a = ref.current; if (paydayDue(a.data)) payNow(a, a.data, true); }, 8000);
    return () => clearTimeout(t);
  }, [due]);
  return null;
}

// ---------- 64. Receipt scanner ----------
type Row = ReceiptLine & { key: string; pantry: boolean };
const blank = (): Row => ({ key: Math.random().toString(36).slice(2), name: "", name_ja: "", qty: 1, unit: "pcs", price: 0, category: "Food", kind: "food", emoji: "🛒", pantry: true });
const EATS = ["food", "fruit", "veg", "drink"];
export function ReceiptSheet({ onClose }: { onClose: () => void }) {
  const { session, update, logActivity, celebrate } = useApp();
  const money = useMoney();
  const [rows, setRows] = useState<Row[]>([]);
  const [store, setStore] = useState("");
  const [date, setDate] = useState(toDay(new Date()));
  const [total, setTotal] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const sum = rows.reduce((n, r) => n + (Number(r.price) || 0), 0);
  const set = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  // The photo waits for you: AI reads it only when you tap Ask AI.
  const [shot, setShot] = useState<{ img: HTMLImageElement; small: string } | null>(null);
  const scan = async (f: File) => {
    const img = await loadImage(f);
    setShot({ img, small: smallPhoto(img, 160) });
    setMsg("Tap 🤖 Ask AI to read every line, or type the lines below.");
    if (!rows.length) setRows([blank()]);
  };
  const askAI = async (img: HTMLImageElement) => {
    setBusy(true); setMsg("🤖 AI is reading every line of the receipt…");
    const r = await readReceipt(session, aiPhoto(img, 1600));
    setBusy(false);
    if (r.receipt?.found && r.receipt.items.length) {
      const x = r.receipt;
      setRows(x.items.map((i) => ({ ...blank(), ...i, emoji: i.emoji || emojiFor(i.name, "🛒"), pantry: EATS.includes(i.kind) })));
      setStore(x.store); if (/^\d{4}-\d\d-\d\d$/.test(x.date)) setDate(x.date); setTotal(x.total || null);
      setMsg(`🤖 ${x.items.length} items found.${x.note ? ` ${x.note}` : ""} Check them, then save.`); setShot(null);
    } else {
      setMsg(`${r.error ? `Couldn't read it (${r.error}).` : "No receipt lines found."} Type the lines below instead.`);
      if (!rows.length) setRows([blank()]);
    }
  };
  const save = () => {
    const good = rows.filter((r) => r.name.trim() && Number(r.price) >= 0);
    if (!good.length) return;
    const at = new Date(`${date}T${date === toDay(new Date()) ? new Date().toTimeString().slice(0, 5) : "12:00"}`);
    const iso = at.toISOString();
    update((d) => {
      const shopping: ShopItem[] = good.map((r) => ({
        id: crypto.randomUUID(), name: r.name.trim(), emoji: r.emoji || emojiFor(r.name, "🛒"), qty: Number(r.qty) || 1, unit: r.unit, price: Number(r.price) || 0,
        category: r.category, note: [store, r.name_ja].filter(Boolean).join(" · "), photo_id: null, status: "purchased", purchased_at: iso, created_at: iso,
      }));
      let pantry = d.pantry;
      for (const r of good.filter((x) => x.pantry)) {
        const qty = Number(r.qty) || 1, unitPrice = qty ? +((Number(r.price) || 0) / qty).toFixed(2) : null;
        const same = pantry.find((p) => p.name.trim().toLowerCase() === r.name.trim().toLowerCase());
        pantry = same ? pantry.map((p) => (p.id === same.id ? { ...p, qty: +(p.qty + qty).toFixed(2), last_price: unitPrice, updated_at: iso } : p))
          : [...pantry, { id: crypto.randomUUID(), name: r.name.trim(), emoji: r.emoji || emojiFor(r.name, "🛒"), qty, unit: r.unit, last_price: unitPrice, updated_at: iso, kind: EATS.includes(r.kind) ? r.kind : undefined, ja: r.name_ja || undefined } as PantryItem];
      }
      // Items on the to-buy list that were just bought come off it.
      const got = new Set(good.map((r) => r.name.trim().toLowerCase()));
      return { ...d, shopping: [...d.shopping.filter((s) => !(s.status === "to_buy" && got.has(s.name.trim().toLowerCase()))), ...shopping], pantry };
    });
    const row = logActivity("shopping", { item: `Receipt${store ? ` (${store})` : ""}`, emoji: "🧾", qty: good.length, unit: "items", price: sum, receipt: true }, at, 10);
    celebrate({ title: "🧾 RECEIPT LOGGED!", subtitle: `${good.length} items · ${money(sum)}${good.some((r) => r.pantry) ? ` · ${good.filter((r) => r.pantry).length} added to What I have` : ""}`, xp: row.xp, icon: "🧾" });
    onClose();
  };
  return (
    <Sheet title="🧾 Scan a receipt" onClose={onClose}>
      <button disabled={busy} onClick={() => ref.current?.click()} className="btn-primary w-full">{busy ? "Reading…" : rows.length ? "📷 Scan another photo" : "📷 Snap the receipt"}</button>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) scan(f); }} />
      {shot && !busy && (
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.small} alt="Receipt" className="h-14 w-14 rounded-lg object-cover" />
          <button onClick={() => askAI(shot.img)} className="btn-ghost flex-1 !py-2 text-sm ring-1 ring-[var(--accent)]">🤖 Ask AI to read it</button>
        </div>
      )}
      {!rows.length && <button onClick={() => setRows([blank()])} className="btn-ghost w-full border border-white/15 text-sm">✍️ Type it in instead</button>}
      {msg && <p className={`text-xs ${busy ? "animate-pulse text-[var(--accent2)]" : "text-muted"}`}>{msg}</p>}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input className="input text-sm" placeholder="Shop" value={store} onChange={(e) => setStore(e.target.value)} />
            <input type="date" className="input text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="rounded-xl border border-white/10 p-2 space-y-1.5">
                <div className="flex gap-1.5 items-center">
                  <Pic name={r.name} emoji={r.emoji} size={30} />
                  <input className="input !py-1 text-sm flex-1" placeholder="Item" value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} />
                  <button aria-label="Remove line" onClick={() => setRows(rows.filter((x) => x.key !== r.key))} className="text-muted px-1">✕</button>
                </div>
                {r.name_ja && <div className="text-[10px] text-muted">{r.name_ja}</div>}
                <div className="grid grid-cols-[3rem_4.5rem_1fr_1fr] gap-1">
                  <input aria-label="Quantity" className="input !py-1 !px-1 text-xs" inputMode="decimal" value={r.qty} onChange={(e) => set(r.key, { qty: Number(e.target.value) || 0 })} />
                  <select aria-label="Unit" className="input !py-1 !px-1 text-xs" value={r.unit} onChange={(e) => set(r.key, { unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                  <select aria-label="Category" className="input !py-1 !px-1 text-xs" value={r.category} onChange={(e) => set(r.key, { category: e.target.value })}>{CATS.map(([c]) => <option key={c}>{c}</option>)}</select>
                  <input aria-label="Price" className="input !py-1 !px-1 text-xs" inputMode="numeric" placeholder="Price" value={r.price || ""} onChange={(e) => set(r.key, { price: Number(e.target.value) || 0 })} />
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-muted"><input type="checkbox" checked={r.pantry} onChange={(e) => set(r.key, { pantry: e.target.checked })} className="accent-[var(--accent)]" /> Add to What I have</label>
              </div>
            ))}
          </div>
          <button onClick={() => setRows([...rows, blank()])} className="btn-ghost w-full border border-dashed border-white/25 text-sm">＋ Add a line</button>
          <div className="rounded-xl bg-white/5 p-3 text-sm flex justify-between"><span>Total</span><b>{money(sum)}{total != null && Math.abs(total - sum) > 1 ? <span className="text-amber-300 text-xs"> (receipt says {money(total)})</span> : ""}</b></div>
          <button onClick={save} disabled={!rows.some((r) => r.name.trim())} className="btn-primary w-full">Save to Money{rows.some((r) => r.pantry) ? " + What I have" : ""}</button>
        </>
      )}
    </Sheet>
  );
}

// ---------- 18. Grocery list that writes itself ----------
export function AutoGrocery() {
  const { data, update, profile, saveSettings } = useApp();
  const money = useMoney();
  const needs = autoList(data);
  const [all, setAll] = useState(false);
  if (!needs.length) return null;
  const add = (ns: typeof needs) => update((d) => ({ ...d, shopping: [...d.shopping, ...ns.map(toShopItem)] }));
  const shown = all ? needs : needs.slice(0, 5);
  return (
    <section className="card p-3 mb-3 border border-[var(--accent2)]/40">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold">🤖 Running low: {needs.length} to buy</h2>
        <button onClick={() => add(needs)} className="chip chip-on !py-0.5 text-xs">＋ Add all</button>
      </div>
      <ul className="space-y-1">
        {shown.map((n) => (
          <li key={n.name} className="flex items-center gap-2 text-xs">
            <Pic name={n.name} emoji={n.emoji} size={28} />
            <span className="flex-1 min-w-0"><b>{n.name}</b> <span className="text-muted">· {n.why}{n.price != null ? ` · ~${money(n.price)}` : ""}</span></span>
            <button onClick={() => add([n])} className="chip !py-0 text-[11px]">＋</button>
            <button aria-label={`Stop suggesting ${n.name}`} onClick={() => saveSettings({ grocery_skip: [...(profile.settings.grocery_skip ?? []), n.name] })} className="text-muted text-[11px] px-1">✕</button>
          </li>
        ))}
      </ul>
      {needs.length > 5 && <button onClick={() => setAll(!all)} className="mt-1 text-[11px] text-muted">{all ? "Show less" : `Show all ${needs.length}`}</button>}
    </section>
  );
}
