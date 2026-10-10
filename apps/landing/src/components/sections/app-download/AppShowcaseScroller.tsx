"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef } from "react";

// The only client-side bit of the App Showcase section: scrolling the
// snap-container by one card on arrow click. No state, no animation library —
// plain `scrollBy`, same as a native horizontal-scroll list.
export default function AppShowcaseScroller({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-showcase-card]");
    const amount = (card?.offsetWidth ?? 260) + 24;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="hidden sm:flex absolute -top-16 right-0 gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className="w-10 h-10 rounded-full border border-border-gray-subtle grid place-items-center text-text-gray-muted hover:border-brand hover:text-brand transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next"
          className="w-10 h-10 rounded-full border border-border-gray-subtle grid place-items-center text-text-gray-muted hover:border-brand hover:text-brand transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Always a horizontal scroller (not grid-on-desktop): 5 real
          screenshot cards don't comfortably fit one row at a legible width,
          unlike the earlier 4 CSS-mockup cards this replaced. */}
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-3 px-3 -mx-3 pb-2"
      >
        {children}
      </div>
    </div>
  );
}
