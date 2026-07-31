"use client";

import LazyGTM from "./lazy-gtm";

/**
 * The single analytics entry point an application mounts.
 *
 * Apps render `<AnalyticsProvider />` once in their root layout and never
 * reference an individual tracker. That indirection is the whole point of this
 * package: adding GA4, Meta Pixel, Microsoft Clarity or LinkedIn Insight later
 * means adding a component here and a variable to `./env` — Landing and Blog do
 * not change at all.
 *
 * It renders no DOM of its own and no context. There is deliberately no
 * React context: nothing needs to read analytics state during render, and a
 * provider that supplies a value would force every consumer subtree to be a
 * client component. Each tracker owns its own gating and lazy-loading, so this
 * stays a plain composition point.
 *
 * Every tracker is expected to gate itself internally (see `isAnalyticsEnabled`
 * in ./env). Mounting this in development or without configuration is safe and
 * renders nothing — apps do not need their own `{isProduction && ...}` guard,
 * and should not add one, because that is exactly the pattern that previously
 * drifted between apps.
 */
export default function AnalyticsProvider() {
  return (
    <>
      <LazyGTM />
      {/*
        Future trackers mount here, each self-gating:
          <LazyGA4 />
          <LazyMetaPixel />
          <LazyClarity />
      */}
    </>
  );
}
