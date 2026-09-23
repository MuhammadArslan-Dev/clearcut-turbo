"use client";

import { Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Top-of-Learn greeting + motivational quote. Desktop only — on mobile the
 * course card must stay the first thing on the page.
 */
export default function HomeGreeting() {
  const t = useTranslations("DashboardHome");
  const { user } = useAuth();

  const hour = new Date().getHours();
  const key = hour < 12 ? "greetingMorning" : hour < 17 ? "greetingAfternoon" : "greetingEvening";
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || t("defaultName");

  return (
    <div className="hidden items-center justify-between gap-4 md:flex">
      <div className="min-w-0">
        <h1 className="heading-large !font-semibold">
          {t(key, { name: firstName })} <span aria-hidden="true">👋</span>
        </h1>
        <p className="body-medium text-surface-gray-muted">{t("subtitle")}</p>
      </div>
      <div className="flex max-w-[340px] items-start gap-2 rounded-lg bg-[var(--color-primary-bg-soft)] p-3">
        <Quote size={18} className="mt-0.5 shrink-0 text-brand" />
        <p className="body-small italic text-surface-gray-muted">{t("quote")}</p>
      </div>
    </div>
  );
}
