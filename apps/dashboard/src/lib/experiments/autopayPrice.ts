// Pure rules of the allow-listed ₹99 autopay offer (phase 66). No React, no SDK,
// no network: everything that decides WHICH price a user sees lives here so it
// can be unit tested, and so the dashboard and the tests share one definition.
//
// WHO gets the offer and on WHICH exams is controlled in AMPLITUDE, nowhere
// else: feature flag `autopay-offer-99`, variant `price-99`, whose payload says
// {"scope":"all"} or {"scope":"exams","exams":["HTET","HPTET"]}. Amplitude's
// targeting (individual user IDs, internal-tester rule, cohorts, on/off) picks
// the users. This file only turns that answer into a price, and refuses to
// guess: anything unclear is "no offer", i.e. the exam's own default price.
//
// The money never comes from Amplitude: the plan id and the ₹99 amount are
// fixed here. The backend is NOT involved (user decision): it bills whatever
// active `plan_id` the browser sends, a gap that exists today for every plan,
// so this is a short, allow-listed test and not a public rollout (docs/phases/66).

import {
  DEFAULT_SUBSCRIPTION_PLAN_ID,
  EXAM_PRICE_OVERRIDES,
} from "@/lib/payment/examPriceOverrides";

/** Amplitude feature flag key. Must match the flag created in Amplitude. */
export const AUTOPAY_OFFER_FLAG_KEY = "autopay-offer-99";

/** The only variant that means "show ₹99". Any other value is no offer. */
export const AUTOPAY_OFFER_VARIANT = "price-99";

/** What an offered user pays: the default ₹99 plan (`subscription_plans.id` 1). */
export type AutopayOffer = {
  /** `subscription_plans.id` sent to `/v2/subscription/create`. */
  planId: number;
  /** Rupees charged every month. */
  price: number;
};

export const AUTOPAY_OFFER: AutopayOffer = {
  planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
  price: 99,
};

/** What Amplitude answered for the flag (null variant = not in the flag). */
export type OfferAssignment = {
  variant: string | null;
  payload: unknown;
};

export type OfferScope = { kind: "all" } | { kind: "exams"; exams: string[] };

/**
 * `{"scope":"all"}` or `{"scope":"exams","exams":["HTET",...]}` (a JSON string
 * is accepted too). Anything else, including an empty exam list, a wrong case
 * of "scope" or a missing payload, is null = no offer anywhere.
 */
export function parseScope(payload: unknown): OfferScope | null {
  let value = payload;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const { scope, exams } = value as { scope?: unknown; exams?: unknown };
  if (scope === "all") return { kind: "all" };

  if (scope === "exams" && Array.isArray(exams)) {
    const names = Array.from(
      new Set(
        exams
          .filter((e): e is string => typeof e === "string")
          .map((e) => e.trim().toUpperCase())
          .filter(Boolean),
      ),
    );
    return names.length > 0 ? { kind: "exams", exams: names } : null;
  }

  return null;
}

/**
 * Is ₹99 really a DISCOUNT on this exam? Only exams whose own default autopay
 * price is dearer than ₹99 (HTET, HPTET, MAHATET ₹149; UGC ₹249). Exams on the
 * default ₹99 plan (CTET, UPTET, ...) already sell it: nothing to offer, no
 * change, no exposure.
 */
export function isDiscountExam(examShortName: string | undefined | null): boolean {
  if (!examShortName) return false;
  const monthly = EXAM_PRICE_OVERRIDES[examShortName.toUpperCase()]?.recurringMonthly;
  return monthly !== undefined && monthly > AUTOPAY_OFFER.price;
}

/**
 * The offer for this exam given Amplitude's answer, or null (= the exam's
 * existing default price). Never throws, never guesses.
 */
export function offerFor(
  examShortName: string | undefined | null,
  assignment: OfferAssignment | null | undefined,
): AutopayOffer | null {
  if (!examShortName || !assignment || assignment.variant !== AUTOPAY_OFFER_VARIANT) return null;
  if (!isDiscountExam(examShortName)) return null;

  const scope = parseScope(assignment.payload);
  if (!scope) return null;
  if (scope.kind === "all") return AUTOPAY_OFFER;

  return scope.exams.includes(examShortName.toUpperCase()) ? AUTOPAY_OFFER : null;
}

/** Internal testers can also be targeted by an Amplitude user property. */
export function parseUuidList(raw: string | undefined | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isInternalTester(uuid: string | undefined | null, rawList: string | undefined | null): boolean {
  if (!uuid) return false;
  return parseUuidList(rawList).includes(uuid.toLowerCase());
}
