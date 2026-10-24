// Analytics (Amplitude, Clarity, GTM) loads only on the production hosts
// below, so test visits (localhost, a phone on the LAN, maintest/staging,
// preview deployments) never reach the live projects (CC-94). Meta Pixel
// uses the same list (meta-pixel-env.ts).
//
// To test analytics locally, opt in for your own browser:
//   localStorage.setItem("cc-analytics-local", "1")   // then reload
//   localStorage.removeItem("cc-analytics-local")     // back to off
// Events then go to the live projects, so use it sparingly.

export const ANALYTICS_LOCAL_OPT_IN_KEY = "cc-analytics-local";

/** Keep in sync with Astro-marketing-clearcut's packages/analytics/src/lib/env.ts. */
export const PRODUCTION_ANALYTICS_HOSTS = [
  "clearcutoff.in",
  "www.clearcutoff.in",
  "app.clearcutoff.in",
  "academy.clearcutoff.in",
] as const;

export function isProductionAnalyticsHost(hostname: string): boolean {
  return (PRODUCTION_ANALYTICS_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

/** True on a production host, or when this browser opted in. Always false on
 * the server, so call it from effects / event handlers, not during render. */
export function analyticsAllowedHere(): boolean {
  if (typeof window === "undefined") return false;
  if (isProductionAnalyticsHost(window.location.hostname)) return true;
  try {
    return window.localStorage.getItem(ANALYTICS_LOCAL_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}
