"use client";
// CC-192: A/B experiments on the landing pages. GrowthBook decides the variant, Amplitude records the exposure.
// OFF (everyone gets control, nothing is hidden, nothing is fetched) until NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY is set at build
// time, and always off outside the production hosts (same rule as analytics, CC-94). Details: docs/phases/118.
import { analyticsAllowedHere } from "@clearcut/utils/analytics-hosts";
import { examFromPathname, localeFromPathname, platformFromUserAgent, utmFromSearch } from "@clearcut/experiments/attributes";
import { createExperimentsClient, resolveConfig, type ExperimentsClient } from "@clearcut/experiments/client";
import { getBrowserExpId } from "@clearcut/experiments/id";
import { createExperimentsHooks } from "@clearcut/experiments/react";
import { logAmplitudeEvent, setUserProperties } from "@/services/analytics";

// Literal reads, so Next inlines them at build time.
const CLIENT_KEY = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY;
const API_HOST = process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST;

let client: ExperimentsClient | null | undefined;

/** Lazy singleton: the GrowthBook client (and its CDN request) only exists once an experiment element has mounted. */
export function getExperiments(): ExperimentsClient | null {
  if (typeof window === "undefined") return null;
  if (client !== undefined) return client;
  const config = resolveConfig({ clientKey: CLIENT_KEY, apiHost: API_HOST, allowedHere: analyticsAllowedHere() });
  if (!config) {
    client = null;
    return client;
  }
  client = createExperimentsClient({
    config,
    attributes: {
      id: getBrowserExpId(),
      locale: localeFromPathname(window.location.pathname),
      exam: examFromPathname(window.location.pathname),
      platform: platformFromUserAgent(window.navigator.userAgent),
      // The landing AuthProvider sends logged-in visitors to the dashboard, so landing visitors are logged out.
      is_logged_in: false,
      ...utmFromSearch(window.location.search),
    },
    sink: {
      // Existing Amplitude helpers: calls made before Amplitude finishes its deferred init are queued and replayed.
      track: logAmplitudeEvent,
      setUserProperty: (key, value) => setUserProperties({ [key]: value }),
    },
  });
  return client;
}

export const { useExperimentValue, ExperimentText } = createExperimentsHooks({
  getClient: getExperiments,
  configured: Boolean(CLIENT_KEY?.trim()),
});
