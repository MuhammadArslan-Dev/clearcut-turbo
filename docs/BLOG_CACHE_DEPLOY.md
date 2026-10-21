# Blog question cache: deploy steps

How question updates reach the blog (`apps/blog`, served at
`https://academy.clearcutoff.in` by the `clearcut-blog` Worker) after a sync,
and what the Cloudflare + backend setup needs. Written 2026-10-20 against
`@opennextjs/cloudflare` 1.20.6 / `@opennextjs/aws` 4.1.4 and the OpenNext
Cloudflare caching guide (https://opennext.js.org/cloudflare/caching).

**Status:** verified locally (`next start` + local Laravel backend). **Not yet
verified on Cloudflare** — don't treat production revalidation as working
until the check at the end of this file passes there.

## How it works

1. **Question sync** (`GET /api/v1/bigquery/syncQuestionsNew`) queues
   `SyncQuestionsNewJob`, which pulls rows from BigQuery and dispatches the
   1000-row chunks as **one `Bus::batch`**.
2. Each chunk (`SyncQuestionsJobNew`) **throws** if any record or 200-record
   transaction failed, failing the batch (rest cancelled). Records skipped for
   missing data are not failures.
3. **Only when every chunk succeeded**, the batch's `then()` calls
   `QuestionCacheService::invalidate($exams)`:
   - bumps the `question_cache_version` cache key. Every question cache key
     includes it (blog question/chapter/section/subject/index responses and the
     dashboard's `section_chapters_*` topic counts), so they all miss at once —
     **nothing else in the cache store is touched** (the old per-chunk
     `Cache::flush()` wiped OTPs, auth handoff codes and rate limits);
   - `POST https://academy.clearcutoff.in/api/revalidate` with
     `Authorization: Bearer <revalidate secret>` and `{"exams":["ctet"]}` —
     retried twice, never throws; a failure is logged and the blog catches up
     on its own ISR/data-cache timers (10 min / 1 h).
   - A failed batch invalidates/publishes nothing (`sync_questions_new.batch_failed`).
4. The blog's `POST /api/revalidate` checks the secret (constant-time; refuses
   everything when it is shorter than 32 characters), then
   `revalidateTag("qb:<exam>", { expire: 0 })` and
   `revalidatePath(<pattern>, "page")` for the six ISR question-page routes,
   and drops that isolate's in-memory exam index / search index. Exams the blog
   doesn't serve are ignored.

### Shared keys (kept in code, by request)

| Key | Direction | Blog | Backend |
|---|---|---|---|
| Blog server key | blog → backend, `X-Blog-Server-Key` on `/api/blog/*` reads: own rate-limit bucket (`BLOG_SERVER_RATE_LIMIT`, default 1200/min) instead of the per-IP 60/min | `apps/blog/src/lib/api/blog-server-key.ts` (`server-only`) | `config/services.php` → `blog.server_key` |
| Revalidate secret | backend → blog, Bearer on `/api/revalidate` | same file | `config/services.php` → `blog.revalidate_secret` |

Both sides must hold the same values. An environment variable / Worker
secret of the same name (`BLOG_SERVER_KEY`, `REVALIDATE_SECRET` on the blog;
`BLOG_SERVER_KEY`, `BLOG_REVALIDATE_SECRET` on the backend) overrides the
in-code value — **to rotate a leaked key, set the new value on both sides**
(no code change needed). The backend's revalidate URL defaults to
`https://academy.clearcutoff.in/api/revalidate` (`BLOG_REVALIDATE_URL` overrides).

Manual trigger (same targeted invalidation, no sync needed):

```sh
curl -X POST https://<backend>/api/v2/automation/question-cache/invalidate \
  -H "X-Api-Key: $AUTOMATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"exams":["ctet"]}'          # omit exams = every exam
```

## Cloudflare resources

OpenNext's queue and tag cache default to "dummy" implementations (the dummy
queue throws `Dummy queue is not implemented`; the dummy tag cache ignores
every tag), so on Cloudflare time-based ISR would never regenerate and
`revalidateTag`/`revalidatePath` would do nothing. `apps/blog/open-next.config.ts`
sets:

