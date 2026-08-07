import { useEffect, useState } from "react";

/**
 * Consolidated from three byte-identical copies (apps/landing, apps/blog,
 * and packages/auth) during Phase 4 — a plain viewport-width check, not
 * auth-specific, so it belongs here rather than trapped inside the auth
 * package.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // check on load

    window.addEventListener("resize", checkMobile); // update on resize

    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}
