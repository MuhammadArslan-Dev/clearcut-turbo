"use client";
import React, { memo } from "react";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import Paragraph from "@/components/shared/text-render/Paragraph";
import ContinueFreeButton from "../buttons/ContinueFreeButton";
import { useTranslations } from "next-intl";

export interface PricingPoint {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}

export interface PricingPlan {
  id: number | string;
  title: string;
  subtitle: string;
  price: number;
  priceNote: string;
  points: PricingPoint[];
  buttonText: string;
}

interface PricingCardProps extends PricingPlan {
  guaranteeBadge?: boolean;
}

export default function PricingCard({ title, subtitle, price, priceNote, points, buttonText, guaranteeBadge = false }: PricingCardProps) {
  const t = useTranslations("common");
  return (
    <Card  maxWidth="max-w-[390px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 px-2 text-center">
            <Text as="h3" variant="heading-xlarge" weight="semibold">{title}</Text>
          </div>
          <hr className="border-t border-[#CDD7E1] my-0" />
          <div className="bg-[#006bd1]/9 px-3 py-2 h-[72px] flex rounded-lg items-center justify-center gap-5">
            <Text as="p" variant="heading-2xlarge" weight="semibold" className="flex items-end">
              <span className="heading-xlarge mb-[1px] mr-1 !font-semibold">₹</span>
              {price}
            </Text>
            <Paragraph textOptions={{ font: "body-large" }} text={{ text: priceNote }} />
          </div>
          <div className="px-2 flex flex-col gap-2">
            {points.map((point, index) => (
              <PointCard key={index} icon={<CheckIconGreen />} title={point.title} description={point.description} />
            ))}
          </div>
          <hr className="border-t border-[#CDD7E1] my-0" />
        </div>
        <ContinueFreeButton text={t("startFree")} event={{ element_location: "pricing" }} />
      </div>
    </Card>
  );
}

const CheckIconGreen = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill="#00A251" />
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#00A251" />
    <path d="M11.3346 5.5L6.7513 10.0833L4.66797 8" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface PointCardProps extends PricingPoint {}
const PointCard = memo(function PointCard({ icon, title, description }: PointCardProps) {
  return (
    <div className="flex gap-4 items-start w-full">
      <div className="mt-2"><CheckIconGreen /></div>
      <div className="flex flex-col">
        <Text as="p" variant="body-large" weight="semibold" color="gray-normal">{title ?? ""}</Text>
        <Text as="p" variant="body-medium" className="text-text-gray-normal" color="gray-subtle">{description ?? ""}</Text>
      </div>
    </div>
  );
});
