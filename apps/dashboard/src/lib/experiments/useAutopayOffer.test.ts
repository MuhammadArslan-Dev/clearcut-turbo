import { describe, expect, it, vi } from "vitest";

// The hook file imports the runtime (SDK, analytics); the decision under test
// is the pure `deriveAutopayOffer`, so the runtime is stubbed out.
vi.mock("./runtime", () => ({ exposeAutopayOffer: vi.fn() }));

import { AUTOPAY_AB_FLAG_KEY, AUTOPAY_OFFER, AUTOPAY_OFFER_FLAG_KEY } from "./autopayPrice";
import { deriveAutopayOffer } from "./useAutopayOffer";

const FLAG = AUTOPAY_OFFER_FLAG_KEY;
const AB = AUTOPAY_AB_FLAG_KEY;
const ALL = { variant: "price-99", payload: { scope: "all" } };
const NOTHING = { ready: true, offer: null, arm: null, exposure: null };

function derive(over: Partial<Parameters<typeof deriveAutopayOffer>[0]> = {}) {
  return deriveAutopayOffer({
    status: "ready",
    assignments: {},
    examShortName: "HTET",
    ...over,
  });
}

describe("allow-list flag (testers, the team)", () => {
  it("experiments off: default price, ready at once, never an exposure", () => {
    expect(derive({ status: "disabled", examShortName: undefined })).toEqual(NOTHING);
    expect(derive({ status: "disabled", assignments: { [FLAG]: ALL } }).offer).toBeNull();
  });

  it("an exam that already sells ₹99 is ready immediately even while Amplitude is loading", () => {
    for (const examShortName of ["CTET", "UPTET", "UP TGT"]) {
      expect(derive({ status: "loading", examShortName })).toEqual(NOTHING);
    }
  });

  it("such an exam is never offered anything, whatever Amplitude says", () => {
    const assignments = { [FLAG]: ALL, [AB]: ALL };
    expect(derive({ examShortName: "CTET", assignments })).toEqual(NOTHING);
  });

  it("a possible participant waits (not ready) instead of seeing a price that then changes", () => {
    expect(derive({ status: "loading" }).ready).toBe(false);
    expect(derive({ status: "idle" }).ready).toBe(false);
    expect(derive({ examShortName: undefined }).ready).toBe(false);
  });

  it("selected, global scope: ₹99 / plan 1, exposed on the allow-list flag", () => {
    for (const examShortName of ["HTET", "HPTET", "MAHATET", "UGC"]) {
      expect(derive({ examShortName, assignments: { [FLAG]: ALL } })).toEqual({
        ready: true,
        offer: AUTOPAY_OFFER,
        arm: "price-99",
        exposure: { flagKey: FLAG, variant: "price-99" },
      });
    }
  });

  it("selected exams mode: the named exam gets it, another keeps its default (no exposure)", () => {
    const assignments = { [FLAG]: { variant: "price-99", payload: { scope: "exams", exams: ["HTET"] } } };
    expect(derive({ examShortName: "HTET", assignments }).offer).toEqual(AUTOPAY_OFFER);
    expect(derive({ examShortName: "HPTET", assignments })).toEqual(NOTHING);
  });

  it("not selected, another variant or an unclear payload: default price, no exposure", () => {
    expect(derive({ assignments: { [FLAG]: { variant: null, payload: null } } })).toEqual(NOTHING);
    expect(derive({ assignments: {} })).toEqual(NOTHING);
    expect(derive({ assignments: { [FLAG]: { variant: "control", payload: { scope: "all" } } } })).toEqual(NOTHING);
    expect(derive({ assignments: { [FLAG]: { variant: "price-99", payload: { scope: "ALL" } } } })).toEqual(NOTHING);
  });

  it("Amplitude failed: default price, no exposure, even if an old answer is somehow still around", () => {
    expect(derive({ status: "failed", assignments: { [FLAG]: ALL, [AB]: ALL } })).toEqual(NOTHING);
  });
});

describe("random A/B test flag (the public)", () => {
  const treatment = { variant: "price-99", payload: { scope: "all" } };
  const control = { variant: "control", payload: { scope: "all" } };

  it("treatment: ₹99, exposed on the A/B flag", () => {
    expect(derive({ assignments: { [AB]: treatment } })).toEqual({
      ready: true,
      offer: AUTOPAY_OFFER,
      arm: "price-99",
      exposure: { flagKey: AB, variant: "price-99" },
    });
  });

  it("control: the exam's DEFAULT price, but exposed (or Amplitude has no control group)", () => {
    expect(derive({ assignments: { [AB]: control } })).toEqual({
      ready: true,
      offer: null,
      arm: "control",
      exposure: { flagKey: AB, variant: "control" },
    });
  });

  it("the same exam scope applies to both arms", () => {
    const scoped = (variant: string) => ({ variant, payload: { scope: "exams", exams: ["HTET"] } });
    expect(derive({ examShortName: "HTET", assignments: { [AB]: scoped("control") } }).arm).toBe("control");
    expect(derive({ examShortName: "HTET", assignments: { [AB]: scoped("price-99") } }).arm).toBe("price-99");
    expect(derive({ examShortName: "UGC", assignments: { [AB]: scoped("control") } })).toEqual(NOTHING);
    expect(derive({ examShortName: "UGC", assignments: { [AB]: scoped("price-99") } })).toEqual(NOTHING);
  });

  it("not in the experiment (null variant / empty answer): default price, no exposure", () => {
    expect(derive({ assignments: { [AB]: { variant: null, payload: null } } })).toEqual(NOTHING);
    expect(derive({ assignments: {} })).toEqual(NOTHING);
  });

  it("an unclear payload on either arm means NOT in the test (never a wrong price)", () => {
    for (const variant of ["control", "price-99"]) {
      for (const payload of [undefined, null, {}, { scope: "ALL" }, { scope: "exams", exams: [] }]) {
        expect(derive({ assignments: { [AB]: { variant, payload } } })).toEqual(NOTHING);
      }
    }
  });

  it("another variant name is not in the test", () => {
    expect(derive({ assignments: { [AB]: { variant: "price-149", payload: { scope: "all" } } } })).toEqual(NOTHING);
  });

  it("the allow-list wins: a tester is never inside the A/B numbers", () => {
    const s = derive({ assignments: { [FLAG]: ALL, [AB]: control } });
    expect(s.offer).toEqual(AUTOPAY_OFFER);
    expect(s.exposure).toEqual({ flagKey: FLAG, variant: "price-99" });
  });

  it("Amplitude failing: default price, no exposure", () => {
    expect(derive({ status: "failed", assignments: { [AB]: treatment } })).toEqual(NOTHING);
  });
});
