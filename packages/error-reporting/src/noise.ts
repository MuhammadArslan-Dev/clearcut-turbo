/**
 * Browser errors that are not ours to fix (CC-112): in-app browsers,
 * extensions and injected scripts. Used as `ignoreErrors` / `denyUrls` in
 * every public app's Sentry init (lib/page-errors.ts). dashboard keeps its own
 * list in src/lib/sentry/sentry-shared.ts — keep the two in step.
 */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  // No first-party code uses these; injected by in-app browsers / extensions.
  "speechSynthesis is not defined",
  /webkit\.messageHandlers/,
  // Facebook / Instagram in-app browser bridge scripts.
  "_AutofillCallbackHandler",
  "instantSearchSDKJSBridgeClearHighlight",
  /Java object is gone/,
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
];

/** Third-party scripts we cannot fix and do not want reports from. */
export const DENY_URLS: RegExp[] = [
  /extensions\//i,
  /^chrome(-extension)?:\/\//i,
  /^moz-extension:\/\//i,
  /googletagmanager\.com/i,
  /connect\.facebook\.net/i,
  /clarity\.ms/i,
  /iab_inner_frame/i,
];
