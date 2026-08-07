import { createJSONStorage } from "zustand/middleware";
import { createPersistedStore } from "@clearcut/state/create-persisted-store";

interface LanguageState {
  courseLanguage: string;
  appLanguage: string;
  setCourseLanguage: (language: string) => void;
  setAppLanguage: (language: string) => void;
}

const STORAGE_KEY = "language-settings";

// Phase 3 (Global State): previously this store BOTH read localStorage
// directly in its initializer (the old getStoredValue() helper, removed)
// AND used `persist` middleware, which also reads localStorage — two
// independent reads racing, and a textbook cause of SSR hydration
// mismatches (see create-persisted-store.ts for the full mechanism).
// createPersistedStore's skipHydration means this store now always starts
// at the plain defaults below on both server and first client paint; the
// real persisted value is applied afterward via useHydrateStore, called
// once from MainThemeProvider.
type PersistedLanguageState = Pick<LanguageState, "courseLanguage" | "appLanguage">;

export const useLanguageStore = createPersistedStore<LanguageState, PersistedLanguageState>(
  "languageStore",
  (set) => ({
    courseLanguage: "en",
    appLanguage: "en",

    setCourseLanguage: (language: string) => set({ courseLanguage: language }),
    setAppLanguage: (language: string) => set({ appLanguage: language }),
  }),
  {
    name: STORAGE_KEY, // unique name for localStorage key
    storage: createJSONStorage(() => localStorage), // use localStorage
    // Only persist these fields, not the setter functions.
    partialize: (state) => ({
      courseLanguage: state.courseLanguage,
      appLanguage: state.appLanguage,
    }),
  },
);
