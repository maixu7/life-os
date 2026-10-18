"use client";

import { useMemo, useState } from "react";
import { newCard, useCards } from "@/components/Flashcards";
import { dailyPicks, LEVELS, nextJlpt, studyList, type Kanji, type Level } from "@/lib/kanji";
import { today, useApp, useCustomItems } from "@/lib/store";

// JLPT tracker: your level, your goal, the next test date, and a few new
// kanji a day. Learned kanji become flashcards, so spaced repetition keeps them.
// What you know is worked out from "kanji" records, so it syncs safely.

export function JlptCard() {
  const { data, profile, saveSettings, logActivity, celebrate, deleteLog, updateLog } = useApp();
  const own = useCustomItems("kanji");
  const { decks, put } = useCards();
  const j = profile.settings.jlpt ?? {};
  const goal = (LEVELS.includes(j.goal as Level) ? j.goal : "N4") as Level;
  const perDay = j.daily || 3;
  const day = today();
  const ownList: Kanji[] = useMemo(() => own.items.map((i) => ({ k: i.name, m: String(i.config.m ?? ""), r: String(i.config.r ?? ""), level: (i.config.level as Level) || "N3", own: true })), [own.items]);
  const list = useMemo(() => studyList(goal, ownList), [goal, ownList]);
  const kanjiLogs = useMemo(() => data.logs.filter((l) => l.kind === "kanji"), [data.logs]);
  const known = useMemo(() => new Set(kanjiLogs.flatMap((l) => String(l.data.chars ?? "").split(""))), [kanjiLogs]);
  const todayLogs = kanjiLogs.filter((l) => l.day === day);
  const learnedToday = new Set(todayLogs.flatMap((l) => String(l.data.chars ?? "").split("")));
  const picks = dailyPicks(list, known, learnedToday, perDay);
  const exam = nextJlpt();
  const examDays = Math.ceil((exam.getTime() - Date.now()) / 86_400_000);
  const left = list.filter((k) => !known.has(k.k)).length;
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [nk, setNk] = useState({ k: "", m: "", r: "", level: goal as Level });

  // Learned kanji land in the kanji flashcard deck (made on first use).
  const learn = (ks: Kanji[]) => {
    const fresh = ks.filter((k) => !known.has(k.k));
    if (!fresh.length) return;
    let deck = decks.find((d) => d.config.kanji);
    const extra = [];
    if (!deck) { deck = { id: crypto.randomUUID(), category: "deck", name: "Kanji (JLPT)", config: { icon: "🈶", kanji: true }, sort: 0 }; extra.push(deck); }
    const deckId = deck.id;
    put([...extra, ...fresh.map((k) => newCard(deckId, k.k, `${k.m}\n${k.r}`, `kanji-${k.k}-${deckId.slice(0, 8)}`))]);
    const row = logActivity("kanji", { chars: fresh.map((k) => k.k).join(""), level: fresh[0].level }, new Date(), 5 * fresh.length);
    const doneToday = learnedToday.size + fresh.length >= perDay;
    celebrate(doneToday
      ? { kind: "mission", title: "🈶 KANJI OF THE DAY CLEARED!", subtitle: `${fresh.map((k) => k.k).join(" ")} · ${left - fresh.length} left to ${goal}`, xp: row.xp, icon: "🎌", quote: "A thousand-ri journey starts with a single step. (千里の道も一歩から)" }
      : { kind: "small", title: `✓ ${fresh.map((k) => k.k).join(" ")} learned`, subtitle: "Added to your kanji flashcards", xp: row.xp, icon: "🈶" });
  };
  // Tapped by mistake: take it back out of today's record.
  const unlearn = (k: string) => {
    const l = todayLogs.find((x) => String(x.data.chars ?? "").includes(k));
    if (!l) return;
    const rest = String(l.data.chars).split("").filter((c) => c !== k).join("");
    if (rest) updateLog(l.id, { data: { chars: rest } }); else deleteLog(l.id);
  };
  const addOwn = () => { if (!nk.k.trim()) return; own.add(nk.k.trim(), { m: nk.m.trim(), r: nk.r.trim(), level: nk.level }); setNk({ k: "", m: "", r: "", level: nk.level }); };

  return (
    <section className="card p-4 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">🈶 JLPT kanji</h2>
        <span className="text-xs text-muted">🎌 JLPT {exam.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {examDays} days</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted">
        <div>Level passed
          <div className="flex flex-wrap gap-1 mt-0.5">{["none", ...LEVELS].map((lv) => <button key={lv} onClick={() => saveSettings({ jlpt: { ...j, level: lv } })} className={`chip !px-1.5 !py-0 text-[11px] ${(j.level ?? "none") === lv ? "chip-on" : ""}`}>{lv}</button>)}</div>
        </div>
        <div>Aiming for
          <div className="flex flex-wrap gap-1 mt-0.5">{LEVELS.map((lv) => <button key={lv} onClick={() => saveSettings({ jlpt: { ...j, goal: lv } })} className={`chip !px-1.5 !py-0 text-[11px] ${goal === lv ? "chip-on" : ""}`}>{lv}</button>)}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {LEVELS.slice(0, LEVELS.indexOf(goal) + 1).map((lv) => {
          const mine = list.filter((k) => k.level === lv), got = mine.filter((k) => known.has(k.k)).length;
          return (
            <div key={lv} className="flex items-center gap-2 text-xs">
              <span className="w-7 font-bold">{lv}</span>
              <span className="flex-1 h-2 rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--accent2)]" style={{ width: `${mine.length ? (got / mine.length) * 100 : 0}%` }} /></span>
              <span className="w-14 text-right text-muted">{got}/{mine.length}</span>
            </div>
          );
        })}
        {left > 0 && <p className="text-[11px] text-muted">{left} kanji to go. At {perDay} a day that&apos;s about {Math.ceil(left / perDay)} days{examDays > 0 ? `, and the test is in ${examDays}` : ""}.</p>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs font-bold">Today&apos;s kanji</div>
        <div className="flex gap-1">{[1, 3, 5, 10].map((n) => <button key={n} onClick={() => saveSettings({ jlpt: { ...j, daily: n } })} className={`chip !px-1.5 !py-0 text-[11px] ${perDay === n ? "chip-on" : ""}`}>{n}/day</button>)}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {picks.map((k) => {
          const got = learnedToday.has(k.k);
          return (
            <button key={k.k} onClick={() => (got ? unlearn(k.k) : learn([k]))} className={`rounded-xl border p-2 text-center ${got ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
              <div className="text-4xl font-bold leading-tight">{k.k}</div>
              <div className="text-[11px] font-semibold truncate">{k.m}</div>
              <div className="text-[10px] text-muted truncate">{k.r}</div>
              <div className={`mt-1 text-[10px] ${got ? "text-emerald-300" : "text-[var(--accent2)]"}`}>{got ? "✓ learned" : "Tap when learned"}</div>
            </button>
          );
        })}
        {!picks.length && <p className="col-span-3 text-xs text-emerald-300">🏆 Every {goal} kanji in your list is learned! Aim higher or add your own.</p>}
      </div>
      {picks.some((k) => !learnedToday.has(k.k)) && picks.length > 1 && <button onClick={() => learn(picks)} className="btn-ghost w-full mt-2 text-sm">✓ Learned all of today&apos;s</button>}

      <div className="mt-3 flex gap-2">
        <button onClick={() => setAll(!all)} className="chip text-xs">{all ? "Hide list" : `📖 All ${goal} kanji`}</button>
        <button onClick={() => setAdding(!adding)} className="chip text-xs">＋ My own kanji</button>
      </div>
      {all && (
        <div className="mt-2 flex flex-wrap gap-1">
          {list.map((k) => (
            <button key={k.k} title={`${k.m} · ${k.r}`} onClick={() => !known.has(k.k) && confirm(`${k.k}: ${k.m} (${k.r})\nMark as learned?`) && learn([k])}
              className={`h-8 w-8 rounded-md text-lg ${known.has(k.k) ? "bg-emerald-500/20 text-emerald-200" : "bg-white/5"}`}>{k.k}</button>
          ))}
        </div>
      )}
      {adding && (
        <div className="mt-2 rounded-xl border border-white/10 p-3 space-y-2">
          <div className="grid grid-cols-[64px_1fr] gap-2">
            <input className="input text-center text-2xl !px-1" placeholder="字" maxLength={2} value={nk.k} onChange={(e) => setNk({ ...nk, k: e.target.value })} />
            <input className="input" placeholder="Meaning (letter, character)" value={nk.m} onChange={(e) => setNk({ ...nk, m: e.target.value })} />
          </div>
          <input className="input" placeholder="Reading (ジ / あざ)" value={nk.r} onChange={(e) => setNk({ ...nk, r: e.target.value })} />
          <div className="flex gap-1">{LEVELS.map((lv) => <button key={lv} onClick={() => setNk({ ...nk, level: lv })} className={`chip !py-0.5 text-xs ${nk.level === lv ? "chip-on" : ""}`}>{lv}</button>)}</div>
          <button onClick={addOwn} disabled={!nk.k.trim()} className="btn-primary w-full disabled:opacity-40">Add kanji</button>
          {own.items.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {own.items.map((i) => <span key={i.id} className="chip !py-0.5 text-xs">{i.name} {String(i.config.level ?? "")}<button aria-label="Delete" onClick={() => own.remove(i.id)} className="ml-1 text-muted">✕</button></span>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
