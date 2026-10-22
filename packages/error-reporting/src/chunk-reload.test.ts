import { afterEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadOnceForChunkError } from "./chunk-reload";
import { applyLegacyPolyfills } from "./legacy-polyfills";

describe("isChunkLoadError", () => {
  it("matches webpack, Turbopack, CSS and native dynamic-import wordings", () => {
    expect(isChunkLoadError(new Error("Failed to load chunk /_next/static/chunks/abc.js from module 123"))).toBe(true);
    expect(isChunkLoadError(new Error("Loading chunk 42 failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Loading CSS chunk 7 failed"))).toBe(true);
    expect(isChunkLoadError("No link element found for chunk /_next/static/chunks/x.css")).toBe(true);
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://a/b.js"))).toBe(true);
    expect(isChunkLoadError(Object.assign(new Error("x"), { name: "ChunkLoadError" }))).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError({})).toBe(false);
  });
});

describe("reloadOnceForChunkError", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function stubWindow(storage: Storage | (() => never)) {
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { reload },
      get sessionStorage() {
        if (typeof storage === "function") return storage();
        return storage;
      },
    });
    return reload;
  }

  function memoryStorage(): Storage {
    const m = new Map<string, string>();
    return {
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => void m.set(k, String(v)),
      removeItem: (k) => void m.delete(k),
      clear: () => m.clear(),
      key: () => null,
      get length() {
        return m.size;
      },
    };
  }

  it("reloads once, not again within a minute (no loop), again after it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T10:00:00Z"));
    const reload = stubWindow(memoryStorage());
    expect(reloadOnceForChunkError()).toBe(true);
    expect(reloadOnceForChunkError()).toBe(false);
    vi.setSystemTime(new Date("2026-10-22T10:00:59Z"));
    expect(reloadOnceForChunkError()).toBe(false);
    vi.setSystemTime(new Date("2026-10-22T10:01:01Z"));
    expect(reloadOnceForChunkError()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("never reloads without sessionStorage (it couldn't stop a loop)", () => {
    const reload = stubWindow(() => {
      throw new Error("SecurityError");
    });
    expect(reloadOnceForChunkError()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("applyLegacyPolyfills", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("adds a working .at() only where it is missing", () => {
    vi.stubGlobal("window", {});
    const original = Array.prototype.at;
    // Simulate an old browser.
    delete (Array.prototype as { at?: unknown }).at;
    try {
      applyLegacyPolyfills();
      expect([1, 2, 3].at(-1)).toBe(3);
      expect([1, 2, 3].at(0)).toBe(1);
      expect([1, 2, 3].at(5)).toBeUndefined();
      expect([1, 2, 3].at(-4)).toBeUndefined();
    } finally {
      Object.defineProperty(Array.prototype, "at", { value: original, writable: true, configurable: true });
    }
    const native = String.prototype.at;
    applyLegacyPolyfills();
    expect(String.prototype.at).toBe(native);
  });
});
