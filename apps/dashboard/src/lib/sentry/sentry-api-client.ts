import { logger } from "./sentry-logger";
import { isApiError, isNetworkFailure } from "@/lib/api/api-error";

/**
 * Wraps an API call so a failure reaches Sentry with the context needed to act
 * on it — which endpoint, which status, which module — then rethrows so the
 * caller (usually React Query) still sees the error and handles it exactly as
 * before (retry, error UI, etc. — this function only changes what gets
 * reported to Sentry, never the thrown value or control flow).
 *
 * Used by ~10 hooks across the dashboard (useMyActiveCourses,
 * useGetCurrentCourse, useLearningStreak, useGetExam, …), so it's the single
 * highest-leverage place to apply the same fix already made one-off in
 * Sidebar.tsx/useStreakTracker.ts/BuySigleCourseModal: a non-actionable
 * network blip (isNetworkFailure — offline, DNS blip, connection reset, or a
 * body read dropped mid-stream, e.g. Safari's "Load failed" on iOS Instagram,
 * Sentry CLEARCUTOFF-NEXTJS-APP-A9) is common on mobile/in-app-browser
 * traffic and isn't something the app can fix — reported as a breadcrumb
 * (still visible as context on a later, unrelated error) instead of its own
 * noisy issue. A genuine backend failure (4xx/5xx, or a malformed response
 * body — see client.ts's res.json() handling) still reports as a full error.
 */
export async function sentryApiClient<T>(
  fn: () => Promise<T>,
  context?: {
    endpoint?: string;
    module?: string;
  },
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // apiFetch throws ApiError with structured fields; axios-based callers
    // still expose error.response.*; anything else falls back to the message.
    const apiFields = isApiError(error)
      ? error.toContext()
      : {
          status: error?.response?.status,
          responseBody: error?.response?.data,
        };

    const tags = {
      type: "api_error",
      module: context?.module || "unknown",
      // Searchable in Sentry: filter to "all 500s", "all unreachable", etc.
      status: String(apiFields.status ?? "unknown"),
      endpoint: isApiError(error)
        ? error.endpoint
        : (context?.endpoint ?? "unknown"),
    };
    const extra = {
      ...apiFields,
      // The caller's own label, kept even when ApiError has its own endpoint.
      callSite: context?.endpoint,
      message: error?.message,
    };

    if (isNetworkFailure(error)) {
      logger.breadcrumb(`API call hit a network blip: ${tags.endpoint}`, { tags, extra });
    } else {
      logger.error(error, { tags, extra });
    }

    throw error; // VERY IMPORTANT
  }
}
