"use client";

import React, { useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import Text from "@clearcut/ui/text";
import Image from "next/image";

interface LogoItem {
  src: string | React.ReactNode;
  title: string;
  subtitle?: string;
}

interface LogoCarouselProps {
  logos: LogoItem[];
  speed?: number; // px per second
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  imgClassName?: string;
}

export default function LogoCarousel({
  logos,
  speed = 80,
  direction = "left",
  pauseOnHover = true,
  className = "",
  imgClassName = "",
}: LogoCarouselProps) {
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
  }, [logos]);

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
        className="flex items-center gap-14 w-max"
        style={{ x }}
      >
        {/* Auto duplicated */}
        {[...logos, ...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="w-[88px] flex flex-col items-center gap-4 flex-shrink-0"
          >
            {/* Tailwind's preflight resets all <img> to height:auto, which
                overrides the aspect-ratio Next/Image would otherwise derive
                from width/height — so the browser can't reserve this box
                until the image (an S3-hosted exam logo, not guaranteed
                square) finishes loading. aspect-square locks the box back
                to 88x88 regardless of the source's real ratio, and
                object-contain keeps a non-square logo from stretching to
                fill it — this was the single largest Cumulative Layout
                Shift contributor on this page (compounded across the many
                logos in this carousel). */}
            <Image
              src={logo.src?.toString() ?? "/icons/Logo-48x48.png"}
              alt={logo.title}
              width={88}
              height={88}
              className="grayscale opacity-70 aspect-square object-contain"
              sizes="88px"
            />

            <div>
              <Text
                as="p"
                variant="body-large"
                weight="semibold"
                className="text-center"
              >
                {logo.title}
              </Text>

              <Text as="p" variant="body-xsmall" className="text-center whitespace-nowrap">
                {logo.subtitle}
              </Text>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
