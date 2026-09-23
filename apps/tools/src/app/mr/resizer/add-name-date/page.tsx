import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";
import AddNameDateExtras from "@/components/AddNameDateExtras";

const TITLE = "फोटोमध्ये नाव आणि तारीख जोडा - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "तुमच्या पासपोर्ट फोटोखाली ब्लॉक अक्षरांत नाव आणि तारीख स्टॅम्प करा, SSC, Railways आणि इतर सरकारी परीक्षांसाठी आवश्यक फॉरमॅट. तात्काळ प्रीव्ह्यू, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/mr/tools/resizer/add-name-date",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/add-name-date",
      hi: "https://clearcutoff.in/hi/tools/resizer/add-name-date",
      mr: "https://clearcutoff.in/mr/tools/resizer/add-name-date",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/mr/tools/resizer/add-name-date",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="फोटोमध्ये नाव आणि तारीख जोडा"
      description="तुमचा फोटो अपलोड करा, नाव आणि तारीख टाका, आणि दोन्ही खाली प्रिंट करून तात्काळ डाउनलोड करा. कोणत्याही एडिटिंग सॉफ्टवेअरची गरज नाही."
      defaultPreset="signature"
      showModeTabs
      showPresetPicker={false}
      locale="mr"
    >
      <AddNameDateExtras locale="mr" />
    </ToolLandingPage>
  );
}
