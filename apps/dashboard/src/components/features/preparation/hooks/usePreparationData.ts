"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getExamSyllabus } from "@/lib/preparation/preparation";
import { ExamSyllabusData } from "../types/types";
import { usePreparationStore } from "../store/usePreparationDataStore";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
export const P_QUERY_KEY = (examId?: string | number|null) => ["preparation", examId];

export function usePreparationData(examId?: string | number) {
  const queryClient = useQueryClient();
  const hydrateFromApi = usePreparationStore((s) => s.hydrateFromApi);

  const { data, isLoading, error, refetch } = useQuery<ExamSyllabusData>({
    queryKey: P_QUERY_KEY(examId),
    enabled: !!examId,

    queryFn: async () => {
      const res = await getExamSyllabus(examId as number);
      return res.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ----------------------------------
     SIDE EFFECT (v5 way)
  ----------------------------------- */
  useEffect(() => {
    if (data) {
      hydrateFromApi(data);
    }
  }, [data, hydrateFromApi]);
  useEffect(() => {
    const loading = isLoading;
    const error1 = error;
    usePreparationStore.setState({ loading, error: !!error1 });
  }, [isLoading, error]);

  const refetchData = async () => {
    if (!examId) return;
    await refetch();
  };

  const clearData = () => {
    if (!examId) return;
    queryClient.removeQueries({
      queryKey: P_QUERY_KEY(examId),
    });
  };

  return {
    syllabus: data,
    loading: isLoading,
    error: error as Error | null,
    refetchData,
    clearData,
  };
}
