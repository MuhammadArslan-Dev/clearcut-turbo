import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Image Compressor for Exam Photos - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Compress a passport photo to an exact KB range for exam portal uploads. Adjust brightness/contrast and crop before optimizing. No quality guesswork, no server uploads.";

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/resizer/image-compressor",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/image-compressor"
      heading="Image Compressor for Exam Photos"
      description="Get your photo under an exam portal's KB limit without guessing quality settings. Set a min/max size and let the tool find the right balance."
      defaultPreset="photo"
    />
  );
}
