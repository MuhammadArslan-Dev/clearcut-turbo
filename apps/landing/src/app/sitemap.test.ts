import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

const entries = sitemap();
const byUrl = (url: string) => entries.find((e) => e.url === url);

describe("landing sitemap", () => {
  it("gives English-only pages no hi/mr alternates", () => {
    for (const path of ["/contact-us", "/privacy-policy", "/terms-and-conditions", "/refund-policy"]) {
      const entry = byUrl(`https://clearcutoff.in${path}`);
      expect(entry, path).toBeDefined();
      expect(entry?.alternates, path).toBeUndefined();
    }
  });

  it("lists the FAQ with its Hindi version only (the CMS has no Marathi FAQ)", () => {
    expect(byUrl("https://clearcutoff.in/faq")?.alternates?.languages).toEqual({
      en: "https://clearcutoff.in/faq",
      hi: "https://clearcutoff.in/hi/faq",
      "x-default": "https://clearcutoff.in/faq",
    });
  });

  it("keeps all three versions for translated pages, with no trailing slash on locale roots", () => {
    expect(byUrl("https://clearcutoff.in/")?.alternates?.languages).toEqual({
      en: "https://clearcutoff.in",
      hi: "https://clearcutoff.in/hi",
      mr: "https://clearcutoff.in/mr",
      "x-default": "https://clearcutoff.in",
    });
    expect(Object.keys(byUrl("https://clearcutoff.in/teaching/htet")?.alternates?.languages ?? {})).toEqual([
      "en",
      "hi",
      "mr",
      "x-default",
    ]);
  });

  // The host root is the same URL with or without "/", so compare normalized.
  it("every hreflang set includes the entry's own URL as its English version and x-default", () => {
    const same = (a: string) => new URL(a).href;
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string> | undefined;
      if (!languages) continue;
      expect(same(languages.en), entry.url).toBe(same(entry.url));
      expect(same(languages["x-default"]), entry.url).toBe(same(entry.url));
    }
  });

  it("lists exam pages at their final /exam/<code>-preparation URLs, not the redirecting -2026 ones", () => {
    const examUrls = entries.map((e) => e.url).filter((u) => u.includes("/exam/"));
    expect(examUrls).toEqual([
      "https://clearcutoff.in/exam/htet-preparation",
      "https://clearcutoff.in/exam/reet-preparation",
      "https://clearcutoff.in/exam/uptet-preparation",
      "https://clearcutoff.in/exam/hptet-preparation",
    ]);
  });
});
