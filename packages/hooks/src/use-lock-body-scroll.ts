import { useEffect } from "react";

/**
 * Consolidated during Phase 4 — was duplicated byte-for-byte inside
 * packages/auth and (as dead code) apps/blog.
 */
export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isLocked]);
}
