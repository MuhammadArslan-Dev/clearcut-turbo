import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default (in-memory) incremental cache — simplest to get live. ISR output
// doesn't survive a worker restart/redeploy with this, only that trade-off;
// nothing breaks. Upgrade to the R2-backed cache later if that matters.
export default defineCloudflareConfig();
