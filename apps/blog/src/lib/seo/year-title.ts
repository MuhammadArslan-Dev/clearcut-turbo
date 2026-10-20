import { unFormatSlug } from "@/utils/slugify";

const LEVEL_ACRONYMS = new Set(["prt", "tgt", "pgt"]);

/** "paper-1" -> "Paper 1", "level-1-prt" -> "Level 1 PRT". */
export function levelLabel(levelSlug: string): string {
  return levelSlug
    .split("-")
    .filter(Boolean)
    .map((w) => (LEVEL_ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : unFormatSlug(w)))
    .join(" ");
}

/** "ctet-2024" -> "2024"; null when the slug carries no 4-digit year. */
export function yearFromSlug(yearSlug: string): string | null {
  return /(?:^|-)(\d{4})(?:-|$)/.exec(yearSlug)?.[1] ?? null;
}

/**
 * Title/description for a year page (/<exam>/<level>/year/<exam>-<yyyy>):
 * "CTET 2024 Paper 1 Previous Year Questions" instead of the raw slug
 * ("CTET Exam Paper 1 ctet-2024 - Questions & Answers"). Bare — the root
 * layout's "%s | Clear Cutoff" template adds the site name.
 */
export function yearPageSeo(examSlug: string, levelSlug: string, yearSlug: string): { title: string; description: string } {
  const exam = examSlug.toUpperCase();
  const level = levelLabel(levelSlug);
  const year = yearFromSlug(yearSlug) ?? unFormatSlug(yearSlug);
  return {
    title: `${exam} ${year} ${level} Previous Year Questions`,
    description: `${exam} ${year} ${level} previous year questions with answers, free on Clear Cutoff.`,
  };
}
