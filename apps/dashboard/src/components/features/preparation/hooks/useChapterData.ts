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
// Scoped by COURSE: the response embeds that course's saved position (`state`), and two
// courses can share a section id — keyed by section alone one course restored the other's.
const QUERY_KEY = (groupCode: string | null | undefined, sectionId?: string | number) => ["chapter", groupCode, sectionId];

export function useChapterData(sectionId?: number) {
  const queryClient = useQueryClient();
  const { course } = usePreparationStore();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY(course?.group_code, sectionId),
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
      queryKey: QUERY_KEY(course?.group_code, sectionId),
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
