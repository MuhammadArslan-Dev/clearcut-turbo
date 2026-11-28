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

// flushAmplitudeBeforeUnload: what the post-login redirects (/start, modal, InlineAuthFlow) await. The fake SDK below
// mimics the real one (@amplitude/analytics-browser 2.45.1): track() returns a promise that settles once the event's
// upload is done; flush() is skipped while an earlier upload is still in flight.
describe("flushAmplitudeBeforeUnload", () => {
  type Pending = { resolve: () => void };

  function installBrowser(hostname: string, withBeacon = true) {
    vi.stubGlobal("window", { location: { hostname, search: "" }, localStorage: { getItem: () => null } });
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Linux; Android 13) Mobile",
      ...(withBeacon ? { sendBeacon: () => true } : {}),
    });
  }

  async function loadSdk(opts: { flushesSkippedFirst?: number; neverSend?: boolean; throwing?: boolean } = {}) {
    vi.resetModules();
    const queued: Pending[] = [];
    let flushCalls = 0;
    const calls: string[] = [];
    const sdk = {
      init: vi.fn(),
      track: vi.fn(() => {
        let resolve!: () => void;
        const promise = new Promise<void>((r) => (resolve = r));
        queued.push({ resolve });
        return { promise };
      }),
      flush: vi.fn(() => {
        calls.push("flush");
        if (opts.throwing) throw new Error("sdk broke");
        flushCalls += 1;
        if (!opts.neverSend && flushCalls > (opts.flushesSkippedFirst ?? 0)) queued.splice(0).forEach((q) => q.resolve());
        return { promise: Promise.resolve() };
      }),
      setTransport: vi.fn(() => {
        calls.push("setTransport");
        if (opts.throwing) throw new Error("sdk broke");
      }),
      identify: vi.fn(() => ({ promise: Promise.resolve() })),
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
    return { mod, sdk, calls };
  }

  function watch(p: Promise<void>) {
    const s = { done: false };
    void p.then(() => (s.done = true));
    return s;
  }

  it("analytics off on this host: resolves at once and touches nothing (localhost, previews)", async () => {
    installBrowser("localhost");
    const { mod, sdk } = await loadSdk();
    const s = watch(mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(0);
    expect(s.done).toBe(true);
    expect(sdk.setTransport).not.toHaveBeenCalled();
    expect(sdk.flush).not.toHaveBeenCalled();
  });

  it("switches to the beacon transport BEFORE flushing and resolves once the tracked event is handed over", async () => {
    installBrowser("clearcutoff.in");
    const { mod, sdk, calls } = await loadSdk();
    await mod.initAmplitude();
    mod.logAmplitudeEvent("Authentication Outcome", { outcome: "successful" });
    const s = watch(mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(0);
    expect(sdk.setTransport).toHaveBeenCalledWith("beacon");
    expect(calls.indexOf("setTransport")).toBeLessThan(calls.indexOf("flush"));
    expect(s.done).toBe(true); // a few ms, not the cap
  });

  it("an upload already in flight makes the SDK skip the first flush: it asks again and still resolves before the cap", async () => {
    installBrowser("clearcutoff.in");
    const { mod, sdk } = await loadSdk({ flushesSkippedFirst: 2 });
    await mod.initAmplitude();
    mod.logAmplitudeEvent("Authentication Outcome", { outcome: "successful" });
    const s = watch(mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(60);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(50);
    expect(s.done).toBe(true); // third flush at ~100 ms sent it
    expect(sdk.flush.mock.calls.length).toBe(3);
    await vi.advanceTimersByTimeAsync(500);
    expect(sdk.flush.mock.calls.length).toBe(3); // stops asking once done
  });

  it("an event that never gets out is cut at the 600 ms cap, so the redirect always happens", async () => {
    installBrowser("clearcutoff.in");
    const { mod } = await loadSdk({ neverSend: true });
    await mod.initAmplitude();
    mod.logAmplitudeEvent("Authentication Outcome", { outcome: "successful" });
    const s = watch(mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(599);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(s.done).toBe(true);
    expect(mod.UNLOAD_FLUSH_MAX_MS).toBe(600);
  });

  it("no sendBeacon in this browser: keeps the default transport and still flushes", async () => {
    installBrowser("clearcutoff.in", false);
    const { mod, sdk } = await loadSdk();
    await mod.initAmplitude();
    mod.logAmplitudeEvent("Authentication Outcome", { outcome: "successful" });
    await expect(mod.flushAmplitudeBeforeUnload()).resolves.toBeUndefined();
    expect(sdk.setTransport).not.toHaveBeenCalled();
    expect(sdk.flush).toHaveBeenCalled();
  });

  it("an SDK that throws never breaks the redirect: resolves (at the cap at worst), never rejects", async () => {
    installBrowser("clearcutoff.in");
    const { mod } = await loadSdk({ throwing: true });
    await mod.initAmplitude();
    mod.logAmplitudeEvent("Authentication Outcome", { outcome: "successful" });
    const s = watch(mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(601);
    expect(s.done).toBe(true);
  });

  it("SDK still starting: bounded by the cap; nothing tracked: resolves right after one flush", async () => {
    installBrowser("clearcutoff.in");
    const starting = await loadSdk();
    const s = watch(starting.mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(599);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(s.done).toBe(true);

    installBrowser("clearcutoff.in");
    const idle = await loadSdk();
    await idle.mod.initAmplitude();
    const s2 = watch(idle.mod.flushAmplitudeBeforeUnload());
    await vi.advanceTimersByTimeAsync(0);
    expect(s2.done).toBe(true);
    expect(idle.sdk.flush).toHaveBeenCalledTimes(1);
  });
});
