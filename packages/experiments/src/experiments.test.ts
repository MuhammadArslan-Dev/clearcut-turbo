// pnpm --filter @clearcut/experiments test
// The REAL @growthbook/growthbook 2.1.0 SDK runs here; only the HTTP answer of the features endpoint is simulated.
import { afterEach, describe, expect, it, vi } from "vitest";
import { setPolyfills } from "@growthbook/growthbook";
import { EXP_ID_COOKIE, EXP_ID_STORAGE_KEY, buildCookie, cookieDomainFor, generateExpId, getOrCreateExpId, isValidExpId, readCookie, type ExpIdEnv } from "./id";
import { cleanAttributes, examFromPathname, localeFromPathname, platformFromUserAgent, utmFromSearch } from "./attributes";
import { EXPOSURE_EVENT, createTrackingCallback } from "./exposure";
import { DEFAULT_API_HOST, INIT_TIMEOUT_MS, createExperimentsClient, resolveConfig } from "./client";

// ---------- id
function fakeEnv(over: Partial<ExpIdEnv> & { cookie?: string; store?: Record<string, string> } = {}) {
  let cookie = over.cookie ?? "";
  const store: Record<string, string> = { ...(over.store ?? {}) };
  const env: ExpIdEnv & { lastSetCookie?: string } = {
    getCookie: () => cookie,
    setCookie: (value) => {
      cookie = `${value.split(";")[0]}; ${cookie}`; // newest first, like the browser's jar for the same name
      env.lastSetCookie = value;
    },
    storage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) },
    hostname: over.hostname ?? "clearcutoff.in",
    secure: true,
    ...over,
  };
  return { env, store, get cookie() { return cookie; } };
}

