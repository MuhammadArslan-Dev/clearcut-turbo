import { Metadata } from "next";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = {
  title: "मुफ़्त फ़ोटो और हस्ताक्षर रिसाइज़र | Clear Cutoff",
  description:
    "CTET, HTET, UPTET और अन्य परीक्षाओं के फ़ॉर्म के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।",
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/resizer",
    languages: {
      en: "https://clearcutoff.in/tools/resizer",
      hi: "https://clearcutoff.in/hi/tools/resizer",
    },
  },
  openGraph: {
    title: "मुफ़्त फ़ोटो और हस्ताक्षर रिसाइज़र | Clear Cutoff",
    description: "परीक्षा फ़ॉर्म के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, ब्राउज़र-आधारित।",
    url: "https://clearcutoff.in/hi/tools/resizer",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return <ResizeHubPage locale="hi" />;
}
