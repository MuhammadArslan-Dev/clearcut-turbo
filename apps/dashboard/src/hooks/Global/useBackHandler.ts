// hooks/useBackHandler.ts
import { useEffect, useRef } from "react";

interface UseBackHandlerOptions {
  isOpen: boolean;
  onClose: () => void;
  enabled?: boolean;
}

/**
 * Close a sheet / modal on the phone's back gesture (popstate).
 *
 * `onClose` is read through a ref: callers pass an inline arrow, and having it
 * in the effect deps removed and re-added the popstate listener on EVERY
 * render. A back pressed during that churn (e.g. while the Topic Test sheet
 * re-rendered) was missed, so the sheet stayed open and its backdrop ate the
 * next tap on the topic view's back button. The listener now changes only
 * when the sheet opens / closes.
 */
export const useBackHandler = ({
  isOpen,
  onClose,
  enabled = true,
}: UseBackHandlerOptions) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled || !isOpen) return;
    let isHandled = false;

    const handlePopState = () => {
      if (isHandled) return;
      isHandled = true;

      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, isOpen]);
};
