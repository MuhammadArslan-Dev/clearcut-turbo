import { logger } from "./sentry-logger";
import { isApiError } from "@/lib/api/api-error";

/**
 * Wraps an API call so a failure reaches Sentry with the context needed to act
 * on it — which endpoint, which status, which module — then rethrows so the
 * caller (usually React Query) still sees the error.
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

    logger.error(error, {
      tags: {
        type: "api_error",
        module: context?.module || "unknown",
        // Searchable in Sentry: filter to "all 500s", "all unreachable", etc.
        status: String(apiFields.status ?? "unknown"),
        endpoint: isApiError(error)
          ? error.endpoint
          : (context?.endpoint ?? "unknown"),
      },
      extra: {
        ...apiFields,
        // The caller's own label, kept even when ApiError has its own endpoint.
        callSite: context?.endpoint,
        message: error?.message,
      },
    });

    throw error; // VERY IMPORTANT
  }
}
