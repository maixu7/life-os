// End-to-end encrypted storage with cloud sync.
// username + password -> PBKDF2-SHA256 (600k rounds) -> 512 bits:
//   first half  = AES-256-GCM key (never leaves the device)
//   second half = auth token (the server stores only its SHA-256)
// Data is gzipped, encrypted, then synced; an encrypted copy is cached on the device for offline use.

const DB_NAME = "lifeos";
const ITERATIONS = 600_000;

export type Cipher = { iv: string; data: string };
type CacheEntry = { doc: Cipher; rev: number; dirty: boolean };
export type Session = { user: string; key: CryptoKey; auth: string; cacheId: string; rev: number };

// ---------- IndexedDB ----------
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of ["cache", "blobs", "meta"]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      if (db.objectStoreNames.contains("vaults")) db.deleteObjectStore("vaults");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

// ---------- crypto ----------
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (b: ArrayBuffer | Uint8Array) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

export const normUser = (u: string) => u.trim().toLowerCase();

async function derive(user: string, password: string) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(`lifeos:v1:${user}`), iterations: ITERATIONS, hash: "SHA-256" }, base, 512,
  );
  const key = await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"]);
  const auth = hex(bits.slice(32));
  const cacheId = `${user}:${hex(await crypto.subtle.digest("SHA-256", enc.encode(auth))).slice(0, 16)}`;
  return { key, auth, cacheId };
}

async function gzip(bytes: Uint8Array, mode: "compress" | "decompress") {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    mode === "compress" ? new CompressionStream("gzip") : new DecompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function seal(key: CryptoKey, bytes: Uint8Array): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes as BufferSource);
  return { iv: b64(iv), data: b64(data) };
}
async function open(key: CryptoKey, c: Cipher) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(c.iv) }, key, unb64(c.data)));
}
const sealJson = async (key: CryptoKey, v: unknown) => seal(key, await gzip(enc.encode(JSON.stringify(v)), "compress"));
const openJson = async <T,>(key: CryptoKey, c: Cipher): Promise<T> => JSON.parse(dec.decode(await gzip(await open(key, c), "decompress")));

// ---------- server ----------
class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) { super(message); }
}
async function api<T>(action: string, s: { user: string; auth: string }, extra: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, user: s.user, auth: s.auth, ...extra }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? "Something went wrong.", res.status, body);
  return body as T;
}
const isOffline = (e: unknown) => !(e instanceof ApiError) || e.status >= 500;

// ---------- account ----------
export type LoginResult<T> = { session: Session; data: T; offline: boolean } | { error: string };

export async function register<T>(userRaw: string, password: string, initial: T): Promise<LoginResult<T>> {
  const user = normUser(userRaw);
  if (!/^[a-z0-9_.@+-]{3,64}$/.test(user)) return { error: "Username: 3-64 characters, letters, numbers, @ . - _ or +." };
  const d = await derive(user, password);
  const vault = await sealJson(d.key, initial);
  try {
    const { rev } = await api<{ rev: number }>("register", { user, auth: d.auth }, { vault });
    await idb("cache", "readwrite", (s) => s.put({ doc: vault, rev, dirty: false } satisfies CacheEntry, d.cacheId));
    return { session: { user, ...d, rev }, data: initial, offline: false };
  } catch (e) {
    return { error: isOffline(e) ? "You need internet to create an account." : (e as Error).message };
  }
}

export async function login<T>(userRaw: string, password: string, merge: (server: T, local: T) => T): Promise<LoginResult<T>> {
  const user = normUser(userRaw);
  const d = await derive(user, password);
  const cached = await idb<CacheEntry | undefined>("cache", "readonly", (s) => s.get(d.cacheId)).catch(() => undefined);
  try {
    const doc = await api<Cipher & { rev: number }>("get", { user, auth: d.auth });
    let data: T = await openJson<T>(d.key, doc);
    const session: Session = { user, ...d, rev: doc.rev };
    // Changes made offline on this device get merged in and uploaded.
    if (cached?.dirty) {
      data = merge(data, await openJson<T>(d.key, cached.doc));
      await save(session, data);
    } else {
      await idb("cache", "readwrite", (s) => s.put({ doc, rev: doc.rev, dirty: false } satisfies CacheEntry, d.cacheId));
    }
    return { session, data, offline: false };
  } catch (e) {
    if (!isOffline(e)) return { error: (e as Error).message };
    if (!cached) return { error: "Can't reach the server. Check your internet and try again." };
    try {
      return { session: { user, ...d, rev: cached.rev }, data: await openJson<T>(d.key, cached.doc), offline: true };
    } catch {
      return { error: "Wrong username or password." };
    }
  }
}

