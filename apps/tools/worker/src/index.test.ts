import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { publicLocation, withoutTrailingSlash } from "./index";

const PAGES = "https://clearcut-tools.pages.dev";
const env = { PAGES_ORIGIN: PAGES };
const SITE = "https://clearcutoff.in";

// What Cloudflare Pages does for a static export with trailingSlash: false:
// "/resizer/" 308s to a Location on its own origin, without the slash.
function fakePages(upstream: string): Response {
  const { pathname, search } = new URL(upstream);
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return new Response(null, { status: 308, headers: { Location: pathname.slice(0, -1) + search } });
  }
  return new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } });
}

const call = (path: string) => worker.fetch(new Request(`${SITE}${path}`), env as never);

describe("trailing slashes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["/tools/", "/tools"],
    ["/tools/resizer/", "/tools/resizer"],
    ["/tools/resizer/htet/", "/tools/resizer/htet"],
    ["/tools/resizer/?x=1", "/tools/resizer?x=1"],
    ["/hi/tools/resizer/", "/hi/tools/resizer"],
    ["/tools/age-eligibility-calculator/", "/tools/age-eligibility-calculator"],
  ])("%s -> 301 %s, staying inside /tools", async (from, to) => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => fakePages(u)));
    const res = await call(from);
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(`${SITE}${to}`);
  });

  it("sends the Hindi/Marathi tools roots (no index page of their own) to /tools in one hop", async () => {
    for (const from of ["/hi/tools", "/hi/tools/", "/mr/tools", "/mr/tools/"]) {
      const res = await call(from);
      expect(res.status, from).toBe(302);
      expect(res.headers.get("location"), from).toBe(`${SITE}/tools`);
    }
  });

  it("still serves the /tools index and proxies normal pages", async () => {
    expect((await call("/tools")).status).toBe(200);
    const fetchMock = vi.fn(async (u: string) => fakePages(u));
    vi.stubGlobal("fetch", fetchMock);
    const res = await call("/tools/resizer/htet");
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(`${PAGES}/resizer/htet`);
  });

  it("leaves URLs outside /tools alone", () => {
    expect(withoutTrailingSlash("/")).toBeNull();
    expect(withoutTrailingSlash("/tools")).toBeNull();
    expect(withoutTrailingSlash("/tools/")).toBe("/tools");
  });
});

describe("publicLocation (upstream redirects)", () => {
  it("adds back the public prefix the Pages origin doesn't know about", () => {
    expect(publicLocation("/resizer", "/tools/resizer/", PAGES)).toBe("/tools/resizer");
    expect(publicLocation(`${PAGES}/resizer/htet`, "/tools/resizer/htet/", PAGES)).toBe("/tools/resizer/htet");
    expect(publicLocation("/hi/resizer", "/hi/tools/resizer/", PAGES)).toBe("/hi/tools/resizer");
    expect(publicLocation("/mr/resizer?x=1", "/mr/tools/resizer/", PAGES)).toBe("/mr/tools/resizer?x=1");
  });

  it("does not touch redirects to other sites", () => {
    expect(publicLocation("https://example.com/a", "/tools/x", PAGES)).toBe("https://example.com/a");
    expect(publicLocation("//cdn.example.com/a", "/tools/x", PAGES)).toBe("//cdn.example.com/a");
  });
});
