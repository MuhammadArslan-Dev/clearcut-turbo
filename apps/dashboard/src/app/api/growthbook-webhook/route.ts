// GrowthBook SDK webhook (CC-192). GrowthBook calls this whenever a change affects the SDK connection's payload (publish, flag on/off,
// rule edit...). It expires the cached payload (tag "growthbook", see @clearcut/experiments/payload) so the next page view fetches the
// fresh one: a flag switched off in GrowthBook reaches visitors in seconds instead of after the 5 minute server cache.
// The body is NOT trusted or even parsed: a valid signature only means "something changed, refetch". Setup: docs/phases/118.
import { revalidateTag } from "next/cache";
import { GROWTHBOOK_CACHE_TAG } from "@clearcut/experiments/payload";
import { verifyWebhookSignature } from "@clearcut/experiments/webhook";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 1_000_000; // GrowthBook's "Standard" payload is a few KB; refuse anything absurd before hashing it

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.GROWTHBOOK_WEBHOOK_SECRET?.trim();
  // Not configured: refuse instead of accepting unsigned calls. GrowthBook sees a non-200 and retries, so nothing is lost.
  if (!secret) return new Response("webhook not configured", { status: 503 });

  const body = await request.text(); // the RAW body: the signature covers these exact bytes
  if (body.length > MAX_BODY_CHARS) return new Response("payload too large", { status: 413 });

  const valid = await verifyWebhookSignature({
    secret,
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
    signature: request.headers.get("webhook-signature"),
    body,
  });
  if (!valid) return new Response("invalid signature", { status: 401 });

  // {expire: 0}: the next request is a blocking refetch (no stale copy), which is what a kill switch needs.
  revalidateTag(GROWTHBOOK_CACHE_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}

// Anything but POST: nothing to see here.
export function GET(): Response {
  return new Response("method not allowed", { status: 405, headers: { Allow: "POST" } });
}
