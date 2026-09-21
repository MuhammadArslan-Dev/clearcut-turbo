import React, { useCallback } from "react";
import { TrophyIcon } from "../../icons";
import { Button } from "@clearcut/ui/button";
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
import { Trophy } from "lucide-react";

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
  const tHome = useTranslations("DashboardHome");
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
    <div className={clsx("flex h-full flex-col gap-4 p-4 md:p-5", bgColor, rounded)}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Trophy size={24} />
        </span>
        <div>
          <p className="heading-medium !font-semibold">
            {t("nextMilestone.title")}
          </p>
          <p className="body-small !font-normal text-surface-gray-muted">
            {tHome("milestoneSubtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="w-[56px] shrink-0">
          <TrophyIcon size={56} />
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

      <div className="flex w-full flex-col items-center justify-center gap-1 text-center">
        <div className="w-full">
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
