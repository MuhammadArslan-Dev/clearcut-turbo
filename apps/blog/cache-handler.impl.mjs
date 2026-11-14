// IMPLEMENTATION of the Redis ISR cache (phase 113). Loaded at runtime by cache-handler.mjs (Node only).
//
// Why: a self-hosted `next start` writes every ISR page (HTML + RSC payload) to
// `.next/server/app` and never removes it. The blog serves tens of thousands of question pages
// in two languages, so on the Coolify server one container grew by ~1.2 GB a day (13 GB after nine
// days) until the disk was nearly full. With this handler the entries live in Redis, which has a
// hard memory limit and a TTL per entry, and survive redeploys.
//
// Switched on only when REDIS_URL is set at build AND run time (see next.config.ts) — without it the
// blog behaves exactly as before (and the Cloudflare/OpenNext build is untouched).
//
// Redis server settings this relies on (Coolify → Redis service → command):
//   redis-server --maxmemory 1gb --maxmemory-policy volatile-lru --appendonly no
// Every cache entry has a TTL (the page's revalidate time x2), so `volatile-lru` evicts only those;
// the small tag-index keys are never evicted.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CacheHandler } from "@fortedigital/nextjs-cache-handler";
import createLruHandler from "@fortedigital/nextjs-cache-handler/local-lru";
// NOTE: this file is loaded at runtime by cache-handler.mjs (never bundled for the Edge). Redis client, zlib and util are
// still imported inside onCreation so that a missing/unreachable Redis only affects the Node handler, not module load.

// Key prefix per build: HTML / RSC payloads reference that build's chunk hashes, so a new deploy must never read the
// entries the previous build wrote. Next writes the id to .next/BUILD_ID (distDir default).
function buildId() {
  try {
    return readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return process.env.SOURCE_COMMIT || process.env.NEXT_BUILD_ID || "nobuild";
  }
}
const KEY_PREFIX = `blog:${buildId().slice(0, 16)}:`;

CacheHandler.onCreation(async () => {
  // Small in-process fallback: used while Redis is unreachable, so the blog keeps serving (and
  // regenerating) pages instead of failing. Bounded — it never writes to disk.
  const lruHandler = createLruHandler({ maxItemsNumber: 500, maxItemSizeBytes: 20 * 1024 * 1024 });

  if (!process.env.REDIS_URL) {
    return { handlers: [lruHandler] };
  }

  const [{ createClient }, { default: createRedisHandler }, { promisify }, zlib] = await Promise.all([
    import("@redis/client"),
    import("@fortedigital/nextjs-cache-handler/redis-strings"),
    import("node:util"),
    import("node:zlib"),
  ]);
  const brotliCompressAsync = promisify(zlib.brotliCompress);
  const brotliDecompressAsync = promisify(zlib.brotliDecompress);

  // Pages are HTML / RSC text: brotli (quality 4 = cheap CPU) keeps Redis memory ~5-8x smaller.
  const valueSerializer = {
    async serialize(value) {
      const packed = await brotliCompressAsync(Buffer.from(JSON.stringify(value), "utf8"), {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
      });
      return packed.toString("base64");
    },
    async deserialize(stored) {
      const raw = await brotliDecompressAsync(Buffer.from(stored, "base64"));
      return JSON.parse(raw.toString("utf8"));
    },
  };

  const client = createClient({
    RESP: 2, // plain RESP2: works on every Redis version (no HELLO handshake)
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 5000,
      // Keep retrying in the background, never crash the server on a Redis outage.
      reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
    },
  });
  client.on("error", (error) => {
    console.error("[cache-handler] redis error:", error?.message ?? error);
  });

  try {
    await client.connect();
  } catch (error) {
    console.error("[cache-handler] redis unavailable at startup, using the in-process fallback:", error?.message ?? error);
    return { handlers: [lruHandler] };
  }

  const redisHandler = await createRedisHandler({
    client,
    keyPrefix: KEY_PREFIX,
    // Tag index keys share the prefix and are TTL-bound by the handler (no growing shared map).
    timeoutMs: 1000,
    valueSerializer,
  });

  return {
    // Redis first; the in-process LRU answers when Redis does not respond within timeoutMs.
    handlers: [redisHandler, lruHandler],
    ttl: {
      // Entry lives twice its revalidate time (stale-while-revalidate needs the stale copy), at most 7 days.
      defaultStaleAge: 60 * 60 * 24,
      estimateExpireAge: (staleAge) => Math.min(staleAge * 2, 60 * 60 * 24 * 7),
    },
  };
});

export default CacheHandler;
