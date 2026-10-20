import { afterEach, describe, expect, it, vi } from "vitest";
import { localeAlternates } from "./locale-alternates";
import { generateLocaleMetadata } from "./generateLocaleMetadata";

const SITE = "https://academy.clearcutoff.in";

describe("localeAlternates", () => {
  it("untranslated /hi (question-bank pages): both locales canonicalize to English, no hreflang", () => {
    for (const locale of ["en", "hi"]) {
      expect(localeAlternates({ siteUrl: SITE, path: "/ctet/paper-1", locale, hiTranslated: false })).toEqual({
        canonical: `${SITE}/ctet/paper-1`,
      });
    }
  });

  it("translated /hi (blog posts with Hindi CMS copy): self-canonical plus an en/hi pair", () => {
    const path = "/ctet/blog/ctet-paper-1-vs-paper-2-which-should-you-choose";
    const languages = { en: `${SITE}${path}`, hi: `${SITE}/hi${path}`, "x-default": `${SITE}${path}` };
    expect(localeAlternates({ siteUrl: SITE, path, locale: "hi", hiTranslated: true })).toEqual({
      canonical: `${SITE}/hi${path}`,
      languages,
    });
    expect(localeAlternates({ siteUrl: SITE, path, locale: "en", hiTranslated: true })).toEqual({
      canonical: `${SITE}${path}`,
      languages,
    });
  });

  it("normalizes slashes (no double slash, no trailing slash on the home page)", () => {
    expect(localeAlternates({ siteUrl: `${SITE}/`, path: "ctet", locale: "en", hiTranslated: false }).canonical).toBe(`${SITE}/ctet`);
    expect(localeAlternates({ siteUrl: SITE, path: "", locale: "hi", hiTranslated: true }).languages?.hi).toBe(`${SITE}/hi`);
  });
});

describe("generateLocaleMetadata (home + question-bank pages)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the English canonical with no hreflang on /hi", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    const meta = generateLocaleMetadata({ locale: "hi", path: "/ctet/paper-1/subject", title: "t", description: "d" });
    expect(meta.alternates?.canonical).toBe(`${SITE}/ctet/paper-1/subject`);
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.openGraph?.url).toBe(`${SITE}/ctet/paper-1/subject`);
  });
});
