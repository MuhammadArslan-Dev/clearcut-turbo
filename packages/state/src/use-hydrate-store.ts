import { useEffect } from "react";

interface PersistedStoreApi {
  // Optional on purpose: when localStorage is blocked (SecurityError in Facebook/Instagram in-app
  // browsers, some private modes) zustand builds the store WITHOUT its `persist` API.
  persist?: { rehydrate: () => void | Promise<void> };
}

/**
 * Triggers the deferred localStorage read for a store created with
 * `createPersistedStore` (which sets `skipHydration: true` specifically so
 * this doesn't happen automatically — see create-persisted-store.ts for why).
 *
 * Call this once, from a mounted client component (a root provider is the
 * natural place) — the `useEffect` guarantees it runs strictly after the
 * initial commit, i.e. after hydration has already succeeded, so applying
 * the real persisted value here can't cause a hydration mismatch.
 *
 *   useHydrateStore(useLanguageStore);
 */
export function useHydrateStore(store: PersistedStoreApi): void {
  useEffect(() => {
    // Storage blocked => no `persist` API => nothing to rehydrate; the store keeps its defaults
    // instead of crashing the page (Sentry CLEARCUTOFF-PUBLIC-4/5).
    store.persist?.rehydrate();
    // Only ever needs to run once per mount — store identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
