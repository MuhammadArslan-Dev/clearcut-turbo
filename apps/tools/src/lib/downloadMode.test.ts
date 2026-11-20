import { describe, expect, it } from "vitest";
import { devForcedDownloadMode, resolveDownloadMode } from "./downloadMode";

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
