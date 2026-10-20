import { describe, expect, it } from "vitest";
import { examStructureEntries, yearSlug } from "./exam-sitemap-entries";
import { urlsetXml } from "./xml";
import { fixtureIndex } from "@/lib/seo/exam-index.fixture";
import { isWellFormed } from "./xml-well-formed";

const ORIGIN = "https://academy.clearcutoff.in";
const locs = (entries: { loc: string }[]) => entries.map((e) => e.loc);
const pages = {
  subjects: [{ loc: `${ORIGIN}/ctet/paper-1/subject/child-development-pedagogy`, lastmod: "2026-01-01T00:00:00.000Z" }],
  years: [{ loc: `${ORIGIN}/ctet/paper-1/year/ctet-2024` }],
};

describe("yearSlug", () => {
  it("matches the year listing's link format", () => {
    expect(yearSlug("CTET_2024")).toBe("ctet-2024");
  });
});

describe("examStructureEntries", () => {
  const entries = examStructureEntries(
    ORIGIN,
    fixtureIndex,
    [{ slug: "ctet-exam-pattern", lastmod: "2026-09-01T10:00:00.000Z" }],
    pages,
  );
  const urls = locs(entries);

  it("contains only absolute HTTPS URLs with no duplicates", () => {
    expect(urls.every((u) => u.startsWith(`${ORIGIN}/`))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("lists the listing pages in English only (their /hi copy is the same English content)", () => {
    for (const path of ["/ctet", "/ctet/paper-1", "/ctet/paper-1/year", "/ctet/paper-1/subject"]) {
      expect(urls).toContain(`${ORIGIN}${path}`);
      expect(urls).not.toContain(`${ORIGIN}/hi${path}`);
    }
  });

  it("includes the pre-built subject and year question pages as given", () => {
    expect(entries).toContainEqual(pages.subjects[0]);
    expect(entries).toContainEqual(pages.years[0]);
  });

  it("lists the blog listing and a post in Hindi only when the CMS has Hindi copy", () => {
    const withHindi = locs(
      examStructureEntries(
        ORIGIN,
        fixtureIndex,
        [
          { slug: "translated", hindi: true },
          { slug: "english-only", hindi: false },
        ],
        { subjects: [], years: [] },
      ),
    );
    expect(withHindi).toContain(`${ORIGIN}/hi/ctet/blog`);
    expect(withHindi).toContain(`${ORIGIN}/hi/ctet/blog/translated`);
    expect(withHindi).toContain(`${ORIGIN}/ctet/blog/english-only`);
    expect(withHindi).not.toContain(`${ORIGIN}/hi/ctet/blog/english-only`);
    expect(urls.some((u) => u.startsWith(`${ORIGIN}/hi/`))).toBe(false);
  });

  it("skips the subject listing of a level with no chapters or no questions", () => {
    expect(urls).toContain(`${ORIGIN}/ctet/paper-1/subject`);
    expect(urls).not.toContain(`${ORIGIN}/ctet/paper-3/subject`);
    expect(urls).not.toContain(`${ORIGIN}/ctet/paper-4/subject`);
    expect(urls).toContain(`${ORIGIN}/ctet/paper-4`);
  });

  it("gives listing pages no lastmod and never lists question URLs", () => {
    expect(urls.some((u) => u.includes("/question/"))).toBe(false);
    const withLastmod = locs(entries.filter((e) => e.lastmod));
    expect(withLastmod.sort()).toEqual(
      [`${ORIGIN}/ctet/blog/ctet-exam-pattern`, `${ORIGIN}/ctet/paper-1/subject/child-development-pedagogy`].sort(),
    );
  });

  it("renders valid XML", () => {
    expect(isWellFormed(urlsetXml(entries))).toBe(true);
  });
});
