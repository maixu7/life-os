"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logKarma } from "@/lib/karma";
import { sched } from "@/lib/schedule";
import { toDay, useApp } from "@/lib/store";
import { studyGate } from "@/lib/worst";

// Strict study mode. A web app can't block other apps, so this makes skipping
// study cost something real: a full-screen wall after study time, fines for
// fun before study, and a focus session that breaks if you leave it.

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const SNOOZE = "lifeos-wall-snooze";
const FREE = /^\/(focus|learn)/;

export function StudyWall() {
  const { data, profile, logActivity } = useApp();
  const path = usePathname();
  const gate = studyGate(data);
  const s = sched(profile.settings.schedule);
  const [now, setNow] = useState(() => Date.now());
  const [wait, setWait] = useState<number | null>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Fines: every fun log (manga, anime, games…) made while study isn't done costs XP and gold.
  const fined = useRef(new Set<string>());
  useEffect(() => {
    if (!gate.locked) return;
    const day = toDay(new Date());
    const today = data.logs.filter((l) => l.day === day);
    const paid = new Set(today.filter((l) => l.kind === "fine").map((l) => String(l.data.for)));
    for (const l of today) {
      if (l.kind === "fine" || paid.has(l.id) || fined.current.has(l.id) || logKarma(l) >= 0) continue;
      if (Date.now() - new Date(l.created_at).getTime() > 10 * 60_000) continue; // only fresh logs, not old ones
      fined.current.add(l.id);
      const what = String(l.data.title ?? l.data.name ?? "fun");
      logActivity("fine", { for: l.id, name: `😈 Fine: ${what} before study`, emoji: "💸" }, undefined, -(Math.abs(l.xp) + 30));
    }
  }, [data.logs, gate.locked, logActivity]);

  const d = new Date(now);
  const mins = d.getHours() * 60 + d.getMinutes();
  let snoozed = 0;
  try { snoozed = Number(localStorage.getItem(SNOOZE)) || 0; } catch {}
  const show = profile.settings.study_wall !== false && gate.locked && mins >= toMin(s.studyStart) && mins < toMin(s.sleep) && now > snoozed && !FREE.test(path);
  if (!show) return null;

  const left = wait ? Math.max(0, Math.ceil((wait - now) / 1000)) : null;
  const skip = () => {
    logActivity("fine", { name: "😈 Skipped study (wall)", emoji: "💸" }, undefined, -40);
    try { localStorage.setItem(SNOOZE, String(Date.now() + 20 * 60_000)); } catch {}
    setWait(null);
  };
  const href = `/focus?start=1${gate.next ? `&subject=${encodeURIComponent(gate.next.subject)}` : ""}`;
  return (
    <div className="fixed inset-0 z-[300] bg-[#05030a] grid place-items-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-6xl">📚</div>
        <h2 className="font-game text-2xl text-rose-300">STUDY FIRST</h2>
        <p className="text-sm">{gate.text}</p>
        <p className="text-xs text-muted">Manga, anime and games logged before study cost XP and gold. Leaving a focus session breaks it.</p>
        <Link href={href} className="btn-primary block !py-3 text-lg">▶ Start studying now</Link>
        {left == null ? <button onClick={() => setWait(Date.now() + 60_000)} className="text-xs text-muted underline">I really can&apos;t right now…</button>
          : left > 0 ? <p className="text-xs text-muted">Think about it for {left}s. Is it really more important than your exam?</p>
          : <button onClick={skip} className="btn-ghost w-full text-xs text-rose-300">Skip for 20 min (−40 XP)</button>}
      </div>
    </div>
  );
}

// Focus "phone jail": leaving the app during a session sends a warning at once;
// staying away more than 60 seconds breaks the session with a fine.
export function useFocusJail(running: boolean, fail: () => void) {
  const { session, logActivity } = useApp();
  const away = useRef<number | null>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    if (!running) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        away.current = Date.now();
        fetch("/api/push", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "nag", user: session.user, auth: session.auth, text: "You left your study session! Come back within 60 seconds or it fails." }) }).catch(() => {});
      } else if (away.current) {
        const gone = Date.now() - away.current;
        away.current = null;
        if (gone > 60_000) {
          logActivity("fine", { name: `😈 Left focus for ${Math.round(gone / 60000)} min`, emoji: "📵" }, undefined, -30);
          setBroken(true);
          fail();
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running, fail, session, logActivity]);
  return { broken, clear: () => setBroken(false) };
}
