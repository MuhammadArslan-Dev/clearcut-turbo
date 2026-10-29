// Thin, failure-proof wrapper around @amplitude/experiment-js-client
// (phase 66). Rules this file enforces:
//
//  * The SDK is loaded with a dynamic import, only when experiments are
//    enabled — a build with no deployment key never downloads it.
//  * Nothing here throws. Any failure (import, network, timeout) resolves to
//    "no answer" and the caller falls back to control.
//  * We use `Experiment.initialize` with OUR user and exposure providers, not
//    `initializeWithAmplitudeAnalytics`: that integration reads every user
//    property from the Analytics SDK (we set phone/email there), and needs
//    the analytics instance on `window`. Our providers send only
//    user_id/device_id and route `$exposure` through the one analytics gate
//    in `lib/analytics/browser.ts`.
//  * Exposure is explicit (`automaticExposureTracking: false`): it is sent
//    when the price is really on screen, not when code reads a variant.

import type { ExperimentClient, Exposure } from "@amplitude/experiment-js-client";
import { getAnalyticsIdentity, trackSdkEvent } from "@/lib/analytics/browser";
import type { OfferAssignment } from "./autopayPrice";
import {
  EXPERIMENT_TIMEOUT_MS,
  experimentDeploymentKey,
  experimentServerZone,
} from "./config";

const INSTANCE_NAME = "clearcut-dashboard";

let clientPromise: Promise<ExperimentClient | null> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("experiment timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Sends the SDK's `$exposure` through our analytics gate (flag_key + variant
 * are the two properties Amplitude's experiment analysis reads). */
export function sendExposure(exposure: Exposure): void {
  const payload: Record<string, unknown> = { flag_key: exposure.flag_key };
  if (exposure.variant !== undefined) payload.variant = exposure.variant;
  if (exposure.experiment_key) payload.experiment_key = exposure.experiment_key;
  if (exposure.metadata) payload.metadata = exposure.metadata;
  trackSdkEvent("$exposure", payload);
}

function loadClient(): Promise<ExperimentClient | null> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    try {
      const key = experimentDeploymentKey();
      if (!key) return null;
      const { Experiment } = await import("@amplitude/experiment-js-client");
      return Experiment.initialize(key, {
        instanceName: INSTANCE_NAME,
        serverZone: experimentServerZone(),
        fetchTimeoutMillis: EXPERIMENT_TIMEOUT_MS,
        // Surface failures to us (we fall back to control) instead of the SDK
        // silently keeping stale variants and retrying in the background.
        throwOnError: true,
        retryFetchOnFailure: false,
        fetchOnStart: false,
        pollOnStart: false,
        automaticExposureTracking: false,
        automaticFetchOnAmplitudeIdentityChange: false,
        userProvider: {
          getUser: () => {
            const { userId, deviceId } = getAnalyticsIdentity();
            return { user_id: userId, device_id: deviceId };
          },
        },
        exposureTrackingProvider: { track: (exposure) => sendExposure(exposure) },
      });
    } catch {
      clientPromise = null; // allow a later retry (e.g. after a network blip)
      return null;
    }
  })();
  return clientPromise;
}

/**
 * Fetches what Amplitude says for `flagKeys` about `userId` (remote evaluation).
 * Resolves to flag -> { variant (null = not in the flag), payload }, or null
 * when Amplitude could not be reached in time.
 *
 * `userProperties` are sent explicitly (only ever `internal_tester`): a
 * property just set by Identify may not be readable by the evaluation yet.
 *
 * The SDK keeps its last variants in localStorage; they are dropped BEFORE every
 * fetch so a failed or de-targeted fetch can never fall back to a stale offer.
 */
export async function fetchVariantMap(
  userId: string,
  flagKeys: string[],
  userProperties?: Record<string, string | number | boolean>,
): Promise<Record<string, OfferAssignment> | null> {
  try {
    const client = await withTimeout(loadClient(), EXPERIMENT_TIMEOUT_MS);
    if (!client) return null;
    client.clear();
    const { deviceId } = getAnalyticsIdentity();
    await withTimeout(
      client.fetch(
        { user_id: userId, device_id: deviceId, ...(userProperties ? { user_properties: userProperties } : {}) },
        { flagKeys },
      ),
      EXPERIMENT_TIMEOUT_MS,
    );
    const result: Record<string, OfferAssignment> = {};
    for (const flagKey of flagKeys) {
      const variant = client.variant(flagKey);
      result[flagKey] = {
        variant: variant?.value ?? variant?.key ?? null,
        payload: variant?.payload ?? null,
      };
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Logs ONE `$exposure` for `flagKey`, but only if the SDK's own stored variant
 * is the one we are about to show. If they differ (a server correction, a
 * stale cache) nothing is sent — a wrong exposure would poison the analysis.
 */
export async function exposeVariant(flagKey: string, shownVariant: string): Promise<boolean> {
  try {
    const client = await withTimeout(loadClient(), EXPERIMENT_TIMEOUT_MS);
    if (!client) return false;
    const stored = client.variant(flagKey);
    if ((stored?.value ?? stored?.key) !== shownVariant) return false;
    client.exposure(flagKey);
    return true;
  } catch {
    return false;
  }
}

/** On logout / account switch: drop the cached variants of the previous user. */
export async function clearExperimentClient(): Promise<void> {
  if (!clientPromise) return;
  try {
    const client = await clientPromise;
    client?.clear();
  } catch {
    // nothing to clear
  }
}

/** Test seam: forget the singleton. */
export function __resetExperimentClientForTests(): void {
  clientPromise = null;
}
