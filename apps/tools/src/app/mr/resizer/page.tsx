import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = buildMetadata({
  locale: "mr",
  path: "/resizer",
  title: "मोफत फोटो आणि स्वाक्षरी रिसाइझर | Clear Cutoff",
  description: "CTET, HTET, UPTET आणि इतर परीक्षांच्या फॉर्मसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.",
  ogDescription: "परीक्षा फॉर्मसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, ब्राउझर-आधारित.",
});

export default function Page() {
  return <ResizeHubPage locale="mr" />;
}
