import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useCallback } from "react";
import MainButton from "../../button/main-button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "@/i18n/navigation";
import { useCourseStore } from "@/store/course/useCourseStore";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { trackEvent } from "@/lib/analytics/browser";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";
import { BookOpen, FileText, Folder, Star } from "lucide-react";

type QuickRevisionProps = {
  bgColor?: string;
  rounded?: string;
};

export default function QuickRevision({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: QuickRevisionProps) {

  const t = useTranslations();
  const tHome = useTranslations("DashboardHome");
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
    <div className={clsx("relative flex flex-col gap-4 overflow-hidden p-4 md:p-5", bgColor, rounded)}>
      {/* Decorative backdrop — reference art: a soft page with three label chips.
          Purely visual, desktop only. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[380px] md:block">
        <div className="absolute right-24 top-6 h-[150px] w-[190px] rotate-[-6deg] rounded-xl bg-[var(--color-primary-bg-soft)]" />
        <div className="absolute right-10 top-4 h-[150px] w-[190px] rotate-[4deg] rounded-xl bg-brand/9" />
        <div className="absolute right-8 top-6 flex flex-col gap-3">
          <span className="body-small flex w-[150px] items-center gap-2 rounded-lg bg-white px-3 py-2 !font-medium shadow-sm">
            <FileText size={16} className="text-brand" /> {tHome("qrNotes")}
          </span>
          <span className="body-small ml-[-24px] flex w-[150px] items-center gap-2 rounded-lg bg-white px-3 py-2 !font-medium shadow-sm">
            <Folder size={16} className="text-amber-500" /> {tHome("qrPyqs")}
          </span>
          <span className="body-small flex w-[170px] items-center gap-2 rounded-lg bg-white px-3 py-2 !font-medium shadow-sm">
            <Star size={16} className="text-amber-500" /> {tHome("qrImportant")}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <BookOpen size={24} />
        </span>
        <div>
          <h6 className="heading-medium !font-semibold">
            {t("quickRvision.title")}
          </h6>
          <div className="body-small !font-normal text-surface-gray-muted">
            {t("quickRvision.subtitle", { min: 20, max: 30 })}
          </div>
        </div>
      </div>

      {/* Filled check-circles in brand blue, per the Figma. These rows describe
          what the feature ALREADY offers ("View notes by chapter and topics",
          "Browse previous year papers") — they are capability statements, not
          goals with a pending/complete state, so a check reads correctly where
          the previous grey outline flame did not. The flame is kept in Today's
          Goals, where it IS state-driven (`goal?.done ? "red" : "outline"`).
          Colour comes from the `brand` theme token rather than a literal. */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircleIcon
            className="size-5 shrink-0 text-brand"
            aria-hidden="true"
          />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("quickRvision.viewNotes")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircleIcon
            className="size-5 shrink-0 text-brand"
            aria-hidden="true"
          />
          <p className="body-medium !font-normal text-surface-gray-normal">
            {t("quickRvision.viewPreviousPapers")}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex w-full flex-col items-start gap-1">
        <div className="w-full md:max-w-[320px]">
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
