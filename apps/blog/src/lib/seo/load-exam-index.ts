import { backendServerHeaders } from "@/lib/api/backend-headers";
import { mapLimit } from "@/lib/async/map-limit";
import { questionTags } from "@/lib/question-bank/cache-tags";
import type { ExamIndex, IndexSubject } from "./exam-index";

// The tree (levels -> subjects -> section chapters) comes from one backend
// call, /blog/exam-index, which runs the same queries the blog used to make
// one by one (1 + levels + sections = 14 calls for CTET, 29 for HTET, 3-9 s on
// every cold page render). A backend without that endpoint (404) is still
// served by the old per-call path. Reuse: Next's data cache per response (24 h;
// a question sync expires it through the exam's question tags, see
// app/api/revalidate) plus an in-memory copy per server instance (1 h).
const DATA_CACHE_SECONDS = 86400;
const MEMO_TTL_MS = 3600 * 1000;
// The old path: the backend rate-limits every /api route to 60 requests/min
// per IP, so its calls run a few at a time.
const CONCURRENCY = 3;

type RawSubject = { slug?: string; section_id?: string };
type RawLevel = { slug?: string; exam_id_b?: string };
// Each entry's chapter carries a capped preview of its questions (up to 3), so
// an empty preview means the chapter has no questions in this section.
type RawSectionEntry = { chapter?: { slug?: string; questions_new?: unknown[] } };

/** What the index is assembled from — exactly /blog/exam-index's payload. */
type RawExamIndex = {
  levels: { slug: string; subjects: { slug: string; section_id: string }[] }[];
  /** section code -> its chapters in order, with whether the section shows questions for them */
  sections: Record<string, { slug: string; has_questions: boolean }[]>;
};

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function apiBase(): string {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_URL is not set");
  return base;
}

async function getJson(path: string, exam: string, revalidate: number): Promise<{ data?: unknown }> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: backendServerHeaders(),
    next: { revalidate, tags: questionTags(exam) },
  });
  if (!res.ok) throw new HttpError(res.status, `GET ${path} -> HTTP ${res.status}`);
  return res.json();
}

function asArray<T>(value: unknown, path: string): T[] {
  if (!Array.isArray(value)) throw new Error(`GET ${path} -> unexpected response shape`);
  return value as T[];
}

/** One call. Throws HttpError(404) when the backend predates the endpoint. */
async function fetchRawIndex(exam: string): Promise<RawExamIndex> {
  const path = `/blog/exam-index?exam_name=${encodeURIComponent(exam)}`;
  const data = (await getJson(path, exam, DATA_CACHE_SECONDS)).data as Partial<RawExamIndex> | undefined;
  if (!data || !Array.isArray(data.levels) || !data.sections || typeof data.sections !== "object") {
    throw new Error(`GET ${path} -> unexpected response shape`);
  }
  return data as RawExamIndex;
}

/** The same data from the old endpoints, one call per level and section. */
async function fetchRawIndexLegacy(exam: string): Promise<RawExamIndex> {
  const navPath = "/blog/get-enavigation?parent_id=true";
  const levelSlugs = asArray<RawLevel>((await getJson(navPath, exam, 3600)).data, navPath)
    .filter((l) => (l.exam_id_b || "").toLowerCase() === `teaching_${exam}` && l.slug)
    .map((l) => l.slug as string);

  const subjectsPerLevel = await mapLimit(levelSlugs, CONCURRENCY, async (level) => {
    const path = `/blog/get-subject?exam_id=${encodeURIComponent(exam)}&slug=${encodeURIComponent(level)}`;
    return asArray<RawSubject>((await getJson(path, exam, 3600)).data, path)
      .filter((s) => s.slug && s.section_id)
      .map((s) => ({ slug: s.slug as string, section_id: s.section_id as string }));
  });

  const sectionIds = [...new Set(subjectsPerLevel.flat().map((s) => s.section_id))];
  const sections = await mapLimit(sectionIds, CONCURRENCY, async (sectionId) => {
    // exact_section: a prefix would also match HTET_CHEM for HTET_CHE (an
    // older backend ignores the flag and keeps prefix matching).
    const path = `/blog/get-questions-by-section?section_id=${encodeURIComponent(sectionId)}&exact_section=1`;
    const json = (await getJson(path, exam, 3600)) as { data?: { data?: unknown } };
    return asArray<RawSectionEntry>(json.data?.data, path)
      .filter((e) => e.chapter?.slug)
      .map((e) => ({ slug: e.chapter?.slug as string, has_questions: (e.chapter?.questions_new?.length ?? 0) > 0 }));
  });

  return {
    levels: levelSlugs.map((slug, i) => ({ slug, subjects: subjectsPerLevel[i] })),
    sections: Object.fromEntries(sectionIds.map((id, i) => [id, sections[i]])),
  };
}

