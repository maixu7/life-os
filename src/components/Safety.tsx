"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "@/components/Sheet";
import { describe } from "@/lib/describe";
import {
  addSnap, ago, applyDisplay, canSpeak, displayPrefs, downloadText, lastDrill, lastFileBackup, lastSynced, listSnaps,
  markDrill, markFileBackup, passwordHint, pendingUpload, saveDisplay, savePasswordHint, speak, SYNC_EVENT, UNDO_EVENT, WEEK,
  type Deleted, type Display, type Snap,
} from "@/lib/safety";
import { mondayOf } from "@/lib/review";
import { mergeData, normalizeData, today, useApp, type Data } from "@/lib/store";
import { exportBackup, readBackup } from "@/lib/vault";

const uid = () => crypto.randomUUID();
const DAY = 86_400_000;

// ---------- Sync status ----------
export function useSyncState() {
  const { session } = useApp();
  const [st, setSt] = useState({ last: null as string | null, pending: false, online: true });
  const read = useCallback(async () => {
    const pending = await pendingUpload(session.cacheId);
    setSt({ last: lastSynced(session.user), pending, online: navigator.onLine });
  }, [session]);
  useEffect(() => {
    read();
    const t = setInterval(read, 20_000);
    const on = () => read();
    addEventListener("online", on); addEventListener("offline", on); addEventListener(SYNC_EVENT, on);
    return () => { clearInterval(t); removeEventListener("online", on); removeEventListener("offline", on); removeEventListener(SYNC_EVENT, on); };
  }, [read]);
  const stale = st.last ? Date.now() - new Date(st.last).getTime() > 2 * DAY : false;
  return { ...st, stale };
}

export function SyncBadge() {
  const s = useSyncState();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  const [icon, text, cls] = !s.online ? ["📴", `Offline · last synced ${ago(s.last)}`, "text-amber-300"]
    : s.pending ? ["⏳", "Saving to the cloud…", "text-sky-300"]
      : s.stale ? ["⚠️", `Not synced for ${ago(s.last).replace(" ago", "")}`, "text-rose-300"]
        : ["☁️", `Synced ${ago(s.last)}`, "text-emerald-300"];
  return <span className={`chip inline-flex items-center gap-1 text-xs ${cls}`}>{icon} {text}</span>;
}

// ---------- Global layer: offline strip, undo toast, weekly snapshot ----------
export function SafetyLayer() {
  const { session, data } = useApp();
  const s = useSyncState();
  const latest = useRef(data);
  useEffect(() => { latest.current = data; });
  useEffect(() => { applyDisplay(); }, []);

  // A weekly encrypted copy on this device, made quietly when the app opens.
  useEffect(() => {
    const t = setTimeout(async () => {
      const snaps = await listSnaps(session.user).catch(() => [] as Snap[]);
      if (snaps[0] && Date.now() - new Date(snaps[0].at).getTime() < WEEK) return;
      const text = await exportBackup(session, latest.current).catch(() => null);
      if (text) await addSnap(session.user, text, latest.current.logs.length).catch(() => {});
    }, 8000);
    return () => clearTimeout(t);
  }, [session]);

  const [hide, setHide] = useState(false);
  return (
    <>
      {!hide && (!s.online || s.stale) && (
        <div className="fixed top-0 inset-x-0 z-[44] flex justify-center px-3 pt-[env(safe-area-inset-top)] pointer-events-none">
          <button onClick={() => setHide(true)} className={`pointer-events-auto mt-1 max-w-md w-full rounded-xl px-3 py-1.5 text-[11px] text-left shadow-lg ${!s.online ? "bg-amber-500/90 text-black" : "bg-rose-600/90 text-white"}`}>
            {!s.online
              ? <>📴 <b>Offline.</b> Everything is saved on this device{s.pending ? " and will sync when you are back online" : ""}. ✕</>
              : <>⚠️ <b>This device has not synced for {ago(s.last).replace(" ago", "")}.</b> Check the internet so your other devices get your records. ✕</>}
          </button>
        </div>
      )}
      <UndoToast />
    </>
  );
}

