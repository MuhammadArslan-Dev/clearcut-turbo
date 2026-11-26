import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { normalizeFreeCredits, parseFreeCreditsLock } from "@/lib/api/freeCredits";
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

import { FREE_CREDITS_INACTIVE, type FreeCredits } from "@/lib/api/freeCredits";
import { creditDots, infoBarKind, isTestHeld, learnRowKind, startNoteKind, testTypeOfTab } from "./ui";

const active = (remaining: number, extra: Partial<FreeCredits> = {}): FreeCredits => ({
  ...FREE_CREDITS_INACTIVE,
  active: true,
  variant: "treatment",
  limit: 5,
  used: 5 - remaining,
  remaining,
  ...extra,
});

describe("info bar thresholds", () => {
  it("shows only from 3 left down to 1, bolder on the last", () => {
    expect([5, 4].map((r) => infoBarKind(active(r)))).toEqual(["none", "none"]);
    expect([3, 2].map((r) => infoBarKind(active(r)))).toEqual(["left", "left"]);
    expect(infoBarKind(active(1))).toBe("last");
    expect(infoBarKind(active(0))).toBe("none");
  });
  it("never shows for inactive / paid / control users", () => {
    expect(infoBarKind(FREE_CREDITS_INACTIVE)).toBe("none");
  });
});

describe("dots", () => {
  it("one dot per credit, filled = left", () => {
    expect(creditDots(5, 3)).toEqual([true, true, true, false, false]);
    expect(creditDots(5, 0)).toEqual([false, false, false, false, false]);
    expect(creditDots(5, 9)).toEqual([true, true, true, true, true]);
  });
  it("is bounded for bad input", () => {
    expect(creditDots(500, 1)).toHaveLength(10);
    expect(creditDots(-1, 1)).toEqual([]);
    expect(creditDots(Number.NaN, 1)).toEqual([]);
  });
});

describe("start note", () => {
  it("uses / last / none (held test, nothing left, inactive)", () => {
    expect(startNoteKind(active(3), false)).toBe("uses");
    expect(startNoteKind(active(1), false)).toBe("last");
    expect(startNoteKind(active(3), true)).toBe("none");
    expect(startNoteKind(active(0), false)).toBe("none");
    expect(startNoteKind(FREE_CREDITS_INACTIVE, false)).toBe("none");
  });
  it("matches held tests by type and ref (string compare)", () => {
    const c = active(3, { heldTests: [{ testType: "sectional", testRef: "12" }] });
    expect(isTestHeld(c, "sectional", 12)).toBe(true);
    expect(isTestHeld(c, "chapter", 12)).toBe(false);
    expect(isTestHeld(c, "sectional", undefined)).toBe(false);
  });
});

describe("learn row + tab", () => {
  it("row kind", () => {
    expect(learnRowKind(active(5))).toBe("left");
    expect(learnRowKind(active(1))).toBe("last");
    expect(learnRowKind(active(0))).toBe("used");
    expect(learnRowKind(FREE_CREDITS_INACTIVE)).toBe("none");
  });
  it("test type of the list tab", () => {
    expect(testTypeOfTab("chapter-tests")).toBe("chapter");
    expect(testTypeOfTab("sectional-tests")).toBe("sectional");
    expect(testTypeOfTab("full-length-papers")).toBe("full-length");
    expect(testTypeOfTab(null)).toBe("unknown");
  });
});

import { finishedView } from "./ui";

describe("finished modal view", () => {
  it("used: all dots filled; last / left: as many filled as credits left", () => {
    expect(finishedView(5, 0)).toEqual({ kind: "used", limit: 5, remaining: 0, filled: 5 });
    expect(finishedView(5, 1)).toEqual({ kind: "last", limit: 5, remaining: 1, filled: 1 });
    expect(finishedView(5, 3)).toEqual({ kind: "left", limit: 5, remaining: 3, filled: 3 });
  });
  it("clamps bad input", () => {
    expect(finishedView(5, 9).remaining).toBe(5);
    expect(finishedView(5, -2).kind).toBe("used");
    expect(finishedView(0, 0).filled).toBe(0);
  });
});
