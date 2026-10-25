"use client";

import { useCallback, useEffect, useState } from "react";
import { PasswordHint } from "@/components/PasswordHint";
import { AppProvider, initialData, mergeData, normalizeData, type Data } from "@/lib/store";
import {
  forgetDevice, getLockout, lastUser, login, readBackup, recordAttempt, register, remembered, rememberDevice,
  rememberUser, save, unlockWithPin, type Session,
} from "@/lib/vault";

export const LOCK_KEY = "lifeos-lock-minutes";
export function lockMinutes() {
  try {
    return Number(localStorage.getItem(LOCK_KEY) ?? 5);
  } catch {
    return 5;
  }
}

// Mandatory sign-in. The decryption key only lives in memory while unlocked; after the app has
// been in the background longer than the chosen time it is dropped and the PIN is asked again.
export function Gate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<"loading" | "pin" | "password" | "setpin">("loading");
  const [hasPin, setHasPin] = useState(false);
  const [autoError, setAutoError] = useState("");

  // A remembered device without a PIN opens straight into the app.
  const start = useCallback(async () => {
    const r = await remembered().catch(() => null);
    setHasPin(!!r?.hasPin);
    if (!r) return setMode("password");
    if (r.hasPin) return setMode("pin");
    const res = await unlockWithPin<Data>("", mergeData).catch(() => ({ error: "Something went wrong." }));
    if ("error" in res) {
      setAutoError(res.error);
      return setMode("password");
    }
    const fixed = normalizeData(res.data);
    if (!res.data.pantry || !res.data.profile.avatar || !res.data.items?.some((i) => i.category === "reward")) {
      await save(res.session, fixed, mergeData).catch(() => {});
    }
    setSession(res.session);
    setData(fixed);
    setMode("pin");
  }, []);

  useEffect(() => { start(); }, [start]);

  const lock = useCallback(() => {
    setSession(null);
    setData(null);
    setMode("loading");
    start();
  }, [start]);

  // Signing out forgets this device; the password is needed next time.
  const signOut = useCallback(async () => {
    await forgetDevice();
    setSession(null);
    setData(null);
    setMode("password");
  }, []);

  useEffect(() => {
    if (!session || !hasPin) return;
    let hiddenAt = 0;
    const onVis = () => {
      const limit = lockMinutes() * 60_000;
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > limit) lock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [session, lock, hasPin]);

  const done = async (s: Session, d: Data, viaPassword: boolean) => {
    const fixed = normalizeData(d);
    // Data from an older version: store the upgraded copy right away so every device shares it.
    if (!d.pantry || !d.profile.avatar || !d.items?.some((i) => i.category === "reward")) await save(s, fixed, mergeData).catch(() => {});
    setSession(s);
    setData(fixed);
    setMode(viaPassword && !(await remembered()) ? "setpin" : "pin");
  };

  if (session && data && mode === "setpin") {
    return <SetPin onDone={async (pin) => { await rememberDevice(session, pin); setHasPin(!!pin); setMode("pin"); }} />;
  }
  if (session && data) {
    return <AppProvider key={session.cacheId} session={session} initial={data} onLock={hasPin ? lock : signOut} onSignOut={signOut} hasPin={hasPin}>{children}</AppProvider>;
  }
  if (mode === "loading") return <Shell><p className="text-center text-muted">Loading…</p></Shell>;
  if (mode === "pin") return <PinUnlock onDone={(s, d) => done(s, d, false)} onPassword={() => setMode("password")} />;
  return <SignIn onDone={(s, d) => done(s, d, true)} initialError={autoError} />;
}

function PinPad({ title, sub, error, onComplete, length = 4 }: {
  title: string; sub?: string; error?: string; onComplete: (pin: string) => void; length?: number;
}) {
  const [pin, setPin] = useState("");
  const press = (d: string) => {
    const next = (pin + d).slice(0, length);
    setPin(next);
    if (next.length === length) {
      setTimeout(() => setPin(""), 150);
      onComplete(next);
    }
  };
  return (
    <div className="space-y-5 text-center select-none">
      <div>
        <div className="font-bold">{title}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
      <div className="flex justify-center gap-3">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < pin.length ? "bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" : "bg-white/15"}`} />
        ))}
      </div>
      <p className="min-h-5 text-sm text-rose-400">{error}</p>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k === "" ? <span key={i} /> : (
            <button key={k} type="button" onClick={() => (k === "⌫" ? setPin(pin.slice(0, -1)) : press(k))}
              className="card h-14 text-2xl font-bold active:scale-95">{k}</button>
          ),
        )}
      </div>
    </div>
  );
}

function PinUnlock({ onDone, onPassword }: { onDone: (s: Session, d: Data) => void; onPassword: () => void }) {
  const [user, setUser] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { remembered().then((r) => r && setUser(r.user)); }, []);

  const submit = async (pin: string) => {
    setBusy(true);
    const res = await unlockWithPin<Data>(pin, mergeData).catch(() => ({ error: "Something went wrong." } as { error: string; left?: number }));
    setBusy(false);
    if ("error" in res) {
      navigator.vibrate?.([80, 50, 80]);
      setError(res.error);
      if (res.left === 0) onPassword();
      return;
    }
    onDone(res.session, res.data);
  };

  return (
    <Shell>
      <PinPad title={busy ? "Unlocking…" : `Welcome back${user ? `, ${user.split("@")[0]}` : ""}`} sub="Enter your PIN" error={error} onComplete={submit} />
      <button onClick={async () => { await forgetDevice(); onPassword(); }} className="w-full text-sm text-muted">Use password instead</button>
    </Shell>
  );
}

function SetPin({ onDone }: { onDone: (pin: string | null) => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [wantPin, setWantPin] = useState(false);
  if (!wantPin) {
    return (
      <Shell>
        <div className="text-center space-y-1">
          <div className="font-bold">This device will remember you</div>
          <div className="text-sm text-muted">Next time the app opens straight away, no password needed.</div>
        </div>
        <button onClick={() => onDone(null)} className="btn-primary w-full">Continue</button>
        <button onClick={() => setWantPin(true)} className="w-full text-sm text-muted">Add a 4-digit PIN lock (optional)</button>
      </Shell>
    );
  }
  return (
    <Shell>
      <PinPad
        title={first ? "Repeat your PIN" : "Set a 4-digit PIN"}
        sub="Unlock quickly on this device without your password"
        error={error}
        onComplete={(pin) => {
          if (!first) return setFirst(pin);
          if (pin !== first) {
            setFirst(null);
            return setError("PINs didn't match. Try again.");
          }
          onDone(pin);
        }}
      />
      <button onClick={() => onDone(null)} className="w-full text-sm text-muted">No PIN, just remember me</button>
    </Shell>
  );
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

function SignIn({ onDone, initialError = "" }: { onDone: (s: Session, d: Data) => void; initialError?: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [backup, setBackup] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
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
      onDone(res.session, res.data);
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
        {mode === "in" && <PasswordHint user={user} />}
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
