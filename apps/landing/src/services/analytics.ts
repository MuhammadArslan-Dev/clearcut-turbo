import type * as amplitude from "@amplitude/analytics-browser";

let amplitudeInstance: typeof amplitude | null = null;
let initialized = false;

const AMPLITUDE_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '87599b5b5616563df5517932f9d6ca84';

// initAmplitude() is deliberately deferred (AnalyticsLoader waits for idle +
// 1.5s before even starting the dynamic import) so it doesn't compete with
// page load. That means every call below made in the meantime — most
// notably StartAuthForm's mount-time "Authentication Options Viewed"/
// "Authentication Method Selected" events, which fire the instant the
// login/OTP screen renders — used to hit `amplitudeInstance === null` and
// get silently dropped every single time, not just occasionally. Queuing
// them here and replaying once init resolves is what actually fixes that,
// rather than just narrowing the race window.
const pendingOps: Array<(amp: typeof amplitude) => void> = [];

function runOrQueue(op: (amp: typeof amplitude) => void): void {
  if (amplitudeInstance) {
    op(amplitudeInstance);
  } else {
    pendingOps.push(op);
  }
}

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

  // Flush whatever queued up while the SDK was still loading, in the order
  // it actually happened, before the init-time platform identify below.
  const queued = pendingOps.splice(0);
  queued.forEach((op) => op(amp));

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};
/** Track Event */
export const logAmplitudeEvent = (
  eventName: string,
  properties: Record<string, any> = {},
) => {
  runOrQueue((amp) => amp.track(eventName, properties));
};

/** Set User ID */
export const setUserId = (userId: string | number) => {
  const id = String(userId).trim();
  if (!id) return;

  runOrQueue((amp) => amp.setUserId(id));

  setUserProperties({
    custom_platform: getCustomPlatform(),
  });
};

/** Set User Properties */
export const setUserProperties = (properties: Record<string, any>) => {
  runOrQueue((amp) => {
    const identify = new amp.Identify();

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        identify.set(key, value);
      }
    });

    amp.identify(identify);
  });
};

/** Reset on logout */
export const resetAmplitude = () => {
  runOrQueue((amp) => amp.reset());
};
