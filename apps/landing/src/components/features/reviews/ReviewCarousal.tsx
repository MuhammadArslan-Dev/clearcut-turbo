"use client";

import React, { useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import ReviewCard, { ReviewsItem } from "./ReviewCard";

interface ReviewCarousalProps {
  reviews: ReviewsItem[];
  speed?: number; // px per second
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  imgClassName?: string;
}

export default function ReviewCarousal({
  reviews,
  speed = 80,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: ReviewCarousalProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const shouldReduceMotion = useReducedMotion();

  // ⭐ Motion value (NO React state)
  const x = useMotionValue(0);

  const trackWidthRef = useRef(0);
  const pausedRef = useRef(false);

  // Measure track width
  useEffect(() => {
    if (trackRef.current) {
      trackWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  }, [reviews]);

  // Animation loop
  useAnimationFrame((_, delta) => {
    if (shouldReduceMotion || pausedRef.current) return;

    const moveBy = (speed * delta) / 1000;
    const width = trackWidthRef.current;

    let next = direction === "left" ? x.get() - moveBy : x.get() + moveBy;

    // ⭐ Seamless wrap WITHOUT reset jump
    if (direction === "left") {
      if (next <= -width) next += width;
    } else {
      if (next >= 0) next -= width;
    }

    x.set(next);
  });

  return (
    <div
      className={`overflow-hidden w-full ${className}`}
      onMouseEnter={() => pauseOnHover && (pausedRef.current = true)}
      onMouseLeave={() => pauseOnHover && (pausedRef.current = false)}
      onTouchStart={() => pauseOnHover && (pausedRef.current = true)}
      onTouchEnd={() => pauseOnHover && (pausedRef.current = false)}
      aria-label="Logo carousel"
    >
      <motion.div
        ref={trackRef}
        className="flex items-center gap-6 w-max"
        style={{ x }}
      >
        {/* Auto duplicated */}
        {[...reviews, ...reviews, ...reviews].map((review, i) => (
          <ReviewCard key={i} {...review} />
        ))}
      </motion.div>
    </div>
  );
}
