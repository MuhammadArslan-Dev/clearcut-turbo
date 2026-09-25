"use client";

import { useCallback } from "react";
import { flowPathOf, useFlowNavigation } from "@/hooks/navigation/useFlowNavigation";
import { setExamReportIntent } from "@/components/features/test-series/util/examReportIntent";

const TEST_TYPE_PARAM: Record<string, string> = {
  chapter: "chapter-tests",
  sectional: "sectional-tests",
};

/**
 * Where an exam goes once it ends (submit or timer expiry): its test list
 * with the report open. When the exam was opened from that very list tab,
 * pop back to that history entry (no duplicate list entry, swipe-back stays
 * List → previous page); otherwise — direct URL, refresh, opened from
 * elsewhere — swap the exam entry for the report URL as before.
 */
export function useExamFinishNavigation() {
  const flow = useFlowNavigation();

  return useCallback(
    (courseCode: string | undefined, examId: string | undefined, examType: string | null | undefined) => {
      const testType = TEST_TYPE_PARAM[examType ?? ""] ?? "full-length-papers";
      const listPath = `/test-series/${courseCode}`;
      const reportUrl = `${listPath}?showReport=true&examId=${examId}&testType=${testType}`;

      const origin = flow.origin();
      if (origin && examId && flowPathOf(origin) === listPath) {
        const originParams = new URL(origin, "http://flow.local").searchParams;
        if (originParams.get("testType") === testType && !originParams.has("showReport")) {
          setExamReportIntent(examId);
          flow.back();
          return;
        }
      }
      flow.replace(reportUrl);
    },
    [flow],
  );
}