function UndoToast() {
  const { update } = useApp();
  const [del, setDel] = useState<Deleted | null>(null);
  const [left, setLeft] = useState(10);
  useEffect(() => {
    const on = (e: Event) => { setDel((e as CustomEvent<Deleted>).detail); setLeft(10); };
    addEventListener(UNDO_EVENT, on);
    return () => removeEventListener(UNDO_EVENT, on);
  }, []);
  useEffect(() => {
    if (!del) return;
    const t = setInterval(() => setLeft((n) => { if (n <= 1) { setDel(null); return 0; } return n - 1; }), 1000);
    return () => clearInterval(t);
  }, [del]);
  if (!del) return null;
  const main = del.logs.find((l) => l.kind !== "bonus") ?? del.logs[0];
  const name = main ? describe(main).title : del.items[0]?.name ?? "item";
  // Deleted ids stay deleted on every device, so the copies come back with new ids.
  const undo = () => {
    update((d) => {
      const logs = [...d.logs, ...del.logs.map((l) => ({ ...l, id: uid() }))];
      return { ...d, logs, items: [...d.items, ...del.items.map((i) => ({ ...i, id: uid() }))], profile: { ...d.profile, xp: logs.reduce((n, l) => n + l.xp, 0) } };
    });
    setDel(null);
  };
  return (
    <div className="fixed inset-x-0 bottom-24 z-[46] flex justify-center px-3">
      <div className="card w-full max-w-md px-3 py-2 flex items-center gap-2 text-sm animate-sheet">
        <span>🗑️</span>
        <span className="flex-1 min-w-0 truncate">Deleted <b>{name}</b>{del.logs.length > 1 ? ` (+${del.logs.length - 1} reward)` : ""}</span>
        <button onClick={undo} className="btn-primary !py-1.5 !px-3">Undo {left}s</button>
      </div>
    </div>
  );
}

// ---------- Backups ----------
export function useBackup() {
  const { session, data } = useApp();
  return async () => {
    downloadText(await exportBackup(session, data), `life-os-${today()}.lifeos`);
    markFileBackup(session.user);
  };
}

