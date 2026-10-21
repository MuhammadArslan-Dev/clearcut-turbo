"use client";

import { useEffect, useState } from "react";

/**
 * Consolidated from byte-identical copies in apps/landing and apps/blog
 * during Phase 4.
 *
 * A plain passive scroll listener — this used framer-motion's `useScroll`
 * only to read `scrollY`, which pulled all of framer into every page that
 * renders a header. Same rule: shadow on once the page is scrolled past
 * `offset`. setState with an unchanged boolean doesn't re-render.
 */
export function useScrollShadow(offset = 10) {
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const update = () => setShowShadow(window.scrollY > offset);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [offset]);

  return showShadow;
}
