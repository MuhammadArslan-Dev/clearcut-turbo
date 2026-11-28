import type * as amplitude from "@amplitude/analytics-browser";
import { analyticsAllowedHere } from "@clearcut/utils/analytics-hosts";

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
  // Production hosts only (CC-94): localhost/maintest/previews stay out.
  if (!analyticsAllowedHere()) return;

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

  // Arrived in Chrome from a /go page opened in the Facebook/Instagram app
  // (CC-122, CC-197). The SDK has already taken the IAB's device id from
  // `ampDeviceId`, so this lands on the same Amplitude user (and carries the
  // `exp_go_all_chrome_offer_202611` user property set there). `landed` is
  // what Chrome saw; `opened` is the in-app side's own "the page went to the
  // background" guess and is sent by the /go page, not from here.
  const params = new URLSearchParams(window.location.search);
  if (params.get("src") === "iab_escape") {
    const variant = params.get("ccv") ?? "";
    logAmplitudeEvent("Chrome Escape", {
      result: "landed",
      browser_context: params.get("iab") ?? "unknown",
      ...(/^[a-z0-9_]{1,40}$/i.test(variant) ? { variant } : {}),
    });
  }
};
/** Track Event */
export const logAmplitudeEvent = (
  eventName: string,
  properties: Record<string, any> = {},
) => {
  runOrQueue((amp) => amp.track(eventName, properties));
};

/**
 * Sends everything Amplitude has queued right now, then resolves. It NEVER rejects and never waits longer than `maxMs`
 * (a slow network must not trap the learner). Use it before a navigation that unloads the page: the browser SDK batches
 * events and sends them about a second later, and it registers no pagehide/beforeunload hook (checked in
 * @amplitude/analytics-browser 2.45.1), so an event tracked right before `window.location.replace(...)` was lost when the
 * redirect came first. That made "Authentication Outcome: successful" read about half of the real verifications.
 */
export const flushAmplitude = (maxMs = 500): Promise<void> =>
  new Promise((resolve) => {
    // Analytics off here (localhost, previews, other hosts): nothing was queued for sending, so do not delay anyone.
    if (!amplitudeInstance && !analyticsAllowedHere()) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, maxMs);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    try {
      // Before the SDK has finished starting, runOrQueue holds this until init (the timer above still bounds the wait).
      runOrQueue((amp) => {
        try {
          amp.flush().promise.then(done, done);
        } catch {
          done();
        }
      });
    } catch {
      done();
    }
  });

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
