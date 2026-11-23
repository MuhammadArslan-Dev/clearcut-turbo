import { backendServerHeaders } from "@/lib/api/backend-headers";
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
  return (
    Array.isArray(value) &&
    value.every((e) => Array.isArray(e) && typeof e[0] === "number" && (e[2] === undefined || e[2] === 0 || e[2] === 1))
  );
}

// Last index that loaded, per exam and server instance. Only used when a
// fetch fails (backend down, 429, malformed reply): a page, sitemap or
// /question/* redirect then works from the previous copy instead of failing
// (phase 125: no 5xx for a lookup that worked before). The success path is
// unchanged — freshness still comes from the data cache and its tags.
const lastGood = new Map<string, QuestionIndex>();

/** /blog/question-index for one exam (see the backend's getQuestionIndex).
 * Throws only when it fails and no earlier copy exists on this instance. */
export async function fetchQuestionIndex(exam: string): Promise<QuestionIndex> {
  const key = exam.toLowerCase();
  try {
    const index = await fetchQuestionIndexFresh(exam);
    lastGood.set(key, index);
    return index;
  } catch (err) {
    const previous = lastGood.get(key);
    if (!previous) throw err;
    console.error(`question index for "${exam}" failed, serving the last good copy:`, err);
    return previous;
  }
}

/** Test hook: forget the last-good copies. */
export function forgetQuestionIndexFallback(): void {
  lastGood.clear();
}

async function fetchQuestionIndexFresh(exam: string): Promise<QuestionIndex> {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_URL is not set");
  const path = `/blog/question-index?exam_name=${encodeURIComponent(exam)}`;
  const res = await fetch(`${base}${path}`, {
    headers: backendServerHeaders(),
    next: { revalidate: REVALIDATE_SECONDS, tags: questionTags(exam) },
  });
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
