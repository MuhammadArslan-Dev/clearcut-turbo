"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/services/analytics";

/**
 * Calls the existing initAmplitude() (src/services/analytics.js) exactly
 * once, client-side, as early as possible in the tree. This was the actual
 * gap: initAmplitude was already defined and ready, but nothing in the app
 * ever called it, so every logAmplitudeEvent/setUserId call made through
 * the shared auth flow's onEvent/onIdentify (src/lib/auth.ts) was a no-op
 * against an uninitialized SDK — including the auth funnel events
 * (Verification Sent/Resent, Authentication Outcome) and, since
 * initAmplitude's defaultTracking.pageViews is on, every page view.
 *
 * Renders nothing. Mounted once in [locale]/layout.tsx next to
 * AnalyticsProvider (the GTM/Clarity provider) — this is Amplitude's own
 * entry point, kept separate since AnalyticsProvider is a shared package
 * used by other apps that don't have this Amplitude wrapper.
 */
export default function InitAmplitude() {
  useEffect(() => {
    initAmplitude();
  }, []);

  return null;
}
