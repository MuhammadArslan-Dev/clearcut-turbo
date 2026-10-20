import { describe, expect, it } from "vitest";
import {
  getLocalizedEntityName,
  normalizeCourseLang,
  parseTranslationBlob,
  selectTranslation,
} from "./question-translation";
import type { Translation } from "@/components/blog/assessment-question/questions-list";

function trans(overrides: Partial<Translation>): Translation {
  return {
    id: 1,
    question_new_id: 1,
    locale: "en",
    ai_slug: "slug",
    question: "q",
    question_image: null,
    option_1_text: null,
    option_1_image: null,
    option_2_text: null,
    option_2_image: null,
    option_3_text: null,
    option_3_image: null,
    option_4_text: null,
    option_4_image: null,
    correct_option: "1",
    explanation: "exp",
    ...overrides,
  };
}

describe("selectTranslation", () => {
  it("returns undefined for empty/missing translations", () => {
    expect(selectTranslation(undefined, "en")).toBeUndefined();
    expect(selectTranslation([], "hi")).toBeUndefined();
  });

  it("returns the only translation when there is exactly one, regardless of courseLang", () => {
    const only = trans({ locale: "en" });
    expect(selectTranslation([only], "hi")).toBe(only);
  });

  it("matches courseLang when multiple translations exist", () => {
    const en = trans({ locale: "en", question: "english" });
    const hi = trans({ locale: "hi", question: "hindi" });
    expect(selectTranslation([en, hi], "hi")).toBe(hi);
    expect(selectTranslation([en, hi], "en")).toBe(en);
  });

  it("falls back to the first translation when courseLang has no match", () => {
    const en = trans({ locale: "en" });
    const mr = trans({ locale: "mr" });
    expect(selectTranslation([en, mr], "hi")).toBe(en);
  });
});

describe("normalizeCourseLang", () => {
  it("normalizes 'en' case-insensitively", () => {
    expect(normalizeCourseLang("en")).toBe("en");
    expect(normalizeCourseLang("EN")).toBe("en");
  });

  it("normalizes anything else to 'hi'", () => {
    expect(normalizeCourseLang("hi")).toBe("hi");
    expect(normalizeCourseLang("mr")).toBe("hi");
    expect(normalizeCourseLang("")).toBe("hi");
  });
});

describe("parseTranslationBlob", () => {
  it("returns undefined for empty/missing input", () => {
    expect(parseTranslationBlob(null)).toBeUndefined();
    expect(parseTranslationBlob(undefined)).toBeUndefined();
    expect(parseTranslationBlob("")).toBeUndefined();
  });

  it("parses a JSON string (the e_sections `description` shape)", () => {
    const parsed = parseTranslationBlob('{"en":{"name":"English"},"hi":{"name":"Hindi"}}');
    expect(parsed).toEqual({ en: { name: "English" }, hi: { name: "Hindi" } });
  });

  it("passes through an already-parsed object unchanged (the chapter/topic `translations` shape)", () => {
    const blob = { en: { name: "English" } };
    expect(parseTranslationBlob(blob)).toBe(blob);
  });

  it("returns undefined for malformed JSON rather than throwing", () => {
    expect(parseTranslationBlob("{not json")).toBeUndefined();
  });
});

describe("getLocalizedEntityName", () => {
  const blob = { en: { name: "English Name" }, hi: { name: "हिंदी नाम" } };

  it("returns the exact locale's translated name when present", () => {
    expect(getLocalizedEntityName({ name: "Fallback" }, blob, "en")).toBe("English Name");
    expect(getLocalizedEntityName({ name: "Fallback" }, blob, "hi")).toBe("हिंदी नाम");
  });

  it("falls back to the untranslated name when there is no translation blob", () => {
    expect(getLocalizedEntityName({ name: "Fallback" }, null, "en")).toBe("Fallback");
    expect(getLocalizedEntityName({ name: "Fallback" }, undefined, "hi")).toBe("Fallback");
  });

  it("returns null when both the entity and its translation blob are missing (the real shape of a never-loaded relation)", () => {
    expect(getLocalizedEntityName(null, null, "en")).toBeNull();
  });

  it("falls back to the untranslated name when the blob has no entry for either locale", () => {
    expect(getLocalizedEntityName({ name: "Fallback" }, { fr: { name: "French" } }, "en")).toBe("Fallback");
  });

  it("accepts a raw JSON string blob (e_sections' `description` shape) directly", () => {
    const stringBlob = JSON.stringify(blob);
    expect(getLocalizedEntityName({ name: "Fallback" }, stringBlob, "hi")).toBe("हिंदी नाम");
  });

  it("falls back to Hindi (not the untranslated name) when the exact non-hi locale is missing", () => {
    const hiOnly = { hi: { name: "हिंदी नाम" } };
    expect(getLocalizedEntityName({ name: "Fallback" }, hiOnly, "en")).toBe("हिंदी नाम");
  });
});
