// Small JSON-over-HTTP helper (phase 117). Errors never contain headers, bodies or URLs with credentials.
export class HttpError extends Error {
  constructor(status, host) {
    super(`HTTP ${status} from ${host}`);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * `retries` applies to network errors, 5xx and 429 only; a 4xx is a real answer and is never retried.
 * Non-idempotent calls (POST comment) are made with retries = 0: after an unknown outcome the next scheduled run
 * re-reads the state (marker / commitCount / deployCount) instead of blindly repeating the write.
 */
export async function requestJson(url, { method = "GET", headers = {}, body, retries = 0, backoffMs = 1000, fetchImpl = fetch, timeoutMs = 20_000 } = {}) {
  const host = new URL(url).host;
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, {
        method,
        headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return res.status === 204 ? null : await res.json().catch(() => null);
      const err = new HttpError(res.status, host);
      if (res.status < 500 && res.status !== 429) throw err;
      last = err;
    } catch (e) {
      if (e instanceof HttpError && e.status < 500 && e.status !== 429) throw e;
      last = e instanceof HttpError ? e : new Error(`request to ${host} failed (${e.name})`);
    }
    if (attempt < retries) await sleep(backoffMs * 2 ** attempt);
  }
  throw last;
}
