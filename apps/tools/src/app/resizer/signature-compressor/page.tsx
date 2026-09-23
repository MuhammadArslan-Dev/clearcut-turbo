import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Signature Compressor for Exams - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Compress a scanned or drawn signature to the exact KB range exam portals ask for, with a Signature Clean Up slider that whitens paper shadows and darkens faint ink. Processed entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/tools/resizer/signature-compressor",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/signature-compressor",
      hi: "https://clearcutoff.in/hi/tools/resizer/signature-compressor",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/tools/resizer/signature-compressor",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      heading="Signature Compressor for Exams"
      description="Draw a fresh signature or upload a scanned one, clean up shadows and faint strokes, then compress it to your exam's exact KB range."
      defaultPreset="draw"
    />
  );
}
