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
}

/**
 * 1:1 port of the post-OTP-verify redirect URL construction that was
 * duplicated (identically apart from `userType`) in otp-screen.tsx and
 * result-step.tsx.
 */
export function buildPostVerifyRedirectUrl(
  params: BuildPostVerifyRedirectUrlParams,
): string {
  const { baseUrl, token, hasCourse, userType, lang = "", course } = params;

  const encodedToken = encodeURIComponent(token);
  const encodedLang = encodeURIComponent(lang);
  const selectedCourse = course?.split("-")[0];

  // Onboarding lands directly on the matching locale route (`/hi/onboarding`
  // for lang "hi") instead of always landing on the unprefixed default and
  // relying on onboarding's own client-side language switch to redirect a
  // second time — that second hop is a real `window.location.href` reload
  // (see apps/dashboard's useLanguageSwitch), which would otherwise flash
  // the English-locale onboarding UI before reloading into Hindi.
  const localePrefix = lang === "hi" ? "/hi" : "";

  let redirectUrl = hasCourse
    ? `${baseUrl}/dashboard?token=${encodedToken}&user_type=${userType}`
    : `${baseUrl}${localePrefix}/onboarding?token=${encodedToken}&lang=${encodedLang}`;

  if (!hasCourse && selectedCourse) {
    redirectUrl += `&course=${encodeURIComponent(selectedCourse)}`;
  }

  return redirectUrl;
}

/**
 * Derives the current page's locale purely from the URL path — every app in
 * this monorepo follows the same convention (see packages/i18n's routing
 * config): "en" is the default and unprefixed, "hi" lives under "/hi/...".
 * Reading it this way (rather than via next-intl's `useLocale()`) avoids
 * adding next-intl as a dependency of this shared package just for one read,
 * and works identically whether this runs inside blog or landing.
 */
export function getCurrentLocale(): string {
  if (typeof window === "undefined") return "en";
  const { pathname } = window.location;
  return pathname === "/hi" || pathname.startsWith("/hi/") ? "hi" : "en";
}
