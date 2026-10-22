import { afterEach, describe, expect, it, vi } from "vitest";
import { META_PIXEL_LOCAL_OPT_IN_KEY, isLocalDevHost, metaPixelId, metaPixelMode } from "./meta-pixel-env";

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

describe("metaPixelMode / metaPixelId", () => {
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
