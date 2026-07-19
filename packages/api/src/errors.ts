import { AxiosError } from "axios";

/**
 * Normalized error shape surfaced by every client created with
 * `createApiClient`. Callers (React Query hooks, server actions, etc.)
 * should only ever need to handle this shape — never raw AxiosError.
 */
export class ApiError extends Error {
  /** HTTP status code, if the server responded at all. */
  readonly status: number | undefined;
  /** Axios/network error code (e.g. "ECONNABORTED", "ERR_NETWORK"). */
  readonly code: string | undefined;
  /** True when the request never reached a server (offline, timeout, DNS, CORS). */
  readonly isNetworkError: boolean;
  /** Raw response body, if any — server error payloads often carry useful detail. */
  readonly data: unknown;
  /** The original error, for logging/telemetry. */
  readonly cause: unknown;

  constructor(params: {
    message: string;
    status?: number;
    code?: string;
    isNetworkError?: boolean;
    data?: unknown;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.isNetworkError = params.isNetworkError ?? false;
    this.data = params.data;
    this.cause = params.cause;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** Converts any error thrown by an axios instance into a normalized `ApiError`. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage = extractServerMessage(error.response?.data);

    return new ApiError({
      message: serverMessage ?? error.message ?? "Request failed",
      status,
      code: error.code,
      isNetworkError: !error.response,
      data: error.response?.data,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message, cause: error });
  }

  return new ApiError({ message: "Unknown error", cause: error });
}

function extractServerMessage(data: unknown): string | undefined {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
}
