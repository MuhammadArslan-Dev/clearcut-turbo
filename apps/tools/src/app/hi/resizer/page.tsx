import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = buildMetadata({
  locale: "hi",
  path: "/resizer",
  title: "मुफ़्त फ़ोटो और हस्ताक्षर रिसाइज़र | Clear Cutoff",
  description: "CTET, HTET, UPTET और अन्य परीक्षाओं के फ़ॉर्म के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।",
  ogDescription: "परीक्षा फ़ॉर्म के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, ब्राउज़र-आधारित।",
});

export default function Page() {
  return <ResizeHubPage locale="hi" />;
}
