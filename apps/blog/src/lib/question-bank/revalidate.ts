import { createHash, timingSafeEqual } from "node:crypto";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { examQuestionTag, QUESTION_TAG } from "./cache-tags";

// Pure parts of the backend's post-sync webhook (app/api/revalidate).

/** Shorter secrets are treated as unset — the route then refuses everything. */
export const MIN_SECRET_LENGTH = 32;

/** The ISR question-bank routes (file-system patterns, for revalidatePath
 * with type "page"). */
export const QUESTION_PAGE_PATTERNS = [
  "/[locale]/(blog)/[examName]/[level_id]/subject/[subject_id]/[chapter_name]",
  "/[locale]/(blog)/[examName]/[level_id]/subject/[subject_id]/[chapter_name]/page/[page]",
  "/[locale]/(blog)/[examName]/[level_id]/subject/[subject_id]",
  "/[locale]/(blog)/[examName]/[level_id]/subject/[subject_id]/page/[page]",
  "/[locale]/(blog)/[examName]/[level_id]/year/[year_id]",
  "/[locale]/(blog)/[examName]/[level_id]/year/[year_id]/page/[page]",
];

export function secretConfigured(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH;
}

const digest = (value: string) => createHash("sha256").update(value).digest();

/** `Authorization: Bearer <secret>`, compared in constant time. */
export function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secretConfigured(secret) || !header) return false;
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(secret));
}

export type RevalidationTargets = { exams: string[]; tags: string[]; all: boolean };

/** `{ exams?: string[] }` -> what to expire; null when the body is malformed.
 * No exams = every exam. Exams this app doesn't serve are ignored (a MAHATET
 * sync expires nothing here). */
export function revalidationTargets(body: unknown): RevalidationTargets | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
  const raw = (body as { exams?: unknown }).exams;
  if (raw === undefined || (Array.isArray(raw) && raw.length === 0)) {
    return { exams: [...ALLOWED_EXAMS], tags: [QUESTION_TAG], all: true };
  }
  if (!Array.isArray(raw) || raw.length > 50 || !raw.every((e) => typeof e === "string")) return null;
  const exams = [...new Set(raw.map((e) => e.toLowerCase()))].filter((e) => ALLOWED_EXAMS.includes(e));
  return { exams, tags: exams.map(examQuestionTag), all: false };
}
