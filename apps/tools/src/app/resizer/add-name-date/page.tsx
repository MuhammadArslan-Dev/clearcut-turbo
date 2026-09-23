import { Metadata } from "next";
import ToolLandingPage from "@/components/ToolLandingPage";
import AddNameDateExtras from "@/components/AddNameDateExtras";

const TITLE = "Add Name & Date to Photo Online - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Stamp your name and date in block letters at the bottom of your passport photo, the format SSC, Railways, and other government exams require. Instant preview, processed entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clearcutoff.in/tools/resizer/add-name-date",
    languages: {
      en: "https://clearcutoff.in/tools/resizer/add-name-date",
      hi: "https://clearcutoff.in/hi/tools/resizer/add-name-date",
    },
  },
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
      heading="Add Name & Date to Photo Online"
      description="Upload your photo, enter your name and date, and download it instantly with both printed at the bottom. No editing software needed."
      defaultPreset="signature"
      showModeTabs
      showPresetPicker={false}
    >
      <AddNameDateExtras />
    </ToolLandingPage>
  );
}