describe("sticky experiment id", () => {
  it("generates ids that pass validation, and rejects junk", () => {
    expect(isValidExpId(generateExpId())).toBe(true);
    for (const bad of ["", "short", "a b c d e f g h i j k l m n", "x".repeat(65), null, undefined, 42, "has;semicolon-1234567890"]) expect(isValidExpId(bad)).toBe(false);
  });

  it("first visit: creates one id and writes the cookie AND localStorage", () => {
    const t = fakeEnv();
    const id = getOrCreateExpId(t.env);
    expect(isValidExpId(id)).toBe(true);
    expect(t.store[EXP_ID_STORAGE_KEY]).toBe(id);
    expect(readCookie(EXP_ID_COOKIE, t.cookie)).toBe(id);
  });

  it("is STICKY: a second call (same jar) returns the same id and writes nothing new", () => {
    const t = fakeEnv();
    const a = getOrCreateExpId(t.env);
    const writes = t.env.lastSetCookie;
    const b = getOrCreateExpId(t.env);
    expect(b).toBe(a);
    expect(t.env.lastSetCookie).toBe(writes);
  });

  it("same id before and after login: login changes nothing about the cookie jar", () => {
    const t = fakeEnv({ hostname: "app.clearcutoff.in" });
    const id = "abcdef0123456789abcdef0123456789";
    const landing = fakeEnv({ cookie: `${EXP_ID_COOKIE}=${id}`, hostname: "clearcutoff.in" });
    expect(getOrCreateExpId(landing.env)).toBe(id);
    const dash = fakeEnv({ cookie: `${EXP_ID_COOKIE}=${id}; other=1`, hostname: "app.clearcutoff.in" });
    expect(getOrCreateExpId(dash.env)).toBe(id);
    expect(t.env.hostname).toBe("app.clearcutoff.in");
  });

  it("cookie cleared but localStorage kept: the id is restored into the cookie", () => {
    const id = "abcdef0123456789abcdef0123456789";
    const t = fakeEnv({ store: { [EXP_ID_STORAGE_KEY]: id } });
    expect(getOrCreateExpId(t.env)).toBe(id);
    expect(readCookie(EXP_ID_COOKIE, t.cookie)).toBe(id);
  });

  it("localStorage cleared but cookie kept: the id is mirrored back", () => {
    const id = "abcdef0123456789abcdef0123456789";
    const t = fakeEnv({ cookie: `${EXP_ID_COOKIE}=${id}` });
    expect(getOrCreateExpId(t.env)).toBe(id);
    expect(t.store[EXP_ID_STORAGE_KEY]).toBe(id);
  });

  it("a tampered cookie is ignored (never used as a bucketing id)", () => {
    const t = fakeEnv({ cookie: `${EXP_ID_COOKIE}=<script>alert(1)</script>` });
    const id = getOrCreateExpId(t.env);
    expect(isValidExpId(id)).toBe(true);
    expect(id).not.toContain("<");
  });

  it("cookies AND storage blocked (private mode): still returns an id, never throws", () => {
    const env: ExpIdEnv = {
      getCookie: () => "",
      setCookie: () => {
        throw new Error("blocked");
      },
      storage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
      hostname: "clearcutoff.in",
      secure: true,
    };
    expect(isValidExpId(getOrCreateExpId(env))).toBe(true);
  });

  it("cookie domain is shared only on the production hosts", () => {
    for (const h of ["clearcutoff.in", "www.clearcutoff.in", "app.clearcutoff.in", "academy.clearcutoff.in", "CLEARCUTOFF.IN"]) expect(cookieDomainFor(h)).toBe(".clearcutoff.in");
    for (const h of ["localhost", "192.168.1.5", "evil-clearcutoff.in", "clearcutoff.in.evil.com", "xyz.vercel.app"]) expect(cookieDomainFor(h)).toBeUndefined();
  });

  it("cookie string: path, 1 year, SameSite=Lax, optional Domain/Secure", () => {
    const c = buildCookie({ value: "abc", domain: ".clearcutoff.in", secure: true });
    expect(c).toBe("cc_exp_id=abc; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.clearcutoff.in; Secure");
    expect(buildCookie({ value: "abc" })).toBe("cc_exp_id=abc; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("readCookie handles spaces, other cookies and bad encoding", () => {
    expect(readCookie("a", "x=1; a=2; y=3")).toBe("2");
    expect(readCookie("a", "x=1")).toBeNull();
    expect(readCookie("a", "a=%E0%A4%A")).toBeNull();
  });
});

// ---------- attributes
describe("attributes", () => {
  it("drops empty values, keeps false and 0", () => {
    expect(cleanAttributes({ id: "x", a: undefined, b: null, c: "", d: false, e: 0, f: { nested: 1 } })).toEqual({ id: "x", d: false, e: 0 });
  });
  it("utm parameters are read and clipped", () => {
    expect(utmFromSearch("?utm_source=facebook&utm_campaign=htet_nov")).toEqual({ utm_source: "facebook", utm_campaign: "htet_nov" });
    expect(utmFromSearch("?x=1")).toEqual({ utm_source: undefined, utm_campaign: undefined });
    expect(utmFromSearch(`?utm_source=${"a".repeat(300)}`).utm_source).toHaveLength(100);
  });
  it("exam slug comes only from /exam/<slug> pages", () => {
    expect(examFromPathname("/exam/htet")).toBe("htet");
    expect(examFromPathname("/hi/exam/CTET/")).toBe("ctet");
    expect(examFromPathname("/exam/up-tet/syllabus")).toBe("up-tet");
    for (const p of ["/", "/htet", "/exam", "/exams/htet", "/blog/exam/htet", "/exam/" + "a".repeat(41)]) expect(examFromPathname(p)).toBeUndefined();
  });
  it("locale and platform", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/hi/exam/htet")).toBe("hi");
    expect(localeFromPathname("/mr")).toBe("mr");
    expect(localeFromPathname("/exam/hindi")).toBe("en");
    expect(platformFromUserAgent("Mozilla/5.0 (Linux; Android 13)")).toBe("mobile");
    expect(platformFromUserAgent("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
  });
});

// ---------- exposure
describe("exposure", () => {
  it("one $exposure + one exp_<key> user property per variant, once", () => {
    const track = vi.fn();
    const setUserProperty = vi.fn();
    const cb = createTrackingCallback({ track, setUserProperty });
    cb({ key: "lp_all_cta_copy_202611" }, { key: "1" });
    cb({ key: "lp_all_cta_copy_202611" }, { key: "1" });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(EXPOSURE_EVENT, { flag_key: "lp_all_cta_copy_202611", variant: "1" });
    expect(setUserProperty).toHaveBeenCalledWith("exp_lp_all_cta_copy_202611", "1");
  });
  it("analytics failing never throws into the evaluation", () => {
    const cb = createTrackingCallback({
      track: () => {
        throw new Error("amplitude down");
      },
      setUserProperty: () => undefined,
    });
    expect(() => cb({ key: "k" }, { key: "0" })).not.toThrow();
  });
});

// ---------- config + client with the REAL SDK
describe("config", () => {
  it("off without a client key or off a production host; on otherwise with defaults", () => {
    expect(resolveConfig({ clientKey: "", allowedHere: true })).toBeNull();
    expect(resolveConfig({ clientKey: undefined, allowedHere: true })).toBeNull();
    expect(resolveConfig({ clientKey: "sdk-x", allowedHere: false })).toBeNull();
    expect(resolveConfig({ clientKey: " sdk-x ", allowedHere: true })).toEqual({ clientKey: "sdk-x", apiHost: DEFAULT_API_HOST, timeoutMs: INIT_TIMEOUT_MS });
    expect(resolveConfig({ clientKey: "sdk-x", apiHost: "https://h.example", allowedHere: true })?.apiHost).toBe("https://h.example");
  });
});

const FLAG = "lp_all_cta_copy_202611";
const payload = {
  status: 200,
  dateUpdated: "2026-11-17T00:00:00.000Z",
  experiments: [],
  features: {
    [FLAG]: {
      defaultValue: "Start for free",
      rules: [{ key: FLAG, variations: ["Start for free", "Try it for free"], weights: [0.5, 0.5], coverage: 1, hashAttribute: "id", hashVersion: 2 }],
    },
  },
};

let keyCounter = 0;
const nextKey = () => `sdk-test-${++keyCounter}-${Math.random().toString(36).slice(2)}`;
// The SDK captures `fetch` at import time, so route it through globalThis.fetch (documented `setPolyfills`) to be able to stub it.
setPolyfills({ fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) });
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const stubFetch = (impl: () => Promise<Response>) => {
  globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
};
const okResponse = () => Promise.resolve(new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } }));

