// Sitemap entries for the paginated question-bank pages (chapter, subject,
// year), built from the backend's /blog/question-index: every question each
// page renders, in page order, with its newest translation `updated_at`.
// Each page's <lastmod> is the newest content timestamp of the questions on
// that page — a real content change, never the build time; omitted when no
// question on the page has a timestamp.

import { QUESTIONS_PER_PAGE, pagePath } from "@/lib/question-bank/pagination";
import { isHindiPageByFlags } from "@/lib/question-bank/hindi-page";
import { canonicalChapterPaths, canonicalSubjectPaths, type ExamIndex } from "@/lib/seo/exam-index";
import { formatToSlug } from "@/utils/slugify";
import type { SitemapEntry } from "./xml";

/** "CTET_2024" -> "ctet-2024", the slug the year listing links to. */
export function yearSlug(instanceId: string): string {
  return formatToSlug(instanceId.replace("_", " "));
}

/** [question id, newest translation updated_at (Unix seconds) | null,
 *  1 when it has both an English and a Hindi translation]. The flag is
 *  missing from an older backend — treated as 0 (no /hi URLs listed). */
export type IndexEntry = [number, number | null, (0 | 1)?];
export type QuestionIndex = {
  /** chapter slug -> the chapter page's questions */
  chapters: Record<string, IndexEntry[]>;
  /** "<EXAM_YEAR>|<STAGE>" (e.g. "CTET_2024|CTET_P1") -> the year page's questions */
  years: Record<string, IndexEntry[]>;
};

/** The year endpoint (`get-questions`) returns at most 500 questions, so a
 * year page never shows more — list only the pages actually served. */
export const YEAR_PAGE_LIMIT = 500;

/** Mirrors the backend's year filter: "CTET_2024" + "paper-1" -> "CTET_P1",
 * "HTET_2017" + "level-3-pgt" -> "HTET_L3"; null when it can't map (the
 * backend then applies no stage filter). */
export function stageIdFor(examYear: string, levelSlug: string): string | null {
  const exam = /^(.+)_\d{4}$/.exec(examYear)?.[1];
  const level = /^(paper|level)-(\d+)/.exec(levelSlug);
  if (!exam || !level) return null;
  return `${exam}_${level[1] === "paper" ? "P" : "L"}${level[2]}`;
}

/** One entry per page of `entries` under `basePath`, followed by its /hi
 * twin when that page is a genuinely Hindi page (same rule the page's own
 * canonical/hreflang use — lib/question-bank/hindi-page.ts). */
export function pagedEntries(origin: string, basePath: string, entries: IndexEntry[]): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (let start = 0; start < entries.length; start += QUESTIONS_PER_PAGE) {
    const slice = entries.slice(start, start + QUESTIONS_PER_PAGE);
    let newest: number | null = null;
    for (const [, ts] of slice) {
      if (ts !== null && (newest === null || ts > newest)) newest = ts;
    }
    const path = pagePath(basePath, start / QUESTIONS_PER_PAGE + 1);
    const lastmod = newest !== null ? { lastmod: new Date(newest * 1000).toISOString() } : {};
    out.push({ loc: `${origin}${path}`, ...lastmod });
    if (isHindiPageByFlags(slice.map((e) => e[2] === 1))) out.push({ loc: `${origin}/hi${path}`, ...lastmod });
  }
  return out;
}

/** A year page's questions for one level, as the page shows them. */
export function yearQuestions(index: QuestionIndex, examYear: string, levelSlug: string): IndexEntry[] {
  const stage = stageIdFor(examYear, levelSlug);
  const list = stage
    ? index.years[`${examYear}|${stage}`] ?? []
    : Object.entries(index.years)
        .filter(([key]) => key.startsWith(`${examYear}|`))
        .flatMap(([, entries]) => entries)
        .sort((a, b) => a[0] - b[0]);
  return list.slice(0, YEAR_PAGE_LIMIT);
}

/** Canonical chapter pages with questions, every page of each. */
export function chapterPageEntries(origin: string, exam: ExamIndex, index: QuestionIndex): SitemapEntry[] {
  return canonicalChapterPaths(exam).flatMap((path) =>
    pagedEntries(origin, path, index.chapters[path.slice(path.lastIndexOf("/") + 1)] ?? []),
  );
}

/** Canonical subject pages with questions, every page of each. A subject
 * page is its chapters' questions in the subject page's own chapter order
 * (`subjectChapters`, keyed by subject path, from the same call the page
 * makes — each level shows its own section). */
export function subjectPageEntries(
  origin: string,
  exam: ExamIndex,
  index: QuestionIndex,
  subjectChapters: Record<string, string[]>,
): SitemapEntry[] {
  return canonicalSubjectPaths(exam).flatMap((path) => {
    const entries = (subjectChapters[path] ?? []).flatMap((chapter) => index.chapters[chapter] ?? []);
    return pagedEntries(origin, path, entries);
  });
}

/** Level x year pages that actually have questions, every page of each. */
export function yearPageEntries(
  origin: string,
  exam: ExamIndex,
  index: QuestionIndex,
  yearInstanceIds: string[],
): SitemapEntry[] {
  return exam.levels.flatMap((level) =>
    yearInstanceIds.flatMap((instanceId) => {
      const slug = yearSlug(instanceId);
      if (!slug) return [];
      const entries = yearQuestions(index, instanceId.toUpperCase(), level.slug);
      return pagedEntries(origin, `/${exam.exam}/${level.slug}/year/${slug}`, entries);
    }),
  );
}
