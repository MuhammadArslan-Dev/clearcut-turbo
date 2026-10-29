"use client";

import { useCallback, useMemo } from "react";
import { useExperimentStore, type ExperimentStatus } from "@/store/experiments/useExperimentStore";
import {
  AUTOPAY_OFFER_FLAG_KEY,
  isDiscountExam,
  offerFor,
  type AutopayOffer,
  type OfferAssignment,
} from "./autopayPrice";
import { exposeAutopayOffer } from "./runtime";

export type AutopayOfferState = {
  /** Safe to print a price. False only while a user who may be offered ₹99 is
   * still waiting for Amplitude (a moment, bounded by EXPERIMENT_TIMEOUT_MS). */
  ready: boolean;
  /** `null` = nothing to override: the exam's existing default price (feature
   * off, exam not a discount exam, user not selected, out of scope, Amplitude
   * down). Otherwise the ₹99 plan. */
  offer: AutopayOffer | null;
  /** The ₹99 offer is shown to this user: it may be logged as an exposure. */
  exposable: boolean;
};

type DeriveInput = {
  status: ExperimentStatus;
  assignments: Record<string, OfferAssignment>;
  examShortName: string | undefined | null;
};

const DEFAULT_PRICE: AutopayOfferState = { ready: true, offer: null, exposable: false };

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

  const offer = offerFor(examShortName, assignments[AUTOPAY_OFFER_FLAG_KEY]);
  return { ready: true, offer, exposable: offer !== null };
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

  const exposable = state.exposable;

  /** Call when the autopay price is actually on screen. Idempotent. */
  const expose = useCallback(() => {
    if (exposable) void exposeAutopayOffer();
  }, [exposable]);

  return { ...state, expose };
}
