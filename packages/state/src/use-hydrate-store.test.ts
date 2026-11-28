import { describe, expect, it, vi } from "vitest";
import { createJSONStorage } from "zustand/middleware";

// Run the effect immediately: this tests what the hook does, not React's scheduling.
vi.mock("react", () => ({ useEffect: (fn: () => void) => fn() }));

import { createPersistedStore } from "./create-persisted-store";
import { useHydrateStore } from "./use-hydrate-store";

type S = { userId: string; setUserId: (v: string) => void };

function securityError() {
  const e = new Error("The operation is insecure.");
  e.name = "SecurityError";
  return e;
}

describe("useHydrateStore with blocked storage (Facebook/Instagram in-app browser)", () => {
  it("zustand builds the store WITHOUT a persist API when the storage getter throws", () => {
    const useStore = createPersistedStore<S>(
      "blocked",
      (set) => ({ userId: "", setUserId: (userId) => set({ userId }) }),
      {
        name: "blocked-test",
        storage: createJSONStorage<S>(() => {
          throw securityError();
        }),
      },
    );
    // The assumption behind the optional chaining in use-hydrate-store.ts.
    expect((useStore as unknown as { persist?: unknown }).persist).toBeUndefined();

    // Does not throw (it used to: "Cannot read properties of undefined (reading 'rehydrate')").
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(() => useHydrateStore(useStore as unknown as Parameters<typeof useHydrateStore>[0])).not.toThrow();

    // The store keeps working in memory.
    useStore.getState().setUserId("u-1");
    expect(useStore.getState().userId).toBe("u-1");
    warn.mockRestore();
  });

  it("still rehydrates when storage works", () => {
    const rehydrate = vi.fn();
    useHydrateStore({ persist: { rehydrate } });
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });
});
