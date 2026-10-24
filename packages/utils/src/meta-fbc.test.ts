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

  // A cookie jar: reads give "name=value; …", each write sets one cookie.
  function jarBrowser(href: string, initial: Record<string, string> = {}) {
    const url = new URL(href);
    const jar = new Map(Object.entries(initial));
    const writes: string[] = [];
    vi.stubGlobal("window", { location: { search: url.search, hostname: url.hostname, protocol: url.protocol } });
    vi.stubGlobal("document", {
      get cookie() {
        return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
      },
      set cookie(line: string) {
        writes.push(line);
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        jar.set(pair.slice(0, eq), decodeURIComponent(pair.slice(eq + 1)));
      },
    });
    return { jar, writes };
  }

  it("keeps the in-app browser's exact _fbc and _fbp after a Chrome hand-off (CC-122)", () => {
    const fbc = "fb.1.1729700000000.IwAR123";
    const fbp = "fb.1.1729600000000.987654321";
    const { jar, writes } = jarBrowser(`https://clearcutoff.in/start?fbclid=IwAR123&fbc=${fbc}&fbp=${fbp}&src=iab_escape`);
    persistFbcFromUrl();
    expect(jar.get("_fbc")).toBe(fbc);
    expect(jar.get("_fbp")).toBe(fbp);
    expect(writes.every((w) => w.includes("Domain=.clearcutoff.in"))).toBe(true);
  });

  it("never replaces this browser's own _fbp", () => {
    const { jar } = jarBrowser("https://clearcutoff.in/start?fbp=fb.1.1729600000000.111", { _fbp: "fb.1.1700000000000.222" });
    persistFbcFromUrl();
    expect(jar.get("_fbp")).toBe("fb.1.1700000000000.222");
  });

  it("ignores a malformed fbc and falls back to fbclid", () => {
    const { jar } = jarBrowser("https://clearcutoff.in/start?fbc=junk&fbclid=IwAR9");
    persistFbcFromUrl();
    expect(jar.get("_fbc")).toMatch(/^fb\.1\.\d+\.IwAR9$/);
  });

  it("does not rewrite _fbc when it already has the handed-off value", () => {
    const fbc = "fb.1.1729700000000.IwAR123";
    const { writes } = jarBrowser(`https://clearcutoff.in/start?fbc=${fbc}`, { _fbc: fbc });
    persistFbcFromUrl();
    expect(writes).toEqual([]);
  });
});
