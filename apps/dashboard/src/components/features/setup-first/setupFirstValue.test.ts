// pnpm --filter dashboard test
import { describe, expect, it } from "vitest";
import { SETUP_FIRST_CONTROL, SETUP_FIRST_FLAG, SETUP_FIRST_VARIANT, isSetupFirst, needsFirstSetup } from "./setupFirstValue";

describe("isSetupFirst (phase 122)", () => {
  it("control keeps today's dashboard, only the explicit variant turns the new flow on", () => {
    expect(isSetupFirst(SETUP_FIRST_CONTROL)).toBe(false);
    expect(isSetupFirst(SETUP_FIRST_VARIANT)).toBe(true);
  });

  it("every failure path is control", () => {
    for (const odd of [undefined, null, "", " ", "SETUP_FIRST", "setup-first", "true", 1, true, {}, []]) {
      expect(isSetupFirst(odd)).toBe(false);
    }
  });

  it("uses the agreed flag name", () => {
    expect(SETUP_FIRST_FLAG).toBe("dash_all_setup_first_202611");
    expect(SETUP_FIRST_FLAG).toMatch(/^[a-z]+_(all|[a-z0-9]+)_[a-z0-9_]+_\d{6}$/);
  });
});

describe("needsFirstSetup (phase 122)", () => {
  it("a new learner whose only exam has no level yet is eligible", () => {
    expect(needsFirstSetup([{ stage_id: null }])).toBe(true);
    expect(needsFirstSetup([{}])).toBe(true);
  });

  it("several exams, none with a level yet: still eligible", () => {
    expect(needsFirstSetup([{ stage_id: null }, { stage_id: null }])).toBe(true);
  });

  it("once any enrolment has a level the learner keeps today's flow, also for a later exam without a level", () => {
    expect(needsFirstSetup([{ stage_id: 12 }])).toBe(false);
    expect(needsFirstSetup([{ stage_id: 12 }, { stage_id: null }])).toBe(false);
    expect(needsFirstSetup([{ stage_id: null }, { stage_id: "7" }])).toBe(false);
    expect(needsFirstSetup([{ stage_id: 0 }])).toBe(false);
  });

  it("no data / no enrolment is not eligible (no exposure while loading)", () => {
    expect(needsFirstSetup(undefined)).toBe(false);
    expect(needsFirstSetup(null)).toBe(false);
    expect(needsFirstSetup([])).toBe(false);
    expect(needsFirstSetup([null])).toBe(false);
  });
});
