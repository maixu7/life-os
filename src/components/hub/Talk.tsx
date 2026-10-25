"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { openSlotSheet } from "@/components/Blocks";
import { mealFor } from "@/components/Meals";
import { openHub } from "@/components/hub/registry";
import { decodeCard, duel, myCard, shareText, type BuddyCard } from "@/lib/buddy";
import { emojiFor } from "@/lib/emoji";
import { aiPhoto, readMeal, readProduct, type ProductRead } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { SnapChoice, useRememberSnap, type LabelRead, type Pick } from "@/components/SnapChoice";
import { foodPicks } from "@/lib/foodpicks";
import { goods } from "@/lib/goods";
import type { MealFood } from "@/lib/foodtext";
import { ruleAnswer, summaryText, todayWins, weekSummary } from "@/lib/hub";
import { LANGS } from "@/lib/i18n";
import { clearInbox, INBOX_EVENT, inboxList, markAllRead, pushInbox, removeInbox, unreadCount, type InboxMsg } from "@/lib/inbox";
import { streak } from "@/lib/missions";
import { UNITS, useApp, useCustomItems, type PantryItem } from "@/lib/store";
import { progress } from "@/lib/xp";

// ---------- 89 Chat with Sensei ----------
type Msg = { who: "me" | "sensei"; text: string; ai?: boolean; q?: string };
const CHAT_KEY = "lifeos-chat";
export function ChatSheet({ onClose }: { onClose: () => void }) {
  const { data, session } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>(() => { try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; } });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-20))); } catch {} end.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  // Sensei answers from your data with its own rules (no AI). AI only when you tap Ask AI.
  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    setQ("");
    setMsgs((m) => [...m, { who: "me", text }, { who: "sensei", text: ruleAnswer(text, weekSummary(data)), q: text }]);
  };
  const askAI = async (text: string) => {
    if (busy) return;
    setBusy(true);
    let answer = "";
    try {
      const r = await fetch("/api/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: session.user, auth: session.auth, mode: "chat", text, summary: summaryText(weekSummary(data)) }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && typeof j.answer === "string" && j.answer.trim()) answer = j.answer.trim();
      else answer = `AI couldn't answer${j.error ? ` (${j.error})` : ""}.`;
    } catch { answer = "AI couldn't answer (offline)."; }
    setMsgs((m) => [...m, { who: "sensei", text: answer, ai: true }]);
    setBusy(false);
  };
  return (
    <Sheet title="💬 Ask Sensei" onClose={onClose}>
      <p className="text-xs text-muted">Sensei reads a short summary of your last 7 days (calories, protein, water, study, training, sleep) to answer. Not a doctor: for pain or illness use 🩺 Doctor or see a real one.</p>
      <div className="space-y-2 max-h-[45dvh] overflow-y-auto">
        {msgs.length === 0 && <p className="text-sm text-center text-muted py-2">Ask anything about your day.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.who === "me" ? "justify-end" : ""}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.who === "me" ? "bg-[var(--accent2)]/25" : "bg-white/5"}`}>
              {m.who === "sensei" && <span className="mr-1">🥷</span>}{m.text}
              {m.who === "sensei" && m.ai && <span className="block text-[9px] text-muted mt-0.5">🤖 AI</span>}
              {m.q && <button onClick={() => askAI(m.q!)} disabled={busy} className="block text-[11px] text-[var(--accent2)] mt-1">🤖 Ask AI instead</button>}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted">🤖 AI is thinking…</div>}
        <div ref={end} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["What should I eat now?", "Am I sleeping enough?", "What should I study next?", "Did I drink enough water?"].map((x) => <button key={x} onClick={() => ask(x)} className="chip text-xs">{x}</button>)}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" placeholder="Ask Sensei…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} />
        <button className="btn-primary" disabled={busy}>Send</button>
      </form>
      {msgs.length > 0 && <button className="text-xs text-muted" onClick={() => setMsgs([])}>Clear chat</button>}
    </Sheet>
  );
}

// ---------- 67 Bell inbox ----------
export function useInbox() {
  const [list, setList] = useState<InboxMsg[]>([]);
  useEffect(() => {
    const sync = () => setList(inboxList());
    sync();
    window.addEventListener(INBOX_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(INBOX_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return list;
}
export function Bell() {
  const list = useInbox();
  const n = list.filter((m) => !m.read).length;
  return (
    <button onClick={() => openHub("inbox")} aria-label="Inbox" title="Inbox" className="relative shrink-0 h-10 w-10 rounded-xl border border-white/15 bg-white/5 grid place-items-center text-lg active:scale-90">
      🔔{n > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold grid place-items-center">{n > 99 ? "99" : n}</span>}
    </button>
  );
}
const KIND_LABEL: Record<InboxMsg["kind"], string> = { sensei: "🥷 Sensei", reminder: "⏰ Reminder", reward: "🎁 Reward", wisdom: "💬 Wisdom" };
export function InboxSheet({ onClose }: { onClose: () => void }) {
  const list = useInbox();
  const router = useRouter();
  const [f, setF] = useState<InboxMsg["kind"] | "all">("all");
  useEffect(() => () => { if (unreadCount()) markAllRead(); }, []);
  const shown = list.filter((m) => f === "all" || m.kind === f);
  return (
    <Sheet title="🔔 Inbox" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">
        {(["all", "sensei", "reminder", "reward", "wisdom"] as const).map((k) => <button key={k} onClick={() => setF(k)} className={`chip ${f === k ? "chip-on" : ""}`}>{k === "all" ? "All" : KIND_LABEL[k]}</button>)}
      </div>
      {shown.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nothing here yet. Sensei&apos;s messages, reminders and rewards are kept here after their popup closes.</p> : (
        <ul className="space-y-1.5">
          {shown.map((m) => (
            <li key={m.id} className={`rounded-xl p-2.5 flex gap-2 ${m.read ? "bg-white/5" : "bg-[var(--accent2)]/10 border border-[var(--accent2)]/30"}`}>
              <span className="text-xl">{m.icon}</span>
              <button className="flex-1 min-w-0 text-left" onClick={() => { if (m.href) { onClose(); router.push(m.href); } }}>
                <span className="block text-sm font-semibold">{m.title}</span>
                {m.body && <span className="block text-xs text-muted">{m.body}</span>}
                <span className="block text-[10px] text-muted">{KIND_LABEL[m.kind]} · {new Date(m.at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </button>
              <button aria-label={`Delete ${m.title}`} title="Delete" className="shrink-0 grid h-10 w-10 place-items-center rounded-lg text-base text-rose-300 hover:bg-rose-500/15" onClick={() => removeInbox(m.id)}>🗑</button>
            </li>
          ))}
        </ul>
      )}
      {list.length > 0 && <button className="btn-ghost w-full text-sm" onClick={() => { if (confirm(`Delete all ${list.length} notifications?`)) clearInbox(); }}>🗑 Delete all</button>}
      <p className="text-[11px] text-muted">Kept on this device (last 120).</p>
    </Sheet>
  );
}
// Collects rewards (celebrations) and alarms/reminders into the inbox. Sensei's popups add themselves (Coach).
export function InboxWatcher() {
  const { celebration } = useApp();
  useEffect(() => {
    if (!celebration || celebration.kind === "small") return;
    pushInbox({ kind: "reward", icon: celebration.icon ?? "🎉", title: celebration.title, body: [celebration.subtitle, celebration.xp ? `+${celebration.xp} XP` : ""].filter(Boolean).join(" · ") || undefined });
  }, [celebration]);
  useEffect(() => {
    const on = (e: Event) => { const d = (e as CustomEvent<{ title: string; body?: string; icon?: string }>).detail; pushInbox({ kind: "reminder", icon: d.icon ?? "⏰", title: d.title, body: d.body }); };
    window.addEventListener("lifeos-alarm", on);
    return () => window.removeEventListener("lifeos-alarm", on);
  }, []);
  return null;
}

// ---------- 93 Share card ----------
function drawCard(c: HTMLCanvasElement, w: ReturnType<typeof todayWins>, name: string, level: number, title: string, fire: number) {
  const W = 1080, H = 1350; c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#1b0b3a"); bg.addColorStop(1, "#0b1d3a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = "#7cf2ff22"; for (let i = 0; i < 40; i++) g.fillRect((i * 263) % W, (i * 491) % H, 4, 4);
  g.textAlign = "center"; g.fillStyle = "#7cf2ff"; g.font = "bold 44px sans-serif"; g.fillText("LIFE OS · TODAY'S WINS", W / 2, 120);
  g.fillStyle = "#fff"; g.font = "bold 84px sans-serif"; g.fillText(name, W / 2, 230);
  g.fillStyle = "#ffd166"; g.font = "40px sans-serif"; g.fillText(`Lv ${level} · ${title} · 🔥 ${fire}-day streak`, W / 2, 295);
  g.fillStyle = "#ffffffaa"; g.font = "36px sans-serif"; g.fillText(new Date(`${w.day}T12:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }), W / 2, 350);
  const stats: [string, string, string][] = [["⚡", `${w.xp}`, "XP earned"], ["⚔️", `${w.missions}/${w.missionTotal}`, "missions"], ["📖", `${w.study}`, "min study"], ["💧", `${(w.water / 1000).toFixed(1)} L`, "water"], ["🏋️", `${w.train}`, "sets"], ["🍱", `${w.kcal}`, "kcal"]];
  stats.forEach(([icon, v, l], i) => {
    const x = 90 + (i % 3) * 310, y = 420 + Math.floor(i / 3) * 260;
    g.fillStyle = "#ffffff12"; g.beginPath(); g.roundRect(x, y, 280, 230, 30); g.fill();
    g.fillStyle = "#fff"; g.font = "64px sans-serif"; g.fillText(icon, x + 140, y + 85);
    g.font = "bold 60px sans-serif"; g.fillText(v, x + 140, y + 160);
    g.fillStyle = "#ffffffaa"; g.font = "32px sans-serif"; g.fillText(l, x + 140, y + 205);
  });
  g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "38px sans-serif";
  (w.wins.length ? w.wins.slice(0, 4).map((x) => `✅ ${x}`) : ["Every hero starts somewhere. Tomorrow I clear more."]).forEach((t, i) => g.fillText(t, 110, 1000 + i * 58));
  g.textAlign = "center"; g.fillStyle = "#ffffff66"; g.font = "30px sans-serif"; g.fillText("Leveling up my real life, one day at a time", W / 2, 1300);
}
export function ShareSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  const ref = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const w = useMemo(() => todayWins(data), [data]);
  useEffect(() => {
    if (!ref.current) return;
    drawCard(ref.current, w, profile.display_name || "Hero", progress(profile.xp).level, profile.title, streak(data));
    setUrl(ref.current.toDataURL("image/png"));
  }, [w, profile, data]);
  const share = async () => {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], `life-os-${w.day}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], text: `Today: ${w.xp} XP, ${w.missions}/${w.missionTotal} missions ⚔️` }); return; } catch { return; } }
    const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
    setMsg("Saved the image. Send it from your photos.");
  };
  return (
    <Sheet title="📤 Share today's wins" onClose={onClose}>
      <canvas ref={ref} className="hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="Today's wins card" className="w-full rounded-xl border border-white/10" />}
      <p className="text-xs text-muted">Only today&apos;s totals are in the picture: no food names, notes or times.</p>
      <button onClick={share} className="btn-primary w-full">Share or save image</button>
      {msg && <p className="text-xs text-center">{msg}</p>}
    </Sheet>
  );
}

// ---------- 55/56 Buddy and study duel by code ----------
export function BuddySheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const { items, add, update, remove } = useCustomItems("buddy");
  const me = useMemo(() => myCard(data), [data]);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState("");
  const copy = async () => {
    const t = shareText(me);
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try { if (nav.share) await nav.share({ text: t }); else { await navigator.clipboard.writeText(t); setMsg("Copied! Paste it to your friend in LINE."); } }
    catch { try { await navigator.clipboard.writeText(t); setMsg("Copied!"); } catch { setMsg("Couldn't copy. Long-press the code to copy it."); } }
  };
  const save = () => {
    const c = decodeCard(paste);
    if (!c) return setMsg("That isn't a Life OS buddy code (it starts with LOS1-).");
    const old = items.find((i) => i.name === c.n);
    if (old) update(old.id, { config: { card: c, saved: new Date().toISOString() } }); else add(c.n, { card: c, saved: new Date().toISOString() });
    setPaste(""); setMsg(`Saved ${c.n}'s code from ${c.d}.`);
  };
  return (
    <Sheet title="🤝 Buddy & study duel" onClose={onClose}>
      <p className="text-sm text-muted">Share only your streak and study minutes with a friend. No account, no server: send your code, paste theirs. Fresh codes each day keep the duel fair.</p>
      <div className="rounded-xl bg-white/5 p-3 text-sm">
        <div className="flex justify-between"><b>You · Lv {me.l}</b><span>🔥 {me.s} · 📖 {me.w} min this week</span></div>
        <div className="mt-2 rounded-lg bg-black/30 p-2 text-[10px] break-all select-all font-mono">{shareText(me).split(": ").pop()}</div>
        <button onClick={copy} className="btn-primary w-full mt-2 !py-2">Send my code</button>
      </div>
      <div className="flex gap-2">
        <input className="input text-xs" placeholder="Paste your friend's code (LOS1-…)" value={paste} onChange={(e) => setPaste(e.target.value)} />
        <button onClick={save} className="btn-primary">Add</button>
      </div>
      {msg && <p className="text-xs">{msg}</p>}
      {items.map((b) => {
        const c = b.config.card as BuddyCard;
        const r = duel(me, c);
        const tot = Math.max(1, me.w, c.w);
        return (
          <div key={b.id} className="rounded-xl border border-white/10 p-3 text-sm">
            <div className="flex justify-between"><b>⚔️ You vs {c.n} (Lv {c.l})</b><button className="text-xs text-muted" onClick={() => remove(b.id)}>✕</button></div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-2"><span className="w-14">You</span><div className="flex-1 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--accent2)]" style={{ width: `${(me.w / tot) * 100}%` }} /></div><span className="w-14 text-right">{me.w} min</span></div>
              <div className="flex items-center gap-2"><span className="w-14 truncate">{c.n}</span><div className="flex-1 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-rose-400" style={{ width: `${(c.w / tot) * 100}%` }} /></div><span className="w-14 text-right">{c.w} min</span></div>
            </div>
            <p className="mt-1 text-xs">{r.lead}</p>
            <p className="text-xs text-muted">🔥 {c.s}-day streak · {r.streak} · code from {c.d}</p>
          </div>
        );
      })}
    </Sheet>
  );
}

