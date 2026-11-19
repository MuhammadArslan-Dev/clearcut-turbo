import { useEffect } from "react";

interface PersistedStoreApi {
  persist: { rehydrate: () => void | Promise<void> };
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
    store.persist.rehydrate();
    // Only ever needs to run once per mount — store identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
