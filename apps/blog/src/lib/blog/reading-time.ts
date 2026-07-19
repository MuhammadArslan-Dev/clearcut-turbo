// Estimated reading time (minutes) from server-rendered content HTML.
// Strips tags, counts words, assumes ~200 wpm; always at least 1 minute.
export function readingTime(html: string | undefined): number {
  if (!html) return 1;
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
