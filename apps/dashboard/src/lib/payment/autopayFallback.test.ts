import { beforeEach, describe, expect, it } from "vitest";
import { resetExperimentFlagCache } from "../experiments/experimentFlag";
import {
  clearAutopayAttempt,
  getAutopayFallbackArm,
  readAutopayAttempt,
  saveAutopayAttempt,
} from "./autopayFallback";

const store = new Map<string, string>();
const storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
Object.assign(globalThis, { window: { localStorage: storage, sessionStorage: storage }, localStorage: storage });

const reply = (body: unknown, ok = true) =>
  (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

beforeEach(() => {
  store.clear();
  resetExperimentFlagCache();
});

describe("getAutopayFallbackArm", () => {
  it("returns the two known variants", async () => {
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({ autopay_fallback: { key: "on" } }) })).toBe("on");
    resetExperimentFlagCache();
    store.clear();
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({ autopay_fallback: { key: "holdout" } }) })).toBe("holdout");
  });

  it("means no experiment for everything else", async () => {
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({}) })).toBeNull();
    resetExperimentFlagCache();
    store.clear();
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({ autopay_fallback: { key: "other" } }) })).toBeNull();
    resetExperimentFlagCache();
    store.clear();
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({}, false) })).toBeNull();
    expect(await getAutopayFallbackArm(null, { fetchImpl: reply({ autopay_fallback: { key: "on" } }) })).toBeNull();
  });

  it("keeps a user's arm between calls", async () => {
    await getAutopayFallbackArm("u1", { fetchImpl: reply({ autopay_fallback: { key: "holdout" } }) });
    expect(await getAutopayFallbackArm("u1", { fetchImpl: reply({ autopay_fallback: { key: "on" } }) })).toBe("holdout");
  });
});

describe("autopay attempt", () => {
  it("is found only for the same course and for 30 minutes", () => {
    saveAutopayAttempt({ subscriptionId: 7, courseId: "c1" }, 1000);
    expect(readAutopayAttempt("c1", 2000)?.subscriptionId).toBe(7);
    expect(readAutopayAttempt("c2", 2000)).toBeNull();
    expect(readAutopayAttempt("c1", 1000 + 31 * 60 * 1000)).toBeNull();
    clearAutopayAttempt();
    expect(readAutopayAttempt("c1", 2000)).toBeNull();
  });
});
