"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSectionsTestList, SectionalTestV2Data } from "@/lib/tests/getExam";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (examId?: string | number, paperId?: string | number | null) =>
  ["sectional-test", examId, paperId ?? null];

export function useSectionalTestHook(
  examId?: string | number,
  paperId?: string | number | null,
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<SectionalTestV2Data>({
    queryKey: QUERY_KEY(examId, paperId),
    enabled: !!examId,

    queryFn: async () => {
      const res = await getSectionsTestList(examId, paperId);
      return res.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refetchData = async () => {
    if (!examId) return;
    await refetch();
  };

  const clearData = () => {
    if (!examId) return;
    queryClient.removeQueries({ queryKey: QUERY_KEY(examId, paperId) });
  };

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetchData,
    clearData,
  };
}
