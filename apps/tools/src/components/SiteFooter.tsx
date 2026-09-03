import SiteFooter from "@clearcut/ui/site-footer";
import { getDict, Locale } from "@/lib/dictionary";

// LinkComponent omitted (no next-intl routing here — see dictionary.ts) so
// LinksList falls back to plain next/link, which is correct for the
// EN routes; Hindi pages don't link through this footer's own LinksList
// (the policy/terms/refund/contact pages below are absolute, main-site URLs
// regardless of locale).
export default function ToolsFooter({ locale = "en" }: { locale?: Locale }) {
  const t = getDict(locale).footer;
  return (
    <SiteFooter
      // This app is a standalone deployment (clearcutoff.in/tools/resizer/*)
      // — the policy/terms/refund/contact pages live on the main site, not
      // here, so those links must be absolute or they'd resolve under this
      // app's own basePath and 404.
      pageLinksBaseUrl="https://clearcutoff.in"
      copyrightText={t.copyright(new Date().getFullYear())}
      phoneNumber="7210708599"
      phoneLabel="7210708599"
      whatsappNumber="917210708599"
      whatsappLabel={t.whatsapp}
      policyLabel={t.policy}
      termsLabel={t.terms}
      refundLabel={t.refund}
      contactLabel={t.contact}
    />
  );
}
