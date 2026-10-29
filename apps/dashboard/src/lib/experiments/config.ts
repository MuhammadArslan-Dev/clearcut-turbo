// Environment switches of the Experiment layer (phase 66). Everything is OFF
// unless a deployment key is configured AND Amplitude analytics itself is
// allowed to run in this browser (production hosts, or the local opt-in) —
// an exposure with nowhere to go would make the analysis meaningless.
//
// Read lazily (functions, not top-level constants) so tests can change the
// environment, and so `process.env.NEXT_PUBLIC_*` stays a literal access that
// Next inlines at build time.

import { analyticsAllowedHere } from "@clearcut/utils/analytics-hosts";

/** Hard ceiling for any wait on Amplitude before we fall back to control. */
export const EXPERIMENT_TIMEOUT_MS = 2500;

/**
 * Amplitude Experiment CLIENT deployment key `testing_price_99` (project 673721).
 * A client key is public by design (it is shipped to every browser), so it is
 * safe in the repo. Hardcoded on request so the offer needs no env var; whether
 * anyone gets the offer is still decided ONLY by the Amplitude flag
 * `autopay-offer-99` (disable it there = everybody on default prices).
 */
export const DEFAULT_EXPERIMENT_DEPLOYMENT_KEY = "client-pRpnI5vqt36xQQ76zn6lb0mAi6ndv6qV";

/**
 * The key used, in order: `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` when set (e.g. to
 * point a build at another deployment), the literal "off" to switch the SDK off
 * for that build, otherwise the hardcoded key above.
 */
export function experimentDeploymentKey(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY ?? "").trim();
  if (fromEnv.toLowerCase() === "off") return "";
  return fromEnv || DEFAULT_EXPERIMENT_DEPLOYMENT_KEY;
}

/** "us" (default) or "eu" — must match the Amplitude project's data region. */
export function experimentServerZone(): "US" | "EU" {
  return (process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_SERVER_ZONE ?? "").toLowerCase() === "eu"
    ? "EU"
    : "US";
}

export function internalTesterUuids(): string | undefined {
  return process.env.NEXT_PUBLIC_EXPERIMENT_INTERNAL_UUIDS;
}

export function experimentsEnabled(): boolean {
  if (!experimentDeploymentKey()) return false;
  // Same switch as the analytics module: on unless explicitly "false".
  if (process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED === "false") return false;
  return analyticsAllowedHere();
}
