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
      // Blog has no /privacy-policy, /terms-and-conditions, /refund-policy,
      // /contact-us, /faq or /tools routes of its own — each one is a single
      // path segment, so without a base URL they silently matched this app's
      // [examName] catch-all route and got redirect("/")'d to the homepage
      // (confirmed in dev: curl -L on any of the four returned the homepage,
      // not a 404). Same fix as apps/tools and apps/dashboard: point the
      // standard four at the marketing site that actually hosts them.
      pageLinksBaseUrl="https://clearcutoff.in"
      extraLinks={[
        { href: "https://clearcutoff.in/faq", label: t("faq") },
        // /tools alone 404s — apps/tools has no page at its basePath root,
        // only subroutes like /tools/resizer. Link to the actual flagship
        // tool, not the bare prefix.
        { href: "https://clearcutoff.in/tools/resizer", label: t("tools") },
      ]}
    />
  );
}
