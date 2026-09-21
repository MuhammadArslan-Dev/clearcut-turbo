import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/sitemap";

// Public URL: https://clearcutoff.in/hi/tools/sitemap.xml (see lib/sitemap.ts).
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap("hi");
}
