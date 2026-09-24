import { create } from "zustand";

interface State {
  /** True while a Link click or router.push()/replace() navigation is in
   * flight — drives the top progress bar and the click-shield overlay in
   * NavigationProgress. The per-element spinner (the clicked button/card
   * itself) is handled separately via a DOM attribute, not this store —
   * see markNavPending()/clearNavPending() below. */
  isPending: boolean;
  start: () => void;
  clear: () => void;
}

export const useNavLoadingStore = create<State>((set) => ({
  isPending: false,
  start: () => set({ isPending: true }),
  clear: () => set({ isPending: false }),
}));

/* -------------------------------------------------------------------------- */
/* Per-element "this exact button/link/card is loading" marker               */
/* -------------------------------------------------------------------------- */

let pendingEl: HTMLElement | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Marks the clicked DOM element as navigation-pending (dims it, shows a
 * spinner, blocks further clicks on it — see the `[data-nav-pending]` rule
 * in globals.css) without any per-component wiring: works for a `<Button>`,
 * a plain card `<div>`, anything. Only one element is ever marked — a new
 * click clears the previous one first, so clicking a different link mid
 * navigation moves the spinner instead of leaving two stuck.
 *
 * The 10s safety timeout guards against a navigation that never resolves
 * (a thrown error, a cancelled request) leaving the element permanently
 * disabled — normal navigations clear it well before this via
 * NavigationProgress's pathname-change effect.
 */
export function markNavPending(el: Element | null) {
  clearNavPending();
  if (!(el instanceof HTMLElement)) return;
  el.setAttribute("data-nav-pending", "true");
  pendingEl = el;
  pendingTimeout = setTimeout(clearNavPending, 10000);
}

export function clearNavPending() {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  pendingEl?.removeAttribute("data-nav-pending");
  pendingEl = null;
}
