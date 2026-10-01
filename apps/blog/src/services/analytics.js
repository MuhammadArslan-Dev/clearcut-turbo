// src/services/analytics.js
import * as amplitude from "@amplitude/analytics-browser";

// Same fallback key apps/dashboard and apps/tools use when
// NEXT_PUBLIC_AMPLITUDE_API_KEY isn't set — was previously hardcoded with
// the env read commented out, so a real per-env key could never take
// effect even when configured.
const AMPLITUDE_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "87599b5b5616563df5517932f9d6ca84";
// Defaults to enabled — works with zero env setup. Set
// NEXT_PUBLIC_AMPLITUDE_ENABLED=false to explicitly turn tracking off (e.g.
// a local dev run you don't want polluting real data).
const AMPLITUDE_ENABLED = process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED !== "false";

/** ✅ Detect Mobile vs Desktop Web */
const getCustomPlatform = () => {
  if (typeof window === "undefined") return "Unknown";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? "Mobile Web" : "Desktop Web";
};

let isInitialized = false;

/**
 * Initialize Amplitude. This was previously defined but never called
 * anywhere in the app — every logAmplitudeEvent/setUserId call (wired as
 * the shared auth flow's onEvent/onIdentify, see src/lib/auth.ts) was
 * silently a no-op against an uninitialized SDK instance, and no page view
 * was ever tracked either. Call this once, client-side, at the app root
 * (see components/analytics/InitAmplitude.tsx).
 *
 * pageViews: true (previously the legacy boolean `defaultTracking: true`,
 * whose actual sub-option values aren't documented/guaranteed — replaced
 * with the explicit object form apps/dashboard's browser.ts uses) makes the
 * SDK's own autocapture fire a page-view event on load AND on every
 * client-side route change it detects via the History API — which is what
 * "fires reliably on navigation and direct entry" requires without hand-
 * rolling a pathname-watching component.
 */
export const initAmplitude = () => {
  if (typeof window === "undefined" || !AMPLITUDE_ENABLED || !AMPLITUDE_KEY) return;
  if (isInitialized) return;

  amplitude.init(AMPLITUDE_KEY, {
    defaultTracking: {
      pageViews: true,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
    },
    includeUtm: true,
  });
  isInitialized = true;

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};

/** ✅ Track last user ID to avoid duplicate calls */
let lastUserId = null;

export const setUserId = (userId) => {
  if (typeof window === "undefined" || !AMPLITUDE_ENABLED) return;

  const idStr = String(userId || "").trim();
  if (!idStr || idStr === "undefined" || idStr === "null") {
    console.warn("[Amplitude] Invalid user ID:", userId);
    return;
  }

  if (lastUserId === idStr) {
    console.info("[Amplitude] Skipping setUserId, already set:", idStr);
    return;
  }

  amplitude.setUserId(idStr);
  lastUserId = idStr;

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};

/** ✅ Set User Properties */
export const setUserProperties = (properties = {}) => {
  if (typeof window === "undefined" || !AMPLITUDE_ENABLED) return;

  const identifyObj = new amplitude.Identify();
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null) {
      identifyObj.set(key, value);
    }
  }
  amplitude.identify(identifyObj);
};

/** ✅ Track Event */
export const logAmplitudeEvent = (eventName, properties = {}) => {
  if (typeof window === "undefined" || !AMPLITUDE_ENABLED) return;
  if (!eventName) {
    console.warn("[Amplitude] Event name is required");
    return;
  }
  amplitude.track(eventName, properties);
};

/** ✅ Reset on Logout */
export const resetAmplitude = () => {
  if (typeof window === "undefined" || !AMPLITUDE_ENABLED) return;
  amplitude.reset();
};
