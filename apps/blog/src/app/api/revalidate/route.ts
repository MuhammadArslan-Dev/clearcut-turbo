import { revalidateSecret } from "@/lib/api/blog-server-key";
import { forgetSearchIndex } from "@/lib/question-bank/search-index";
import { isAuthorized, revalidationTargets, secretConfigured } from "@/lib/question-bank/revalidate";
import { triggerRebuild } from "@/lib/question-bank/rebuild";
import { forgetExamIndex } from "@/lib/seo/load-exam-index";

// POST /api/revalidate — called by the backend once a question sync has fully
// succeeded (QuestionCacheService::notifyBlog), or by hand:
//   curl -X POST https://<site>/api/revalidate \
//     -H "Authorization: Bearer $REVALIDATE_SECRET" -d '{"exams":["ctet"]}'
//
// Every blog page is prerendered at build time and never re-rendered inside
// the Worker (Workers Free plan, 10 ms CPU per request — see
// lib/question-bank/route-cache.ts), so fresh questions arrive by rebuilding
// the site: this starts the deploy workflow (lib/question-bank/rebuild.ts).
// The request contract with the backend is unchanged; any 2xx is success.

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function POST(request: Request) {
  // In-code secret unless REVALIDATE_SECRET overrides it (blog-server-key.ts).
  const secret = revalidateSecret();
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
  if (targets.exams.length === 0) return json({ ok: true, exams: [], rebuild: "skipped" }, 200);

  // Per-instance memos; harmless to drop, and keeps a request-time render
  // (a URL that was not prerendered) on fresh data.
  forgetExamIndex(targets.all ? undefined : targets.exams);
  forgetSearchIndex(targets.all ? undefined : targets.exams);

  const rebuild = await triggerRebuild(`question sync: ${targets.exams.join(", ")}`);
  const status = rebuild.status === "started" ? 202 : rebuild.status === "not-configured" ? 503 : 502;
  return json({ ok: rebuild.status === "started", exams: targets.exams, rebuild: rebuild.status }, status);
}
