"use client";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { Link as I18nLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import SiteFooter from "@clearcut/ui/site-footer";
import type { AlternativeSummary } from "@/types/cms";

// alternatives is accepted (and FooterWrap still fetches it) but not yet
// wired into SiteFooter's extraLinks — same not-yet-shipped state the
// pre-shared-component version of this file had (its alternativesLinks
// block was commented out too). Kept as a prop so re-enabling it later is a
// one-line change here, not a data-fetching change in FooterWrap.
export default function Footer({ alternatives }: { alternatives?: AlternativeSummary[] }) {
  const isMobile = useIsMobile();
  const t = useTranslations("footer");

  return (
    <SiteFooter
      LinkComponent={I18nLink}
      copyrightText={`© ${new Date().getFullYear()} Clear Cutoff. ${t("rights")}`}
      phoneNumber="7210708599"
      phoneLabel={isMobile ? t("phone") : "7210708599"}
      whatsappNumber="917210708599"
      whatsappLabel={t("whatsapp")}
      policyLabel={t("privacy")}
      termsLabel={t("terms")}
      refundLabel={t("refund")}
      contactLabel={t("contact")}
      extraLinks={[
        { href: "/faq", label: t("faq") },
        // Absolute URL, deliberately not I18nLink's relative internal-route
        // form — /tools is a separate deployment (apps/tools), not a route
        // in this app, so it must render as a plain external-style link.
        // Also the only internal backlink from clearcutoff.in's main domain
        // into the age calculator, which otherwise has none at all.
        { href: "https://clearcutoff.in/tools/age-eligibility-calculator", label: t("ageCalculator") },
      ]}
    />
  );
}
