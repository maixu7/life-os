"use client";

import { useCallback, useEffect, useState } from "react";
import { AppProvider, initialData, type Data } from "@/lib/store";
import { createVault, getLockout, hasVault, importBackup, recordAttempt, saveVault, unlock, type Session } from "@/lib/vault";

const IDLE_MS = 3 * 60 * 1000;
const HIDDEN_GRACE_MS = 30 * 1000;

// Mandatory sign-in. The decryption key only lives in memory while unlocked;
// idle time or leaving the app throws it away and shows this screen again.
export function Gate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "setup" | "login" | "open">("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    hasVault().then((v) => setState(v ? "login" : "setup")).catch(() => setState("setup"));
  }, []);

  const lock = useCallback(() => {
    setSession(null);
    setData(null);
    setState("login");
  }, []);

  useEffect(() => {
    if (state !== "open") return;
    let idle = setTimeout(lock, IDLE_MS);
    let hiddenAt = 0;
    const reset = () => {
      clearTimeout(idle);
      idle = setTimeout(lock, IDLE_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > HIDDEN_GRACE_MS) lock();
    };
    const events = ["pointerdown", "keydown", "scroll"];
    events.forEach((e) => addEventListener(e, reset, { passive: true }));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(idle);
      events.forEach((e) => removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [state, lock]);

  const open = (s: Session, d: Data) => {
    setSession(s);
    setData(d);
    setState("open");
  };

  if (state === "open" && session && data) {
    return <AppProvider session={session} initial={data} onLock={lock}>{children}</AppProvider>;
  }
  if (state === "loading") return <Shell><p className="text-center text-muted">Loading…</p></Shell>;
  return state === "setup" ? <Setup onDone={open} /> : <Login onDone={open} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm card p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-5xl">⛩️</div>
          <h1 className="text-3xl font-black tracking-tight glow-text">LIFE OS</h1>
        </div>
        {children}
      </div>
    </main>
  );
}

function Login({ onDone }: { onDone: (s: Session, d: Data) => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getLockout().then((l) => setUntil(l.until));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wait || busy) return;
    setBusy(true);
    const res = await unlock<Data>(pw);
    const lo = await recordAttempt(!!res);
    setBusy(false);
    if (res) return onDone(res.session, res.data);
    navigator.vibrate?.([80, 50, 80]);
    setPw("");
    setUntil(lo.until);
    setError(lo.until ? "Too many wrong tries." : `Wrong password${lo.tries >= 3 ? ` (${5 - lo.tries} tries before lockout)` : ""}.`);
  };

  return (
    <Shell>
      <p className="text-center text-sm text-muted">Welcome back, hero.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="password" autoFocus autoComplete="current-password" placeholder="Password" className="input"
          value={pw} onChange={(e) => setPw(e.target.value)} />
        <p className="min-h-5 text-sm text-rose-400">{wait > 0 ? `Locked. Try again in ${wait}s.` : error}</p>
        <button disabled={busy || wait > 0 || !pw} className="btn-primary w-full">{busy ? "Unlocking…" : "Unlock"}</button>
      </form>
    </Shell>
  );
}

function Setup({ onDone }: { onDone: (s: Session, d: Data) => void }) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<File | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (!backup && pw !== pw2) return setError("Passwords don't match.");
    setBusy(true);
    try {
      if (backup) {
        const { session, data } = await importBackup(await backup.text(), pw);
        await saveVault(session, data);
        return onDone(session, data);
      }
      const data = initialData(name.trim() || "Hero");
      onDone(await createVault(pw, data), data);
    } catch {
      setError(backup ? "That password doesn't open this backup." : "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <Shell>
      <p className="text-center text-sm text-muted">
        {backup ? "Restore from your backup file." : "Create your password. Your data is encrypted with it and never leaves this device."}
      </p>
      <form onSubmit={submit} className="space-y-3">
        {!backup && <input placeholder="Your name" className="input" value={name} onChange={(e) => setName(e.target.value)} />}
        <input type="password" autoComplete={backup ? "current-password" : "new-password"} placeholder="Password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
        {!backup && <input type="password" autoComplete="new-password" placeholder="Repeat password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />}
        {!backup && <p className="text-xs text-amber-300">There is no password reset. If you forget it, the data can&apos;t be recovered.</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Securing…" : backup ? "Restore" : "Create"}</button>
      </form>
      <label className="block text-center text-sm text-muted cursor-pointer">
        {backup ? `📦 ${backup.name}` : "Have a backup? Restore it"}
        <input type="file" accept=".lifeos,application/json" className="hidden" onChange={(e) => setBackup(e.target.files?.[0] ?? null)} />
      </label>
    </Shell>
  );
}
