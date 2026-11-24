// Exams whose image download ALWAYS needs a verified phone number (phase 127).
//
// For an exam listed here, the Download tap behaves as the existing `hard_gate`
// mode (phase 68 / 71), whatever the Amplitude flags `hard_gate`, `soft_gate`
// and `second_download_gate` say for that exam:
//
//   - a visitor with a session token the backend still accepts downloads at once;
//   - no token, or the backend rejects it (401) -> the shared phone + OTP login
//     opens on the page (no redirect), and the file saves after a successful
//     verification;
//   - the token check fails for another reason (offline, 5xx, 403) -> nothing
//     downloads, the token is kept, and the tool shows an error with "Try again".
//
// Before the file is released, the token is confirmed with the main backend
// (GET /v1/auth-user, see lib/api/verifySession.ts), not only read from
// localStorage. This is still a browser-side gate: the image is processed in
// the visitor's own browser, so a determined developer can bypass it. It stops
// normal visitors, not a scripted one.
//
// Every exam NOT listed here keeps resolving its mode from the Amplitude flags,
// exactly as before (lib/downloadMode.ts → resolveDownloadMode).
//
// HOW TO ADD AN EXAM: add its resizer slug (the last part of
// clearcutoff.in/tools/resizer/<slug>, lower case) to the list below, then
// build and deploy tools (TOOLS_DEPLOY.md). Removing a slug turns the rule off
// again for that exam.
export const OTP_REQUIRED_BEFORE_DOWNLOAD: readonly string[] = [
  "htet",
];

/** True when `exam` (a resizer slug, any case) must verify a phone number before every download. */
export function isOtpRequiredBeforeDownload(exam: string | null | undefined): boolean {
  if (!exam) return false;
  return OTP_REQUIRED_BEFORE_DOWNLOAD.includes(exam.trim().toLowerCase());
}
