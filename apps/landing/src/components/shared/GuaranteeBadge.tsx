"use client";
import GuaranteeBadgeIcon from "../icons/guarantee-badge-icon";
import Text from "@clearcut/ui/text";
import { useAuthStore } from "@/lib/auth";
import { logAmplitudeEvent } from "@/services/analytics";
import Image from "next/image";
import { IMAGES } from "@/constants/images";
import clsx from "clsx";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

const BADGE_COPY: Record<Locale, { title: React.ReactNode; subtitle: string }> = {
  en: {
    title: <>Get a <span className="text-brand"> refund</span> if you don't pass the exam!</>,
    subtitle: "No risk, just results.",
  },
  hi: {
    title: <>परीक्षा पास न होने पर <span className="text-brand"> रिफंड</span> पाएं!</>,
    subtitle: "कोई जोखिम नहीं, सिर्फ परिणाम।",
  },
  mr: {
    title: <>परीक्षा उत्तीर्ण न झाल्यास <span className="text-brand"> रिफंड</span> मिळवा!</>,
    subtitle: "कोणताही धोका नाही, फक्त निकाल.",
  },
};

export default function GuaranteeBadge({ pY = "py-6" }: { pY?: string }) {
  const { goToLogin } = useAuthStore();
  const copy = BADGE_COPY[useLocale()];

  return (
    <div
      onClick={() => {
        logAmplitudeEvent("Authentication Initiated", {
          element_location: "100 percent guarantee",
          element_type: "banner",
        });
        goToLogin();
      }}
      className={clsx("flex flex-col md:flex-row items-center justify-center gap-5 px-1 md:p-4 cursor-pointer", pY)}
    >
      {/* guarantee-badge-img.webp is actually 499x499 (square) — the declared
          150x120 doesn't match, and Tailwind's preflight (img { height:
          auto }) means the browser already renders it at its real square
          ratio once loaded, just without reserving that space upfront.
          height=150 matches what's already visually rendered. */}
      <Image src={IMAGES.guaranteeBadge} alt=" money-back guarantee badge" width={150} height={150} className="aspect-square" />
      <div>
        <Text as="p" variant="heading-medium" weight="semibold" className="text-center">
          {copy.title}
        </Text>
        <Text as="p" variant="body-large" color="gray-muted" className="text-center">
          {copy.subtitle}
        </Text>
      </div>
    </div>
  );
}

export const GuaranteeBadgePrice = () => {
  const { goToLogin } = useAuthStore();
  const copy = BADGE_COPY[useLocale()];

  return (
    <div
      onClick={() => {
        logAmplitudeEvent("Authentication Initiated", {
          element_location: "100 percent guarantee",
          element_type: "banner",
        });
        goToLogin();
      }}
      className="flex items-center justify-left gap-2 px-1 cursor-pointer"
    >
      <GuaranteeBadgeIcon variant="green-badge" />
      <div>
        <Text as="p" variant="body-medium" weight="semibold" className="whitespace-nowrap">
          {copy.title}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted" className="text-left">
          {copy.subtitle}
        </Text>
      </div>
    </div>
  );
};
