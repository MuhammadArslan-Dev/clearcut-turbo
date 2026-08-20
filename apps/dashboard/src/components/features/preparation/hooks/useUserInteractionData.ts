"use client";

import { useQuery } from "@tanstack/react-query";
import { getLearningProgressByTopic } from "@/lib/dashboard/userInteractions";
import { TopicProgress, usePreparationStore } from "../store/usePreparationDataStore";
import { useEffect } from "react";

export function useUserInteractionData(examId: number | string) {
  const progressByTopic = usePreparationStore((s) => s.progressByTopic);

  const { data, isLoading, error } = useQuery({
    queryKey: ["learning-progress-by-topic", examId],
    queryFn: async () => {
      const res = await getLearningProgressByTopic(examId);
      return res.data;
    },
    enabled: !!examId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!data) return;

    const normalized: Record<number, TopicProgress> = Object.fromEntries(
      Object.entries(data).map(([topicId, item]) => [
        Number(topicId),
        {
          chapterId: item.chapterId ?? undefined,
          videoWatched: item.videoWatched,
          notesTaken: item.notesTaken,
          miniTestDone: item.miniTestDone,
          status: item.status === "not_started" ? "in_progress" : item.status,
        },
      ]),
    );

    progressByTopic(normalized);
  }, [data, progressByTopic]);

  return {
    progressByTopic: data,
    loading: isLoading,
    error: error as Error | null,
  };
}
