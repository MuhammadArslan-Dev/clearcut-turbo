import { mapLimit } from "@/lib/async/map-limit";
import { questionTags } from "@/lib/question-bank/cache-tags";
import type { ExamIndex, IndexSubject } from "./exam-index";

// The backend rate-limits every /api route to 60 requests/min per IP, so the
// tree is fetched with low concurrency and reused: Next's data cache per
// response, plus an in-memory copy per server instance.
const REVALIDATE_SECONDS = 3600;
const MEMO_TTL_MS = REVALIDATE_SECONDS * 1000;
const CONCURRENCY = 3;

type RawSubject = { slug?: string; section_id?: string };
type RawLevel = { slug?: string; exam_id_b?: string };
// Each entry's chapter carries a capped preview of its questions (up to 3), so
// an empty preview means the chapter has no questions in this section.
type RawSectionEntry = { chapter?: { slug?: string; questions_new?: unknown[] } };

function apiBase(): string {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_URL is not set");
  return base;
}

async function getJson(path: string, exam: string): Promise<{ data?: unknown }> {
  const res = await fetch(`${apiBase()}${path}`, { next: { revalidate: REVALIDATE_SECONDS, tags: questionTags(exam) } });
  if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
  return res.json();
}

function asArray<T>(value: unknown, path: string): T[] {
  if (!Array.isArray(value)) throw new Error(`GET ${path} -> unexpected response shape`);
  return value as T[];
}

async function buildExamIndex(exam: string): Promise<ExamIndex> {
  const navPath = "/blog/get-enavigation?parent_id=true";
  const levelSlugs = asArray<RawLevel>((await getJson(navPath, exam)).data, navPath)
    .filter((l) => (l.exam_id_b || "").toLowerCase() === `teaching_${exam}` && l.slug)
    .map((l) => l.slug as string);

  const subjectsPerLevel = await mapLimit(levelSlugs, CONCURRENCY, async (level) => {
    const path = `/blog/get-subject?exam_id=${encodeURIComponent(exam)}&slug=${encodeURIComponent(level)}`;
    return asArray<RawSubject>((await getJson(path, exam)).data, path).filter((s) => s.slug && s.section_id);
  });

  const sectionIds = [...new Set(subjectsPerLevel.flat().map((s) => s.section_id as string))];
  const chapterEntries = await mapLimit(sectionIds, CONCURRENCY, async (sectionId) => {
    // exact_section: a prefix would also match HTET_CHEM for HTET_CHE (an
    // older backend ignores the flag and keeps prefix matching).
    const path = `/blog/get-questions-by-section?section_id=${encodeURIComponent(sectionId)}&exact_section=1`;
    const json = (await getJson(path, exam)) as { data?: { data?: unknown } };
    const entries = asArray<RawSectionEntry>(json.data?.data, path).filter((e) => e.chapter?.slug);
    const slugs = entries.map((e) => e.chapter?.slug as string);
    const withQuestions = entries
      .filter((e) => (e.chapter?.questions_new?.length ?? 0) > 0)
      .map((e) => e.chapter?.slug as string);
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
    levels: levelSlugs.map((slug, i) => {
      // get-subject can repeat a subject slug within one level (HTET lists
      // "mathematics" as HTET_MATH and HTET_COM_MATH); merge the repeats so
      // one row's empty chapter list can't hide another's. The subject page
      // itself shows the first row's section (`pageChapters`).
      const merged = new Map<string, IndexSubject>();
      for (const raw of subjectsPerLevel[i]) {
        const chapters = chaptersBySection.get(raw.section_id as string) ?? [];
        const existing = merged.get(raw.slug as string);
        if (existing) {
          existing.chapters = [...new Set([...existing.chapters, ...chapters])];
        } else {
          merged.set(raw.slug as string, {
            slug: raw.slug as string,
            sectionId: raw.section_id as string,
            chapters,
            pageChapters: chapters,
          });
        }
      }
      return { slug, subjects: [...merged.values()] };
    }),
  };
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
