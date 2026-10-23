// Meta Pixel loads only on the production hosts below, so test visits
// (localhost, a phone on the LAN, maintest/staging subdomains, preview
// deployments) never reach the live pixel's data (CC-115). Every other
// tracker (Amplitude, Clarity, GTM) is untouched.
//
// To test Pixel events locally, opt in for your own browser:
//   localStorage.setItem("cc-meta-pixel-local", "1")   // then reload
//   localStorage.removeItem("cc-meta-pixel-local")     // back to off
// With a test pixel id configured (each app's NEXT_PUBLIC_FB_PIXEL_ID_TEST /
// PUBLIC_FB_PIXEL_ID_TEST), local test events go to that pixel instead of
// the live one. Without it they go to the live pixel.

export const META_PIXEL_LOCAL_OPT_IN_KEY = "cc-meta-pixel-local";

/** The only hosts where the live pixel loads (CC-115). Keep in sync with
 * Astro-marketing-clearcut's packages/auth/src/lib/facebook-pixel.ts. */
export const META_PIXEL_HOSTS = [
  "clearcutoff.in",
  "www.clearcutoff.in",
  "app.clearcutoff.in",
  "academy.clearcutoff.in",
] as const;

export function isMetaPixelHost(hostname: string): boolean {
  return (META_PIXEL_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

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

/** "live" on the production hosts, "off" anywhere else unless this browser
 * opted in ("local-test"). Browser only: "off" on the server. */
export function metaPixelMode(): MetaPixelMode {
  if (typeof window === "undefined") return "off";
  if (isMetaPixelHost(window.location.hostname)) return "live";
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
