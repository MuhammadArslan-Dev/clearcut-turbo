"use client";

// Hands the server-fetched GrowthBook payload to the browser-side client before it is created (CC-192).
// Renders nothing. The assignment is a module-level value, so setting it during render is idempotent and safe to repeat.
import type { FeaturesPayload } from "@clearcut/experiments/payload";
import { setServerPayload } from "@/lib/experiments";

export default function ExperimentsBootstrap({ payload }: { payload: FeaturesPayload }) {
  setServerPayload(payload);
  return null;
}
