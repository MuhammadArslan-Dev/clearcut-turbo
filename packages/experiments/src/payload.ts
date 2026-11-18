// Server-side fetch of the GrowthBook features payload (CC-192, phase 118 follow-up).
// Why: when the BROWSER has to ask GrowthBook, a new visitor has no cache and waits up to the 500 ms guardrail, so the first
// page view often shows control and only the refresh shows the variant. Fetching the payload on the server (cached for 5
// minutes, the client's requirement) and handing it to the browser lets the SDK decide synchronously with `initSync`: no
// network wait, no hidden placeholder time, and no GrowthBook request from visitors at all.
// Framework-agnostic: in Next.js the `next.revalidate` fetch option provides the cache; elsewhere it is ignored.
import type { FeatureApiResponse } from "@growthbook/growthbook";
import { DEFAULT_API_HOST } from "./client";

export type FeaturesPayload = FeatureApiResponse;

/** The client's rule: GrowthBook changes may take up to 5 minutes to reach visitors. */
export const PAYLOAD_REVALIDATE_SECONDS = 300;
/** Cache tag on the payload fetch: the GrowthBook webhook route calls `revalidateTag` with it so a change shows up in seconds instead of after the window. */
export const GROWTHBOOK_CACHE_TAG = "growthbook";
/** The server answers the page only after this; past it the page renders without a payload (browser path, then control). */
export const PAYLOAD_FETCH_TIMEOUT_MS = 1500;

export function isFeaturesPayload(value: unknown): value is FeaturesPayload {
  if (typeof value !== "object" || value === null) return false;
  const features = (value as { features?: unknown }).features;
  return typeof features === "object" && features !== null && !Array.isArray(features);
}

export type FetchPayloadArgs = {
  clientKey: string;
  apiHost?: string;
  revalidateSeconds?: number;
  timeoutMs?: number;
  /** Injection point for tests. */
  fetchImpl?: typeof fetch;
};

/** Never throws. `null` = no usable payload (no key, network error, timeout, non-200, bad JSON): callers fall back. */
export async function fetchFeaturesPayload(args: FetchPayloadArgs): Promise<FeaturesPayload | null> {
  const clientKey = args.clientKey.trim();
  if (!clientKey) return null;
  const host = (args.apiHost ?? "").trim().replace(/\/+$/, "") || DEFAULT_API_HOST;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? PAYLOAD_FETCH_TIMEOUT_MS);
  try {
    const doFetch = args.fetchImpl ?? fetch;
    const res = await doFetch(`${host}/api/features/${encodeURIComponent(clientKey)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      // Next.js data cache: one GrowthBook request per revalidate window, shared by every visitor. Ignored outside Next.
      next: { revalidate: args.revalidateSeconds ?? PAYLOAD_REVALIDATE_SECONDS, tags: [GROWTHBOOK_CACHE_TAG] },
    } as RequestInit);
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return isFeaturesPayload(json) ? json : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
