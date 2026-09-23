export function formatToSlug(str: string): string {
  return str
    .trim()                          // remove spaces from both ends
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")      // remove special chars except numbers
    .replace(/\s+/g, "-");           // replace spaces with underscore
}

// `ai_slug` comes back from the backend as AI-generated, already-hyphenated
// text (e.g. "lambe-samay-tak-pad-vyakaran-ki-drishti-se-hai") — unlike
// formatToSlug's input, it must keep existing hyphens, so it can't reuse
// formatToSlug's regex (which strips them). Some rows have a stray HTML
// fragment leaked into this field (e.g. a trailing "</blockquote>"), which
// breaks both the question URL and the XML sitemap <loc> entry it feeds —
// strip tags and any other non slug-safe character defensively.
export function sanitizeAiSlug(aiSlug: string): string {
  return aiSlug
    .replace(/<[^>]*>/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
export function unFormatSlug(slug: string): string {
  return slug
    .replace(/_/g, " ")             // underscores → spaces
    .replace(/-/g, " ")             // underscores → spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
}

// `stage_id_b` is a compact backend code, e.g. "CTET_P2" or "HTET_L1" — not
// something to show a user as-is. "P"/"L" are the only stage-type prefixes
// currently in use (Paper/Level), matching the e_stages names ("Level 1
// (PRT)", ...) for the exams this app allows.
export function formatStageLabel(stageIdB?: string | null): string {
  if (!stageIdB) return "";
  const match = stageIdB.match(/_([A-Za-z]+)(\d+)$/);
  if (!match) return unFormatSlug(stageIdB);
  const [, typeCode, num] = match;
  const typeWord =
    typeCode.toUpperCase() === "P"
      ? "Paper"
      : typeCode.toUpperCase() === "L"
        ? "Level"
        : typeCode;
  return `${typeWord} ${num}`;
}