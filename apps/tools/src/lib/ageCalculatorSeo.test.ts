import { describe, expect, it } from "vitest";
import { ageCalculatorMetaTitle } from "./ageCalculatorSeo";

describe("ageCalculatorMetaTitle", () => {
  it("targets age limit and eligibility date, not cutoff", () => {
    const title = ageCalculatorMetaTitle("HTET", 2026);
    expect(title).toBe("HTET Age Calculator (2026) - Age Limit & Eligibility Date | Clear Cutoff");
    expect(title.replace("Clear Cutoff", "")).not.toMatch(/cut-?\s?off/i);
  });

  it("names the site once", () => {
    expect(ageCalculatorMetaTitle("SSC CHSL", 2026).match(/Clear Cutoff/g)).toHaveLength(1);
  });
});
