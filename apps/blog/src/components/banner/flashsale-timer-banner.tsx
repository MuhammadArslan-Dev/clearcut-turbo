// components/FlashSaleTimerBanner.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";

// --- Types & Constants ---

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

// 1. Updated Props: saleEndDate is now optional (via the '?' operator).
interface FlashSaleTimerBannerProps {
  saleEndDate?: string | number | Date; // Optional prop
  message: string;
}

// Helper to calculate time remaining
const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = +targetDate - +new Date();
  let timeLeft: TimeLeft = { hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft = {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

// Helper to calculate the default 20-minute target date
const calculateDefaultTarget = () => {
  const defaultTimeInMinutes = 20;
  const now = new Date();
  // This creates a Date object that is 20 minutes from the current time.
  return new Date(now.getTime() + defaultTimeInMinutes * 60 * 1000);
};

// --- Main Component ---

const FlashSaleTimerBanner: React.FC<FlashSaleTimerBannerProps> = ({
  saleEndDate,
  message,
}) => {
  // 2. Determine the target date: use prop if provided, otherwise use the 20-minute default.
  const targetDate = useMemo(() => {
    if (saleEndDate) {
      return new Date(saleEndDate);
    }
    return calculateDefaultTarget();
  }, [saleEndDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    // Set up the interval timer
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    // Cleanup function
    return () => clearInterval(timer);
  }, [targetDate]);

  const isTimeUp =
    timeLeft.hours <= 0 && timeLeft.minutes <= 0 && timeLeft.seconds <= 0;

  const timerComponents: { value: number }[] = [
    { value: timeLeft.hours },
    { value: timeLeft.minutes },
    { value: timeLeft.seconds },
  ];

  const TimeBox: React.FC<{ value: number }> = ({ value }) => (
    <div className="bg-white flex items-center justify-center text-black rounded-sm font-bold text-sm w-[24px] h-6 ">
      {String(value).padStart(2, "0")}
    </div>
  );

  return (
    <div className="w-full bg-brand-dark shadow-lg relative overflow-hidden">
      {/* Subtle top gradient for aesthetic match */}
      <div className="absolute top-0 left-0 w-full h-1"></div>

      <div className="flex flex-col md:flex-row items-center justify-center py-1 px-4 text-white text-sm mx-auto gap-2">
        <span
          className="text-xl mr-3 hidden md:block"
          role="img"
          aria-label="discount tag"
        >
          🏷️
        </span>

        <p className="font-semibold text-center ">
          {isTimeUp ? "This flash sale has ended. Check back soon!" : message}
        </p>

        {/* Timer Display */}
        {!isTimeUp && (
          <div className="flex space-x-1 ml-0 md:ml-4">
            {timerComponents.map((time, index) => (
              <React.Fragment key={index}>
                <TimeBox value={time.value} />
                {/* Separator Dots */}
                {index < timerComponents.length - 1 && (
                  <span className=" font-bold text-white">:</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSaleTimerBanner;
