import { useEffect, useLayoutEffect, type RefObject } from "react";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";

// Mobile scroll-hide of the Topbar's title row, and the bottom elements that
// grow into view in sync with it. These run every animation frame while the
// user scrolls, so nothing here goes through React state: the scroll offset
// is written straight into useTopbarVisibilityStore, and each consumer
// subscribes to the store outside React and writes its styles to the DOM
// itself. React state used to carry the offset, which re-rendered the shells
// (incl. the 871-line preparation Sidebar) and every Topbar child on every
// frame (speedaudit.md #2/#3, INP). The visual behaviour is unchanged.

/**
 * Writes `target`'s (default: window) scroll position into the store as a
 * live pixel offset, 1:1 with the scroll gesture: scroll down 5px and it grows
 * by 5, scroll up 5px and it shrinks by 5 — no threshold, no fixed-duration
 * snap. Clamped to `[0, maxOffset]`, 0 at the top, and 0 whenever disabled
 * (desktop) or unmounted, so the Topbar is fully shown again.
 */
export function useTopbarScrollHide(
  target: RefObject<HTMLElement | null> | undefined,
  enabled: boolean,
  maxOffset: number,
) {
  useEffect(() => {
    const { setOffset } = useTopbarVisibilityStore.getState();
    if (!enabled) {
      setOffset(0);
      return;
    }

    const el = target?.current ?? window;
    const getScrollY = () => (target?.current ? target.current.scrollTop : window.scrollY);

    let lastScrollY = getScrollY();
    let pending = 0;
    let rafId: number | null = null;
    setOffset(0);

    const handleScroll = () => {
      const scrollY = getScrollY();
      const delta = scrollY - lastScrollY;
      lastScrollY = scrollY;

      // A genuine scroll gesture never jumps this far in a single event — a
      // skeleton swapping for real content can change the container's scroll
      // height enough that the browser clamps/adjusts scrollTop on its own.
      // Drop it rather than let a one-off layout jump snap the header away.
      if (Math.abs(delta) > 150) return;

      pending = scrollY <= 0 ? 0 : Math.min(maxOffset, Math.max(0, pending + delta));

      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          setOffset(pending);
        });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
      setOffset(0);
    };
  }, [target, enabled, maxOffset]);
}

/**
 * Clips a Topbar title row 1:1 with the store's offset: `outer` (overflow
 * hidden) shrinks to `rowHeight - offset` and fades, `inner` (the row itself,
 * measured) slides up by the same amount. Also publishes the 0..1 `progress`
 * every other synced element reads. Before the first measurement the row
 * keeps its natural height so nothing flashes closed; on desktop
 * (`enabled` false) it always stays fully shown.
 */
export function useScrollHideRow(
  outerRef: RefObject<HTMLElement | null>,
  innerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const store = useTopbarVisibilityStore;
    let rowHeight = inner.scrollHeight;

    const apply = () => {
      const clamped = enabled ? Math.min(store.getState().offset, rowHeight) : 0;
      outer.style.height = `${rowHeight - clamped}px`;
      outer.style.opacity = String(rowHeight ? 1 - clamped / rowHeight : 1);
      inner.style.transform = `translateY(${-clamped}px)`;
      const progress = rowHeight ? clamped / rowHeight : 0;
      if (store.getState().progress !== progress) store.getState().setProgress(progress);
    };

    apply();
    const ro = new ResizeObserver(() => {
      rowHeight = inner.scrollHeight;
      apply();
    });
    ro.observe(inner);
    const unsubscribe = store.subscribe((state, prev) => {
      if (state.offset !== prev.offset) apply();
    });
    return () => {
      ro.disconnect();
      unsubscribe();
    };
  }, [outerRef, innerRef, enabled]);
}

/**
 * Bottom mirror of the Topbar's page switch: `outer` (overflow hidden) grows
 * to `progress` × `inner`'s natural width and fades in, in exact sync with how
 * much the Topbar has hidden. Hidden entirely on desktop.
 */
export function useScrollRevealWidth(
  outerRef: RefObject<HTMLElement | null>,
  innerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const store = useTopbarVisibilityStore;
    let naturalWidth = inner.scrollWidth;

    const apply = () => {
      const progress = enabled ? store.getState().progress : 0;
      outer.style.width = `${naturalWidth * progress}px`;
      outer.style.opacity = String(progress);
    };

    apply();
    const ro = new ResizeObserver(() => {
      naturalWidth = inner.scrollWidth;
      apply();
    });
    ro.observe(inner);
    const unsubscribe = store.subscribe((state, prev) => {
      if (state.progress !== prev.progress) apply();
    });
    return () => {
      ro.disconnect();
      unsubscribe();
    };
  }, [outerRef, innerRef, enabled]);
}
