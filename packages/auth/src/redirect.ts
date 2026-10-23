export interface BuildPostVerifyRedirectUrlParams {
  /** e.g. process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in" */
  baseUrl: string;
  token: string;
  hasCourse: boolean;
  /**
   * Callers currently disagree on how this is derived — the modal OTP flow
   * always passes "old", the onboarding flow passes "new"/"old" based on the
   * initial login response. That divergence is preserved by leaving it as an
   * explicit required argument here rather than this function guessing it.
   */
  userType: "new" | "old";
  lang?: string;
  course?: string | null;
  /**
   * A one-time registration-occurrence token — NOT the user's permanent id —
   * minted by the caller only when this OTP verification represents a
   * genuinely new signup. Threaded through as `meta_lead` so the app side
   * (the only place the Meta Pixel can still attach phone/external_id to its
   * first real `init()` call — see apps/dashboard's FacebookPixel.tsx) can
   * fire Lead exactly once with a real `event_id`, instead of firing it here
   * against a pixel that already initialized without user data on page load.
   */
  leadId?: string;
}

/**
 * 1:1 port of the post-OTP-verify redirect URL construction that was
 * duplicated (identically apart from `userType`) in otp-screen.tsx and
 * result-step.tsx.
 */
export function buildPostVerifyRedirectUrl(
  params: BuildPostVerifyRedirectUrlParams,
): string {
  const { baseUrl, token, hasCourse, userType, lang = "", course, leadId } = params;

  const encodedToken = encodeURIComponent(token);
  const encodedLang = encodeURIComponent(lang);
  const selectedCourse = course?.split("-")[0];

  // Onboarding lands directly on the matching locale route (`/hi/onboarding`
  // for lang "hi") instead of always landing on the unprefixed default and
  // relying on onboarding's own client-side language switch to redirect a
  // second time — that second hop is a real `window.location.href` reload
  // (see apps/dashboard's useLanguageSwitch), which would otherwise flash
  // the English-locale onboarding UI before reloading into Hindi.
  // The dashboard routes en/hi/mr; "mr" was missing, so Marathi signups
  // landed on English onboarding (CC-106).
  const localePrefix = lang === "hi" || lang === "mr" ? `/${lang}` : "";

  // A returning student (has a course) also stays in the page's language
  // (CC-89); `/dashboard` was always English.
  let redirectUrl = hasCourse
    ? `${baseUrl}${localePrefix}/dashboard?token=${encodedToken}&user_type=${userType}`
    : `${baseUrl}${localePrefix}/onboarding?token=${encodedToken}&lang=${encodedLang}`;

  if (!hasCourse && selectedCourse) {
    redirectUrl += `&course=${encodeURIComponent(selectedCourse)}`;
  }

  if (leadId) {
    redirectUrl += `&meta_lead=${encodeURIComponent(leadId)}`;
  }

  return redirectUrl;
}

/**
 * Derives the current page's locale purely from the URL path — every app in
 * this monorepo follows the same convention (see packages/i18n's routing
 * config): "en" is the default and unprefixed, "hi" lives under "/hi/...",
 * and landing (only) also has "/mr/...".
 * Reading it this way (rather than via next-intl's `useLocale()`) avoids
 * adding next-intl as a dependency of this shared package just for one read,
 * and works identically whether this runs inside blog or landing.
 */
export function getCurrentLocale(): string {
  if (typeof window === "undefined") return "en";
  const { pathname } = window.location;
  for (const locale of ["hi", "mr"]) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale;
  }
  return "en";
}

/**
 * One-time id for the Meta Lead hand-off (`meta_lead` above). Older Android
 * WebViews (Chrome < 92) have no `crypto.randomUUID`, and calling it there
 * threw after a successful OTP verify, so the redirect never happened.
 */
export function createLeadId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
