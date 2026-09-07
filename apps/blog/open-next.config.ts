import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

// R2 backs ISR/SSG output so revalidated pages survive worker restarts and
// redeploys (the in-memory default does not). `long-lived` matches this
// app's exam-content pages, which don't need sub-minute freshness.
// Requires the `NEXT_INC_CACHE_R2_BUCKET` binding in wrangler.jsonc and an
// R2 bucket created via `wrangler r2 bucket create`.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
});
