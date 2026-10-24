// Meta click id (fbc) for every event, Purchase included (CC-130).
//
// The pixel sends `fbc` only from the `_fbc` cookie, and it writes that
// cookie only when it loads on a page whose URL still has `fbclid`. On the
// ad landing pages the visitor often moves on before that happens, and the
// purchase happens later on app.clearcutoff.in, so Purchase went out with
// no fbc at all. This writes `_fbc` ourselves, as soon as a page with
// `fbclid` opens, on the whole clearcutoff.in domain so every subdomain's
// pixel (landing, /go, dashboard, academy) reads the same click id.
// Format is Meta's: fb.<subdomainIndex>.<creationTimeMs>.<fbclid>.
//
// Chrome hand-off (CC-122): a /go page opened in the Facebook/Instagram app
// passes its own `_fbc` / `_fbp` values as `fbc` / `fbp` params. Those exact
// values are kept (a fresh timestamp would break Meta's click window), and
// `_fbp` is written only when this browser has none yet.

const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";
const META_COOKIE_VALUE = /^fb\.\d\.\d{10,}\.[\w.-]{1,500}$/;
const FBC_MAX_AGE_S = 90 * 24 * 60 * 60;

export function buildFbc(fbclid: string, nowMs: number): string {
  return `fb.1.${nowMs}.${fbclid}`;
}

/** ".clearcutoff.in" on the production domain and its subdomains; no
 * Domain attribute (host-only) anywhere else. */
export function fbcCookieDomain(hostname: string): string | null {
  const host = hostname.toLowerCase();
  return host === "clearcutoff.in" || host.endsWith(".clearcutoff.in") ? ".clearcutoff.in" : null;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Call once on page load, before or after the pixel. Keeps an existing
 * cookie for the same click; a new click id replaces it. */
export function persistFbcFromUrl(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const domain = fbcCookieDomain(window.location.hostname);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const write = (name: string, value: string) => {
      document.cookie =
        `${name}=${encodeURIComponent(value)}` +
        `; Path=/; Max-Age=${FBC_MAX_AGE_S}; SameSite=Lax${secure}` +
        (domain ? `; Domain=${domain}` : "");
    };

    // Handed off from an in-app browser: keep its browser id if we have none.
    const fbp = params.get("fbp");
    if (fbp && META_COOKIE_VALUE.test(fbp) && !readCookie(FBP_COOKIE)) write(FBP_COOKIE, fbp);

    // ...and its exact click id, timestamp included.
    const fbc = params.get("fbc");
    if (fbc && META_COOKIE_VALUE.test(fbc)) {
      if (readCookie(FBC_COOKIE) !== fbc) write(FBC_COOKIE, fbc);
      return;
    }

    const fbclid = params.get("fbclid");
    if (!fbclid || fbclid.length > 500) return;

    const existing = readCookie(FBC_COOKIE);
    if (existing && existing.endsWith(`.${fbclid}`)) return;

    write(FBC_COOKIE, buildFbc(fbclid, Date.now()));
  } catch {
    // Cookies blocked: the pixel's own handling still applies.
  }
}
