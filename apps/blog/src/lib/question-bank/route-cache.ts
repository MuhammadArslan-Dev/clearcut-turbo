// Caching for the question-bank pages (chapter, subject, year; page 1 and
// /page/N). They read no request data (cookies, headers, searchParams) —
// verified with `dynamic = "error"` — so they can be static and regenerated
// in the background (ISR). Without this they rendered on every request.
//
// Each route file declares `export const revalidate = 604800` and an empty
// `generateStaticParams` itself: Next reads route-segment options statically
// and needs a literal there. route-cache.test.ts keeps all six files in
// sync with QUESTION_PAGE_REVALIDATE.
//
// Freshness comes from on-demand revalidation, not this timer: a question
// sync calls /api/revalidate, which revalidates the exam's cache tags and
// every question-bank route (lib/question-bank/revalidate.ts). The timer is a
// once-a-week safety net. It was 10 minutes until 2026-10-22: each page
// regeneration is ~100 Vercel ISR write units (~0.9 MB of HTML + RSC at
// 8 KB/unit), and a 10-minute window re-wrote every crawled page all day —
// 247K writes in ~27 h against the Hobby plan's 200K/month. One day still
// meant ~20K writes a day (~600K a month), so since 2026-10-24 it is 7 days;
// the client wants to stay on the free plan. A failed
// regeneration keeps serving the last good page; a failed first render is a
// 500 and is never cached.

/** Seconds between background regenerations of a cached page (7 days). */
export const QUESTION_PAGE_REVALIDATE = 604800;
