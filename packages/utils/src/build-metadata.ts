import type { Metadata } from "next";

type BuildMetadataOptions = {
  siteName: string;
  description: string;
  ogImage: string;
  url?: string;
  titleTemplate?: string;
};

export function buildMetadata({
  siteName,
  description,
  ogImage,
  url = "/",
  titleTemplate = `%s | ${siteName}`,
}: BuildMetadataOptions): Metadata {
  return {
    title: {
      default: siteName,
      template: titleTemplate,
    },
    description,
    icons: {
      icon: [
        { url: "/icons/Logo-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/Logo-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/icons/favicon.ico",
      apple: "/icons/Logo-48x48.png",
    },
    openGraph: {
      title: siteName,
      description,
      url,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteName} preview`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: [ogImage],
    },
  };
}
