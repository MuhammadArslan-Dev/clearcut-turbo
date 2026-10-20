import { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

// Site-wide pages only. Every exam's pages live in its own sitemaps
// (sitemaps/<exam>.xml + sitemaps/<exam>-questions.xml, listed in
// sitemaps/index.xml), so nothing is listed twice. No lastModified: the
// homepage has no genuine "last changed" date, and the old `new Date()`
// claimed it changed on every request.
// English only: /hi renders the same English home content and canonicalizes
// to it (see lib/seo/locale-alternates).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: BASE_URL || "/" }];
}
