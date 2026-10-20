import { searchIndexItems } from "./card-model";
import { QUESTIONS_PER_PAGE } from "./pagination";
import { QUESTION_PAGE_REVALIDATE } from "./route-cache";
import { loadScope, searchIndexPath, type QuestionScope } from "./scope";

// The search index body for app/api/question-search. Building one loads the
// whole scope (a subject is every chapter, some over Next's 2MB data-cache
// limit), so finished bodies are kept in memory per server instance for as
// long as the pages themselves are cached (QUESTION_PAGE_REVALIDATE).
// Failures are never kept.

const MEMO_TTL_MS = QUESTION_PAGE_REVALIDATE * 1000;
const MEMO_MAX = 100;
const memo = new Map<string, { exam: string; at: number; body: Promise<string | null> }>();

export function searchIndexBody(scope: QuestionScope): Promise<string | null> {
  const key = searchIndexPath(scope);
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.body;

  const body = loadScope(scope).then((loaded) =>
    loaded.ok ? JSON.stringify({ pageSize: QUESTIONS_PER_PAGE, items: searchIndexItems(loaded.cards) }) : null,
  );
  if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value as string);
  memo.set(key, { exam: scope.exam.toLowerCase(), at: Date.now(), body });
  body.then(
    (b) => b === null && memo.get(key)?.body === body && memo.delete(key),
    () => memo.get(key)?.body === body && memo.delete(key),
  );
  return body;
}

/** Drops this instance's memoised bodies (all exams when none given), for
 * the revalidate route. Other server instances keep theirs until the TTL. */
export function forgetSearchIndex(exams?: string[]): void {
  if (!exams?.length) return memo.clear();
  const drop = new Set(exams.map((e) => e.toLowerCase()));
  for (const [key, entry] of memo) if (drop.has(entry.exam)) memo.delete(key);
}
