import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/browser";

/** CC-152: how long a screen may stay on its skeleton before we say so. */
export const SLOW_LOAD_MS = 10_000;

/**
 * True once `loading` has lasted SLOW_LOAD_MS, false again when it ends.
 * Sends "Slow Load Shown" once per wait. `retry()` reports "Slow Load
 * Retried", restarts the clock and re-requests `queryKeys` — a single request
 * the student asked for, never an automatic retry loop (CC-146).
 *
 * The caller passes query KEYS rather than its own `refetch`, because a plain
 * refetch does not actually re-request in the one state this hook exists for.
 * react-query's Query.fetch() short-circuits like this:
 *
 *     if (this.state.fetchStatus !== 'idle') {
 *       if (this.state.data !== undefined && fetchOptions?.cancelRefetch) {
 *         this.cancel({ silent: true })        // only reached WITH data
 *       } else if (this.#retryer) {
 *         return this.#retryer.promise         // hands back the in-flight one
 *       }
 *     }
 *
 * So while a first load is still in flight with `data === undefined` — exactly
 * when this notice is on screen — `refetch()` returns the pending promise and
 * sends nothing, even though `cancelRefetch` defaults to true. A Playwright run
 * on all four screens confirmed zero new requests per "Try again" click.
 * Cancelling first puts the query back to idle so the refetch below really does
 * open a new request; owning that here means no call site can get it wrong.
 */
export function useSlowLoad(loading: boolean, pageContext: string, queryKeys: QueryKey[]) {
  const [slow, setSlow] = useState(false);
  const startedAt = useRef<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const queryClient = useQueryClient();

  // queryKeys is normally a fresh array literal each render; key the callback
  // off its contents so `retry` stays stable between real key changes.
  const keysFingerprint = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!loading) {
      startedAt.current = null;
      setSlow(false);
      return;
    }
    startedAt.current ??= Date.now();
    const timer = window.setTimeout(() => {
      setSlow(true);
      trackEvent("Slow Load Shown", {
        page_context: pageContext,
        seconds_waited: Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000),
      });
    }, SLOW_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [loading, pageContext, cycle]);

  const retry = useCallback(async () => {
    trackEvent("Slow Load Retried", {
      page_context: pageContext,
      seconds_waited: Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000),
    });
    startedAt.current = Date.now();
    setSlow(false);
    setCycle((c) => c + 1);

    const keys: QueryKey[] = JSON.parse(keysFingerprint);
    // Cancel before refetching — see the docblock. `cancelQueries` reverts the
    // query to its pre-fetch state, which for a first load is idle, so the
    // refetch that follows is a genuinely new request.
    await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
    await Promise.all(
      keys.map((queryKey) => queryClient.refetchQueries({ queryKey, type: "active" })),
    );
  }, [pageContext, keysFingerprint, queryClient]);

  return { slow, retry };
}
