import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "परीक्षाओं के लिए सिग्नेचर कंप्रेसर - मुफ़्त टूल | Clear Cutoff";
const DESCRIPTION =
  "स्कैन किए गए या बनाए गए हस्ताक्षर को परीक्षा पोर्टल की सटीक KB सीमा में कंप्रेस करें, सिग्नेचर क्लीन अप स्लाइडर के साथ जो कागज़ की परछाई सफ़ेद करता है और हल्की स्याही गहरा करता है। पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/resizer/signature-compressor",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/signature-compressor",
      hi: "https://clearcutoff.in/hi/tools/resizer/signature-compressor",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/hi/tools/resizer/signature-compressor",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="परीक्षाओं के लिए सिग्नेचर कंप्रेसर"
      description="एक नया हस्ताक्षर बनाएं या स्कैन किया हुआ अपलोड करें, परछाई व हल्की स्याही साफ़ करें, फिर उसे अपनी परीक्षा की सटीक KB सीमा में कंप्रेस करें।"
      defaultPreset="draw"
      locale="hi"
    />
  );
}
