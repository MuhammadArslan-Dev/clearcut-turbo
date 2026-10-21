// Caching for the question-bank pages (chapter, subject, year; page 1 and
// /page/N). They read no request data (cookies, headers, searchParams) —
// verified with `dynamic = "error"` — so they can be fully static.
//
// The blog runs on the Workers Free plan (10 ms CPU per request) and one of
// these pages costs 0.3–2 s of CPU to render, so they are never rendered
// inside the Worker on a schedule: no route declares `revalidate` (time-based
// ISR would re-render them in the Worker), and each route's
// generateStaticParams lists every URL (lib/question-bank/static-params.ts) so
// `next build` renders them all in CI. Content changes arrive by rebuilding
// the site — the backend's post-sync POST /api/revalidate triggers the deploy
// workflow. route-cache.test.ts keeps all six route files on this policy.
// docs/phases/14-blog-worker-limit.md.

/** How long one server instance reuses the question search index
 * (search-index.ts) before rebuilding it from the cached loaders. */
export const QUESTION_PAGE_REVALIDATE = 600;
