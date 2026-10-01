// Amplitude for apps/tools — used by the shared @clearcut/auth login feature
// (see toolsAuthFeature.ts), so the Verification Sent / Resent events (and
// the rest of the auth funnel) are recorded from Tools like they are from
// blog and landing, AND by components/analytics/PageViewTracker.tsx, which
// fires an explicit "Page Viewed" event on first load and every client-side
// route change.
//
// Deliberately minimal: the SDK is dynamically imported on first use (first
// login-modal event, OR now the first page view, whichever happens first —
// in practice page view, since that fires on load). Tools does not want the
// SDK's own autocapture events (session/form/download), just the explicit
// ones we fire ourselves — page view being one of them now, not an
// exception to that rule. Web ATTRIBUTION stays on (the SDK's own
// first-touch `initial_utm_*` user properties, set once), so a visitor
// whose first touch is a Tools page keeps their campaign like on
// landing/blog. Same key and same origin as landing, so the device id
// (Amplitude's own cookie) is shared and a visitor who logs in here stays
// one user across the site.
import type * as amplitude from "@amplitude/analytics-browser";

// Same public client key apps/blog and apps/landing fall back to.
const AMPLITUDE_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "87599b5b5616563df5517932f9d6ca84";
// Defaults to enabled — works with zero env setup. Set
// NEXT_PUBLIC_AMPLITUDE_ENABLED=false to explicitly turn tracking off (e.g.
// a local dev run you don't want polluting real "Page Viewed" events, now
// that PageViewTracker calls this on every page load).
const AMPLITUDE_ENABLED = process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED !== "false";

let sdk: Promise<typeof amplitude> | null = null;

function load(): Promise<typeof amplitude> {
  if (!AMPLITUDE_ENABLED) return Promise.reject(new Error("Amplitude disabled"));

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