| Override | Binding (fixed name) | Resource | State |
|---|---|---|---|
| `incrementalCache: r2IncrementalCache` | `NEXT_INC_CACHE_R2_BUCKET` | R2 bucket `clearcut-blog-incremental-cache` | created 2026-10-20 (public access off) |
| `queue: doQueue` | `NEXT_CACHE_DO_QUEUE` (class `DOQueueHandler`, exported by OpenNext's worker template) | Durable Object | created by the `v1` migration on deploy |
| `tagCache: d1NextTagCache` | `NEXT_TAG_CACHE_D1` | D1 `clearcut-blog-tag-cache` (`8e698f75-f2e9-47af-9516-83c535ab8038`) | created 2026-10-20; its `revalidations` table is created by `populateCache remote` |

Before this change the deployed Worker had only the `WORKER_SELF_REFERENCE`
binding (checked in the dashboard 2026-10-20).

## Deploy (GitHub Actions — `.github/workflows/deploy-blog-cloudflare.yml`)

Manual trigger (`workflow_dispatch`), environment `Production`. Steps:
`pnpm install` → `opennextjs-cloudflare build` → **`opennextjs-cloudflare
populateCache remote`** (new: uploads prerendered pages to R2 and creates the
D1 `revalidations` table; a bare `wrangler deploy` skips this) →
`wrangler deploy --var BACKEND_URL:…`.

**One-time, before the first run:** the `CLOUDFLARE_API_TOKEN` secret's token
("githube action") currently has only *Account → Workers Scripts*. Edit it in
Cloudflare → My Profile → API Tokens and add **Account → Workers R2 Storage:
Edit** and **Account → D1: Edit**; otherwise the populate step fails.

Order: **deploy the backend first** (the blog's sitemaps call its new
`/blog/question-index` shape, and the rate-limit bucket needs the backend
side). Then run the workflow.

## Verify on production (required before calling it done)

1. `curl -i -X POST https://academy.clearcutoff.in/api/revalidate` → `401`.
2. Load a question page twice; note `x-nextjs-cache: HIT` and the content.
3. Call the manual backend endpoint above for that exam; its JSON should show
   `"blog":{"notified":true,"status":200}`.
4. Reload the page: it re-renders (not `HIT` with old content); an edited
   question shows its new text.
5. `npx wrangler d1 execute clearcut-blog-tag-cache --remote --command "SELECT * FROM revalidations ORDER BY revalidatedAt DESC LIMIT 5"`
   lists the `qb:<exam>` tag.
6. `/hi` on a bilingual chapter: Hindi questions, self canonical, en/hi
   hreflang; `/sitemaps/ctet.xml` and `/sitemaps/htet.xml` list `/hi` pages
   only for bilingual pages, and every listed URL returns 200.

## Known limits

- In-memory copies (exam index, search index bodies) are per isolate; only the
  isolate that receives the webhook drops them, the rest refresh within their
  TTL (1 h exam index, 10 min search bodies).
- `/api/question-search` responses carry `Cache-Control: public, max-age=3600`,
  so a browser/CDN may keep an old search index for up to an hour.
- Backend reads over 2 MB are never in Next's data cache, so never tagged; the
  `revalidatePath` calls cover the pages that use them.
- Other sync routes (`syncQuestions`, `syncContent`, …) still use the
  `flush.cache.after.sync` middleware (whole-store flush); only
  `syncQuestionsNew` moved to the targeted invalidation. Sync endpoint
  authentication is unchanged.
- The two keys are in the repository: anyone with repo access can trigger
  revalidation or bypass the blog rate limit on `/api/blog/*` (public reads).
  Rotate via env/Worker secrets if needed.
