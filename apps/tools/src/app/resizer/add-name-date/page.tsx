import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";
import AddNameDateExtras from "@/components/AddNameDateExtras";

const TITLE = "Add Name & Date to Photo Online - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Stamp your name and date in block letters at the bottom of your passport photo, the format SSC, Railways, and other government exams require. Instant preview, processed entirely in your browser.";

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/resizer/add-name-date",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/add-name-date"
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
