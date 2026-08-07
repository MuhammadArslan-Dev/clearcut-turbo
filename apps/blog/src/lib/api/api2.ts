import { createFetchClient } from "@clearcut/api/fetch-client";

const baseUrl = process.env.BACKEND_URL;

export async function apiFetch<T = any>(
  endpoint: string,
  {
    method = "GET",
    headers = {},
    body,
    cache,
    timeout = 15000,
    revalidate = false,
  }: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    cache?: RequestCache;
    timeout?: number;
    /** Seconds to cache this read in Next's Data Cache. Omit (or `false`) to
     * keep the previous always-uncached behaviour. Pass a number for large
     * public reads so SSR doesn't re-fetch them on every request. */
    revalidate?: number | false;
  } = {}
): Promise<T | null> {
  if (!baseUrl) {
    console.error("MAIN_BACKEND_URL not set");
    return null;
  }

  const client = createFetchClient({ baseUrl, timeout });

  try {
    return await client.fetchJson<T>(endpoint, {
      method,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        ...headers,
      },
      body: body ?? undefined,
      // `cache` and `next.revalidate` are mutually exclusive in Next's fetch;
      // only send one. Default to the original "no-store" when no revalidate
      // window was requested.
      cache: revalidate === false ? (cache ?? "no-store") : undefined,
      revalidate,
    });
  } catch (err) {
    console.error("Fetch failed:", err, `${baseUrl}${endpoint}`);
    return null;
  }
}
