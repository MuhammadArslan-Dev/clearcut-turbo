import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => {
  const client = {
    fetch: vi.fn(),
    variant: vi.fn(),
    exposure: vi.fn(),
    clear: vi.fn(),
  };
  const initialize = vi.fn(() => client);
  return { client, initialize };
});

vi.mock("@amplitude/experiment-js-client", () => ({ Experiment: { initialize: sdk.initialize } }));

const analytics = vi.hoisted(() => ({
  trackSdkEvent: vi.fn(),
  getAnalyticsIdentity: vi.fn(() => ({ userId: "u-1", deviceId: "dev-1" })),
}));
vi.mock("@/lib/analytics/browser", () => analytics);

const config = vi.hoisted(() => ({ key: "client-key" }));
vi.mock("./config", () => ({
  EXPERIMENT_TIMEOUT_MS: 50,
  experimentDeploymentKey: () => config.key,
  experimentServerZone: () => "US",
}));

import {
  __resetExperimentClientForTests,
  clearExperimentClient,
  exposeVariant,
  fetchVariantMap,
  sendExposure,
} from "./client";

beforeEach(() => {
  __resetExperimentClientForTests();
  config.key = "client-key";
  sdk.client.fetch.mockReset().mockResolvedValue(sdk.client);
  sdk.client.variant.mockReset();
  sdk.client.exposure.mockReset();
  sdk.client.clear.mockReset();
  sdk.initialize.mockClear();
  analytics.trackSdkEvent.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchVariantMap", () => {
  it("fetches by user id (+ device id) for exactly the requested flags and returns variant AND payload", async () => {
    sdk.client.variant.mockImplementation((k: string) =>
      k === "autopay-offer-99"
        ? { key: "price-99", value: "price-99", payload: { scope: "exams", exams: ["HTET"] } }
        : { key: "off" },
    );

    const result = await fetchVariantMap("uuid-9", ["autopay-offer-99"]);

    expect(result).toEqual({
      "autopay-offer-99": { variant: "price-99", payload: { scope: "exams", exams: ["HTET"] } },
    });
    expect(sdk.client.fetch).toHaveBeenCalledWith(
      { user_id: "uuid-9", device_id: "dev-1" },
      { flagKeys: ["autopay-offer-99"] },
    );
  });

  it("drops the SDK's remembered variants BEFORE fetching (no stale offer can survive a failed fetch)", async () => {
    sdk.client.variant.mockReturnValue({});
    const order: string[] = [];
    sdk.client.clear.mockImplementation(() => order.push("clear"));
    sdk.client.fetch.mockImplementation(async () => {
      order.push("fetch");
      return sdk.client;
    });

    await fetchVariantMap("u", ["f"]);
    expect(order).toEqual(["clear", "fetch"]);

    // a failed fetch returns null; it never reads the (cleared) store
    sdk.client.fetch.mockRejectedValue(new Error("boom"));
    sdk.client.variant.mockClear();
    expect(await fetchVariantMap("u", ["f"])).toBeNull();
    expect(sdk.client.variant).not.toHaveBeenCalled();
  });

  it("sends explicit user properties only when given (internal_tester), never phone/email", async () => {
    sdk.client.variant.mockReturnValue({});
    await fetchVariantMap("u", ["f"], { internal_tester: true });
    expect(sdk.client.fetch).toHaveBeenLastCalledWith(
      { user_id: "u", device_id: "dev-1", user_properties: { internal_tester: true } },
      { flagKeys: ["f"] },
    );
  });

  it("configures the SDK the safe way: throw on error, no auto exposure, no auto fetch, our providers", async () => {
    sdk.client.variant.mockReturnValue({});
    await fetchVariantMap("uuid-9", ["f"]);

    const [key, cfg] = sdk.initialize.mock.calls[0] as unknown as [
      string,
      Record<string, unknown> & { userProvider: { getUser: () => unknown } },
    ];
    expect(key).toBe("client-key");
    expect(cfg).toMatchObject({
      throwOnError: true,
      retryFetchOnFailure: false,
      automaticExposureTracking: false,
      fetchOnStart: false,
      automaticFetchOnAmplitudeIdentityChange: false,
      serverZone: "US",
    });
    // The user sent to Amplitude Experiment carries ids only — no phone/email.
    expect(cfg.userProvider.getUser()).toEqual({ user_id: "u-1", device_id: "dev-1" });
  });

  it("a flag with no value is variant null / payload null", async () => {
    sdk.client.variant.mockReturnValue({});
    expect(await fetchVariantMap("u", ["f"])).toEqual({ f: { variant: null, payload: null } });
  });

  it("resolves to null (never throws) when the network call fails", async () => {
    sdk.client.fetch.mockRejectedValue(new Error("boom"));
    expect(await fetchVariantMap("u", ["f"])).toBeNull();
  });

  it("resolves to null when Amplitude is too slow", async () => {
    sdk.client.fetch.mockReturnValue(new Promise(() => {}));
    expect(await fetchVariantMap("u", ["f"])).toBeNull();
  });

  it("resolves to null when no deployment key is configured, without loading the SDK", async () => {
    config.key = "";
    expect(await fetchVariantMap("u", ["f"])).toBeNull();
    expect(sdk.initialize).not.toHaveBeenCalled();
  });

  it("resolves to null when the SDK itself fails to initialise", async () => {
    sdk.initialize.mockImplementationOnce(() => {
      throw new Error("init failed");
    });
    expect(await fetchVariantMap("u", ["f"])).toBeNull();
  });
});

describe("exposeVariant", () => {
  it("logs an exposure only when the SDK holds exactly the variant on screen", async () => {
    sdk.client.variant.mockReturnValue({ value: "price-99" });
    expect(await exposeVariant("f", "price-99")).toBe(true);
    expect(sdk.client.exposure).toHaveBeenCalledWith("f");
  });

  it("logs nothing when they differ (e.g. the server corrected the price)", async () => {
    sdk.client.variant.mockReturnValue({ value: "control" });
    expect(await exposeVariant("f", "price-99")).toBe(false);
    expect(sdk.client.exposure).not.toHaveBeenCalled();
  });

  it("logs nothing when the SDK is unavailable", async () => {
    config.key = "";
    expect(await exposeVariant("f", "control")).toBe(false);
  });
});

describe("sendExposure", () => {
  it("sends the $exposure event with flag_key and variant through the analytics gate", () => {
    sendExposure({ flag_key: "autopay-offer-99", variant: "price-99", experiment_key: "exp-1" });
    expect(analytics.trackSdkEvent).toHaveBeenCalledWith("$exposure", {
      flag_key: "autopay-offer-99",
      variant: "price-99",
      experiment_key: "exp-1",
    });
  });

  it("omits fields that are not set", () => {
    sendExposure({ flag_key: "f" });
    expect(analytics.trackSdkEvent).toHaveBeenCalledWith("$exposure", { flag_key: "f" });
  });
});

describe("clearExperimentClient", () => {
  it("drops the cached variants after a client exists", async () => {
    sdk.client.variant.mockReturnValue({});
    await fetchVariantMap("u", ["f"]);
    await clearExperimentClient();
    expect(sdk.client.clear).toHaveBeenCalled();
  });

  it("does nothing when the SDK was never loaded", async () => {
    await clearExperimentClient();
    expect(sdk.client.clear).not.toHaveBeenCalled();
  });
});
