/**
 * Wraps fetch() and retries once on network-level failures (connection dropped,
 * DNS blip, tab backgrounded mid-request) — the browser TypeErrors "Failed to
 * fetch" / "Load failed". Does NOT retry on HTTP error statuses (4xx/5xx),
 * since those resolve normally rather than throwing.
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
    return fetchWithRetry(input, init, retries - 1, delayMs);
  }
}
