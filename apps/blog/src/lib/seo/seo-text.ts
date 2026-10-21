// Search-result limits for every page title and meta description. Google
// shows about 60 characters of a title and 155-160 of a description and cuts
// the rest, usually right where the keyword was. The root layout appends
// SITE_SUFFIX through its "%s | Clear Cutoff" template.

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
export const SITE_SUFFIX = " | Clear Cutoff";

/** Cut `text` to at most `max` characters at a word boundary, with "…" when
 * anything was cut. */
export function cutAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const space = room.lastIndexOf(" ");
  const head = (space > max / 2 ? room.slice(0, space) : room).replace(/[\s,;:–—-]+$/, "");
  return `${head}…`;
}

/** A page title: plain (the layout adds SITE_SUFFIX) or absolute (no suffix). */
export type SeoTitle = string | { absolute: string };

/**
 * The page title from candidates ordered most descriptive first: the first
 * candidate that fits TITLE_MAX wins (keywords matter more than the brand),
 * with the layout's " | Clear Cutoff" when there is room for it, else
 * absolute. If none fits, the last (shortest) is cut at a word. `tail`
 * (e.g. " – Page 3") is kept whole on every variant.
 */
export function seoTitle(candidates: string[], tail = ""): SeoTitle {
  const list = candidates.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
  const fit = list.find((c) => c.length + tail.length <= TITLE_MAX);
  if (fit === undefined) return { absolute: cutAtWord(list[list.length - 1] ?? "", TITLE_MAX - tail.length) + tail };
  const title = fit + tail;
  return title.length + SITE_SUFFIX.length <= TITLE_MAX ? title : { absolute: title };
}

/** The title text without the template (Open Graph / Twitter titles). */
export function titleText(title: SeoTitle): string {
  return typeof title === "string" ? title : title.absolute;
}

/** A meta description of at most DESCRIPTION_MAX characters. */
export function seoDescription(text: string): string {
  return cutAtWord(text, DESCRIPTION_MAX);
}

// Short subject names people search with ("ctet cdp questions", "ctet evs").
const SUBJECT_SHORT: Record<string, string> = {
  "child-development-pedagogy": "CDP",
  "child-development-and-pedagogy": "CDP",
  "environmental-studies": "EVS",
  mathematics: "Maths",
  "social-studies": "SST",
  "social-science": "SST",
  "general-studies": "GS",
  "language-2-english": "English",
  "language-1-hindi": "Hindi",
};

/** "child-development-pedagogy" -> "CDP"; null when there is no common short name. */
export function subjectShort(subjectSlug: string): string | null {
  return SUBJECT_SHORT[subjectSlug.toLowerCase()] ?? null;
}

/** "level-2-tgt" -> "TGT", "paper-1" -> "Paper 1": the part people search with. */
export function levelShort(levelSlug: string): string {
  const role = /(?:^|-)(prt|tgt|pgt)$/i.exec(levelSlug)?.[1];
  if (role) return role.toUpperCase();
  return levelSlug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
