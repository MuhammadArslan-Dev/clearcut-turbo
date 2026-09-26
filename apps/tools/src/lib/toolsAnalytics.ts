// Amplitude for apps/tools — used ONLY by the shared @clearcut/auth login
// feature (see toolsAuthFeature.ts), so the Verification Sent / Resent events
// (and the rest of the auth funnel) are recorded from Tools like they are from
// blog and landing.
//
// Deliberately minimal and lazy: the SDK is dynamically imported on the first
// event, i.e. only after a visitor opens the login modal, so the anonymous
// tracker's bundle never contains it. Tools does not want page-view/session/
// form/download events, just the explicit ones — but web ATTRIBUTION stays on
// (the SDK's own first-touch `initial_utm_*` user properties, set once), so a
// visitor whose first touch is a Tools page keeps their campaign like on
// landing/blog. Same key and same origin as landing, so the device id
// (Amplitude's own cookie) is shared and a visitor who logs in here stays one
// user across the site.
import type * as amplitude from "@amplitude/analytics-browser";

// Same public client key apps/blog and apps/landing fall back to.
const AMPLITUDE_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "87599b5b5616563df5517932f9d6ca84";

let sdk: Promise<typeof amplitude> | null = null;

function load(): Promise<typeof amplitude> {
  sdk ??= import("@amplitude/analytics-browser").then((amp) => {
    amp.init(AMPLITUDE_KEY, {
      defaultTracking: {
        attribution: true,
        pageViews: false,
        sessions: false,
        formInteractions: false,
        fileDownloads: false,
      },
      fetchRemoteConfig: false,
    });
    return amp;
  });
  return sdk;
}

export const logAmplitudeEvent = (
  eventName: string,
  properties: Record<string, unknown> = {},
) => {
  // Analytics must never break login.
  load()
    .then((amp) => amp.track(eventName, properties))
    .catch(() => {});
};

/** Links this browser's Amplitude identity to the backend user uuid (see AuthScreenDeps.onIdentify). */
export const setAmplitudeUserId = (userId: string) => {
  const id = String(userId ?? "").trim();
  if (!id) return;
  load()
    .then((amp) => amp.setUserId(id))
    .catch(() => {});
};
