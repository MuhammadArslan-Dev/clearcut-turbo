import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { readFileSync } from "node:fs";
import { questionBankSeo, type PageCopy } from "@/components/question-bank/pages/page-copy";
import { DESCRIPTION_MAX, SITE_SUFFIX, TITLE_MAX, cutAtWord, levelShort, seoTitle, subjectShort, titleText } from "./seo-text";

const messages = (locale: string) => JSON.parse(readFileSync(new URL(`../../../messages/${locale}.json`, import.meta.url), "utf-8"));
const en = messages("en");
const hi = messages("hi");

const shown = (title: ReturnType<typeof seoTitle>) => (typeof title === "string" ? title + SITE_SUFFIX : title.absolute);
const copy = (locale: "en" | "hi") =>
  createTranslator({ locale, messages: locale === "en" ? en : hi, namespace: "QuestionBankPage" }) as unknown as PageCopy;

describe("seoTitle", () => {
  it("keeps the site name when the title fits with it", () => {
    expect(seoTitle(["CTET 2024 Paper 1 Question Paper with Answers"])).toBe("CTET 2024 Paper 1 Question Paper with Answers");
  });
  it("drops the site name, then falls back to shorter variants", () => {
    expect(seoTitle(["x".repeat(50)])).toEqual({ absolute: "x".repeat(50) });
    expect(seoTitle(["a ".repeat(40), "Short title"])).toBe("Short title");
    // A fitting keyword-rich variant beats a shorter one that keeps the brand.
    expect(seoTitle(["x".repeat(50), "short"])).toEqual({ absolute: "x".repeat(50) });
  });
  it("cuts the last variant at a word when nothing fits", () => {
    const t = seoTitle(["word ".repeat(30)]);
    expect(titleText(t).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(titleText(t).endsWith("…")).toBe(true);
  });
});

describe("cutAtWord", () => {
  it("leaves short text alone and never splits a word", () => {
    expect(cutAtWord("short", 10)).toBe("short");
    expect(cutAtWord("alpha beta gamma delta", 15)).toBe("alpha beta…");
  });
});

describe("short names", () => {
  it("maps subjects and levels people search with", () => {
    expect(subjectShort("child-development-pedagogy")).toBe("CDP");
    expect(subjectShort("environmental-studies")).toBe("EVS");
    expect(subjectShort("history")).toBeNull();
    expect(levelShort("level-2-tgt")).toBe("TGT");
    expect(levelShort("paper-1")).toBe("Paper 1");
  });
});

describe("questionBankSeo", () => {
  const longChapter = "Human And Economic Geography Resources And Activities";
  const cases = [
    ["chapter", { exam: "HTET", levelSlug: "level-1-prt", subjectSlug: "geography", subject: "Geography", chapter: longChapter }],
    ["chapter", { exam: "CTET", levelSlug: "paper-1", subjectSlug: "child-development-pedagogy", subject: "Child Development Pedagogy", chapter: "Development Theories" }],
    ["subject", { exam: "CTET", levelSlug: "paper-1", subjectSlug: "child-development-pedagogy", subject: "Child Development Pedagogy" }],
    ["subject", { exam: "HTET", levelSlug: "level-2-tgt", subjectSlug: "social-studies", subject: "सामाजिक विज्ञान" }],
    ["year", { exam: "CTET", levelSlug: "paper-2", year: "2024" }],
    ["year", { exam: "HTET", levelSlug: "level-3-pgt", year: "2019" }],
  ] as const;

  it.each(["en", "hi"] as const)("stays within the limits on every page (%s)", (locale) => {
    for (const [kind, labels] of cases) {
      for (const page of [1, 2, 68]) {
        const { title, description } = questionBankSeo(copy(locale), kind, labels, page);
        expect(shown(title).length, shown(title)).toBeLessThanOrEqual(TITLE_MAX);
        expect(description.length, description).toBeLessThanOrEqual(DESCRIPTION_MAX);
        if (page > 1) expect(titleText(title)).toContain(String(page));
      }
    }
  });

  it("uses the researched keywords", () => {
    expect(questionBankSeo(copy("en"), "year", { exam: "CTET", levelSlug: "paper-1", year: "2024" }, 1).title).toBe(
      "CTET 2024 Paper 1 Question Paper with Answers",
    );
    expect(
      questionBankSeo(copy("en"), "subject", { exam: "CTET", levelSlug: "paper-1", subjectSlug: "child-development-pedagogy", subject: "Child Development Pedagogy" }, 1).title,
    ).toBe("CTET Paper 1 CDP Questions with Answers");
    expect(
      titleText(questionBankSeo(copy("en"), "chapter", { exam: "HTET", levelSlug: "level-1-prt", subjectSlug: "child-development-pedagogy", subject: "Child Development Pedagogy", chapter: "Development Theories" }, 3).title),
    ).toBe("Development Theories MCQ – HTET PRT CDP – Page 3");
    expect(questionBankSeo(copy("en"), "year", { exam: "CTET", levelSlug: "paper-1", year: "2024" }, 1).description).toContain("(PYQ)");
  });
});
