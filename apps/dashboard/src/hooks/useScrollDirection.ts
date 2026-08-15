import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks scroll direction of `target` (defaults to `window`). Small scrolls
 * (< 35px) are ignored so direction doesn't flip on every frame.
 */
export function useScrollDirection(target?: RefObject<HTMLElement | null>) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = target?.current ?? window;
    lastScrollY.current = target?.current
      ? target.current.scrollTop
      : window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = target?.current
        ? target.current.scrollTop
        : window.scrollY;

      if (Math.abs(scrollY - lastScrollY.current) < 35) return; // ignore small scrolls

      setScrollDirection(scrollY > lastScrollY.current ? "down" : "up");
      lastScrollY.current = scrollY;
    };

    el.addEventListener("scroll", updateScrollDirection);

    return () => {
      el.removeEventListener("scroll", updateScrollDirection);
    };
  }, [target]);

  return scrollDirection;
}
