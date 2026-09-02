import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Image Compressor for Exam Photos — Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Compress a passport photo to an exact KB range for exam portal uploads — adjust brightness/contrast and crop before optimizing. No quality guesswork, no server uploads.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://clearcutoff.in/tools/resizer/image-compressor" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/tools/resizer/image-compressor",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      crumbLabel="Image Compressor"
      heading="Image Compressor for Exam Photos"
      description="Get your photo under an exam portal's KB limit without guessing quality settings — set a min/max size and let the tool find the right balance."
      defaultPreset="photo"
    />
  );
}
