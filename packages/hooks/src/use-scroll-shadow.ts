"use client";

import { useScroll } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Consolidated from byte-identical copies in apps/landing and apps/blog
 * during Phase 4.
 */
export function useScrollShadow(offset = 10) {
  const { scrollY } = useScroll();
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (y) => {
      setShowShadow(y > offset);
    });
  }, [scrollY, offset]);

  return showShadow;
}
