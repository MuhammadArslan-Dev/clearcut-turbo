import { describe, expect, it } from "vitest";
import { devForcedDownloadMode, resolveDownloadMode, resolveDownloadModeFor } from "./downloadMode";
import { isOtpRequiredBeforeDownload, OTP_REQUIRED_BEFORE_DOWNLOAD } from "@/config/downloadVerification";

describe("devForcedDownloadMode (local QA only)", () => {
  it("is ignored on any real host, before reading storage", () => {
    expect(devForcedDownloadMode("clearcutoff.in")).toBeNull();
    expect(devForcedDownloadMode("tools-xyz.pages.dev")).toBeNull();
  });
});

describe("resolveDownloadMode (phase 71 §12)", () => {
  it("both OFF → legacy", () => {
    expect(resolveDownloadMode({ hard_gate: false, soft_gate: false })).toEqual({ mode: "legacy", conflict: false });
  });

  it("hard_gate ON only → hard_gate", () => {
    expect(resolveDownloadMode({ hard_gate: true, soft_gate: false })).toEqual({ mode: "hard_gate", conflict: false });
  });

  it("soft_gate ON only → soft_gate", () => {
    expect(resolveDownloadMode({ hard_gate: false, soft_gate: true })).toEqual({ mode: "soft_gate", conflict: false });
  });

  it("both ON is invalid → legacy, reported as a conflict (never silently a gate)", () => {
    expect(resolveDownloadMode({ hard_gate: true, soft_gate: true })).toEqual({ mode: "legacy", conflict: true });
  });

  it("second_download_gate ON only → second_download_gate (CC-174)", () => {
    expect(resolveDownloadMode({ hard_gate: false, soft_gate: false, second_download_gate: true })).toEqual({ mode: "second_download_gate", conflict: false });
  });

  it("second_download_gate together with another gate is invalid → legacy + conflict", () => {
    expect(resolveDownloadMode({ hard_gate: true, soft_gate: false, second_download_gate: true })).toEqual({ mode: "legacy", conflict: true });
    expect(resolveDownloadMode({ hard_gate: false, soft_gate: true, second_download_gate: true })).toEqual({ mode: "legacy", conflict: true });
  });

  it("an answer cached before phase 121 (no second_download_gate key) behaves exactly as before", () => {
    expect(resolveDownloadMode({ hard_gate: false, soft_gate: true })).toEqual({ mode: "soft_gate", conflict: false });
  });

  it("unknown flags (fetch failed / disabled / timed out) → legacy, no conflict", () => {
    expect(resolveDownloadMode(null)).toEqual({ mode: "legacy", conflict: false });
    expect(resolveDownloadMode(undefined)).toEqual({ mode: "legacy", conflict: false });
  });
});

describe("resolveDownloadModeFor (phase 127: config/downloadVerification.ts)", () => {
  const off = { hard_gate: false, soft_gate: false, second_download_gate: false };

  it("HTET is always hard_gate, whatever the flags say", () => {
    const expected = { mode: "hard_gate", conflict: false, source: "config" };
    expect(resolveDownloadModeFor("htet", null)).toEqual(expected);
    expect(resolveDownloadModeFor("htet", undefined)).toEqual(expected);
    expect(resolveDownloadModeFor("htet", off)).toEqual(expected);
    expect(resolveDownloadModeFor("htet", { ...off, soft_gate: true })).toEqual(expected);
    expect(resolveDownloadModeFor("htet", { ...off, second_download_gate: true })).toEqual(expected);
    expect(resolveDownloadModeFor("htet", { hard_gate: true, soft_gate: true })).toEqual(expected);
  });

  it("HTET ignores the localhost dev override, and matches any case / spaces", () => {
    expect(resolveDownloadModeFor("htet", off, "legacy")).toEqual({ mode: "hard_gate", conflict: false, source: "config" });
    expect(resolveDownloadModeFor(" HTET ", off)).toEqual({ mode: "hard_gate", conflict: false, source: "config" });
  });

  it("every other exam resolves exactly as resolveDownloadMode did", () => {
    const cases = [null, undefined, off, { ...off, hard_gate: true }, { ...off, soft_gate: true }, { ...off, second_download_gate: true }, { hard_gate: true, soft_gate: true }];
    for (const exam of ["tnpsc", "dsssb", "ctet", "haryana-police", null, undefined]) {
      for (const flags of cases) {
        expect(resolveDownloadModeFor(exam, flags)).toEqual({ ...resolveDownloadMode(flags), source: "amplitude" });
      }
    }
  });

  it("the dev override still works for an exam that is not in the config", () => {
    expect(resolveDownloadModeFor("tnpsc", off, "soft_gate")).toEqual({ mode: "soft_gate", conflict: false, source: "dev_override" });
  });

  it("the config list is the switch: htet on, nothing else", () => {
    expect(OTP_REQUIRED_BEFORE_DOWNLOAD).toEqual(["htet"]);
    expect(isOtpRequiredBeforeDownload("htet")).toBe(true);
    expect(isOtpRequiredBeforeDownload("tnpsc")).toBe(false);
    expect(isOtpRequiredBeforeDownload("")).toBe(false);
    expect(isOtpRequiredBeforeDownload(null)).toBe(false);
  });
});
