/**
 * A backend failure with the context needed to diagnose it.
 *
 * `apiFetch` previously threw `new Error(responseBody)`. That lost the method,
 * URL and status, and — because Sentry groups issues by message — every 500
 * with a slightly different body became its own separate issue. This gives a
 * stable, greppable message ("API 500 GET /v2/interactions") plus the raw
 * details as structured fields.
 */
export class ApiError extends Error {
  readonly name = "ApiError";

  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  readonly method: string;
  /** Path only, e.g. "/v2/interactions" — no host, no query string. */
  readonly endpoint: string;
  readonly url: string;
  /** Response body, truncated — enough to read, small enough to send. */
  readonly responseBody?: string;
  /** Set when the request failed at the network level (server unreachable). */
  readonly isNetworkError: boolean;

  constructor(init: {
    status: number;
    method: string;
    endpoint: string;
    url: string;
    responseBody?: string;
    isNetworkError?: boolean;
    cause?: unknown;
  }) {
    const label = init.isNetworkError
      ? `API unreachable ${init.method} ${init.endpoint}`
      : `API ${init.status} ${init.method} ${init.endpoint}`;

    super(label, { cause: init.cause });

    this.status = init.status;
    this.method = init.method;
    this.endpoint = init.endpoint;
    this.url = init.url;
    this.responseBody = init.responseBody;
    this.isNetworkError = init.isNetworkError ?? false;

    // Without this, `instanceof ApiError` breaks once TS downlevels the class.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Flattened shape for Sentry's `extra` / a console log. */
  toContext(): Record<string, unknown> {
    return {
      status: this.status,
      method: this.method,
      endpoint: this.endpoint,
      url: this.url,
      isNetworkError: this.isNetworkError,
      responseBody: this.responseBody,
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Response bodies can be whole HTML error pages; keep events small. */
export function truncateBody(body: string, max = 1000): string {
  return body.length > max ? `${body.slice(0, max)}… (truncated)` : body;
}
