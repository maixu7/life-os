import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { Redis } from "@upstash/redis";

// The server only ever stores ciphertext plus a hash of each login's auth token.
// It never sees passwords or the encryption key.

type Store = { get<T>(k: string): Promise<T | null>; set(k: string, v: unknown): Promise<unknown>; del(k: string): Promise<unknown> };

function makeStore(): Store | null {
  // Vercel names the variables after the prefix chosen when connecting (KV_, STORAGE_, ...),
  // so accept any <PREFIX>_REST_API_URL / <PREFIX>_REST_API_TOKEN pair.
  const env = process.env;
  const urlKey = ["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", ...Object.keys(env).filter((k) => k.endsWith("_REST_API_URL"))].find((k) => env[k]);
  const url = urlKey && env[urlKey];
  const token = urlKey && (env[urlKey.replace(/_URL$/, "_TOKEN")] ?? env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN);
  // All keys get a "lifeos:" prefix so this can share a database with other apps.
  if (url && token) {
    const r = new Redis({ url, token });
    return {
      get: <T,>(k: string) => r.get<T>(`lifeos:${k}`),
      set: (k, v) => r.set(`lifeos:${k}`, v),
      del: (k) => r.del(`lifeos:${k}`),
    };
  }
  if (process.env.NODE_ENV === "production") return null;
  // Local development without a database: keep everything in memory.
  const g = globalThis as unknown as { __lifeosMem?: Map<string, unknown> };
  const mem = (g.__lifeosMem ??= new Map());
  return {
    get: async <T,>(k: string) => (mem.has(k) ? (structuredClone(mem.get(k)) as T) : null),
    set: async (k, v) => mem.set(k, structuredClone(v)),
    del: async (k) => mem.delete(k),
  };
}
export const kv = makeStore();

export type Account = { slots: { h: string; slot: number }[] };
export type Cipher = { iv: string; data: string };
export type VaultDoc = Cipher & { rev: number };

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const validUser = (u: unknown): u is string => typeof u === "string" && /^[a-z0-9_.@+-]{3,64}$/.test(u);
export const validAuth = (a: unknown): a is string => typeof a === "string" && /^[0-9a-f]{64}$/.test(a);
export const authHash = sha;

// Returns the vault slot this auth token opens. Wrong tokens count toward a lockout
// that starts after 5 misses (30s, doubling each further miss).
export async function login(user: string, auth: string): Promise<{ slot: number } | { error: string; status: number }> {
  if (!kv) return { error: "Cloud sync isn't set up yet.", status: 503 };
  const failKey = `fail:${user}`;
  const fail = (await kv.get<{ tries: number; until: number }>(failKey)) ?? { tries: 0, until: 0 };
  if (fail.until > Date.now()) return { error: `Locked. Try again in ${Math.ceil((fail.until - Date.now()) / 1000)}s.`, status: 429 };
  const acct = await kv.get<Account>(`acct:${user}`);
  const h = sha(auth);
  const match = acct?.slots.find((s) => eq(s.h, h));
  if (match) {
    if (fail.tries) await kv.del(failKey);
    return { slot: match.slot };
  }
  const tries = fail.tries + 1;
  await kv.set(failKey, { tries, until: tries >= 5 ? Date.now() + 30_000 * 2 ** (tries - 5) : 0 });
  return { error: tries >= 5 ? "Too many wrong tries." : "Wrong username or password.", status: 401 };
}
