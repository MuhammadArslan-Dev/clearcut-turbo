import { getTranslations } from "next-intl/server";
import type { Question } from "@/components/blog/assessment-question/questions-list";
import { getLocalizedEntityName } from "@/utils/question-translation";
import { levelShort, seoDescription, seoTitle, subjectShort, type SeoTitle } from "@/lib/seo/seo-text";
import { levelLabel } from "@/lib/seo/year-title";

// Locale-dependent copy shared by the chapter, subject and year pages
// (messages: QuestionBankPage). English strings are the ones these pages
// always had; /hi gets Hindi titles, headings and descriptions.

export type PageCopy = Awaited<ReturnType<typeof pageCopy>>;

export async function pageCopy(locale: string) {
  return getTranslations({ locale, namespace: "QuestionBankPage" });
}

/** Title/description suffixes for page N >= 2 (page 1 has none). */
export function pageSuffixes(t: PageCopy, page: number): { title: string; description: string } {
  if (page <= 1) return { title: "", description: "" };
  return { title: t("pageTitleSuffix", { page }), description: t("pageDescriptionSuffix", { page }) };
}

export type SeoLabels = {
  exam: string;
  levelSlug: string;
  subjectSlug?: string;
  /** Display names in the page's language. */
  subject?: string;
  chapter?: string;
  year?: string;
};

// Title variants per page type, most descriptive first; seoTitle picks the
// first that fits TITLE_MAX (lib/seo/seo-text.ts). The page number is kept
// whole on every variant, so page N never shares page 1's title.
const TITLE_KEYS = {
  chapter: ["chapterTitle", "chapterTitleMedium", "chapterTitleShort", "chapterTitleMin"],
  subject: ["subjectTitle", "subjectTitleMedium", "subjectTitleShort", "subjectTitleMin"],
  year: ["yearTitle", "yearTitleShort", "yearTitleMin"],
} as const;

/** A question-bank page's title and description, within the search-result
 * limits (keywords researched 2026-10-21: "question paper", "PYQ", "MCQ",
 * "with answers", CDP/EVS, PRT/TGT/PGT). */
export function questionBankSeo(
  t: PageCopy,
  kind: keyof typeof TITLE_KEYS,
  labels: SeoLabels,
  page: number,
): { title: SeoTitle; description: string } {
  const suffix = pageSuffixes(t, page);
  const short = labels.subjectSlug ? subjectShort(labels.subjectSlug) : null;
  const values = {
    exam: labels.exam,
    level: levelLabel(labels.levelSlug),
    levelShort: levelShort(labels.levelSlug),
    subject: labels.subject ?? "",
    subjectShort: short ?? labels.subject ?? "",
    subjectAbbr: short && short !== labels.subject ? ` (${short})` : "",
    chapter: labels.chapter ?? "",
    year: labels.year ?? "",
    pageDescription: suffix.description,
  };
  return {
    title: seoTitle(
      TITLE_KEYS[kind].map((key) => t(key, values)),
      suffix.title,
    ),
    description: seoDescription(t(`${kind}Description`, values)),
  };
}

/** Absolute site origin, plus "/hi" on the Hindi site — for links and
 * breadcrumbs a visitor follows (canonicals use localeAlternates instead). */
export function localeOrigin(locale: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  return locale === "hi" ? `${origin}/hi` : origin;
}

/** A chapter's display name: its Hindi translation on /hi (from the loaded
 * questions' chapter), else `fallback` (the slug-based English label). */
export function chapterName(raw: Question[], locale: string, fallback: string): string {
  if (locale !== "hi") return fallback;
  const chapter = raw.find((q) => q.chapter)?.chapter;
  return (chapter && getLocalizedEntityName(chapter, chapter.translations, "hi")) || fallback;
}
