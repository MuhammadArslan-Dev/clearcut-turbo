import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "परीक्षा फोटोसाठी इमेज कंप्रेसर - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "परीक्षा पोर्टल अपलोडसाठी पासपोर्ट फोटो अचूक KB मर्यादेत कंप्रेस करा. ऑप्टिमाइझ करण्यापूर्वी ब्राइटनेस/कॉन्ट्रास्ट अ‍ॅडजस्ट करा आणि क्रॉप करा. क्वालिटीचा अंदाज लावण्याची किंवा सर्व्हरवर अपलोड करण्याची गरज नाही.";

export const metadata: Metadata = buildMetadata({
  locale: "mr",
  path: "/resizer/image-compressor",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/image-compressor"
      heading="परीक्षा फोटोसाठी इमेज कंप्रेसर"
      description="क्वालिटी सेटिंगचा अंदाज न लावता तुमचा फोटो परीक्षा पोर्टलच्या KB मर्यादेत आणा. किमान/कमाल आकार सेट करा आणि टूलला योग्य संतुलन शोधू द्या."
      defaultPreset="photo"
      locale="mr"
    />
  );
}
