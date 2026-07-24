"use client";

import { useEffect, useRef } from "react";
import { driver, Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../../../styles/tour.css"

export interface TourStep extends DriveStep {}

interface GlobalTourProps {
  steps?: TourStep[];
  isOpen?: boolean;
  onClose: () => void;
}

const GlobalTour: React.FC<GlobalTourProps> = ({
  steps = [],
  isOpen = false,
  onClose,
}) => {
  const tourRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    tourRef.current = driver({
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Next",
      prevBtnText: "Prev",
      doneBtnText: "Done",
      popoverClass: "driverjs-theme",
      showProgress: true,
      allowClose: true,
      // overlayClickNext: false,

      onCloseClick: () => {
        onClose();
        tourRef.current?.destroy();
      },

      onDestroyed: () => {
        onClose();
      },

      steps: steps.map((step) => ({
        ...step,
        popover: {
          ...step.popover,
          showButtons: ['next', 'previous', 'close'],
        },
      })),
    });

    tourRef.current.drive();

    // Automatically move next when highlighted element is clicked
    const observer = new MutationObserver(() => {
      const highlighted = document.querySelector(
        ".driver-highlighted"
      ) as HTMLElement | null;

      if (highlighted) {
        highlighted.onclick = () => {
          tourRef.current?.moveNext();
        };
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      tourRef.current?.destroy();
      tourRef.current = null;
    };
  }, [isOpen, steps, onClose]);

  return null;
};

export default GlobalTour;
