import { useSyncExternalStore } from "react";

/**
 * Consolidated from three byte-identical copies (apps/landing, apps/blog,
 * and packages/auth) during Phase 4 — a plain viewport-width check, not
 * auth-specific, so it belongs here rather than trapped inside the auth
 * package.
 *
 * One shared matchMedia subscription for every caller (a blog question page
 * has ~100 of them): each caller used to add its own `resize` listener, and
 * mobile browsers fire `resize` while scrolling as the address bar shows and
 * hides. `(max-width: 767px)` is the same test as `innerWidth < 768`, and its
 * `change` event only fires when the width crosses 768px.
 *
 * Server render and hydration still see `false` (getServerSnapshot), exactly
 * as before; components mounted later on the client get the real value on
 * their first render instead of `false` and a correction one frame later.
 */
const QUERY = "(max-width: 767px)";

let mql: MediaQueryList | null = null;
const listeners = new Set<() => void>();

function onChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!mql) {
    mql = window.matchMedia(QUERY);
    // Safari < 14 only has the older addListener API.
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return (mql ?? window.matchMedia(QUERY)).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
