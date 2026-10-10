import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import AppDownloadPage from "@/components/pages/app-download/AppDownloadPage";
import AppDownloadFloatingButton from "@/components/sections/app-download/AppDownloadFloatingButton";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { toLocale, type Locale } from "@/lib/i18n/config";
import JsonLd from "@clearcut/ui/json-ld";

export const dynamic = "force-static";
export const revalidate = 3600;

const META_COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Clear Cutoff iOS App — TET Prep App for iPhone (Coming Soon)",
    description:
      "The Clear Cutoff iOS app for CTET, REET, HTET, UPTET and more TET exam preparation is launching soon — PYQs, video lectures, notes and progress tracking.",
  },
  hi: {
    title: "Clear Cutoff iOS ऐप — iPhone के लिए TET तैयारी ऐप (जल्द आ रहा है)",
    description:
      "CTET, REET, HTET, UPTET और अन्य TET परीक्षाओं की तैयारी के लिए Clear Cutoff iOS ऐप जल्द लॉन्च हो रहा है — PYQs, वीडियो लेक्चर, नोट्स और प्रोग्रेस ट्रैकिंग।",
  },
  mr: {
    title: "Clear Cutoff iOS अ‍ॅप — iPhone साठी TET तयारी अ‍ॅप (लवकरच)",
    description:
      "CTET, REET, HTET, UPTET आणि इतर TET परीक्षांच्या तयारीसाठी Clear Cutoff iOS अ‍ॅप लवकरच लाँच होत आहे — PYQs, व्हिडिओ लेक्चर्स, नोट्स आणि प्रगती ट्रॅकिंग.",
  },
};

const items = [
  { label: "features", href: "#app-showcase-section", id: "app-showcase-section" },
  { label: "faqs", href: "#app-download-faqs-section", id: "app-download-faqs-section" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = META_COPY[toLocale(locale)];
  return generateSeoMetadata({
    title: copy.title,
    description: copy.description,
    keywords: ["Clear Cutoff iOS app", "TET app iPhone", "CTET app", "REET app", "HTET app", "UPTET app"],
    url: "/ios-app",
    locale: toLocale(locale),
  });
}

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Clear Cutoff",
  operatingSystem: "iOS",
  applicationCategory: "EducationApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

export default async function IosAppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = toLocale(locale);

  return (
    <>
      <JsonLd data={softwareAppSchema} />
      <Header items={items} />
      <AppDownloadPage platform="ios" locale={resolvedLocale} />
      <AppDownloadFloatingButton platform="ios" locale={resolvedLocale} />
      <FooterWrap />
    </>
  );
}
