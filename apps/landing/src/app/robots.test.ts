import { describe, expect, it } from "vitest";
import robots from "./robots";

// robots.txt for the whole clearcutoff.in origin (landing, /tools, /go).
describe("robots.txt", () => {
  const { rules, sitemap } = robots();
  const list = Array.isArray(rules) ? rules : [rules];
  const everyone = list.find((r) => r.userAgent === "*");
  const disallowed = [everyone?.disallow ?? []].flat();

  it("lets crawlers fetch /_next/static CSS and JS (pages must render with their styles)", () => {
    expect(disallowed.some((d) => "/_next/static/chunks/app.js".startsWith(d.replace(/\*.*$/, "")))).toBe(false);
    expect(everyone?.allow).toBe("/");
  });

  it("lists only real XML sitemaps (no /go/sitemap.xml, which is an HTML page)", () => {
    const sitemaps = [sitemap ?? []].flat();
    expect(sitemaps).not.toContain("https://clearcutoff.in/go/sitemap.xml");
    expect(sitemaps).toEqual(["https://clearcutoff.in/sitemap.xml", "https://clearcutoff.in/sitemap-tools.xml"]);
  });
});
