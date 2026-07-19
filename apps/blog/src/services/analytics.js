// src/services/analytics.js
import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_KEY = "87599b5b5616563df5517932f9d6ca84";
// const AMPLITUDE_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
const IS_PROD = process.env.NODE_ENV === "production";

/** ✅ Detect Mobile vs Desktop Web */
const getCustomPlatform = () => {
  if (typeof window === "undefined") return "Unknown";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? "Mobile Web" : "Desktop Web";
};

/** ✅ Initialize Amplitude */
export const initAmplitude = () => {
  if (typeof window === "undefined" || !AMPLITUDE_KEY) return;

  amplitude.init(AMPLITUDE_KEY, {
    defaultTracking: true,
    includeUtm: true,
  });

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};

/** ✅ Track last user ID to avoid duplicate calls */
let lastUserId = null;

export const setUserId = (userId) => {
  if (typeof window === "undefined") return;

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
  if (typeof window === "undefined") return;

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
  if (typeof window === "undefined") return;
  if (!eventName) {
    console.warn("[Amplitude] Event name is required");
    return;
  }
  amplitude.track(eventName, properties);
};

/** ✅ Reset on Logout */
export const resetAmplitude = () => {
  if (typeof window === "undefined") return;
  amplitude.reset();
};
