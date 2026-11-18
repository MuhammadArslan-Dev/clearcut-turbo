// pnpm --filter dashboard test
import { describe, expect, it } from "vitest";
import { PRACTICE_NO_SKIP, PRACTICE_SKIP_CONTROL, PRACTICE_SKIP_FLAG, allowSkipFromValue } from "./practiceSkipValue";

describe("allowSkipFromValue (phase 119)", () => {
  it("the control keeps Skip", () => {
    expect(allowSkipFromValue(PRACTICE_SKIP_CONTROL)).toBe(true);
    expect(allowSkipFromValue("skip")).toBe(true);
  });

  it("only the explicit no_skip removes it", () => {
    expect(allowSkipFromValue(PRACTICE_NO_SKIP)).toBe(false);
    expect(allowSkipFromValue("no_skip")).toBe(false);
  });

  it("every failure path keeps Skip: flag off/missing (null/undefined), empty, wrong case or type, an unknown variant", () => {
    for (const odd of [undefined, null, "", " ", "NO_SKIP", "No_Skip", "no-skip", "noskip", "false", 0, 1, true, false, {}, []]) {
      expect(allowSkipFromValue(odd)).toBe(true);
    }
  });

  it("uses the agreed flag name (naming: <surface>_<exam|all>_<what>_<yyyymm>)", () => {
    expect(PRACTICE_SKIP_FLAG).toBe("dash_all_practice_skip_202611");
    expect(PRACTICE_SKIP_FLAG).toMatch(/^[a-z]+_(all|[a-z0-9]+)_[a-z0-9_]+_\d{6}$/);
  });
});
