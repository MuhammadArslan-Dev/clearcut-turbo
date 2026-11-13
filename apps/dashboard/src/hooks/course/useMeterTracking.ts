"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useAuth } from "@/providers/AuthProvider";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import { observeMeterState, trackMeterViewed, type MeterCtx } from "@/lib/analytics/cutoffMeter";

const VISIBLE_MS = 1000;

/**
 * Cutoff Meter analytics for one rendered meter (phase 108): reports a state change vs the
 * last meter seen, and "Viewed" once per mount when >= 50 % of it has been on screen for 1 s.
 * Only called where real data is rendered — never for a skeleton or an error state.
 */
export function useMeterTracking(
  meter: CutoffMeterSummary,
  ctx: Omit<MeterCtx, "userId">,
  target: RefObject<HTMLElement | null>,
) {
  const { user } = useAuth() as { user?: { uuid?: string } | null };
  const userId = user?.uuid ?? null;
  const full: MeterCtx = { ...ctx, userId };
  const latest = useRef({ meter, full });
  latest.current = { meter, full };

  // Change detection runs on every new computation.
  useEffect(() => {
    observeMeterState(meter, full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meter.computed_at, meter.locked, meter.meter, ctx.courseId, userId]);

  // Impression.
  const viewed = useRef(false);
  useEffect(() => {
    const el = target.current;
    if (!el || viewed.current || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            if (viewed.current) return;
            viewed.current = true;
            trackMeterViewed(latest.current.meter, latest.current.full);
            io.disconnect();
          }, VISIBLE_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, [target, ctx.courseId]);
}
