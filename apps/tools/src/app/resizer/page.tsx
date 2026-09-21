import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/resizer",
  title: "Free Photo & Signature Resizer for Exams | Clear Cutoff",
  description: "Resize and compress your photo or signature for CTET, HTET, UPTET and other exam forms. Free, private, and processed entirely in your browser.",
  ogDescription: "Resize and compress your photo or signature for exam forms. Free, private, browser-based.",
});

export default function Page() {
  return <ResizeHubPage />;
}
