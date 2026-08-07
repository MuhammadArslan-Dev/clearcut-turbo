import { create, StateCreator } from "zustand";
import { devtools, persist, PersistOptions } from "zustand/middleware";

/**
 * Like `createStore`, but for state that needs to survive a reload via
 * localStorage. Always sets `skipHydration: true` — this is the load-bearing
 * part, not an optional tweak.
 *
 * Without it, Zustand's `persist` middleware reads localStorage synchronously
 * while the store module is evaluated. On the server that read is a no-op
 * (no `window`), so SSR always renders the plain default state — but on the
 * client the same module evaluation *does* have `window`, and runs before
 * React's hydration pass reconciles the SSR HTML. The result: the very first
 * client render can already reflect a different value than what the server
 * sent down, which React reports as a hydration mismatch (and, worse, tears
 * down and rebuilds the tree to recover).
 *
 * `skipHydration: true` stops that automatic read, so server and first
 * client paint render identically — no mismatch is possible. The actual
 * localStorage read then happens explicitly, after hydration has already
 * succeeded, via `useHydrateStore` (see ./use-hydrate-store.ts) called once
 * from a mounted client component.
 *
 * Usage:
 *   export const useLanguageStore = createPersistedStore<LanguageState>(
 *     "languageStore",
 *     (set) => ({ ...initial state and actions... }),
 *     { name: "language-settings", partialize: (s) => ({ courseLanguage: s.courseLanguage }) },
 *   );
 *   // once, in a mounted client component (e.g. a root provider):
 *   useHydrateStore(useLanguageStore);
 */
export function createPersistedStore<T, PersistedState = T>(
  name: string,
  initializer: StateCreator<
    T,
    [["zustand/devtools", never], ["zustand/persist", unknown]],
    []
  >,
  persistOptions: Omit<PersistOptions<T, PersistedState>, "skipHydration">,
) {
  return create<T>()(
    devtools(
      persist(initializer, { ...persistOptions, skipHydration: true }),
      { name, enabled: process.env.NODE_ENV !== "production" },
    ),
  );
}
