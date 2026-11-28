import { afterEach, describe, expect, it, vi } from "vitest";
import { safeGetItem, safeRemoveItem, safeSetItem } from "./safe-storage";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  };
}

function securityError() {
  const e = new Error("The operation is insecure.");
  e.name = "SecurityError";
  return e;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("safe-storage", () => {
  it("behaves like plain localStorage when storage works", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
    expect(safeGetItem("k")).toBeNull();
    expect(safeSetItem("k", "v")).toBe(true);
    expect(safeGetItem("k")).toBe("v");
    expect(safeGetItem("k", "session")).toBeNull(); // separate store
    expect(safeRemoveItem("k")).toBe(true);
    expect(safeGetItem("k")).toBeNull();
  });

  it("uses sessionStorage when asked", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
    expect(safeSetItem("s", "1", "session")).toBe(true);
    expect(safeGetItem("s", "session")).toBe("1");
    expect(safeGetItem("s")).toBeNull();
  });

  it("never throws when reading the localStorage property itself throws (Facebook/Instagram in-app browser)", () => {
    const win = {};
    Object.defineProperty(win, "localStorage", {
      get() {
        throw securityError();
      },
    });
    vi.stubGlobal("window", win);
    expect(safeGetItem("k")).toBeNull();
    expect(safeSetItem("k", "v")).toBe(false);
    expect(safeRemoveItem("k")).toBe(false);
  });

  it("never throws when getItem/setItem/removeItem throw (blocked or quota exceeded)", () => {
    const throwing = {
      getItem: () => {
        throw securityError();
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw securityError();
      },
    };
    vi.stubGlobal("window", { localStorage: throwing });
    expect(safeGetItem("k")).toBeNull();
    expect(safeSetItem("k", "v")).toBe(false);
    expect(safeRemoveItem("k")).toBe(false);
  });

  it("server render (no window): reads null, writes skipped", () => {
    // vitest's node environment has no window unless a test stubs one.
    expect(typeof window).toBe("undefined");
    expect(safeGetItem("k")).toBeNull();
    expect(safeSetItem("k", "v")).toBe(false);
    expect(safeRemoveItem("k")).toBe(false);
  });
});
