// pnpm --filter @clearcut/experiments test
import { describe, expect, it } from "vitest";
import { WEBHOOK_TOLERANCE_SECONDS, verifyWebhookSignature } from "./webhook";

// Vector computed independently with Node's crypto.createHmac("sha256", secret).update(`${id}.${ts}.${body}`).digest("base64").
const SECRET = "wk_test_secret_123";
const ID = "msg_abc123";
const TS = "1763440000";
const BODY = '{"type":"payload.changed","timestamp":"2026-11-18T05:00:00.000Z","data":{}}';
const SIG = "VF/O4ntv28dnMYaTNIvDz34mCCguqKNuBKf14KCLefs=";
const NOW = Number(TS) * 1000 + 5000; // 5 s after the request was signed

const base = { secret: SECRET, id: ID, timestamp: TS, signature: `v1,${SIG}`, body: BODY, nowMs: NOW };

describe("verifyWebhookSignature", () => {
  it("accepts the independently computed signature", async () => {
    expect(await verifyWebhookSignature(base)).toBe(true);
  });

  it("accepts it among several space-separated signatures (key rotation)", async () => {
    expect(await verifyWebhookSignature({ ...base, signature: `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= v1,${SIG}` })).toBe(true);
  });

  it("rejects a wrong secret, a tampered body, a different id or timestamp", async () => {
    expect(await verifyWebhookSignature({ ...base, secret: "wk_other" })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, body: BODY.replace("changed", "chang3d") })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, id: "msg_other" })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, timestamp: "1763440001" })).toBe(false);
  });

  it("rejects missing or malformed headers", async () => {
    for (const bad of [null, undefined, "", "v1,", "v2," + SIG, SIG, "v1 " + SIG, "garbage"]) {
      expect(await verifyWebhookSignature({ ...base, signature: bad as string | null | undefined })).toBe(false);
    }
    expect(await verifyWebhookSignature({ ...base, id: null })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, timestamp: undefined })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, timestamp: "abc" })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, secret: "" })).toBe(false);
  });

  it("rejects a replay: a correctly signed request older or newer than the tolerance", async () => {
    const tol = WEBHOOK_TOLERANCE_SECONDS * 1000;
    expect(await verifyWebhookSignature({ ...base, nowMs: Number(TS) * 1000 + tol + 1000 })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, nowMs: Number(TS) * 1000 - tol - 1000 })).toBe(false);
    expect(await verifyWebhookSignature({ ...base, nowMs: Number(TS) * 1000 + tol - 1000 })).toBe(true);
    expect(WEBHOOK_TOLERANCE_SECONDS).toBe(300);
  });

  it("an empty body is signed and checked like any other", async () => {
    // HMAC over `${id}.${ts}.` with nothing after the last dot must not be accepted for a non-empty body
    expect(await verifyWebhookSignature({ ...base, body: "" })).toBe(false);
  });
});
