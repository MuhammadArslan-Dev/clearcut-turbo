import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks scroll position of `target` (defaults to `window`) as a live pixel
 * offset, 1:1 with the scroll gesture: scroll down 5px and the returned
 * value grows by 5, scroll up 5px and it shrinks by 5 — no threshold, no
 * fixed-duration snap. Clamped to `[0, maxOffset]` and always reset to 0
 * once the container is scrolled back to the top.
 *
 * Consumers (Topbar) turn this into a hide/show effect by shrinking their
 * own height and translating their content by the same amount, so the
 * motion always exactly matches how far the user has actually scrolled.
 */
export function useScrollHideOffset(
  target: RefObject<HTMLElement | null> | undefined,
  maxOffset: number,
) {
  const [offset, setOffset] = useState(0);
  const lastScrollY = useRef(0);
  const pendingOffset = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const el = target?.current ?? window;
    const getScrollY = () =>
      target?.current ? target.current.scrollTop : window.scrollY;

    lastScrollY.current = getScrollY();
    pendingOffset.current = 0;
    setOffset(0);

    const handleScroll = () => {
      const scrollY = getScrollY();
      const delta = scrollY - lastScrollY.current;
      lastScrollY.current = scrollY;

      // A genuine scroll gesture never jumps this far in a single event —
      // this is the same reflow guard `useScrollDirection` used (a skeleton
      // swapping for real content can change the container's scroll height
      // enough that the browser clamps/adjusts scrollTop on its own). Drop
      // it rather than let a one-off layout jump snap the header away.
      if (Math.abs(delta) > 150) return;

      const next =
        scrollY <= 0
          ? 0
          : Math.min(maxOffset, Math.max(0, pendingOffset.current + delta));

      pendingOffset.current = next;

      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          setOffset(pendingOffset.current);
          rafId.current = null;
        });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [target, maxOffset]);

  return offset;
}
