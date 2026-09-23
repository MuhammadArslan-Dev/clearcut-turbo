import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ToolLandingPage from "@/components/ToolLandingPage";

const TITLE = "75% Face Coverage Photo Guide - Free Tool | Clear Cutoff";
const DESCRIPTION =
  "Some exam portals reject photos where the face is too small or off-center in the frame. Use the on-screen oval guide to position and zoom your photo so your face fills it, then resize and compress to your exam's spec.";

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/resizer/75-face-coverage",
  title: TITLE,
  description: DESCRIPTION,
});

export default function Page() {
  return (
    <ToolLandingPage
      path="/resizer/75-face-coverage"
      heading="75% Face Coverage Photo Guide"
      description="This is a positioning guide, not automated face detection. Drag and zoom in the adjust step until your head & shoulders fill the guide, matching what most portals mean by proper face coverage."
      defaultPreset="photo"
    />
  );
}
