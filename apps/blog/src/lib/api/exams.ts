// src/lib/api/exams.ts
// Resolves a blog URL exam segment (e.g. "ctet", "CTET", "teaching_CTET") to the
// canonical exam `exam_id` used to scope post queries. Posts reference exams by
// `exam_id` (e.g. "teaching_CTET"), but URLs use a short, lowercase form — so we
// match the segment against each exam's exam_id / short_name flexibly.
import "server-only";
import { createFetchClient } from "@clearcut/api/fetch-client";

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL;

if (!PAYLOAD_URL) {
  throw new Error("NEXT_PUBLIC_PAYLOAD_URL is not defined");
}

const client = createFetchClient({ baseUrl: PAYLOAD_URL, defaultRevalidate: 300 });

// Normalize for comparison: lowercase, drop spaces/hyphens/underscores.
const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, "");

export interface ExamLite {
  exam_id?: string;
  short_name?: string;
  name?: string;
}

/**
 * Resolve a URL exam segment to its exam record, or null if unknown.
 * Match priority: exact exam_id → exact short_name → exam_id ending with the
 * segment (so "ctet" resolves "teaching_CTET").
 */
export async function resolveExam(segment: string): Promise<ExamLite | null> {
  if (!segment) return null;
  try {
    const data = await client.fetchJson<{ docs?: ExamLite[] }>("/api/exams?limit=100&depth=0");
    const exams = data.docs ?? [];
    const seg = norm(segment);

    return (
      exams.find((e) => e.exam_id && norm(e.exam_id) === seg) ??
      exams.find((e) => e.short_name && norm(e.short_name) === seg) ??
      exams.find((e) => e.exam_id && norm(e.exam_id).endsWith(seg)) ??
      null
    );
  } catch (error) {
    console.error(`Failed to resolve exam segment "${segment}":`, error);
    return null;
  }
}

/** Resolve a URL exam segment to its canonical `exam_id`, or null if unknown. */
export async function resolveExamId(segment: string): Promise<string | null> {
  return (await resolveExam(segment))?.exam_id ?? null;
}

/** Human-readable exam label (short_name preferred) for a resolved exam. */
export function examLabelOf(exam: ExamLite | null, fallback: string): string {
  return exam?.short_name || exam?.name || fallback;
}
