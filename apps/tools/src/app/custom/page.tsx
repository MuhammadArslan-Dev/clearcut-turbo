import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Custom Size Photo & Signature Resizer — Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Resize and compress a photo or signature to any dimensions and file size you need — enter width, height (px or cm), and a min/max KB target. Processed entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://clearcutoff.in/tools/resizer/custom" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/tools/resizer/custom",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      crumbLabel="Custom Size"
      heading="Custom Size Photo & Signature Resizer"
      description="Not on our exam list, or need a size neither preset covers? Set your own width, height, and file-size range — in px or cm."
      defaultPreset="custom"
    />
  );
}
