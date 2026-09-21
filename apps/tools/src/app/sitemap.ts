import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/sitemap";

// English sitemap: https://clearcutoff.in/tools/sitemap.xml. The Hindi and
// Marathi ones live in ./hi/sitemap.ts and ./mr/sitemap.ts (public URLs
// /hi/tools/sitemap.xml and /mr/tools/sitemap.xml) — see lib/sitemap.ts for
// why it is split. output: "export" (next.config.ts) makes this run once at
// build time.
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap("en");
}
