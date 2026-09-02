import { Metadata } from "next";
import ResizeHubPage from "@/components/ResizeHubPage";

export const metadata: Metadata = {
  title: "Free Photo & Signature Resizer for Exams | Clear Cutoff",
  description:
    "Resize and compress your photo or signature for CTET, HTET, UPTET and other exam forms — free, private, and processed entirely in your browser.",
  alternates: {
    canonical: "https://clearcutoff.in/tools/resizer",
  },
  openGraph: {
    title: "Free Photo & Signature Resizer for Exams | Clear Cutoff",
    description: "Resize and compress your photo or signature for exam forms — free, private, browser-based.",
    url: "https://clearcutoff.in/tools/resizer",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return <ResizeHubPage />;
}
