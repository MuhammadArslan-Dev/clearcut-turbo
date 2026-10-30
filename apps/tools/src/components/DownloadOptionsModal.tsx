"use client";

import { CustomBottomSheet, CustomModal } from "@clearcut/ui/modals-bottom-sheet";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import MainAppLogo from "@/components/icons/main-app-logo";

// The approved "Your image is ready!" sheet (phase 71, docs/screens/login-sheet/
// "Clear Cutoff Download Options"). Purely presentational and tool-agnostic: it
// shows two choices and reports which one was picked — useDownloadOptions owns
// the login, download and recording. Loaded with next/dynamic (ssr: false) the
// first time a visitor downloads, so no tool carries it in its first load.
// The shell is the shared modal / bottom sheet the blog's feature modals use
// (@clearcut/ui/modals-bottom-sheet): a centred modal on desktop, a bottom
// sheet on phones, with Escape, focus handling and the dialog role built in.

export interface DownloadOptionsCopy {
  title: string;
  subtitle: string;
  imageTitle: string;
  imageDesc: string;
  pdfTitle: string;
  pdfDesc: string;
  free: string;
  secure: string;
  close: string;
}

// Served under the app's basePath (/tools), like the login modal's art.
const ART_BASE = "/tools/images/download";

function ArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[var(--color-brand)]">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[var(--color-brand)]">
      <path d="M12 2.5l8 3v6c0 4.7-3.2 8.6-8 10-4.8-1.4-8-5.3-8-10v-6l8-3z" fill="currentColor" />
      <path d="M8.3 11.8l2.6 2.6 4.9-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[var(--color-brand)]">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.5" fill="white" />
    </svg>
  );
}

function OptionButton({
  art,
  title,
  description,
  tinted,
  onClick,
}: {
  art: string;
  title: string;
  description: string;
  tinted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] sm:gap-4 sm:px-4 ${
        tinted
          ? "border-[var(--color-primary-soft)] bg-[var(--color-input-primary-soft)] hover:bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border-gray-subtle)] bg-white hover:bg-[var(--color-input-primary-soft)]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ART_BASE}/${art}`}
        alt=""
        aria-hidden="true"
        width={70}
        height={70}
        loading="lazy"
        decoding="async"
        className="h-[60px] w-[60px] shrink-0 select-none sm:h-[70px] sm:w-[70px]"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="body-large !font-bold text-[var(--color-text-gray-normal)]">{title}</span>
        <span className="body-small !font-normal text-[var(--color-text-gray-subtle)]">{description}</span>
      </span>
      <ArrowIcon />
    </button>
  );
}

export default function DownloadOptionsModal({
  open,
  copy,
  onSelectImage,
  onSelectPdf,
  onClose,
}: {
  open: boolean;
  copy: DownloadOptionsCopy;
  onSelectImage: () => void;
  onSelectPdf: () => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const Container = isMobile ? CustomBottomSheet : CustomModal;

  return (
    <Container
      isOpen={open}
      onClose={onClose}
      accessible
      ariaLabel={copy.title}
      maxWidth={isMobile ? "max-w-full" : "max-w-[440px]"}
    >
      <div className="relative px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--color-text-gray-normal)] hover:bg-[var(--color-input-primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <CloseIcon />
        </button>

        <div className="flex flex-col items-center gap-2">
          <MainAppLogo width={130} />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${ART_BASE}/download-ready.webp`}
            alt=""
            aria-hidden="true"
            width={245}
            height={132}
            loading="lazy"
            decoding="async"
            className="h-[clamp(64px,calc(100dvh-520px),132px)] w-auto max-w-full select-none object-contain [@media(max-height:480px)]:hidden"
          />

          <div className="flex w-full flex-col items-center gap-1 text-center">
            <h2 className="heading-medium !font-bold text-[var(--color-text-gray-normal)]">
              {copy.title}
            </h2>
            <p className="body-medium !font-normal text-[var(--color-text-gray-subtle)]">{copy.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <OptionButton tinted art="option-image.webp" title={copy.imageTitle} description={copy.imageDesc} onClick={onSelectImage} />
          <OptionButton art="option-pdf.webp" title={copy.pdfTitle} description={copy.pdfDesc} onClick={onSelectPdf} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 border-t border-[var(--color-border-gray-subtle)] pt-4 sm:gap-10">
          <span className="flex items-center gap-2 body-medium !font-normal text-[var(--color-text-gray-subtle)]">
            <ShieldIcon />
            {copy.free}
          </span>
          <span className="flex items-center gap-2 body-medium !font-normal text-[var(--color-text-gray-subtle)]">
            <LockIcon />
            {copy.secure}
          </span>
        </div>
      </div>
    </Container>
  );
}
