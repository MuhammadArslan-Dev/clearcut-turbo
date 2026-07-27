import clsx from "clsx";
import React, { memo, useEffect, useMemo, useState } from "react";
import CountDownCard from "./CountDownCard";
import TimerDotes from "./TimerDotes";
import { Exam, ExamMetadata } from "@/types/Exam";
import {
  getCountdownFromFormattedDate2,
  CountdownTime,
} from "@/utils/date/dateUtils";
import { useTranslations } from "next-intl";

interface RemainingTimeWrapperProps {
  bgColor?: string;
  rounded?: string;
  exam?: Exam;
}

const RemainingTimeWrapper: React.FC<RemainingTimeWrapperProps> = ({
  bgColor = "bg-white",
  rounded = "",
  exam,
}) => {
  const t = useTranslations();

  // ✅ Memoize metadata parsing
  const metaData = useMemo<ExamMetadata>(() => {
    if (!exam?.metadata) return {};
    return typeof exam.metadata === "string"
      ? JSON.parse(exam.metadata)
      : exam.metadata;
  }, [exam?.metadata]);

  const milestoneDate = metaData?.exam_date;
  // const milestoneDate = '1-4-2026';

  /* ---------------- Exam-date-passed Guard ----------------
     `getCountdownFromFormattedDate2` clamps with `Math.max(target - now, 0)`,
     so once the exam date is in the past every unit is 0. The render below then
     falls through to its `time.days === 0` branch and shows a "0 Secs" counter
     next to a date that has already gone by — which is what this widget was
     doing locally ("0 / Secs" above "04 July 2026").

     The clamp itself is left alone: other callers depend on never receiving a
     negative countdown. Instead the "has it passed?" question is answered here,
     explicitly, and the widget removes itself.

     An unparseable date is deliberately NOT treated as passed — `NaN <= now` is
     false anyway, but stating it makes the intent clear: only a date we can
     actually read and that is genuinely behind us hides the widget. "upcoming"
     keeps its existing early return further down.                            */
  const examDatePassed = useMemo(() => {
    if (!milestoneDate || milestoneDate.toLowerCase() === "upcoming") {
      return false;
    }
    const target = new Date(milestoneDate).getTime();
    if (Number.isNaN(target)) return false;
    return target <= Date.now();
  }, [milestoneDate]);

  /* ---------------- Loading Guard ---------------- */

  // ✅ Lazy init
  const [time, setTime] = useState<CountdownTime>(() =>
    getCountdownFromFormattedDate2(milestoneDate),
  );

  // ✅ Update only when values change
  useEffect(() => {
    if (!milestoneDate) return;
    // Nothing left to count down to — don't run a 1s timer forever behind a
    // widget that is no longer rendered.
    if (examDatePassed) return;

    const interval = setInterval(() => {
      setTime((prev = { days: 0, hours: 0, minutes: 0, seconds: 0 }) => {
        const next = getCountdownFromFormattedDate2(milestoneDate);

        if (
          prev.days === next.days &&
          prev.hours === next.hours &&
          prev.minutes === next.minutes &&
          prev.seconds === next.seconds
        ) {
          return prev; // ⛔ no re-render
        }

        return next; // ✅ real change
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [milestoneDate, examDatePassed]);

  if (!milestoneDate) {
    return <RemainingTimeSkeleton />;
  }
  // Exam is over — hide the whole widget rather than showing a dead 0 counter.
  if (examDatePassed) return null;

  if (milestoneDate?.toLowerCase() === "upcoming") return;
  return (
    <div className={clsx("space-y-4 p-4", bgColor, rounded)}>
      <p className="heading-medium !font-semibold">
        {t("timeRemainingTillExam.title")}
      </p>

      {milestoneDate?.toLowerCase() !== "upcoming" && (
        <div className="flex justify-center items-center gap-3">
          {time.days > 0 && (
            <>
              <CountDownCard
                count={time.days}
                text={t("timeRemainingTillExam.countdown.days", {
                  count: time.days,
                })}
              />
              <TimerDotes />
            </>
          )}

          {(time.days > 0 || time.hours > 0) && (
            <>
              <CountDownCard
                count={time.hours}
                text={t("timeRemainingTillExam.countdown.hours", {
                  count: time.hours,
                })}
              />
              <TimerDotes />
            </>
          )}

          {(time.days > 0 || time.hours > 0 || time.minutes > 0) && (
            <>
              <CountDownCard
                count={time.minutes}
                text={t("timeRemainingTillExam.countdown.minutes", {
                  count: time.minutes,
                })}
              />
              {time.days === 0 && <TimerDotes />}
            </>
          )}

          {time.days === 0 && (
            <CountDownCard
              count={time.seconds}
              text={t("timeRemainingTillExam.countdown.seconds", {
                count: time.seconds,
              })}
            />
          )}
        </div>
      )}

      <div className="flex flex-col items-center">
        <p className="heading-medium !font-semibold">{metaData?.exam_date}</p>
        <p className="body-medium text-[#8d9097]">
          {t("timeRemainingTillExam.upgradeHint")}
        </p>
      </div>
    </div>
  );
};

export default memo(RemainingTimeWrapper);
const RemainingTimeSkeleton = ({
  bgColor = "bg-white",
  rounded = "rounded-md",
}: {
  bgColor?: string;
  rounded?: string;
}) => {
  return (
    <div className={clsx("space-y-4 p-4", bgColor, rounded)}>
      {/* Title */}
      <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />

      {/* Timer */}
      <div className="flex justify-center items-center gap-3">
        <div className="h-16 w-16 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-gray-300" />
        <div className="h-16 w-16 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-gray-300" />
        <div className="h-16 w-16 rounded-lg bg-gray-200 animate-pulse" />
      </div>

      {/* Date + subtitle */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
};
