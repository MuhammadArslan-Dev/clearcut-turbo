import { describe, expect, it } from "vitest";
import { isUsableDailyTestId } from "./testId";

describe("isUsableDailyTestId", () => {
  it("accepts a real uuid", () => {
    expect(isUsableDailyTestId("8207f866-7ec8-45b6-bcf0-1eb3319015f0")).toBe(true);
  });

  it("rejects the values a stringified null/undefined leaves in a URL (CC-190)", () => {
    for (const bad of ["null", "undefined", "NULL", " Null ", "NaN", "false", "", "   "]) {
      expect(isUsableDailyTestId(bad), JSON.stringify(bad)).toBe(false);
    }
  });

  it("rejects non-strings", () => {
    for (const bad of [null, undefined, 0, 12, {}, []]) {
      expect(isUsableDailyTestId(bad)).toBe(false);
    }
  });
});