export function BackupCard() {
  const { session } = useApp();
  const backup = useBackup();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [restore, setRestore] = useState<{ text: string; label: string } | null>(null);
  const [rec, setRec] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);
  useEffect(() => { listSnaps(session.user).then(setSnaps); setLastFile(lastFileBackup(session.user)); }, [session.user, restore]);
  const due = !lastFile || Date.now() - new Date(lastFile).getTime() > WEEK;
  return (
    <section id="backup" className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">🛟 Backup & restore</h2>
        <SyncBadge />
      </div>
      <button onClick={async () => { await backup(); setLastFile(new Date().toISOString()); }} className={`${due ? "btn-gold" : "btn-ghost"} w-full`}>
        📦 Download backup file {due ? "(weekly backup due)" : ""}
      </button>
      <p className="text-xs text-muted">Last file backup: {ago(lastFile)}. Save it to iCloud Drive, Google Drive or your PC. It stays locked by your password.</p>
      <div>
        <div className="text-xs text-muted mb-1">Weekly copies on this device (made automatically)</div>
        {snaps.length === 0 ? <p className="text-xs text-muted">The first copy is made a few seconds after the app opens.</p> : (
          <ul className="space-y-1">
            {snaps.map((s) => (
              <li key={s.key} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm">
                <span className="flex-1">{new Date(s.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {s.records} records</span>
                <button className="chip" onClick={() => downloadText(s.text, `life-os-${s.at.slice(0, 10)}.lifeos`)}>⬇</button>
                <button className="chip chip-on" onClick={() => setRestore({ text: s.text, label: `copy from ${new Date(s.at).toLocaleDateString()}` })}>Restore</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="btn-ghost w-full block text-center cursor-pointer">📂 Restore from a backup file
        <input type="file" accept=".lifeos,application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setRestore({ text: await f.text(), label: f.name }); e.target.value = ""; }} />
      </label>
      <button onClick={() => setRec(true)} className="btn-ghost w-full">🔑 Password hint & recovery sheet</button>
      {restore && <RestoreSheet text={restore.text} label={restore.label} onClose={() => setRestore(null)} />}
      {rec && <RecoverySheet onClose={() => setRec(false)} />}
    </section>
  );
}

// Restores into the account you are signed in to: records are merged, nothing here is lost.
export function RestoreSheet({ text, label, onClose }: { text: string; label: string; onClose: () => void }) {
  const { session, data, update, celebrate } = useApp();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [b, setB] = useState<Data | null>(null);
  const [revive, setRevive] = useState(false);
  const open = async () => {
    setBusy(true); setErr("");
    try { setB(normalizeData(await readBackup<Data>(text, session.user, pw))); } catch { setErr("That password doesn't open this backup."); }
    setBusy(false);
  };
  const ids = new Set(data.logs.map((l) => l.id));
  const gone = new Set(data.deleted);
  const fresh = b ? b.logs.filter((l) => !ids.has(l.id) && !gone.has(l.id)).length : 0;
  const wasDeleted = b ? b.logs.filter((l) => gone.has(l.id) && l.kind !== "bonus").length : 0;
  const apply = () => {
    if (!b) return;
    update((d) => {
      const m = mergeData(b, d);
      if (!revive) return m;
      const del = new Set(d.deleted);
      const back = <T extends { id: string }>(xs: T[]) => xs.filter((x) => del.has(x.id)).map((x) => ({ ...x, id: uid() }));
      const logs = [...m.logs, ...back(b.logs.filter((l) => l.kind !== "bonus"))];
      return { ...m, logs, items: [...m.items, ...back(b.items)], pantry: [...m.pantry, ...back(b.pantry)], shopping: [...m.shopping, ...back(b.shopping)], profile: { ...m.profile, xp: logs.reduce((n, l) => n + l.xp, 0) } };
    });
    celebrate({ title: "🛟 RESTORED", subtitle: `${fresh + (revive ? wasDeleted : 0)} records brought back`, kind: "small" });
    onClose();
  };
  return (
    <Sheet title="🛟 Restore backup" onClose={onClose}>
      <p className="text-sm text-muted">From: {label}. It is merged into this account: records you have now are kept, missing ones come back.</p>
      {!b ? (
        <>
          <input type="password" className="input" placeholder="Password of that backup" value={pw} onChange={(e) => setPw(e.target.value)} />
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <button disabled={!pw || busy} onClick={open} className="btn-primary w-full">{busy ? "Unlocking…" : "Unlock backup"}</button>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-white/5 p-3 text-sm space-y-1">
            <div>📦 Backup has <b>{b.logs.length}</b> records, <b>{b.items.length}</b> list items.</div>
            <div>➕ <b>{fresh}</b> records are missing here and will come back.</div>
            {wasDeleted > 0 && <label className="flex items-center gap-2"><input type="checkbox" checked={revive} onChange={(e) => setRevive(e.target.checked)} />Also bring back {wasDeleted} records deleted since</label>}
          </div>
          <button onClick={apply} className="btn-primary w-full">Restore into my account</button>
        </>
      )}
    </Sheet>
  );
}

// ---------- Password hint and recovery sheet ----------
// The password is never stored. The hint lives on this device (shown at sign-in),
// a drill checks you still remember the password, and the sheet is printed once.
export function RecoverySheet({ onClose }: { onClose: () => void }) {
  const { session, data, profile } = useApp();
  const backup = useBackup();
  const [hint, setHint] = useState(() => passwordHint(session.user));
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState("");
  const [drill, setDrill] = useState("");
  const [printing, setPrinting] = useState(false);
  const test = async () => {
    setDrill("Checking…");
    try {
      await readBackup(await exportBackup(session, { ok: 1 }), session.user, pw);
      markDrill(session.user); setDrill("✅ Correct! You still remember it."); setPw("");
    } catch { setDrill("❌ That's not it. Find your written copy now, while you are still signed in."); }
  };
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => { window.print(); setPrinting(false); }, 200);
    return () => clearTimeout(t);
  }, [printing]);
  const looksLikePw = hint.length >= 6 && !/\s/.test(hint);
  return (
    <Sheet title="🔑 Never lose your data" onClose={onClose}>
      <p className="text-sm text-muted">Your data is locked with your password and nobody can reset it, not even the server. These three steps make sure a forgotten password never costs you everything.</p>
      <div className="rounded-xl bg-white/5 p-3 space-y-2">
        <div className="font-semibold text-sm">1. Password hint</div>
        <input className="input" placeholder="e.g. first pet + year I came to Japan" value={hint} onChange={(e) => { setHint(e.target.value); setSaved(false); }} />
        {looksLikePw && <p className="text-xs text-amber-300">Make sure this is a hint, not the password itself.</p>}
        <button className="btn-ghost w-full" onClick={() => { savePasswordHint(session.user, hint); setSaved(true); }}>{saved ? "✓ Saved on this device" : "Save hint"}</button>
        <p className="text-[11px] text-muted">Shown on the sign-in screen of this device. Save it on each device you use.</p>
      </div>
      <div className="rounded-xl bg-white/5 p-3 space-y-2">
        <div className="font-semibold text-sm">2. Password drill</div>
        <p className="text-xs text-muted">Last checked: {ago(lastDrill(session.user))}. Type it from memory once a month.</p>
        <div className="flex gap-2">
          <input type="password" className="input" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button disabled={!pw} onClick={test} className="btn-primary shrink-0">Test</button>
        </div>
        {drill && <p className="text-sm">{drill}</p>}
      </div>
      <div className="rounded-xl bg-white/5 p-3 space-y-2">
        <div className="font-semibold text-sm">3. Recovery sheet (print once)</div>
        <p className="text-xs text-muted">A page with your username and a blank line to write your password by hand. Keep it in a drawer at home. Also download a backup file.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => setPrinting(true)}>🖨️ Print sheet</button>
          <button className="btn-ghost" onClick={backup}>📦 Backup file</button>
        </div>
      </div>
      {printing && createPortal(
        <div className="print-only">
          <h1>Life OS recovery sheet</h1>
          <p>Hero: {profile.display_name}</p>
          <p>Username: <b>{session.user}</b></p>
          <p>Password hint: {hint || "(none)"}</p>
          <p style={{ marginTop: 24 }}>Password (write by hand): ______________________________</p>
          <p style={{ marginTop: 24 }}>Printed {new Date().toLocaleDateString()} · {data.logs.length} records. Backup files end in .lifeos and open with the same password: sign in, Hero › Backup &amp; restore › Restore from a backup file.</p>
          <p>Nobody can reset this password. Keep this page somewhere safe and private.</p>
        </div>, document.body)}
    </Sheet>
  );
}

// Shown under the password box on the sign-in screen.
export function PasswordHint({ user }: { user: string }) {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState("");
  useEffect(() => { setHint(user ? passwordHint(user) : ""); setShow(false); }, [user]);
  if (!hint) return null;
  return show ? <p className="text-xs text-[var(--accent2)]">💡 Hint: {hint}</p>
    : <button type="button" onClick={() => setShow(true)} className="text-xs text-muted">💡 Show my password hint</button>;
}

// ---------- Display & reading ----------
export function DisplaySheet({ onClose }: { onClose: () => void }) {
  const [p, setP] = useState<Display>(() => displayPrefs());
  const put = (patch: Partial<Display>) => setP(saveDisplay(patch));
  const row = (label: string, on: boolean, f: () => void) => (
    <button onClick={f} className="btn-ghost w-full flex justify-between"><span>{label}</span><span>{on ? "On" : "Off"}</span></button>
  );
  return (
    <Sheet title="🖥️ Display & reading" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => put({ light: false })} className={`chip py-2 justify-center ${!p.light ? "chip-on" : ""}`}>🌙 Dark</button>
        <button onClick={() => put({ light: true })} className={`chip py-2 justify-center ${p.light ? "chip-on" : ""}`}>☀️ Light</button>
      </div>
      <label className="block text-sm">Text size: <b>{p.font}%</b>
        <input type="range" min={85} max={140} step={5} value={p.font} onChange={(e) => put({ font: Number(e.target.value) })} className="w-full mt-1" />
      </label>
      <div className="flex gap-2">{[90, 100, 115, 130].map((f) => <button key={f} onClick={() => put({ font: f })} className={`chip flex-1 ${p.font === f ? "chip-on" : ""}`}>{f}%</button>)}</div>
      {row("👆 Bigger buttons", p.big, () => put({ big: !p.big }))}
      {canSpeak() && (
        <>
          {row("🔊 Read Sensei's messages aloud", p.speak, () => put({ speak: !p.speak }))}
          <label className="block text-sm">Voice speed: <b>{p.voiceRate.toFixed(1)}×</b>
            <input type="range" min={0.6} max={1.5} step={0.1} value={p.voiceRate} onChange={(e) => put({ voiceRate: Number(e.target.value) })} className="w-full mt-1" />
          </label>
          <button className="btn-ghost w-full" onClick={() => speak("Hello hero. Drink a glass of water and start one focus session.", true)}>▶ Test the voice</button>
        </>
      )}
      <p className="text-xs text-muted">Saved on this device only, so the iPhone and the tablet can each have their own size.</p>
    </Sheet>
  );
}

export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  if (!canSpeak()) return null;
  // Tap again while it's reading to stop.
  return <button type="button" aria-label="Read aloud" onClick={(e) => { e.stopPropagation(); if (speechSynthesis.speaking) speechSynthesis.cancel(); else speak(text, true); }} className={`chip !px-2 !py-0.5 ${className}`}>🔊</button>;
}

