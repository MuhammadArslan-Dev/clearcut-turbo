"use client";

import { useQuery } from "@tanstack/react-query";
import { getCutoffMeter, type CutoffMeterDetail } from "@/lib/dashboard/cutoffMeter";

export const CUTOFF_METER_KEY = (courseId: string) => ["cutoff-meter", courseId];

/**
 * The Target tab's data (phase 99): meter, sections and today's plan, in ONE
 * request. Only runs while the backend capability `cutoff_meter` is on.
 */
export function useCutoffMeter(courseId: string | undefined, enabled: boolean) {
  return useQuery<CutoffMeterDetail>({
    queryKey: CUTOFF_METER_KEY(courseId ?? ""),
    queryFn: () => getCutoffMeter(courseId!),
    enabled: enabled && !!courseId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
