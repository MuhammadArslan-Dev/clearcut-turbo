"use client";

import { useOfferStore } from "@/store/useOfferStore";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const TimerBox: React.FC<{ value: string }> = ({ value }) => (
  <div className="bg-white text-[#006BD1] px-0.5 py-0.5 rounded-[2px] body-medium !font-semibold tracking-wider w-[24px] text-center">
    {value}
  </div>
);

const STORAGE_KEY = "countdown_start";
const DEFAULT_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Inline pre-paint script (rendered by the blog layout before the banner).
 * The server can't know a visitor's countdown, so it always renders the
 * banner; once the offer has ended (it never restarts), hydration then
 * removed it and the whole page jumped up ~32px on every load. This marks
 * <html data-offer-ended> before the banner paints, and globals.css hides
 * [data-countdown-banner] under it. Same rule as the effect below; the
 * effect still runs and unmounts the banner as before.
 */
export const COUNTDOWN_ENDED_SCRIPT = `try{var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(s&&Date.now()>=parseInt(s,10)+${DEFAULT_DURATION})document.documentElement.setAttribute("data-offer-ended","")}catch(e){}`;

interface CountdownBannerProps {
  message?: React.ReactNode;
  /** Duration in milliseconds */
  duration?: number;
  className?: string;
}

const CountdownBanner: React.FC<CountdownBannerProps> = ({
  message,
  duration = DEFAULT_DURATION,
  className = "bg-[#006BD1]",
}) => {
  const { setOfferEnd } = useOfferStore();

  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const storageKey = STORAGE_KEY;
    let startTime = localStorage.getItem(storageKey);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(storageKey, startTime);
    }

    const targetTime = parseInt(startTime) + duration;

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        });
        setOfferEnd(false); // offer still valid
      } else {
        setIsVisible(false);
        setOfferEnd(true); // offer ended
        // localStorage.removeItem(storageKey);
        clearInterval(interval);
      }
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(interval);
  }, [duration]);

  if (!isVisible) return null;

  // decide format dynamically
  const showDays = duration >= 24 * 60 * 60 * 1000;
  const showHours = duration >= 60 * 60 * 1000;
  const showMinutes = duration >= 60 * 1000;

  return (
    <div data-countdown-banner className={`w-full px-4 py-1 text-white ${className}`} role="alert">
      <div className="flex items-center justify-center gap-x-2 md:gap-x-4 gap-y-1 flex-wrap">
        <div className="flex items-center gap-3">
          <Image
            src="/images/offers-white-fill.svg"
            alt="clock"
            width={24}
            height={24}
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="body-medium !font-semibold text-center">{message}</p>
        </div>

        <div className="flex items-center" aria-label="Time remaining">
          {showDays && (
            <>
              <TimerBox value={timeLeft.days} />
              <span className="font-semibold text-white/80 w-2 text-center -mt-1">
                :
              </span>
            </>
          )}

          {showHours && (
            <>
              <TimerBox value={timeLeft.hours} />
              <span className="font-semibold text-white/80  w-2 text-center  -mt-1">
                :
              </span>
            </>
          )}

          {showMinutes && (
            <>
              <TimerBox value={timeLeft.minutes} />
              <span className="font-semibold text-white/80  w-2 text-center  -mt-1">
                :
              </span>
            </>
          )}

          {/* Always show seconds */}
          <TimerBox value={timeLeft.seconds} />
        </div>
      </div>
    </div>
  );
};

export default CountdownBanner;
