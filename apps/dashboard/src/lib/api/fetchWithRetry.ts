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
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(input, init, retries - 1, delayMs);
  }
}
