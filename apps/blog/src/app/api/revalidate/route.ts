import { revalidatePath, revalidateTag } from "next/cache";
import { forgetSearchIndex } from "@/lib/question-bank/search-index";
import {
  isAuthorized,
  QUESTION_PAGE_PATTERNS,
  revalidationTargets,
  secretConfigured,
} from "@/lib/question-bank/revalidate";
import { forgetExamIndex } from "@/lib/seo/load-exam-index";

// POST /api/revalidate — called by the backend once a question sync has fully
// succeeded (QuestionCacheService::notifyBlog), or by hand:
//   curl -X POST https://<site>/api/revalidate \
//     -H "Authorization: Bearer $REVALIDATE_SECRET" -d '{"exams":["ctet"]}'
// Expires the question-bank data (cache tags, lib/question-bank/cache-tags.ts)
// and the ISR question pages, so the next visit renders fresh questions
// instead of waiting out the 10-minute ISR / 1-hour data-cache windows.
//
// In-memory copies (exam index, search index) are per server instance: only
// the instance that receives this call drops them; others refresh on their
// own TTL. On Cloudflare (OpenNext) tag/path revalidation needs the D1 tag
// cache + DO queue configured in open-next.config.ts — see
// docs/BLOG_CACHE_DEPLOY.md.

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  // Fail closed: without a (long enough) secret nobody can trigger this.
  if (!secretConfigured(secret)) return json({ error: "revalidation is not configured" }, 503);
  if (!isAuthorized(request.headers.get("authorization"), secret)) return json({ error: "unauthorized" }, 401);

  const text = await request.text();
  let body: unknown = {};
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: "invalid JSON" }, 400);
    }
  }
  const targets = revalidationTargets(body);
  if (!targets) return json({ error: "expected { exams?: string[] }" }, 400);
  if (targets.exams.length === 0) return json({ ok: true, exams: [], tags: [], paths: [] }, 200);

  for (const tag of targets.tags) revalidateTag(tag, { expire: 0 });
  // The page patterns are exam-agnostic, so this also refreshes other exams'
  // ISR pages on their next visit — harmless, and it covers pages whose
  // >2MB reads were never in the data cache to carry a tag.
  for (const pattern of QUESTION_PAGE_PATTERNS) revalidatePath(pattern, "page");
  forgetExamIndex(targets.all ? undefined : targets.exams);
  forgetSearchIndex(targets.all ? undefined : targets.exams);

  return json({ ok: true, exams: targets.exams, tags: targets.tags, paths: QUESTION_PAGE_PATTERNS }, 200);
}
