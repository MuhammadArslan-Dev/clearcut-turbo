/**
 * One-shot hand-off from the exam screen to the test list it returns to.
 *
 * Finishing an exam used to `router.replace()` the attempt entry with
 * `/test-series/<course>?showReport=true&examId=…`, which left the list in
 * history twice (the entry the exam was opened from + the report redirect).
 * When the exam was opened from that same list, finishing now pops back to
 * the original list entry instead — and since a pop can't carry query
 * params, the "open the report for this exam" request travels here.
 * TestListPage consumes it on mount and opens the same report modal the
 * `showReport` URL param does.
 */

const TTL_MS = 10_000;

let pending: { examId: string; at: number } | null = null;

export function setExamReportIntent(examId: string) {
  pending = { examId, at: Date.now() };
}

export function takeExamReportIntent(): string | null {
  const intent = pending;
  pending = null;
  if (!intent || Date.now() - intent.at > TTL_MS) return null;
  return intent.examId;
}
