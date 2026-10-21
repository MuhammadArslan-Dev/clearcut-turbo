import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Question, QuestionChapter } from "@/components/blog/assessment-question/questions-list";
import { apiFetch } from "@/lib/api/api2";
import { mapLimit } from "@/lib/async/map-limit";
import { getLocalizedEntityName } from "@/utils/question-translation";
import { questionTags } from "./cache-tags";
import { renderIndexById } from "./card-model";

// Server-side loaders for the question-bank pages and their search index
// route. Wrapped in React `cache()` so generateMetadata, the page and the
// search route share one fetch per request (apiFetch's timeout signal opts out
// of fetch de-duplication). Responses under 2MB are also kept in Next's data
// cache for an hour; larger ones (a few big chapters/years) are not — see
// docs/DEVELOPMENT_RULES.md. Every read carries the exam's question tags
// (cache-tags.ts) so a question sync can expire it on demand.

const REVALIDATE_SECONDS = 3600;
// The backend allows 60 requests/min per IP, shared by every SSR request and
// the sitemaps, so a subject's chapters are fetched a few at a time.
const CHAPTER_FETCH_CONCURRENCY = 3;
// A big chapter is several MB of JSON; the default 15s is too tight cold.
const LARGE_FETCH_TIMEOUT_MS = 30000;

const enc = encodeURIComponent;

/** One chapter's questions in backend order; null when the backend failed. */
export const loadChapterQuestions = cache(async (exam: string, chapter: string): Promise<Question[] | null> => {
  const json = await apiFetch(`/blog/get-questions-by-chapter?slug=${enc(chapter)}&exam_name=${enc(exam)}`, {
    revalidate: REVALIDATE_SECONDS,
    tags: questionTags(exam),
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
  /** Each chapter's record (name + `translations`), the same chapter a
   * question carries — so chapter labels need no question download. */
  chapterInfo: Record<string, QuestionChapter>;
  /** The section's name per language (its `description` translations). */
  names: { en: string | null; hi: string | null };
};

/** A subject page's section: its chapters and names; null when the backend
 * failed. Shared by the subject page and the sitemap so both agree.
 *
 * The backend response is up to ~3 MB (it carries questions too), over the
 * data cache's 2 MB limit, so it was downloaded again on every render. Only
 * the small result below is cached (same tags and lifetime). A failure
 * throws inside, so it is never cached. */
export const loadSubjectSection = cache(
  async (exam: string, subject: string, section?: string): Promise<SubjectSection | null> => {
    try {
      return await unstable_cache(() => fetchSubjectSection(exam, subject, section), ["subject-section", exam, subject, section ?? ""], {
        revalidate: REVALIDATE_SECONDS,
        tags: questionTags(exam),
      })();
    } catch {
      return null;
    }
  },
);

async function fetchSubjectSection(exam: string, subject: string, section?: string): Promise<SubjectSection> {
    const json = await apiFetch(`/blog/get-questions-by-section?${sectionQuery(exam, subject, section)}`);
    if (!json) throw new Error("subject section unavailable");
    // `get-questions-by-section` caps each chapter at 3 questions (a limit the
    // sitemap builder relies on), so it is only used to discover the subject's
    // chapters; each chapter's full set comes from the chapter endpoint.
    const entries: { chapter?: QuestionChapter & { slug?: string } }[] = Array.isArray(json?.data?.data) ? json.data.data : [];
    const data = json?.data;
    const chapterInfo: Record<string, QuestionChapter> = {};
    for (const e of entries) if (e.chapter?.slug && !chapterInfo[e.chapter.slug]) chapterInfo[e.chapter.slug] = e.chapter;
    return {
      chapters: [...new Set(entries.map((e) => e.chapter?.slug).filter((s): s is string => Boolean(s)))],
      chapterInfo,
      names: {
        en: getLocalizedEntityName(data, data?.description, "en"),
        hi: getLocalizedEntityName(data, data?.description, "hi"),
      },
    };
}

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

/** Full question rows for one page, in the given order (`ids` is the
 * comma-joined list, so React's cache() can key on it); null when the backend
 * failed or predates /blog/get-questions-by-ids (404). */
export const loadQuestionsByIds = cache(async (exam: string, ids: string): Promise<Question[] | null> => {
  const json = await apiFetch(`/blog/get-questions-by-ids?ids=${ids}`, {
    revalidate: REVALIDATE_SECONDS,
    tags: questionTags(exam),
  });
  return Array.isArray(json?.data) ? json.data : null;
});

/** A year paper's questions for one level; null when the backend failed. */
export const loadYearQuestions = cache(async (examYear: string, level: string): Promise<Question[] | null> => {
  const json = await apiFetch(`/blog/get-questions?year=${enc(examYear)}&level_id=${enc(level)}`, {
    revalidate: REVALIDATE_SECONDS,
    // "CTET_2024" -> the exam's tags.
    tags: questionTags(examYear.split("_")[0]),
    timeout: LARGE_FETCH_TIMEOUT_MS,
  });
  if (!json) return null;
  return Array.isArray(json?.data) ? json.data : [];
});

/** `/blog/exam` — cached like the other reads (the chapter page used to
 * fetch it uncached, which made every chapter request hit the backend). */
export const loadExamInfo = cache(async (exam: string): Promise<{ state?: string | null } | null> => {
  const json = await apiFetch(`/blog/exam?short_name=${enc(exam)}&first=true`, { revalidate: REVALIDATE_SECONDS });
  return json?.data ?? null;
});

export const loadYears = cache(async (exam: string): Promise<{ instance_id?: string }[] | null> => {
  const json = await apiFetch(`/blog/get-years?exam_id=${enc(exam)}`, {
    revalidate: REVALIDATE_SECONDS,
    tags: questionTags(exam),
  });
  return Array.isArray(json?.data) ? json.data : null;
});
