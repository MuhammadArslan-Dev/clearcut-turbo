import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  fetchVariantMap: vi.fn(),
  exposeVariant: vi.fn(),
  clearExperimentClient: vi.fn(),
}));
vi.mock("./client", () => client);

const config = vi.hoisted(() => ({ enabled: true, internal: undefined as string | undefined }));
vi.mock("./config", () => ({
  experimentsEnabled: () => config.enabled,
  internalTesterUuids: () => config.internal,
}));

import { useExperimentStore } from "@/store/experiments/useExperimentStore";
import { AUTOPAY_OFFER_FLAG_KEY } from "./autopayPrice";
import { __resetExposureGuardForTests, ensureExperiments, exposeAutopayOffer } from "./runtime";

const FLAG = AUTOPAY_OFFER_FLAG_KEY;
type Assignment = { variant: string | null; payload: unknown };
const ALL: Assignment = { variant: "price-99", payload: { scope: "all" } };

beforeEach(() => {
  config.enabled = true;
  config.internal = undefined;
  client.fetchVariantMap.mockReset();
  client.exposeVariant.mockReset().mockResolvedValue(true);
  client.clearExperimentClient.mockReset();
  useExperimentStore.getState().reset();
  __resetExposureGuardForTests();
});

describe("ensureExperiments", () => {
  it("is a no-op when experiments are off (no key / analytics off / host not allowed)", async () => {
    config.enabled = false;
    await ensureExperiments("u-1");
    expect(useExperimentStore.getState().status).toBe("disabled");
    expect(client.fetchVariantMap).not.toHaveBeenCalled();
  });

  it("fetches the offer flag once and stores the answer (variant AND payload)", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });

    await ensureExperiments("u-1");

    const s = useExperimentStore.getState();
    expect(s.status).toBe("ready");
    expect(s.assignments[FLAG]).toEqual(ALL);
    expect(client.fetchVariantMap).toHaveBeenCalledWith("u-1", [FLAG], undefined);
  });

  it("does not fetch again for the same user (one fetch per user per page load)", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });
    await ensureExperiments("u-1");
    await ensureExperiments("u-1");
    expect(client.fetchVariantMap).toHaveBeenCalledTimes(1);
  });

  it("waits (status loading, nothing to show) until the answer arrives", async () => {
    let resolve!: (v: Record<string, Assignment>) => void;
    client.fetchVariantMap.mockReturnValue(new Promise((r) => (resolve = r)));

    const pending = ensureExperiments("u-1");
    expect(useExperimentStore.getState().status).toBe("loading");
    expect(useExperimentStore.getState().assignments).toEqual({});

    resolve({ [FLAG]: ALL });
    await pending;
    expect(useExperimentStore.getState().status).toBe("ready");
  });

  it("NO cache: nothing is written to storage and an old cached offer is ignored", async () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({ [FLAG]: "price-99" })), // an old build's cache
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("window", { localStorage: storage });
    let resolve!: (v: Record<string, Assignment>) => void;
    client.fetchVariantMap.mockReturnValue(new Promise((r) => (resolve = r)));

    const pending = ensureExperiments("u-1");
    expect(useExperimentStore.getState()).toMatchObject({ status: "loading", assignments: {} });

    resolve({ [FLAG]: { variant: null, payload: null } });
    await pending;
    expect(useExperimentStore.getState().assignments[FLAG]).toEqual({ variant: null, payload: null });
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("Amplitude failing: status failed, no assignment, so the default price", async () => {
    client.fetchVariantMap.mockResolvedValue(null);
    await ensureExperiments("u-1");
    const s = useExperimentStore.getState();
    expect(s.status).toBe("failed");
    expect(s.assignments).toEqual({});
  });

  it("internal testers send the internal_tester property, everyone else sends nothing extra", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });
    config.internal = "U-1, someone-else";

    await ensureExperiments("u-1");
    expect(client.fetchVariantMap).toHaveBeenLastCalledWith("u-1", [FLAG], { internal_tester: true });

    useExperimentStore.getState().reset();
    await ensureExperiments("u-2");
    expect(client.fetchVariantMap).toHaveBeenLastCalledWith("u-2", [FLAG], undefined);
  });

  it("a different user does not inherit the previous user's answer; logout clears the SDK", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });
    await ensureExperiments("u-1");

    client.fetchVariantMap.mockResolvedValue({ [FLAG]: { variant: null, payload: null } });
    await ensureExperiments("u-2");
    expect(useExperimentStore.getState().assignments[FLAG].variant).toBeNull();

    await ensureExperiments(null);
    expect(useExperimentStore.getState().status).toBe("idle");
    expect(client.clearExperimentClient).toHaveBeenCalled();
  });

  it("a late answer for a previous user is ignored", async () => {
    let resolveFirst!: (v: Record<string, Assignment>) => void;
    client.fetchVariantMap.mockReturnValueOnce(new Promise((r) => (resolveFirst = r)));
    client.fetchVariantMap.mockResolvedValueOnce({ [FLAG]: { variant: null, payload: null } });

    const first = ensureExperiments("u-1");
    await ensureExperiments("u-2");
    resolveFirst({ [FLAG]: ALL });
    await first;

    const s = useExperimentStore.getState();
    expect(s.userId).toBe("u-2");
    expect(s.assignments[FLAG].variant).toBeNull();
  });
});

describe("exposeAutopayOffer", () => {
  it("logs one exposure per user per page load, for the price-99 variant", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });
    await ensureExperiments("u-1");

    expect(await exposeAutopayOffer()).toBe(true);
    expect(await exposeAutopayOffer()).toBe(false);
    expect(client.exposeVariant).toHaveBeenCalledTimes(1);
    expect(client.exposeVariant).toHaveBeenCalledWith(FLAG, "price-99");
  });

  it("never exposes before Amplitude answered", async () => {
    client.fetchVariantMap.mockReturnValue(new Promise(() => {}));
    void ensureExperiments("u-1");

    expect(await exposeAutopayOffer()).toBe(false);
    expect(client.exposeVariant).not.toHaveBeenCalled();
  });

  it("never exposes after a failed fetch, with experiments off, or without a user", async () => {
    expect(await exposeAutopayOffer()).toBe(false);

    client.fetchVariantMap.mockResolvedValue(null);
    await ensureExperiments("u-1");
    expect(await exposeAutopayOffer()).toBe(false);

    config.enabled = false;
    useExperimentStore.getState().reset();
    await ensureExperiments("u-2");
    expect(await exposeAutopayOffer()).toBe(false);
    expect(client.exposeVariant).not.toHaveBeenCalled();
  });

  it("can retry when the SDK refused because nothing was logged", async () => {
    client.fetchVariantMap.mockResolvedValue({ [FLAG]: ALL });
    await ensureExperiments("u-1");

    client.exposeVariant.mockResolvedValueOnce(false);
    expect(await exposeAutopayOffer()).toBe(false);
    expect(await exposeAutopayOffer()).toBe(true);
  });
});
