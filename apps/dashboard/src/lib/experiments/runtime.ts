// Orchestration of the Experiment layer (phase 66): decides when to fetch and
// keeps the store in sync. The SDK/network details live in `client.ts`.
//
// No cache of any kind: an Amplitude answer lives in memory for this page load
// only, so a user who is de-targeted (or whose fetch fails) goes straight back
// to the default price, never to a remembered offer.

import { useExperimentStore } from "@/store/experiments/useExperimentStore";
import { AUTOPAY_OFFER_FLAG_KEY, AUTOPAY_OFFER_VARIANT, isInternalTester } from "./autopayPrice";
import { clearExperimentClient, exposeVariant, fetchVariantMap } from "./client";
import { experimentsEnabled, internalTesterUuids } from "./config";

/** Every flag this app evaluates. Add new ones here. */
const ACTIVE_FLAGS = [AUTOPAY_OFFER_FLAG_KEY];

/**
 * Called by the analytics provider whenever the signed-in user changes.
 * Safe to call repeatedly: one fetch per user per page load.
 */
export async function ensureExperiments(userId: string | null | undefined): Promise<void> {
  const store = useExperimentStore.getState();

  if (!userId) {
    if (store.userId) void clearExperimentClient();
    store.reset();
    return;
  }

  if (!experimentsEnabled()) {
    if (store.status !== "disabled") store.disable();
    return;
  }

  if (store.userId === userId && store.status !== "idle" && store.status !== "disabled") return;

  store.begin(userId);

  const assignments = await fetchVariantMap(
    userId,
    ACTIVE_FLAGS,
    isInternalTester(userId, internalTesterUuids()) ? { internal_tester: true } : undefined,
  );
  if (!assignments) {
    useExperimentStore.getState().fail(userId);
    return;
  }
  useExperimentStore.getState().resolve(userId, assignments);
}

// One $exposure per user per page load, on top of the SDK's own per-session
// de-duplication.
const exposed = new Set<string>();

/**
 * Logs the exposure of the ₹99 offer, and only when the user really is shown
 * it (the caller checks) and this page load's fetch answered. Resolves true
 * only when an event was actually handed to the SDK.
 */
export async function exposeAutopayOffer(): Promise<boolean> {
  const { userId, status } = useExperimentStore.getState();
  if (!userId || status !== "ready") return false;

  const key = `${userId}|${AUTOPAY_OFFER_FLAG_KEY}`;
  if (exposed.has(key)) return false;
  exposed.add(key);

  const sent = await exposeVariant(AUTOPAY_OFFER_FLAG_KEY, AUTOPAY_OFFER_VARIANT);
  if (!sent) exposed.delete(key);
  return sent;
}

/** Test seam. */
export function __resetExposureGuardForTests(): void {
  exposed.clear();
}
