import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useCallback } from "react";
import MainButton from "../../button/main-button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { FireIcon } from "../../icons";
import { useRouter } from "@/i18n/navigation";
import { useCourseStore } from "@/store/course/useCourseStore";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { trackEvent } from "@/lib/analytics/browser";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";

type QuickRevisionProps = {
  bgColor?: string;
  rounded?: string;
};

export default function QuickRevision({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: QuickRevisionProps) {

  const t = useTranslations();
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const open = useCourseStore((s) => s.open);
  const router = useRouter();

  const course = focusedCourse ?? activeCourse;

  const handleStart = useCallback(async () => {
    if (!course) return;

    if (course.stage_id) {
      await trackEvent("Content Started", {
        source: "quick_revision",
        exam_name: course.exam?.short_name!,
      });
      router.push(`/${course.group_code}/content/notes`);
    } else {
      open("single", course.exam!);
    }
  }, [course, open]);
  return (
    <div className={clsx("flex p-4 flex-col gap-4", bgColor, rounded)}>
      {/* Header */}
      <div>
        <h6 className="heading-medium !font-semibold">
          {t("quickRvision.title")}
        </h6>
        <div className="body-small !font-normal text-surface-gray-muted">
          {t("quickRvision.subtitle", { min: 20, max: 30 })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FireIcon variant={"outline"} color="gray-muted" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("quickRvision.viewNotes")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FireIcon variant={"outline"} color="gray-muted" />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("quickRvision.viewPreviousPapers")}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-1 w-full justify-center items-center text-center">
        <div className="max-w-[320px] w-full">
          <MainButton
            fullWidth
            variant="outlined"
            rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
            size="md"
            text={t("quickRvision.openNotesandPapers")}
            onClick={() => { handleStart() }}
          />
        </div>
        <div className="body-small text-[#8d9097]">
          {t("quickRvision.viewPYQs")}
        </div>
      </div>
    </div>
  );
}
