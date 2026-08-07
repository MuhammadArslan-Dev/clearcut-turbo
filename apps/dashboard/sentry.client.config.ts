/**
 * DEAD FILE — kept (rather than deleted) so nobody re-adds it thinking it went
 * missing.
 *
 * @sentry/nextjs v8 loaded browser config from `sentry.client.config.ts`.
 * v9 deprecated it and v10 — the version installed here — loads
 * **`src/instrumentation-client.ts`** instead. Nothing below has executed since
 * that upgrade, which is why these tags, `ignoreErrors` and `beforeSend` never
 * actually took effect at runtime.
 *
 * The real browser config now lives in `src/instrumentation-client.ts` and
 * `src/lib/sentry/sentry-shared.ts`. Edit those — editing this file does
 * nothing.
 *
 * Original contents, for reference:
 *
 * import * as Sentry from "@sentry/nextjs";
 *
 * Sentry.init({
 *   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
 *   tracesSampleRate: 1.0,
 *   debug: true,
 *   ignoreErrors: [
 *     "ResizeObserver loop limit exceeded",
 *     "Network Error",
 *     "Failed to fetch",
 *     "Load failed",
 *     "Redirecting due to expired session",
 *   ],
 *   beforeSend(event) {
 *     event.tags = { ...event.tags, module: "frontend", env: process.env.NODE_ENV };
 *     if (typeof window !== "undefined") {
 *       event.extra = {
 *         ...event.extra,
 *         url: window.location.href,
 *         pathname: window.location.pathname,
 *       };
 *     }
 *     return event;
 *   },
 * });
 */

export {};