// Saves locally first, then uploads. On a conflict, merges with the server copy and retries.
// Returns merged data when another device's changes were pulled in.
export async function save<T>(s: Session, data: T, merge?: (server: T, local: T) => T): Promise<T | null> {
  let doc = await sealJson(s.key, data);
  await idb("cache", "readwrite", (st) => st.put({ doc, rev: s.rev, dirty: true } satisfies CacheEntry, s.cacheId));
  let merged: T | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { rev } = await api<{ rev: number }>("put", s, { vault: doc, rev: s.rev });
      s.rev = rev;
      await idb("cache", "readwrite", (st) => st.put({ doc, rev, dirty: false } satisfies CacheEntry, s.cacheId));
      return merged;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && merge) {
        const theirs = (e.body as { conflict: Cipher & { rev: number } }).conflict;
        merged = merge(await openJson<T>(s.key, theirs), merged ?? data);
        s.rev = theirs.rev;
        doc = await sealJson(s.key, merged);
        continue;
      }
      return merged; // offline: stays dirty locally and uploads on next save or login
    }
  }
  return merged;
}

// Fetches the latest version from the server if another device saved since.
export async function pull<T>(s: Session): Promise<T | null> {
  try {
    const doc = await api<Cipher & { rev: number }>("get", s);
    if (doc.rev === s.rev) return null;
    s.rev = doc.rev;
    await idb("cache", "readwrite", (st) => st.put({ doc, rev: doc.rev, dirty: false } satisfies CacheEntry, s.cacheId));
    return await openJson<T>(s.key, doc);
  } catch {
    return null;
  }
}

export async function addDecoy<T>(s: Session, password: string, initial: T) {
  const d = await derive(s.user, password);
  await api("add-decoy", s, { decoyAuth: d.auth, vault: await sealJson(d.key, initial) });
}

// ---------- photos ----------
async function shrink(file: Blob): Promise<Blob> {
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = new OffscreenCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await c.convertToBlob({ type: "image/jpeg", quality: 0.82 });
  } catch {
    return file;
  }
}

export async function putPhoto(s: Session, id: string, file: Blob) {
  const small = await shrink(file);
  const photo = await seal(s.key, new Uint8Array(await small.arrayBuffer()));
  await idb("blobs", "readwrite", (st) => st.put({ ...photo, type: small.type }, `${s.cacheId}/${id}`));
  await api("photo-put", s, { id, photo, type: small.type }).catch(() => {});
}

export async function getPhoto(s: Session, id: string): Promise<Blob | null> {
  let rec = await idb<(Cipher & { type: string }) | undefined>("blobs", "readonly", (st) => st.get(`${s.cacheId}/${id}`));
  if (!rec) {
    rec = await api<Cipher & { type: string }>("photo-get", s, { id }).catch(() => undefined);
    if (!rec) return null;
    await idb("blobs", "readwrite", (st) => st.put(rec, `${s.cacheId}/${id}`));
  }
  return new Blob([(await open(s.key, rec)) as BlobPart], { type: rec.type });
}

export async function deletePhoto(s: Session, id: string) {
  await idb("blobs", "readwrite", (st) => st.delete(`${s.cacheId}/${id}`));
  await api("photo-del", s, { id }).catch(() => {});
}

// ---------- local brute-force protection (offline unlocks) ----------
export async function getLockout(): Promise<{ tries: number; until: number }> {
  return (await idb<{ tries: number; until: number } | undefined>("meta", "readonly", (s) => s.get("lockout")).catch(() => undefined)) ?? { tries: 0, until: 0 };
}
export async function recordAttempt(ok: boolean) {
  const lo = await getLockout();
  const tries = ok ? 0 : lo.tries + 1;
  const next = { tries, until: !ok && tries >= 5 ? Date.now() + 30_000 * 2 ** (tries - 5) : 0 };
  await idb("meta", "readwrite", (s) => s.put(next, "lockout"));
  return next;
}

export async function lastUser(): Promise<string> {
  return (await idb<string | undefined>("meta", "readonly", (s) => s.get("lastUser")).catch(() => undefined)) ?? "";
}
export async function rememberUser(u: string) {
  await idb("meta", "readwrite", (s) => s.put(u, "lastUser")).catch(() => {});
}

// ---------- backup file ----------
export async function exportBackup<T>(s: Session, data: T) {
  return JSON.stringify({ v: 2, user: s.user, vault: await sealJson(s.key, data) });
}
export async function readBackup<T>(text: string, user: string, password: string): Promise<T> {
  const j = JSON.parse(text);
  const d = await derive(normUser(j.user ?? user), password);
  return openJson<T>(d.key, j.vault);
}
