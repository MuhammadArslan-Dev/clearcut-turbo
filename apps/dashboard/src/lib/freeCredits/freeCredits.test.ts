import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { normalizeFreeCredits, parseFreeCreditsLock } from "@/lib/api/freeCredits";
import { gapMarks, lockCopyVariant } from "./lockCopy";
import { parseCreditsCheckoutContext } from "./checkoutContext";

const apiErr = (status: number, body?: unknown) =>
  new ApiError({
    status,
    method: "POST",
    endpoint: "/v2/exam/create-exam",
    url: "http://x/api/v2/exam/create-exam",
    responseBody: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });

describe("normalizeFreeCredits", () => {
  it("is inactive for null, disabled and control (the dashboard stays exactly as before)", () => {
    expect(normalizeFreeCredits(null).active).toBe(false);
    expect(normalizeFreeCredits({ enabled: false, variant: "treatment" }).active).toBe(false);
    expect(normalizeFreeCredits({ enabled: true, variant: "control", limit: 5, used: 5, locked: true }).active).toBe(false);
    expect(normalizeFreeCredits({ enabled: true, variant: "control", locked: true }).locked).toBe(false);
  });
  it("reads a treatment payload and tolerates missing fields", () => {
    const c = normalizeFreeCredits({ enabled: true, variant: "treatment", limit: 5, used: 2 });
    expect(c).toMatchObject({ active: true, limit: 5, used: 2, remaining: 3, locked: false });
    expect(normalizeFreeCredits({ enabled: true, variant: "treatment", limit: 5, used: 9 }).remaining).toBe(0);
    expect(normalizeFreeCredits({ enabled: true, variant: "treatment", limit: "x" as never }).limit).toBe(0);
  });
});

describe("parseFreeCreditsLock", () => {
  const body = { error_code: "free_credits_exhausted", data: { credits_used: 5, credits_limit: 5, meter_gap: 12.4, test_type: "chapter" } };
  it("parses the 403 envelope", () => {
    expect(parseFreeCreditsLock(apiErr(403, body))).toMatchObject({ creditsUsed: 5, creditsLimit: 5, meterGap: 12.4, testType: "chapter" });
  });
  it("meter_gap null stays null (no meter)", () => {
    expect(parseFreeCreditsLock(apiErr(403, { error_code: "free_credits_exhausted", data: { meter_gap: null } }))?.meterGap).toBeNull();
  });
  it("ignores other errors, other 403 codes, bad JSON and non-ApiErrors", () => {
    expect(parseFreeCreditsLock(apiErr(403, { error_code: "renewal_required" }))).toBeNull();
    expect(parseFreeCreditsLock(apiErr(500, body))).toBeNull();
    expect(parseFreeCreditsLock(apiErr(403, "<html>"))).toBeNull();
    expect(parseFreeCreditsLock(apiErr(403))).toBeNull();
    expect(parseFreeCreditsLock(new Error("x"))).toBeNull();
  });
});

describe("lock copy variant", () => {
  it("gap > 0 / <= 0 / null", () => {
    expect(lockCopyVariant(12)).toBe("gap");
    expect(lockCopyVariant(0)).toBe("above");
    expect(lockCopyVariant(-3)).toBe("above");
    expect(lockCopyVariant(null)).toBe("none");
    expect(lockCopyVariant(undefined)).toBe("none");
    expect(lockCopyVariant(Number.NaN)).toBe("none");
  });
  it("never shows 0 marks under a gap message", () => {
    expect(gapMarks(0.2)).toBe(1);
    expect(gapMarks(12.1)).toBe(13);
  });
});

describe("parseCreditsCheckoutContext", () => {
  const from = (o: Record<string, string>) => (k: string) => o[k] ?? null;
  it("is empty for a normal checkout", () => {
    expect(parseCreditsCheckoutContext(from({}))).toEqual({});
  });
  it("reads valid values and drops junk", () => {
    expect(parseCreditsCheckoutContext(from({ test_type: "chapter", credits_used: "5", free_credits_variant: "treatment" }))).toEqual({
      test_type: "chapter",
      credits_used: 5,
      free_credits_variant: "treatment",
    });
    expect(parseCreditsCheckoutContext(from({ test_type: "<script>", credits_used: "-1", free_credits_variant: "x" }))).toEqual({});
    expect(parseCreditsCheckoutContext(from({ credits_used: "abc" }))).toEqual({});
  });
});