/** Builds the index from the raw tree (shared by both fetch paths). */
export function assembleExamIndex(exam: string, raw: RawExamIndex): ExamIndex {
  const chapterEntries = Object.entries(raw.sections).map(([sectionId, entries]) => {
    const slugs = entries.map((e) => e.slug);
    const withQuestions = entries.filter((e) => e.has_questions).map((e) => e.slug);
    return [sectionId, [...new Set(slugs)], withQuestions] as [string, string[], string[]];
  });
  const chaptersBySection = new Map<string, string[]>(chapterEntries.map(([id, slugs]) => [id, slugs]));
  // A chapter can sit in several sections; it is empty only if none of them
  // shows a question for it.
  const nonEmpty = new Set(chapterEntries.flatMap(([, , withQuestions]) => withQuestions));
  const emptyChapters = [...new Set(chapterEntries.flatMap(([, slugs]) => slugs))].filter((s) => !nonEmpty.has(s));

  return {
    exam,
    emptyChapters,
    levels: raw.levels.map(({ slug, subjects }) => {
      // get-subject can repeat a subject slug within one level (HTET lists
      // "mathematics" as HTET_MATH and HTET_COM_MATH); merge the repeats so
      // one row's empty chapter list can't hide another's. The subject page
      // itself shows the first row's section (`pageChapters`).
      const merged = new Map<string, IndexSubject>();
      for (const rawSubject of subjects) {
        const chapters = chaptersBySection.get(rawSubject.section_id) ?? [];
        const existing = merged.get(rawSubject.slug);
        if (existing) {
          existing.chapters = [...new Set([...existing.chapters, ...chapters])];
        } else {
          merged.set(rawSubject.slug, {
            slug: rawSubject.slug,
            sectionId: rawSubject.section_id,
            chapters,
            pageChapters: chapters,
          });
        }
      }
      return { slug, subjects: [...merged.values()] };
    }),
  };
}

async function buildExamIndex(exam: string): Promise<ExamIndex> {
  let raw: RawExamIndex;
  try {
    raw = await fetchRawIndex(exam);
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) throw err;
    raw = await fetchRawIndexLegacy(exam);
  }
  return assembleExamIndex(exam, raw);
}

const memo = new Map<string, { at: number; promise: Promise<ExamIndex> }>();

/** Drops this instance's in-memory copy (all exams when none given) — the
 * revalidate route calls it next to revalidateTag, which only clears Next's
 * data cache. Other server instances keep theirs until MEMO_TTL_MS. */
export function forgetExamIndex(exams?: string[]): void {
  if (!exams?.length) return memo.clear();
  for (const exam of exams) memo.delete(exam.toLowerCase());
}

/** Rejects if any backend call fails — never returns a partial tree. */
export function loadExamIndex(exam: string): Promise<ExamIndex> {
  const key = exam.toLowerCase();
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.promise;

  const promise = buildExamIndex(key);
  memo.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (memo.get(key)?.promise === promise) memo.delete(key);
  });
  return promise;
}

/** For pages: null when the backend is unavailable, so callers can fall back
 * to rendering as-is instead of 404ing a page that may well exist. */
export async function tryLoadExamIndex(exam: string): Promise<ExamIndex | null> {
  try {
    return await loadExamIndex(exam);
  } catch (err) {
    console.error(`exam index unavailable for "${exam}":`, err);
    return null;
  }
}
