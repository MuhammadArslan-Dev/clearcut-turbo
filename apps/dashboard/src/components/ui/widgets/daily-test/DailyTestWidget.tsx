"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import MainButton from "../../button/main-button";
import { ClipBoardIcon } from "../../icons";
import { useRouter } from "@/i18n/navigation";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";
import { trackEvent } from "@/lib/analytics/browser";

type DailyTestWidgetProps = {
  bgColor?: string;
  rounded?: string;
};

/**
 * Replaces the old standalone "Daily Tests" sidebar tab + its own exam
 * picker: daily tests are now personalized to whichever course the user is
 * already enrolled in (see PersonalizedDailyTestService on the backend), so
 * there's nothing left to pick — this card just opens that course's daily
 * test history directly. Mirrors quick-revision's card shape (title,
 * capability checklist, single CTA) so Learn's widget row stays visually
 * consistent.
 */
export default function DailyTestWidget({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: DailyTestWidgetProps) {
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const router = useRouter();

  const course = focusedCourse ?? activeCourse;
  const examId = course?.exam?.id;

  const handleOpen = useCallback(async () => {
    if (!examId) return;

    await trackEvent("Content Started", {
      source: "daily_test_widget",
      exam_name: course?.exam?.short_name!,
    });
    router.push(`/daily-tests/${examId}`);
  }, [examId, course, router]);

  if (!examId) return null;

  return (
    <div className={clsx("flex p-4 flex-col gap-4", bgColor, rounded)}>
      <div className="flex items-center gap-2">
        <ClipBoardIcon size={22} color="var(--color-brand)" />
        <div>
          <h6 className="heading-medium !font-semibold">Daily Test</h6>
          <div className="body-small !font-normal text-surface-gray-muted">
            One short test a day, picked just for you
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            Personalized to your enrolled level
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            Track your score and daily streak
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full justify-center items-center text-center">
        <div className="max-w-[320px] w-full">
          <MainButton
            fullWidth
            variant="outlined"
            rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
            size="md"
            text="Open Daily Test"
            onClick={handleOpen}
          />
        </div>
      </div>
    </div>
  );
}
