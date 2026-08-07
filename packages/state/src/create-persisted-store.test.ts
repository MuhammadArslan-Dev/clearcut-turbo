import { describe, expect, it } from "vitest";
import { createJSONStorage } from "zustand/middleware";
import { createPersistedStore } from "./create-persisted-store";

type LanguageState = {
  language: string;
  setLanguage: (language: string) => void;
};

// Raw string-keyed storage (mirrors localStorage's API) wrapped in
// createJSONStorage — matching how apps actually configure this factory
// (e.g. `createJSONStorage(() => localStorage)`), so `persist` gets back
// already-parsed `{state, version}` values instead of raw JSON strings.
function createInMemoryStorage() {
  const store = new Map<string, string>();
  const raw = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  return { raw, storage: createJSONStorage<LanguageState>(() => raw) };
}

describe("createPersistedStore", () => {
  it("produces a working store with the given initial state", () => {
    const useLanguage = createPersistedStore<LanguageState>(
      "languageStore",
      (set) => ({
        language: "en",
        setLanguage: (language) => set({ language }),
      }),
      { name: "language-test", storage: createInMemoryStorage().storage },
    );

    expect(useLanguage.getState().language).toBe("en");
  });

  it("always sets skipHydration, so it never auto-hydrates on creation", () => {
    const useLanguage = createPersistedStore<LanguageState>(
      "languageStore",
      (set) => ({
        language: "en",
        setLanguage: (language) => set({ language }),
      }),
      { name: "language-test", storage: createInMemoryStorage().storage },
    );

    // With skipHydration: true, the store must NOT report itself as
    // hydrated until something explicitly calls persist.rehydrate() (see
    // useHydrateStore) — this is the load-bearing SSR-mismatch fix this
    // factory exists for.
    expect(useLanguage.persist.hasHydrated()).toBe(false);
  });

  it("becomes hydrated only after an explicit rehydrate() call", async () => {
    const { raw, storage } = createInMemoryStorage();
    raw.setItem("language-test", JSON.stringify({ state: { language: "hi" }, version: 0 }));

    const useLanguage = createPersistedStore<LanguageState>(
      "languageStore",
      (set) => ({
        language: "en",
        setLanguage: (language) => set({ language }),
      }),
      { name: "language-test", storage },
    );

    expect(useLanguage.getState().language).toBe("en");

    await useLanguage.persist.rehydrate();

    expect(useLanguage.persist.hasHydrated()).toBe(true);
    expect(useLanguage.getState().language).toBe("hi");
  });
});
