import { createFetchClient } from "@clearcut/api/fetch-client";

const baseUrl = process.env.BACKEND_URL;

export async function apiFetch<T = any>(
  endpoint: string,
  {
    method = "GET",
    headers = {},
    body,
    cache = "no-store",
    timeout = 15000,
  }: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    cache?: RequestCache;
    timeout?: number;
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
      cache,
      revalidate: false,
    });
  } catch (err) {
    console.error("Fetch failed:", err, `${baseUrl}${endpoint}`);
    return null;
  }
}
