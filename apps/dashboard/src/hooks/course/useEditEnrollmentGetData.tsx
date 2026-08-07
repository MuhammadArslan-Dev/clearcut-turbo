"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Level } from "@/lib/api/onboarding";

/* ----------------------------------
   TYPES
----------------------------------- */
type SelectionState = {
  path: Level[];
  finalSelection: Level | null;
};

type SelectionStateMap = Record<number, SelectionState>;

type EditEnrollmentResponse = {
  status: "success" | "error";
  message: string;
  data: SelectionStateMap;
};

/* ----------------------------------
   SAFE TOKEN ACCESS
----------------------------------- */
const getToken = () => {
  if (typeof document === "undefined") return null;

  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("auth_token="))
      ?.split("=")[1] ?? null
  );
};

/* ----------------------------------
   API
----------------------------------- */
const fetchEnrollmentData = async (
  examId: number
): Promise<SelectionStateMap> => {

  const res = (await apiFetch(`/v2/enrollment/edit/${examId}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })) as EditEnrollmentResponse;


  if (!res.status) {
    throw new Error(res.message);
  }

  return res.data;
};

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (examId: number) => ["edit-enrollment", examId];

/* ----------------------------------
   HOOK
----------------------------------- */
export function useEditEnrollmentGetData(examId?: number | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: examId ? QUERY_KEY(examId) : [],
    queryFn: () => fetchEnrollmentData(examId!),
    enabled: !!examId,

    // 🔥 replaces CACHE_TTL
    staleTime: 5 * 60 * 1000, // 5 minutes

    // 🔥 replaces MAX_CACHE_SIZE eviction
    gcTime: 10 * 60 * 1000, // 10 minutes

    refetchOnWindowFocus: false,
    retry: 1,
  });


  const clearCache = () => {
    if (!examId) return;
    queryClient.removeQueries({ queryKey: QUERY_KEY(examId) });
  };

  return {
    data: data ?? null,
    loading: isLoading,
    error: isError ? (error as Error) : null,
    refetch,
    clearCache,
  };
}
