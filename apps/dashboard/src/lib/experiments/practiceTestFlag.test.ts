import { beforeEach, describe, expect, it, vi } from "vitest";
import { isPracticeTestEnabled, resetPracticeTestFlagCache } from "./practiceTestFlag";

const USER = "11111111-aaaa-bbbb-cccc-222222222222";

function reply(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}
const on = { practice_test: { key: "on", value: "on" } };

beforeEach(() => {
  resetPracticeTestFlagCache();
  delete process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY;
});

describe("isPracticeTestEnabled", () => {
  it("is true only when the flag answers on", async () => {
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply(on) })).toBe(true);
  });

  it("is false when the flag is off, missing or disabled (empty answer)", async () => {
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply({ practice_test: { key: "off" } }) })).toBe(false);
    resetPracticeTestFlagCache();
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply({}) })).toBe(false);
    resetPracticeTestFlagCache();
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply(null) })).toBe(false);
  });

  it("is false without a user and does not call Amplitude", async () => {
    const f = reply(on);
    expect(await isPracticeTestEnabled(null, { fetchImpl: f })).toBe(false);
    expect(await isPracticeTestEnabled("  ", { fetchImpl: f })).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("is false on a server error, bad JSON, a thrown fetch and a timeout", async () => {
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply(on, 500) })).toBe(false);
    resetPracticeTestFlagCache();
    const badJson = vi.fn(async () => new Response("not json", { status: 200 })) as unknown as typeof fetch;
    expect(await isPracticeTestEnabled(USER, { fetchImpl: badJson })).toBe(false);
    resetPracticeTestFlagCache();
    const boom = vi.fn(async () => { throw new Error("network"); }) as unknown as typeof fetch;
    expect(await isPracticeTestEnabled(USER, { fetchImpl: boom })).toBe(false);
    resetPracticeTestFlagCache();
    const hang = vi.fn((_u: unknown, init?: RequestInit) => new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener("abort", () => rej(new Error("aborted")));
    })) as unknown as typeof fetch;
    expect(await isPracticeTestEnabled(USER, { fetchImpl: hang, timeoutMs: 20 })).toBe(false);
  });

  it("does not cache a failure, so the next call asks again", async () => {
    expect(await isPracticeTestEnabled(USER, { fetchImpl: reply(on, 503) })).toBe(false);
    const ok = reply(on);
    expect(await isPracticeTestEnabled(USER, { fetchImpl: ok })).toBe(true);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("caches a definite answer per user for 10 minutes", async () => {
    const f = reply(on);
    let t = 1_000;
    const now = () => t;
    expect(await isPracticeTestEnabled(USER, { fetchImpl: f, now })).toBe(true);
    expect(await isPracticeTestEnabled(USER, { fetchImpl: f, now })).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    expect(await isPracticeTestEnabled("another-user", { fetchImpl: f, now })).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
    t += 10 * 60 * 1000 + 1;
    expect(await isPracticeTestEnabled(USER, { fetchImpl: f, now })).toBe(true);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("shares one request between simultaneous callers", async () => {
    const f = reply(on);
    const [a, b] = await Promise.all([isPracticeTestEnabled(USER, { fetchImpl: f }), isPracticeTestEnabled(USER, { fetchImpl: f })]);
    expect([a, b]).toEqual([true, true]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("sends the user id, the client key and only this flag", async () => {
    const f = reply(on);
    await isPracticeTestEnabled(USER, { fetchImpl: f });
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toContain("flag_keys=practice_test");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Api-Key client-/);
    expect(JSON.parse(Buffer.from(headers["X-Amp-Exp-User"], "base64").toString()).user_id).toBe(USER);
  });

  it("is off everywhere when the key is set to 'off'", async () => {
    process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY = "off";
    const f = reply(on);
    expect(await isPracticeTestEnabled(USER, { fetchImpl: f })).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
