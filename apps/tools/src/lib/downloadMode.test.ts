import { describe, expect, it } from "vitest";
import { resolveDownloadMode } from "./downloadMode";

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

  it("unknown flags (fetch failed / disabled / timed out) → legacy, no conflict", () => {
    expect(resolveDownloadMode(null)).toEqual({ mode: "legacy", conflict: false });
    expect(resolveDownloadMode(undefined)).toEqual({ mode: "legacy", conflict: false });
  });
});
