# Blog ISR cache in Redis (phase 113)

**Problem (2026-11-14).** On the Coolify server the blog container (`academy.clearcutoff.in`, `next start`) kept every ISR page (HTML + RSC) on its own disk, `.next/server/app`, and never removed them: 13.3 GB after nine days (≈1.2 GB/day; hi 5.6 GB, en 5.4 GB), on a server that was 92 % full. Redeploying only resets it.

**Fix.** `apps/blog/cache-handler.mjs` (+ `cache-handler.impl.mjs`) is Next's `cacheHandler`: the ISR / data cache lives in Redis (brotli-compressed, one TTL per entry = 2 × the page's `revalidate`, max 7 days) instead of the disk. `next.config.ts` turns it on **only when `REDIS_URL` is set** (and sets `cacheMaxMemorySize: 0`); without it the blog behaves exactly as before, and the Cloudflare/OpenNext build is untouched.

## Coolify setup (once)
1. **Redis**: Project → New resource → Database → Redis (v7). Open it, set the *Custom start command* (or "Redis configuration") to
   `redis-server --maxmemory 1gb --maxmemory-policy volatile-lru --appendonly no --requirepass <password>`
   (`volatile-lru`: only entries with a TTL are evicted — the page entries; the small tag index is kept). Keep it on the same Docker network as the blog.
2. **Blog app → Environment variables**: `REDIS_URL=redis://default:<password>@<redis-internal-host>:6379` and tick **"Available at Buildtime"** — the config reads it at build AND at run time.
3. Redeploy the blog. Check the logs: no `[cache-handler] redis error` lines. In Redis: `redis-cli -a <password> dbsize` grows as pages are visited.

## Behaviour
- Keys are prefixed `blog:<BUILD_ID>:` — a new deploy never reads HTML written by the previous build (chunk hashes differ); old keys expire by TTL / eviction.
- Redis down or unreachable → the blog keeps serving and regenerating pages from a small in-process LRU (500 entries / 20 MB), logs `[cache-handler] redis error`, reconnects in the background. Never writes pages to disk.
- `revalidateTag` / `revalidatePath` (the backend's `/api/revalidate` after a question sync) go through the same handler (tag index in Redis).
- Rollback: delete `REDIS_URL` and redeploy.

## Why two files
Turbopack bundles whatever `cacheHandler` points to into the **Edge middleware** chunk; the Redis client / cache-handler library use `node:assert/strict`, which threw at load time in the Edge sandbox (every page returned 500 — reproduced). So `cache-handler.mjs` is a tiny proxy and the real implementation is loaded with a runtime `import()` the bundler ignores.

## Verified locally (2026-11-14, Next 16.3.4, Redis 5.0 on :6390, `next build --turbopack` + `next start`)
Pages 200; the page key appears in Redis (`blog:<BUILD_ID>:/hi/htet`, 63 KB compressed, TTL ≈ 2 h for `revalidate = 3600`); `.next/server/app` did not grow; stopped Redis → pages still 200 (fallback), errors logged, no crash; baseline without `REDIS_URL` unchanged (301/200). Not verified here: Redis 7 (production), multiple blog replicas, `/api/revalidate` end-to-end, a full day of real traffic (memory of the 1 GB cap).
