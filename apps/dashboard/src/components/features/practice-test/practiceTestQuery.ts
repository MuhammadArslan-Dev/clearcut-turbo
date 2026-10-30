import type { QueryClient } from "@tanstack/react-query";
import { getPracticeTestQuestions } from "@/lib/api/firstPracticeTest";
import { loadPracticeSession } from "./practiceTestSession";

export const practiceQuestionsKey = (courseId: string) => ["first-practice-test", courseId];

// Long enough to read the prompt and tap Take; a forgotten prompt does not keep an old random set around.
const PREFETCH_GC_MS = 2 * 60 * 1000;

/**
 * Starts loading the test while the learner is still reading the "Take a quick
 * practice test?" prompt, so Take opens it without waiting for the request. Same
 * query key as PracticeTestPage, which then finds the data in the cache. Skipped
 * when a test is already in progress here (the page resumes it and fetches nothing).
 * Failures stay silent: the page just loads the test itself.
 */
export function prefetchPracticeTest(queryClient: QueryClient, courseId: string) {
  if (loadPracticeSession(courseId)) return;
  void queryClient
    .prefetchQuery({
      queryKey: practiceQuestionsKey(courseId),
      queryFn: () => getPracticeTestQuestions(courseId),
      staleTime: Infinity,
      gcTime: PREFETCH_GC_MS,
    })
    .catch(() => {});
}
