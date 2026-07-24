import React, { useCallback } from "react";
import Button from "@mui/joy/Button";
import clsx from "clsx";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { getTodayGoals, TodayGoalsResponse } from "@/lib/dashboard/todayGoals";
import { useTranslations } from "next-intl";
import { Exam } from "@/types/Exam";
import { trackEvent } from "@/lib/analytics/browser";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useCourseStore } from "@/store/course/useCourseStore";
import { FireIcon } from "../../icons";
import { useRouter } from "@/i18n/navigation";
import MainButton from "../../button/main-button";
import { useSwiperCourseStore } from "@/store/dashboard/useSwiperCourseStore";

interface TodayGoalsProps {
  bgColor?: string;
  rounded?: string;
  exam?: Exam;
}

export const QUERY_KEY = ["today-goals"];

const GOALS_CONFIG = [
  {
    key: "video_watched",
    label: "todayGoals.watchVideos",
    videoCount: 2,
  },
  {
    key: "notes_taken",
    label: "todayGoals.studyNotes",
    videoCount: 2,
  },
  {
    key: "mini_quiz_taken",
    label: "todayGoals.attemptTests",
    videoCount: 2,
  },
] as const;

const TodayGoals: React.FC<TodayGoalsProps> = ({
  bgColor = "bg-white",
  rounded = "rounded-md",
  exam,
}) => {
  const t = useTranslations();
  const { activeCourse } = useMyActiveCourses();
  const focusedCourse = useSwiperCourseStore((s) => s.focusedCourse);
  const open = useCourseStore((s) => s.open);
  const router = useRouter();

  // focusedCourse is set by the Swiper when the user swipes to a different course.
  // Falls back to the API active course when null (default state or back on first slide).
  const course = focusedCourse ?? activeCourse;

  const { data, isLoading, isError } = useQuery<TodayGoalsResponse>({
    queryKey: QUERY_KEY,
    queryFn: getTodayGoals,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  /* ---------------------------------- CTA handler ---------------------------------- */
  const handleStart = useCallback(async () => {
    if (!course) return;

    if (course.stage_id) {
      await trackEvent("Content Started", {
        source: "today_goals",
        exam_name: course.exam?.short_name!,
      });

      router.push(`/preparation/${course.group_code}`);
    } else {
      open("single", course.exam!);
    }
  }, [course, open]);

  if (isError) return <div>Failed to load goals</div>;
  if (isLoading)
    return <TodayGoalsSkeleton bgColor={bgColor} rounded={rounded} />;

  const goals = data?.goals;

  return (
    <div className={clsx("flex p-4 flex-col gap-4", bgColor, rounded)}>
      {/* Header */}
      <div>
        <h6 className="heading-medium !font-semibold">
          {t("todayGoals.title")}
        </h6>
        <div className="body-small !font-normal text-surface-gray-muted">
          {t("todayGoals.estimatedTime", { min: 20, max: 30 })}
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-2">
        {GOALS_CONFIG.map(({ key, label, videoCount }) => {
          const goal = goals?.[key];

          return (
            <div key={key} className="flex justify-between items-center">
              <div className="flex gap-2">
                <FireIcon
                  variant={goal?.done ? "red" : "outline"}
                  color="gray-muted"
                />
                <p className="body-medium !font-normal text-surface-gray-normal">
                  {t(label, { count: videoCount })}
                </p>
              </div>
              <div className="body-medium !font-normal text-surface-gray-muted">
                <span className="text-surface-gray-normal">
                  {goal?.completed}
                </span>{" "}
                / {goal?.total}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-1 w-full justify-center items-center text-center">
        <div className="max-w-[320px] w-full">
          <MainButton
            onClick={handleStart}
            fullWidth
            variant="outlined"
            rightIcon={<ChevronRightIcon width={16} strokeWidth={3} />}
            size="md"
            text={t("todayGoals.start")}
          />
        </div>
        <div className="body-small text-[#8d9097]">
          {t("todayGoals.basedOnPattern")}
        </div>
      </div>
    </div>
  );
};

export default TodayGoals;

/* ---------------------------------- Skeleton ---------------------------------- */

const TodayGoalsSkeleton = ({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: {
  bgColor?: string;
  rounded?: string;
}) => {
  return (
    <div className={clsx("flex p-4 flex-col gap-5", bgColor, rounded)}>
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 w-full items-center">
        <div className="max-w-[320px] w-full">
          <div className="h-10 w-full rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="h-3 w-44 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
};
