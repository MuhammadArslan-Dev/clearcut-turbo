import { Metadata } from "next";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = {
  title: "मोफत फोटो आणि स्वाक्षरी रिसाइझर | Clear Cutoff",
  description:
    "CTET, HTET, UPTET आणि इतर परीक्षांच्या फॉर्मसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.",
  alternates: {
    canonical: "https://clearcutoff.in/mr/tools/resizer",
    languages: {
      en: "https://clearcutoff.in/tools/resizer",
      hi: "https://clearcutoff.in/hi/tools/resizer",
      mr: "https://clearcutoff.in/mr/tools/resizer",
    },
  },
  openGraph: {
    title: "मोफत फोटो आणि स्वाक्षरी रिसाइझर | Clear Cutoff",
    description: "परीक्षा फॉर्मसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, ब्राउझर-आधारित.",
    url: "https://clearcutoff.in/mr/tools/resizer",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return <ResizeHubPage locale="mr" />;
}
