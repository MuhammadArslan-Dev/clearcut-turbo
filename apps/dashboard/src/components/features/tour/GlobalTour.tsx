"use client";

import { useEffect, useRef } from "react";
import { driver, Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../../../styles/tour.css"

export interface TourStep extends DriveStep {
  /**
   * Tapping the highlighted element: true (default) moves to the next step
   * after the tap has done its own work; false ends the tour (the tap opened
   * a modal or another page, so the next step would point at nothing).
   */
  advanceOnClick?: boolean;
}

interface GlobalTourProps {
  steps?: TourStep[];
  isOpen?: boolean;
  onClose: () => void;
  /** Button labels (translated by the caller). */
  nextText?: string;
  prevText?: string;
  doneText?: string;
  /**
   * Turns the "previous" button into a "skip" button on every step (the
   * start-here guide's "छोड़ें"). Without it the tour behaves as before.
   */
  skipAsPrev?: boolean;
  onStepChange?: (index: number) => void;
  /** Closed before finishing (✕, skip, overlay click). */
  onSkip?: (index: number) => void;
  /** Finished the last step. */
  onComplete?: () => void;
}

const GlobalTour: React.FC<GlobalTourProps> = (props) => {
  const { steps = [], isOpen = false } = props;
  const tourRef = useRef<Driver | null>(null);
  // Latest callbacks/labels, read at event time — the effect below only
  // restarts the tour when it opens or its steps change.
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const {
      nextText = "Next",
      prevText = "Prev",
      doneText = "Done",
      skipAsPrev = false,
    } = propsRef.current;

    let skipped = false;
    let finished = false;
    let lastIndex = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (!skipped && lastIndex >= steps.length - 1) propsRef.current.onComplete?.();
      else propsRef.current.onSkip?.(lastIndex);
    };

    const skip = () => {
      skipped = true;
      tourRef.current?.destroy();
    };

    tourRef.current = driver({
      showButtons: ["next", "previous", "close"],
      nextBtnText: nextText,
      prevBtnText: prevText,
      doneBtnText: doneText,
      popoverClass: "driverjs-theme",
      showProgress: true,
      allowClose: true,
      // overlayClickNext: false,

      onHighlighted: (_el, _step, { state }) => {
        lastIndex = state.activeIndex ?? 0;
        propsRef.current.onStepChange?.(lastIndex);
      },

      onCloseClick: skip,

      ...(skipAsPrev ? { onPrevClick: skip } : {}),

      onDestroyed: () => {
        finish();
        propsRef.current.onClose();
      },

      // advanceOnClick is ours, not a driver.js option.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      steps: steps.map(({ advanceOnClick, ...step }) => ({
        ...step,
        popover: {
          ...step.popover,
          showButtons: ['next', 'previous', 'close'],
          // driver.js disables "previous" on the first step; as "skip" it
          // must stay usable there too.
          ...(skipAsPrev ? { disableButtons: [] } : {}),
        },
      })),
    });

    tourRef.current.drive();

    // A tap on the highlighted element. Capture phase, then a tick later, so
    // the element's own handler (switch subject, open topic) runs first.
    const onClick = (event: MouseEvent) => {
      const tour = tourRef.current;
      const active = tour?.getActiveElement();
      if (!tour || !active || !(event.target instanceof Node) || !active.contains(event.target)) return;
      const advance = steps[tour.getActiveIndex() ?? 0]?.advanceOnClick !== false;
      window.setTimeout(() => {
        if (tourRef.current !== tour) return;
        if (advance) tour.moveNext();
        else skip();
      }, 0);
    };
    document.addEventListener("click", onClick, true);

    // Back / swipe back (e.g. closing the mobile topic view) moves the page
    // away from the elements the tour points at.
    window.addEventListener("popstate", skip);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", skip);
      tourRef.current?.destroy();
      tourRef.current = null;
    };
  }, [isOpen, steps]);

  return null;
};

export default GlobalTour;
