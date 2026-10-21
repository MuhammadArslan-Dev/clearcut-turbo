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
 * The parts of a year page's title/description (/<exam>/<level>/year/
 * <exam>-<yyyy>), filled into QuestionBankPage.yearTitle / yearDescription:
 * "CTET 2024 Paper 1 Previous Year Questions" instead of the raw slug
 * ("CTET Exam Paper 1 ctet-2024 - Questions & Answers"). Bare — the root
 * layout's "%s | Clear Cutoff" template adds the site name.
 */
export function yearPageLabels(examSlug: string, levelSlug: string, yearSlug: string): { exam: string; year: string; level: string } {
  return {
    exam: examSlug.toUpperCase(),
    year: yearFromSlug(yearSlug) ?? unFormatSlug(yearSlug),
    level: levelLabel(levelSlug),
  };
}
