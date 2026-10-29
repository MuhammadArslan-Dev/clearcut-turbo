import { describe, expect, it, vi } from "vitest";

// The hook file imports the runtime (SDK, analytics); the decision under test
// is the pure `deriveAutopayOffer`, so the runtime is stubbed out.
vi.mock("./runtime", () => ({ exposeAutopayOffer: vi.fn() }));

import { AUTOPAY_OFFER, AUTOPAY_OFFER_FLAG_KEY } from "./autopayPrice";
import { deriveAutopayOffer } from "./useAutopayOffer";

const FLAG = AUTOPAY_OFFER_FLAG_KEY;
const ALL = { variant: "price-99", payload: { scope: "all" } };

function derive(over: Partial<Parameters<typeof deriveAutopayOffer>[0]> = {}) {
  return deriveAutopayOffer({
    status: "ready",
    assignments: {},
    examShortName: "HTET",
    ...over,
  });
}

describe("deriveAutopayOffer", () => {
  it("experiments off: default price, ready at once, never an exposure", () => {
    expect(derive({ status: "disabled", examShortName: undefined })).toEqual({
      ready: true,
      offer: null,
      exposable: false,
    });
    expect(derive({ status: "disabled", assignments: { [FLAG]: ALL } }).offer).toBeNull();
  });

  it("an exam that already sells ₹99 is ready immediately even while Amplitude is loading", () => {
    for (const examShortName of ["CTET", "UPTET", "UP TGT"]) {
      const s = derive({ status: "loading", examShortName });
      expect(s).toEqual({ ready: true, offer: null, exposable: false });
    }
  });

  it("such an exam is never offered anything, whatever Amplitude says", () => {
    const s = derive({ examShortName: "CTET", assignments: { [FLAG]: ALL } });
    expect(s).toEqual({ ready: true, offer: null, exposable: false });
  });

  it("a possible participant waits (not ready) instead of seeing a price that then changes", () => {
    expect(derive({ status: "loading" }).ready).toBe(false);
    expect(derive({ status: "idle" }).ready).toBe(false);
    expect(derive({ examShortName: undefined }).ready).toBe(false);
  });

  it("selected by Amplitude, global scope: ₹99 / plan 1 and exposable", () => {
    for (const examShortName of ["HTET", "HPTET", "MAHATET", "UGC"]) {
      const s = derive({ examShortName, assignments: { [FLAG]: ALL } });
      expect(s).toEqual({ ready: true, offer: AUTOPAY_OFFER, exposable: true });
    }
  });

  it("selected mode: the named exam gets it, another exam keeps its default (and no exposure)", () => {
    const assignments = { [FLAG]: { variant: "price-99", payload: { scope: "exams", exams: ["HTET"] } } };
    expect(derive({ examShortName: "HTET", assignments })).toEqual({ ready: true, offer: AUTOPAY_OFFER, exposable: true });
    expect(derive({ examShortName: "HPTET", assignments })).toEqual({ ready: true, offer: null, exposable: false });
  });

  it("not selected (null variant / empty answer): default price, no exposure", () => {
    expect(derive({ assignments: { [FLAG]: { variant: null, payload: null } } })).toEqual({
      ready: true,
      offer: null,
      exposable: false,
    });
    expect(derive({ assignments: {} })).toEqual({ ready: true, offer: null, exposable: false });
  });

  it("another variant or an unclear payload falls back to the default price", () => {
    expect(derive({ assignments: { [FLAG]: { variant: "control", payload: { scope: "all" } } } }).offer).toBeNull();
    expect(derive({ assignments: { [FLAG]: { variant: "price-99", payload: { scope: "ALL" } } } }).offer).toBeNull();
    expect(derive({ assignments: { [FLAG]: { variant: "price-99", payload: null } } }).offer).toBeNull();
  });

  it("Amplitude failed: default price, no exposure, even if an old answer is somehow still around", () => {
    expect(derive({ status: "failed", assignments: { [FLAG]: ALL } })).toEqual({
      ready: true,
      offer: null,
      exposable: false,
    });
    expect(derive({ status: "failed", assignments: {} })).toEqual({ ready: true, offer: null, exposable: false });
  });
});
