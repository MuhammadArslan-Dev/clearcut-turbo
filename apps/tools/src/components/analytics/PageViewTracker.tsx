"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logAmplitudeEvent } from "@/lib/toolsAnalytics";

/**
 * Fires an explicit "Page Viewed" event on every route the visitor lands
 * on — the first load AND every client-side navigation this static export
 * does between tool pages (next/navigation's usePathname updates on App
 * Router client-side transitions, which a plain mount-only effect would
 * miss).
 *
 * This is deliberately an EXPLICIT event through the existing
 * logAmplitudeEvent (toolsAnalytics.ts), not a switch to the SDK's own
 * pageViews autocapture — that file's own docblock explains Tools wants
 * "just the explicit ones", and firing this one ourselves keeps that true
 * instead of quietly turning on everything autocapture would also grab
 * (sessions, scroll, clicks). The one real behavior change this causes:
 * the Amplitude SDK now loads on first paint instead of only after the
 * login modal opens, since "track every page view" and "stay out of the
 * anonymous bundle until login" are mutually exclusive — unavoidable once
 * page views are the ask.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    logAmplitudeEvent("Page Viewed", { path: pathname, platform: "web" });
  }, [pathname]);

  return null;
}
