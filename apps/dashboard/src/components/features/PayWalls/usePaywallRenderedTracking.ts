"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/browser";

/**
 * The existing "Payment Paywall Rendered" event (CC-196). It was typed in
 * lib/analytics/events/monetization.ts and listed in the catalog, but nothing ever called
 * trackEvent for it - that is why it never fired. Call this from every paywall surface:
 * it sends ONE event each time the surface goes from closed to open (a re-render, a locale
 * switch or StrictMode's double effect never repeats it).
 */
export function usePaywallRenderedTracking(
  open: boolean,
  propertySource: string | null | undefined,
  isUserPremium: boolean,
  objectId?: string | null,
) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    trackEvent("Payment Paywall Rendered", {
      property_source: propertySource || "unknown",
      is_user_premium: isUserPremium,
      ...(objectId ? { object_id: objectId } : {}),
    });
    // Only the open flag decides; the other values are read at the moment it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
