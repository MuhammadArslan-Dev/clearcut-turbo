import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "परीक्षांसाठी स्वाक्षरी कंप्रेसर - मोफत टूल | Clear Cutoff";
const DESCRIPTION =
  "स्कॅन केलेली किंवा तयार केलेली स्वाक्षरी परीक्षा पोर्टलच्या अचूक KB मर्यादेत कंप्रेस करा, स्वाक्षरी क्लीनअप स्लायडरसह जो कागदाची सावली पांढरी करतो आणि हलकी शाई गडद करतो. पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/mr/tools/resizer/signature-compressor",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/signature-compressor",
      hi: "https://clearcutoff.in/hi/tools/resizer/signature-compressor",
      mr: "https://clearcutoff.in/mr/tools/resizer/signature-compressor",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/mr/tools/resizer/signature-compressor",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="परीक्षांसाठी स्वाक्षरी कंप्रेसर"
      description="नवीन स्वाक्षरी तयार करा किंवा स्कॅन केलेली अपलोड करा, सावली आणि हलकी शाई साफ करा, नंतर तुमच्या परीक्षेच्या अचूक KB मर्यादेत कंप्रेस करा."
      defaultPreset="draw"
      locale="mr"
    />
  );
}
