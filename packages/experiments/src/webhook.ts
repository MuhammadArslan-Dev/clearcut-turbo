// Verification of GrowthBook SDK webhooks (CC-192). Checked against docs.growthbook.io/app/webhooks/sdk-webhooks (2026-11-18):
// POST with the headers `webhook-id`, `webhook-timestamp` and `webhook-signature`; the signature header is `v1,<base64>` where
// base64 = HMAC-SHA256(secret, `${webhook-id}.${webhook-timestamp}.${raw body}`), the secret used as a plain string (the docs' Node
// example). Several space-separated `v1,...` entries are allowed (Standard Webhooks). Uses WebCrypto only, so it runs on Node 22
// and the edge alike. Never throws: any malformed input is simply "not valid".

/** Standard Webhooks default: a signed request older (or newer) than this is rejected, so a captured request cannot be replayed later. */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Constant-time string comparison (length is not secret here: both are fixed-size base64 of a SHA-256 digest). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type VerifyWebhookArgs = {
  secret: string;
  /** Header `webhook-id`. */
  id: string | null | undefined;
  /** Header `webhook-timestamp` (unix seconds). */
  timestamp: string | null | undefined;
  /** Header `webhook-signature`. */
  signature: string | null | undefined;
  /** The RAW request body, exactly as received (never a re-serialised JSON). */
  body: string;
  nowMs?: number;
  toleranceSeconds?: number;
};

export async function verifyWebhookSignature(args: VerifyWebhookArgs): Promise<boolean> {
  try {
    const { secret, id, timestamp, signature, body } = args;
    if (!secret || !id || !timestamp || !signature) return false;

    const sent = Number(timestamp);
    if (!Number.isFinite(sent) || sent <= 0) return false;
    // Seconds are the standard; tolerate a millisecond value too.
    const sentSeconds = sent > 1e11 ? sent / 1000 : sent;
    const nowSeconds = (args.nowMs ?? Date.now()) / 1000;
    if (Math.abs(nowSeconds - sentSeconds) > (args.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS)) return false;

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${id}.${timestamp}.${body}`));
    const expected = toBase64(new Uint8Array(mac));

    return signature
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.startsWith("v1,"))
      .some((part) => safeEqual(part.slice(3), expected));
  } catch {
    return false;
  }
}
