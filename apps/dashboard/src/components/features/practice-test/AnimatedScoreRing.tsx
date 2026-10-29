"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Score ring that draws itself and counts the score up (no motion when the user prefers reduced motion). */
export default function AnimatedScoreRing({
  score,
  total,
  label,
}: {
  score: number;
  total: number;
  label: string;
}) {
  const reduce = useReducedMotion();
  const progress = useMotionValue(reduce ? 1 : 0);
  const offset = useTransform(progress, (p) => CIRCUMFERENCE * (1 - p * (total > 0 ? score / total : 0)));
  const [shown, setShown] = useState(reduce ? score : 0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(progress, 1, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (p) => setShown(Math.round(p * score)),
    });
    return () => controls.stop();
  }, [progress, reduce, score]);

  return (
    <div className="relative h-[140px] w-[140px] shrink-0 sm:h-[168px] sm:w-[168px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="14" className="stroke-gray-100" />
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          stroke="var(--icon-positive-subtle)"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="heading-large !font-bold">
          {shown}
          <span className="heading-small !font-normal text-surface-gray-muted"> / {total}</span>
        </span>
        <span className="body-medium text-surface-gray-muted">{label}</span>
      </div>
    </div>
  );
}
