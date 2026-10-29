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

export function experimentDeploymentKey(): string {
  return process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY ?? "";
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
  if (process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED !== "true") return false;
  return analyticsAllowedHere();
}
