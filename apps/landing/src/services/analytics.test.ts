import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// flushAmplitude: sends the Amplitude queue before a redirect unloads the page, never rejects, never waits long.
// The SDK is mocked here; the real SDK's behaviour (an event tracked right before location.replace is lost without a
// flush, kept with one) was checked in a browser against @amplitude/analytics-browser 2.45.1.

type FlushImpl = () => { promise: Promise<unknown> };

function installWindow(hostname: string) {
  vi.stubGlobal("window", { location: { hostname, search: "" }, localStorage: { getItem: () => null } });
  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Linux; Android 13) Mobile" });
}

async function load(flush: FlushImpl) {
  vi.resetModules();
  const sdk = {
    init: vi.fn(),
    track: vi.fn(),
    flush: vi.fn(flush),
    identify: vi.fn(),
    setUserId: vi.fn(),
    reset: vi.fn(),
    Identify: class {
      set() {
        return this;
      }
    },
  };
  vi.doMock("@amplitude/analytics-browser", () => sdk);
  const mod = await import("./analytics");
  return { mod, sdk };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.doUnmock("@amplitude/analytics-browser");
});

describe("flushAmplitude", () => {
  it("analytics off on this host and the SDK never started -> resolves at once, nothing is flushed", async () => {
    installWindow("localhost");
    const { mod, sdk } = await load(() => ({ promise: Promise.resolve() }));
    let done = false;
    void mod.flushAmplitude(500).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
    expect(sdk.flush).not.toHaveBeenCalled();
  });

  it("started: flushes and resolves as soon as the SDK has sent (well before the cap)", async () => {
    installWindow("clearcutoff.in");
    const { mod, sdk } = await load(() => ({ promise: new Promise((r) => setTimeout(r, 150)) }));
    await mod.initAmplitude();
    let done = false;
    void mod.flushAmplitude(500).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(100);
    expect(sdk.flush).toHaveBeenCalledTimes(1);
    expect(done).toBe(false); // still sending
    await vi.advanceTimersByTimeAsync(60);
    expect(done).toBe(true); // ~160 ms, not 500
  });

  it("a flush that never finishes is cut at the cap, so a redirect is never trapped behind a slow network", async () => {
    installWindow("clearcutoff.in");
    const { mod } = await load(() => ({ promise: new Promise(() => undefined) }));
    await mod.initAmplitude();
    let done = false;
    void mod.flushAmplitude(500).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
  });

  it("a failing flush (rejected promise or a throw) still resolves and never throws", async () => {
    installWindow("clearcutoff.in");
    const rejecting = await load(() => ({ promise: Promise.reject(new Error("network")) }));
    await rejecting.mod.initAmplitude();
    await expect(rejecting.mod.flushAmplitude(500)).resolves.toBeUndefined();

    installWindow("clearcutoff.in");
    const throwing = await load(() => {
      throw new Error("sdk broke");
    });
    await throwing.mod.initAmplitude();
    await expect(throwing.mod.flushAmplitude(500)).resolves.toBeUndefined();
  });

  it("SDK still starting (events queued): the wait is bounded by the cap, then the redirect proceeds", async () => {
    installWindow("clearcutoff.in");
    const { mod, sdk } = await load(() => ({ promise: Promise.resolve() }));
    let done = false;
    void mod.flushAmplitude(500).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
    expect(sdk.flush).not.toHaveBeenCalled(); // runs after init; the timer already let the page go
  });
});
