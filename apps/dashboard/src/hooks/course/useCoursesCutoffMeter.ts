"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoursesCutoffMeter, type CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";

export const COURSES_CUTOFF_METER_KEY = (courseIds: string[]) => ["courses-cutoff-meter", courseIds];

/**
 * One request for every My Courses card's Cutoff Meter (phase 98).
 * `enabled` comes from the backend capability (`cutoff_meter`): while the
 * meter is off nothing is requested and the cards keep their legacy bars.
 */
export function useCoursesCutoffMeter(
  courseIds: (string | number | undefined | null)[],
  enabled: boolean,
) {
  // Sorted + de-duplicated, like useCoursesProgressSummary, so the same set in
  // a different order shares one cache entry.
  const ids = useMemo(
    () => Array.from(new Set(courseIds.filter((id): id is string | number => !!id).map(String))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courseIds.map((id) => id ?? "").join(",")],
  );

  return useQuery<Record<string, CutoffMeterSummary>>({
    queryKey: COURSES_CUTOFF_METER_KEY(ids),
    queryFn: () => getCoursesCutoffMeter(ids),
    enabled: enabled && ids.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
