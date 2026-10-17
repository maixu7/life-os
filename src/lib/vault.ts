// Encrypted on-device storage. Nothing leaves the device.
// Each vault is a password-protected blob: PBKDF2-SHA256 (600k rounds) -> AES-256-GCM.
// A decoy password is just a second vault; on unlock we try each one.

const DB_NAME = "lifeos";
const ITERATIONS = 600_000;

type VaultRecord = { id: string; salt: ArrayBuffer; iv: ArrayBuffer; data: ArrayBuffer; updated: number };
type BlobRecord = { id: string; iv: ArrayBuffer; data: ArrayBuffer; type: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("vaults", { keyPath: "id" });
      req.result.createObjectStore("blobs", { keyPath: "id" });
      req.result.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

async function deriveKey(password: string, salt: ArrayBuffer) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type Session = { vaultId: string; key: CryptoKey; salt: ArrayBuffer };

export async function hasVault() {
  return (await tx<number>("vaults", "readonly", (s) => s.count())) > 0;
}

export async function createVault<T>(password: string, initial: T): Promise<Session> {
  const salt = rand(16).buffer;
  const session = { vaultId: crypto.randomUUID(), key: await deriveKey(password, salt), salt };
  await saveVault(session, initial);
  return session;
}

export async function saveVault<T>(s: Session, value: T) {
  const iv = rand(12).buffer;
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, s.key, enc.encode(JSON.stringify(value)));
  const rec: VaultRecord = { id: s.vaultId, salt: s.salt, iv, data, updated: Date.now() };
  await tx("vaults", "readwrite", (st) => st.put(rec));
}

// Returns the session and data of whichever vault this password opens, or null.
export async function unlock<T>(password: string): Promise<{ session: Session; data: T } | null> {
  const all = await tx<VaultRecord[]>("vaults", "readonly", (s) => s.getAll());
  for (const v of all) {
    const key = await deriveKey(password, v.salt);
    try {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: v.iv }, key, v.data);
      return { session: { vaultId: v.id, key, salt: v.salt }, data: JSON.parse(dec.decode(plain)) };
    } catch {
      // Wrong password for this vault; try the next.
    }
  }
  return null;
}

export async function putPhoto(s: Session, id: string, file: Blob) {
  const iv = rand(12).buffer;
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, s.key, await file.arrayBuffer());
  const rec: BlobRecord = { id: `${s.vaultId}/${id}`, iv, data, type: file.type };
  await tx("blobs", "readwrite", (st) => st.put(rec));
}

export async function getPhoto(s: Session, id: string): Promise<Blob | null> {
  const rec = await tx<BlobRecord | undefined>("blobs", "readonly", (st) => st.get(`${s.vaultId}/${id}`));
  if (!rec) return null;
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: rec.iv }, s.key, rec.data);
  return new Blob([plain], { type: rec.type });
}

export async function deletePhoto(s: Session, id: string) {
  await tx("blobs", "readwrite", (st) => st.delete(`${s.vaultId}/${id}`));
}

// Brute-force protection: after 5 wrong passwords, wait 30s, doubling each further miss.
export async function getLockout(): Promise<{ tries: number; until: number }> {
  return (await tx<{ tries: number; until: number } | undefined>("meta", "readonly", (s) => s.get("lockout"))) ?? { tries: 0, until: 0 };
}
export async function recordAttempt(ok: boolean) {
  const lo = await getLockout();
  const tries = ok ? 0 : lo.tries + 1;
  const until = !ok && tries >= 5 ? Date.now() + 30_000 * 2 ** (tries - 5) : 0;
  const next = { tries, until };
  await tx("meta", "readwrite", (s) => s.put(next, "lockout"));
  return next;
}

// Encrypted backup file: the vault record itself, still locked by the password.
export async function exportBackup(s: Session) {
  const rec = await tx<VaultRecord>("vaults", "readonly", (st) => st.get(s.vaultId));
  const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
  return JSON.stringify({ v: 1, salt: b64(rec.salt), iv: b64(rec.iv), data: b64(rec.data) });
}

export async function importBackup(text: string, password: string) {
  const j = JSON.parse(text);
  const ub = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
  const salt = ub(j.salt);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub(j.iv) }, key, ub(j.data));
  return { session: { vaultId: crypto.randomUUID(), key, salt } as Session, data: JSON.parse(dec.decode(plain)) };
}
