import { describe, expect, it } from "vitest";
import { cmsPageLanguages, generateSeoMetadata, hreflangAlternates } from "./metadata";

describe("hreflangAlternates", () => {
  it("lists every translated locale (itself included) plus x-default = English", () => {
    expect(hreflangAlternates("/teaching/htet")).toEqual({
      en: "https://clearcutoff.in/teaching/htet",
      hi: "https://clearcutoff.in/hi/teaching/htet",
      mr: "https://clearcutoff.in/mr/teaching/htet",
      "x-default": "https://clearcutoff.in/teaching/htet",
    });
  });

  it("leaves out locales the page is not translated into", () => {
    expect(hreflangAlternates("/faq", ["en", "hi"])).toEqual({
      en: "https://clearcutoff.in/faq",
      hi: "https://clearcutoff.in/hi/faq",
      "x-default": "https://clearcutoff.in/faq",
    });
  });

  it("returns nothing for an English-only page", () => {
    expect(hreflangAlternates("/privacy-policy", ["en"])).toBeUndefined();
  });

  it("never emits a trailing slash for locale roots", () => {
    expect(hreflangAlternates("/")?.hi).toBe("https://clearcutoff.in/hi");
  });
});

describe("generateSeoMetadata with `languages`", () => {
  const base = { title: "Clear Cutoff vs Testbook", description: "d", url: "/compare/testbook" };

  it("an English-only CMS page canonicalizes /hi and /mr to English and declares no hreflang", () => {
    for (const locale of ["en", "hi", "mr"] as const) {
      const meta = generateSeoMetadata({ ...base, locale, languages: cmsPageLanguages(false) });
      expect(meta.alternates?.canonical).toBe("https://clearcutoff.in/compare/testbook");
      expect(meta.alternates?.languages).toBeUndefined();
    }
  });

  it("a CMS page with Hindi copy is self-canonical on /hi, while /mr (no Marathi in the CMS) stays English", () => {
    const languages = cmsPageLanguages(true);
    expect(generateSeoMetadata({ ...base, locale: "hi", languages }).alternates?.canonical).toBe(
      "https://clearcutoff.in/hi/compare/testbook",
    );
    expect(generateSeoMetadata({ ...base, locale: "mr", languages }).alternates?.canonical).toBe(
      "https://clearcutoff.in/compare/testbook",
    );
    expect(generateSeoMetadata({ ...base, locale: "hi", languages }).alternates?.languages).toEqual({
      en: "https://clearcutoff.in/compare/testbook",
      hi: "https://clearcutoff.in/hi/compare/testbook",
      "x-default": "https://clearcutoff.in/compare/testbook",
    });
  });
});
