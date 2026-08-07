import { create, StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * NOT a shared store. This package holds no state and no shapes — every
 * store still lives inside its own app. This is a thin wrapper around
 * zustand's `create()` that applies Redux DevTools naming consistently, so
 * each app doesn't hand-roll the same `devtools(...)` boilerplate and
 * every store shows up named (not "state") in the DevTools panel.
 *
 * Usage (inside an app, not this package):
 *   export const useAuthModal = createStore<AuthModalState>(
 *     "authModalStore",
 *     (set) => ({ ...initial state and actions... }),
 *   );
 */
export function createStore<T>(
  name: string,
  initializer: StateCreator<T, [["zustand/devtools", never]], []>,
) {
  return create<T>()(
    devtools(initializer, {
      name,
      enabled: process.env.NODE_ENV !== "production",
    }),
  );
}
