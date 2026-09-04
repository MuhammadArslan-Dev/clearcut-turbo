import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "परीक्षा फ़ोटो के लिए इमेज कंप्रेसर - मुफ़्त टूल | Clear Cutoff";
const DESCRIPTION =
  "परीक्षा पोर्टल अपलोड के लिए पासपोर्ट फ़ोटो को सटीक KB सीमा में कंप्रेस करें। ऑप्टिमाइज़ करने से पहले ब्राइटनेस/कॉन्ट्रास्ट समायोजित करें और क्रॉप करें। न क्वालिटी का अंदाज़ा लगाना, न सर्वर पर अपलोड।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/resizer/image-compressor",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/image-compressor",
      hi: "https://clearcutoff.in/hi/tools/resizer/image-compressor",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/hi/tools/resizer/image-compressor",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="परीक्षा फ़ोटो के लिए इमेज कंप्रेसर"
      description="क्वालिटी सेटिंग का अंदाज़ा लगाए बिना अपनी फ़ोटो को परीक्षा पोर्टल की KB सीमा में लाएं। न्यूनतम/अधिकतम साइज़ सेट करें और टूल को सही संतुलन खोजने दें।"
      defaultPreset="photo"
      locale="hi"
    />
  );
}
