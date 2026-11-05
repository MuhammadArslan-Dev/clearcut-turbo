import type { QueryClient } from "@tanstack/react-query";

/**
 * Phase 77: access changed on the server (a payment was confirmed), so everything that carries a
 * course status or a lock flag is stale: my courses, the current course, chapters, syllabus, test
 * lists, daily tests. Those queries have 5 to 30 minute staleTimes, and only two of them were ever
 * refreshed after paying, which left "Expired" and locked items on screen for a paid student.
 *
 * Invalidating everything is deliberate: active queries refetch now, the rest refetch the next time
 * they are mounted, and it happens once per payment.
 */
export async function invalidateAfterPayment(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries().catch(() => {});
}
