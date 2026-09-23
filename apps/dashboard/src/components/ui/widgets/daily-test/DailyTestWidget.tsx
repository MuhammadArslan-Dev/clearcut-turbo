"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { BarChart3, Brain, CalendarDays, Clock, FileText, Target } from "lucide-react";
import MainButton from "../../button/main-button";
import { useRouter } from "@/i18n/navigation";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";
import { useDailyTestHistory } from "@/components/features/daily-tests/hooks/useDailyTestHistory";
import { SECONDS_PER_QUESTION } from "@/components/features/daily-tests/constants";
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
 * test history directly. The question count / duration come from the
 * (cached) history the Daily Tests page itself uses.
 */
export default function DailyTestWidget({
  // Prominent by default: a soft brand wash + brand-tinted border set it
  // apart from the plain white widgets around it on the Learn page.
  bgColor = "bg-gradient-to-b from-[var(--color-primary-bg-soft)] to-white border border-brand/15",
  rounded = "rounded-md",
}: DailyTestWidgetProps) {
  const t = useTranslations("DailyTests");
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const router = useRouter();

  const course = focusedCourse ?? activeCourse;
  // Opaque id for the URL: the user's own enrollment uuid (never the exam's numeric id).
  const courseId = course?.uuid;

  // Latest generated test = today's (history is oldest-first).
  const { history } = useDailyTestHistory(courseId ?? "");
  const todays = history?.tests[history.tests.length - 1];
  const questions = todays?.total_questions;
  const minutes = questions != null ? Math.round((questions * SECONDS_PER_QUESTION) / 60) : null;

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
    <div className={clsx("flex h-full flex-col justify-between gap-4 p-4 md:p-5", bgColor, rounded)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
            <CalendarDays size={24} />
          </span>
          <div>
            <h6 className="heading-large !font-semibold">{t("history.titleToday")}</h6>
            <div className="body-small !font-normal text-surface-gray-muted">{t("widget.subtitle")}</div>
          </div>
        </div>
        <span className="body-xsmall shrink-0 rounded-full bg-[var(--color-success-bg-soft)] px-2.5 py-0.5 !font-semibold text-[var(--color-success-strong)]">
          {t("widget.new")}
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-white py-6">
        <StatCell icon={<FileText size={28} />} value={questions != null ? String(questions) : "-"} label={t("widget.questions")} />
        <StatCell
          icon={<Clock size={28} />}
          value={minutes != null ? t("list.minutesShort", { count: minutes }) : "-"}
          label={t("widget.duration")}
        />
        <StatCell icon={<BarChart3 size={28} />} value={t("widget.personalizedShort")} label={t("widget.toYourLevel")} />
      </div>

      {/* Three quick reasons — reuses the icons already on this page. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <FeatureChip icon={<Target size={20} className="text-brand" />} text={t("widget.chipTopics")} />
        <FeatureChip icon={<BarChart3 size={20} className="text-[var(--color-success-strong)]" />} text={t("widget.chipProgress")} />
        <FeatureChip icon={<Brain size={20} className="text-purple-500" />} text={t("widget.chipConsistency")} />
      </div>

      <div className="flex flex-col gap-3">
        <MainButton
          fullWidth
          variant="solid"
          rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
          size="md"
          text={todays?.attempted ? t("widget.open") : t("widget.startToday")}
          onClick={handleOpen}
        />
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-success-bg-soft)] px-3 py-2">
          <CheckCircleIcon className="size-5 shrink-0 text-[var(--color-success-strong)]" aria-hidden="true" />
          <p className="body-small !font-medium text-surface-gray-normal">{t("widget.streakNote")}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-3">
      <span className="shrink-0">{icon}</span>
      <p className="body-small !font-normal leading-tight text-surface-gray-muted">{text}</p>
    </div>
  );
}

function StatCell({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
      <span className="text-brand">{icon}</span>
      <p className="body-large !font-semibold leading-tight">{value}</p>
      <p className="body-xsmall leading-tight text-surface-gray-muted">{label}</p>
    </div>
  );
}
