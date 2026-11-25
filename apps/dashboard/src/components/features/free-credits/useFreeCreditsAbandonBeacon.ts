"use client";

import { useEffect, useRef } from "react";
import {
  FREE_CREDITS_REFUND_WINDOW_SEC,
  sendFreeCreditsAbandon,
  type AbandonAttemptType,
} from "@/lib/api/freeCredits";
import { useFreeCredits, useRefreshFreeCredits } from "./useFreeCredits";

/** Attempts we already told the server about (module level: survives remounts, never double-sends). */
const sentKeys = new Set<string>();
/** A cleanup that is waiting one tick to prove it is a real unmount (StrictMode re-runs the effect at once). */
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Credit refund for an abandoned counted test (CC-196). A started credited test that the
 * student LEAVES within ~120 s (in-app route-away / unmount) tells the server once, with a
 * keepalive request. `pagehide` is deliberately NOT used: it also fires on a reload, and a
 * reload resumes the same attempt, so refunding then would give a free test. A closed tab or
 * killed app is refunded by the backend's own lazy sweep instead. The server decides whether it refunds (window,
 * nothing answered, once per test); this only reports and never gates the test.
 *
 * No-op when the feature is off / control / paid, for the Topic Test (never mounted there),
 * and after the student started submitting (`submitting` is sticky for the attempt: the
 * submit screen resets its own state when the page unmounts, so it is remembered here).
 */
export function useFreeCreditsAbandonBeacon(args: {
  /** An attempt is in progress on this page. */
  active: boolean;
  attemptType: AbandonAttemptType;
  attemptId: string | null | undefined;
  testType?: string | null;
  examShort: string | null | undefined;
  paid?: boolean;
  /** Server start time of the attempt (ms), when known - the earlier of this and the page visit counts. */
  startedAtMs?: number | null;
  /** True while / after the student submits: such an attempt is never reported as abandoned. */
  submitting?: boolean;
}) {
  const { credits } = useFreeCredits(args.examShort, { skip: args.paid });
  const refreshCredits = useRefreshFreeCredits();
  const refreshRef = useRef(refreshCredits);
  refreshRef.current = refreshCredits;

  // Latest values for the long-lived listeners below (they are bound per attempt id only).
  const latest = useRef(args);
  latest.current = args;
  const creditsActiveRef = useRef(credits.active);
  creditsActiveRef.current = credits.active;
  const seenAtRef = useRef<{ id: string; at: number } | null>(null);
  const submittedRef = useRef<string | null>(null);
  if (args.submitting && args.attemptId) submittedRef.current = args.attemptId;

  const attemptId = args.active ? (args.attemptId ?? null) : null;

  useEffect(() => {
    if (!attemptId) return;
    const key = `${latest.current.attemptType}:${attemptId}`;
    if (seenAtRef.current?.id !== attemptId) seenAtRef.current = { id: attemptId, at: Date.now() };
    const pending = pendingTimers.get(key);
    if (pending) {
      clearTimeout(pending);
      pendingTimers.delete(key);
    }

    const report = () => {
      const a = latest.current;
      if (!creditsActiveRef.current || a.paid || !a.active || sentKeys.has(key)) return;
      if (submittedRef.current === attemptId) return;
      const now = Date.now();
      const sinceVisit = now - (seenAtRef.current?.at ?? now);
      const sinceStart = a.startedAtMs && Number.isFinite(a.startedAtMs) ? now - a.startedAtMs : Infinity;
      if (Math.min(sinceVisit, sinceStart) >= FREE_CREDITS_REFUND_WINDOW_SEC * 1000) return;
      sentKeys.add(key);
      // The counter may change (refund): the next reader refetches.
      refreshRef.current(a.examShort);
      sendFreeCreditsAbandon({
        attempt_type: a.attemptType,
        attempt_id: attemptId,
        ...(a.testType ? { test_type: a.testType } : {}),
      });
    };

    return () => {
      // Route-away / unmount. Wait one tick: React StrictMode (dev) unmounts and remounts at once.
      pendingTimers.set(
        key,
        setTimeout(() => {
          pendingTimers.delete(key);
          report();
        }, 0),
      );
    };
  }, [attemptId]);
}
