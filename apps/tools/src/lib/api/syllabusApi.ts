// Client-side fetches to clearcutoff-main-backend's public, unauthenticated
// syllabus endpoints (routes/Apis/Tools/syllabus.php there) — the ONE
// runtime backend call this app makes, deliberately scoped to the Syllabus
// Tracker only. See NEXT_PUBLIC_LARAVEL_MAIN_BACKEND in .env.example for why
// this is a NEXT_PUBLIC_ var unlike TOOLS_API_URL (build-time only,
// everywhere else in this app).

const MAIN_BACKEND_URL =
  process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND || "https://apptest.clearcutoff.in/api";

export interface SyllabusExam {
  id: number;
  exam_id: string;
  short_name: string;
  name: string;
  state: string;
  exam_type: string;
  logo_url: string | null;
}

export interface SyllabusLevel {
  id: number;
  name: string;
  // Always English regardless of the requested `locale` — used for URL
  // slugging (see syllabusTrackerUrl.ts's levelSlug()), never for display.
  // `name` itself can be pure Devanagari (Hindi/Marathi) with nothing
  // slug()-able in it at all.
  name_en: string;
  parent_id: number | null;
  group: string | null;
}

export interface SyllabusChapter {
  id: number;
  name: string;
  order: number | null;
}

export type SyllabusTree = Record<string, SyllabusChapter[]>;

interface ApiEnvelope<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Syllabus API request failed (${res.status}): ${url}`);
  }
  const body: ApiEnvelope<T> = await res.json();
  if (body.status !== "success") {
    throw new Error(body.message || "Syllabus API returned an error");
  }
  return body.data;
}

export function fetchSyllabusExams(): Promise<SyllabusExam[]> {
  return getJson<SyllabusExam[]>(`${MAIN_BACKEND_URL}/tools/syllabus/exams`);
}

export function fetchSyllabusLevels(examId: number, locale?: string): Promise<SyllabusLevel[]> {
  return getJson<SyllabusLevel[]>(
    `${MAIN_BACKEND_URL}/tools/syllabus/levels/${examId}?locale=${locale ?? "en"}`,
  );
}

export function fetchSyllabusTree(
  examId: number,
  levelId: number | "full-exam",
  locale?: string,
): Promise<SyllabusTree> {
  return getJson<SyllabusTree>(
    `${MAIN_BACKEND_URL}/tools/syllabus/syllabus/${examId}/${levelId}?locale=${locale ?? "en"}`,
  );
}
