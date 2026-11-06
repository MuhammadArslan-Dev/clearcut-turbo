"use client";

import { useEffect, useState } from "react";

/** One Lesson Path loop (`--cc-loop` in @clearcut/motion's CCLoader). */
export const LOADER_LOOP_MS = 3200;
/** The loader's CSS fade-in delay: a load that ends before this never showed it. */
export const LOADER_DELAY_MS = 250;

/**
 * Lets the loader finish its animation. Pass the real `loading` flag; render the loader while this returns true.
 * - While `loading`, it returns true (same as before).
 * - If the loader was actually visible (loading lasted longer than its 250 ms fade-in delay), it keeps returning true
 *   after loading ends, until the CURRENT loop of the animation completes (at most one loop, 3.2 s), so the loader
 *   is never cut off mid-hop.
 * - If loading ended before the loader even appeared (fast loads) it adds nothing: no extra wait.
 * State is adjusted during render (not in an effect), so there is no frame where neither loader nor content shows.
 */
export function useLoaderHold(loading: boolean): boolean {
  const [st, setSt] = useState(() => ({ prev: loading, startedAt: loading ? Date.now() : 0, holdUntil: 0 }));

  if (st.prev !== loading) {
    const now = Date.now();
    if (loading) {
      setSt({ prev: true, startedAt: now, holdUntil: 0 });
    } else {
      const elapsed = st.startedAt ? now - st.startedAt : 0;
      const holdUntil = elapsed > LOADER_DELAY_MS ? now + (LOADER_LOOP_MS - (elapsed % LOADER_LOOP_MS)) : 0;
      setSt({ prev: false, startedAt: 0, holdUntil });
    }
  }

  const [, tick] = useState(0);
  useEffect(() => {
    const wait = st.holdUntil - Date.now();
    if (wait <= 0) return;
    const t = setTimeout(() => tick((n) => n + 1), wait + 20);
    return () => clearTimeout(t);
  }, [st.holdUntil]);

  return loading || st.holdUntil > Date.now();
}