// ---------- Nudges on Base Camp ----------
// At most a few small reminders: Sunday review, weekly backup, password drill, sync.
export function Nudges() {
  const { session } = useApp();
  const s = useSyncState();
  const [, force] = useState(0);
  const now = new Date();
  const dismissed = (k: string) => { try { return localStorage.getItem(`lifeos-nudge:${k}`) === "1"; } catch { return false; } };
  const dismiss = (k: string) => { try { localStorage.setItem(`lifeos-nudge:${k}`, "1"); } catch {} force((n) => n + 1); };
  const week = mondayOf(today());
  const fileAt = lastFileBackup(session.user), drillAt = lastDrill(session.user);
  const backup = useBackup();
  const list: { k: string; icon: string; text: string; act: React.ReactNode }[] = [];
  if ([0, 1].includes(now.getDay())) list.push({ k: `review:${week}`, icon: "📅", text: now.getDay() === 0 ? "Sunday review: this week vs last week, and 3 things to fix." : "Last week's review is ready.", act: <Link href="/tools?open=review" className="chip chip-on">Open</Link> });
  if (!fileAt || now.getTime() - new Date(fileAt).getTime() > WEEK) list.push({ k: `backup:${week}`, icon: "📦", text: "Weekly backup: download a locked copy of your data.", act: <button onClick={backup} className="chip chip-on">Download</button> });
  if (!drillAt || now.getTime() - new Date(drillAt).getTime() > 30 * DAY) list.push({ k: `drill:${now.toISOString().slice(0, 7)}`, icon: "🔑", text: "Do you still remember your password? Test it once a month.", act: <Link href="/rank#backup" className="chip chip-on">Test</Link> });
  if (s.stale && s.online) list.push({ k: `sync:${today()}`, icon: "⚠️", text: `This device hasn't synced for ${ago(s.last).replace(" ago", "")}.`, act: null });
  const show = list.filter((x) => !dismissed(x.k)).slice(0, 3);
  if (!show.length) return null;
  return (
    <section className="card p-3 mb-4 space-y-2">
      {show.map((x) => (
        <div key={x.k} className="flex items-center gap-2 text-sm">
          <span className="text-xl">{x.icon}</span>
          <span className="flex-1 min-w-0">{x.text}</span>
          {x.act}
          <button aria-label="Dismiss" onClick={() => dismiss(x.k)} className="text-muted px-1">✕</button>
        </div>
      ))}
    </section>
  );
}
