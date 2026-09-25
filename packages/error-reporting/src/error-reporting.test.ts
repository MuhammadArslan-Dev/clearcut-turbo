import { describe, expect, it } from "vitest";
import { redactSearch, redactUrl, scrubSensitiveData } from "./redact";
import { classifyNotFound, routeShape } from "./not-found";

describe("redact", () => {
  it("redacts sensitive params in absolute and relative URLs", () => {
    expect(redactUrl("https://a.in/dashboard?token=366|SECRET&lang=hi")).not.toContain("SECRET");
    expect(redactUrl("https://a.in/dashboard?token=366|SECRET&lang=hi")).toContain("lang=hi");
    expect(redactUrl("/x?otp=123456&y=1#h")).toBe("/x?otp=%5Bredacted%5D&y=1#h");
  });

  it("leaves clean URLs untouched", () => {
    expect(redactUrl("https://a.in/x?y=1")).toBe("https://a.in/x?y=1");
    expect(redactUrl("https://a.in/x")).toBe("https://a.in/x");
    expect(redactUrl(undefined)).toBeUndefined();
  });

  it("keeps the caller's search shape", () => {
    expect(redactSearch("?token=S&y=2")).toBe("?token=%5Bredacted%5D&y=2");
    expect(redactSearch("token=S&y=2")).toBe("token=%5Bredacted%5D&y=2");
    expect(redactSearch("")).toBe("");
  });

  it("scrubs a whole event", () => {
    const ev = scrubSensitiveData({
      request: {
        url: "https://a.in/d?token=SECRET",
        query_string: "code=SECRET&a=1",
        headers: { cookie: "x", authorization: "Bearer y", referer: "https://a.in/?password=SECRET" },
      },
      extra: { url: "https://a.in/x?token=SECRET", search: "?token=SECRET" },
      contexts: { not_found: { url: "https://a.in/x?otp=SECRET" } },
      breadcrumbs: [{ data: { to: "/d?token=SECRET", from: "/" } }],
    });
    expect(JSON.stringify(ev)).not.toContain("SECRET");
    expect(ev.request.headers.cookie).toBeUndefined();
    expect(ev.request.headers.authorization).toBeUndefined();
  });
});

const base = { locales: ["en", "hi", "mr"], defaultLocale: "en" };

describe("classifyNotFound", () => {
  it("ignores scanner paths", () => {
    const r = classifyNotFound({ ...base, env: { href: "https://a.in/wp-login.php", referrer: "https://a.in/", loadedUrl: null } });
    expect(r).toEqual({ action: "ignore", reason: "scanner" });
  });

  it("ignores typed/bookmarked hard loads (no referrer)", () => {
    const r = classifyNotFound({ ...base, env: { href: "https://a.in/nope", referrer: "", loadedUrl: "https://a.in/nope" } });
    expect(r).toEqual({ action: "ignore", reason: "no-referrer" });
  });

  it("captures in-app navigation as a warning, grouped by route shape", () => {
    const r = classifyNotFound({
      ...base,
      env: { href: "https://a.in/hi/exam/123/broken?token=SECRET", referrer: "", loadedUrl: "https://a.in/hi/" },
    });
    if (r.action !== "capture") throw new Error("expected capture");
    expect(r.level).toBe("warning");
    expect(r.tags).toMatchObject({ not_found_source: "in-app-navigation", locale: "hi" });
    expect(r.fingerprint).toEqual(["not-found", "/hi/exam/:id/broken", "in-app-navigation"]);
    expect(r.context.queryParams).toEqual(["token"]);
    expect(JSON.stringify(r)).not.toContain("SECRET");
  });

  it("captures same-site referrer as warning with the referrer path only", () => {
    const r = classifyNotFound({
      ...base,
      env: { href: "https://a.in/x", referrer: "https://a.in/from?token=SECRET", loadedUrl: "https://a.in/x" },
    });
    if (r.action !== "capture") throw new Error("expected capture");
    expect(r.level).toBe("warning");
    expect(r.context.referrer).toBe("/from");
    expect(JSON.stringify(r)).not.toContain("SECRET");
  });

  it("captures external referrer as info with hostname only", () => {
    const r = classifyNotFound({
      ...base,
      env: { href: "https://a.in/x", referrer: "https://www.google.com/search?q=secret", loadedUrl: "https://a.in/x" },
    });
    if (r.action !== "capture") throw new Error("expected capture");
    expect(r.level).toBe("info");
    expect(r.context.referrer).toBe("www.google.com");
  });

  it("defaults the locale and strips tools prefix from segments", () => {
    const r = classifyNotFound({
      ...base,
      ignorePrefixes: ["tools"],
      env: { href: "https://a.in/hi/tools/resizer/x", referrer: "https://a.in/hi/tools/resizer", loadedUrl: "https://a.in/hi/tools/resizer/x" },
    });
    if (r.action !== "capture") throw new Error("expected capture");
    expect(r.tags.locale).toBe("hi");
    expect(r.context.segments).toEqual(["hi", "resizer", "x"]);
  });
});

describe("routeShape", () => {
  it("normalises ids and uuids", () => {
    expect(routeShape("/a/12/b")).toBe("/a/:id/b");
    expect(routeShape("/a/6a80359d-902f-4c1e-9c8a-0123456789ab")).toBe("/a/:uuid");
    expect(routeShape("/a/6a80359d902fc")).toBe("/a/:hash");
  });
});

describe("classifyNotFound locale detection", () => {
  it("finds the locale in both /hi/tools/x (public) and /tools/hi/x (dev) shapes", () => {
    for (const path of ["/hi/tools/resizer/x", "/tools/hi/resizer/x"]) {
      const r = classifyNotFound({
        ...base,
        ignorePrefixes: ["tools"],
        env: { href: `https://a.in${path}`, referrer: "https://a.in/y", loadedUrl: `https://a.in${path}` },
      });
      if (r.action !== "capture") throw new Error("expected capture");
      expect(r.tags.locale).toBe("hi");
    }
  });
});

describe("scrubSensitiveData contexts", () => {
  it("redacts Next's captureRequestError request_path", () => {
    const ev = scrubSensitiveData({ contexts: { nextjs: { request_path: "/x?token=SECRET&a=1", router_kind: "App Router" } } });
    expect(ev.contexts.nextjs.request_path).toBe("/x?token=%5Bredacted%5D&a=1");
    expect(ev.contexts.nextjs.router_kind).toBe("App Router");
  });
});
