"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import { observeMeterState, type MeterCtx } from "@/lib/analytics/cutoffMeter";

/**
 * Cutoff Meter analytics for one rendered meter (phase 108): reports a state change (Unlocked / Score
 * Updated / Zone Changed) against the last meter this browser showed for the course. The impression
 * event ("Cutoff Meter Viewed") was removed on request (2026-11-13). Only called where real data is
 * rendered — never for a skeleton or an error state.
 */
export function useMeterTracking(meter: CutoffMeterSummary, ctx: Omit<MeterCtx, "userId">) {
  const { user } = useAuth() as { user?: { uuid?: string } | null };
  const userId = user?.uuid ?? null;

  useEffect(() => {
    observeMeterState(meter, { ...ctx, userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meter.computed_at, meter.locked, meter.meter, ctx.courseId, userId]);
}
