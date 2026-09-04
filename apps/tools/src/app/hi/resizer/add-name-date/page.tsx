import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";
import AddNameDateExtras from "@/components/AddNameDateExtras";

const TITLE = "फ़ोटो में नाम और तारीख जोड़ें - मुफ़्त टूल | Clear Cutoff";
const DESCRIPTION =
  "अपनी पासपोर्ट फ़ोटो के नीचे ब्लॉक अक्षरों में नाम और तारीख स्टैम्प करें, SSC, Railways और अन्य सरकारी परीक्षाओं के लिए ज़रूरी फॉर्मेट। तुरंत प्रीव्यू, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/resizer/add-name-date",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/add-name-date",
      hi: "https://clearcutoff.in/hi/tools/resizer/add-name-date",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/hi/tools/resizer/add-name-date",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="फ़ोटो में नाम और तारीख जोड़ें"
      description="अपनी फ़ोटो अपलोड करें, नाम और तारीख दर्ज करें, और दोनों को नीचे प्रिंट करके तुरंत डाउनलोड करें। किसी एडिटिंग सॉफ़्टवेयर की ज़रूरत नहीं।"
      defaultPreset="signature"
      showModeTabs
      showPresetPicker={false}
      locale="hi"
    >
      <AddNameDateExtras locale="hi" />
    </ToolLandingPage>
  );
}
