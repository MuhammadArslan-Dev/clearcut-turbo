import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// `defineCloudflareConfig()` with no `incrementalCache` resolves to
// OpenNext's "dummy" cache (@opennextjs/aws/overrides/incrementalCache/
// dummy.js) — every get/set throws IgnorableError, i.e. caching was fully
// disabled in production, not merely "in-memory" as a prior version of this
// comment claimed. `revalidate: 3600` on the blog's chapter/subject/year
// question fetches (some of which run 2-6MB — large Hindi/Sanskrit chapters
// especially, since Devanagari is ~3x heavier per character in UTF-8 than
// Latin) was therefore a silent no-op: every request re-fetched the backend
// fresh. R2 (not the default in-memory option, which doesn't survive a
// worker restart/redeploy anyway) has no problematic per-item size ceiling
// for responses this size — see docs/DEVELOPMENT_RULES.md §10 (2026-10-17
// entry) for the full investigation.
//
// Requires a `NEXT_INC_CACHE_R2_BUCKET` R2 bucket binding in wrangler.jsonc
// (added, but the bucket itself is not created/deployed by this change —
// see that file's comment).
//
// `queue` and `tagCache` also default to OpenNext's "dummy" implementations
// (@opennextjs/aws overrides/queue/dummy.js throws "Dummy queue is not
// implemented"; overrides/tagCache/dummy.js ignores every tag). With those,
// the question-bank pages' time-based ISR (`revalidate = 600`) would never
// regenerate on Cloudflare, and revalidatePath/revalidateTag (the
// /api/revalidate endpoint) would do nothing. Per the OpenNext Cloudflare
// caching guide (opennext.js.org/cloudflare/caching, "small site" setup,
// checked against the installed @opennextjs/cloudflare 1.20.6):
//  - queue: Durable Object queue — binding NEXT_CACHE_DO_QUEUE, class
//    DOQueueHandler (exported by the generated .open-next/worker.js)
//  - tagCache: D1 — binding NEXT_TAG_CACHE_D1; `opennextjs-cloudflare deploy`
//    creates its `revalidations` table (populate-cache step)
// Both bindings are declared in wrangler.jsonc; the D1 database must be
// created first — step-by-step in docs/BLOG_CACHE_DEPLOY.md.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
});
