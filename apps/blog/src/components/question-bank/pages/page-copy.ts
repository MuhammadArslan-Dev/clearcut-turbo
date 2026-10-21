import { getTranslations } from "next-intl/server";
import type { Question } from "@/components/blog/assessment-question/questions-list";
import { getLocalizedEntityName } from "@/utils/question-translation";

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
