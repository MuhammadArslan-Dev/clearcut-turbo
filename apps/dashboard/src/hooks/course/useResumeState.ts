"use client";

import { useQuery } from "@tanstack/react-query";
import { getResumeState, ResumeStateData } from "@/lib/dashboard/userInteractions";

export const RESUME_STATE_KEY = (courseId: string | number) => ["resume-state", String(courseId)];

export function useResumeState(courseId: string | number | undefined | null) {
  return useQuery<ResumeStateData | null>({
    queryKey: RESUME_STATE_KEY(courseId ?? ""),
    queryFn: async () => {
      const res = await getResumeState(courseId!);
      return res.data ?? null;
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
}
