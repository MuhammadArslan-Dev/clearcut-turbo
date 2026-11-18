"use client";
// CC-192: A/B experiments in the logged-in app. GrowthBook decides the variant, Amplitude records the exposure.
// OFF (everyone gets control, nothing is hidden, nothing is fetched) until NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY is set at build
// time, and always off outside the production hosts (same rule as analytics, CC-94). Details: docs/phases/118.
import { analyticsAllowedHere } from "@clearcut/utils/analytics-hosts";
import { localeFromPathname, platformFromUserAgent, utmFromSearch } from "@clearcut/experiments/attributes";
import { createExperimentsClient, resolveConfig, type ExperimentsClient } from "@clearcut/experiments/client";
import { getBrowserExpId } from "@clearcut/experiments/id";
import type { FeaturesPayload } from "@clearcut/experiments/payload";
import { createExperimentsHooks } from "@clearcut/experiments/react";
import { setAnalyticsUserProperty, trackReservedEvent } from "@/lib/analytics/browser";
import { getExperimentUser, onExperimentUserChange } from "@/lib/experiment-user";

// Literal reads, so Next inlines them at build time.
const CLIENT_KEY = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY;
const API_HOST = process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST;

let client: ExperimentsClient | null | undefined;
let serverPayload: FeaturesPayload | null = null;

/** Called by <ExperimentsBootstrap> with the payload the server fetched (cached 5 min). Must run before the client is created. */
export function setServerPayload(payload: FeaturesPayload | null): void {
  serverPayload = payload;
}

/** Lazy singleton: the GrowthBook client (and its CDN request) only exists once an experiment element has mounted. */
export function getExperiments(): ExperimentsClient | null {
  if (typeof window === "undefined") return null;
  if (client !== undefined) return client;
  const config = resolveConfig({ clientKey: CLIENT_KEY, apiHost: API_HOST, allowedHere: analyticsAllowedHere() });
  if (!config) {
    client = null;
    return client;
  }
  const created = createExperimentsClient({
    config,
    payload: serverPayload,
    attributes: {
      // Same cookie as the landing pages (cookie domain .clearcutoff.in): the variant survives the OTP signup.
      id: getBrowserExpId(),
      locale: localeFromPathname(window.location.pathname),
      platform: platformFromUserAgent(window.navigator.userAgent),
      ...utmFromSearch(window.location.search),
      ...getExperimentUser(),
    },
    sink: { track: trackReservedEvent, setUserProperty: setAnalyticsUserProperty },
  });
  // The user may log in after the client exists: keep the targeting attributes current.
  onExperimentUserChange((user) => created.setAttributes(user));
  client = created;
  return client;
}

export const { useExperimentValue, ExperimentText } = createExperimentsHooks({
  getClient: getExperiments,
  configured: Boolean(CLIENT_KEY?.trim()),
});
