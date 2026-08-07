import React, { useEffect, useState, useCallback, useMemo } from "react";

import CounterCard from "@/components/ui/cards/CounterCard";
import TimerDotes from "@/components/ui/widgets/timer/TimerDotes";

/* --------------------------------------------
   Types
---------------------------------------------*/

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
};

type TimerColors = {
  text: string;
  border: string;
  bg: string;
};

type CountDownTimerProps = {
  targetTime?: number | string | Date;
  duration?: number;

  /** Override colors manually */
  customColors?: TimerColors;

  /** Fires every second */
  onTick?: (time: TimeLeft) => void;

  /** Fires when finished */
  onComplete?: () => void;
};

/* --------------------------------------------
   Helpers
---------------------------------------------*/

function format(num: number) {
  return String(num).padStart(2, "0");
}

function calculateTimeLeft(ms: number): TimeLeft {
  if (ms <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const total = Math.floor(ms / 1000);

  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/* --------------------------------------------
   Color Presets
---------------------------------------------*/

const TIMER_COLORS = {
  high: {
    text: "!text-[#d92d20]",
    border: "border-[#d92d20]",
    bg: "bg-[#d92d20]/12",
  },

  medium: {
    text: "!text-[var(--icon-notice-normal)]",
    border: "border-[var(--icon-notice-normal)]",
    bg: "bg-[var(--icon-notice-normal)]/12",
  },

  low: {
    text: "!text-[#0083ff]",
    border: "border-[#0083ff]",
    bg: "bg-[#0083ff]/12",
  },
};

/* --------------------------------------------
   Component
---------------------------------------------*/

export default function CountDownTimer({
  targetTime,
  duration,
  customColors,
  onTick,
  onComplete,
}: CountDownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [totalMs, setTotalMs] = useState(0);

  /* --------------------------------------------
     End Time
  ---------------------------------------------*/

  const getEndTime = useCallback(() => {
    if (targetTime) {
      return new Date(targetTime).getTime();
    }

    if (duration) {
      return Date.now() + duration * 1000;
    }

    return null;
  }, [targetTime, duration]);

  /* --------------------------------------------
     Timer
  ---------------------------------------------*/

  useEffect(() => {
    const end = getEndTime();

    if (!end) return;

    const total = end - Date.now();
    setTotalMs(total);

    const timer = setInterval(() => {
      const diff = end - Date.now();

      const next = calculateTimeLeft(diff);

      setTimeLeft(next);
      onTick?.(next);

      if (diff <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getEndTime, onTick, onComplete]);

  /* --------------------------------------------
     Progress %
  ---------------------------------------------*/

  const percentageLeft = useMemo(() => {
    const current =
      (timeLeft.hours * 3600 +
        timeLeft.minutes * 60 +
        timeLeft.seconds) *
      1000;

    if (!totalMs) return 0;

    return (current / totalMs) * 100;
  }, [timeLeft, totalMs]);

  /* --------------------------------------------
     Resolve Colors
  ---------------------------------------------*/

  const colors = useMemo(() => {
    // Manual override
    if (customColors) {
      return {
        text: customColors.text,
        border: customColors.border,
        bg: customColors.bg,
      };
    }

    // Auto mode
    if (percentageLeft <= 75) return TIMER_COLORS.high;
    if (percentageLeft <= 90) return TIMER_COLORS.medium;

    return TIMER_COLORS.low;
  }, [percentageLeft, customColors]);

  /* --------------------------------------------
     UI Props
  ---------------------------------------------*/

  const cardProps = {
    width: "w-6",
    height: "h-5",

    bgColor: colors.bg,
    borderColor: `${colors.border} border-2`,
    rounded: "rounded-sm",

    textClass: `body-small !font-semibold ${colors.text}`,
  };

  const values = [
    format(timeLeft.hours),
    format(timeLeft.minutes),
    format(timeLeft.seconds),
  ];

  /* --------------------------------------------
     Render
  ---------------------------------------------*/

  return (
    <div className="flex items-center gap-1">
      {values.map((value, i) => (
        <React.Fragment key={i}>
          <CounterCard {...cardProps} value={value} />

          {i < values.length - 1 && (
            <TimerDotes
              height={12}
              gap={8}
              color="var(--icon-gray-muted)"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
