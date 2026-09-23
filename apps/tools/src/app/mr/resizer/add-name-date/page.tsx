import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";
import AddNameDateExtras from "@/components/AddNameDateExtras";

const TITLE = "फोटोमध्ये नाव आणि तारीख जोडा - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "तुमच्या पासपोर्ट फोटोखाली ब्लॉक अक्षरांत नाव आणि तारीख स्टॅम्प करा, SSC, Railways आणि इतर सरकारी परीक्षांसाठी आवश्यक फॉरमॅट. तात्काळ प्रीव्ह्यू, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.";

export const metadata: Metadata = buildMetadata({
  locale: "mr",
  path: "/resizer/add-name-date",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/add-name-date"
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
