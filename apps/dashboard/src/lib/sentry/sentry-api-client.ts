import * as Sentry from "@sentry/nextjs";
import { logger } from "./sentry-logger";

export async function sentryApiClient<T>(
  fn: () => Promise<T>,
  context?: {
    endpoint?: string;
    module?: string;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    logger.error(error, {
      tags: {
        type: "api_error",
        module: context?.module || "unknown",
      },
      extra: {
        endpoint: context?.endpoint,
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      },
    });

    throw error; // VERY IMPORTANT
  }
}