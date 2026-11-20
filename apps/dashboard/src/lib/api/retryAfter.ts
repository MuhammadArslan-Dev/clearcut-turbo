/**
 * One automatic retry for a "429 Too Many Requests" that clears within a few seconds.
 *
 * The backend's `throttle:api` middleware rejects BEFORE the controller runs (nothing was processed, no side effects),
 * and no controller returns a 429 of its own, so sending the same request again is safe for every method. A 429 with a
 * long Retry-After (an OTP or login limit asks for up to a minute) is NOT retried: it would only fail again, so the
 * caller gets the error at once, exactly as before.
 */

/** Longest wait that is worth holding a request for. */
export const MAX_RETRY_AFTER_MS = 5_000;

/**
 * How long to wait before retrying, or `null` when this 429 should not be retried: no / unreadable Retry-After header,
 * or one longer than MAX_RETRY_AFTER_MS. Retry-After is either seconds or an HTTP date; both are understood.
 */
export function retryAfterMs(res: Pick<Response, "status" | "headers">, now: number = Date.now()): number | null {
  if (res.status !== 429) return null;
  const raw = res.headers.get("Retry-After");
  if (!raw) return null;

  const seconds = Number(raw.trim());
  let ms: number;
  if (Number.isFinite(seconds)) {
    ms = seconds * 1000;
  } else {
    const at = Date.parse(raw);
    if (Number.isNaN(at)) return null;
    ms = at - now;
  }
  if (ms < 0) ms = 0;
  // A small floor so the retry does not land in the same instant, and a hard ceiling.
  ms = Math.max(ms, 250);
  return ms <= MAX_RETRY_AFTER_MS ? ms : null;
}

/** Resolves after `ms`; rejects with an AbortError as soon as `signal` fires (a cancelled request must not wait). */
export function waitUnlessAborted(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
