import { ApiError } from "./errors";

export interface FetchClientConfig {
  /** Base URL for this client. Each app resolves this from its own env var —
   * this package deliberately doesn't dictate the name (apps/blog uses
   * NEXT_PUBLIC_PAYLOAD_URL, apps/landing uses CMS_URL for the same backend). */
  baseUrl: string;
  /** Default Next.js ISR revalidate window (seconds), used when a call site
   * doesn't pass its own `revalidate`. */
  defaultRevalidate?: number;
  /** Abort requests that take longer than this. Defaults to 15s. */
  timeout?: number;
}

/**
 * The shape Next.js's patched `fetch()` recognizes on `RequestInit.next`.
 * Defined locally rather than relying on Next's ambient global type
 * augmentation (`next-env.d.ts`), which this package — not itself a Next.js
 * app — has no reliable way to pull into its own TypeScript program.
 */
interface NextFetchExtension {
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface FetchJsonOptions extends Omit<RequestInit, "cache"> {
  /** Next.js `fetch()` cache-control extension. Pass `false` to opt out of
   * the `next: {revalidate}` object entirely (e.g. to use `cache` instead). */
  revalidate?: number | false;
  cache?: RequestCache;
}

export interface FetchClient {
  /** Throws a normalized `ApiError` on any non-2xx response or network failure. */
  fetchJson<T>(path: string, options?: FetchJsonOptions): Promise<T>;
  /** Same as `fetchJson`, but a 404 resolves to `null` instead of throwing. */
  fetchJsonOrNull<T>(path: string, options?: FetchJsonOptions): Promise<T | null>;
}

/**
 * Creates a fetch()-based client for server-side, cacheable reads (Server
 * Components, ISR). Deliberately NOT axios-based: axios instances used
 * inside Server Components bypass Next.js's Data Cache entirely — only the
 * real global `fetch()` gets `next: {revalidate}` integration. Use this for
 * public content reads (CMS, exam listings); use `createApiClient` for
 * client-side authenticated/mutating calls.
 */
export function createFetchClient(config: FetchClientConfig): FetchClient {
  const timeout = config.timeout ?? 15_000;

  async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T> {
    const { revalidate, cache, headers, ...rest } = options;
    const url = `${config.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestInit: RequestInit & NextFetchExtension = {
        ...rest,
        headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
        cache,
        next: revalidate === false ? undefined : { revalidate: revalidate ?? config.defaultRevalidate },
        signal: options.signal ?? controller.signal,
      };
      const res = await fetch(url, requestInit);

      if (!res.ok) {
        const data = await res.json().catch(() => undefined);
        throw new ApiError({
          message: `Request failed (${res.status}): ${path}`,
          status: res.status,
          data,
        });
      }

      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({
        message: error instanceof Error ? error.message : "Request failed",
        isNetworkError: true,
        cause: error,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function fetchJsonOrNull<T>(path: string, options: FetchJsonOptions = {}): Promise<T | null> {
    try {
      return await fetchJson<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  return { fetchJson, fetchJsonOrNull };
}
