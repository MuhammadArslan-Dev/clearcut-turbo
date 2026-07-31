"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useCourseStore } from "@/store/course/useCourseStore";
import { usePreparationStore } from "../store/usePreparationDataStore";
import { useAvailablePapers } from "./useAvailablePapers";
import { P_QUERY_KEY } from "./usePreparationData";

/**
 * Backend caps enrollment edits at 3 (`edit_count` in ExamController@enrollExam).
 * EditCourseModal enforces the same number on its option cards, so past the cap
 * the modal opens but nothing inside it is clickable — hide the entry points
 * rather than routing users into that dead end.
 */
const MAX_ENROLLMENT_EDITS = 3;

/**
 * Shared "can this user add another paper, and how do they start?" logic.
 *
 * Three separate surfaces offer this action — the desktop BottomBar (only when
 * a single paper is enrolled), the Current Paper modal, and the mobile paper
 * tab strip — so the eligibility rule and the modal wiring live here instead of
 * being re-derived in each one.
 */
export function useAddPaper() {
  const params = useParams();
  const queryClient = useQueryClient();
  const openCourseModal = useCourseStore((s) => s.open);

  const papers = usePreparationStore((s) => s.papers);
  const course = usePreparationStore((s) => s.course);

  const { totalPapers } = useAvailablePapers(course?.exam?.id);

  // `papers` is enrolled-only; `totalPapers` is what the exam offers. A gap
  // between them means there is still a paper this user could add.
  const canAddPaper =
    totalPapers > 0 &&
    papers.length < totalPapers &&
    (course?.edit_count ?? 0) < MAX_ENROLLMENT_EDITS;

  const openAddPaper = useCallback(() => {
    if (!course?.exam) return;

    openCourseModal("edit", course.exam, undefined, () => {
      // group_code does not change when papers are added, so the route stays
      // put and nothing refetches on its own — the new paper would not appear
      // in the tabs until a manual reload without this.
      queryClient.invalidateQueries({
        queryKey: P_QUERY_KEY(params?.courseId as string | undefined),
      });
    });
  }, [course?.exam, openCourseModal, queryClient, params?.courseId]);

  return {
    canAddPaper,
    openAddPaper,
    enrolledPaperCount: papers.length,
  };
}
