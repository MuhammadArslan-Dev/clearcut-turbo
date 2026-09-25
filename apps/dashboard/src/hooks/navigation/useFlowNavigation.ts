"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Origin-aware, history-safe navigation for multi-step flows (Daily Test,
 * Test Series list → attempt → result, Preparation's mobile topic view).
 *
 * Problem it solves: "back to X" / "after submit" / "close this layer"
 * controls used to `router.push(X)`, so X entered the browser history a
 * second time and browser-back / mobile swipe-back replayed the whole chain
 * (Result → Attempt → List → …) instead of going to where the user really
 * came from.
 *
 * How: every history entry created through this hook is tagged (in
 * `history.state`, which survives refresh and back/forward) with the URL it
 * was opened from. Going "up" then either
 *   - pops (`router.back()`) when the previous entry IS the target — no
 *     duplicate is ever created, or
 *   - swaps the current entry in place (`replace`) when it isn't (deep link,
 *     opened from outside the flow) — still no duplicate.
 * The destination is never hard-coded to "the parent": it is whatever page
 * actually opened this one, so the same screen reached from two places goes
 * back to the right one each time.
 *
 * Deliberately scoped: callers opt in per flow. It does NOT change the
 * shared `useRouter`/`Link` in `@/i18n/navigation`.
 */

const FROM_KEY = "flowFrom";
const INTENT_TTL_MS = 5000;
const BASE = "http://flow.local";

type Intent = { to: string; from: string | null; at: number };

// Set right before a flow-initiated navigation, consumed once by the
// destination page's mount effect to tag the new history entry.
let pendingIntent: Intent | null = null;

// `router.replace()` (used app-wide, e.g. by useQueryParams) rebuilds
// history.state from scratch and drops our tag. The origin is therefore also
// remembered per pathname for the lifetime of the document, as a fallback
// for exactly that case (a hard refresh still has history.state's copy for
// every entry that was never router.replace()d).
const originByPath = new Map<string, string | null>();

const parse = (url: string) => new URL(url, BASE);
export const flowPathOf = (url: string) => parse(url).pathname;
const normalize = (url: string) => {
  const u = parse(url);
  u.searchParams.sort();
  return u.pathname + u.search;
};

const stateHasTag = () => {
  const state = window.history.state as Record<string, unknown> | null;
  return !!state && FROM_KEY in state;
};

/** undefined = never tagged; null = tagged, opened from outside the flow. */
const readOrigin = (pathname: string): string | null | undefined => {
  const state = window.history.state as Record<string, unknown> | null;
  if (state && FROM_KEY in state) return state[FROM_KEY] as string | null;
  return originByPath.get(pathname);
};

type QueryValues = Record<string, string | number | boolean | null | undefined>;

const applyValues = (url: URL, values: QueryValues) => {
  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  });
  return url;
};

export function useFlowNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Tag this entry once. Back/forward onto an already-tagged entry is a
  // no-op, so the tag always reflects how the entry was first created.
  useEffect(() => {
    if (stateHasTag()) return;
    const intent = pendingIntent;
    pendingIntent = null;
    const current = pathname + window.location.search;
    const fromIntent =
      intent && Date.now() - intent.at < INTENT_TTL_MS && normalize(intent.to) === normalize(current);
    const from = fromIntent ? intent.from : (originByPath.get(pathname) ?? null);
    originByPath.set(pathname, from);
    // Spreading the current state keeps Next's own `__NA` / tree fields.
    window.history.replaceState({ ...window.history.state, [FROM_KEY]: from }, "");
  }, [pathname]);

  /** Forward navigation to another route — adds an entry tagged with this one. */
  const push = useCallback(
    (to: string) => {
      pendingIntent = { to, from: pathnameRef.current + window.location.search, at: Date.now() };
      router.push(to);
    },
    [router],
  );

  /** Swap the current entry; the new one inherits this entry's origin. */
  const replace = useCallback(
    (to: string) => {
      pendingIntent = {
        to,
        from: readOrigin(pathnameRef.current) ?? null,
        at: Date.now(),
      };
      router.replace(to);
    },
    [router],
  );

  /** URL (locale-less path + query) this entry was opened from. */
  const origin = useCallback(() => readOrigin(pathnameRef.current), []);

  /** Plain pop of the previous history entry. */
  const back = useCallback(() => router.back(), [router]);

  /** "Back to X": pop to X if it is the previous entry, else swap in place. */
  const goUp = useCallback(
    (to: string) => {
      const from = readOrigin(pathnameRef.current);
      if (from && flowPathOf(from) === flowPathOf(to)) {
        router.back();
      } else {
        replace(to);
      }
    },
    [router, replace],
  );

  /**
   * Same-page layer (e.g. mobile topic view = `?topic=true`): a NEW history
   * entry so swipe-back closes the layer, tagged with the URL it came from.
   * Uses the native History API (Next syncs useSearchParams from it) so the
   * tag is set at creation — no intent/mount round-trip needed.
   */
  const pushQuery = useCallback((values: QueryValues) => {
    const from = pathnameRef.current + window.location.search;
    const url = applyValues(new URL(window.location.href), values);
    window.history.pushState({ [FROM_KEY]: from }, "", url.pathname + url.search);
  }, []);

  /**
   * Close a `pushQuery` layer: pop back to the entry that opened it when the
   * previous entry really is the same page without that layer; otherwise
   * (deep link / refresh into the layer) rewrite the URL in place. Never
   * pushes — so opening/closing layers repeatedly can't stack entries.
   */
  const popQuery = useCallback(
    (values: QueryValues) => {
      const from = readOrigin(pathnameRef.current);
      if (from && flowPathOf(from) === pathnameRef.current) {
        const o = parse(from);
        const restores = Object.entries(values).every(([key, value]) =>
          value === null || value === undefined || value === ""
            ? !o.searchParams.has(key)
            : o.searchParams.get(key) === String(value),
        );
        if (restores) {
          router.back();
          return;
        }
      }
      const url = applyValues(new URL(window.location.href), values);
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    },
    [router],
  );

  // Stable identity: callers list it in useCallback/useEffect deps.
  return useMemo(
    () => ({ push, replace, goUp, back, origin, pushQuery, popQuery }),
    [push, replace, goUp, back, origin, pushQuery, popQuery],
  );
}
