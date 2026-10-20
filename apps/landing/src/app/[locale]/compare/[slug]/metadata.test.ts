import { beforeEach, describe, expect, it, vi } from "vitest";

const cms = vi.hoisted(() => ({ hasHindi: false }));

vi.mock("@/lib/api/cms", () => ({
  getComparisonBySlug: async (slug: string) => ({
    slug,
    competitorName: "Testbook",
    hero: { title: "Why TET Aspirants Choose Clear Cutoff", description: "d" },
  }),
  getComparisonSlugs: async () => ["testbook"],
  getMarketingProof: async () => null,
  hasHindiTranslation: async () => cms.hasHindi,
  mediaUrl: () => undefined,
}));

const { generateMetadata } = await import("./page");
const meta = (locale: string) => generateMetadata({ params: Promise.resolve({ locale, slug: "testbook" }) });

describe("/compare/[slug] canonical and hreflang", () => {
  beforeEach(() => {
    cms.hasHindi = false;
  });

  it("without Hindi CMS copy: every locale canonicalizes to the English page and no hreflang is declared", async () => {
    for (const locale of ["en", "hi", "mr"]) {
      const m = await meta(locale);
      expect(m.alternates?.canonical, locale).toBe("https://clearcutoff.in/compare/testbook");
      expect(m.alternates?.languages, locale).toBeUndefined();
    }
  });

  it("with Hindi CMS copy: /hi is self-canonical and paired with English; /mr stays on the English canonical", async () => {
    cms.hasHindi = true;
    expect((await meta("hi")).alternates?.canonical).toBe("https://clearcutoff.in/hi/compare/testbook");
    expect((await meta("mr")).alternates?.canonical).toBe("https://clearcutoff.in/compare/testbook");
    expect((await meta("en")).alternates?.languages).toEqual({
      en: "https://clearcutoff.in/compare/testbook",
      hi: "https://clearcutoff.in/hi/compare/testbook",
      "x-default": "https://clearcutoff.in/compare/testbook",
    });
  });
});
