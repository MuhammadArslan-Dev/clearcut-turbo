"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startPendingWatch } from "@/lib/payment/pendingWatch";
import type { UpiWaitingKind } from "@/components/features/payment/UpiWaitingSheet";

export type UpiWaitState = "paid" | "pending" | "failed";

type Waiting = { kind: UpiWaitingKind; startedAt: number; slow: boolean; gaveUp: boolean };

/**
 * CC-70 (phase 88): the "approve in your UPI app" wait after the Razorpay popup
 * closed (or the page came back) with the payment still pending. `begin()`
 * opens the sheet and asks `check` every few seconds through startPendingWatch
 * (4 s while visible, at once on return to the tab, options after 2 min, stop
 * after 15 min). Paid -> `onPaid` once and the sheet closes; failed -> the
 * sheet closes. `stop()` ends it without a verdict (retry / close).
 */
export function useUpiWaiting() {
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const doneRef = useRef(false);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setWaiting(null);
  }, []);

  const begin = useCallback(
    ({
      kind,
      startedAt = Date.now(),
      check,
      onPaid,
      onFailed,
    }: {
      kind: UpiWaitingKind;
      startedAt?: number;
      check: () => Promise<UpiWaitState>;
      onPaid: () => void | Promise<void>;
      onFailed?: () => void;
    }) => {
      stopRef.current?.();
      doneRef.current = false;
      setWaiting({ kind, startedAt, slow: false, gaveUp: false });

      const run = async (): Promise<boolean> => {
        if (doneRef.current) return true;
        const state = await check();
        // The immediate check and a poll can both be in flight: only the first
        // verdict counts (never two onPaid = two redirects / two Purchase events).
        if (doneRef.current) return true;
        if (state === "pending") return false;
        doneRef.current = true;
        if (state === "paid") await onPaid();
        else onFailed?.();
        setWaiting(null);
        return true;
      };

      const stopWatch = startPendingWatch({
        check: run,
        onSlow: () => setWaiting((w) => (w ? { ...w, slow: true } : w)),
        onGiveUp: () => setWaiting((w) => (w ? { ...w, slow: true, gaveUp: true } : w)),
        // A wait resumed after a reload counts from the original attempt.
        startedAt,
      });
      stopRef.current = () => {
        doneRef.current = true;
        stopWatch();
      };
      // Ask once right away (the popup just closed: the payment may already be in).
      void run().then((finished) => finished && stopWatch()).catch(() => {});
    },
    [],
  );

  useEffect(() => () => stopRef.current?.(), []);

  return { waiting, begin, stop, isWaiting: waiting !== null };
}
