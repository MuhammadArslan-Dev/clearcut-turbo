"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
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
  // Prominent by default: a soft brand wash + brand-tinted border set it
  // apart from the plain white widgets below it on the Learn page.
  bgColor = "bg-gradient-to-b from-[var(--color-primary-bg-soft)] to-white border border-brand/15",
  rounded = "rounded-md",
}: DailyTestWidgetProps) {
  const t = useTranslations("DailyTests.widget");
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const router = useRouter();

  const course = focusedCourse ?? activeCourse;
  // Opaque id for the URL: the user's own enrollment uuid (never the exam's numeric id).
  const courseId = course?.uuid;

  const handleOpen = useCallback(async () => {
    if (!courseId) return;

    await trackEvent("Content Started", {
      source: "daily_test_widget",
      exam_name: course?.exam?.short_name!,
    });
    router.push(`/daily-tests/${courseId}`);
  }, [courseId, course, router]);

  if (!courseId) return null;

  return (
    <div className={clsx("flex h-full flex-col gap-4 p-4 md:p-5", bgColor, rounded)}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <ClipBoardIcon size={24} color="var(--color-brand)" />
        </span>
        <div>
          <h6 className="heading-large !font-semibold">{t("title")}</h6>
          <div className="body-small !font-normal text-surface-gray-muted">
            {t("subtitle")}
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-white/80 p-3">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("personalized")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("trackScore")}
          </p>
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col items-center justify-center gap-1 text-center">
        <div className="w-full">
          <MainButton
            fullWidth
            variant="solid"
            rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
            size="md"
            text={t("open")}
            onClick={handleOpen}
          />
        </div>
      </div>
    </div>
  );
}
