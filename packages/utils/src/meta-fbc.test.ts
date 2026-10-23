import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFbc, fbcCookieDomain, persistFbcFromUrl } from "./meta-fbc";

function fakeBrowser(href: string, cookie = "") {
  const url = new URL(href);
  const doc = { cookie };
  vi.stubGlobal("window", { location: { search: url.search, hostname: url.hostname, protocol: url.protocol } });
  vi.stubGlobal("document", doc);
  return doc;
}

afterEach(() => vi.unstubAllGlobals());

describe("meta-fbc (CC-130)", () => {
  it("builds Meta's fbc format", () => {
    expect(buildFbc("AbC", 1700000000000)).toBe("fb.1.1700000000000.AbC");
  });

  it("shares the cookie across clearcutoff.in subdomains only", () => {
    expect(fbcCookieDomain("clearcutoff.in")).toBe(".clearcutoff.in");
    expect(fbcCookieDomain("app.clearcutoff.in")).toBe(".clearcutoff.in");
    expect(fbcCookieDomain("localhost")).toBeNull();
    expect(fbcCookieDomain("clearcutoff.in.evil.com")).toBeNull();
  });

  it("writes _fbc from fbclid on the shared domain", () => {
    const doc = fakeBrowser("https://clearcutoff.in/hi/go/exam/hptet-preparation?fbclid=IwAR123&utm_source=fb");
    persistFbcFromUrl();
    expect(doc.cookie).toMatch(/^_fbc=fb\.1\.\d+\.IwAR123; Path=\/; Max-Age=7776000; SameSite=Lax; Secure; Domain=\.clearcutoff\.in$/);
  });

  it("keeps the cookie for the same click and does nothing without fbclid", () => {
    const same = fakeBrowser("https://app.clearcutoff.in/?fbclid=X1", "_fbc=fb.1.1.X1");
    persistFbcFromUrl();
    expect(same.cookie).toBe("_fbc=fb.1.1.X1");
    const none = fakeBrowser("https://app.clearcutoff.in/payment/initiated", "");
    persistFbcFromUrl();
    expect(none.cookie).toBe("");
  });
});
