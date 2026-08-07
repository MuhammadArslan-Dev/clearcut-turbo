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

  let redirectUrl = hasCourse
    ? `${baseUrl}/dashboard?token=${encodedToken}&user_type=${userType}`
    : `${baseUrl}/onboarding?token=${encodedToken}&lang=${encodedLang}`;

  if (!hasCourse && selectedCourse) {
    redirectUrl += `&course=${encodeURIComponent(selectedCourse)}`;
  }

  return redirectUrl;
}
