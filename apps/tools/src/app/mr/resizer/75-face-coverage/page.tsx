import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "75% फेस कव्हरेज फोटो गाइड - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "काही परीक्षा पोर्टल फोटो नाकारतात जर चेहरा फ्रेममध्ये खूप लहान किंवा मध्यभागी नसेल. तुमचा फोटो पोझिशन आणि झूम करण्यासाठी ऑन-स्क्रीन ओव्हल गाइड वापरा जेणेकरून चेहरा तो भरेल, नंतर तुमच्या परीक्षेच्या स्पेसिफिकेशननुसार रिसाइझ आणि कंप्रेस करा.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/mr/tools/resizer/75-face-coverage",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/75-face-coverage",
      hi: "https://clearcutoff.in/hi/tools/resizer/75-face-coverage",
      mr: "https://clearcutoff.in/mr/tools/resizer/75-face-coverage",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/mr/tools/resizer/75-face-coverage",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="75% फेस कव्हरेज फोटो गाइड"
      description="ही एक पोझिशनिंग गाइड आहे, स्वयंचलित फेस डिटेक्शन नाही. अ‍ॅडजस्ट स्टेपमध्ये तुमचे डोके आणि खांदे गाइड भरेपर्यंत ड्रॅग आणि झूम करा, जे बहुतांश पोर्टल योग्य फेस कव्हरेज मानतात."
      defaultPreset="photo"
      locale="mr"
    />
  );
}
