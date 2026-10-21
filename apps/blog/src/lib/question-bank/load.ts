import { cache } from "react";
import type { Question } from "@/components/blog/assessment-question/questions-list";
import { apiFetch } from "@/lib/api/api2";
import { mapLimit } from "@/lib/async/map-limit";
import { getLocalizedEntityName } from "@/utils/question-translation";
import { renderIndexById } from "./card-model";

// Server-side loaders for the question-bank pages and their search index
// route. Wrapped in React `cache()` so generateMetadata, the page and the
// search route share one fetch per request (apiFetch's timeout signal opts out
// of fetch de-duplication).
//
// Every page is prerendered at build time and a question sync rebuilds the
// site (docs/phases/14-blog-worker-limit.md), so reads are cached without a
// time window: a window would turn the pages back into time-based ISR, which
// re-renders them inside the Worker — far over its 10 ms CPU limit. During the
// CI build apiFetch also memoizes responses on disk (lib/build/prerender.ts).

const CACHED = { cache: "force-cache" } as const;
// The backend allows 60 requests/min per IP, shared by every SSR request and
// the sitemaps, so a subject's chapters are fetched a few at a time.
const CHAPTER_FETCH_CONCURRENCY = 3;
// A big chapter is several MB of JSON; the default 15s is too tight cold.
const LARGE_FETCH_TIMEOUT_MS = 30000;

const enc = encodeURIComponent;

/** One chapter's questions in backend order; null when the backend failed. */
export const loadChapterQuestions = cache(async (exam: string, chapter: string): Promise<Question[] | null> => {
  const json = await apiFetch(`/blog/get-questions-by-chapter?slug=${enc(chapter)}&exam_name=${enc(exam)}`, {
    ...CACHED,
    timeout: LARGE_FETCH_TIMEOUT_MS,
  });
  if (!json) return null;
  const questions = json?.data?.questions_new;
  return Array.isArray(questions) ? questions : [];
});

export type SubjectQuestions = {
  questions: Question[];
  /** Each question's 0-based index on its own chapter page. */
  chapterIndexById: Map<number, number>;
};

/** The section query for a subject page: the level's own section code when
 * known (exact match — "english" is CTET_L1_ENG on paper 1, CTET_L2_ENG on
 * paper 2), else the old exam-wide prefix (the exam index was unavailable). */
function sectionQuery(exam: string, subject: string, section?: string): string {
  return section
    ? `section_id=${enc(section)}&slug=${enc(subject)}&exact_section=1`
    : `section_id=${enc(exam)}&slug=${enc(subject)}`;
}

export type SubjectSection = {
  /** Chapter slugs in page order. */
  chapters: string[];
  /** The section's name per language (its `description` translations). */
  names: { en: string | null; hi: string | null };
};

/** A subject page's section: its chapters and names; null when the backend
 * failed. Shared by the subject page and the sitemap so both agree. */
export const loadSubjectSection = cache(
  async (exam: string, subject: string, section?: string): Promise<SubjectSection | null> => {
    const json = await apiFetch(`/blog/get-questions-by-section?${sectionQuery(exam, subject, section)}`, {
    ...CACHED,
    });
    if (!json) return null;
    // `get-questions-by-section` caps each chapter at 3 questions (a limit the
    // sitemap builder relies on), so it is only used to discover the subject's
    // chapters; each chapter's full set comes from the chapter endpoint.
    const entries: { chapter?: { slug?: string } }[] = Array.isArray(json?.data?.data) ? json.data.data : [];
    const data = json?.data;
    return {
      chapters: [...new Set(entries.map((e) => e.chapter?.slug).filter((s): s is string => Boolean(s)))],
      names: {
        en: getLocalizedEntityName(data, data?.description, "en"),
        hi: getLocalizedEntityName(data, data?.description, "hi"),
      },
    };
  },
);

/** A subject page's chapter slugs, in page order; null when the backend failed. */
export const loadSubjectChapterSlugs = cache(
  async (exam: string, subject: string, section?: string): Promise<string[] | null> =>
    (await loadSubjectSection(exam, subject, section))?.chapters ?? null,
);

/** Every chapter of a subject, concatenated in navigation order; null when
 * any chapter failed to load. Skipping a failed chapter (e.g. a backend 429)
 * shortened the subject, so its later pages 404'd — and ISR cached those
 * 404s. A failure now errors the render instead, which is never cached. */
export const loadSubjectQuestions = cache(
  async (exam: string, subject: string, section?: string): Promise<SubjectQuestions | null> => {
    const slugs = await loadSubjectChapterSlugs(exam, subject, section);
    if (!slugs) return null;

    const perChapter = await mapLimit(slugs, CHAPTER_FETCH_CONCURRENCY, (slug) => loadChapterQuestions(exam, slug));
    if (perChapter.some((chapterQuestions) => chapterQuestions === null)) return null;

    const questions: Question[] = [];
    const chapterIndexById = new Map<number, number>();
    for (const chapterQuestions of perChapter as Question[][]) {
      questions.push(...chapterQuestions);
      // Indexed the way the chapter page paginates (rendered questions only).
      for (const [id, i] of renderIndexById(chapterQuestions)) chapterIndexById.set(id, i);
    }
    return { questions, chapterIndexById };
  },
);

/** A year paper's questions for one level; null when the backend failed. */
export const loadYearQuestions = cache(async (examYear: string, level: string): Promise<Question[] | null> => {
  const json = await apiFetch(`/blog/get-questions?year=${enc(examYear)}&level_id=${enc(level)}`, {
    ...CACHED,
    timeout: LARGE_FETCH_TIMEOUT_MS,
  });
  if (!json) return null;
  return Array.isArray(json?.data) ? json.data : [];
});

/** `/blog/exam` — cached like the other reads (the chapter page used to
 * fetch it uncached, which made every chapter request hit the backend). */
export const loadExamInfo = cache(async (exam: string): Promise<{ state?: string | null } | null> => {
  const json = await apiFetch(`/blog/exam?short_name=${enc(exam)}&first=true`, CACHED);
  return json?.data ?? null;
});

export const loadYears = cache(async (exam: string): Promise<{ instance_id?: string }[] | null> => {
  const json = await apiFetch(`/blog/get-years?exam_id=${enc(exam)}`, CACHED);
  return Array.isArray(json?.data) ? json.data : null;
});
