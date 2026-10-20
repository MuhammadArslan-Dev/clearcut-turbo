// Caching for the question-bank pages (chapter, subject, year; page 1 and
// /page/N). They read no request data (cookies, headers, searchParams) —
// verified with `dynamic = "error"` — so they can be static and regenerated
// in the background (ISR). Without this they rendered on every request.
//
// Each route file declares `export const revalidate = 600` and an empty
// `generateStaticParams` itself: Next reads route-segment options statically
// and needs a literal there. route-cache.test.ts keeps all six files in
// sync with QUESTION_PAGE_REVALIDATE.
//
// Freshness: the backend caches these reads for 1h and Next's data cache
// for 1h already; regenerating the page every 10 minutes adds at most 10
// minutes on top. A failed regeneration keeps serving the last good page; a
// failed first render is a 500 and is never cached.

/** Seconds between background regenerations of a cached page. */
export const QUESTION_PAGE_REVALIDATE = 600;
