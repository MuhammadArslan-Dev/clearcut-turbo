import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { levelLabel, yearFromSlug, yearPageLabels } from "./year-title";

type Messages = { QuestionBankPage: { yearTitle: string; yearDescription: string } };
// Read as plain JSON (a TS import would resolve to the generated en.d.json.ts).
const messages = (locale: string): Messages =>
  JSON.parse(readFileSync(new URL(`../../../messages/${locale}.json`, import.meta.url), "utf8"));
const en = messages("en");
const hi = messages("hi");

/** The ICU-free part of next-intl formatting these templates use. */
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`);

const yearPageSeo = (m: Messages, exam: string, level: string, year: string) => {
  const labels = yearPageLabels(exam, level, year);
  return {
    title: fill(m.QuestionBankPage.yearTitle, labels),
    description: fill(m.QuestionBankPage.yearDescription, labels),
  };
};

describe("year page titles", () => {
  it("replaces the raw year slug with a readable, keyword-focused title", () => {
    expect(yearPageSeo(en, "ctet", "paper-1", "ctet-2024").title).toBe("CTET 2024 Paper 1 Previous Year Questions");
    expect(yearPageSeo(en, "htet", "level-1-prt", "htet-2015").title).toBe("HTET 2015 Level 1 PRT Previous Year Questions");
    expect(yearPageSeo(en, "htet", "level-3-pgt", "htet-2023").description).toBe(
      "HTET 2023 Level 3 PGT previous year questions with answers, free on Clear Cutoff.",
    );
  });

  it("has a Hindi title with the same parts", () => {
    expect(yearPageSeo(hi, "ctet", "paper-1", "ctet-2024").title).toBe("CTET 2024 Paper 1 पिछले वर्ष के प्रश्न");
  });

  it("never leaks the raw slug or the site name (the layout template adds it)", () => {
    for (const m of [en, hi]) {
      const { title } = yearPageSeo(m, "ctet", "paper-2", "ctet-2023");
      expect(title).not.toContain("ctet-2023");
      expect(title).not.toContain("Clear Cutoff");
    }
  });

  it("parses the year and level labels", () => {
    expect(yearFromSlug("ctet-2024")).toBe("2024");
    expect(yearFromSlug("ctet-dec")).toBeNull();
    expect(levelLabel("level-2-tgt")).toBe("Level 2 TGT");
    expect(levelLabel("paper-1")).toBe("Paper 1");
  });

  it("falls back to a readable label when a slug has no 4-digit year", () => {
    expect(yearPageSeo(en, "ctet", "paper-1", "ctet-special").title).toBe("CTET Ctet Special Paper 1 Previous Year Questions");
  });
});
