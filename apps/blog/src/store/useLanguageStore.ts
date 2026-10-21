import { createJSONStorage } from "zustand/middleware";
import { createPersistedStore } from "@clearcut/state/create-persisted-store";

interface LanguageState {
  courseLanguage: string;
  /** True once the visitor picked a course language themselves (language
   * modal). Until then question pages follow the URL's locale — see
   * lib/question-bank/use-course-lang.ts. */
  courseLanguageChosen: boolean;
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
type PersistedLanguageState = Pick<LanguageState, "courseLanguage" | "courseLanguageChosen" | "appLanguage">;

export const useLanguageStore = createPersistedStore<LanguageState, PersistedLanguageState>(
  "languageStore",
  (set) => ({
    courseLanguage: "en",
    courseLanguageChosen: false,
    appLanguage: "en",

    setCourseLanguage: (language: string) => set({ courseLanguage: language, courseLanguageChosen: true }),
    setAppLanguage: (language: string) => set({ appLanguage: language }),
  }),
  {
    name: STORAGE_KEY, // unique name for localStorage key
    storage: createJSONStorage(() => localStorage), // use localStorage
    // Only persist these fields, not the setter functions.
    partialize: (state) => ({
      courseLanguage: state.courseLanguage,
      courseLanguageChosen: state.courseLanguageChosen,
      appLanguage: state.appLanguage,
    }),
  },
);
