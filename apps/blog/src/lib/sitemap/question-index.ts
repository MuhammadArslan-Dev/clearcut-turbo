import { mapLimit } from "@/lib/async/map-limit";
import { questionTags } from "@/lib/question-bank/cache-tags";
import { loadSubjectChapterSlugs } from "@/lib/question-bank/load";
import { canonicalSubjects, type ExamIndex } from "@/lib/seo/exam-index";
import type { IndexEntry, QuestionIndex } from "./question-pages";

// Fetches for the question-bank sitemap entries. Both throw on any failure:
// the sitemap routes answer 503 rather than serve a shorter file.

const REVALIDATE_SECONDS = 3600;
// The backend allows 60 requests/min per IP, shared with SSR.
const CONCURRENCY = 2;

function isEntryList(value: unknown): value is IndexEntry[] {
  return Array.isArray(value) && value.every((e) => Array.isArray(e) && typeof e[0] === "number");
}

/** /blog/question-index for one exam (see the backend's getQuestionIndex). */
export async function fetchQuestionIndex(exam: string): Promise<QuestionIndex> {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_URL is not set");
  const path = `/blog/question-index?exam_name=${encodeURIComponent(exam)}`;
  const res = await fetch(`${base}${path}`, { next: { revalidate: REVALIDATE_SECONDS, tags: questionTags(exam) } });
  if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
  const data = (await res.json())?.data;
  const chapters = data?.chapters;
  const years = data?.years;
  if (!chapters || typeof chapters !== "object" || !years || typeof years !== "object") {
    throw new Error(`GET ${path} -> unexpected response shape`);
  }
  for (const list of [...Object.values(chapters), ...Object.values(years)]) {
    if (!isEntryList(list)) throw new Error(`GET ${path} -> unexpected entry shape`);
  }
  return { chapters, years } as QuestionIndex;
}

/** Each canonical subject page's chapters (keyed by its path), in the subject
 * page's own order — the same exact-section call the page makes. */
export async function fetchSubjectChapters(index: ExamIndex): Promise<Record<string, string[]>> {
  const subjects = canonicalSubjects(index);
  const lists = await mapLimit(subjects, CONCURRENCY, async (s) => {
    const slugs = await loadSubjectChapterSlugs(index.exam, s.slug, s.sectionId);
    if (!slugs) throw new Error(`subject chapters unavailable: ${s.path}`);
    return slugs;
  });
  return Object.fromEntries(subjects.map((s, i) => [s.path, lists[i]]));
}
