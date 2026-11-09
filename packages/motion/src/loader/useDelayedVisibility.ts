"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Don't show at all if loading finishes before this (ms). Prevents flashes on fast loads. */
  delay?: number;
  /** Once shown, stay at least this long (ms). Prevents a blink-and-gone flicker. */
  minDuration?: number;
  /** Exit transition length (ms) — keep in sync with the CSS. */
  exitDuration?: number;
};

/**
 * Turns a raw `isLoading` boolean into a calm show/hide lifecycle:
 *   hidden → (after delay) shown → (after minDuration & !active) exiting → unmounted
 */
export function useDelayedVisibility(
  active: boolean,
  { delay = 250, minDuration = 700, exitDuration = 360 }: Options = {}
) {
  const [phase, setPhase] = useState<"hidden" | "shown" | "exiting">("hidden");
  const shownAt = useRef(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      if (phase === "hidden") {
        t = setTimeout(() => {
          shownAt.current = Date.now();
          setPhase("shown");
        }, delay);
      } else if (phase === "exiting") {
        setPhase("shown");
      }
    } else if (phase === "shown") {
      const remaining = Math.max(0, minDuration - (Date.now() - shownAt.current));
      t = setTimeout(() => setPhase("exiting"), remaining);
    } else if (phase === "exiting") {
      t = setTimeout(() => setPhase("hidden"), exitDuration);
    }

    return () => clearTimeout(t);
  }, [active, phase, delay, minDuration, exitDuration]);

  return { mounted: phase !== "hidden", exiting: phase === "exiting" };
}
