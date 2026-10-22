// Meta Pixel stays off on local development hosts, so test visits never
// reach the live pixel's data (CC-115 Part A). Every other tracker
// (Amplitude, Clarity, GTM) is untouched.
//
// To test Pixel events locally, opt in for your own browser:
//   localStorage.setItem("cc-meta-pixel-local", "1")   // then reload
//   localStorage.removeItem("cc-meta-pixel-local")     // back to off
// With a test pixel id configured (each app's NEXT_PUBLIC_FB_PIXEL_ID_TEST /
// PUBLIC_FB_PIXEL_ID_TEST), local test events go to that pixel instead of
// the live one. Without it they go to the live pixel.

export const META_PIXEL_LOCAL_OPT_IN_KEY = "cc-meta-pixel-local";

/** localhost, *.localhost, loopback and private LAN addresses (a phone
 * testing a dev server over Wi-Fi). */
export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export type MetaPixelMode = "live" | "local-test" | "off";

/** "live" on real sites, "off" on local hosts unless this browser opted in
 * ("local-test"). Browser only: "off" on the server. */
export function metaPixelMode(): MetaPixelMode {
  if (typeof window === "undefined") return "off";
  if (!isLocalDevHost(window.location.hostname)) return "live";
  try {
    return window.localStorage.getItem(META_PIXEL_LOCAL_OPT_IN_KEY) === "1" ? "local-test" : "off";
  } catch {
    return "off";
  }
}

/** The pixel id to load, or null when the pixel must not load here. */
export function metaPixelId(liveId: string, testId?: string): string | null {
  const mode = metaPixelMode();
  if (mode === "off") return null;
  return mode === "local-test" && testId ? testId : liveId;
}
