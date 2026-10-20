# Blog question cache: deploy steps

How question updates reach the blog (`apps/blog`) after a sync, and the one-time
Cloudflare + backend setup this needs. Written 2026-10-20 against
`@opennextjs/cloudflare` 1.20.6 / `@opennextjs/aws` 4.1.4 and the OpenNext
Cloudflare caching guide (https://opennext.js.org/cloudflare/caching).

**Status: verified locally only** (`next start` + local Laravel backend). It has
not been verified on Cloudflare yet. Don't treat production revalidation as
working until the check at the end of this file passes there.

## How it works

1. **Question sync** (`GET /api/v1/bigquery/syncQuestionsNew`) queues
   `SyncQuestionsNewJob`. It pulls rows from BigQuery and dispatches the
   1000-row chunks as **one `Bus::batch`**.
2. Each chunk (`SyncQuestionsJobNew`) **throws** when any record or
   200-record transaction failed. That fails the batch and cancels the rest.
   Records skipped for missing data are not failures.
3. **Only when every chunk succeeds**, the batch's `then()` calls
   `QuestionCacheService::invalidate($exams)`:
   - It bumps the `question_cache_version` cache key. Every question cache key
     includes the version (blog question/chapter/section/subject/index
     responses, and the dashboard's `section_chapters_*` topic counts), so all
     of them miss at once. **Nothing else in the cache store is touched.** The
     old `Cache::flush()` per chunk (and the route middleware flush) used to
     wipe OTPs, auth handoff codes and rate limits.
   - It then calls `POST {BLOG_REVALIDATE_URL}` with
     `Authorization: Bearer {BLOG_REVALIDATE_SECRET}` and `{"exams":["ctet"]}`.
     It retries twice and never throws. A failed call is logged, and the blog
     then catches up on its own ISR/data-cache timers (10 min / 1 h).
   - A failed batch invalidates and publishes nothing (logged as
     `sync_questions_new.batch_failed`).
4. The blog's `POST /api/revalidate` checks the secret (constant-time compare;
   the route refuses everything when the secret is unset or under 32 chars).
   It then runs `revalidateTag("qb:<exam>", { expire: 0 })`, and
   `revalidatePath(<pattern>, "page")` for the six ISR question-page routes. It
   also drops that instance's in-memory exam index and search-index copies.
   Exams the blog doesn't serve are ignored.

Manual trigger (same targeted invalidation, no sync needed):

```sh
# backend: invalidates backend caches AND notifies the blog
curl -X POST https://<backend>/api/v2/automation/question-cache/invalidate \
  -H "X-Api-Key: $AUTOMATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"exams":["ctet"]}'          # omit exams = every exam

# blog only
curl -X POST https://<blog-host>/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" -d '{"exams":["ctet"]}'
```

## Why Cloudflare needs extra resources

By default OpenNext's queue and tag cache are "dummy" implementations. The
dummy queue throws `Dummy queue is not implemented`, and the dummy tag cache
ignores every tag. On Cloudflare that means time-based ISR never regenerates,
and `revalidateTag`/`revalidatePath` do nothing. `apps/blog/open-next.config.ts`
now sets:

| Override | Binding (fixed name) | Resource |
|---|---|---|
| `incrementalCache: r2IncrementalCache` | `NEXT_INC_CACHE_R2_BUCKET` | R2 bucket `clearcut-blog-incremental-cache` |
| `queue: doQueue` | `NEXT_CACHE_DO_QUEUE` (class `DOQueueHandler`) | Durable Object, created by the `v1` migration on deploy |
| `tagCache: d1NextTagCache` | `NEXT_TAG_CACHE_D1` | D1 database `clearcut-blog-tag-cache`; its `revalidations` table is created by `opennextjs-cloudflare deploy` (populate-cache step) |

All three bindings are declared in `apps/blog/wrangler.jsonc`.

## One-time setup (in this order)

Run the `wrangler` commands from `apps/blog`, logged in to the Cloudflare
account that owns the `clearcut-blog` Worker.

1. **Deploy the backend first** (the blog's sitemaps and pages call its new
   endpoints). In the backend `.env`:
   ```
   BLOG_REVALIDATE_URL=https://<blog-host>/api/revalidate
   BLOG_REVALIDATE_SECRET=<random, 32+ chars, e.g. `openssl rand -hex 32`>
   ```
   Then run `php artisan config:cache` and restart the queue workers
   (`php artisan queue:restart`) so they load the new job code. The batch
   needs the existing `job_batches` table, which is already migrated.
2. **R2 bucket** (if it doesn't already exist):
   `npx wrangler r2 bucket create clearcut-blog-incremental-cache`
3. **D1 database:** `npx wrangler d1 create clearcut-blog-tag-cache`. Paste
   the printed `database_id` over `REPLACE_WITH_D1_DATABASE_ID` in
   `apps/blog/wrangler.jsonc`. The placeholder makes a deploy fail loudly
   until you do.
4. **Secret** (same value as the backend's `BLOG_REVALIDATE_SECRET`):
   `npx wrangler secret put REVALIDATE_SECRET`
   Also confirm `BACKEND_URL` is set on the Worker (Settings → Variables and
   Secrets).
5. **Build and deploy** with the OpenNext CLI, which also creates the D1 table
   and populates the R2 cache:
   ```sh
   npx opennextjs-cloudflare build
   npx opennextjs-cloudflare deploy
   ```
   `apps/blog/package.json` has no deploy script and this repo's real blog
   deploy path hasn't been traced (unlike `TOOLS_DEPLOY.md` for tools). If the
   blog deploys through Workers Builds or CI, add steps 2–4 there, and make
   sure the pipeline runs `opennextjs-cloudflare deploy`, not a bare
   `wrangler deploy` (which skips populate-cache and so the D1 table).

## Verify on production (required before calling it done)

1. Unauthenticated calls are refused: `curl -i -X POST https://<blog-host>/api/revalidate`
   should return `401`. A `503` means the secret isn't set.
2. Load a question page twice and note `x-nextjs-cache: HIT` and the content.
3. Call the manual backend endpoint above for that exam. Its JSON should show
   `"blog":{"notified":true,"status":200}`.
4. Reload the page: it should re-render (not `HIT` with old content), and an
   edited question should show its new text.
5. In D1: `npx wrangler d1 execute clearcut-blog-tag-cache --remote --command "SELECT * FROM revalidations ORDER BY revalidatedAt DESC LIMIT 5"`
   should list the `qb:<exam>` tag.

## Known limits

- In-memory copies (exam index, search index bodies) are per isolate/instance.
  Only the instance that receives the webhook drops them; the rest refresh
  within their TTL (1 h for the exam index, 10 min for search bodies).
- `/api/question-search` responses carry `Cache-Control: public, max-age=3600`,
  so a browser or CDN may keep an old search index for up to an hour.
- Backend reads over 2 MB are never in Next's data cache, so they aren't
  tagged. The `revalidatePath` calls cover the pages that use them.
- Other sync routes (`syncQuestions`, `syncContent`, …) still use the
  `flush.cache.after.sync` middleware (whole-store flush). Only
  `syncQuestionsNew` was moved to the targeted invalidation.
