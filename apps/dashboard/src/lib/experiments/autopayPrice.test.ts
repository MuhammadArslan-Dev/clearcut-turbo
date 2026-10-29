import { describe, expect, it } from "vitest";
import {
  EXAM_PRICE_OVERRIDES,
  getPriceForVariant,
  getSubscriptionPlanId,
} from "@/lib/payment/examPriceOverrides";
import { getPlanAnalytics } from "@/lib/payment/planAnalytics";
import {
  AUTOPAY_OFFER,
  isDiscountExam,
  isInternalTester,
  offerFor,
  parseScope,
  parseUuidList,
} from "./autopayPrice";

const ALL = { variant: "price-99", payload: { scope: "all" } };
const only = (...exams: string[]) => ({ variant: "price-99", payload: { scope: "exams", exams } });

describe("the offer is the ₹99 plan, and only that", () => {
  it("is plan id 1 at ₹99", () => {
    expect(AUTOPAY_OFFER).toEqual({ planId: 1, price: 99 });
  });
});

describe("where ₹99 is a discount", () => {
  it("only exams whose own autopay price is dearer than ₹99", () => {
    for (const exam of ["HTET", "htet", "HPTET", "MAHATET", "UGC"]) {
      expect(isDiscountExam(exam)).toBe(true);
    }
  });

  it("exams already on ₹99, unknown exams and missing names are not", () => {
    for (const exam of ["CTET", "UPTET", "UP TGT", "REET", "UTET", "Whatever", "", undefined, null]) {
      expect(isDiscountExam(exam)).toBe(false);
    }
  });

  it("TRIPWIRE: the discount exams are exactly the ones with their own dearer plan", () => {
    // Adding an exam with its own recurring plan to EXAM_PRICE_OVERRIDES makes
    // this fail on purpose: decide whether it belongs in the ₹99 offer.
    const dearer = Object.entries(EXAM_PRICE_OVERRIDES)
      .filter(([, v]) => v.planId !== undefined && (v.recurringMonthly ?? 0) > 99)
      .map(([name]) => name)
      .sort();
    expect(dearer).toEqual(["HPTET", "HTET", "MAHATET", "UGC"]);
    for (const name of dearer) expect(isDiscountExam(name)).toBe(true);
  });
});

describe("payload scope (set in Amplitude)", () => {
  it('"all"', () => {
    expect(parseScope({ scope: "all" })).toEqual({ kind: "all" });
  });

  it("selected exams: trimmed, upper-cased, de-duplicated", () => {
    expect(parseScope({ scope: "exams", exams: [" htet ", "HTET", "hptet"] })).toEqual({
      kind: "exams",
      exams: ["HTET", "HPTET"],
    });
  });

  it("a JSON string payload is understood too", () => {
    expect(parseScope('{"scope":"all"}')).toEqual({ kind: "all" });
    expect(parseScope('{"scope":"exams","exams":["UGC"]}')).toEqual({ kind: "exams", exams: ["UGC"] });
  });

  it("anything unclear is no scope at all (never guessed)", () => {
    const bad: unknown[] = [
      undefined, null, "", "all", "{not json", 7, true, [], ["all"], {},
      { scope: "ALL" }, { scope: "everything" }, { scope: "exams" },
      { scope: "exams", exams: [] }, { scope: "exams", exams: "HTET" }, { scope: "exams", exams: [1, null, ""] },
    ];
    for (const payload of bad) expect(parseScope(payload)).toBeNull();
  });
});

describe("offerFor: the whole decision", () => {
  it("global mode: every discount exam gets ₹99", () => {
    for (const exam of ["HTET", "HPTET", "MAHATET", "UGC"]) {
      expect(offerFor(exam, ALL)).toEqual(AUTOPAY_OFFER);
    }
  });

  it("selected mode: only the named exams", () => {
    expect(offerFor("HTET", only("HTET", "UGC"))).toEqual(AUTOPAY_OFFER);
    expect(offerFor("UGC", only("HTET", "UGC"))).toEqual(AUTOPAY_OFFER);
    expect(offerFor("HPTET", only("HTET", "UGC"))).toBeNull();
    expect(offerFor("MAHATET", only("HTET", "UGC"))).toBeNull();
  });

  it("an exam that already sells ₹99 is never offered anything, even when named or in global mode", () => {
    expect(offerFor("CTET", ALL)).toBeNull();
    expect(offerFor("CTET", only("CTET"))).toBeNull();
  });

  it("not selected / other variant / no assignment = the default price", () => {
    expect(offerFor("HTET", null)).toBeNull();
    expect(offerFor("HTET", undefined)).toBeNull();
    expect(offerFor("HTET", { variant: null, payload: null })).toBeNull();
    for (const variant of ["control", "off", "on", "price-149", "PRICE-99", ""]) {
      expect(offerFor("HTET", { variant, payload: { scope: "all" } })).toBeNull();
    }
  });

  it("a flag with the right variant but an unclear payload is NO offer", () => {
    for (const payload of [undefined, null, {}, { scope: "ALL" }, { scope: "exams", exams: [] }]) {
      expect(offerFor("HTET", { variant: "price-99", payload })).toBeNull();
    }
  });

  it("an unknown exam is not offered", () => {
    expect(offerFor(undefined, ALL)).toBeNull();
    expect(offerFor("", ALL)).toBeNull();
  });
});

