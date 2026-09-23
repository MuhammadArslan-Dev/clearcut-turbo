"use client";

import React, { memo, useEffect, useRef } from "react";
import clsx from "clsx";
import { CircleTickIcon } from "../../icons";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { getStreak, StreakResponse } from "@/lib/dashboard/streak";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check, Flame } from "lucide-react";

interface LearningStreakProps {
  title?: React.ReactNode;
  bgColor?: string;
  rounded?: string;
}

export const STREAK_QUERY_KEY = ["learning-streak"];

const LearningStreak: React.FC<LearningStreakProps> = ({
  title = "Learning Streak Widget",
  bgColor = "bg-white",
  rounded = "rounded-md",
}) => {
  const t = useTranslations();
  const tHome = useTranslations("DashboardHome");
  const streakTitle = t("learningStreak.title");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const {
    data: streak,
    isLoading,
    isError,
  } = useQuery<StreakResponse>({
    queryKey: STREAK_QUERY_KEY,
    queryFn: getStreak,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Scroll today into the horizontal center of the strip on every render
  // (mount, page change, or data refresh). Works on mobile where the strip
  // overflows; on desktop where everything fits it has no visible effect.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const todayEl = todayRef.current;
    if (!container || !todayEl) return;
    const scrollTo =
      todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
    container.scrollLeft = scrollTo;
  }, [streak]);

  if (isLoading) {
    return (
      <LearningStreakSkeleton
        bgColor={bgColor}
        rounded={rounded}
        title={streakTitle}
      />
    );
  }

  if (isError || !streak) {
    return (
      <div className={clsx("p-4", bgColor, rounded)}>
        <div className="body-medium text-red-500">Failed to load streak</div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full flex flex-col gap-4 p-4 md:p-5", bgColor, rounded)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <Flame size={24} />
          </span>
          <div>
            <div className="heading-medium !font-semibold">{streakTitle}</div>
            <div className="body-small !font-normal text-surface-gray-muted">{tHome("streakSubtitle")}</div>
          </div>
        </div>
        <span className="body-small shrink-0 rounded-full bg-[var(--color-success-bg-soft)] px-3 py-1 !font-semibold text-[var(--color-success-strong)]">
          {t("learningStreak.day", { streak: streak.current_streak })}
        </span>
      </div>

      <div ref={scrollContainerRef} className="flex justify-between gap-2 overflow-x-auto -mx-2 px-2 sm:px-4 sm:-mx-4 scrollbar-hide">
        {streak.week.map((item, index) => (
          <div
            key={index}
            ref={item.day.toLowerCase() === "today" ? todayRef : undefined}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            {item.completed && item.day.toLowerCase() === "today" ? (
              // Today, done: brand-blue ring with a tick (the past days keep the green tick).
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-[3px] border-brand bg-white text-brand">
                <Check size={20} strokeWidth={3} />
              </div>
            ) : item.completed ? (
              <CircleTickIcon size={40} />
            ) : (
              <div
                className={clsx(
                  "w-[40px] h-[40px] rounded-full border",
                  // Today (not completed yet) gets the brand ring, per the reference.
                  item.day.toLowerCase() === "today" ? "border-2 border-brand" : "border-gray-300",
                )}
              />
            )}

            <div
              className={clsx(
                item.completed
                  ? "body-small !font-semibold text-surface-gray-subtle"
                  : "body-small font-normal text-surface-gray-muted",
                item?.day.toLocaleLowerCase() === "today" ? "!text-brand !font-semibold" : "",
              )}
            >
              {item.day}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <div className="flex gap-1 text-surface-gray-normal text-center">
          {highlightTextUtil(
            t("learningStreak.minutesToKeepStreak", {
              minutes: streak.required_minutes,
              streak: streak.current_streak,
            }),
            [
              t("learningStreak.minute", {
                minutes: streak.required_minutes,
              }),
              t("learningStreak.day", {
                streak: streak.current_streak,
              }),
            ],
            "body-large !font-semibold text-surface-gray-normal",
          )}
        </div>

        <div className="body-small text-surface-gray-muted">
          {t("learningStreak.longestStreak", {
            days: streak.longest_streak,
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(LearningStreak);

/* ---------------------------------- Skeleton ---------------------------------- */

const LearningStreakSkeleton = ({
  bgColor,
  rounded,
  title,
}: {
  bgColor: string;
  rounded: string;
  title: string;
}) => {
  return (
    <div className={clsx("w-full flex flex-col gap-4 p-4", bgColor, rounded)}>
      <div className="heading-medium !font-semibold">{title}</div>

      <div className="flex justify-between sm:gap-4 overflow-x-auto -mx-2 px-2 sm:px-4 sm:-mx-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-8 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-40 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
};
