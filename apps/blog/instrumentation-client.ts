/**
 * Sentry client instrumentation — CONFIGURATION-GATED.
 *
 * Architecture decision (public website): Landing and Blog do not ship the
 * Sentry browser runtime. The Dashboard keeps full Sentry monitoring.
 *
 * Why this file is shaped this way rather than deleted:
 *
 *   `Sentry.init({ dsn: undefined })` is a documented no-op, but it is a
 *   RUNTIME no-op — the SDK is still statically imported, so it is downloaded,
 *   parsed and executed on every page view. Measured on this repo: the Sentry
 *   SDK sat in the largest shared chunk of both public apps (417 KB blog /
 *   411 KB landing, on EVERY route) while making exactly 0 network requests.
 *   Full cost, zero observability.
 *
 *   Deleting the file would fix the bytes but break the future-proofing
 *   requirement: re-enabling Sentry would become a code change.
 *
 * How this stays future-proof with no dead code:
 *
 *   `process.env.NEXT_PUBLIC_SENTRY_DSN` is inlined by the bundler at build
 *   time. With no DSN configured it inlines to a falsy literal, the branch is
 *   statically unreachable, and the dynamic `import()` inside it is
 *   dead-code-eliminated — no Sentry bytes reach the browser. Set the env var
 *   and this same source starts loading and initialising Sentry.
 *
 *   Re-enabling monitoring is therefore a CONFIGURATION change, not a rewrite.
 *   Nothing here is dead code: every line goes live the moment the var is set.
 *
 * The dynamic `import()` rather than a top-level import is what permits the
 * elimination — a static import is unconditional by definition.
 */
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: DSN,
      environment:
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      // Sampled rather than 1.0: 100% client tracing is a cost and quota risk
      // in production. Tune per environment via the env var.
      tracesSampleRate: Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
      ),
    });
  });
}

/**
 * Next calls this on every client router transition, so it must exist as a
 * stable export. It costs nothing while Sentry is off: with no DSN it returns
 * immediately and the `import()` below is never reached.
 */
export function onRouterTransitionStart(
  ...args: Parameters<
    (typeof import("@sentry/nextjs"))["captureRouterTransitionStart"]
  >
) {
  if (!DSN) return;
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.captureRouterTransitionStart(...args),
  );
}
