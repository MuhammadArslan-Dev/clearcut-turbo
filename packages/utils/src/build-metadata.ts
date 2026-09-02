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
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
      title: "ClearCutOff",
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
