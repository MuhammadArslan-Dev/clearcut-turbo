"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Silent stopwatch for the practice test (no limit, nothing is shown while it
 * runs). Counts only while the page is open and visible: a hidden tab or a
 * left page pauses it, so a long break can't inflate "time taken". `startMs`
 * is what was already counted before this mount (a refreshed test resumes);
 * `key` changes when a different test starts (retake) and resets it.
 */
export function usePracticeElapsed(running: boolean, key: number | null, startMs: number, onPause?: () => void) {
  const base = useRef(0);
  const since = useRef<number | null>(null);
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;
  const startRef = useRef(startMs);
  startRef.current = startMs;

  const read = useCallback(() => base.current + (since.current !== null ? Date.now() - since.current : 0), []);

  useEffect(() => {
    base.current = startRef.current;
    since.current = null;
  }, [key]);

  useEffect(() => {
    if (!running) return;
    const resume = () => {
      if (since.current === null && document.visibilityState === "visible") since.current = Date.now();
    };
    const pause = () => {
      if (since.current === null) return;
      base.current += Date.now() - since.current;
      since.current = null;
      onPauseRef.current?.();
    };
    const onVisibility = () => (document.visibilityState === "visible" ? resume() : pause());
    resume();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pause);
      pause();
    };
  }, [running, key]);

  return read;
}
