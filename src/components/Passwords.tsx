"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { loadImage } from "@/lib/foodphoto";
import { today, useApp, type CustomItem } from "@/lib/store";
import { openSecret, sealSecret, unlockPasswords, type Cipher } from "@/lib/vault";

// 🔐 Passwords: a safe place to SAVE the user IDs and passwords you already have.
// Opens only with your app password, locks again after 5 minutes away, and the
// screen goes blank when you switch apps. Each login is sealed with its own key,
// so nothing else in the app can read it. No AI, no password maker.

export type Login = {
  name: string; group: string; user: string; pw: string; site: string; note: string;
  fav?: boolean; photo?: string; changed: string; created: string;
  history: { pw: string; until: string }[];
};
type Row = Login & { id: string };

export const GROUPS: [string, string][] = [["Bank", "🏦"], ["Email", "📧"], ["Shopping", "🛒"], ["Apps", "📱"], ["Wi-Fi", "📶"], ["Other", "🔑"]];
const iconOf = (g: string) => GROUPS.find(([n]) => n === g)?.[1] ?? "📁";
const AWAY_MS = 5 * 60_000;
const SHOW_MS = 30_000;

// The key lives only in memory, so a reload or 5 minutes away needs the password again.
let held: { key: CryptoKey; seen: number } | null = null;
const fresh = () => (held && Date.now() - held.seen < AWAY_MS ? held.key : null);

const nice = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); }
  catch {
    const el = document.createElement("textarea");
    el.value = t; el.setAttribute("readonly", ""); el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.select();
    try { document.execCommand("copy"); } catch { /* nothing more to try */ }
    el.remove();
  }
  // Clear it again after 30 seconds (the phone only allows this while the app is open).
  setTimeout(() => { if (document.hasFocus()) navigator.clipboard?.writeText("").catch(() => {}); }, SHOW_MS);
}

