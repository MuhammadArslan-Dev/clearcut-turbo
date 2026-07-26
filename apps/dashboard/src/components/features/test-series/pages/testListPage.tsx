"use client";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { WarningCircleIcon } from "@/components/ui/icons";
import MainContainer from "@/components/ui/main-container";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";
import TestCard from "../components/cards/TestCard";
import { Button } from "@clearcut/ui/button";
import ProgressCard from "../components/cards/ProgressCard";
import { useTestSeriesModalStore } from "../store/useTestSeriesModalStore";
import SectionalTest from "../components/tests/SectionalTest";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import FullTest from "../components/tests/FullTest";
import ChapterTest from "../components/tests/ChapterTest";
import { getFullLengthTestList } from "@/lib/tests/getExam";
import { useEffect, useRef, useState } from "react";
import { usePreparationData } from "../../preparation/hooks/usePreparationData";
import { apiFetch } from "@/lib/api/client";
import { useTestListDataStore } from "../store/useTestListDataStore";
import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useExamModalStore } from "../../exam/store/useExamModalStore";
import { useQueryClient } from "@tanstack/react-query";



export default function TestListPage({ courseId }: { courseId?: string }) {
  const t = useTranslations("testListContent");
  const { get, set, remove } = useQueryParams();
  const { isLoading, isError } = useGetCurrentCourse({ courseId });
  const { exam } = useGetCurrentCourseStore();
  const { open, stack, isOpen } = useExamModalStore();
  const active = stack[stack.length - 1];

  const testType = get("testType");

  const showReport = get("showReport");
  const examId = get("examId");

  const { progressData } = useTestListDataStore();
  const queryClient = useQueryClient();

  // Auto open after exam submit
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (hasOpenedRef.current) return;

    if (showReport === "true" && examId) {
      // Invalidate stale test list so is_attempted updates immediately
      const queryKeyPrefix =
        testType === "chapter-tests" ? "chapter-test" :
        testType === "sectional-tests" ? "sectional-test" :
        "full-test";
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });

      open("exam-report", { examId }, true);

      hasOpenedRef.current = true;

      remove(["showReport", "examId"]);
    }
  }, [showReport, examId, open, remove, queryClient, testType]);


  return (
    <div className="min-h-full">
      <MainContainer maxWidth="max-w-[950px]" padding="py-4 md:py-8">
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 px-3 md:hidden items-center justify-center">
            <ProgressCard
              title={progressData?.title!}
              total={progressData?.total!}
              completed={progressData?.completed!}
              containerClasses="bg-white w-full"
              message={t("progress.attemptMessage")}
            />
          </div>
          <div className="flex gap-2 items-center justify-center px-3">
            <div>
              <WarningCircleIcon color="var(--icon-gray-muted)" />
            </div>
            <Text variant="body-small" color="gray-muted">
              {t("testInfoBanner.combined", { course: exam?.short_name! })}
            </Text>
          </div>
          <div className="">
            {testType === "sectional-tests" && (
              <SectionalTest courseId={courseId} />
            )}

            {testType === "full-length-papers" && (
              <FullTest courseId={courseId} />
            )}

            {testType === "chapter-tests" && (
              <ChapterTest courseId={courseId} />
            )}
          </div>
          {/* <div className="sticky bottom-4 gap-1 items-center justify-center">
            <ProgressCard containerClasses="bg-white" />
          </div> */}
        </div>
      </MainContainer>
    </div>
  );
}
