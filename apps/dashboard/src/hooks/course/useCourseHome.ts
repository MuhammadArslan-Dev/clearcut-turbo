"use client";

import { useCallback } from "react";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useProgressCapabilities } from "@/components/features/preparation/hooks/useProgressCapabilities";

/**
 * Where "go to my course" leads (phase 110) — ONE rule for every entry point outside the course
 * pages (dashboard card, Continue, resume bar, widgets, subscriptions, payment screens, edit paper):
 *   - first time in the course (no saved resume position on the server)  → Preparation (onboarding);
 *   - the student has already studied in it (server `learning_started`)    → Target.
 * `learning_started` comes from the backend (`user_course_resume_states`, per course group_code), so
 * it is the same on every device / session / refresh — never a browser flag. A course that is not in
 * the list yet (just purchased), the list still loading, or the Cutoff Meter / Target switched off
 * (capability) all fall back to Preparation, the previous behaviour, so nothing can dead-end.
 * The Course / Tests tabs and the Target plan's topic links inside the course area keep linking to
 * Preparation directly (that is how the student reaches the syllabus from Target) — they never use this.
 */
export function useCourseHome() {
  const { courses } = useMyActiveCourses();
  const { caps } = useProgressCapabilities();
  const started = new Set(
    (courses?.courses ?? []).filter((c) => c?.learning_started && c.group_code).map((c) => String(c.group_code)),
  );
  const targetOn = caps.cutoff_meter;

  return useCallback(
    (groupCode: string | number | null | undefined, query?: string): string => {
      const code = String(groupCode ?? "");
      const q = query ? `?${query.replace(/^\?/, "")}` : "";
      if (targetOn && code && started.has(code)) return `/target/${code}`;
      return `/preparation/${code}${q}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetOn, [...started].sort().join(",")],
  );
}
