"use client";

import { useCallback, useEffect, useState } from "react";
import { AppProvider, initialData, mergeData, type Data } from "@/lib/store";
import { getLockout, lastUser, login, readBackup, recordAttempt, register, rememberUser, type Session } from "@/lib/vault";

const IDLE_MS = 3 * 60 * 1000;
const HIDDEN_GRACE_MS = 30 * 1000;

// Mandatory sign-in. The decryption key only lives in memory while unlocked;
// idle time or leaving the app throws it away and shows this screen again.
export function Gate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Data | null>(null);

  const lock = useCallback(() => {
    setSession(null);
    setData(null);
  }, []);

  useEffect(() => {
    if (!session) return;
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
  }, [session, lock]);

  if (session && data) {
    return <AppProvider key={session.cacheId} session={session} initial={data} onLock={lock}>{children}</AppProvider>;
  }
  return <SignIn onDone={(s, d) => { setSession(s); setData(d); }} />;
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

function SignIn({ onDone }: { onDone: (s: Session, d: Data) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [backup, setBackup] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getLockout().then((l) => setUntil(l.until));
    lastUser().then((u) => u && setUser(u));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wait || busy) return;
    setError("");
    if (mode === "up") {
      if (pw.length < 8) return setError("Use at least 8 characters.");
      if (pw !== pw2) return setError("Passwords don't match.");
    }
    setBusy(true);
    try {
      let start = initialData(name.trim() || user.trim() || "Hero");
      if (mode === "up" && backup) start = await readBackup<Data>(await backup.text(), user, pw);
      const res = mode === "in" ? await login<Data>(user, pw, mergeData) : await register<Data>(user, pw, start);
      if ("error" in res) {
        if (mode === "in") {
          const lo = await recordAttempt(false);
          setUntil(lo.until);
          navigator.vibrate?.([80, 50, 80]);
        }
        setPw("");
        return setError(res.error);
      }
      await recordAttempt(true);
      await rememberUser(res.session.user);
      onDone(res.session, { ...res.data, deleted: res.data.deleted ?? [] });
    } catch {
      setError(backup ? "That password doesn't open this backup." : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <p className="text-center text-sm text-muted">
        {mode === "in" ? "Welcome back, hero." : "One account for your phone and PC. Everything is encrypted with your password before it leaves the device."}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input autoCapitalize="none" autoComplete="username" placeholder="Username or email" className="input" value={user} onChange={(e) => setUser(e.target.value)} />
        {mode === "up" && !backup && <input placeholder="Your name" className="input" value={name} onChange={(e) => setName(e.target.value)} />}
        <input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
        {mode === "up" && <input type="password" autoComplete="new-password" placeholder="Repeat password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />}
        {mode === "up" && <p className="text-xs text-amber-300">There is no password reset. If you forget it, nobody can recover your data, not even the server.</p>}
        <p className="min-h-5 text-sm text-rose-400">{wait > 0 ? `Locked. Try again in ${wait}s.` : error}</p>
        <button disabled={busy || wait > 0 || !pw || !user} className="btn-primary w-full">
          {busy ? "Securing…" : mode === "in" ? "Sign in" : backup ? "Create from backup" : "Create account"}
        </button>
      </form>
      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }} className="w-full text-sm text-muted">
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
      {mode === "up" && (
        <label className="block text-center text-xs text-muted cursor-pointer">
          {backup ? `📦 ${backup.name}` : "Have a backup file? Start from it"}
          <input type="file" accept=".lifeos,application/json" className="hidden" onChange={(e) => setBackup(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </Shell>
  );
}
