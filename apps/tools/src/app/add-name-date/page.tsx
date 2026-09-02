import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "Add Name & Date to Photo Online — Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Stamp your name and date in block letters at the bottom of your passport photo — the format SSC, Railways, and other government exams require. Instant preview, processed entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://clearcutoff.in/tools/resizer/add-name-date" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://clearcutoff.in/tools/resizer/add-name-date",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <ToolLandingPage
      crumbLabel="Add Name & Date"
      heading="Add Name & Date to Photo Online"
      description="Upload your photo, enter your name and date, and download it instantly with both printed at the bottom — no editing software needed."
      defaultPreset="signature"
    />
  );
}
