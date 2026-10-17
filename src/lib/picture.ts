// Finds a real picture for anything you add (an apple, a manga, a book) from
// Wikipedia's free images. Results are cached on the device so each name is
// looked up once.

const KEY = "lifeos-pic:";
const mem = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

type Page = { index?: number; missing?: string; description?: string; thumbnail?: { source: string } };

const API = "https://en.wikipedia.org/w/api.php?format=json&origin=*&prop=pageimages|description&piprop=thumbnail&pithumbsize=240&redirects=1";
const bad = (p: Page) => !p.thumbnail || p.missing !== undefined || /disambiguation|same term|surname|given name/i.test(p.description ?? "");

async function get(url: string): Promise<Page[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const j = (await (await fetch(url, { signal: ctrl.signal })).json()) as { query?: { pages?: Record<string, Page> } };
    return Object.values(j.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  } finally {
    clearTimeout(t);
  }
}

const exact = async (title: string) => (await get(`${API}&titles=${encodeURIComponent(title)}`)).find((p) => !bad(p))?.thumbnail?.source;
const search = async (q: string) => (await get(`${API}&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(q)}`)).find((p) => !bad(p))?.thumbnail?.source;

async function find(name: string, hint: string): Promise<string> {
  const title = name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const lower = name.trim();
  // Titles of books, manga and shows: search with the type so "One Piece" finds the manga.
  if (hint) return (await search(`${lower} ${hint}`)) ?? (await exact(title)) ?? "";
  // Everyday things: the plain article ("Apple") is the fruit; fall back to food, then any match.
  return (await exact(title)) ?? (await exact(`${title} (food)`)) ?? (await search(`${lower} food`)) ?? (await search(lower)) ?? "";
}

export function cachedPicture(name: string, hint = ""): string | undefined {
  const k = `${hint}:${name.trim().toLowerCase()}`;
  if (mem.has(k)) return mem.get(k);
  try {
    const v = localStorage.getItem(KEY + k);
    if (v !== null) { mem.set(k, v); return v; }
  } catch {}
  return undefined;
}

export function findPicture(name: string, hint = ""): Promise<string> {
  const k = `${hint}:${name.trim().toLowerCase()}`;
  const hit = cachedPicture(name, hint);
  if (hit !== undefined) return Promise.resolve(hit);
  if (!pending.has(k)) {
    pending.set(k, find(name, hint).then(
      (url) => {
        mem.set(k, url);
        try { localStorage.setItem(KEY + k, url); } catch {}
        return url;
      },
      // Offline or blocked: try again next time instead of caching "no picture".
      () => "",
    ).finally(() => pending.delete(k)));
  }
  return pending.get(k)!;
}