// ---------- 92 Language ----------
export function LangSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveSettings } = useApp();
  const cur = profile.settings.hub?.lang ?? "en";
  return (
    <Sheet title="🌐 Language" onClose={onClose}>
      <p className="text-sm text-muted">Switch the bottom menu and page headers. Everything else stays in English for now.</p>
      <div className="grid grid-cols-2 gap-2">
        {LANGS.map(([id, label]) => <button key={id} onClick={() => saveSettings({ hub: { ...profile.settings.hub, lang: id } })} className={`btn-ghost py-3 ${cur === id ? "!border-[var(--accent2)] text-[var(--accent2)]" : ""}`}>{label}</button>)}
      </div>
    </Sheet>
  );
}

// ---------- 63 Snap anything: guess what it is and send it to the right place ----------
type Guess = "meal" | "packet" | "receipt" | "book" | "other";
const GUESS: [Guess, string, string][] = [["meal", "🍱", "A meal I'm eating"], ["packet", "🏷️", "A packet / product"], ["receipt", "🧾", "A shop receipt"], ["book", "📚", "A book or page"]];
export function CameraSheet({ onClose }: { onClose: () => void }) {
  const { session, data, logActivity, celebrate, update } = useApp();
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [thumb, setThumb] = useState("");
  const [guess, setGuess] = useState<Guess | null>(null);
  const [busy, setBusy] = useState("");
  const [meal, setMeal] = useState<{ foods: MealFood[]; note: string } | null>(null);
  const [prod, setProd] = useState<ProductRead | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { file.current?.click(); }, []);
  // You say what it is; then the app's own list first (no AI). AI only from the Ask AI button.
  const [choose, setChoose] = useState<"meal" | "packet" | null>(null);
  const food = useMemo(() => foodPicks(data), [data]);
  const packets = useMemo<Pick[]>(() => [
    ...data.pantry.map((p) => ({ name: p.name, emoji: p.emoji, ja: p.ja, sub: "in My stuff", mine: true })),
    ...goods().map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.kcal ? `${g.kcal} kcal per ${g.per}` : g.cat })),
  ], [data.pantry]);
  const snap = async (f: File) => {
    const im = await loadImage(f);
    setImg(im); setThumb(smallPhoto(im, 160)); setGuess(null); setMeal(null); setProd(null); setErr("Pick what it is:");
  };
  const go = (g: Guess) => {
    setGuess(g); setErr("");
    if (img && (g === "meal" || g === "packet")) setChoose(g);
  };
  const rememberAI = useRememberSnap();
  const pickMeal = (p: Pick, l?: LabelRead) => {
    const n = food.nums.get(p.name);
    if (l?.kcal != null) { setMeal({ foods: [{ name: p.name, qty: 1, per: l.per ?? "1 serving", kcal: l.kcal, protein: l.protein ?? 0 }], note: "🏷️ Numbers from the label." }); return; }
    setMeal({ foods: [{ name: p.name, qty: 1, per: n?.per ?? "1 serving", kcal: n?.kcal ?? 0, protein: n?.protein ?? 0 }], note: "📋 From the list." });
  };
  const pickPacket = (p: Pick) => {
    const g = goods().find((x) => x.name === p.name), had = data.pantry.find((x) => x.name === p.name);
    setProd({ found: true, name: p.name, name_ja: p.ja ?? "", brand: had?.brand ?? "", kind: had?.kind ?? (g?.kind === "utensil" ? "other" : g?.kind ?? "other"), emoji: p.emoji, qty: 1, unit: "pcs", grams: 0,
      per: g?.per ?? had?.per ?? "", kcal: g?.kcal ?? had?.kcal ?? 0, protein: g?.protein ?? had?.protein ?? 0, fat: 0, carbs: 0, salt: 0, expiry: "", storage: "", allergens: "", note: "" });
  };
  const askAI = async (g: "meal" | "packet") => {
    if (!img) return;
    if (g === "meal") {
      setBusy("🤖 AI is reading the food…");
      const r = await readMeal(session, { photo: aiPhoto(img) }, data.items);
      setBusy("");
      if (r.foods.length) { rememberAI(r.foods.map((f) => f.name).join(" + "), "🍱"); setMeal({ foods: r.foods, note: r.note }); } else setErr(r.error || "Couldn't read the food. Open the meal sheet and type it.");
    } else {
      setBusy("🤖 AI is reading the packet…");
      const r = await readProduct(session, aiPhoto(img));
      setBusy("");
      if (r.product?.found !== false && r.product?.name) { rememberAI(r.product.name, r.product.emoji); setProd(r.product); } else setErr(r.error || "Couldn't read the packet. Add it in My stuff.");
    }
  };
  const logMeal = () => {
    if (!meal) return;
    const name = mealFor(new Date());
    const kcal = meal.foods.reduce((n, f) => n + f.kcal * f.qty, 0);
    const protein = Math.round(meal.foods.reduce((n, f) => n + f.protein * f.qty, 0));
    const row = logActivity("activity", { name, emoji: emojiFor(name, "🍱"), meal: true, foods: meal.foods.map((f) => ({ ...f, kcal: Math.round(f.kcal * f.qty), protein: f.protein * f.qty })), kcal, photo: thumb }, new Date());
    celebrate({ title: "ITADAKIMASU!", subtitle: `${name} · ${kcal} kcal · ${protein} g protein`, xp: row.xp, icon: "🍱" });
    onClose();
  };
  const addPacket = () => {
    if (!prod) return;
    const p: PantryItem = {
      id: crypto.randomUUID(), name: prod.name, emoji: prod.emoji || emojiFor(prod.name, "📦"), qty: prod.qty || 1, unit: UNITS.includes(prod.unit) ? prod.unit : "pcs",
      last_price: null, updated_at: new Date().toISOString(), kind: prod.kind, photo: thumb, ja: prod.name_ja || undefined, brand: prod.brand || undefined,
      expiry: prod.expiry || undefined, per: prod.per || undefined, kcal: prod.kcal ? Math.round(prod.kcal) : undefined, protein: prod.protein || undefined,
    };
    update((d) => ({ ...d, pantry: [...d.pantry, p] }));
    celebrate({ title: "ADDED TO MY STUFF", subtitle: `${p.emoji} ${p.name}`, kind: "small" });
    onClose();
  };
  return (
    <Sheet title="📸 Snap anything" onClose={onClose}>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) snap(f); e.target.value = ""; }} />
      <p className="text-sm text-muted">Food, a packet, a receipt or a book page: say what it is, and Sensei finds it in the app&apos;s list and sends it to the right place.</p>
      <button onClick={() => file.current?.click()} className="btn-primary w-full">{thumb ? "📸 Take another" : "📸 Take a photo"}</button>
      <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("lifeos-hub", { detail: "later" })), 50); }} className="btn-ghost w-full !py-2 text-sm">📥 Photos to scan ({data.items.filter((i) => i.category === "later").length})</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {thumb && <img src={thumb} alt="Your photo" className="mx-auto h-28 w-28 rounded-xl object-cover" />}
      {choose && img && <SnapChoice photo={thumb} img={img} list={choose === "meal" ? food.picks : packets} what={choose === "meal" ? "food" : "item"} kind={choose === "meal" ? "food" : "item"} laterType={choose === "meal" ? "food" : "have"} onClose={() => setChoose(null)}
        onAI={() => askAI(choose)} onPick={choose === "meal" ? pickMeal : pickPacket} />}
      {busy && <p className="text-sm text-center animate-pulse">{busy}</p>}
      {err && <p className="text-xs text-amber-300">{err}</p>}
      {thumb && !busy && (
        <div className="grid grid-cols-2 gap-2">
          {GUESS.map(([g, icon, label]) => <button key={g} onClick={() => go(g)} className={`btn-ghost text-sm ${guess === g ? "!border-[var(--accent2)] text-[var(--accent2)]" : ""}`}>{icon} {label}</button>)}
        </div>
      )}
      {guess === "meal" && meal && (
        <div className="rounded-xl bg-white/5 p-3 text-sm">
          {meal.foods.map((f, i) => <div key={i} className="flex justify-between"><span>{f.name} <span className="text-muted text-xs">{f.per}</span></span><b>{Math.round(f.kcal * f.qty)} kcal</b></div>)}
          {meal.note && <p className="text-xs text-muted mt-1">{meal.note}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={logMeal} className="btn-primary !py-2">Log as {mealFor(new Date())}</button><button onClick={() => { onClose(); openSlotSheet({ kind: "meal" }); }} className="btn-ghost !py-2 text-sm">Edit in meal sheet</button></div>
        </div>
      )}
      {guess === "packet" && prod && (
        <div className="rounded-xl bg-white/5 p-3 text-sm">
          <b>{prod.emoji} {prod.name}</b>{prod.name_ja && <span className="text-muted"> · {prod.name_ja}</span>}
          <div className="text-xs text-muted">{[prod.brand, prod.kcal ? `${Math.round(prod.kcal)} kcal per ${prod.per}` : "", prod.expiry ? `best before ${prod.expiry}` : ""].filter(Boolean).join(" · ")}</div>
          <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={addPacket} className="btn-primary !py-2">Add to My stuff</button><button onClick={() => { onClose(); router.push("/have"); }} className="btn-ghost !py-2 text-sm">Open My stuff</button></div>
        </div>
      )}
      {guess === "receipt" && <div className="rounded-xl bg-white/5 p-3 text-sm">🧾 Receipts go to the Shop: tick what you bought and log the prices there.<button onClick={() => { onClose(); router.push("/shop"); }} className="btn-primary w-full mt-2 !py-2">Open Shop</button></div>}
      {guess === "book" && <div className="rounded-xl bg-white/5 p-3 text-sm">📚 Books live in Learn: add it to your books or log pages you read.<button onClick={() => { onClose(); router.push("/learn"); }} className="btn-primary w-full mt-2 !py-2">Open Learn</button></div>}
    </Sheet>
  );
}
