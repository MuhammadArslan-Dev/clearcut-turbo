import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EXPERIMENT_DEPLOYMENT_KEY,
  __resetExperimentForTests,
  downloadFlagsWithin,
  encodeUser,
  experimentDeploymentKey,
  fetchDownloadFlags,
  flagCacheKey,
  flagScopeId,
  parseFlags,
  type FlagContext,
} from "./experiment";

const tnpsc: FlagContext = { exam: "tnpsc", tool: "resizer", page: "/tools/resizer/tnpsc" };
const htet: FlagContext = { exam: "htet", tool: "resizer", page: "/tools/resizer/htet" };
const compressor: FlagContext = { tool: "image-compressor", page: "/tools/resizer/image-compressor" };

const answer = (flags: Record<string, "on" | undefined>) =>
  Object.fromEntries(Object.entries(flags).filter(([, v]) => v).map(([k, v]) => [k, { key: v, value: v }]));

const respond = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;
const decodeUser = (call: unknown[]) => JSON.parse(atob(((call[1] as RequestInit).headers as Record<string, string>)["X-Amp-Exp-User"]));

beforeEach(() => {
  __resetExperimentForTests();
  delete process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY;
});
afterEach(() => vi.useRealTimers());

describe("parseFlags", () => {
  it("reads ON by variant key or value", () => {
    expect(parseFlags({ hard_gate: { key: "on", value: "on" }, soft_gate: { value: "on" } })).toEqual({ hard_gate: true, soft_gate: true });
  });
  it("a flag that is missing (disabled / not targeted) is OFF", () => {
    expect(parseFlags({})).toEqual({ hard_gate: false, soft_gate: false });
    expect(parseFlags({ hard_gate: { key: "off" } })).toEqual({ hard_gate: false, soft_gate: false });
  });
  it("garbage is not an answer", () => {
    expect(parseFlags(null)).toBeNull();
    expect(parseFlags("x")).toBeNull();
  });
});

describe("fetchDownloadFlags", () => {
  it("sends the client key and the exam scope id, and returns the flags", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(answer({ soft_gate: "on" })));
    const flags = await fetchDownloadFlags(tnpsc, fetchMock as unknown as typeof fetch);

    expect(flags).toEqual({ hard_gate: false, soft_gate: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.lab.amplitude.com/sdk/v2/vardata?flag_keys=hard_gate,soft_gate");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `Api-Key ${DEFAULT_EXPERIMENT_DEPLOYMENT_KEY}` });
    expect(decodeUser(fetchMock.mock.calls[0])).toMatchObject({ user_id: "tools:exam:tnpsc" });
  });

  it("a page that is not an exam page is evaluated as its tool scope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({}));
    await fetchDownloadFlags(compressor, fetchMock as unknown as typeof fetch);
    expect(decodeUser(fetchMock.mock.calls[0])).toMatchObject({ user_id: "tools:tool:image-compressor" });
  });

  it("exam isolation: each exam is evaluated with its own context and cached under its own key", async () => {
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const scope = JSON.parse(atob((init!.headers as Record<string, string>)["X-Amp-Exp-User"])).user_id;
      return respond(answer(scope === "tools:exam:tnpsc" ? { hard_gate: "on" } : scope === "tools:exam:htet" ? { soft_gate: "on" } : {}));
    });
    const f = fetchMock as unknown as typeof fetch;

    expect(await fetchDownloadFlags(tnpsc, f)).toEqual({ hard_gate: true, soft_gate: false });
    expect(await fetchDownloadFlags(htet, f)).toEqual({ hard_gate: false, soft_gate: true });
    expect(await fetchDownloadFlags(compressor, f)).toEqual({ hard_gate: false, soft_gate: false });
    // cached per exam|tool: no second request, and tnpsc never reads htet's answer
    expect(await fetchDownloadFlags(tnpsc, f)).toEqual({ hard_gate: true, soft_gate: false });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new Set([flagCacheKey(tnpsc), flagCacheKey(htet), flagCacheKey(compressor)]).size).toBe(3);
    expect([flagScopeId(tnpsc), flagScopeId(htet), flagScopeId(compressor)]).toEqual(["tools:exam:tnpsc", "tools:exam:htet", "tools:tool:image-compressor"]);
  });

  it("joins an evaluation that is already running (one request)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({}));
    const f = fetchMock as unknown as typeof fetch;
    await Promise.all([fetchDownloadFlags(tnpsc, f), fetchDownloadFlags(tnpsc, f)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a failure is null (→ Legacy) and is not cached, so a later tap can retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(respond({}, 500))
      .mockResolvedValueOnce(respond({ hard_gate: { key: "on" } }));
    const f = fetchMock as unknown as typeof fetch;
    expect(await fetchDownloadFlags(tnpsc, f)).toBeNull();
    expect(await fetchDownloadFlags(tnpsc, f)).toBeNull();
    expect(await fetchDownloadFlags(tnpsc, f)).toEqual({ hard_gate: true, soft_gate: false });
  });

  it('the key "off" switches evaluation off without any request', async () => {
    process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY = "off";
    const fetchMock = vi.fn();
    expect(experimentDeploymentKey()).toBe("");
    expect(await fetchDownloadFlags(tnpsc, fetchMock as unknown as typeof fetch)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("downloadFlagsWithin", () => {
  it("gives up after the timeout (→ null → Legacy) when Amplitude is slow", async () => {
    vi.useFakeTimers();
    const slow = vi.fn(() => new Promise<Response>(() => {})); // never answers
    const result = downloadFlagsWithin(tnpsc, 1500, slow as unknown as typeof fetch);
    await vi.advanceTimersByTimeAsync(1500);
    expect(await result).toBeNull();
  });
});

describe("flagScopeId", () => {
  it("is lower-case, so a differently cased slug can never miss its segment", () => {
    expect(flagScopeId({ exam: "TNPSC ", tool: "resizer", page: "/" })).toBe("tools:exam:tnpsc");
  });
});

describe("encodeUser", () => {
  it("is plain base64 JSON: the scope id (user_id) and the device id", () => {
    expect(JSON.parse(atob(encodeUser(tnpsc, "dev-1")))).toEqual({ user_id: "tools:exam:tnpsc", device_id: "dev-1" });
    expect(JSON.parse(atob(encodeUser(compressor, "dev-1")))).toEqual({ user_id: "tools:tool:image-compressor", device_id: "dev-1" });
  });
});
