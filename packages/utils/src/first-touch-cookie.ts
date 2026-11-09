// CC-171 (phase 89): the browser's FIRST landing facts in a first-party cookie, so they survive a hop between our
// subdomains (blog / academy / landing / app) that localStorage cannot cross. Pure helpers: no document access here,
// so the rules can be tested; packages/auth/src/attribution.ts does the reading and writing.
//
// What is stored: the same facts attribution.ts already keeps in localStorage (landing page path, referrer HOST, utm_*
// values, which click ids were PRESENT as true/false). Never a click id value, never a phone/email/user id.

export const FIRST_TOUCH_COOKIE = "cc_attr_first";
/** 30 days. Written once; never refreshed or overwritten, so it is the first touch, not the last. */
export const FIRST_TOUCH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Stay well under the 4 KB cookie limit (the payload is a few hundred bytes). */
const MAX_ENCODED_LENGTH = 1800;

export type FirstTouch = {
  landing_page?: string;
  referrer?: string;
  utm?: Record<string, string>;
  click_ids?: Record<string, true>;
};

/** `.clearcutoff.in` for any clearcutoff.in host (so every subdomain sees it); undefined (host-only cookie) elsewhere. */
export function cookieDomainFor(hostname: string): string | undefined {
  const host = hostname.toLowerCase();
  return host === "clearcutoff.in" || host.endsWith(".clearcutoff.in") ? ".clearcutoff.in" : undefined;
}

/** The value to store, or null when there is nothing worth keeping or it would not fit. */
export function encodeFirstTouch(value: FirstTouch): string | null {
  const clean: FirstTouch = {};
  if (value.landing_page) clean.landing_page = String(value.landing_page).slice(0, 200);
  if (value.referrer) clean.referrer = String(value.referrer).slice(0, 100);
  if (value.utm && Object.keys(value.utm).length) {
    clean.utm = Object.fromEntries(Object.entries(value.utm).map(([k, v]) => [k, String(v).slice(0, 100)]));
  }
  if (value.click_ids && Object.keys(value.click_ids).length) {
    clean.click_ids = Object.fromEntries(Object.keys(value.click_ids).map((k) => [k, true as const]));
  }
  if (Object.keys(clean).length === 0) return null;
  const encoded = encodeURIComponent(JSON.stringify(clean));
  return encoded.length <= MAX_ENCODED_LENGTH ? encoded : null;
}

/** Back to the facts, or undefined for anything missing / damaged / not an object. */
export function decodeFirstTouch(raw: string | undefined | null): FirstTouch | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return parsed as FirstTouch;
  } catch {
    return undefined;
  }
}

/** The value of one cookie from a `document.cookie` string. */
export function readCookie(cookieString: string, name: string): string | undefined {
  for (const part of cookieString.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

/** The full `document.cookie = …` string that writes the first-touch cookie. */
export function buildFirstTouchCookie(encoded: string, hostname: string, secure: boolean): string {
  const domain = cookieDomainFor(hostname);
  return [
    `${FIRST_TOUCH_COOKIE}=${encoded}`,
    "Path=/",
    `Max-Age=${FIRST_TOUCH_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    ...(domain ? [`Domain=${domain}`] : []),
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