async function valueFor(id: string) {
  const track = vi.fn();
  const setUserProperty = vi.fn();
  const client = createExperimentsClient({ config: { clientKey: nextKey(), apiHost: "https://cdn.test", timeoutMs: 500 }, attributes: { id }, sink: { track, setUserProperty } });
  await client.ready;
  return { value: client.getValue(FLAG, "Start for free"), track, setUserProperty };
}

describe("client with the real GrowthBook SDK", () => {
  it("assigns both variants across visitors, deterministically per id, and reports an exposure for each", async () => {
    stubFetch(okResponse);
    const seen = new Map<string, string>();
    for (let i = 0; i < 60 && seen.size < 2; i++) {
      const id = `visitor-${i}-${"x".repeat(12)}`;
      const r = await valueFor(id);
      seen.set(r.value, id);
      expect(r.track).toHaveBeenCalledTimes(1);
      expect(r.track.mock.calls[0][0]).toBe("$exposure");
      expect(r.track.mock.calls[0][1].flag_key).toBe(FLAG);
    }
    expect([...seen.keys()].sort()).toEqual(["Start for free", "Try it for free"]);
    // sticky: the same id gets the same copy again (new client, new instance)
    for (const [value, id] of seen) expect((await valueFor(id)).value).toBe(value);
  });

  it("CDN returns 500 -> control, NO exposure, no throw", async () => {
    stubFetch(() => Promise.resolve(new Response("boom", { status: 500 })));
    const r = await valueFor("visitor-error-123456789");
    expect(r.value).toBe("Start for free");
    expect(r.track).not.toHaveBeenCalled();
  });

  it("network failure -> control, NO exposure, ready still resolves", async () => {
    stubFetch(() => Promise.reject(new TypeError("fetch failed")));
    const r = await valueFor("visitor-offline-123456789");
    expect(r.value).toBe("Start for free");
    expect(r.track).not.toHaveBeenCalled();
  });

  it("CDN slower than the 500 ms timeout -> control after the timeout, no exposure, no swap later", async () => {
    stubFetch(() => new Promise((resolve) => setTimeout(() => resolve(new Response(JSON.stringify(payload), { status: 200 })), 1500)));
    const t0 = Date.now();
    const track = vi.fn();
    const client = createExperimentsClient({ config: { clientKey: nextKey(), apiHost: "https://cdn.test", timeoutMs: 500 }, attributes: { id: "visitor-slow-123456789" }, sink: { track, setUserProperty: vi.fn() } });
    const r = await client.ready;
    expect(Date.now() - t0).toBeLessThan(1400);
    expect(r.source).toBe("timeout");
    expect(client.getValue(FLAG, "Start for free")).toBe("Start for free");
    expect(track).not.toHaveBeenCalled();
  }, 5000);

  it("a flag that does not exist (or was switched off) -> control, no exposure", async () => {
    stubFetch(() => Promise.resolve(new Response(JSON.stringify({ status: 200, features: {}, experiments: [] }), { status: 200 })));
    const r = await valueFor("visitor-noflag-123456789");
    expect(r.value).toBe("Start for free");
    expect(r.track).not.toHaveBeenCalled();
  });

  it("a feature of the wrong type (number instead of the string control) -> control", async () => {
    stubFetch(() => Promise.resolve(new Response(JSON.stringify({ status: 200, features: { [FLAG]: { defaultValue: 7 } } }), { status: 200 })));
    expect((await valueFor("visitor-type-123456789")).value).toBe("Start for free");
  });
});
