"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLevels, Level } from "@/lib/api/onboarding";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (examId: string | number) => ["levels", examId];

/* ----------------------------------
   HOOK
----------------------------------- */
export function useLevels(examId?: string | number) {
  const { data, isLoading, error } = useQuery<Level[]>({
    queryKey: examId ? QUERY_KEY(examId) : [],
    enabled: !!examId,

    queryFn: async () => {
      const res = await fetchLevels(examId!);
      return res.data;
    },

    // 🔥 replaces getCachedLevels / setCachedLevels
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes

    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    levels: data ?? [],
    loading: isLoading,
    error: error as Error | null,
  };
}
