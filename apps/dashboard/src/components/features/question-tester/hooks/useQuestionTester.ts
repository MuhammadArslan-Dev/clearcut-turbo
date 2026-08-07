"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuestionForTester } from "@/lib/tests/getQuestionForTester";
import { QuestionTesterData } from "../types";
import { isApiError } from "@/lib/api/api-error";

const QUERY_KEY = (id: string) => ["question-tester", id];

/** Try to pull a clean `message` out of the JSON error body thrown by apiFetch. */
function parseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Something went wrong";

  // apiFetch now throws ApiError, which keeps the response body in its own
  // field — `error.message` is the grouping label ("API 404 GET /...").
  const body = isApiError(error) ? error.responseBody : error.message;

  if (body) {
    try {
      const parsed = JSON.parse(body);
      if (parsed?.message) return parsed.message as string;
    } catch {
      /* not JSON — fall through */
    }
  }

  return error.message || "Something went wrong";
}

/**
 * Fetches a single question by the submitted id (primary key or question_id).
 * Pass an empty string to keep the query idle.
 */
export function useQuestionTester(submittedId: string) {
  const { data, isFetching, error, isError } = useQuery<QuestionTesterData>({
    queryKey: QUERY_KEY(submittedId),
    enabled: !!submittedId,
    queryFn: async () => {
      const res = await getQuestionForTester(submittedId);
      return res.data;
    },
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  return {
    question: data,
    loading: isFetching,
    isError,
    errorMessage: isError ? parseErrorMessage(error) : null,
  };
}
