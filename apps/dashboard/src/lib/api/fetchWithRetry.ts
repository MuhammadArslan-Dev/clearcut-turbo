/**
 * Wraps fetch() and retries once on network-level failures (connection dropped,
 * DNS blip, tab backgrounded mid-request) — the browser TypeErrors "Failed to
 * fetch" / "Load failed". Does NOT retry on HTTP error statuses (4xx/5xx),
 * since those resolve normally rather than throwing.
 *
 * Delay doubles each attempt (from `delayMs`) rather than staying fixed —
 * a fixed short delay (e.g. 3 retries at 400ms apart, ~1.2s total) gives up
 * before a real mobile network blip (switching towers, a lift, a tunnel —
 * commonly 2-5s) has cleared, which is exactly the failure mode that kept
 * reporting "unreachable" for /v2/interactions/resume-state in production
 * (CLEARCUTOFF-NEXTJS-APP-74) despite that call already retrying.
 */
export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  retries = 1,
  delayMs = 300,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    // An intentionally cancelled request (caller's AbortController fired —
    // component unmounted, a newer call superseded this one) isn't a
    // network failure; retrying it just re-runs into the same abort and
    // delays reporting it back to the caller for no benefit.
    if (init?.signal?.aborted) throw err;
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(input, init, retries - 1, delayMs * 2);
  }
}
