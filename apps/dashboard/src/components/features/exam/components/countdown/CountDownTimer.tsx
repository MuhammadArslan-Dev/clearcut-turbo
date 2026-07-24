import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import CounterCard from "@/components/ui/cards/CounterCard";
import TimerDotes from "@/components/ui/widgets/timer/TimerDotes";

/* ======================================================
   Types
====================================================== */

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
  /* End at this time */
  targetTime?: number | string | Date;

  /* Or run for this many seconds */
  duration?: number;

  /* Manual color override */
  customColors?: TimerColors;

  /* Start paused */
  defaultPaused?: boolean;

  /* Callbacks */
  onTick?: (time: TimeLeft) => void;
  onComplete?: () => void;

  /* Expose controls */
  onReady?: (controls: TimerControls) => void;
};

type TimerControls = {
  pause: () => void;
  resume: () => void;
  reset: () => void;
};

/* ======================================================
   Color Presets (Auto Mode)
====================================================== */

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

/* ======================================================
   Helpers
====================================================== */

function format(num: number) {
  return String(num).padStart(2, "0");
}

function msToTime(ms: number): TimeLeft {
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

/* ======================================================
   Component
====================================================== */

export default function CountDownTimer({
  targetTime,
  duration,
  customColors,
  defaultPaused = false,

  onTick,
  onComplete,
  onReady,
}: CountDownTimerProps) {
  /* -------------------------------------------------- */
  /* State */
  /* -------------------------------------------------- */

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [paused, setPaused] = useState(defaultPaused);

  const [totalMs, setTotalMs] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* -------------------------------------------------- */
  /* Init End Time */
  /* -------------------------------------------------- */

  const initEndTime = useCallback(() => {
    if (targetTime) {
      return new Date(targetTime).getTime();
    }

    if (duration) {
      return Date.now() + duration * 1000;
    }

    return null;
  }, [targetTime, duration]);

  /* -------------------------------------------------- */
  /* Start Timer */
  /* -------------------------------------------------- */

  const start = useCallback(() => {
    if (!endTimeRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (paused) return;

      const diff = endTimeRef.current! - Date.now();

      const next = msToTime(diff);

      setTimeLeft(next);
      onTick?.(next);

      if (diff <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        onComplete?.();
      }
    }, 1000);
  }, [paused, onTick, onComplete]);

  /* -------------------------------------------------- */
  /* Reset */
  /* -------------------------------------------------- */

  const reset = useCallback(() => {
    const end = initEndTime();

    if (!end) return;

    endTimeRef.current = end;

    const total = end - Date.now();
    setTotalMs(total);

    setTimeLeft(msToTime(total));

    start();
  }, [initEndTime, start]);

  /* -------------------------------------------------- */
  /* Pause / Resume */
  /* -------------------------------------------------- */

  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  /* -------------------------------------------------- */
  /* Expose Controls */
  /* -------------------------------------------------- */

  useEffect(() => {
    onReady?.({
      pause,
      resume,
      reset,
    });
  }, [pause, resume, reset, onReady]);

  /* -------------------------------------------------- */
  /* Init */
  /* -------------------------------------------------- */

  useEffect(() => {
    reset();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reset]);

  /* -------------------------------------------------- */
  /* Progress % */
  /* -------------------------------------------------- */

  const percentLeft = useMemo(() => {
    const current =
      (timeLeft.hours * 3600 +
        timeLeft.minutes * 60 +
        timeLeft.seconds) *
      1000;

    if (!totalMs) return 0;

    return (current / totalMs) * 100;
  }, [timeLeft, totalMs]);

  /* -------------------------------------------------- */
  /* Resolve Colors */
  /* -------------------------------------------------- */

  const colors = useMemo(() => {
    if (customColors) return customColors;

    if (percentLeft <= 75) return TIMER_COLORS.high;
    if (percentLeft <= 90) return TIMER_COLORS.medium;

    return TIMER_COLORS.low;
  }, [percentLeft, customColors]);

  /* -------------------------------------------------- */
  /* UI Props */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------- */

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
