"use client";

import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SiteFooter from "@clearcut/ui/site-footer";

export default function Footer() {
  const isMobile = useIsMobile();
  const t = useTranslations("footer");

  return (
    <SiteFooter
      // Previously missing entirely — LinksList silently fell back to plain
      // next/link, so every footer link ignored the /hi locale prefix.
      LinkComponent={Link}
      copyrightText={t("copyright", { year: new Date().getFullYear() })}
      phoneNumber="7210708599"
      phoneLabel={isMobile ? "Phone" : "7210708599"}
      emailAddress="hi@clearcutoff.in"
      emailLabel={isMobile ? "Email" : "hi@clearcutoff.in"}
      whatsappNumber="7210708599"
      whatsappLabel="Whatsapp"
      policyLabel={t("links.policy")}
      termsLabel={t("links.terms")}
      refundLabel={t("links.refund")}
      contactLabel={t("links.contact")}
    />
  );
}
