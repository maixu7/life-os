import type { Action, Task } from "@/lib/coach";
import { itemKind } from "@/lib/have";
import { goalsOn, sched } from "@/lib/schedule";
import { toDay, type CustomItem, type Data, type Log } from "@/lib/store";

// My collection: the books, coding apps, courses and screenshots of
// educational videos you own or use (items category "learnkit"). Each one
// has a photo, a title, a category, what it's about and (videos) how long.
// Sensei turns the collection into small daily tasks: read, code, watch,
// listen, learn or write, a different pick each day.

export type KitCat = "book" | "code" | "video" | "course" | "podcast" | "article" | "lang" | "other";
export const KIT_CATS: Record<KitCat, { icon: string; label: string }> = {
  book: { icon: "📚", label: "Book" },
  code: { icon: "💻", label: "Coding app" },
  video: { icon: "📺", label: "Video" },
  course: { icon: "🎓", label: "Course" },
  podcast: { icon: "🎧", label: "Podcast" },
  article: { icon: "📰", label: "Article" },
  lang: { icon: "🗣️", label: "Language app" },
  other: { icon: "⭐", label: "Other" },
};

export type Kit = { id: string; title: string; cat: KitCat; about: string; minutes?: number; photo?: string; isbn?: string; added?: string; fromHave?: boolean };

export const kitOfItem = (i: CustomItem): Kit => ({
  id: i.id, title: i.name,
  cat: (String(i.config.cat) in KIT_CATS ? i.config.cat : "other") as KitCat,
  about: typeof i.config.about === "string" ? i.config.about : "",
  minutes: Number(i.config.minutes) || undefined,
  photo: typeof i.config.photo === "string" && i.config.photo ? i.config.photo : undefined,
  isbn: typeof i.config.isbn === "string" && i.config.isbn ? i.config.isbn : undefined,
  added: typeof i.config.added === "string" ? i.config.added : undefined,
});

/** Your collection plus the books in What I have (those are read-only here). */
export function myKit(d: Data): Kit[] {
  const own = d.items.filter((i) => i.category === "learnkit").sort((a, b) => a.sort - b.sort).map(kitOfItem);
  const names = new Set(own.map((k) => k.title.toLowerCase()));
  const books = d.pantry.filter((p) => p.qty > 0 && itemKind(p) === "book" && !names.has(p.name.toLowerCase()))
    .map((p): Kit => ({ id: `have:${p.id}`, title: p.name, cat: "book", about: p.note ?? "", photo: p.photo, fromHave: true }));
  return [...own, ...books];
}

// ---------- Reading a photo (no AI) ----------

// Words that give the category away, surest first.
const CAT_WORDS: [KitCat, RegExp][] = [
  ["podcast", /podcast|episode|spotify|apple podcasts|ポッドキャスト/i],
  ["lang", /duolingo|busuu|babbel|memrise|anki|hellotalk|language|語学|英会話|単語|vocabulary|jlpt|toeic|ielts/i],
  ["code", /progate|mimo|sololearn|leetcode|hackerrank|codecademy|freecodecamp|swift playgrounds|grasshopper|python|javascript|typescript|html|css|java\b|c\+\+|kotlin|rust|github|vs ?code|プログラミング/i],
  ["video", /youtube|subscribe|views|watch|チャンネル登録|再生|▶|\b\d{1,2}:\d{2}(?::\d{2})?\b/i],
  ["course", /course|lecture|lesson|module|coursera|udemy|edx|khan academy|講座|授業/i],
  ["article", /article|blog|medium|min read|newsletter|記事/i],
  ["book", /isbn|chapter|edition|publisher|paperback|hardcover|第.版|出版|著|文庫|新書|教科書|textbook|workbook|novel/i],
];

/** The ISBN, from the barcode (978/979…) or printed "ISBN 978-4-…". */
export function isbnIn(text: string, barcode?: string): string | undefined {
  if (barcode && /^97[89]\d{10}$/.test(barcode)) return barcode;
  const m = text.match(/ISBN[\s:：-]*((?:97[89][\s-]?)?(?:\d[\s-]?){9}[\dX])/i);
  return m ? m[1].replace(/[\s-]/g, "") : undefined;
}

/** A video's length from the screenshot: "12:34 / 45:10" → 45, "1:02:30" → 63, "45 min" → 45. */
export function minutesIn(text: string): number | undefined {
  let best = 0;
  for (const m of text.matchAll(/\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/g)) {
    const mins = Number(m[1] ?? 0) * 60 + Number(m[2]) + Number(m[3]) / 60;
    if (Number(m[3]) < 60 && mins > best) best = mins;
  }
  const h = text.match(/(\d+)\s*(?:h|hr|hours?|時間)\s*(\d+)?\s*(?:m|min|分)?/i);
  if (h) best = Math.max(best, Number(h[1]) * 60 + Number(h[2] ?? 0));
  const mm = text.match(/(\d{1,3})\s*(?:min(?:ute)?s?|分)/i);
  if (mm) best = Math.max(best, Number(mm[1]));
  return best >= 1 ? Math.round(best) : undefined;
}

