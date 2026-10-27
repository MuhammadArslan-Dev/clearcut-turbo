import { useEffect, useState } from "react";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

const SLOW_TYPES = new Set(["slow-2g", "2g", "3g"]);

/**
 * True when the browser reports Save-Data or a slow (≤ 3G) connection.
 * Browsers without the Network Information API (Safari, Firefox) report
 * nothing and count as fast, so they keep today's behaviour.
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || SLOW_TYPES.has(connection.effectiveType ?? "");
}

/**
 * Whether a `<Link>` may prefetch its route (CC-146). On a slow connection a
 * prefetched sibling page (e.g. Test Series while Preparation is loading)
 * competes with the page the student is actually waiting for — a Facebook
 * in-app trace spent 28 s on both at once. False until mounted, so a slow
 * phone never starts a prefetch during hydration; fast connections switch it
 * on right after mount.
 */
export function useAllowPrefetch(): boolean {
  const [allow, setAllow] = useState(false);
  useEffect(() => {
    setAllow(!isSlowConnection());
  }, []);
  return allow;
}
