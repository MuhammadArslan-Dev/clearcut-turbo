import { useEffect } from "react";

interface UseBackHandlerOptions {
  isOpen: boolean;
  onClose: () => void;
  enabled?: boolean;
}

/**
 * Closes a dismissible UI (modal, drawer, sheet) on the browser back button.
 * Moved out of packages/auth during Phase 4 — genuinely generic, not
 * auth-specific; it just happened to be extracted there first.
 */
export function useBackHandler({
  isOpen,
  onClose,
  enabled = true,
}: UseBackHandlerOptions) {
  useEffect(() => {
    if (!enabled || !isOpen || typeof window === "undefined") return;

    const handleBackNavigation = () => {
      onClose();
    };

    window.addEventListener("popstate", handleBackNavigation);

    return () => {
      window.removeEventListener("popstate", handleBackNavigation);
    };
  }, [enabled, isOpen, onClose]);
}
