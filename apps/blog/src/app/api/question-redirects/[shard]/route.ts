import { QUESTION_REDIRECT_SHARDS, questionRedirectShard } from "@/lib/seo/question-redirect-map";

// GET /api/question-redirects/<0..63> — one shard of the build-time map of old
// /question/<slug>-<id> URLs to their chapter page (lib/seo/question-redirect-map.ts).
// Prerendered at build time only; the deploy workflow copies the shards into
// the static assets, where worker.ts reads them.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return Array.from({ length: QUESTION_REDIRECT_SHARDS }, (_, i) => ({ shard: String(i) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ shard: string }> }) {
  const { shard } = await params;
  return Response.json(await questionRedirectShard(Number(shard)));
}
