"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChapters } from "@/lib/preparation/preparation";
import { Chapter, ExamSyllabusData } from "../types/types";
import { usePreparationStore } from "../store/usePreparationDataStore";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (sectionId?: string | number) => ["chapter", sectionId];

export function useChapterData(sectionId?: number) {
  const queryClient = useQueryClient();
  const { course } = usePreparationStore();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY(sectionId),
    enabled: !!sectionId,

    queryFn: async () => {
      const res = await sentryApiClient(
        () => getChapters(sectionId as number, course?.group_code!),
        {
          endpoint: "/chapters",
          module: "preparation-page",
        },
      );
      return res.data;
    },

    staleTime: 30 * 60 * 1000,
    gcTime: 40 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refetchData = async () => {
    if (!sectionId) return;
    await refetch();
  };

  const clearData = () => {
    if (!sectionId) return;
    queryClient.removeQueries({
      queryKey: QUERY_KEY(sectionId),
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
