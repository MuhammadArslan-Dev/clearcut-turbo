import React, { useCallback } from "react";
import { TrophyIcon } from "../../icons";
import Button from "@mui/joy/Button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import { Exam } from "@/types/Exam";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useCourseStore } from "@/store/course/useCourseStore";
import { useRouter } from "@/i18n/navigation";
import MainButton from "../../button/main-button";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";

interface NextMilestoneProps {
  bgColor?: string;
  rounded?: string;
  exam?: Exam;
}

const NextMilestone: React.FC<NextMilestoneProps> = ({
  bgColor = "bg-white",
  rounded = "rounded-md",
  exam,
}) => {
  const t = useTranslations();
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const open = useCourseStore((s) => s.open);
  const router = useRouter();

  const course = focusedCourse ?? activeCourse;
  const subject = course?.exam?.short_name ?? "";
  const count = 2;

  /* ---------------------------------- CTA handler ---------------------------------- */
  const handleStart = useCallback(async () => {
    if (!course) return;

    if (course.stage_id) {
      await trackEvent("Content Started", {
        source: "next_milestone",
        exam_name: course.exam?.short_name!,
      });
      router.push(`/preparation/${course.group_code}`);
    } else {
      open("single", course.exam!);
    }
  }, [course, open]);

  return (
    <div className={clsx("p-4 space-y-4", bgColor, rounded)}>
      <div>
        <p className="heading-medium !font-semibold">
          {t("nextMilestone.title")}
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-[40px]">
          <TrophyIcon size={40} />
        </div>
        <div className="flex-1">
          {highlightTextUtil(
            t("nextMilestone.chaptersAway", {
              count,
              subject,
            }),
            [t("nextMilestone.count", { count }), subject],
            "body-large !font-semibold text-surface-gray-normal",
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full justify-center items-center text-center">
        <div className="max-w-[320px] w-full">
          <MainButton
            onClick={handleStart}
            fullWidth
            variant="outlined"
            rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
            size="md"
            text={t("nextMilestone.cta")}
          />
        </div>
      </div>
    </div>
  );
};

export default NextMilestone;
