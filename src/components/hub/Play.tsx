"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { openHub } from "@/components/hub/registry";
import { gold } from "@/lib/economy";
import { habitStats } from "@/lib/habits";
import {
  activeEvents, dayAgo, EVENT_QUEST_GOLD, FREEZE_COST, freezeNeeded, freezesOwned, isPerfect, lootBag, lootClaimed, nextEvent,
  PET_SNACK, petHunger, RARITY, RIVAL, RIVAL_GOLD, rivalClaimed, rivalRecord, rivalScore, rollLoot, seed, worldMap,
} from "@/lib/hub";
import { streak } from "@/lib/missions";
import { skillPoints, skillTree } from "@/lib/skilltree";
import { today, toDay, useApp, useCustomItems, type CustomItem } from "@/lib/store";
import { progress } from "@/lib/xp";

// ---------- 50 Seasonal events ----------
function useEvent() {
  const { data } = useApp();
  const ev = activeEvents()[0];
  return useMemo(() => {
    if (!ev) return null;
    const logs = data.logs.filter((l) => l.day >= ev.start && l.day <= ev.end);
    const claimed = (q: string) => data.logs.some((l) => l.kind === "loot" && l.data.event === ev.id && l.data.quest === q && l.data.for === ev.start);
    const quests = ev.quests.map((q) => ({ ...q, done: q.test(logs), claimed: claimed(q.id) }));
    return { ev, quests, item: claimed("item"), left: Math.max(0, Math.ceil((new Date(`${ev.end}T23:59`).getTime() - Date.now()) / 86_400_000)) };
  }, [data.logs, ev]);
}
export function EventsSheet({ onClose }: { onClose: () => void }) {
  const e = useEvent();
  const { logActivity, celebrate } = useApp();
  const nx = nextEvent();
  if (!e) return (
    <Sheet title="🎏 Seasonal events" onClose={onClose}>
      <p className="text-sm">No event right now. Next: <b>{nx.icon} {nx.name}</b> in {nx.days} days ({nx.start}).</p>
      <p className="text-xs text-muted">Events follow the Japanese calendar: New Year, Sakura, Golden Week, Summer festival, Halloween, Autumn reading, Christmas. Each has special quests and a collectible item.</p>
    </Sheet>
  );
  const all = e.quests.every((q) => q.claimed);
  return (
    <Sheet title={`${e.ev.icon} ${e.ev.name}`} onClose={onClose}>
      <p className="text-sm text-muted">{e.ev.blurb}</p>
      <p className="text-xs">⏳ {e.left} day{e.left === 1 ? "" : "s"} left · {e.ev.start} → {e.ev.end}</p>
      <div className="space-y-2">
        {e.quests.map((q) => (
          <div key={q.id} className={`rounded-xl p-3 flex items-center gap-3 ${q.done ? "bg-emerald-500/15" : "bg-white/5"}`}>
            <span className="text-2xl">{q.icon}</span>
            <span className="flex-1 text-sm">{q.name}<span className="block text-[11px] text-muted">{q.claimed ? "Claimed" : q.done ? "Done! Claim your reward" : "Checked from your records"}</span></span>
            {q.done && !q.claimed && <button className="btn-gold !py-1.5 text-xs" onClick={() => {
              logActivity("loot", { src: "event", event: e.ev.id, quest: q.id, for: e.ev.start, gold: EVENT_QUEST_GOLD }, new Date(), 0);
              celebrate({ title: "EVENT QUEST!", subtitle: `${q.name} · +${EVENT_QUEST_GOLD} gold`, icon: e.ev.icon });
            }}>🪙 {EVENT_QUEST_GOLD}</button>}
            {q.claimed && <span>✅</span>}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-[var(--gold)]/50 p-3 text-center">
        <div className="text-3xl">{e.ev.item.split(" ")[0]}</div>
        <div className="text-sm font-semibold">{e.ev.item}</div>
        <div className="text-xs text-muted">Limited item: clear every quest to get it.</div>
        {e.item ? <div className="text-sm mt-1">✅ In your loot bag</div> : (
          <button disabled={!all} className="btn-gold w-full mt-2 !py-2" onClick={() => {
            logActivity("loot", { src: "event", event: e.ev.id, quest: "item", for: e.ev.start, gold: 50, item: e.ev.item.replace(/^\S+\s/, ""), icon: e.ev.item.split(" ")[0], rarity: "epic" }, new Date(), 0);
            celebrate({ title: "LIMITED ITEM!", subtitle: `${e.ev.item} · +50 gold`, big: true, icon: e.ev.item.split(" ")[0] });
          }}>{all ? "Claim the event item" : "🔒 Clear all quests first"}</button>
        )}
      </div>
    </Sheet>
  );
}
export function EventCard() {
  const e = useEvent();
  if (!e) return null;
  const n = e.quests.filter((q) => q.done).length;
  const claim = e.quests.some((q) => q.done && !q.claimed);
  return (
    <button onClick={() => openHub("events")} className="card frame w-full p-3 mb-4 flex items-center gap-3 text-left bg-gradient-to-r from-orange-500/20 to-purple-500/10">
      <span className="text-4xl">{e.ev.icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] font-game tracking-widest text-orange-300">SEASONAL EVENT · {e.left} DAYS LEFT</span>
        <span className="block font-game font-bold truncate">{e.ev.name}</span>
        <span className="block text-xs text-muted">{n}/{e.quests.length} quests{claim ? " · 🎁 reward ready!" : ""}</span>
      </span>
      <span className="text-[var(--accent2)]">›</span>
    </button>
  );
}

// ---------- 88 Rival + 53 perfect-day loot + 87 freeze nudge, on Base Camp ----------
export function RivalCard() {
  const { data, logActivity, celebrate } = useApp();
  const day = today(), y = dayAgo(1);
  const s = rivalScore(data, day);
  const ys = rivalScore(data, y);
  const wonY = data.logs.some((l) => l.day === y) && ys.you >= ys.target && !rivalClaimed(data, y);
  const perfect = isPerfect(data.logs.filter((l) => l.day === day), data) && !lootClaimed(data, day);
  const need = freezeNeeded(data);
  const owned = freezesOwned(data);
  const max = Math.max(s.you, s.target, 1);
  const line = RIVAL.line[seed(day) % RIVAL.line.length];
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">⚔️ Rival duel</h2>
        <button onClick={() => openHub("rival")} className="text-[11px] text-muted">Record ›</button>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2"><span className="w-16">🦸 You</span><div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[var(--accent2)]" style={{ width: `${(s.you / max) * 100}%` }} /></div><b className="w-14 text-right tabular-nums">{s.you} XP</b></div>
        <div className="flex items-center gap-2"><span className="w-16">{RIVAL.icon} {RIVAL.name}</span><div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${(s.him / max) * 100}%` }} /></div><b className="w-14 text-right tabular-nums">{s.him} XP</b></div>
      </div>
      <p className="mt-2 text-xs text-muted">{RIVAL.name}: “{line}” He&apos;ll reach {s.target} XP by tonight. {s.you >= s.target ? "You're already past him! 🏆" : `${s.target - s.you} XP more to beat him.`}</p>
      {wonY && <button className="btn-gold w-full mt-2 !py-2" onClick={() => {
        logActivity("rival", { for: y, gold: RIVAL_GOLD, won: true }, new Date(), 0);
        celebrate({ title: "RIVAL DEFEATED!", subtitle: `You beat ${RIVAL.name} yesterday · +${RIVAL_GOLD} gold`, icon: "⚔️", big: true });
      }}>🏆 You beat him yesterday: claim {RIVAL_GOLD} gold</button>}
      {perfect && <button className="btn-gold w-full mt-2 !py-2 animate-pulse" onClick={() => {
        const l = rollLoot();
        logActivity("loot", { src: "perfect", for: day, gold: l.gold, rarity: l.rarity, item: l.name, icon: l.icon }, new Date(), 0);
        celebrate({ title: `${RARITY[l.rarity].label.toUpperCase()} LOOT!`, subtitle: `${l.icon} ${l.name} · +${l.gold} gold`, big: l.rarity !== "common", icon: l.icon, quote: "A perfect day. Every mission cleared." });
      }}>🎆 Perfect day! Open your loot drop</button>}
      {need && owned > 0 && <button className="btn-ghost w-full mt-2 text-sm" onClick={() => openHub("freeze")}>🛡️ You missed yesterday. Use a streak freeze?</button>}
    </section>
  );
}
export function RivalSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const r = rivalRecord(data);
  const days = [...Array(7)].map((_, i) => dayAgo(7 - i)).map((d) => ({ d, ...rivalScore(data, d) }));
  return (
    <Sheet title={`${RIVAL.icon} Rival: ${RIVAL.name}`} onClose={onClose}>
      <p className="text-sm text-muted">{RIVAL.name} studies and trains every day. His daily score is a little above your recent average, so beating him means beating your old self.</p>
      <div className="flex gap-2 text-center">
        <div className="flex-1 rounded-xl bg-white/5 p-2"><div className="font-game text-lg text-emerald-300">{r.won}</div><div className="text-[10px] text-muted">WINS (30 DAYS)</div></div>
        <div className="flex-1 rounded-xl bg-white/5 p-2"><div className="font-game text-lg text-rose-300">{r.lost}</div><div className="text-[10px] text-muted">LOSSES</div></div>
      </div>
      <div className="space-y-1">
        {days.map((x) => (
          <div key={x.d} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted">{new Date(`${x.d}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
            <span className="flex-1">{x.you} vs {x.target}</span>
            <span>{x.you >= x.target ? "🏆" : x.you ? "💀" : "–"}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Each win can be claimed the next day on Base Camp for {RIVAL_GOLD} gold.</p>
    </Sheet>
  );
}

// ---------- 53 Loot bag ----------
export function LootSheet({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const bag = lootBag(data);
  const counts = (["legendary", "epic", "rare", "common"] as const).map((r) => [r, bag.filter((b) => b.rarity === r).length] as const);
  return (
    <Sheet title="💎 Loot bag" onClose={onClose}>
      <p className="text-sm text-muted">Clear all six daily missions for a perfect day and a loot drop appears on Base Camp. 2% are legendary. Event items land here too.</p>
      <div className="grid grid-cols-4 gap-2 text-center">{counts.map(([r, n]) => <div key={r} className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg" style={{ color: RARITY[r].color }}>{n}</div><div className="text-[9px] text-muted uppercase">{RARITY[r].label}</div></div>)}</div>
      {bag.length === 0 ? <p className="text-sm text-center text-muted py-4">Empty for now. Your first perfect day fills it.</p> : (
        <div className="grid grid-cols-3 gap-2">
          {[...bag].reverse().map((b) => (
            <div key={b.id} className="rounded-xl p-2 text-center border" style={{ borderColor: RARITY[b.rarity].color, background: `color-mix(in srgb, ${RARITY[b.rarity].color} 10%, transparent)` }}>
              <div className="text-3xl">{b.icon}</div><div className="text-[11px] font-semibold leading-tight">{b.name}</div><div className="text-[9px] text-muted">{b.day}</div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

// ---------- 87 Streak freeze (gold shop item) ----------
export function FreezeSheet({ onClose }: { onClose: () => void }) {
  const { data, logActivity, celebrate } = useApp();
  const g = gold(data), owned = freezesOwned(data), need = freezeNeeded(data), s = streak(data);
  return (
    <Sheet title="🛡️ Streak freeze" onClose={onClose}>
      <p className="text-sm text-muted">Life happens. A streak freeze saves one missed day so your 🔥 streak (days with 3+ missions) doesn&apos;t reset. Buy them with gold and keep one ready.</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg">🛡️ {owned}</div><div className="text-[10px] text-muted">OWNED</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg gold-text">🪙 {g}</div><div className="text-[10px] text-muted">GOLD</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-game text-lg text-orange-400">🔥 {s}</div><div className="text-[10px] text-muted">STREAK</div></div>
      </div>
      <button disabled={g < FREEZE_COST || owned >= 3} onClick={() => {
        logActivity("redeem", { name: "Streak freeze", cost: FREEZE_COST, emoji: "🛡️", freeze: true }, new Date(), 0);
        celebrate({ title: "STREAK FREEZE BOUGHT", subtitle: "Kept safe until you need it.", icon: "🛡️", kind: "small" });
      }} className="btn-gold w-full">{owned >= 3 ? "You can hold 3 at most" : `Buy for 🪙 ${FREEZE_COST}`}</button>
      {need ? (
        <div className="rounded-xl border border-orange-400/50 p-3">
          <p className="text-sm">You missed {new Date(`${need}T12:00`).toLocaleDateString(undefined, { weekday: "long" })}. Use a freeze to keep your streak alive?</p>
          <button disabled={owned < 1} onClick={() => {
            logActivity("freeze", { for: need }, new Date(), 0);
            celebrate({ title: "STREAK SAVED!", subtitle: "The freeze covered the missed day.", icon: "🛡️", big: true });
          }} className="btn-primary w-full mt-2">{owned < 1 ? "Buy one first" : "🛡️ Use a freeze on that day"}</button>
        </div>
      ) : <p className="text-xs text-muted">No missed day to cover right now. If you miss a day, come back here the next day.</p>}
    </Sheet>
  );
}

// ---------- 51 Skill tree ----------
export function SkillTreeSheet({ onClose }: { onClose: () => void }) {
  const { data, profile, saveProfile, celebrate } = useApp();
  const tree = useMemo(() => skillTree(data), [data]);
  return (
    <Sheet title="🌳 Skill tree" onClose={onClose}>
      <p className="text-sm text-muted">Every branch grows from what you log. Nodes open in order; some give a title you can wear. Skill points: <b>{skillPoints(data)}</b>/18.</p>
      <div className="space-y-3">
        {tree.map((b) => (
          <div key={b.id} className="rounded-xl bg-white/5 p-3">
            <div className="flex justify-between text-sm"><b>{b.icon} {b.name}</b><span className="text-xs text-muted">{b.n} {b.unit}</span></div>
            <div className="mt-2 flex items-stretch gap-1">
              {b.nodes.map((x, i) => (
                <div key={x.id} className="flex-1 flex items-center gap-1">
                  {i > 0 && <span className={`h-0.5 w-2 ${x.open ? "bg-[var(--accent2)]" : "bg-white/15"}`} />}
                  <div className={`flex-1 rounded-lg p-1.5 text-center border ${x.open ? "border-[var(--accent2)] bg-[var(--accent2)]/15" : x.next ? "border-[var(--gold)]/60" : "border-white/10 opacity-50"}`}>
                    <div className="text-xl">{x.open || x.next ? x.icon : "🔒"}</div>
                    <div className="text-[10px] font-semibold leading-tight">{x.name}</div>
                    <div className="text-[9px] text-muted leading-tight">{x.need}</div>
                    {x.next && <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${x.pct}%` }} /></div>}
                    {x.open && x.title && (profile.title === x.title ? <div className="text-[9px] text-[var(--accent2)] mt-0.5">worn</div> :
                      <button className="chip !px-1.5 !py-0 text-[9px] mt-0.5" onClick={() => { saveProfile({ title: x.title! }); celebrate({ title: "NEW TITLE", subtitle: x.title, icon: x.icon, kind: "small" }); }}>Wear title</button>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// ---------- 86 World map ----------
export function WorldMapSheet({ onClose }: { onClose: () => void }) {
  const { data, profile } = useApp();
  const lv = progress(profile.xp).level;
  const map = useMemo(() => worldMap(data, lv), [data, lv]);
  const [sel, setSel] = useState(map[0]);
  const path = map.map((r) => `${r.x * 3.2},${r.y * 4}`).join(" ");
  return (
    <Sheet title="🗺️ World map" onClose={onClose}>
      <p className="text-xs text-muted">Each region is a life area. It opens at a level and fills in as you log that area. Level {lv}: {map.filter((r) => r.open).length}/{map.length} regions open.</p>
      <svg viewBox="0 0 320 400" className="w-full rounded-2xl" style={{ background: "radial-gradient(circle at 50% 70%, #1f3b2c, #0f1a2e 70%)" }}>
        <polyline points={path} fill="none" stroke="#ffffff30" strokeWidth="3" strokeDasharray="6 6" />
        {map.map((r) => {
          const cx = r.x * 3.2, cy = r.y * 4, c = 2 * Math.PI * 24;
          return (
            <g key={r.id} onClick={() => setSel(r)} style={{ cursor: "pointer" }} opacity={r.open ? 1 : 0.45}>
              <circle cx={cx} cy={cy} r="24" fill={r.open ? "#1b1035" : "#111"} stroke="#ffffff22" strokeWidth="4" />
              {r.open && <circle cx={cx} cy={cy} r="24" fill="none" stroke="#7cf2ff" strokeWidth="4" strokeDasharray={`${(r.pct / 100) * c} ${c}`} transform={`rotate(-90 ${cx} ${cy})`} />}
              <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">{r.open ? r.icon : "🌫️"}</text>
              <text x={cx} y={cy + 38} fontSize="9" fill="#fff" textAnchor="middle">{r.open ? r.name : `Lv ${r.level}`}</text>
            </g>
          );
        })}
      </svg>
      <div className="rounded-xl bg-white/5 p-3 text-sm">
        <b>{sel.icon} {sel.name}</b> · {sel.area}
        <div className="text-xs text-muted">{sel.open ? `${sel.n}/${sel.goal} records · ${sel.pct}% explored` : `Opens at level ${sel.level} (you are ${lv}).`}</div>
      </div>
    </Sheet>
  );
}

// ---------- 74 Habit chain: "don't break the chain" ----------
export function ChainCalendar({ h }: { h: CustomItem }) {
  const { data } = useApp();
  const s = useMemo(() => habitStats(h, data), [h, data]);
  const [off, setOff] = useState(0);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() - off);
  const y = base.getFullYear(), m = base.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const done = new Set(s.doneDays.map((x) => x.day));
  const started = s.days[0]?.day ?? today();
  let best = 0, run = 0;
  for (const x of s.days) { run = x.done ? run + 1 : 0; best = Math.max(best, run); }
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between text-sm">
        <button className="chip !px-2 !py-0.5" onClick={() => setOff(off + 1)}>‹</button>
        <b>🔗 {base.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b>
        <button className="chip !px-2 !py-0.5" disabled={off === 0} onClick={() => setOff(off - 1)}>›</button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: daysIn }, (_, i) => {
          const day = toDay(new Date(y, m, i + 1));
          const hit = done.has(day), future = day > today(), before = day < started;
          return (
            <span key={day} className={`aspect-square rounded-md grid place-items-center text-xs relative ${day === today() ? "ring-1 ring-[var(--accent2)]" : ""} ${before || future ? "opacity-30" : ""} ${hit ? "bg-rose-500/25" : "bg-white/5"}`}>
              <span className="text-[9px] text-muted absolute top-0 left-0.5">{i + 1}</span>
              {hit && <span className="text-rose-300 font-black text-base leading-none">✕</span>}
            </span>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-muted">Chain now 🔥 {s.streak} · best {best} days. Don&apos;t break the chain!</div>
    </div>
  );
}
export function ChainSheet({ onClose }: { onClose: () => void }) {
  const { items } = useCustomItems("habit");
  const [pick, setPick] = useState(0);
  const h = items[pick];
  return (
    <Sheet title="🔗 Habit chains" onClose={onClose}>
      {!items.length ? <p className="text-sm text-muted">No habit quests yet. Accept one on Base Camp (🌱 Habit quests) and every day you do it gets a big red ✕ here.</p> : (
        <>
          <div className="flex flex-wrap gap-1.5">{items.map((x, i) => <button key={x.id} onClick={() => setPick(i)} className={`chip ${i === pick ? "chip-on" : ""}`}>{x.name}</button>)}</div>
          {h && <ChainCalendar key={h.id} h={h} />}
        </>
      )}
    </Sheet>
  );
}

// ---------- 52 Pet hunger (shown inside the companion card) ----------
export function PetHunger() {
  const { data, logActivity, celebrate } = useApp();
  const { items } = useCustomItems("habit");
  const p = useMemo(() => petHunger(data, items), [data, items]);
  if (p.none) return <p className="mt-2 text-[11px] text-muted">🍖 Accept a habit quest: your companion eats when you keep your habits.</p>;
  const label = p.hunger >= 70 ? "😫 Starving: you skipped habits" : p.hunger >= 40 ? "😋 Hungry" : p.hunger >= 15 ? "🙂 A bit peckish" : "😌 Full and happy";
  return (
    <div className="mt-2 text-left text-xs">
      <div className="flex justify-between"><span>🍖 Hunger · {label}</span><span className="text-muted">{p.hunger}%</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className={`h-full rounded-full ${p.hunger >= 70 ? "bg-rose-500" : p.hunger >= 40 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.max(3, p.hunger)}%` }} /></div>
      <p className="mt-1 text-[11px] text-muted">Each habit you keep today feeds it ({p.fedToday} so far). Skipped habits in the last 2 days: {p.missed}.</p>
      {p.hunger >= 30 && gold(data) >= PET_SNACK && (
        <button className="chip mt-1" onClick={() => {
          logActivity("redeem", { name: "Pet snack", cost: PET_SNACK, emoji: "🍖", pet: true }, new Date(), 0);
          celebrate({ title: "NOM NOM", subtitle: "A snack helps, but habits are its real food.", icon: "🍖", kind: "small" });
        }}>🍖 Give a snack (🪙 {PET_SNACK})</button>
      )}
    </div>
  );
}
