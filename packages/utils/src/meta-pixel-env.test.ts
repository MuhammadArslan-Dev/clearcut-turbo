import { afterEach, describe, expect, it, vi } from "vitest";
import { META_PIXEL_LOCAL_OPT_IN_KEY, isLocalDevHost, isMetaPixelHost, metaPixelId, metaPixelMode } from "./meta-pixel-env";

function fakeWindow(hostname: string, stored: Record<string, string> = {}) {
  vi.stubGlobal("window", {
    location: { hostname },
    localStorage: { getItem: (k: string) => stored[k] ?? null },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("isLocalDevHost", () => {
  it.each(["localhost", "app.localhost", "127.0.0.1", "[::1]", "0.0.0.0", "192.168.1.20", "10.0.0.5", "172.20.1.1"])(
    "%s is local",
    (host) => expect(isLocalDevHost(host)).toBe(true),
  );
  it.each(["clearcutoff.in", "www.clearcutoff.in", "app.clearcutoff.in", "academy.clearcutoff.in", "maintest.clearcutoff.in", "172.32.0.1"])(
    "%s is not local",
    (host) => expect(isLocalDevHost(host)).toBe(false),
  );
});

describe("isMetaPixelHost (CC-115 allowlist)", () => {
  it.each(["clearcutoff.in", "www.clearcutoff.in", "app.clearcutoff.in", "academy.clearcutoff.in", "APP.clearcutoff.in"])(
    "%s loads the pixel",
    (host) => expect(isMetaPixelHost(host)).toBe(true),
  );
  it.each(["maintest.clearcutoff.in", "localhost", "clearcut-tools.pages.dev", "dashboard-git-x.vercel.app", "clearcutoff.in.evil.com"])(
    "%s does not",
    (host) => expect(isMetaPixelHost(host)).toBe(false),
  );
});

describe("metaPixelMode / metaPixelId", () => {
  it("is off on a test subdomain unless opted in", () => {
    fakeWindow("maintest.clearcutoff.in");
    expect(metaPixelMode()).toBe("off");
    fakeWindow("maintest.clearcutoff.in", { [META_PIXEL_LOCAL_OPT_IN_KEY]: "1" });
    expect(metaPixelMode()).toBe("local-test");
  });

  it("loads the live pixel on real sites", () => {
    fakeWindow("app.clearcutoff.in");
    expect(metaPixelMode()).toBe("live");
    expect(metaPixelId("LIVE", "TEST")).toBe("LIVE");
  });

  it("is off on localhost by default", () => {
    fakeWindow("localhost");
    expect(metaPixelMode()).toBe("off");
    expect(metaPixelId("LIVE", "TEST")).toBeNull();
  });

  it("loads the test pixel on localhost after opting in", () => {
    fakeWindow("localhost", { [META_PIXEL_LOCAL_OPT_IN_KEY]: "1" });
    expect(metaPixelMode()).toBe("local-test");
    expect(metaPixelId("LIVE", "TEST")).toBe("TEST");
    expect(metaPixelId("LIVE")).toBe("LIVE");
  });

  it("is off on the server", () => {
    expect(metaPixelMode()).toBe("off");
  });
});
