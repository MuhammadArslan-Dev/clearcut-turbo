"use client";
import React from "react";
import ContinueFreeButton from "../buttons/ContinueFreeButton";
import CircleClockIcon from "@clearcut/ui/icons/circle-clock-icon";

export interface PricingFeature {
  icon: React.ReactNode;
  label: string;
}

export interface PricingCardProps {
  badgeText: string;
  priceNote: string;
  price: number;
  features: PricingFeature[];
  buttonText: string;
  trustText: string;
}

/**
 * The single pricing card — used both on the homepage's generic pricing
 * widget and on every per-exam page (there used to be two separate card
 * treatments: a plain one for the homepage grid and a title+points one for
 * SinglePricingSection's per-exam card). One visual design now, driven
 * entirely by props, so there's nothing left that varies by "single vs
 * multiple exams".
 */
export default function PricingCard({ badgeText, priceNote, price, features, buttonText, trustText }: PricingCardProps) {
  return (
    <div className="relative w-full max-w-[380px] rounded-3xl border border-[var(--color-border-gray-subtle)] bg-white shadow-[0_24px_48px_-20px_rgba(0,45,110,0.22)] px-6 pt-9 pb-6 flex flex-col items-center gap-6">
      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 body-small !font-semibold text-white shadow-sm whitespace-nowrap">
        <StarIcon />
        {badgeText}
      </span>

      <span className="grid place-items-center w-16 h-16 rounded-full bg-[var(--color-primary-subtle)]">
        <CrownIcon />
      </span>

      <div className="flex flex-col items-center gap-1">
        <span className="body-small !font-semibold tracking-wide uppercase text-text-gray-muted">{priceNote}</span>
        <div className="flex items-end">
          <span className="heading-large !font-bold mb-1 mr-1 text-text-gray-normal">₹</span>
          <span className="text-[44px] leading-none !font-bold text-text-gray-normal">{price}</span>
        </div>
      </div>

      <div className="w-full grid grid-cols-3 divide-x divide-[var(--color-border-gray-subtle)]">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-col items-center gap-2 px-2 text-center">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-brand)]">
              {feature.icon}
            </span>
            <span className="body-small text-text-gray-muted leading-tight">{feature.label}</span>
          </div>
        ))}
      </div>

      <ContinueFreeButton
        fullWidth
        size="lg"
        text={buttonText}
        event={{ element_location: "pricing" }}
        showShimmer
      />

      <div className="flex items-center gap-1.5 body-small text-text-gray-muted">
        <ShieldIcon />
        {trustText}
      </div>
    </div>
  );
}

export const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0.667 9.7 5.62l5.23.36-4.03 3.4 1.36 5.05L8 11.87l-4.26 2.61 1.36-5.05-4.03-3.4 5.23-.36L8 .667Z" fill="white" />
  </svg>
);

export const CrownIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 18h16l1.2-8.4a.6.6 0 0 0-.94-.58l-3.7 2.66-2.98-4.47a.6.6 0 0 0-1 0l-2.98 4.47-3.7-2.66a.6.6 0 0 0-.94.58L4 18Z"
      fill="var(--color-brand)"
    />
    <rect x="4" y="19.2" width="16" height="1.8" rx="0.9" fill="var(--color-brand)" />
  </svg>
);

export const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.333 13.333 3.5v3.833c0 3.51-2.276 6.53-5.333 7.334-3.057-.804-5.333-3.824-5.333-7.334V3.5L8 1.333Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path d="M5.833 8.167 7.333 9.667 10.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfinityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.5 5.333c-1.473 0-2.667 1.194-2.667 2.667S3.027 10.667 4.5 10.667c1.34 0 2.834-1.6 3.5-2.667.666 1.067 2.16 2.667 3.5 2.667 1.473 0 2.667-1.194 2.667-2.667S12.973 5.333 11.5 5.333c-1.34 0-2.834 1.6-3.5 2.667-.666-1.067-2.16-2.667-3.5-2.667Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockFeatureIcon = ({ color = "var(--color-brand)" }: { color?: string }) => <CircleClockIcon size={16} color={color} />;
