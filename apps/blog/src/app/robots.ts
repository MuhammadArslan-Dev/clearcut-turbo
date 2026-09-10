import { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    // sitemaps/index.xml lists every per-exam sitemap (built from
    // ALLOWED_EXAMS) — a new exam needs no change here, it just needs to be
    // added to ALLOWED_EXAMS. See sitemaps/index.xml/route.ts.
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/sitemaps/index.xml`],
  };
}
