import type { CustomItem, Log } from "@/lib/store";

// Safety nets around the encrypted vault (which is left untouched): when this
// device last reached the server, undo after a delete, weekly on-device
// backups, the password hint, and display/reading preferences.
// Everything here is per device (localStorage / its own IndexedDB).

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
const emit = (name: string, detail?: unknown) => typeof window !== "undefined" && window.dispatchEvent(new CustomEvent(name, { detail }));

// ---------- Sync status ----------
export const SYNC_EVENT = "lifeos-sync";
export const lastSynced = (user: string) => get(`lifeos-synced:${user}`);
export function markSynced(user: string) {
  set(`lifeos-synced:${user}`, new Date().toISOString());
  emit(SYNC_EVENT);
}
// The vault keeps a "dirty" flag on its encrypted cache until the server has
// the latest copy. Read-only peek, so nothing about syncing changes.
export function pendingUpload(cacheId: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("lifeos");
      req.onerror = () => resolve(false);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("cache")) { db.close(); return resolve(false); }
        const r = db.transaction("cache", "readonly").objectStore("cache").get(cacheId);
        r.onsuccess = () => { resolve(!!(r.result as { dirty?: boolean } | undefined)?.dirty); db.close(); };
        r.onerror = () => { resolve(false); db.close(); };
      };
    } catch { resolve(false); }
  });
}
export const ago = (iso: string | null, now = Date.now()) => {
  if (!iso) return "never";
  const m = Math.round((now - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

// ---------- Undo after delete ----------
export const UNDO_EVENT = "lifeos-deleted";
export type Deleted = { logs: Log[]; items: CustomItem[]; at: number };
export const noteDeleted = (logs: Log[], items: CustomItem[] = []) => (logs.length || items.length) && emit(UNDO_EVENT, { logs, items, at: Date.now() } satisfies Deleted);

// ---------- Weekly backups kept on this device ----------
// Encrypted copies (same format as the backup file), newest 4 kept per user.
export type Snap = { key: string; user: string; at: string; text: string; records: number };
function snapDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("lifeos-snaps", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("snaps");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function snapTx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await snapDb();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction("snaps", mode).objectStore("snaps"));
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}
export async function listSnaps(user: string): Promise<Snap[]> {
  const all = await snapTx<Snap[]>("readonly", (s) => s.getAll()).catch(() => [] as Snap[]);
  return all.filter((x) => x.user === user).sort((a, b) => b.at.localeCompare(a.at));
}
export async function addSnap(user: string, text: string, records: number) {
  const at = new Date().toISOString();
  await snapTx("readwrite", (s) => s.put({ key: `${user}:${at}`, user, at, text, records } satisfies Snap, `${user}:${at}`));
  for (const old of (await listSnaps(user)).slice(4)) await snapTx("readwrite", (s) => s.delete(old.key));
}
export const WEEK = 7 * 86_400_000;
export const lastFileBackup = (user: string) => get(`lifeos-backup-file:${user}`);
export const markFileBackup = (user: string) => set(`lifeos-backup-file:${user}`, new Date().toISOString());

export function downloadText(text: string, name: string, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Password hint ----------
// Only a hint the hero writes, never the password. Kept on the device so it
// can be shown on the sign-in screen before anything is unlocked.
const hintKey = (user: string) => `lifeos-hint:${user.trim().toLowerCase()}`;
export const passwordHint = (user: string) => get(hintKey(user)) ?? "";
export const savePasswordHint = (user: string, hint: string) => set(hintKey(user), hint.trim() || null);
export const lastDrill = (user: string) => get(`lifeos-drill:${user}`);
export const markDrill = (user: string) => set(`lifeos-drill:${user}`, new Date().toISOString());

// ---------- Display and reading ----------
export type Display = { light: boolean; font: number; big: boolean; speak: boolean; voiceRate: number };
const DISPLAY = "lifeos-display";
export function displayPrefs(): Display {
  const d = { light: false, font: 100, big: false, speak: false, voiceRate: 1 };
  try { return { ...d, ...JSON.parse(get(DISPLAY) ?? "{}") }; } catch { return d; }
}
export function applyDisplay(p = displayPrefs()) {
  const h = document.documentElement;
  h.classList.toggle("light", p.light);
  h.classList.toggle("big", p.big);
  h.style.fontSize = p.font === 100 ? "" : `${p.font}%`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.light ? "#f6f3ff" : "#070512");
}
export function saveDisplay(patch: Partial<Display>) {
  const p = { ...displayPrefs(), ...patch };
  set(DISPLAY, JSON.stringify(p));
  applyDisplay(p);
  return p;
}

// Read-aloud with the phone's own voice (works offline on iPhone and Android).
export function speak(text: string, force = false) {
  const p = displayPrefs();
  if ((!force && !p.speak) || typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim());
  u.rate = p.voiceRate;
  u.lang = "en-US";
  speechSynthesis.speak(u);
}
export const canSpeak = () => typeof speechSynthesis !== "undefined";
