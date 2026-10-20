import { describe, expect, it } from "vitest";
import { HTET_PAGE_KEYS, HTET_PAGES } from "./htetInfo";
import { htetPageMetadata } from "@/lib/seo/htet-pages";
import sitemap from "@/app/sitemap";

const LOCALES = ["en", "hi", "mr"] as const;

describe("HTET information pages: content", () => {
  it("states the bulletin's qualifying marks exactly (60% = 90, 55% = 82 out of 150), the same in every locale", () => {
    for (const locale of LOCALES) {
      const rows = HTET_PAGES["cutoff-marks"][locale].table?.rows ?? [];
      expect(rows.map((r) => [r[1], r[2]])).toEqual([
        ["60%", "90"],
        ["55%", "82"],
        ["60%", "90"],
      ]);
    }
  });

  it("never states an age range for HTET (the bulletin prescribes none)", () => {
    for (const locale of LOCALES) {
      const text = JSON.stringify(HTET_PAGES["age-limit"][locale]);
      expect(text, locale).not.toMatch(/\b(18|21|38|40|42)\s*(-|–|to|से|ते)\s*\d{2}\b/);
    }
  });

  it("has a unique title and H1 per page and locale", () => {
    const titles = new Set<string>();
    const h1s = new Set<string>();
    for (const key of HTET_PAGE_KEYS) {
      for (const locale of LOCALES) {
        titles.add(HTET_PAGES[key][locale].title);
        h1s.add(HTET_PAGES[key][locale].h1);
      }
    }
    expect(titles.size).toBe(HTET_PAGE_KEYS.length * LOCALES.length);
    expect(h1s.size).toBe(HTET_PAGE_KEYS.length * LOCALES.length);
  });

  it("titles target the searched phrase and name the site once", () => {
    expect(HTET_PAGES["age-limit"].en.title).toMatch(/^HTET Age Limit/);
    expect(HTET_PAGES["cutoff-marks"].en.title).toMatch(/^HTET Cutoff Marks/);
    for (const key of HTET_PAGE_KEYS) {
      for (const locale of LOCALES) {
        expect(HTET_PAGES[key][locale].title.match(/Clear Cutoff/g)).toHaveLength(1);
      }
    }
  });
});

describe("HTET information pages: metadata and sitemap", () => {
  it("each locale is self-canonical with en/hi/mr hreflang, and the title isn't doubled by the layout template", () => {
    const meta = htetPageMetadata("cutoff-marks", "hi");
    expect(meta.alternates?.canonical).toBe("https://clearcutoff.in/hi/htet/cutoff-marks");
    expect(Object.keys(meta.alternates?.languages ?? {})).toEqual(["en", "hi", "mr", "x-default"]);
    expect(meta.title).toEqual({ absolute: HTET_PAGES["cutoff-marks"].hi.title });
    expect(htetPageMetadata("age-limit", "en").alternates?.canonical).toBe("https://clearcutoff.in/htet/age-limit");
  });

  it("both pages are in the sitemap with all three language versions", () => {
    for (const key of HTET_PAGE_KEYS) {
      const entry = sitemap().find((e) => e.url === `https://clearcutoff.in/htet/${key}`);
      expect(entry, key).toBeDefined();
      expect(Object.keys(entry?.alternates?.languages ?? {})).toEqual(["en", "hi", "mr", "x-default"]);
    }
  });
});
