import { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ResizeImagePage from "@/components/pages/ResizeImagePage";
import JsonLd from "@clearcut/ui/json-ld";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clearcutoff.in" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Photo & Signature Resizer",
      item: "https://clearcutoff.in/resize-image",
    },
  ],
};

export const metadata: Metadata = {
  title: "Free Photo & Signature Resizer for Exams | Clear Cutoff",
  description:
    "Resize and compress your photo or signature for CTET, HTET, UPTET and other exam forms — free, private, and processed entirely in your browser.",
  alternates: {
    canonical: "https://clearcutoff.in/resize-image",
  },
  openGraph: {
    title: "Free Photo & Signature Resizer for Exams | Clear Cutoff",
    description:
      "Resize and compress your photo or signature for exam forms — free, private, browser-based.",
    url: "https://clearcutoff.in/resize-image",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default async function ResizeImageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ResizeImagePage />
    </>
  );
}
