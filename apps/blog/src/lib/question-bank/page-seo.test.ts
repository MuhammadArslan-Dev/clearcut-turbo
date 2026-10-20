import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo/locale-alternates";
import { metadataPage, pageSeo } from "./pagination";

// The question-bank pages build their canonical as localeAlternates(path +
// pageSeo(page).pathSuffix). These pin the agreed rules: every page is its own
// canonical, page 1 has no /page/1, and /hi (English questions, Hindi UI)
// canonicalizes to the English URL of the same page with no hreflang.
const site = "https://clearcutoff.in";
const path = "/ctet/paper-1/subject/child-development-pedagogy";
const canonicalFor = (page: number, locale: string) =>
  localeAlternates({ siteUrl: site, path: `${path}${pageSeo(page).pathSuffix}`, locale, hiTranslated: false });

describe("question-bank page SEO", () => {
  it("page 1 canonical is the base URL", () => {
    expect(canonicalFor(1, "en")).toEqual({ canonical: `${site}${path}` });
  });

  it("page N is self-canonical", () => {
    expect(canonicalFor(3, "en")).toEqual({ canonical: `${site}${path}/page/3` });
  });

  it("/hi page N canonicalizes to English page N with no hreflang", () => {
    const alt = canonicalFor(3, "hi");
    expect(alt.canonical).toBe(`${site}${path}/page/3`);
    expect(alt.languages).toBeUndefined();
  });

  it("adds page suffixes only from page 2", () => {
    expect(pageSeo(1)).toEqual({ titleSuffix: "", descriptionSuffix: "", pathSuffix: "" });
    expect(pageSeo(undefined).pathSuffix).toBe("");
    expect(pageSeo(4)).toEqual({ titleSuffix: " - Page 4", descriptionSuffix: " Page 4.", pathSuffix: "/page/4" });
  });

  it("middleware sends no hreflang Link header that would contradict the canonical", () => {
    expect(routing.alternateLinks).toBe(false);
  });

  it("metadata never describes a malformed or /page/1 URL as a page", () => {
    expect(metadataPage(undefined)).toBe(1);
    expect(metadataPage("1")).toBe(1);
    expect(metadataPage("02")).toBe(1);
    expect(metadataPage("7")).toBe(7);
  });
});
