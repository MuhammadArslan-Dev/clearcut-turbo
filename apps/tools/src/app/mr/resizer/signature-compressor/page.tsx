import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "परीक्षांसाठी स्वाक्षरी कंप्रेसर - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "स्कॅन केलेली किंवा तयार केलेली स्वाक्षरी परीक्षा पोर्टलच्या अचूक KB मर्यादेत कंप्रेस करा, स्वाक्षरी क्लीनअप स्लायडरसह जो कागदाची सावली पांढरी करतो आणि हलकी शाई गडद करतो. पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.";

export const metadata: Metadata = buildMetadata({
  locale: "mr",
  path: "/resizer/signature-compressor",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/signature-compressor"
      heading="परीक्षांसाठी स्वाक्षरी कंप्रेसर"
      description="नवीन स्वाक्षरी तयार करा किंवा स्कॅन केलेली अपलोड करा, सावली आणि हलकी शाई साफ करा, नंतर तुमच्या परीक्षेच्या अचूक KB मर्यादेत कंप्रेस करा."
      defaultPreset="draw"
      locale="mr"
    />
  );
}
