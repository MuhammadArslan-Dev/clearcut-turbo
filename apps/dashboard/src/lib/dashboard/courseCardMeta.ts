/**
 * Small, pure helpers for the My Courses card header (phase 98).
 * Synced JSON columns can arrive double-encoded ("{\"exam_date\":…}" as a
 * string), so every reader goes through `decodeJson`.
 */

export function decodeJson(raw: unknown): Record<string, unknown> | null {
  let v: unknown = raw;
  for (let i = 0; i < 2 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** The paper / level the student picked, e.g. "Level 1 (PRT)" or "Paper 2". */
export function levelName(enrollmentMetadata: unknown): string | null {
  const names = decodeJson(enrollmentMetadata)?.stagesNames;
  if (Array.isArray(names) && typeof names[0] === "string" && names[0].trim()) {
    return names[0].trim();
  }
  return null;
}

/**
 * Whole days from today (IST) to `exam.metadata.exam_date`.
 * null when the date is missing, "Upcoming", unparseable or already past —
 * the card then hides the line (decision D3).
 */
export function daysToExam(examMetadata: unknown, now: Date = new Date()): number | null {
  const raw = decodeJson(examMetadata)?.exam_date;
  if (typeof raw !== "string" || !/\d/.test(raw)) return null;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  const day = (t: number) => Math.floor((t + 5.5 * 3600 * 1000) / 86400000); // IST calendar day
  const exam = new Date(parsed);
  // Date.parse("04 July 2026") is local midnight; use its calendar date as the exam day.
  const examDay = Math.floor(Date.UTC(exam.getFullYear(), exam.getMonth(), exam.getDate()) / 86400000);
  const days = examDay - day(now.getTime());
  return days >= 0 ? days : null;
}

/** The paper (leaf) the student picked, e.g. "Paper 2" — `stagesNames[1]`; null when the course has no deeper level. */
export function paperName(enrollmentMetadata: unknown): string | null {
  const names = decodeJson(enrollmentMetadata)?.stagesNames;
  if (Array.isArray(names) && typeof names[1] === "string" && names[1].trim()) {
    return names[1].trim();
  }
  return null;
}
