/**
 * Consolidated during Phase 4 from byte-identical copies in apps/landing
 * and apps/blog.
 */

/**
 * Limit text by number of characters.
 * Adds "…" if the text exceeds the limit.
 */
export function limitChars(text: string, limit: number): string {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit).trim() + "…" : text;
}

/**
 * Limit text by number of words.
 * Adds "…" if the text exceeds the limit.
 */
export function limitWords(text: string, wordLimit: number): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "…" : text;
}
