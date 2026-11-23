import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ addBreadcrumb: vi.fn(), setMeasurement: vi.fn() }));
const redirectToLogin = vi.fn();
vi.mock("./auth-token-client", () => ({
  getAuthTokenClient: () => "tok",
  token: () => undefined,
  redirectToLogin: () => redirectToLogin(),
}));

import { apiFetch, SessionExpiredError } from "./api/client";
import { ApiError } from "./api/api-error";
import { isSessionRejected } from "./auth-failure";

// Phase 124: only an explicit 401 may log the user out (clear the token and go to
// login). Network errors, timeouts, 5xx and 403 keep the session.

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  redirectToLogin.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

async function failureOf(respond: () => Promise<Response>): Promise<unknown> {
  fetchMock.mockImplementation(respond);
  return apiFetch("/v1/auth-user").then(
    () => null,
    (e) => e,
  );
}

describe("session check failures", () => {
  it("valid token: resolves, no logout", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }));
    await expect(apiFetch("/v1/auth-user")).resolves.toEqual({ data: { id: 1 } });
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("expired / invalid token (401): clears and redirects, and counts as a rejection", async () => {
    const err = await failureOf(async () => new Response('{"message":"Unauthenticated."}', { status: 401 }));
    expect(err).toBeInstanceOf(SessionExpiredError);
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
    expect(isSessionRejected(err)).toBe(true);
  });

  it.each([403, 429, 500, 502, 503])("HTTP %i keeps the session", async (status) => {
    const err = await failureOf(async () => new Response("{}", { status }));
    expect(err).toBeInstanceOf(ApiError);
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(isSessionRejected(err)).toBe(false);
  });

  it("network failure (offline) keeps the session", async () => {
    const err = await failureOf(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((err as ApiError).isNetworkError).toBe(true);
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(isSessionRejected(err)).toBe(false);
  });

  it("timeout (aborted request) keeps the session", async () => {
    const err = await failureOf(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(isSessionRejected(err)).toBe(false);
  });

  it("anything that is not a 401 is not a rejection", () => {
    expect(isSessionRejected(new Error("boom"))).toBe(false);
    expect(isSessionRejected(undefined)).toBe(false);
    expect(isSessionRejected(new ApiError({ status: 401, method: "GET", endpoint: "/v1/auth-user", url: "x" }))).toBe(true);
  });
});
