import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Signature Compressor for Exams - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Compress a scanned or drawn signature to the exact KB range exam portals ask for, with a Signature Clean Up slider that whitens paper shadows and darkens faint ink. Processed entirely in your browser.";

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/resizer/signature-compressor",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/signature-compressor"
      heading="Signature Compressor for Exams"
      description="Draw a fresh signature or upload a scanned one, clean up shadows and faint strokes, then compress it to your exam's exact KB range."
      defaultPreset="draw"
    />
  );
}
