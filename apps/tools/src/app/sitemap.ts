import type { MetadataRoute } from "next";
import { SITEMAP_SECTIONS, buildSitemap, isSitemapSection } from "@/lib/sitemap";

// One sitemap per section for this language: https://clearcutoff.in/tools/sitemap/<section>.xml
// Listed by the master index (../sitemap-index.xml/route.ts) — see lib/sitemap.ts
// for the architecture. output: "export" runs this once at build time.
export const dynamic = "force-static";

export async function generateSitemaps() {
  return SITEMAP_SECTIONS.map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  if (!isSitemapSection(id)) throw new Error(`Unknown sitemap section "${id}"`);
  return buildSitemap("en", id);
}
