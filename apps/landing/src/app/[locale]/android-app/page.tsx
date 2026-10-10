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
    title: "Clear Cutoff Android App — Download Free TET Prep App",
    description:
      "Download the free Clear Cutoff Android app for CTET, REET, HTET, UPTET and more TET exam preparation — PYQs, video lectures, notes and progress tracking.",
  },
  hi: {
    title: "Clear Cutoff एंड्रॉइड ऐप — फ्री TET तैयारी ऐप डाउनलोड करें",
    description:
      "CTET, REET, HTET, UPTET और अन्य TET परीक्षाओं की तैयारी के लिए फ्री Clear Cutoff एंड्रॉइड ऐप डाउनलोड करें — PYQs, वीडियो लेक्चर, नोट्स और प्रोग्रेस ट्रैकिंग।",
  },
  mr: {
    title: "Clear Cutoff अँड्रॉइड अ‍ॅप — मोफत TET तयारी अ‍ॅप डाउनलोड करा",
    description:
      "CTET, REET, HTET, UPTET आणि इतर TET परीक्षांच्या तयारीसाठी मोफत Clear Cutoff अँड्रॉइड अ‍ॅप डाउनलोड करा — PYQs, व्हिडिओ लेक्चर्स, नोट्स आणि प्रगती ट्रॅकिंग.",
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
    keywords: ["Clear Cutoff Android app", "TET app download", "CTET app", "REET app", "HTET app", "UPTET app"],
    url: "/android-app",
    locale: toLocale(locale),
  });
}

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Clear Cutoff",
  operatingSystem: "Android",
  applicationCategory: "EducationApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

export default async function AndroidAppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = toLocale(locale);

  return (
    <>
      <JsonLd data={softwareAppSchema} />
      <Header items={items} />
      <AppDownloadPage platform="android" locale={resolvedLocale} />
      <AppDownloadFloatingButton platform="android" locale={resolvedLocale} />
      <FooterWrap />
    </>
  );
}
