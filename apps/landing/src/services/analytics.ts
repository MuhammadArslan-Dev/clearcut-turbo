import type * as amplitude from "@amplitude/analytics-browser";

let amplitudeInstance: typeof amplitude | null = null;
let initialized = false;

const AMPLITUDE_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '87599b5b5616563df5517932f9d6ca84';

/** Detect platform */
const getCustomPlatform = () => {
  if (typeof window === "undefined") return "Unknown";

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? "Mobile Web" : "Desktop Web";
};

/** Initialize Amplitude */
export const initAmplitude = async () => {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!AMPLITUDE_KEY) return;

  const amp = await import("@amplitude/analytics-browser");

  amp.init(AMPLITUDE_KEY, {
    defaultTracking: {
      pageViews: true,
      sessions: true,
      formInteractions: true,
      fileDownloads: true,
    },

    fetchRemoteConfig: false,
  });

  amplitudeInstance = amp;
  initialized = true;

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};
/** Track Event */
export const logAmplitudeEvent = (
  eventName: string,
  properties: Record<string, any> = {},
) => {
  if (!amplitudeInstance) return;

  amplitudeInstance.track(eventName, properties);
};

/** Set User ID */
export const setUserId = (userId: string | number) => {
  if (!amplitudeInstance) return;

  const id = String(userId).trim();
  if (!id) return;

  amplitudeInstance.setUserId(id);

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};

/** Set User Properties */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!amplitudeInstance) return;

  const identify = new amplitudeInstance.Identify();

  Object.entries(properties).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      identify.set(key, value);
    }
  });

  amplitudeInstance.identify(identify);
};

/** Reset on logout */
export const resetAmplitude = () => {
  if (!amplitudeInstance) return;

  amplitudeInstance.reset();
};
