// pnpm --filter @clearcut/experiments test
// Server-side payload (CC-192 follow-up): the REAL @growthbook/growthbook 2.1.0 SDK decides from a payload the server fetched.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setPolyfills } from "@growthbook/growthbook";
import { createExperimentsClient } from "./client";
import { GROWTHBOOK_CACHE_TAG, PAYLOAD_FAILURE_COOLDOWN_MS, PAYLOAD_REVALIDATE_SECONDS, fetchFeaturesPayload, resetPayloadFailureCooldown, isFeaturesPayload, type FeaturesPayload } from "./payload";

const FLAG = "dash_all_test_card_202611";
const PAYLOAD: FeaturesPayload = {
  features: {
    [FLAG]: { defaultValue: "old", rules: [{ id: "r1", condition: { user_id: "user-in-rule" }, force: "new" }] },
  },
  dateUpdated: "2026-11-18T00:00:00.000Z",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  resetPayloadFailureCooldown();
});

afterEach(() => {
  setPolyfills({ fetch: globalThis.fetch });
});

describe("isFeaturesPayload", () => {
  it("accepts an object with a features object, rejects everything else", () => {
    expect(isFeaturesPayload(PAYLOAD)).toBe(true);
    expect(isFeaturesPayload({ features: {} })).toBe(true);
    for (const bad of [null, undefined, 1, "x", [], {}, { features: null }, { features: [] }, { features: "no" }]) expect(isFeaturesPayload(bad)).toBe(false);
  });
});

describe("fetchFeaturesPayload", () => {
  it("returns the payload, asks the right URL and passes the 5 minute revalidate window to the Next data cache", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(PAYLOAD));
    const out = await fetchFeaturesPayload({ clientKey: "sdk-abc", apiHost: "https://cdn.test/", fetchImpl });
    expect(out).toEqual(PAYLOAD);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://cdn.test/api/features/sdk-abc");
    expect((init as { next: { revalidate: number; tags: string[] } }).next.revalidate).toBe(PAYLOAD_REVALIDATE_SECONDS);
    expect((init as { next: { tags: string[] } }).next.tags).toEqual([GROWTHBOOK_CACHE_TAG]); // what the webhook route invalidates
    expect(PAYLOAD_REVALIDATE_SECONDS).toBe(300);
  });

  it("defaults to the GrowthBook CDN and trims the key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(PAYLOAD));
    await fetchFeaturesPayload({ clientKey: "  sdk-abc  ", fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://cdn.growthbook.io/api/features/sdk-abc");
  });

  it("no key -> null and no request at all", async () => {
    const fetchImpl = vi.fn();
    expect(await fetchFeaturesPayload({ clientKey: "   ", fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("never throws: HTTP error, network error, bad JSON, wrong shape -> null", async () => {
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockResolvedValue(json({}, 500)) })).toBeNull();
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockRejectedValue(new TypeError("fetch failed")) })).toBeNull();
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })) })).toBeNull();
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockResolvedValue(json({ nope: 1 })) })).toBeNull();
  });

  it("a GrowthBook answer slower than the timeout -> null after the timeout (the page is not held up)", async () => {
    const fetchImpl = vi.fn((_url: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const t0 = Date.now();
    const out = await fetchFeaturesPayload({ clientKey: "k", timeoutMs: 100, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(out).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1500);
  });
});

describe("failure cooldown (the layout asks on every dashboard page)", () => {
  it("after a failure the next calls inside the cooldown do not touch the network at all", async () => {
    const failing = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const t0 = 1_000_000;
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: failing, nowMs: t0 })).toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);
    const healthy = vi.fn().mockResolvedValue(json(PAYLOAD));
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: healthy, nowMs: t0 + PAYLOAD_FAILURE_COOLDOWN_MS - 1 })).toBeNull();
    expect(healthy).not.toHaveBeenCalled(); // skipped: no 1.5 s wait for every page while GrowthBook is down
  });

  it("after the cooldown it asks again, and a success clears the failure", async () => {
    const t0 = 1_000_000;
    await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockResolvedValue(json({}, 500)), nowMs: t0 });
    const healthy = vi.fn(() => Promise.resolve(json(PAYLOAD))); // a fresh Response per call: a body can be read once
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: healthy, nowMs: t0 + PAYLOAD_FAILURE_COOLDOWN_MS + 1 })).toEqual(PAYLOAD);
    expect(healthy).toHaveBeenCalledTimes(1);
    // cleared: an immediate next call is allowed again
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: healthy, nowMs: t0 + PAYLOAD_FAILURE_COOLDOWN_MS + 2 })).toEqual(PAYLOAD);
    expect(healthy).toHaveBeenCalledTimes(2);
  });

  it("bad JSON and a wrong shape count as failures too", async () => {
    const t0 = 2_000_000;
    await fetchFeaturesPayload({ clientKey: "k", fetchImpl: vi.fn().mockResolvedValue(json({ nope: 1 })), nowMs: t0 });
    const healthy = vi.fn().mockResolvedValue(json(PAYLOAD));
    expect(await fetchFeaturesPayload({ clientKey: "k", fetchImpl: healthy, nowMs: t0 + 5 })).toBeNull();
    expect(healthy).not.toHaveBeenCalled();
  });
});

describe("client with a server payload (initSync)", () => {
  const make = (userId: string | undefined, payload: FeaturesPayload | null | undefined, key: string) => {
    const track = vi.fn();
    const client = createExperimentsClient({
      config: { clientKey: key, apiHost: "https://cdn.test", timeoutMs: 500 },
      attributes: { id: "visitor-0123456789abcdef", user_id: userId },
      sink: { track, setUserProperty: vi.fn() },
      payload,
    });
    return { client, track };
  };

  it("decides synchronously, with NO request to GrowthBook: the targeted user gets the variant, everyone else control", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("the browser must not ask GrowthBook")));
    setPolyfills({ fetch: fetchSpy as unknown as typeof fetch });
    const inRule = make("user-in-rule", PAYLOAD, "sdk-sync-1");
    const other = make("someone-else", PAYLOAD, "sdk-sync-2");
    expect(inRule.client.getValue(FLAG, "old")).toBe("new"); // no await: the answer is there right after creation
    expect(other.client.getValue(FLAG, "old")).toBe("old");
    expect((await inRule.client.ready).source).toBe("server-payload");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a flag missing from the payload (switched off in GrowthBook) -> control", () => {
    const { client } = make("user-in-rule", { features: {}, dateUpdated: "2026-11-18T00:00:00.000Z" }, "sdk-sync-3");
    expect(client.getValue(FLAG, "old")).toBe("old");
  });

  it("a payload with an experiment rule tracks one exposure when the value is read", () => {
    const experimentPayload: FeaturesPayload = {
          features: {
        lp_x: { defaultValue: "a", rules: [{ id: "e1", key: "lp_x", variations: ["a", "b"], weights: [0, 1], coverage: 1, hashAttribute: "id" }] },
      },
      dateUpdated: "2026-11-18T00:00:00.000Z",
    };
    const { client, track } = make(undefined, experimentPayload, "sdk-sync-4");
    expect(client.getValue("lp_x", "a")).toBe("b");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][1]).toMatchObject({ flag_key: "lp_x" });
  });

  it("no payload (null/undefined) keeps the old behaviour: the browser asks GrowthBook", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(json(PAYLOAD));
    setPolyfills({ fetch: fetchSpy as unknown as typeof fetch });
    const { client } = make("user-in-rule", null, "sdk-net-1");
    const r = await client.ready;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(r.source).not.toBe("server-payload");
    expect(client.getValue(FLAG, "old")).toBe("new");
  });
});
