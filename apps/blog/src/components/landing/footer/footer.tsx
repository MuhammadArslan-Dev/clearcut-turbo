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
      whatsappNumber="917210708599"
      whatsappLabel={t("contact.whatsapp")}
      policyLabel={t("links.policy")}
      termsLabel={t("links.terms")}
      refundLabel={t("links.refund")}
      contactLabel={t("links.contact")}
      extraLinks={[
        // Blog has no /faq or /tools route of its own — same reasoning as
        // landing's Tools link: these live on the main marketing site.
        { href: "https://clearcutoff.in/faq", label: t("faq") },
        { href: "https://clearcutoff.in/tools", label: t("tools") },
      ]}
    />
  );
}
