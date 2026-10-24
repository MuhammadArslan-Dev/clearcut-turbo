import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_LOCAL_OPT_IN_KEY, analyticsAllowedHere, isProductionAnalyticsHost } from "./analytics-hosts";
import { isMetaPixelHost } from "./meta-pixel-env";

function fakeWindow(hostname: string, stored: Record<string, string> = {}) {
  vi.stubGlobal("window", {
    location: { hostname },
    localStorage: { getItem: (k: string) => stored[k] ?? null },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("isProductionAnalyticsHost (CC-94 allowlist)", () => {
  it.each(["clearcutoff.in", "www.clearcutoff.in", "app.clearcutoff.in", "academy.clearcutoff.in", "APP.clearcutoff.in"])(
    "%s is a production host",
    (host) => expect(isProductionAnalyticsHost(host)).toBe(true),
  );
  it.each(["maintest.clearcutoff.in", "localhost", "127.0.0.1", "clearcut-tools.pages.dev", "clearcutoff.in.evil.com"])(
    "%s is not",
    (host) => expect(isProductionAnalyticsHost(host)).toBe(false),
  );
  it("is the same list as the Meta Pixel's", () => {
    for (const host of ["clearcutoff.in", "app.clearcutoff.in", "maintest.clearcutoff.in"]) {
      expect(isMetaPixelHost(host)).toBe(isProductionAnalyticsHost(host));
    }
  });
});

describe("analyticsAllowedHere", () => {
  it("is false on the server", () => {
    expect(analyticsAllowedHere()).toBe(false);
  });
  it("is true on a production host", () => {
    fakeWindow("app.clearcutoff.in");
    expect(analyticsAllowedHere()).toBe(true);
  });
  it("is false on localhost and maintest unless this browser opted in", () => {
    fakeWindow("localhost");
    expect(analyticsAllowedHere()).toBe(false);
    fakeWindow("maintest.clearcutoff.in");
    expect(analyticsAllowedHere()).toBe(false);
    fakeWindow("localhost", { [ANALYTICS_LOCAL_OPT_IN_KEY]: "1" });
    expect(analyticsAllowedHere()).toBe(true);
  });
  it("is false when storage throws", () => {
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(analyticsAllowedHere()).toBe(false);
  });
});
