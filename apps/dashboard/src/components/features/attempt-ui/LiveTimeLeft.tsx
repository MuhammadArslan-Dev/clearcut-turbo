"use client";

import { memo, useState } from "react";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import CountDownTimer from "@/components/features/exam/components/countdown/CountDownTimer";

const pad = (n: number) => String(n).padStart(2, "0");

type LiveTimeLeftProps = {
  /** Seconds to count down from. */
  duration: number;
  /** Fired once when the countdown reaches zero (Daily Test auto-submit). */
  onComplete?: () => void;
  labels?: { timeLeft: string; hours: string; minutes: string; seconds: string };
  /** Smaller icon / digits / labels — used by the full exam page. */
  compact?: boolean;
};

const DEFAULT_LABELS = { timeLeft: "Time Left", hours: "Hours", minutes: "Minutes", seconds: "Seconds" };

/**
 * Big "Time Left  02 : 29 : 36" readout. The countdown maths/expiry stay in
 * the existing CountDownTimer (its own box UI is hidden; onTick feeds this
 * display), and the once-a-second tick re-renders only this component.
 * Turns red in the last five minutes.
 */
function LiveTimeLeft({
  duration,
  onComplete,
  labels = DEFAULT_LABELS,
  compact = false,
}: LiveTimeLeftProps) {
  const [t, setT] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const isLow = duration > 0 && t.hours === 0 && t.minutes < 5;
  const tone = isLow ? "text-[var(--color-danger)]" : "text-brand";

  return (
    <div className={`flex items-center gap-3 ${compact ? "justify-center lg:justify-start" : ""}`}>
      <div className="hidden">
        <CountDownTimer duration={duration} onTick={setT} onComplete={onComplete} />
      </div>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand/9 ${
          compact ? "h-9 w-9 lg:h-11 lg:w-11" : "h-14 w-14 lg:h-16 lg:w-16"
        }`}
      >
        <SandTimerIcon size={compact ? 20 : 30} color="var(--color-brand)" />
      </span>
      <div>
        <p className={`!font-semibold ${compact ? "body-medium hidden lg:block" : "body-large"} ${tone}`}>{labels.timeLeft}</p>
        <div className="flex items-end gap-2">
          <Unit value={t.hours} label={labels.hours} tone={tone} compact={compact} />
          <span className={`${compact ? "pb-3 text-[20px]" : "pb-4 text-[26px]"} !font-semibold leading-none ${tone}`}>:</span>
          <Unit value={t.minutes} label={labels.minutes} tone={tone} compact={compact} />
          <span className={`${compact ? "pb-3 text-[20px]" : "pb-4 text-[26px]"} !font-semibold leading-none ${tone}`}>:</span>
          <Unit value={t.seconds} label={labels.seconds} tone={tone} compact={compact} />
        </div>
      </div>
    </div>
  );
}

const Unit = ({ value, label, tone, compact }: { value: number; label: string; tone: string; compact: boolean }) => (
  <div className="flex flex-col items-center">
    <span className={`${compact ? "text-[22px] lg:text-[24px]" : "text-[32px]"} !font-bold leading-none ${tone}`}>{pad(value)}</span>
    <span className={`${compact ? "body-xsmall" : "body-small mt-1"} text-surface-gray-muted`}>{label}</span>
  </div>
);

export default memo(LiveTimeLeft);
