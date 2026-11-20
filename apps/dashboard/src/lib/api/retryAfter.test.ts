import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ addBreadcrumb: vi.fn(), setMeasurement: vi.fn() }));
vi.mock("../auth-token-client", () => ({
  getAuthTokenClient: () => "tok",
  token: () => undefined,
  redirectToLogin: vi.fn(),
}));

import { MAX_RETRY_AFTER_MS, retryAfterMs, waitUnlessAborted } from "./retryAfter";
import { apiFetch } from "./client";
import { ApiError } from "./api-error";

const res = (status: number, retryAfter?: string) => ({ status, headers: new Headers(retryAfter === undefined ? {} : { "Retry-After": retryAfter }) });

describe("retryAfterMs", () => {
  it("retries a 429 whose Retry-After is a few seconds", () => {
    expect(retryAfterMs(res(429, "2"))).toBe(2000);
    expect(retryAfterMs(res(429, "5"))).toBe(5000);
  });

  it("gives a tiny or zero Retry-After a small floor so the retry does not land in the same instant", () => {
    expect(retryAfterMs(res(429, "0"))).toBe(250);
  });

  it("does not retry a long wait (OTP / login limits ask for up to a minute)", () => {
    expect(retryAfterMs(res(429, "6"))).toBeNull();
    expect(retryAfterMs(res(429, "60"))).toBeNull();
    expect(MAX_RETRY_AFTER_MS).toBe(5000);
  });

  it("does not retry without a usable Retry-After (could be a limit that is not clearing)", () => {
    expect(retryAfterMs(res(429))).toBeNull();
    expect(retryAfterMs(res(429, ""))).toBeNull();
    expect(retryAfterMs(res(429, "soon"))).toBeNull();
  });

  it("reads an HTTP-date Retry-After", () => {
    const now = Date.parse("2026-11-20T10:00:00Z");
    expect(retryAfterMs(res(429, "Fri, 20 Nov 2026 10:00:03 GMT"), now)).toBe(3000);
    expect(retryAfterMs(res(429, "Fri, 20 Nov 2026 10:01:00 GMT"), now)).toBeNull(); // 60 s: too long
    expect(retryAfterMs(res(429, "Fri, 20 Nov 2026 09:59:00 GMT"), now)).toBe(250); // already in the past
  });

  it("only ever applies to a 429", () => {
    expect(retryAfterMs(res(200, "1"))).toBeNull();
    expect(retryAfterMs(res(500, "1"))).toBeNull();
    expect(retryAfterMs(res(503, "1"))).toBeNull();
  });
});

describe("waitUnlessAborted", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves after the delay", async () => {
    let done = false;
    void waitUnlessAborted(1000).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
  });

  it("rejects with an AbortError the moment the request is cancelled, and does not wait the rest", async () => {
    const ctrl = new AbortController();
    const p = waitUnlessAborted(5000, ctrl.signal);
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects at once when already cancelled", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(waitUnlessAborted(1000, ctrl.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("apiFetch and a 429", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = realFetch;
  });

  const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

  it("429 with Retry-After 2 -> waits, sends the request ONCE more, and returns the data of the retry", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ message: "slow down" }, 429, { "Retry-After": "2" })).mockResolvedValueOnce(json({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const p = apiFetch<{ ok: boolean }>("/v2/get-my-active-courses");
    await vi.advanceTimersByTimeAsync(1900);
    expect(fetchMock).toHaveBeenCalledTimes(1); // still waiting
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a second 429 is NOT retried again: the usual ApiError 429 reaches the caller", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json({ message: "slow down" }, 429, { "Retry-After": "1" })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const p = apiFetch("/v2/x");
    const caught = p.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1500);
    const err = (await caught) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(2); // original + exactly one retry
  });

  it("a long Retry-After is not waited for: the 429 reaches the caller at once, one request only", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json({ message: "too many OTP requests" }, 429, { "Retry-After": "60" })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const err = (await apiFetch("/v2/auth/otp", { method: "POST" }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("other errors are untouched: a 500 and a 404 are not retried", async () => {
    for (const status of [500, 404]) {
      const fetchMock = vi.fn(() => Promise.resolve(json({}, status, { "Retry-After": "1" })));
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const err = (await apiFetch("/v2/x").catch((e: unknown) => e)) as ApiError;
      expect(err.status).toBe(status);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("a request cancelled while it waits for the retry throws an AbortError and never re-sends", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({}, 429, { "Retry-After": "3" })).mockResolvedValueOnce(json({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const ctrl = new AbortController();

    const caught = apiFetch("/v2/x", { signal: ctrl.signal }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(500);
    ctrl.abort();
    const err = await caught;
    expect(err).toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a normal 200 is not delayed or retried (no change for the happy path)", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json({ ok: true })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await expect(apiFetch("/v2/x")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