/** Category, about, length and ISBN read from a photo's writing (1–4 filled where it can). */
export function guessKit(text: string, title: string, barcode?: string): { cat: KitCat; about: string; minutes?: number; isbn?: string } {
  const isbn = isbnIn(text, barcode);
  const all = `${title}\n${text}`;
  const cat = isbn ? "book" : CAT_WORDS.find(([, re]) => re.test(all))?.[0] ?? "other";
  // About: the longest real sentence-like line that isn't the title.
  const lines = text.split(/\n/).map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 12 && /[\p{L}]{3}/u.test(l) && l.toLowerCase() !== title.toLowerCase() && !/isbn|\d{6,}|views|subscribers|登録者|回視聴/i.test(l));
  const about = lines.sort((a, b) => b.length - a.length)[0]?.slice(0, 140) ?? "";
  return { cat, about, minutes: cat === "video" ? minutesIn(text) : undefined, isbn };
}

// ---------- Tasks from the collection ----------

const dayNo = (now: Date) => Math.floor(new Date(`${toDay(now)}T12:00:00`).getTime() / 86_400_000);
const n = (l: Log, k: string) => Number(l.data[k]) || 0;
// Did today's logs mention this title (media title, video, app, project, activity name)?
const mentions = (logs: Log[], title: string) => {
  const t = title.toLowerCase().trim();
  if (t.length < 2) return false;
  return logs.some((l) => ["title", "name", "video", "platform", "project", "topic"].some((k) => {
    const v = String(l.data[k] ?? "").toLowerCase().trim();
    return v.length >= 2 && (v.includes(t) || t.includes(v));
  }));
};

type Made = { icon: string; title: string; why: string; action: Action; done: boolean };

function taskFor(k: Kit, logs: Log[], g: ReturnType<typeof goalsOn>): Made | null {
  const media = logs.filter((l) => l.kind === "media");
  const read = media.filter((l) => l.data.mode !== "watch").reduce((s, l) => s + (n(l, "pages") || 1), 0);
  const code = logs.filter((l) => l.kind === "coding" || (l.kind === "activity" && /cod(e|ing)|program/i.test(String(l.data.name)))).reduce((s, l) => s + (n(l, "minutes") || 30), 0);
  const seen = mentions(logs, k.title);
  const about = k.about ? ` It's about ${k.about.replace(/\.$/, "")}.` : "";
  const library: Action = { type: "library" };
  switch (k.cat) {
    case "book": {
      if (!g.readGoal) return null; // no reading on the schedule today
      const pages = Math.min(g.readGoal, g.off ? 20 : 10);
      return { icon: "📚", title: `Read ${pages} pages of ${k.title}`, action: library, done: seen || read >= g.readGoal,
        why: `Ten pages a day finishes a book in weeks.${about} Log the pages in the Library.` };
    }
    case "code": {
      if (!g.codeGoal) return null; // no coding on the schedule today
      const mins = Math.max(15, Math.min(g.codeGoal, 45));
      return { icon: "💻", title: `Code ${mins} min in ${k.title}`, action: { type: "activity", name: "Coding" }, done: seen || code >= g.codeGoal,
        why: `Skills compound when you code a little every day.${about}` };
    }
    case "video": return { icon: "📺", title: `Watch ${k.title}${k.minutes ? ` (${k.minutes} min)` : ""} and write 3 notes`, action: library, done: seen,
      why: `Writing 3 notes turns watching into learning: you remember what you wrote.${about}` };
    case "course": return { icon: "🎓", title: `Do one lesson of ${k.title} and write 3 notes`, action: library, done: seen,
      why: `One lesson a day gets the course finished.${about}` };
    case "podcast": return { icon: "🎧", title: `Listen to ${k.title}`, action: library, done: seen,
      why: `Good for a walk, the commute or chores: learning without a screen.${about}` };
    case "article": return { icon: "📰", title: `Read ${k.title} and write a 3-line summary`, action: library, done: seen,
      why: `Summing it up in your own words is how it sticks.${about}` };
    case "lang": return { icon: "🗣️", title: `Do one lesson in ${k.title} (15 min)`, action: { type: "href", href: "/focus" }, done: seen,
      why: `A little every day beats a lot once a week for languages.${about}` };
    default: return { icon: "⭐", title: `Learn from ${k.title} for 20 min, then write what you learned`, action: { type: "href", href: "/focus" }, done: seen,
      why: `Writing what you learned shows what you really understood.${about}` };
  }
}

/** Today's picks from the collection (at most 2), a different start each day. Done ones drop off. */
export function kitTasks(d: Data, now = new Date(), max = 2): Task[] {
  const kit = myKit(d);
  if (!kit.length) return [];
  const day = toDay(now);
  const logs = d.logs.filter((l) => l.day === day);
  const g = goalsOn(sched(d.profile.settings.schedule), now);
  const start = dayNo(now) % kit.length;
  const out: Task[] = [];
  for (let i = 0; i < kit.length && out.length < max; i++) {
    const k = kit[(start + i) % kit.length];
    const t = taskFor(k, logs, g);
    if (!t) continue;
    // A pick that's already done today keeps its place, so the next one doesn't slide in.
    if (t.done) { max--; continue; }
    out.push({ id: `kit:${k.id}`, icon: t.icon, title: t.title, action: t.action, priority: 47 - out.length,
      because: `From My collection (${KIT_CATS[k.cat].label}${k.fromHave ? ", in What I have" : ""}). Today's pick; it changes every day.`, why: t.why });
  }
  return out;
}
