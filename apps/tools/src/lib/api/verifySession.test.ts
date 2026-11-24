import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifySession } from "./verifySession";

// Phase 127: the backend login check before an OTP-required download. Runs the REAL
// authedRequest against a stubbed fetch + localStorage (vitest runs in node).
const TOKEN_KEY = "CSRF_TOKEN";
let store: Record<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  store = { [TOKEN_KEY]: "token-123" };
  const localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => void (store[k] = v),
    removeItem: (k: string) => void delete store[k],
  };
  fetchMock = vi.fn();
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", { localStorage, dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {} });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifySession", () => {
  it("valid token → 'valid', one GET /v1/auth-user with the bearer token, token kept", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { status: "success", message: "Success", data: { id: 1 } }));
    await expect(verifySession()).resolves.toBe("valid");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/v1\/auth-user$/);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(store[TOKEN_KEY]).toBe("token-123");
  });

  it("401 → 'expired' and the local token is cleared (OTP again)", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { message: "Unauthenticated." }));
    await expect(verifySession()).resolves.toBe("expired");
    expect(store[TOKEN_KEY]).toBeUndefined();
  });

  it("no token → 'expired' without any request", async () => {
    delete store[TOKEN_KEY];
    await expect(verifySession()).resolves.toBe("expired");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("network error → 'error', token kept (no lock-out, no bypass)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(verifySession()).resolves.toBe("error");
    expect(store[TOKEN_KEY]).toBe("token-123");
  });

  it("500 and 403 → 'error', token kept", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "Server Error" }));
    await expect(verifySession()).resolves.toBe("error");
    fetchMock.mockResolvedValueOnce(json(403, { message: "Forbidden" }));
    await expect(verifySession()).resolves.toBe("error");
    expect(store[TOKEN_KEY]).toBe("token-123");
  });

  it("a hung request is aborted after the timeout → 'error'", async () => {
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))),
    );
    await expect(verifySession(undefined, 20)).resolves.toBe("error");
    expect(store[TOKEN_KEY]).toBe("token-123");
  });
});
