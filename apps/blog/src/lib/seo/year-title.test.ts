import { describe, expect, it } from "vitest";
import { levelLabel, yearFromSlug, yearPageSeo } from "./year-title";

describe("year page titles", () => {
  it("replaces the raw year slug with a readable, keyword-focused title", () => {
    expect(yearPageSeo("ctet", "paper-1", "ctet-2024").title).toBe("CTET 2024 Paper 1 Previous Year Questions");
    expect(yearPageSeo("htet", "level-1-prt", "htet-2015").title).toBe("HTET 2015 Level 1 PRT Previous Year Questions");
    expect(yearPageSeo("htet", "level-3-pgt", "htet-2023").description).toBe(
      "HTET 2023 Level 3 PGT previous year questions with answers, free on Clear Cutoff.",
    );
  });

  it("never leaks the raw slug or the site name (the layout template adds it)", () => {
    const { title } = yearPageSeo("ctet", "paper-2", "ctet-2023");
    expect(title).not.toContain("ctet-2023");
    expect(title).not.toContain("Clear Cutoff");
  });

  it("parses the year and level labels", () => {
    expect(yearFromSlug("ctet-2024")).toBe("2024");
    expect(yearFromSlug("ctet-dec")).toBeNull();
    expect(levelLabel("level-2-tgt")).toBe("Level 2 TGT");
    expect(levelLabel("paper-1")).toBe("Paper 1");
  });

  it("falls back to a readable label when a slug has no 4-digit year", () => {
    expect(yearPageSeo("ctet", "paper-1", "ctet-special").title).toBe("CTET Ctet Special Paper 1 Previous Year Questions");
  });
});
