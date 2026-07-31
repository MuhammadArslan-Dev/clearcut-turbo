/**
 * Environment resolution for analytics. The ONLY place that decides whether a
 * tracker is allowed to load.
 *
 * Both values are read as full `process.env.X` expressions rather than through a
 * helper or destructuring. That is deliberate and load-bearing: Next inlines
 * `process.env.NEXT_PUBLIC_*` at build time only when it can see the literal
 * member expression in the source. Refactoring these into something "cleaner"
 * (a lookup, a spread, a variable key) silently yields `undefined` in the
 * browser bundle and disables analytics everywhere.
 */

/** GTM container, e.g. "GTM-XXXXXXX". Never hardcoded — deployment config only. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * `NODE_ENV`, not a custom `ENVIRONMENT` variable.
 *
 * The previous setup gated Landing on `process.env.ENVIRONMENT === "production"`
 * while `apps/landing/.env` carried `ENVIRONMENT=production` — and `.env` is a
 * developer's file, so the gate evaluated true on local machines and dev traffic
 * reached the production container. `NODE_ENV` cannot be spoofed that way: Next
 * sets it to "development" for `next dev` and "production" for `next build`
 * regardless of what any `.env` says.
 */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * A tracker may mount only when BOTH hold: we are in a production build, and an
 * ID is actually configured. A missing ID is treated as "analytics off" rather
 * than an error — that is what makes a preview or a fresh clone silent by
 * default instead of reporting into someone else's container.
 */
export const isAnalyticsEnabled = (id: string | undefined = GTM_ID): boolean =>
  IS_PRODUCTION && Boolean(id);
