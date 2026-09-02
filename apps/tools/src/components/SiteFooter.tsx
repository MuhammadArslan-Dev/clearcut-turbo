import SiteFooter from "@clearcut/ui/site-footer";

// English-only, no locale routing in this app — LinkComponent omitted, so
// LinksList falls back to plain next/link (correct here, unlike an app with
// locale-prefixed routes).
export default function ToolsFooter() {
  return (
    <SiteFooter
      // This app is a standalone deployment (clearcutoff.in/tools/resizer/*)
      // — the policy/terms/refund/contact pages live on the main site, not
      // here, so those links must be absolute or they'd resolve under this
      // app's own basePath and 404.
      pageLinksBaseUrl="https://clearcutoff.in"
      copyrightText={`© ${new Date().getFullYear()} Clear Cutoff. All rights reserved!`}
      phoneNumber="7210708599"
      phoneLabel="7210708599"
      whatsappNumber="917210708599"
      whatsappLabel="WhatsApp"
      policyLabel="Policy"
      termsLabel="Terms & Conditions"
      refundLabel="Refund"
      contactLabel="Contact"
    />
  );
}