describe("price helpers stay backwards compatible", () => {
  it("without an offer every price and plan is exactly as before", () => {
    expect(getPriceForVariant("1month", null, "CTET")).toBe(99);
    expect(getPriceForVariant("1month", null, "HTET")).toBe(149);
    expect(getPriceForVariant("1month", null, "HPTET")).toBe(149);
    expect(getPriceForVariant("1month", null, "MAHATET")).toBe(149);
    expect(getPriceForVariant("1month", null, "UGC")).toBe(249);
    expect(getSubscriptionPlanId("CTET")).toBe(1);
    expect(getSubscriptionPlanId("HTET")).toBe(2);
    expect(getSubscriptionPlanId("UGC")).toBe(3);
    expect(getSubscriptionPlanId(undefined)).toBe(1);
    expect(getPriceForVariant("1month", null, "HTET", null)).toBe(149);
    expect(getSubscriptionPlanId("HTET", null)).toBe(2);
  });

  it("an offer changes the autopay price and plan id, and nothing else", () => {
    expect(getPriceForVariant("1month", null, "HTET", AUTOPAY_OFFER)).toBe(99);
    expect(getSubscriptionPlanId("HTET", AUTOPAY_OFFER)).toBe(1);
    expect(getPriceForVariant("1month", null, "UGC", AUTOPAY_OFFER)).toBe(99);

    // one-time and annual plans never move
    expect(getPriceForVariant("1month-onetime", null, "HTET", AUTOPAY_OFFER)).toBe(229);
    expect(getPriceForVariant("1year", null, "HTET", AUTOPAY_OFFER)).toBe(799);
    expect(getPriceForVariant("1month-onetime", null, "UGC", AUTOPAY_OFFER)).toBe(449);
  });

  it("displayed price and the plan sent to checkout can never disagree", () => {
    for (const exam of ["HTET", "HPTET", "MAHATET", "UGC"]) {
      const offer = offerFor(exam, ALL);
      expect(getPriceForVariant("1month", null, exam, offer)).toBe(99);
      expect(getSubscriptionPlanId(exam, offer)).toBe(1);
      const none = offerFor(exam, null);
      expect(getPriceForVariant("1month", null, exam, none)).toBe(EXAM_PRICE_OVERRIDES[exam].recurringMonthly);
      expect(getSubscriptionPlanId(exam, none)).toBe(EXAM_PRICE_OVERRIDES[exam].planId);
    }
  });

  it("the analytics plan id carries the offered price", () => {
    expect(getPlanAnalytics("1month", null, "HTET", "HTET", AUTOPAY_OFFER)).toMatchObject({
      plan_id: "htet_1m_99",
      price: 99,
      billing_type: "auto_renew",
    });
    expect(getPlanAnalytics("1month", null, "HTET", "HTET")).toMatchObject({ plan_id: "htet_1m_149", price: 149 });
  });
});

describe("internal testers", () => {
  it("parses a comma list, trimmed and lower-cased", () => {
    expect(parseUuidList(" A-1 , b-2,, ")).toEqual(["a-1", "b-2"]);
    expect(parseUuidList(undefined)).toEqual([]);
  });

  it("matches a uuid regardless of case, and never matches when unset", () => {
    expect(isInternalTester("ABC-1", "abc-1,def-2")).toBe(true);
    expect(isInternalTester("zzz", "abc-1")).toBe(false);
    expect(isInternalTester("abc-1", "")).toBe(false);
    expect(isInternalTester(undefined, "abc-1")).toBe(false);
  });
});
