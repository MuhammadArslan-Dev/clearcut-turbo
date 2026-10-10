// Android package id confirmed from the Expo app's app.json (bundleIdentifier
// / package: "com.clearcutoff.app") — this is the standard Play Store URL
// format derived from that known id, not a guessed link.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.clearcutoff.app";

// No App Store listing exists yet (confirmed with the user 2026-10-10) — the
// iOS download CTA renders a disabled "coming soon" state instead of a link.
// Set this once the app is actually published, and the /ios-app CTA can be
// switched from disabled text back to a real asChild anchor.
export const APP_STORE_URL: string | null = null;
