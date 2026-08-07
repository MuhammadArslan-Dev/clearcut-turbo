// hooks/useBackHandler.ts
import { useEffect } from "react";

interface UseBackHandlerOptions {
  isOpen: boolean;
  onClose: () => void;
  enabled?: boolean;
}

export const useBackHandler = ({
  isOpen,
  onClose,
  enabled = true,
}: UseBackHandlerOptions) => {
  useEffect(() => {
    if (!enabled || !isOpen) return;
    let isHandled = false;

    const handlePopState = () => {
      if (isHandled) return;
      isHandled = true;

      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, isOpen, onClose]);
};
