import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "75% फेस कवरेज फ़ोटो गाइड - मुफ़्त टूल | Clear Cutoff";
const DESCRIPTION =
  "कुछ परीक्षा पोर्टल फ़ोटो को रिजेक्ट कर देते हैं अगर चेहरा फ्रेम में बहुत छोटा या बीच में न हो। अपनी फ़ोटो को पोज़िशन और ज़ूम करने के लिए ऑन-स्क्रीन ओवल गाइड का उपयोग करें ताकि चेहरा उसे भर दे, फिर अपनी परीक्षा के विनिर्देश अनुसार रिसाइज़ और कंप्रेस करें।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/resizer/75-face-coverage",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/75-face-coverage",
      hi: "https://clearcutoff.in/hi/tools/resizer/75-face-coverage",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/hi/tools/resizer/75-face-coverage",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="75% फेस कवरेज फ़ोटो गाइड"
      description="यह एक पोज़िशनिंग गाइड है, ऑटोमेटेड फेस डिटेक्शन नहीं। तब तक ड्रैग और ज़ूम करें जब तक एडजस्ट स्टेप में आपका सिर और कंधे गाइड को भर न दें, जो ज़्यादातर पोर्टल सही फेस कवरेज मानते हैं।"
      defaultPreset="photo"
      locale="hi"
    />
  );
}
