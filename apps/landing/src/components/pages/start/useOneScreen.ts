"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The prototype's fit(): the page is exactly one (visual) viewport tall, and
 * when the on-screen keyboard opens (`kb`) the decoration collapses so the
 * field and the button stay visible. `column` = bubble above a big mascot
 * (desktop >= 860 x 600, or a phone at least 700 tall without the keyboard).
 */
export function useOneScreen() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [kb, setKb] = useState(false);
  const [column, setColumn] = useState(false);

  useEffect(() => {
    let baseH = window.innerHeight;
    const fit = () => {
      const vv = window.visualViewport;
      const h = vv ? vv.height : window.innerHeight;
      if (window.innerHeight > baseH) baseH = window.innerHeight;
      ref.current?.style.setProperty("--vh", `${h}px`);
      const keyboard = h < baseH - 140 || h < 430;
      const w = window.innerWidth;
      setKb(keyboard);
      setColumn(!keyboard && ((w >= 860 && h >= 600) || h >= 700));
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    const onOrientation = () => {
      baseH = 0;
      setTimeout(fit, 250);
    };
    fit();
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);

  return { ref, kb, column };
}
