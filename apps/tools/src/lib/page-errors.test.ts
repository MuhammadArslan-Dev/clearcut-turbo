import { describe, expect, it } from "vitest";
import { toolsTransactionName } from "./page-errors";

describe("toolsTransactionName (CC-144)", () => {
  it("names exam pages by route, in every locale", () => {
    expect(toolsTransactionName("/tools/resizer/ctet")).toBe("/tools/resizer/:slug");
    expect(toolsTransactionName("/hi/tools/resizer/ugc-net/")).toBe("/:locale/tools/resizer/:slug");
    expect(toolsTransactionName("/mr/tools/age-eligibility-calculator/htet")).toBe("/:locale/tools/age-eligibility-calculator/:examSlug");
  });

  it("keeps fixed pages as they are", () => {
    expect(toolsTransactionName("/tools/resizer")).toBe("/tools/resizer");
    expect(toolsTransactionName("/tools/age-eligibility-calculator/all")).toBe("/tools/age-eligibility-calculator/all");
    expect(toolsTransactionName("/tools/syllabus-tracker")).toBe("/tools/syllabus-tracker");
    expect(toolsTransactionName("/")).toBe("/");
  });
});
