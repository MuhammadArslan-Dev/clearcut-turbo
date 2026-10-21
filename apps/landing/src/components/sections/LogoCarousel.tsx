"use client";

import React, { useRef, useEffect } from "react";
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

// Each item is w-[88px] and the track is gap-14 (56px): one set of logos is
// logos.length × (88 + 56) px. Used for the server render; the real distance
// is measured on mount.
const ITEM_WIDTH = 88;
const GAP = 56;

/**
 * Endless logo strip. The motion is the CSS keyframe `.logo-marquee`
 * (globals.css), not a framer-motion rAF loop: it runs on the compositor
 * from first paint and needs no JS per frame. `speed` px/s, pauses while
 * hovered or touched, still under prefers-reduced-motion.
 *
 * It loops after exactly one set of logos. (The framer version wrapped at
 * half the track — 1.5 sets — so the logos jumped half a set every cycle.)
 */
export default function LogoCarousel({
  logos,
  speed = 80,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: LogoCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const items = [...logos, ...logos, ...logos];
  const estimatedSet = logos.length * (ITEM_WIDTH + GAP);

  // Measure one set exactly (start of the 2nd set − start of the 1st) and
  // set the matching duration, so the speed stays `speed` px/s.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !logos.length) return;
    const first = track.children[0] as HTMLElement | undefined;
    const second = track.children[logos.length] as HTMLElement | undefined;
    if (!first || !second) return;
    const set = second.offsetLeft - first.offsetLeft;
    if (set > 0) {
      track.style.setProperty("--marquee-shift", `${-set}px`);
      track.style.setProperty("--marquee-duration", `${set / speed}s`);
    }
  }, [logos, speed]);

  const setPaused = (paused: boolean) => {
    if (!pauseOnHover || !rootRef.current) return;
    if (paused) rootRef.current.setAttribute("data-paused", "");
    else rootRef.current.removeAttribute("data-paused");
  };

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden w-full ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      aria-label="Logo carousel"
    >
      <div
        ref={trackRef}
        className="logo-marquee flex items-center gap-14 w-max"
        style={
          {
            "--marquee-shift": `${-estimatedSet}px`,
            "--marquee-duration": `${estimatedSet / speed}s`,
            animationDirection: direction === "left" ? "normal" : "reverse",
          } as React.CSSProperties
        }
      >
        {/* Auto duplicated */}
        {items.map((logo, i) => (
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
      </div>
    </div>
  );
}
