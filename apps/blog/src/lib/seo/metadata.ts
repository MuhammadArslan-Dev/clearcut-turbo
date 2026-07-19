// src/lib/seo/metadata.ts
import { Metadata } from "next";

export async function generatePageMetadata({
  locale,
  path,
  fallbackTitle,
  fallbackDescription,
}: {
  locale: string;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
}): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/global-sections?locale=${locale}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    const baseTitle = data?.seoTitle || fallbackTitle;
    const baseDescription = data?.seoDescription || fallbackDescription;
    const title = `${baseTitle} | ClearCutoff`;

    return {
      title,
      description: baseDescription,
      openGraph: { title, description: baseDescription, type: "website" },
      alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/${path}` },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}
