import { describe, expect, it } from "vitest";
import type { Translation } from "@/components/blog/assessment-question/questions-list";
import { buildCards } from "./card-model";
import { courseLangFor, isBilingualCard, isHindiPage, isHindiPageByFlags } from "./hindi-page";

const t = (locale: string, question: string) => ({ locale, question, correct_option: "1" }) as Translation;
const q = (id: number, translations: Translation[]) =>
  ({ id, translations, chapter: { slug: "c" } }) as unknown as Parameters<typeof buildCards>[0][number];

describe("which /hi question pages are Hindi pages", () => {
  // Real section shapes: bilingual subjects, English-only and Hindi-only
  // language sections, Sanskrit-only.
  const bilingual = q(1, [t("en", "What is learning?"), t("hi", "अधिगम क्या है?")]);
  const englishOnly = q(2, [t("en", "Choose the noun.")]);
  const hindiOnly = q(3, [t("hi", "संज्ञा चुनिए।")]);
  const sanskritOnly = q(4, [t("sa", "संस्कृतम्")]);

  it("counts a question as bilingual only when it has separate English and Hindi versions", () => {
    const [b, e, h, s] = buildCards([bilingual, englishOnly, hindiOnly, sanskritOnly], "topic");
    expect([b, e, h, s].map(isBilingualCard)).toEqual([true, false, false, false]);
  });

  it("makes a page a Hindi page when at least half its questions are bilingual", () => {
    expect(isHindiPageByFlags([true, false])).toBe(true);
    expect(isHindiPageByFlags([true, false, false])).toBe(false);
    expect(isHindiPageByFlags([false, false])).toBe(false);
    expect(isHindiPageByFlags([])).toBe(false);
  });

  it("decides per page of 50 (year pages mix sections)", () => {
    const cards = buildCards(
      [...Array.from({ length: 50 }, (_, i) => q(100 + i, bilingual.translations)), ...Array.from({ length: 50 }, (_, i) => q(200 + i, englishOnly.translations))],
      "section",
    );
    expect(isHindiPage(cards, 1)).toBe(true);
    expect(isHindiPage(cards, 2)).toBe(false);
    expect(isHindiPage(cards, 3)).toBe(false);
  });
});

describe("course language shown on a question page", () => {
  it("follows the URL until the visitor picks one", () => {
    expect(courseLangFor("hi", "en", false)).toBe("hi");
    expect(courseLangFor("en", "en", false)).toBe("en");
  });

  it("keeps the visitor's own pick on either site", () => {
    expect(courseLangFor("hi", "en", true)).toBe("en");
    expect(courseLangFor("en", "hi", true)).toBe("hi");
  });

  it("treats a stored non-default language from before the flag existed as a pick", () => {
    expect(courseLangFor("en", "hi", false)).toBe("hi");
  });
});
