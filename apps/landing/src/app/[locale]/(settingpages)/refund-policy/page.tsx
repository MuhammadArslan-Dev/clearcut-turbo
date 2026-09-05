import Header from "@/components/layout/headers/Header";
import SectionBlock from "@/components/sectionblock";
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@clearcut/ui/json-ld";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clearcutoff.in" },
    { "@type": "ListItem", position: 2, name: "Refund Policy", item: "https://clearcutoff.in/refund-policy" },
  ],
};

const data = `<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">⁠You, as a User, will be eligible for the refund only in the case you're not receiving the services. Such an application/ refund request has to be communicated at </span><a href="mailto:hi@clearcutoff.in"><span style="font-weight: 400;">hi@clearcutoff.in</span></a><span style="font-weight: 400;">.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">The refund will be given in the original mode of payment.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">While availing any of the payment method/s available on the Platform, we will not be responsible to refund, whatsoever in respect of any loss or damage arising directly or indirectly to You due to:</span></li>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Lack of authorization for any transaction/s, or</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Exceeding the preset limit mutually agreed by you and between "Bank/s", or</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Any payment issues arising out of the transaction, or</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Decline of transaction for any other reason/s where Clearcutoff has not received your payment</span></li>
</ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">If you subscribe to any Services on a recurring subscription basis, we are authorized to charge the payment gateway fees for every subscription cycle. Your subscription cycle commences from the date of subscription and continues until it is expressly cancelled by you. Upon cancellation, you will retain access to the subscribed Services until the end of the current subscription cycle, at which point the subscription services will terminate.</span></li>

</ol>
<h6> Additional Refund Terms: </h6>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Refunds are processed within 7 days of approval.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">After the refund is initiated, it may take 3–5 business days to reflect in your bank account.</span></li>
</ol> `;

// SEO for this page
export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Clear Cutoff",
  description:
    "Read Clear Cutoff's refund and cancellation policy — including eligibility criteria, how to request a refund, processing timelines, and subscription terms.",
  keywords: [
    "refund policy",
    "cancellation policy",
    "Clear Cutoff",
    "subscription refund",
  ],
  alternates: {
    canonical: "https://clearcutoff.in/refund-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | Clear Cutoff",
    description:
      "Read Clear Cutoff's refund and cancellation policy — eligibility, processing timelines, and subscription terms.",
    url: "https://clearcutoff.in/refund-policy",
    siteName: "Clear Cutoff",
    type: "website",
    images: [
      {
        url: "https://www.clearcutoff.in/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clear Cutoff — Refund & Cancellation Policy",
      },
    ],
  },
};

export default async function ContactUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div>
      <JsonLd data={breadcrumbSchema} />
      <Suspense fallback={null}>
        <Header linkShow={false} />
        {/* content section  */}
        <SectionBlock
          padding="custom"
          margin="custom"
          className="px-6 md:px-[210px] py-[32px]"
        >
          <p className="heading-large !font-semibold text-text-gray-normal">
            {"Refund & Cancellation Policy"}
          </p>
          <div
            className=" body-medium font-normal custom"
            dangerouslySetInnerHTML={{ __html: data }}
          />
        </SectionBlock>
      </Suspense>
    </div>
  );
}
