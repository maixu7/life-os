// Auto-detects what you are reading, watching or listening to, and whether it
// builds knowledge (a good deed) or is time-pass material (a bad deed).

export type MediaMode = "read" | "watch" | "listen";
export type MediaType =
  | "book" | "study" | "article" | "course" | "documentary" | "podcast" | "audiobook"
  | "manga" | "anime" | "movie" | "series" | "video" | "game" | "social" | "music";

export const MEDIA: Record<MediaType, { label: string; emoji: string; good: boolean; hint: string }> = {
  book: { label: "Book", emoji: "📚", good: true, hint: "book" },
  study: { label: "Study material", emoji: "📝", good: true, hint: "textbook" },
  article: { label: "Article / news", emoji: "📰", good: true, hint: "news" },
  course: { label: "Course / lecture", emoji: "🎓", good: true, hint: "course" },
  documentary: { label: "Documentary", emoji: "🌍", good: true, hint: "documentary" },
  podcast: { label: "Podcast", emoji: "🎙️", good: true, hint: "podcast" },
  audiobook: { label: "Audiobook", emoji: "🎧", good: true, hint: "book" },
  manga: { label: "Manga / comic", emoji: "🍥", good: false, hint: "manga" },
  anime: { label: "Anime", emoji: "📺", good: false, hint: "anime" },
  movie: { label: "Movie", emoji: "🎬", good: false, hint: "film" },
  series: { label: "TV series / drama", emoji: "📼", good: false, hint: "tv series" },
  video: { label: "Videos / reels", emoji: "📱", good: false, hint: "youtube" },
  game: { label: "Video game", emoji: "🎮", good: false, hint: "video game" },
  social: { label: "Social media", emoji: "🌀", good: false, hint: "social media" },
  music: { label: "Music", emoji: "🎵", good: false, hint: "song" },
};

export const MODE_TYPES: Record<MediaMode, MediaType[]> = {
  read: ["book", "study", "article", "manga"],
  watch: ["documentary", "course", "anime", "movie", "series", "video", "game", "social"],
  listen: ["podcast", "audiobook", "course", "music"],
};

// Words in the title that settle the type on their own.
const WORDS: [RegExp, MediaType][] = [
  [/\b(manga|manhwa|manhua|webtoon|comic|doujin|light novel)\b/i, "manga"],
  [/\b(anime|ova)\b/i, "anime"],
  [/\b(documentary|docuseries)\b/i, "documentary"],
  [/\b(course|lecture|lesson|tutorial|udemy|coursera|khan academy|class)\b/i, "course"],
  [/\b(youtube|yt|reels?|shorts|tiktok|vlog)\b/i, "video"],
  [/\b(instagram|facebook|insta|fb|twitter|x\.com|snapchat|reddit|scrolling|social)\b/i, "social"],
  [/\b(game|gaming|pubg|free ?fire|minecraft|fortnite|valorant|gta|cod|mobile legends|clash)\b/i, "game"],
  [/\b(movie|film|cinema|bollywood|hollywood)\b/i, "movie"],
  [/\b(series|season|episode|ep ?\d+|s\d+e\d+|k-?drama|drama|netflix|sitcom)\b/i, "series"],
  [/\b(podcast)\b/i, "podcast"],
  [/\b(audiobook|audible)\b/i, "audiobook"],
  [/\b(song|songs|music|playlist|album|spotify)\b/i, "music"],
  [/\b(news|article|blog|newspaper|magazine)\b/i, "article"],
  [/\b(textbook|notes|chapter|syllabus|exam|physics|chemistry|math|maths|biology|history|geography|science|economics|accounting|grammar|vocab|loksewa|neb|ielts|toefl|gre)\b/i, "study"],
  [/\b(book|novel|biography|autobiography|memoir|quran|bible|gita|ramayana|mahabharata)\b/i, "book"],
];

// Popular manga/anime titles. Reading them is manga, watching them is anime.
const OTAKU = /\b(one piece|naruto|boruto|bleach|dragon ball|attack on titan|shingeki|demon slayer|kimetsu|jujutsu|my hero academia|boku no hero|chainsaw man|solo leveling|death note|tokyo ghoul|hunter x hunter|hxh|one punch|spy x family|black clover|fairy tail|berserk|vagabond|haikyuu|blue lock|frieren|oshi no ko|vinland saga|dandadan|kaiju|sakamoto days|tokyo revengers|fullmetal|code geass|steins gate|mob psycho|re:? ?zero|sword art online|overlord|slime|mushoku|konosuke|jojo|gintama|kingdom|tower of god|omniscient reader|the beginning after the end|nano machine|eleceed|lookism|pokemon|doraemon|shinchan|detective conan|your name|spirited away|totoro|ghibli)\b/i;

export function guessMedia(title: string, mode: MediaMode): { type: MediaType; sure: boolean } {
  const t = title.trim();
  if (OTAKU.test(t)) return { type: mode === "read" ? "manga" : "anime", sure: true };
  for (const [re, type] of WORDS) {
    if (!re.test(t)) continue;
    // "manga" while watching means the anime; "anime" while reading means the manga.
    if (type === "manga" && mode === "watch") return { type: "anime", sure: true };
    if (type === "anime" && mode === "read") return { type: "manga", sure: true };
    return { type, sure: true };
  }
  return { type: mode === "read" ? "book" : mode === "listen" ? "podcast" : "video", sure: false };
}

// Turns an encyclopedia one-line description ("1949 novel by George Orwell",
// "Japanese manga series") into a media type.
export function typeFromDescription(desc: string, mode: MediaMode): MediaType | null {
  const s = desc.toLowerCase();
  if (/manga|manhwa|manhua|webtoon|light novel|comic/.test(s)) return mode === "watch" ? "anime" : "manga";
  if (/anime/.test(s)) return mode === "read" ? "manga" : "anime";
  if (/video game/.test(s)) return "game";
  if (/documentary/.test(s)) return "documentary";
  if (/\bfilm\b|movie/.test(s)) return mode === "read" ? "book" : "movie";
  if (/television|tv series|web series|drama|sitcom|reality show/.test(s)) return "series";
  if (/podcast/.test(s)) return "podcast";
  if (/youtuber|youtube|streamer|influencer/.test(s)) return "video";
  if (/novel|book|textbook|non-fiction|nonfiction|memoir|biography|essay|treatise|poem|epic|scripture|encyclopedia|dictionary|guide/.test(s)) return "book";
  if (/song|album|single by|band|singer|rapper/.test(s)) return "music";
  return null;
}

// Looks the title up on Wikipedia (free, no key). Returns null offline or when unsure.
export async function lookupMedia(title: string, mode: MediaMode): Promise<MediaType | null> {
  const q = title.trim();
  if (q.length < 2) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=description&format=json&origin=*`;
    const res = await fetch(url, { signal: ctrl.signal });
    const j = (await res.json()) as { query?: { pages?: Record<string, { index: number; description?: string }> } };
    const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    for (const p of pages) {
      const t = p.description ? typeFromDescription(p.description, mode) : null;
      if (t) return t;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Deed points: longer sessions count more.
export function mediaPoints(type: MediaType, minutes?: number) {
  const base = Math.max(2, Math.round((minutes ?? 30) / 10));
  return MEDIA[type].good ? base : -base;
}