export function Passwords() {
  const { session, data, update, profile, saveSettings } = useApp();
  const [key, setKey] = useState<CryptoKey | null>(() => fresh());
  const [hidden, setHidden] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [open, setOpen] = useState<Row | null>(null);
  const [edit, setEdit] = useState<Partial<Row> | null>(null);
  const [toast, setToast] = useState("");
  const [backup, setBackup] = useState(false);

  const items = useMemo(() => data.items.filter((i) => i.category === "pw"), [data.items]);
  const lock = useCallback(() => { held = null; setKey(null); setRows(null); setOpen(null); setEdit(null); }, []);

  // Any touch keeps it open; 5 minutes away (or with the app hidden) locks it.
  useEffect(() => {
    if (!key) return;
    held = { key, seen: Date.now() };
    const touch = () => { if (held) held.seen = Date.now(); };
    const vis = () => {
      if (document.hidden) { setHidden(true); touch(); return; }
      setHidden(false);
      if (!fresh()) lock();
    };
    const t = setInterval(() => { if (!fresh()) lock(); }, 10_000);
    for (const ev of ["pointerdown", "keydown", "scroll"]) addEventListener(ev, touch, { passive: true });
    document.addEventListener("visibilitychange", vis);
    const gone = () => setHidden(true);
    addEventListener("pagehide", gone);
    return () => {
      removeEventListener("pagehide", gone);
      touch();
      clearInterval(t);
      for (const ev of ["pointerdown", "keydown", "scroll"]) removeEventListener(ev, touch);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [key, lock]);

  // Open every saved login with the key.
  useEffect(() => {
    if (!key) return;
    let live = true;
    Promise.all(items.map(async (i) => {
      try { return { ...(await openSecret<Login>(key, i.config.s as Cipher)), id: i.id }; } catch { return null; }
    })).then((r) => live && setRows(r.filter(Boolean) as Row[]));
    return () => { live = false; };
  }, [key, items]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const copy = (t: string, what: string) => { copyText(t); flash(`📋 ${what} copied. It clears in 30 seconds.`); };

  const save = async (r: Partial<Row>) => {
    if (!key) return;
    const now = new Date().toISOString();
    const old = rows?.find((x) => x.id === r.id);
    const history = [...(old?.history ?? [])];
    if (old && old.pw && old.pw !== r.pw) history.unshift({ pw: old.pw, until: now });
    const login: Login = {
      name: (r.name ?? "").trim() || (r.site ?? "").trim() || "Login", group: r.group || "Other",
      user: r.user ?? "", pw: r.pw ?? "", site: (r.site ?? "").trim(), note: r.note ?? "", fav: !!r.fav, photo: r.photo,
      changed: old && old.pw === r.pw ? old.changed : now, created: old?.created ?? now, history: history.slice(0, 10),
    };
    const s = await sealSecret(key, login);
    const id = old?.id ?? crypto.randomUUID();
    const item: CustomItem = { id, category: "pw", name: "", config: { s, at: now }, sort: old ? (items.find((i) => i.id === id)?.sort ?? Date.now()) : Date.now() };
    update((d) => ({ ...d, items: old ? d.items.map((i) => (i.id === id ? item : i)) : [...d.items, item] }));
    setEdit(null);
    setOpen({ ...login, id });
    flash(`✓ Saved ${login.name}.`);
  };
  const remove = (id: string) => {
    update((d) => ({ ...d, items: d.items.filter((i) => i.id !== id), deleted: [...d.deleted, id] }));
    setOpen(null); setEdit(null); flash("🗑️ Removed.");
  };
  const star = async (r: Row) => save({ ...r, fav: !r.fav });

  if (!key) return <LockScreen user={session.user} onOpen={setKey} unlock={(pw) => unlockPasswords(session, pw)} />;

  const own = [...new Set((rows ?? []).map((r) => r.group).filter((g) => !GROUPS.some(([n]) => n === g)))];
  const t = q.trim().toLowerCase();
  const shown = (rows ?? [])
    .filter((r) => group === "All" || (group === "⭐" ? r.fav : r.group === group))
    .filter((r) => !t || `${r.name} ${r.user} ${r.site} ${r.note} ${r.group}`.toLowerCase().includes(t))
    .sort((a, b) => Number(!!b.fav) - Number(!!a.fav) || a.name.localeCompare(b.name));

  return (
    <>
      {hidden && <div className="fixed inset-0 z-[100] bg-black" aria-hidden />}
      <XpHeader title="Passwords" icon="🔐" subtitle="Your saved user IDs and passwords" />
      {!profile.settings.pw_warned && (
        <div className="card p-3 mb-3 text-sm border border-amber-400/60">
          ⚠️ <b>Please remember your app password.</b> These logins are locked with it. If you forget it, nobody (not even the app) can open them again.
          <button onClick={() => saveSettings({ pw_warned: true })} className="btn-primary w-full mt-2 !py-2 text-sm">I understand</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => setEdit({ group: group !== "All" && group !== "⭐" ? group : "Other", fav: group === "⭐" })} className="btn-primary !py-3">＋ Save a login</button>
        <button onClick={lock} className="btn-ghost !py-3">🔒 Lock now</button>
      </div>
      <input className="input mb-2" type="search" placeholder="🔍 Search name, ID, website, note…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
        {[["All", "📋"], ["⭐", ""], ...GROUPS, ...own.map((g) => [g, "📁"])].map(([g, ic]) => {
          const n = (rows ?? []).filter((r) => g === "All" || (g === "⭐" ? r.fav : r.group === g)).length;
          return <button key={g} onClick={() => setGroup(g)} className={`chip shrink-0 ${group === g ? "chip-on" : ""}`}>{ic} {g === "⭐" ? "⭐ Favourites" : g} {n > 0 && <span className="opacity-70">{n}</span>}</button>;
        })}
      </div>
      {rows === null ? <p className="text-sm text-muted text-center py-6">Opening…</p>
        : !shown.length ? <p className="text-sm text-muted text-center py-6">{rows.length ? "Nothing matches." : "No logins saved yet. Tap ＋ Save a login."}</p>
        : (
          <ul className="space-y-1.5">
            {shown.map((r) => (
              <li key={r.id} className="card p-2.5 flex items-center gap-2.5">
                <button onClick={() => setOpen(r)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-2xl">{iconOf(r.group)}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{r.fav && "⭐ "}{r.name}</span>
                    <span className="block text-xs text-muted truncate">{r.user || r.site || r.group}</span>
                  </span>
                </button>
                {r.user && <button onClick={() => copy(r.user, "ID")} className="chip !px-2 text-[11px] shrink-0">📋 ID</button>}
                {r.pw && <button onClick={() => copy(r.pw, "Password")} className="chip chip-on !px-2 text-[11px] shrink-0">📋 Pass</button>}
              </li>
            ))}
          </ul>
        )}
      <button onClick={() => setBackup(true)} className="btn-ghost w-full mt-4 text-sm">💾 Backup file (save or load)</button>
      <p className="text-[11px] text-muted mt-2 text-center">Locks after 5 minutes away. Locked with your app password on this phone; only scrambled data is synced.</p>

      {open && !edit && <LoginSheet r={rows?.find((x) => x.id === open.id) ?? open} copy={copy} onStar={star} onEdit={() => setEdit(open)} onClose={() => setOpen(null)} />}
      {edit && <EditSheet r={edit} groups={own} onSave={save} onRemove={edit.id ? () => remove(edit.id!) : undefined} onClose={() => setEdit(null)} />}
      {backup && <BackupSheet pwKey={key} items={items} flash={flash} onClose={() => setBackup(false)} />}
      {toast && <div className="fixed bottom-24 left-4 right-4 z-[60] card bg-[#1c1330] px-4 py-3 text-sm text-center animate-sheet">{toast}</div>}
    </>
  );
}

function LockScreen({ user, unlock, onOpen }: { user: string; unlock: (pw: string) => Promise<CryptoKey | null>; onOpen: (k: CryptoKey) => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    if (!pw || busy) return;
    setBusy(true); setErr("");
    const k = await unlock(pw).catch(() => null);
    setBusy(false);
    if (k) onOpen(k); else { setErr("Wrong password. Use the password you sign in to this app with."); setPw(""); }
  };
  return (
    <>
      <XpHeader title="Passwords" icon="🔐" subtitle="Your saved user IDs and passwords" />
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="card p-5 space-y-3 text-center">
        <div className="text-6xl">🔒</div>
        <p className="font-bold">Locked</p>
        <p className="text-sm text-muted">Type your app password to open (account <b>{user}</b>).</p>
        <input className="input text-center" type="password" autoFocus autoComplete="current-password" placeholder="App password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <button type="submit" disabled={!pw || busy} className="btn-primary w-full !py-3">{busy ? "Checking…" : "🔓 Open"}</button>
      </form>
    </>
  );
}

function Field({ label, value, secret, onCopy }: { label: string; value: string; secret?: boolean; onCopy: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { if (!show) return; const t = setTimeout(() => setShow(false), SHOW_MS); return () => clearTimeout(t); }, [show]);
  return (
    <div className="rounded-xl bg-white/5 p-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="flex items-center gap-2">
        <span className="flex-1 min-w-0 font-mono text-base break-all">{secret && !show ? "••••••••••" : value}</span>
        {secret && <button onClick={() => setShow(!show)} className="chip !px-2 shrink-0">{show ? "🙈 Hide" : "👁 Show"}</button>}
        <button onClick={onCopy} className="chip chip-on !px-2 shrink-0">📋 Copy</button>
      </div>
    </div>
  );
}

function LoginSheet({ r, copy, onStar, onEdit, onClose }: { r: Row; copy: (t: string, w: string) => void; onStar: (r: Row) => void; onEdit: () => void; onClose: () => void }) {
  const [old, setOld] = useState(false);
  const [big, setBig] = useState(false);
  const href = r.site && (/^https?:\/\//i.test(r.site) ? r.site : /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(r.site) ? `https://${r.site}` : "");
  return (
    <Sheet title={`${iconOf(r.group)} ${r.name}`} onClose={onClose}>
      <div className="flex gap-2">
        <span className="chip">{iconOf(r.group)} {r.group}</span>
        <button onClick={() => onStar(r)} className={`chip ${r.fav ? "chip-on" : ""}`}>{r.fav ? "⭐ Favourite" : "☆ Add to favourites"}</button>
      </div>
      {r.user && <Field label="User ID" value={r.user} onCopy={() => copy(r.user, "ID")} />}
      {r.pw && <Field label="Password" value={r.pw} secret onCopy={() => copy(r.pw, "Password")} />}
      {r.site && (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="text-[11px] text-muted">Website or app</div>
          {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent2)] break-all underline">{r.site}</a> : <span className="break-all">{r.site}</span>}
        </div>
      )}
      {r.note && (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="text-[11px] text-muted flex items-center">Note / extra info <button onClick={() => copy(r.note, "Note")} className="ml-auto chip !px-2 !py-0 text-[11px]">📋 Copy</button></div>
          <p className="whitespace-pre-wrap text-sm">{r.note}</p>
        </div>
      )}
      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <button onClick={() => setBig(true)} className="block w-full"><img src={r.photo} alt="Saved photo" className="w-full max-h-48 object-contain rounded-xl bg-black/30" /></button>
      )}
      <p className="text-[11px] text-muted">Password last changed {nice(r.changed)} · saved {nice(r.created)}</p>
      {r.history.length > 0 && (
        <div>
          <button onClick={() => setOld(!old)} className="text-xs text-[var(--accent2)]">🕘 Old passwords ({r.history.length}) {old ? "▲" : "▼"}</button>
          {old && r.history.map((h, i) => <Field key={i} label={`Used until ${nice(h.until)}`} value={h.pw} secret onCopy={() => copy(h.pw, "Old password")} />)}
        </div>
      )}
      <button onClick={onEdit} className="btn-primary w-full !py-2.5">✏️ Change</button>
      {big && r.photo && (
        <div className="fixed inset-0 z-[70] bg-black grid place-items-center" onClick={() => setBig(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.photo} alt="Saved photo" className="max-w-full max-h-full object-contain" />
          <button aria-label="Close" className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/20 text-xl">✕</button>
        </div>
      )}
    </Sheet>
  );
}

function EditSheet({ r, groups, onSave, onRemove, onClose }: { r: Partial<Row>; groups: string[]; onSave: (r: Partial<Row>) => void; onRemove?: () => void; onClose: () => void }) {
  const [d, setD] = useState<Partial<Row>>({ ...r });
  const [show, setShow] = useState(!r.id);
  const [newGroup, setNewGroup] = useState("");
  const [sure, setSure] = useState(false);
  const photo = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Row>) => setD((x) => ({ ...x, ...p }));
  const pick = async (f?: File) => {
    if (!f) return;
    const img = await loadImage(f, 1100);
    set({ photo: img.src });
  };
  const ok = !!((d.name ?? "").trim() || (d.site ?? "").trim()) && !!((d.user ?? "") || (d.pw ?? "") || (d.note ?? ""));
  return (
    <Sheet title={r.id ? "✏️ Change login" : "＋ Save a login"} onClose={onClose}>
      <label className="block text-xs text-muted">Name
        <input className="input mt-1" placeholder="e.g. SMBC bank, Gmail, Amazon, Home Wi-Fi" value={d.name ?? ""} onChange={(e) => set({ name: e.target.value })} autoComplete="off" />
      </label>
      <div className="text-xs text-muted">Group</div>
      <div className="flex flex-wrap gap-1.5">
        {[...GROUPS.map(([g]) => g), ...groups].map((g) => <button key={g} onClick={() => set({ group: g })} className={`chip !py-1 text-xs ${d.group === g ? "chip-on" : ""}`}>{iconOf(g)} {g}</button>)}
        <span className="flex gap-1">
          <input className="input !py-1 !min-h-0 w-28 text-xs" placeholder="New group" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
          {newGroup.trim() && <button onClick={() => { set({ group: newGroup.trim() }); setNewGroup(""); }} className="chip chip-on !py-1 text-xs">Add</button>}
        </span>
      </div>
      <label className="block text-xs text-muted">User ID / email / phone
        <input className="input mt-1 font-mono" value={d.user ?? ""} onChange={(e) => set({ user: e.target.value })} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      </label>
      <label className="block text-xs text-muted">Password
        <span className="flex gap-1.5 mt-1">
          <input className="input font-mono flex-1" type={show ? "text" : "password"} value={d.pw ?? ""} onChange={(e) => set({ pw: e.target.value })} autoComplete="new-password" autoCapitalize="none" spellCheck={false} />
          <button type="button" onClick={() => setShow(!show)} className="btn-ghost !px-3 shrink-0">{show ? "🙈" : "👁"}</button>
        </span>
      </label>
      {r.id && r.pw && d.pw !== r.pw && <p className="text-[11px] text-muted">🕘 The old password is kept in Old passwords.</p>}
      <label className="block text-xs text-muted">Website or app (optional)
        <input className="input mt-1" placeholder="e.g. amazon.co.jp" value={d.site ?? ""} onChange={(e) => set({ site: e.target.value })} autoComplete="off" autoCapitalize="none" />
      </label>
      <label className="block text-xs text-muted">Note / extra info (optional)
        <textarea className="input mt-1 min-h-20 text-sm" placeholder="PIN, security answers, backup codes, card number…" value={d.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
      </label>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {d.photo && <img src={d.photo} alt="" className="h-16 w-24 rounded-lg object-cover" />}
        <button onClick={() => photo.current?.click()} className="btn-ghost text-sm flex-1">📷 {d.photo ? "Change photo" : "Add photo of card (optional)"}</button>
        {d.photo && <button onClick={() => set({ photo: undefined })} className="btn-ghost text-sm !px-3">✕</button>}
      </div>
      <input ref={photo} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; pick(f); }} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.fav} onChange={(e) => set({ fav: e.target.checked })} /> ⭐ Favourite (shows at the top)</label>
      <button onClick={() => onSave({ ...d, group: d.group || "Other" })} disabled={!ok} className="btn-primary w-full !py-3">💾 Save</button>
      {!ok && <p className="text-[11px] text-muted">Add a name and at least a user ID, password or note.</p>}
      {onRemove && (sure
        ? <div className="flex gap-2"><button onClick={onRemove} className="btn-hot flex-1 !py-2 text-sm">Yes, delete it</button><button onClick={() => setSure(false)} className="btn-ghost flex-1 !py-2 text-sm">Keep</button></div>
        : <button onClick={() => setSure(true)} className="btn-ghost w-full text-sm">🗑️ Delete this login</button>)}
    </Sheet>
  );
}

type BackupFile = { v: 1; kind: "lifeos-passwords"; user: string; made: string; items: { id: string; s: Cipher; sort: number }[] };

function BackupSheet({ pwKey, items, flash, onClose }: { pwKey: CryptoKey; items: CustomItem[]; flash: (m: string) => void; onClose: () => void }) {
  const { session, data, update } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const download = () => {
    const out: BackupFile = { v: 1, kind: "lifeos-passwords", user: session.user, made: new Date().toISOString(), items: items.map((i) => ({ id: i.id, s: i.config.s as Cipher, sort: i.sort })) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = `life-os-passwords-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    flash(`💾 Backup file saved (${items.length} logins). It stays locked with your app password.`);
  };
  // Logins already in the app are kept; the file's copy is added only if it's missing.
  const take = async (f: BackupFile, k: CryptoKey) => {
    const opened = await Promise.all(f.items.map(async (it) => { try { return { it, v: await openSecret<Login>(k, it.s) }; } catch { return null; } }));
    if (f.items.length && opened.every((o) => !o)) return false;
    const have = new Set(items.map((i) => i.id));
    const gone = new Set(data.deleted);
    const add: CustomItem[] = [];
    // A login deleted here gets a new id, so the "deleted" note synced to other devices doesn't remove it again.
    for (const o of opened) if (o && !have.has(o.it.id)) add.push({ id: gone.has(o.it.id) ? crypto.randomUUID() : o.it.id, category: "pw", name: "", config: { s: await sealSecret(pwKey, o.v), at: new Date().toISOString() }, sort: o.it.sort });
    update((d) => ({ ...d, items: [...d.items, ...add] }));
    flash(`✓ Loaded ${add.length} logins from the backup${opened.length - add.length ? ` (${opened.length - add.length} were already here)` : ""}.`);
    onClose();
    return true;
  };
  const read = async (fl?: File) => {
    if (!fl) return;
    setMsg("");
    try {
      const f = JSON.parse(await fl.text()) as BackupFile;
      if (f.kind !== "lifeos-passwords" || !Array.isArray(f.items)) throw new Error();
      // Same app password as now: loads straight away. Otherwise ask for the one used then.
      if (!(await take(f, pwKey))) { setPending(f); setMsg("This backup was made with a different app password. Type that password."); }
    } catch { setMsg("That file isn't a Passwords backup."); }
  };
  const withOld = async () => {
    if (!pending || !pw) return;
    setBusy(true);
    const k = await unlockPasswords(session, pw, pending.user);
    const done = k && (await take(pending, k));
    setBusy(false);
    if (!done) setMsg("Wrong password for this backup.");
  };
  return (
    <Sheet title="💾 Backup file" onClose={onClose}>
      <p className="text-sm text-muted">Save all your logins in one file (for example to Google Drive), or load them back. The file is locked: it opens only with your app password.</p>
      <button onClick={download} className="btn-primary w-full !py-3">⬇️ Save backup file</button>
      <button onClick={() => file.current?.click()} className="btn-ghost w-full !py-3">⬆️ Load from backup file</button>
      <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; read(f); }} />
      {msg && <p className="text-sm text-amber-200">{msg}</p>}
      {pending && (
        <form onSubmit={(e) => { e.preventDefault(); withOld(); }} className="flex gap-2">
          <input className="input flex-1" type="password" placeholder="Password used for that backup" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button type="submit" disabled={!pw || busy} className="btn-primary !px-4">{busy ? "…" : "Open"}</button>
        </form>
      )}
    </Sheet>
  );
}
