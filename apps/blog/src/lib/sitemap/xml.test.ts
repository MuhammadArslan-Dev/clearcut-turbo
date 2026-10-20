import { describe, expect, it } from "vitest";
import { MAX_SITEMAP_URLS, escapeXml, sitemapIndexXml, sitemapUnavailable, urlsetXml, withLocales } from "./xml";
import { isWellFormed } from "./xml-well-formed";

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe("a&amp;b&lt;c&gt;&quot;d&apos;");
  });
});

describe("urlsetXml", () => {
  it("is well-formed, namespaced, de-duplicated and only emits genuine lastmod", () => {
    const xml = urlsetXml([
      { loc: "https://example.com/a?x=1&y=2" },
      { loc: "https://example.com/a?x=1&y=2" },
      { loc: "https://example.com/b", lastmod: "2026-10-01T00:00:00.000Z" },
    ]);
    expect(isWellFormed(xml)).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain("<loc>https://example.com/a?x=1&amp;y=2</loc>");
  });

  it("refuses to exceed the 50,000 URL protocol limit instead of truncating", () => {
    const many = Array.from({ length: MAX_SITEMAP_URLS + 1 }, (_, i) => ({ loc: `https://example.com/${i}` }));
    expect(() => urlsetXml(many)).toThrow(/limit/);
  });
});

describe("sitemapIndexXml", () => {
  it("is well-formed and has no fabricated lastmod", () => {
    const xml = sitemapIndexXml(["https://example.com/sitemap.xml", "https://example.com/sitemaps/ctet.xml"]);
    expect(isWellFormed(xml)).toBe(true);
    expect(xml.match(/<sitemap>/g)).toHaveLength(2);
    expect(xml).not.toContain("<lastmod>");
  });
});

describe("withLocales", () => {
  it("emits the en URL followed by its /hi twin, home without a trailing path", () => {
    expect(withLocales("https://example.com", ["/", "/ctet"])).toEqual([
      { loc: "https://example.com", lastmod: undefined },
      { loc: "https://example.com/hi", lastmod: undefined },
      { loc: "https://example.com/ctet", lastmod: undefined },
      { loc: "https://example.com/hi/ctet", lastmod: undefined },
    ]);
  });
});

describe("sitemapUnavailable", () => {
  it("answers a retryable 503, never an empty 200", () => {
    const res = sitemapUnavailable();
    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
