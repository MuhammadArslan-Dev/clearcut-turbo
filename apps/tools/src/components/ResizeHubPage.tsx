import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ResizeImageTool from "./ResizeImageTool";
import BrowseByExam from "./BrowseByExam";
import MoreTools from "./MoreTools";
import { FadeIn } from "./motion";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UploadStepIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path
        d="M12 15V3m0 0L7 8m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadStepIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path
        d="M12 3v12m0 0l-5-5m5 5l5-5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HOW_IT_WORKS_STEPS = [
  {
    Icon: SelectIcon,
    title: "1. Choose your document type",
    description: "Pick Photo, Signature, or Custom — we automatically load the right dimensions and file size limit.",
  },
  {
    Icon: UploadStepIcon,
    title: "2. Upload & process",
    description: "Drop in your photo or signature. Resizing and compression happen instantly, right in your browser.",
  },
  {
    Icon: DownloadStepIcon,
    title: "3. Download",
    description: "Preview the optimized result and download it — your file never leaves your device.",
  },
];

function HowItWorks() {
  return (
    <div className="max-w-[880px] mx-auto text-center flex flex-col items-center gap-3 mt-16 md:mt-20">
      <h2 className="heading-large !font-bold text-text-gray-normal">How it works</h2>
      <p className="body-medium text-text-gray-muted mb-6">
        Get your exam documents ready in 3 simple steps. No technical skills required.
      </p>

      <div className="grid md:grid-cols-3 gap-8 w-full">
        {HOW_IT_WORKS_STEPS.map(({ Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand/8 flex items-center justify-center">
              <Icon />
            </div>
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {title}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {description}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hub — generic tool + copy, no exam context. Per-exam spokes: ResizerSpokePage. */
export default function ResizeHubPage() {
  return (
    <div>
      <SiteHeader />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-large md:!text-[40px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            Exam-Ready Photos &amp; Signatures in Seconds
          </h1>
          <p className="body-medium text-text-gray-muted">
            Resize and compress your photo or signature for CTET, HTET, UPTET and more —
            processed right in your browser, nothing is ever uploaded.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-[var(--color-success-strong)]">
              <CheckIcon /> 100% Free &amp; Private
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-[var(--color-success-strong)]">
              <LockIcon /> Privacy Certified
            </span>
          </div>
        </FadeIn>

        <ResizeImageTool />

        <HowItWorks />

        <MoreTools />

        <BrowseByExam />
      </div>

      <SiteFooter />
    </div>
  );
}
