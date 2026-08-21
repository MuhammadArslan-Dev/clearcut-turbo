import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks scroll direction of `target` (defaults to `window`). Small scrolls
 * (< 35px) are ignored so direction doesn't flip on every frame.
 *
 * A direction only commits once the same direction is seen on two
 * consecutive qualifying scroll events. This is deliberate: swapping in a
 * skeleton (or the real data replacing it) can change the container's
 * content height enough that the browser clamps/adjusts scrollTop on its
 * own, firing a single scroll event that looks identical to a real user
 * scroll — which flipped direction on a one-off content reflow with nothing
 * to do with the user's finger/mouse, and consumers that hide/show a topbar
 * on direction change would visibly flicker while data was loading. A
 * genuine scroll gesture keeps firing events in the same direction, so
 * requiring two in a row filters out the one-off reflow jump without adding
 * perceptible lag to real scrolling.
 */
export function useScrollDirection(target?: RefObject<HTMLElement | null>) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollY = useRef(0);
  const pendingDirection = useRef<"up" | "down" | null>(null);

  useEffect(() => {
    const el = target?.current ?? window;
    lastScrollY.current = target?.current
      ? target.current.scrollTop
      : window.scrollY;
    pendingDirection.current = null;

    const updateScrollDirection = () => {
      const scrollY = target?.current
        ? target.current.scrollTop
        : window.scrollY;

      if (Math.abs(scrollY - lastScrollY.current) < 35) return; // ignore small scrolls

      const direction = scrollY > lastScrollY.current ? "down" : "up";
      lastScrollY.current = scrollY;

      if (pendingDirection.current !== direction) {
        pendingDirection.current = direction;
        return;
      }

      setScrollDirection(direction);
    };

    el.addEventListener("scroll", updateScrollDirection);

    return () => {
      el.removeEventListener("scroll", updateScrollDirection);
    };
  }, [target]);

  return scrollDirection;
}
