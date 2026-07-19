import React, { memo } from "react";
import { Card } from "@clearcut/ui/card";
import Image from "next/image";
import Badge from "../Badge";
import Paragraph from "@/components/shared/text-render/Paragraph";
import ContinueFreeButton from "../buttons/ContinueFreeButton";
import StarIcon from "@/components/icons/star-icon";
import Button from "@clearcut/ui/button";
import clsx from "clsx";
import { Exam } from "@/types/page";
import { Link } from "@clearcut/i18n/navigation";
import VerificationBadgeIcon from "@/components/icons/verification-badge-icon";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CARD_COPY: Record<Locale, {
  badge: string;
  stateFallback: string;
  ratingText: (rating?: string | number | null) => string;
  startFree: string;
  viewDetails: string;
}> = {
  en: {
    badge: "Course + test series",
    stateFallback: "Haryana",
    ratingText: (rating) => `(${rating} k+ rating)`,
    startFree: "Start for free",
    viewDetails: "View more details",
  },
  hi: {
    badge: "कोर्स + टेस्ट सीरीज़",
    stateFallback: "हरियाणा",
    ratingText: (rating) => `(${rating} k+ रेटिंग)`,
    startFree: "फ्री में शुरू करें",
    viewDetails: "और जानकारी देखें",
  },
};

interface Course {
  name: string;
  state: string;
  rating: string;
  ratingText: string;
  image: { src: string; alt: string };
}
interface BadgeDetails {
  text: string;
  bgColor: string;
  color: string;
}
type Props = {
  course?: Course;
  badge?: BadgeDetails;
  data?: Exam;
  viewDetailsClick?: () => void;
};

export default function CourseCard({ course, data, badge, viewDetailsClick, locale = defaultLocale }: Props & { locale?: Locale }) {
  const t = CARD_COPY[locale];
  return (
    <Card maxWidth="max-w-[370px]" padding="8px 12px" rounded="rounded-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-6">
          <div className="w-[104px] h-[104px] relative">
            <Image
              src={data?.logo_url ?? "/icons/Logo-48x48.png"}
              className="w-[104px] h-[104px] object-contain"
              alt={course?.image?.alt ?? "Logo"}
              width={104}
              height={104}
               priority
  unoptimized
            />
            <div className="absolute -bottom-1 right-0 rounded-full bg-white p-1">
              <VerificationBadgeIcon size={24} color="#0083ff" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <Badge
                className="text-center justify-center"
                maxWidth="max-w-[170px]"
                text={t.badge}
                bgColor={badge?.bgColor ?? "bg-text-green-subtle"}
                font="body-medium !font-semibold"
                color={badge?.color ?? "text-text-green-normal"}
                border="border-none"
              />
              <div>
                <Paragraph
                  as="h3"
                  textOptions={{ font: "heading-large !font-semibold" }}
                  text={{ text: data?.short_name ?? "HTET 2025" }}
                />
                <Paragraph
                  textOptions={{ font: "body-medium !font-normal" }}
                  text={{ text: data?.state ?? t.stateFallback }}
                />
              </div>
              <CourseRating ratingText={course?.ratingText ?? t.ratingText(data?.rating)} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ContinueFreeButton fullWidth size="md" showIcon={false} text={t.startFree} />
          <Link href={`/teaching/${data?.short_name.toLocaleLowerCase()}`} className="w-full" prefetch>
            <Button onClick={viewDetailsClick} fullWidth size="md" variant="outlined" rounded="50px" padding="7px 4px">
              {t.viewDetails}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export const CourseRating = memo(function CourseRating({
  ratingText,
  icon,
  iconGap = "gap-2",
  textGap = "gap-1",
  ratingTextClass,
  align = "items-center",
}: {
  align?: string;
  ratingText: React.ReactNode;
  ratingTextClass?: {
    color?: string;
    font?: string;
    alignMobile?: "left" | "center" | "right";
    alignDesktop?: "left" | "center" | "right";
  };
  iconGap?: string;
  textGap?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={clsx("flex w-full", align, iconGap)}>
      <div>{icon ?? <StarIcon />}</div>
      <div className={clsx("flex items-center", textGap)}>
        <Paragraph
          text={{ text: ratingText }}
          textOptions={{
            color: ratingTextClass?.color ?? "text-text-gray-normal",
            font: ratingTextClass?.font ?? "body-small !font-normal",
            alignMobile: ratingTextClass?.alignMobile,
            alignDesktop: ratingTextClass?.alignDesktop,
          }}
        />
      </div>
    </div>
  );
});

CourseRating.displayName = "CourseRating";
