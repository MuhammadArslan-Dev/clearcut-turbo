"use client";

import React from "react";
import CrossIcon from "../icons/cross-icon";

// Building blocks of the approved login / OTP sheet design (phase 69), shared
// by LoginScreen and OTPScreen so the two steps (and every app that mounts
// the modal) can never drift apart.

/** Optimized WebP illustrations, cropped from the approved mockups at ~2x.
 * Each app serves them from its own public/images/auth/ (see `assetBase`). */
export type AuthIllustrationName = "study" | "image-lock" | "otp-phone";

// width/height are the intrinsic CSS size (the files are exactly 2x for sharp
// retina) and reserve the box; `heightClass` is the rendered height, written
// out in full so Tailwind can see it. Phone: grows with the free height of the
// screen (100dvh - 620px, i.e. what is left once the rest of the sheet is
// placed), between a small floor and a cap, so a tall phone is not left with a
// tiny picture and a blank screen while a 640px one still fits without
// scrolling. md+: the previous 12vh rule.
const ART: Record<
  AuthIllustrationName,
  { file: string; width: number; height: number; heightClass: string }
> = {
  study: {
    file: "auth-study.webp",
    width: 260,
    height: 115,
    heightClass: "h-[clamp(57px,calc(100dvh-620px),150px)] md:h-[clamp(57px,12vh,115px)]",
  },
  "image-lock": {
    file: "auth-image-lock.webp",
    width: 200,
    height: 105,
    heightClass: "h-[clamp(52px,calc(100dvh-620px),140px)] md:h-[clamp(52px,12vh,105px)]",
  },
  "otp-phone": {
    // File is 540x333 (1.8x a 300 px upscale of the mockup art, soft shapes only):
    // the OTP step has the least content, so on a phone its picture is the
    // biggest of the three and takes whatever height the rest leaves.
    file: "auth-otp-phone.webp",
    width: 270,
    height: 167,
    heightClass: "h-[clamp(64px,calc(30dvh-22px),215px)] md:h-[clamp(55px,12vh,111px)]",
  },
};

/** Fixed width/height + lazy loading: the reserved box means the picture
 * arriving never moves the text below it. The modal itself is code-split
 * (next/dynamic), so the picture is not part of any page's first load. */
export function AuthIllustration({
  name,
  assetBase = "",
}: {
  name: AuthIllustrationName;
  assetBase?: string;
}) {
  const art = ART[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${assetBase}/images/auth/${art.file}`}
      alt=""
      aria-hidden="true"
      width={art.width}
      height={art.height}
      loading="lazy"
      decoding="async"
      // Height follows the screen (see ART); object-contain keeps the picture
      // undistorted if a narrow phone has to shrink its width.
      className={`mx-auto w-auto max-w-full select-none object-contain [@media(max-height:600px)]:hidden ${art.heightClass}`}
    />
  );
}

export function AuthCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-gray-normal)] hover:bg-[var(--color-input-primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
    >
      <CrossIcon size={22} />
    </button>
  );
}

/** Tricolour flag + chevron + "+91" + divider (India only — the chevron is
 * decorative, the field never opens a country list). */
export function IndiaPhonePrefix() {
  return (
    <span className="flex items-center gap-1.5 pr-3 mr-1 border-r border-[var(--color-border-gray-subtle)]" aria-hidden="true">
      <svg width="26" height="18" viewBox="0 0 26 18" className="rounded-[3px] shrink-0">
        <rect width="26" height="6" fill="darkorange" />
        <rect y="6" width="26" height="6" fill="white" />
        <rect y="12" width="26" height="6" fill="green" />
        <circle cx="13" cy="9" r="2.3" fill="none" stroke="navy" strokeWidth="0.8" />
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[var(--color-text-gray-subtle)]">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="body-large !font-semibold text-[var(--color-text-gray-normal)]">+91</span>
    </span>
  );
}

const iconProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ArrowRightIcon = () => (
  <svg {...iconProps}><path d="M5 12h14M13 6l6 6-6 6" {...stroke} /></svg>
);
export const ArrowLeftIcon = () => (
  <svg {...iconProps}><path d="M19 12H5M11 6l-6 6 6 6" {...stroke} /></svg>
);
export const PencilIcon = () => (
  <svg {...iconProps} width={18} height={18}><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" {...stroke} /></svg>
);
export const KeyIcon = () => (
  <svg {...iconProps}><circle cx="8" cy="15" r="4" {...stroke} /><path d="M11 12l8-8M16 7l3 3M14 9l2 2" {...stroke} /></svg>
);
export const GiftIcon = () => (
  <svg {...iconProps}><rect x="3" y="8" width="18" height="5" rx="1" {...stroke} /><path d="M5 13v7h14v-7M12 8v12M12 8c-2.5 0-4-1-4-2.5S10 3 12 8zM12 8c2.5 0 4-1 4-2.5S14 3 12 8z" {...stroke} /></svg>
);
export const LockIcon = () => (
  <svg {...iconProps}><rect x="5" y="11" width="14" height="9" rx="2" {...stroke} /><path d="M8 11V8a4 4 0 018 0v3" {...stroke} /></svg>
);

/** Round tinted badge holding a feature icon + two-line label (tools modal). */
export function FeatureChip({
  icon,
  label,
}: {
  icon: "gift" | "lock";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-brand)]">
        {icon === "gift" ? <GiftIcon /> : <LockIcon />}
      </span>
      <span className="body-small !font-medium text-[var(--color-text-gray-normal)]">{label}</span>
    </div>
  );
}
