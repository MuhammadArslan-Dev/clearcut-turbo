"use client";

import { useCallback, useMemo } from "react";
import { useExperimentStore, type ExperimentStatus } from "@/store/experiments/useExperimentStore";
import {
  AUTOPAY_AB_FLAG_KEY,
  AUTOPAY_OFFER,
  AUTOPAY_OFFER_FLAG_KEY,
  AUTOPAY_OFFER_VARIANT,
  abArmFor,
  isDiscountExam,
  offerFor,
  type AutopayOffer,
  type OfferAssignment,
} from "./autopayPrice";
import { exposeAutopayOffer } from "./runtime";

/** What to log as the `$exposure` for this user on this page. */
export type OfferExposure = { flagKey: string; variant: string };

export type AutopayOfferState = {
  /** Safe to print a price. False only while a user who may be offered ₹99 is
   * still waiting for Amplitude (a moment, bounded by EXPERIMENT_TIMEOUT_MS). */
  ready: boolean;
  /** `null` = nothing to override: the exam's existing default price (feature
   * off, exam not a discount exam, user not selected, out of scope, A/B control,
   * Amplitude down). Otherwise the ₹99 plan. */
  offer: AutopayOffer | null;
  /** Why the user is in something, for analytics: "price-99" (offered ₹99, by
   * allow-list or A/B treatment), "control" (A/B control) or null. */
  arm: "price-99" | "control" | null;
  /** The exposure to log when the autopay price is on screen, or null. */
  exposure: OfferExposure | null;
};

type DeriveInput = {
  status: ExperimentStatus;
  assignments: Record<string, OfferAssignment>;
  examShortName: string | undefined | null;
};

const DEFAULT_PRICE: AutopayOfferState = { ready: true, offer: null, arm: null, exposure: null };

/** Pure: the whole decision, no React — covered by unit tests. */
export function deriveAutopayOffer(input: DeriveInput): AutopayOfferState {
  const { status, assignments, examShortName } = input;

  if (status === "disabled") return DEFAULT_PRICE;

  // Exams that already sell ₹99 (CTET, ...) or are unknown to the price table
  // can never be offered anything: default price at once, no waiting.
  if (examShortName && !isDiscountExam(examShortName)) return DEFAULT_PRICE;

  // Course data not loaded yet, or Amplitude not answered yet: don't print a
  // price that might change a moment later.
  if (!examShortName || status === "idle" || status === "loading") {
    return { ...DEFAULT_PRICE, ready: false };
  }

  // Failed fetch = no assignment = default price (and no exposure).
  if (status === "failed") return DEFAULT_PRICE;

  // 1) The allow-list (testers, the team) always wins and never joins the A/B.
  if (offerFor(examShortName, assignments[AUTOPAY_OFFER_FLAG_KEY])) {
    return {
      ready: true,
      offer: AUTOPAY_OFFER,
      arm: AUTOPAY_OFFER_VARIANT,
      exposure: { flagKey: AUTOPAY_OFFER_FLAG_KEY, variant: AUTOPAY_OFFER_VARIANT },
    };
  }

  // 2) The random A/B test. Both arms are exposed; only price-99 changes the price.
  const arm = abArmFor(examShortName, assignments[AUTOPAY_AB_FLAG_KEY]);
  if (arm === "price-99") {
    return { ready: true, offer: AUTOPAY_OFFER, arm, exposure: { flagKey: AUTOPAY_AB_FLAG_KEY, variant: arm } };
  }
  if (arm === "control") {
    return { ready: true, offer: null, arm, exposure: { flagKey: AUTOPAY_AB_FLAG_KEY, variant: arm } };
  }

  return DEFAULT_PRICE;
}

/**
 * The monthly autopay price for the signed-in user on `examShortName`.
 * Every screen that prints the autopay price or sends its plan id goes
 * through this, so display, analytics and checkout can't disagree.
 */
export function useAutopayOffer(examShortName?: string | null) {
  const status = useExperimentStore((s) => s.status);
  const assignments = useExperimentStore((s) => s.assignments);

  const state = useMemo(
    () => deriveAutopayOffer({ status, assignments, examShortName }),
    [status, assignments, examShortName],
  );

  const flagKey = state.exposure?.flagKey;
  const variant = state.exposure?.variant;

  /** Call when the autopay price is actually on screen. Idempotent. */
  const expose = useCallback(() => {
    if (flagKey && variant) void exposeAutopayOffer(flagKey, variant);
  }, [flagKey, variant]);

  return { ...state, expose };
}
